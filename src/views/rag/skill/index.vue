<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { parse, stringify } from 'yaml';
import {
  fetchCreateSkill,
  createSkillDesignTask,
  fetchSkillDesignTask,
  fetchDatasources,
  fetchDeleteSkill,
  fetchParseSkillYaml,
  fetchRunSkillTest,
  trialSkillDesignTask,
  fetchSkillDetail,
  fetchSkills,
  fetchToolSchema,
  fetchTools,
  fetchUpdateSkill,
  fetchValidateSkill
} from '@/service/api/rag';
import { $t } from '@/locales';
import ConfigHelp from '../shared/config-help.vue';
import ConfigCodeEditor from '../shared/config-code-editor.vue';
import OutputSchemaNodeEditor from '../shared/output-schema-node-editor.vue';

defineOptions({ name: 'RagSkill' });

type StepType = 'rag' | 'nl2sql' | 'api' | 'builtin' | 'llm' | 'foreach' | 'transform';
type ParamRow = {
  key: string;
  value: string;
  mode: 'literal' | 'binding';
  source: string;
  path: string;
  cardinality: 'one' | 'many';
  onEmpty: 'fail' | 'skip' | 'default';
  onMultiple: 'fail' | 'first';
  maxItems: number;
  overflow: 'fail' | 'truncate';
};
type ApiParameterSchema = {
  type?: string;
  description?: string;
  enum?: unknown[];
  default?: unknown;
  minimum?: number;
  maximum?: number;
  items?: Record<string, unknown>;
};
type SkillInputField = {
  key: string;
  type: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  defaultValue: string;
};
type SkillRunInputField = SkillInputField & {
  value: string | number | boolean | null | undefined;
};
type OutputSchemaMode = 'form' | 'json';
type StepConfigMode = 'form' | 'json';
type StepStatusTag = {
  key: string;
  label: string;
  type: 'success' | 'warning' | 'danger' | 'info';
};
type OutputSchemaField = {
  key: string;
  name: string;
  type: string;
  description: string;
  required: boolean;
  enumValues: string[];
  format: string;
  pattern: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  minItems?: number;
  maxItems?: number;
  uniqueItems: boolean;
  additionalProperties?: boolean;
  properties: OutputSchemaField[];
  items?: OutputSchemaField;
};
type OutputSchemaForm = {
  enabled: boolean;
  rootType: string;
  title: string;
  description: string;
  includeDraft7: boolean;
  additionalProperties?: boolean;
  arrayItemType: string;
  arrayItem: OutputSchemaField;
  minItems?: number;
  maxItems?: number;
  uniqueItems: boolean;
  fields: OutputSchemaField[];
};
type BuiltinArgumentSpec = {
  key: string;
  type: 'string' | 'number' | 'integer' | 'boolean' | 'select';
  required?: boolean;
  options?: string[];
  placeholder?: string;
};
type ForeachForm = {
  items: string;
  itemPath: string;
  maxItems: number;
  maxAttempts: number;
  continueOnError: boolean;
  bodyType: 'api' | 'builtin';
  toolCode: string;
  params: ParamRow[];
  arguments: ParamRow[];
  preserved: Record<string, any>;
};
type TransformOperationForm = {
  key: string;
  op: string;
  path: string;
  detailsJson: string;
};
type TransformForm = {
  inputs: ParamRow[];
  operations: TransformOperationForm[];
  preserved: Record<string, any>;
  outputSchemaMode: OutputSchemaMode;
  outputSchemaForm: OutputSchemaForm;
  outputSchema: string;
};
type SkillTemplateKey = 'rag_answer' | 'data_query' | 'api_action' | 'data_transform_action' | 'batch_action';
type TemplatePromptKey =
  | 'rag.skill.templateContent.ragPrompt'
  | 'rag.skill.templateContent.dataPrompt'
  | 'rag.skill.templateContent.toolPrompt'
  | 'rag.skill.templateContent.actionPrompt'
  | 'rag.skill.templateContent.batchPrompt';
type SkillStepForm = {
  uid: string;
  id: string;
  dependencyId: string;
  type: StepType;
  description: string;
  dependsOn: string[];
  ragQuery: string;
  datasourceCode: string;
  queryHint: string;
  toolCode: string;
  promptTemplate: string;
  temperature: number;
  params: ParamRow[];
  arguments: ParamRow[];
  rawConfig: string;
  advancedConfigMode: StepConfigMode;
  foreachForm: ForeachForm;
  transformForm: TransformForm;
  outputSchema: string;
  outputSchemaMode: OutputSchemaMode;
  outputSchemaForm: OutputSchemaForm;
};

const router = useRouter();
const t = $t;
const templatePrompt = (key: TemplatePromptKey, stepId: string) => t(key, { output: `{{${stepId}}}` });
const list = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const size = ref(20);
const loading = ref(false);
const keyword = ref('');
const firstUseGuideVisible = ref(false);
const dialogVisible = ref(false);
const form = ref<any>({});
const steps = ref<SkillStepForm[]>([]);
const isEdit = ref(false);
const activeTab = ref('basic');
const yamlContent = ref('');
const yamlDirty = ref(false);
const validateResult = ref<any>(null);
const saving = ref(false);
const datasources = ref<any[]>([]);
const tools = ref<any[]>([]);
const toolSchemas = ref<Record<string, Record<string, any>>>({});
const toolSchemaLoading = ref<Record<string, boolean>>({});
const aiDialogVisible = ref(false);
const aiForm = ref({ name: '', code: '', description: '', trialQuery: '' });
const aiTask = ref<any>(null);
const aiGenerating = ref(false);
const currentDesignTaskId = ref<string | null>(null);
const runDialogVisible = ref(false);
const runQuery = ref('');
const runResult = ref<any>(null);
const runLoading = ref(false);
const runTargetSkill = ref<any>(null);
const runExecuteActions = ref(false);
const runInputFields = ref<SkillRunInputField[]>([]);
const selectedTemplate = ref<SkillTemplateKey>('rag_answer');
let stepUid = 0;
let outputSchemaFieldUid = 0;
let transformOperationUid = 0;
const skillTemplates = computed(
  () =>
    [
      {
        key: 'rag_answer',
        name: t('rag.skill.templateRagName'),
        description: t('rag.skill.templateRagDescription'),
      },
      {
        key: 'data_query',
        name: t('rag.skill.templateDataName'),
        description: t('rag.skill.templateDataDescription'),
      },
      {
        key: 'api_action',
        name: t('rag.skill.templateToolName'),
        description: t('rag.skill.templateToolDescription'),
      },
      {
        key: 'data_transform_action',
        name: t('rag.skill.templateTransformName'),
        description: t('rag.skill.templateTransformDescription'),
      },
      {
        key: 'batch_action',
        name: t('rag.skill.templateBatchName'),
        description: t('rag.skill.templateBatchDescription'),
      }
    ] as const
);
const skillHelpExamples = {
  params: JSON.stringify(
    {
      orderNo: {
        source: 'query_orders',
        path: '$[0].orderNo',
        cardinality: 'one',
        on_empty: 'fail',
        on_multiple: 'fail'
      },
      evidenceIds: {
        source: 'query_orders',
        path: '$[*].evidenceId',
        cardinality: 'many',
        on_empty: 'default',
        default: [],
        max_items: 20,
        overflow: 'truncate'
      },
      channel: 'agent_chat'
    },
    null,
    2
  ),
  prompt: '根据规则 {{policy}} 和记录 {{query_record}} 输出结论、依据与待确认事项。',
  foreach: JSON.stringify(
    {
      items: '{{query_orders}}',
      item_path: 'records',
      max_items: 50,
      max_attempts: 1,
      continue_on_error: true,
      body: {
        type: 'api',
        config: {
          tool_code: 'create_follow_up_task',
          params: {
            orderNo: '{{item.orderNo}}',
            reason: '{{item.reason}}',
            sequence: '{{index}}'
          }
        }
      }
    },
    null,
    2
  ),
  transform: JSON.stringify(
    {
      inputs: {
        orders: {
          source: 'query_orders',
          path: '$',
          cardinality: 'many',
          on_empty: 'fail',
          max_items: 200,
          overflow: 'fail'
        }
      },
      operations: [
        { op: 'select', path: '$.orders' },
        { op: 'filter', path: '$.status', operator: 'equals', value: 'paid' },
        { op: 'project', fields: { orderNo: '$.orderNo', refundAmount: '$.paidAmount', reason: '客户申请退款' } },
        { op: 'slice', offset: 0, limit: 20 }
      ],
      output_schema: {
        type: 'array',
        maxItems: 20,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['orderNo', 'refundAmount', 'reason'],
          properties: {
            orderNo: { type: 'string' },
            refundAmount: { type: 'number', minimum: 0.01 },
            reason: { type: 'string', minLength: 2, maxLength: 200 }
          }
        }
      }
    },
    null,
    2
  )
};
const outputSchemaExample = JSON.stringify(
  {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'RefundDecision',
    type: 'object',
    additionalProperties: false,
    required: ['orderNo', 'refundReason', 'refundAmount', 'priority'],
    properties: {
      orderNo: {
        type: 'string',
        description: '业务订单号',
        pattern: '^SO[0-9]{12}$'
      },
      refundReason: {
        type: 'string',
        description: '面向审批人员的退款原因',
        minLength: 5,
        maxLength: 200
      },
      refundAmount: {
        type: 'number',
        description: '退款金额，单位元',
        minimum: 0.01,
        maximum: 50000,
        multipleOf: 0.01
      },
      priority: {
        type: 'string',
        description: '处理优先级',
        enum: ['normal', 'urgent']
      },
      evidence: {
        type: 'array',
        description: '最多五条证据编号',
        items: { type: 'string' },
        maxItems: 5
      },
      requestedAt: {
        type: 'string',
        description: '申请时间，ISO 8601 格式',
        format: 'date-time'
      }
    }
  },
  null,
  2
);
const outputSchemaParameters = computed(() => [
  {
    name: '$schema',
    description: $t('rag.skill.help.outputSchemaFields.schema'),
    example: 'http://json-schema.org/draft-07/schema#'
  },
  {
    name: 'title / description',
    description: $t('rag.skill.help.outputSchemaFields.metadata'),
    example: 'RefundDecision'
  },
  { name: 'type', description: $t('rag.skill.help.outputSchemaFields.type'), example: 'object', required: true },
  {
    name: 'properties',
    description: $t('rag.skill.help.outputSchemaFields.properties'),
    example: '{"orderNo":{"type":"string"}}'
  },
  {
    name: 'required',
    description: $t('rag.skill.help.outputSchemaFields.required'),
    example: '["orderNo","refundAmount"]'
  },
  {
    name: 'additionalProperties',
    description: $t('rag.skill.help.outputSchemaFields.additionalProperties'),
    example: 'false'
  },
  {
    name: 'enum / const',
    description: $t('rag.skill.help.outputSchemaFields.enumConst'),
    example: '["normal","urgent"]'
  },
  {
    name: 'format / pattern',
    description: $t('rag.skill.help.outputSchemaFields.formatPattern'),
    example: 'date-time / ^SO[0-9]{12}$'
  },
  {
    name: 'minLength / maxLength',
    description: $t('rag.skill.help.outputSchemaFields.stringRange'),
    example: '5 / 200'
  },
  {
    name: 'minimum / maximum / multipleOf',
    description: $t('rag.skill.help.outputSchemaFields.numberRange'),
    example: '0.01 / 50000 / 0.01'
  },
  {
    name: 'items / minItems / maxItems / uniqueItems',
    description: $t('rag.skill.help.outputSchemaFields.arrayRules'),
    example: '{"type":"string"} / 1 / 5 / true'
  }
]);
const outputSchemaRules = computed(() => [
  $t('rag.skill.help.outputSchemaRules.primaryData'),
  $t('rag.skill.help.outputSchemaRules.requiredProperties'),
  $t('rag.skill.help.outputSchemaRules.defaultValue'),
  $t('rag.skill.help.outputSchemaRules.stableNames'),
  $t('rag.skill.help.outputSchemaRules.validJson')
]);
const apiBindingParameters = computed(() => [
  {
    name: $t('rag.skill.paramName'),
    description: $t('rag.skill.help.bindingFields.paramName'),
    example: 'orderNo',
    required: true
  },
  {
    name: $t('rag.skill.paramLiteral'),
    description: $t('rag.skill.help.bindingFields.literal'),
    example: 'agent_chat'
  },
  { name: 'source', description: $t('rag.skill.help.bindingFields.source'), example: 'query_orders', required: true },
  { name: 'path', description: $t('rag.skill.help.bindingFields.path'), example: '$[0].orderNo' },
  { name: 'cardinality', description: $t('rag.skill.help.bindingFields.cardinality'), example: 'one | many' },
  { name: 'on_empty', description: $t('rag.skill.help.bindingFields.onEmpty'), example: 'fail | skip | default' },
  { name: 'default', description: $t('rag.skill.help.bindingFields.defaultValue'), example: '[]' },
  { name: 'on_multiple', description: $t('rag.skill.help.bindingFields.onMultiple'), example: 'fail | first' },
  { name: 'max_items', description: $t('rag.skill.help.bindingFields.maxItems'), example: '20' },
  { name: 'overflow', description: $t('rag.skill.help.bindingFields.overflow'), example: 'fail | truncate' }
]);
const foreachParameters = computed(() => [
  { name: 'items', description: $t('rag.skill.help.foreachFields.items'), example: '{{query_orders}}', required: true },
  { name: 'item_path', description: $t('rag.skill.help.foreachFields.itemPath'), example: 'records' },
  { name: 'max_items', description: $t('rag.skill.help.foreachFields.maxItems'), example: '50' },
  { name: 'max_attempts', description: $t('rag.skill.help.foreachFields.maxAttempts'), example: '1' },
  { name: 'continue_on_error', description: $t('rag.skill.help.foreachFields.continueOnError'), example: 'true' },
  {
    name: 'body.type',
    description: $t('rag.skill.help.foreachFields.bodyType'),
    example: 'api | builtin',
    required: true
  },
  {
    name: 'body.config.tool_code',
    description: $t('rag.skill.help.foreachFields.toolCode'),
    example: 'create_follow_up_task',
    required: true
  },
  {
    name: 'body.config.params / arguments',
    description: $t('rag.skill.help.foreachFields.bodyParams'),
    example: '{{item.orderNo}} / {{index}}'
  },
  { name: 'output_schema', description: $t('rag.skill.help.foreachFields.outputSchema'), example: '{"type":"object"}' }
]);
const transformParameters = computed(() => [
  {
    name: 'inputs / input',
    description: $t('rag.skill.help.transformFields.inputs'),
    example: 'orders -> query_orders / $ / many',
    required: true
  },
  {
    name: 'source / path',
    description: $t('rag.skill.help.transformFields.sourcePath'),
    example: 'query_orders / $[*]'
  },
  {
    name: 'cardinality / failure policies',
    description: $t('rag.skill.help.transformFields.bindingPolicies'),
    example: 'many / fail / 200 / fail'
  },
  {
    name: 'operations',
    description: $t('rag.skill.help.transformFields.operations'),
    example: '[{"op":"select","path":"$.orders"}]',
    required: true
  },
  { name: 'op', description: $t('rag.skill.help.transformFields.op'), example: 'filter | project | aggregate' },
  {
    name: 'path / fields / value',
    description: $t('rag.skill.help.transformFields.operationFields'),
    example: '$.status / {"orderNo":"$.orderNo"} / paid'
  },
  {
    name: 'output_schema',
    description: $t('rag.skill.help.transformFields.outputSchema'),
    example: '{"type":"array","items":{"type":"object"}}'
  }
]);
const transformOperationOptions = [
  { value: 'select', label: 'rag.skill.transformOperations.select' },
  { value: 'filter', label: 'rag.skill.transformOperations.filter' },
  { value: 'project', label: 'rag.skill.transformOperations.project' },
  { value: 'rename', label: 'rag.skill.transformOperations.rename' },
  { value: 'distinct', label: 'rag.skill.transformOperations.distinct' },
  { value: 'sort', label: 'rag.skill.transformOperations.sort' },
  { value: 'slice', label: 'rag.skill.transformOperations.slice' },
  { value: 'limit', label: 'rag.skill.transformOperations.limit' },
  { value: 'aggregate', label: 'rag.skill.transformOperations.aggregate' },
  { value: 'object', label: 'rag.skill.transformOperations.object' },
  { value: 'merge', label: 'rag.skill.transformOperations.merge' },
  { value: 'default', label: 'rag.skill.transformOperations.default' },
  { value: 'cast', label: 'rag.skill.transformOperations.cast' }
] as const;
const skillYamlExample = [
  'description: Generate a time-aware answer',
  'steps:',
  '  - id: current_time',
  '    type: builtin',
  '    config:',
  '      tool_code: current_datetime',
  '      arguments:',
  '        timezone: Asia/Shanghai',
  '  - id: generate_answer',
  '    type: llm',
  '    depends_on:',
  '      - current_time',
  '    config:',
  '      prompt_template: "Use the current time {{current_time}} to answer the user clearly."',
  '      temperature: 0.3'
].join('\n');

const skillStepExamples = {
  rag: 'id: retrieve_policy\ntype: rag\nconfig: {}',
  nl2sql:
    'id: query_records\ntype: nl2sql\nconfig:\n  datasource_code: business_readonly\n  query_hint: Return completed records from the last 30 days with id and amount',
  api: 'id: call_record_api\ntype: api\ndepends_on: [query_record]\nconfig:\n  tool_code: update_record\n  params:\n    recordId:\n      source: query_record\n      path: "$[0].id"\n      cardinality: one\n      on_empty: fail\n      on_multiple: fail',
  builtin:
    'id: calculate_total\ntype: builtin\nconfig:\n  tool_code: calculator\n  arguments:\n    expression: "(125.5 + 86.3) * 0.9"',
  llm: 'id: generate_answer\ntype: llm\ndepends_on: [retrieve_policy, query_records]\nconfig:\n  prompt_template: "Use {{retrieve_policy}} and {{query_records}} to produce a conclusion with evidence."\n  temperature: 0.3',
  transform: skillHelpExamples.transform,
  foreach: skillHelpExamples.foreach
};

const skillStepGuides = computed(() => [
  {
    title: $t('rag.skill.help.ragGuideTitle'),
    purpose: $t('rag.skill.help.ragGuidePurpose'),
    fields: [
      $t('rag.skill.help.ragGuideField1'),
      $t('rag.skill.help.ragGuideField2'),
      $t('rag.skill.help.ragGuideField3')
    ],
    output: $t('rag.skill.help.ragGuideOutput'),
    example: skillStepExamples.rag
  },
  {
    title: $t('rag.skill.help.nl2sqlGuideTitle'),
    purpose: $t('rag.skill.help.nl2sqlGuidePurpose'),
    fields: [
      $t('rag.skill.help.nl2sqlGuideField1'),
      $t('rag.skill.help.nl2sqlGuideField2'),
      $t('rag.skill.help.nl2sqlGuideField3')
    ],
    output: $t('rag.skill.help.nl2sqlGuideOutput'),
    example: skillStepExamples.nl2sql
  },
  {
    title: $t('rag.skill.help.apiGuideTitle'),
    purpose: $t('rag.skill.help.apiGuidePurpose'),
    fields: [
      $t('rag.skill.help.apiGuideField1'),
      $t('rag.skill.help.apiGuideField2'),
      $t('rag.skill.help.apiGuideField3'),
      $t('rag.skill.help.apiGuideField4')
    ],
    output: $t('rag.skill.help.apiGuideOutput'),
    example: skillStepExamples.api
  },
  {
    title: $t('rag.skill.help.builtinGuideTitle'),
    purpose: $t('rag.skill.help.builtinGuidePurpose'),
    fields: [
      $t('rag.skill.help.builtinGuideField1'),
      $t('rag.skill.help.builtinGuideField2'),
      $t('rag.skill.help.builtinGuideField3')
    ],
    output: $t('rag.skill.help.builtinGuideOutput'),
    example: skillStepExamples.builtin
  },
  {
    title: $t('rag.skill.help.llmGuideTitle'),
    purpose: $t('rag.skill.help.llmGuidePurpose'),
    fields: [
      $t('rag.skill.help.llmGuideField1'),
      $t('rag.skill.help.llmGuideField2'),
      $t('rag.skill.help.llmGuideField3'),
      $t('rag.skill.help.llmGuideField4')
    ],
    output: $t('rag.skill.help.llmGuideOutput'),
    example: skillStepExamples.llm
  },
  {
    title: $t('rag.skill.help.transformGuideTitle'),
    purpose: $t('rag.skill.help.transformGuidePurpose'),
    fields: [
      $t('rag.skill.help.transformGuideField1'),
      $t('rag.skill.help.transformGuideField2'),
      $t('rag.skill.help.transformGuideField3'),
      $t('rag.skill.help.transformGuideField4'),
      $t('rag.skill.help.transformGuideField5'),
      $t('rag.skill.help.transformGuideField6')
    ],
    output: $t('rag.skill.help.transformGuideOutput'),
    example: skillStepExamples.transform
  },
  {
    title: $t('rag.skill.help.foreachGuideTitle'),
    purpose: $t('rag.skill.help.foreachGuidePurpose'),
    fields: [
      $t('rag.skill.help.foreachGuideField1'),
      $t('rag.skill.help.foreachGuideField2'),
      $t('rag.skill.help.foreachGuideField3'),
      $t('rag.skill.help.foreachGuideField4'),
      $t('rag.skill.help.foreachGuideField5')
    ],
    output: $t('rag.skill.help.foreachGuideOutput'),
    example: skillStepExamples.foreach
  }
]);
const skillParameters = computed(() => [
  {
    name: $t('rag.skill.name'),
    description: $t('rag.skill.help.fields.name'),
    example: $t('rag.skill.help.fieldExamples.name'),
    required: true
  },
  {
    name: $t('rag.skill.code'),
    description: $t('rag.skill.help.fields.code'),
    example: 'record_analysis',
    required: true
  },
  {
    name: $t('rag.tool.description'),
    description: $t('rag.skill.help.fields.description'),
    example: $t('rag.skill.help.descriptionExample')
  },
  {
    name: $t('rag.common.status'),
    description: $t('rag.skill.help.fields.status'),
    example: $t('common.on'),
    required: true
  },
  {
    name: $t('rag.skill.stepId'),
    description: $t('rag.skill.help.fields.stepId'),
    example: 'query_records',
    required: true
  },
  {
    name: $t('rag.skill.type'),
    description: $t('rag.skill.help.fields.type'),
    example: 'nl2sql',
    required: true
  },
  {
    name: $t('rag.skill.stepDescription'),
    description: $t('rag.skill.help.fields.stepDescription'),
    example: $t('rag.skill.help.fieldExamples.stepDescription')
  },
  {
    name: $t('rag.skill.dependsOn'),
    description: $t('rag.skill.help.fields.dependsOn'),
    example: 'retrieve_policy, query_records'
  },
  {
    name: $t('rag.skill.ragQuery'),
    description: $t('rag.skill.help.fields.ragQuery'),
    example: $t('rag.skill.help.fieldExamples.ragQuery')
  },
  {
    name: $t('rag.skill.datasource'),
    description: $t('rag.skill.help.fields.datasource'),
    example: 'business_readonly'
  },
  {
    name: $t('rag.skill.queryHint'),
    description: $t('rag.skill.help.fields.queryHint'),
    example: $t('rag.skill.help.fieldExamples.queryHint')
  },
  {
    name: $t('rag.skill.apiTool'),
    description: $t('rag.skill.help.fields.apiTool'),
    example: 'query_records'
  },
  {
    name: $t('rag.skill.parameters'),
    description: $t('rag.skill.help.fields.parameters'),
    example: 'recordId <- query_record / $[0].id / one'
  },
  {
    name: $t('rag.skill.builtinTool'),
    description: $t('rag.skill.help.fields.builtinTool'),
    example: 'date_calculate'
  },
  {
    name: $t('rag.skill.arguments'),
    description: $t('rag.skill.help.fields.arguments'),
    example: 'operation=add, base_date=2026-07-28, amount=7, unit=days'
  },
  {
    name: $t('rag.skill.promptTemplate'),
    description: $t('rag.skill.help.fields.promptTemplate'),
    example: skillHelpExamples.prompt
  },
  {
    name: $t('rag.skill.temperature'),
    description: $t('rag.skill.help.fields.temperature'),
    example: '0.3'
  },
  {
    name: $t('rag.skill.outputSchema'),
    description: $t('rag.skill.help.fields.outputSchema'),
    example: '{"type":"object","required":["answer"],"properties":{"answer":{"type":"string"}}}'
  },
  {
    name: $t('rag.skill.foreachConfig'),
    description: $t('rag.skill.help.fields.foreachConfig'),
    example: skillHelpExamples.foreach
  },
  {
    name: $t('rag.skill.help.transformInputsParameter'),
    description: $t('rag.skill.help.fields.transformInputs'),
    example: 'records <- query_records / $ / many'
  },
  {
    name: $t('rag.skill.help.transformOperationsParameter'),
    description: $t('rag.skill.help.fields.transformOperations'),
    example: '[{"op":"filter","path":"$.status","operator":"equals","value":"completed"}]'
  },
  {
    name: $t('rag.skill.help.transformOutputSchemaParameter'),
    description: $t('rag.skill.help.fields.transformOutputSchema'),
    example: '{"type":"array","items":{"type":"object","required":["id"]}}'
  },
  {
    name: $t('rag.skill.yamlConfig'),
    description: $t('rag.skill.help.fields.yamlConfig'),
    example: skillYamlExample
  }
]);

const stepTypes = computed(() => [
  { value: 'rag', label: $t('rag.skill.types.rag') },
  { value: 'nl2sql', label: $t('rag.skill.types.nl2sql') },
  { value: 'api', label: $t('rag.skill.types.api') },
  { value: 'builtin', label: $t('rag.skill.types.builtin') },
  { value: 'llm', label: $t('rag.skill.types.llm') },
  { value: 'transform', label: $t('rag.skill.types.transform') },
  { value: 'foreach', label: $t('rag.skill.types.foreach') }
]);
const builtinTools = computed(() => [
  {
    value: 'current_datetime',
    label: $t('rag.skill.builtins.currentDatetime')
  },
  { value: 'date_calculate', label: $t('rag.skill.builtins.dateCalculate') },
  { value: 'calculator', label: $t('rag.skill.builtins.calculator') },
  { value: 'unit_convert', label: $t('rag.skill.builtins.unitConvert') },
  { value: 'web_search', label: 'Web Search' }
]);
const builtinArgumentSpecs: Record<string, BuiltinArgumentSpec[]> = {
  current_datetime: [{ key: 'timezone', type: 'string', placeholder: 'Asia/Shanghai' }],
  date_calculate: [
    { key: 'operation', type: 'select', required: true, options: ['add', 'difference'] },
    { key: 'base_date', type: 'string', placeholder: 'yyyy-MM-dd' },
    { key: 'start_date', type: 'string', placeholder: 'yyyy-MM-dd' },
    { key: 'end_date', type: 'string', placeholder: 'yyyy-MM-dd' },
    { key: 'amount', type: 'integer' },
    { key: 'unit', type: 'select', required: true, options: ['days', 'weeks', 'months', 'years'] }
  ],
  calculator: [{ key: 'expression', type: 'string', required: true, placeholder: '(125.5 + 86.3) * 0.9' }],
  unit_convert: [
    { key: 'value', type: 'number', required: true },
    { key: 'from', type: 'string', required: true, placeholder: 'kg | km | c' },
    { key: 'to', type: 'string', required: true, placeholder: 'g | m | f' }
  ],
  web_search: [
    { key: 'query', type: 'string', required: true },
    { key: 'topic', type: 'select', options: ['general', 'news'] },
    { key: 'search_depth', type: 'select', options: ['basic', 'advanced'] },
    { key: 'max_results', type: 'integer' },
    { key: 'time_range', type: 'select', options: ['day', 'week', 'month', 'year'] }
  ]
};
const foreachBuiltinTools = computed(() => builtinTools.value.filter(item => item.value !== 'web_search'));

onMounted(async () => {
  await Promise.all([loadData(), loadOptions()]);
});

watch(
  [form, steps],
  () => {
    if (!yamlDirty.value) yamlContent.value = generateYaml();
  },
  { deep: true }
);

async function loadData() {
  loading.value = true;
  try {
    const res = await fetchSkills({
      page: page.value,
      size: size.value,
      keyword: keyword.value || undefined
    });
    list.value = res.data?.records || [];
    total.value = res.data?.total || 0;
  } finally {
    loading.value = false;
  }
}

async function loadOptions() {
  const [datasourceRes, toolRes] = await Promise.all([
    fetchAllPages(page => fetchDatasources({ page, size: 100, status: 1 })),
    fetchAllPages(page => fetchTools({ page, size: 100, status: 1 }))
  ]);
  datasources.value = datasourceRes;
  tools.value = toolRes;
}

function toolByCode(code: string) {
  return tools.value.find(tool => tool.code === code);
}

function toolSchemaFor(code: string) {
  return toolSchemas.value[code] || {};
}

function toolParametersFor(code: string): Record<string, ApiParameterSchema> {
  const schema = toolSchemaFor(code);
  const parameters = schema?.function?.parameters;
  return parameters?.properties && typeof parameters.properties === 'object' ? parameters.properties : {};
}

function toolRequiredParametersFor(code: string) {
  const required = toolSchemaFor(code)?.function?.parameters?.required;
  return Array.isArray(required) ? required.map(String) : [];
}

async function loadToolSchema(code: string) {
  const tool = toolByCode(code);
  if (!code || !tool?.id || toolSchemas.value[code] || toolSchemaLoading.value[code]) return;
  toolSchemaLoading.value = { ...toolSchemaLoading.value, [code]: true };
  try {
    const response = await fetchToolSchema(tool.id);
    toolSchemas.value = { ...toolSchemas.value, [code]: response.data || {} };
  } catch {
    toolSchemas.value = { ...toolSchemas.value, [code]: {} };
  } finally {
    toolSchemaLoading.value = { ...toolSchemaLoading.value, [code]: false };
  }
}

function onApiToolChange(step: SkillStepForm) {
  loadToolSchema(step.toolCode);
}

function apiParameterOptions(step: SkillStepForm): Array<[string, ApiParameterSchema]> {
  const configured = new Set(step.params.map(row => row.key).filter(Boolean));
  return Object.entries(toolParametersFor(step.toolCode)).filter(([name]) => !configured.has(name)) as Array<
    [string, ApiParameterSchema]
  >;
}

function apiParameterMeta(step: SkillStepForm, name: string): ApiParameterSchema | undefined {
  return toolParametersFor(step.toolCode)[name];
}

function apiParameterLabel(step: SkillStepForm, name: string) {
  const parameter = apiParameterMeta(step, name);
  if (!parameter) return name;
  const required = toolRequiredParametersFor(step.toolCode).includes(name) ? ` ${t('rag.skill.requiredMark')}` : '';
  return `${name} (${parameter.type || 'any'})${required}`;
}

function apiParameterHint(step: SkillStepForm, row: ParamRow) {
  const parameter = apiParameterMeta(step, row.key);
  if (!parameter) return row.key ? t('rag.skill.apiParameterUnknown') : t('rag.skill.apiParameterSelectHint');
  const required = toolRequiredParametersFor(step.toolCode).includes(row.key)
    ? t('rag.skill.apiParameterRequired')
    : t('rag.skill.apiParameterOptional');
  const enumHint =
    Array.isArray(parameter.enum) && parameter.enum.length ? ` ${parameter.enum.map(String).join(' / ')}` : '';
  return `${parameter.type || 'any'} | ${required}${parameter.description ? ` | ${parameter.description}` : ''}${enumHint}`;
}

function apiParameterValueType(step: SkillStepForm, row: ParamRow) {
  return apiParameterMeta(step, row.key)?.type || 'string';
}

function apiParameterExpectedRoot(step: SkillStepForm, row: ParamRow): 'object' | 'array' {
  return apiParameterValueType(step, row) === 'array' ? 'array' : 'object';
}

function apiLiteralValidation(step: SkillStepForm, row: ParamRow) {
  if (row.mode !== 'literal' || !row.key.trim() || !row.value.trim()) return null;
  const parameter = apiParameterMeta(step, row.key.trim());
  if (!parameter) return null;
  const parsed = parseValue(row.value);
  const type = parameter.type;
  if (type === 'string' && typeof parsed !== 'string') return t('rag.skill.apiParameterTypeInvalid');
  if (type === 'boolean' && typeof parsed !== 'boolean') return t('rag.skill.apiParameterTypeInvalid');
  if (type === 'integer' && (!Number.isInteger(parsed) || typeof parsed !== 'number'))
    return t('rag.skill.apiParameterTypeInvalid');
  if (type === 'number' && (typeof parsed !== 'number' || Number.isNaN(parsed)))
    return t('rag.skill.apiParameterTypeInvalid');
  if (type === 'array' && !Array.isArray(parsed)) return t('rag.skill.apiParameterTypeInvalid');
  if (type === 'object' && (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)))
    return t('rag.skill.apiParameterTypeInvalid');
  if (parameter.enum?.length && !parameter.enum.some(value => JSON.stringify(value) === JSON.stringify(parsed))) {
    return t('rag.skill.apiParameterEnumInvalid');
  }
  if (
    typeof parsed === 'number' &&
    ((parameter.minimum !== undefined && parsed < parameter.minimum) ||
      (parameter.maximum !== undefined && parsed > parameter.maximum))
  ) {
    return t('rag.skill.apiParameterRangeInvalid');
  }
  return null;
}

function normalizeLiteralValue(step: SkillStepForm, row: ParamRow, value: unknown) {
  const type = apiParameterValueType(step, row);
  row.value = type === 'string' ? String(value ?? '') : JSON.stringify(value);
}

function addApiParameter(step: SkillStepForm) {
  const [entry] = apiParameterOptions(step);
  if (entry) {
    const [name] = entry;
    const parameter = apiParameterMeta(step, name);
    step.params.push({
      ...createBindingRow(name, ''),
      mode: 'literal',
      value: parameter?.default === undefined ? '' : JSON.stringify(parameter.default)
    });
    return;
  }
  addRow(step.params);
}

async function fetchAllPages(fetchPage: (page: number) => Promise<any>) {
  const records: any[] = [];
  let page = 1;
  while (true) {
    const response = await fetchPage(page);
    if (response.error) throw response.error;
    const batch = response.data?.records || [];
    records.push(...batch);
    const total = Number(response.data?.total || 0);
    if (!batch.length || records.length >= total) return records;
    page += 1;
  }
}

function openCreate() {
  isEdit.value = false;
  form.value = {
    name: '',
    code: '',
    description: '',
    inputFields: [],
    status: 0
  };
  steps.value = [];
  currentDesignTaskId.value = null;
  applySkillTemplate('rag_answer', false);
  activeTab.value = 'basic';
  validateResult.value = null;
  yamlDirty.value = false;
  yamlContent.value = generateYaml();
  dialogVisible.value = true;
}

async function startAiDesign() {
  if (
    !aiForm.value.name.trim() ||
    !aiForm.value.code.trim() ||
    !aiForm.value.description.trim() ||
    !aiForm.value.trialQuery.trim()
  ) {
    ElMessage.warning(t('rag.skill.aiRequiredFields'));
    return;
  }
  aiGenerating.value = true;
  aiTask.value = null;
  try {
    const created = await createSkillDesignTask({
      name: aiForm.value.name.trim(),
      code: aiForm.value.code.trim(),
      description: aiForm.value.description.trim(),
      trialQuery: aiForm.value.trialQuery.trim()
    });
    const taskId = created.data?.taskId;
    if (!taskId) return;
    for (let attempt = 0; attempt < 180; attempt += 1) {
      const response = await fetchSkillDesignTask(taskId);
      aiTask.value = response.data;
      if (['DRAFT_READY', 'COMPLETED'].includes(response.data?.status)) {
        const generated = response.data.definition || {};
        form.value = {
          name: response.data.name,
          code: response.data.code,
          description: generated.description || response.data.description,
          inputFields: inputFieldsFromDefinition(generated),
          status: 0
        };
        steps.value = (generated.steps || []).map(fromDefinitionStep);
        yamlContent.value = response.data.draftYaml || generateYaml();
        yamlDirty.value = false;
        validateResult.value = { valid: true, errors: [] };
        isEdit.value = false;
        activeTab.value = 'basic';
        currentDesignTaskId.value = taskId;
        aiDialogVisible.value = false;
        dialogVisible.value = true;
         ElMessage.success(t('rag.skill.aiDraftReady'));
        return;
      }
      if (['FAILED', 'CANCELLED'].includes(response.data?.status)) {
        ElMessage.error(response.data?.errorMessage || t('rag.skill.aiGenerateFailed'));
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    ElMessage.warning(t('rag.skill.aiStillRunning'));
  } finally {
    aiGenerating.value = false;
  }
}

async function applySelectedTemplate() {
  try {
    await applySkillTemplate(selectedTemplate.value, true);
  } catch {
    // User cancelled template replacement.
  }
}

async function applySkillTemplate(templateKey: SkillTemplateKey, confirmReplace = true) {
  const template = skillTemplates.value.find(item => item.key === templateKey) || skillTemplates.value[0];
  if (confirmReplace && hasCurrentStepConfig()) {
    await ElMessageBox.confirm(t('rag.skill.applyTemplateConfirm'), t('rag.skill.applyTemplateTitle'), {
      type: 'warning'
    });
  }
  form.value.description = form.value.description || template.description;
  steps.value = [];
  if (templateKey === 'rag_answer') {
    steps.value.push(
      templateStep('retrieve_knowledge', 'rag', {
        description: t('rag.skill.templateContent.retrieveKnowledge'),
        ragQuery: ''
      })
    );
    steps.value.push(
      templateStep('generate_answer', 'llm', {
        description: t('rag.skill.templateContent.generateAnswer'),
        dependsOn: ['retrieve_knowledge'],
        promptTemplate: templatePrompt('rag.skill.templateContent.ragPrompt', 'retrieve_knowledge'),
        temperature: 0.3
      })
    );
  } else if (templateKey === 'data_query') {
    steps.value.push(
      templateStep('query_data', 'nl2sql', {
        description: t('rag.skill.templateContent.queryData'),
        datasourceCode: datasources.value[0]?.code || '',
        queryHint: t('rag.skill.templateContent.queryDataHint')
      })
    );
    steps.value.push(
      templateStep('summarize_data', 'llm', {
        description: t('rag.skill.templateContent.summarizeData'),
        dependsOn: ['query_data'],
        promptTemplate: templatePrompt('rag.skill.templateContent.dataPrompt', 'query_data'),
        temperature: 0.2
      })
    );
  } else if (templateKey === 'api_action') {
    steps.value.push(
      templateStep('call_tool', 'api', {
        description: t('rag.skill.templateContent.callTool'),
        toolCode: tools.value[0]?.code || '',
        params: []
      })
    );
    steps.value.push(
      templateStep('summarize_tool_result', 'llm', {
        description: t('rag.skill.templateContent.summarizeTool'),
        dependsOn: ['call_tool'],
        promptTemplate: templatePrompt('rag.skill.templateContent.toolPrompt', 'call_tool'),
        temperature: 0.2
      })
    );
  } else if (templateKey === 'data_transform_action') {
    steps.value.push(
      templateStep('query_records', 'nl2sql', {
        description: t('rag.skill.templateContent.queryRecords'),
        datasourceCode: datasources.value[0]?.code || '',
        queryHint: t('rag.skill.templateContent.queryRecordsHint')
      })
    );
    steps.value.push(
      templateStep('build_request', 'transform', {
        description: t('rag.skill.templateContent.buildRequest'),
        dependsOn: ['query_records'],
        rawConfig: JSON.stringify(
          {
            inputs: {
              records: {
                source: 'query_records',
                path: '$',
                cardinality: 'many',
                on_empty: 'fail',
                max_items: 200,
                overflow: 'fail'
              }
            },
            operations: [
              { op: 'select', path: '$.records' },
              { op: 'project', fields: { recordId: '$.id', amount: '$.amount' } }
            ],
            output_schema: {
              type: 'array',
              items: { type: 'object', required: ['recordId'] }
            }
          },
          null,
          2
        )
      })
    );
    steps.value.push(
      templateStep('call_action', 'api', {
        description: t('rag.skill.templateContent.callAction'),
        dependsOn: ['build_request'],
        toolCode: tools.value[0]?.code || '',
        params: [createBindingRow('request', 'build_request', '$[0]')]
      })
    );
    steps.value.push(
      templateStep('summarize_action', 'llm', {
        description: t('rag.skill.templateContent.summarizeAction'),
        dependsOn: ['call_action'],
        promptTemplate: templatePrompt('rag.skill.templateContent.actionPrompt', 'call_action'),
        temperature: 0.2
      })
    );
  } else {
    steps.value.push(
      templateStep('query_items', 'nl2sql', {
        description: t('rag.skill.templateContent.queryItems'),
        datasourceCode: datasources.value[0]?.code || '',
        queryHint: t('rag.skill.templateContent.queryItemsHint')
      })
    );
    steps.value.push(
      templateStep('process_items', 'foreach', {
        description: t('rag.skill.templateContent.processItems'),
        dependsOn: ['query_items'],
        rawConfig: `{"items":"{{query_items}}","max_items":50,"max_attempts":1,"continue_on_error":true,"body":{"type":"api","config":{"tool_code":"${
          tools.value[0]?.code || 'configured_action'
        }","params":{"recordId":"{{item.id}}","_display":{"recordId":"{{item.name}}"}}}}}`
      })
    );
    steps.value.push(
      templateStep('summarize_batch', 'llm', {
        description: t('rag.skill.templateContent.summarizeBatch'),
        dependsOn: ['process_items'],
        promptTemplate: templatePrompt('rag.skill.templateContent.batchPrompt', 'process_items'),
        temperature: 0.2
      })
    );
  }
  selectedTemplate.value = templateKey;
  await Promise.all(
    steps.value.filter(step => step.type === 'api' && step.toolCode).map(step => loadToolSchema(step.toolCode))
  );
  yamlDirty.value = false;
  yamlContent.value = generateYaml();
  activeTab.value = 'steps';
}

function templateStep(id: string, type: StepType, patch: Partial<SkillStepForm>) {
  const step = createStep(steps.value.length);
  const result = {
    ...step,
    id,
    dependencyId: id,
    type,
    ...patch
  };
  if ((type === 'foreach' || type === 'transform') && patch.rawConfig) syncAdvancedConfigForm(result);
  return result;
}

function hasCurrentStepConfig() {
  return steps.value.some(
    step =>
      step.description ||
      step.ragQuery ||
      step.datasourceCode ||
      step.queryHint ||
      step.toolCode ||
      step.promptTemplate ||
      step.params.length ||
      step.arguments.length ||
      (step.rawConfig && step.rawConfig !== '{}') ||
      hasOutputSchema(step)
  );
}

async function openEdit(row: any) {
  currentDesignTaskId.value = null;
  isEdit.value = true;
  const res = await fetchSkillDetail(row.id);
  const detail = res.data || row;
  form.value = {
    id: detail.id,
    name: detail.name,
    code: detail.code,
    description: detail.definition?.description || '',
    inputFields: inputFieldsFromDefinition(detail.definition || {}),
    status: detail.status ?? 1
  };
  const parsedDefinition = definitionFromDetail(detail);
  steps.value = parsedDefinition.steps.map(fromDefinitionStep);
  await Promise.all(
    steps.value.filter(step => step.type === 'api' && step.toolCode).map(step => loadToolSchema(step.toolCode))
  );
  form.value.description = parsedDefinition.description || form.value.description;
  activeTab.value = 'basic';
  validateResult.value = null;
  yamlDirty.value = false;
  yamlContent.value = detail.yamlContent || generateYaml();
  dialogVisible.value = true;
}

function definitionFromDetail(detail: any) {
  if (Array.isArray(detail.definition?.steps)) return detail.definition;
  if (!detail.yamlContent)
    return {
      description: '',
      inputSchema: {}, goalContract: {}, steps: []
    };
  try {
    const parsed = parse(detail.yamlContent);
    return {
      description: typeof parsed?.description === 'string' ? parsed.description : '',
      inputSchema: parsed?.input_schema || {},
      goalContract: parsed?.goal_contract || {},
      steps: Array.isArray(parsed?.steps) ? parsed.steps : []
    };
  } catch {
    return {
      description: '',
      inputSchema: {}, goalContract: {}, steps: []
    };
  }
}

function inputFieldsFromDefinition(value: any): SkillInputField[] {
  const schema = value?.inputSchema || value?.input_schema || {};
  const properties = schema?.properties && typeof schema.properties === 'object' ? schema.properties : {};
  const required = new Set(Array.isArray(schema?.required) ? schema.required : []);
  return Object.entries(properties).map(([key, raw]: [string, any]) => ({
    key,
    type: ['string', 'number', 'integer', 'boolean', 'array', 'object'].includes(raw?.type) ? raw.type : 'string',
    description: typeof raw?.description === 'string' ? raw.description : '',
    required: required.has(key),
    defaultValue: raw?.default === undefined ? '' : JSON.stringify(raw.default)
  }));
}

function addInputField() {
  form.value.inputFields.push({ key: '', type: 'string', description: '', required: false, defaultValue: '' });
}

function removeInputField(index: number) {
  form.value.inputFields.splice(index, 1);
}

function inputSchema() {
  const properties: Record<string, Record<string, any>> = {};
  const required: string[] = [];
  for (const field of form.value.inputFields || []) {
    const key = String(field.key || '').trim();
    if (!key) continue;
    const property: Record<string, any> = { type: field.type || 'string' };
    if (field.description?.trim()) property.description = field.description.trim();
    if (field.defaultValue?.trim()) {
      try {
        property.default = JSON.parse(field.defaultValue);
      } catch {
        property.default = field.defaultValue;
      }
    }
    properties[key] = property;
    if (field.required) required.push(key);
  }
  return Object.keys(properties).length ? { type: 'object', properties, required } : {};
}

function goalContract() {
  const requiredSteps = steps.value.map(step => String(step.id || '').trim()).filter(Boolean);
  return {
    mode: 'automatic',
    outcome: form.value.description?.trim() || '',
    success_policy: 'all_required_steps_succeeded',
    allow_empty_result: true,
    required_steps: requiredSteps,
    failure_states: ['failed', 'timeout', 'rejected', 'cancelled'],
    route_contract: {
      execution: 'dependency_ready',
      steps: steps.value
        .filter(step => String(step.id || '').trim())
        .map(step => ({
          step_id: String(step.id).trim(),
          depends_on: effectiveDependencies(step)
        }))
    }
  };
}

function validationStatusText(status: unknown) {
  const normalized = String(status || '').trim().toUpperCase();
  if (normalized === 'VALID') return t('rag.skill.validationStatuses.valid');
  if (normalized === 'NEEDS_REVALIDATION') return t('rag.skill.validationStatuses.needsRevalidation');
  if (normalized === 'INVALID') return t('rag.skill.validationStatuses.invalid');
  return t('rag.skill.validationStatuses.unknown');
}

function validationStatusTagType(status: unknown): 'success' | 'warning' | 'danger' | 'info' {
  const normalized = String(status || '').trim().toUpperCase();
  if (normalized === 'VALID') return 'success';
  if (normalized === 'NEEDS_REVALIDATION') return 'warning';
  if (normalized === 'INVALID') return 'danger';
  return 'info';
}

function nextStepUid() {
  stepUid += 1;
  return `skill-step-${stepUid}`;
}

function createOutputSchemaField(value?: Partial<OutputSchemaField>): OutputSchemaField {
  outputSchemaFieldUid += 1;
  return {
    key: `output-schema-field-${outputSchemaFieldUid}`,
    name: '',
    type: 'string',
    description: '',
    required: false,
    enumValues: [],
    format: '',
    pattern: '',
    minLength: undefined,
    maxLength: undefined,
    minimum: undefined,
    maximum: undefined,
    minItems: undefined,
    maxItems: undefined,
    uniqueItems: false,
    additionalProperties: false,
    properties: [],
    items: undefined,
    ...value
  };
}

function createOutputSchemaForm(): OutputSchemaForm {
  return {
    enabled: false,
    rootType: 'object',
    title: '',
    description: '',
    includeDraft7: true,
    additionalProperties: false,
    arrayItemType: 'object',
    arrayItem: createOutputSchemaField({ name: '', type: 'object' }),
    minItems: undefined,
    maxItems: undefined,
    uniqueItems: false,
    fields: []
  };
}

function createForeachForm(): ForeachForm {
  return {
    items: '',
    itemPath: '',
    maxItems: 50,
    maxAttempts: 1,
    continueOnError: false,
    bodyType: 'api',
    toolCode: '',
    params: [],
    arguments: [],
    preserved: {}
  };
}

function createTransformOperation(value?: Partial<TransformOperationForm>): TransformOperationForm {
  transformOperationUid += 1;
  return { key: `transform-operation-${transformOperationUid}`, op: 'select', path: '$', detailsJson: '{}', ...value };
}

function createTransformForm(): TransformForm {
  return {
    inputs: [],
    operations: [],
    preserved: {},
    outputSchemaMode: 'form',
    outputSchemaForm: createOutputSchemaForm(),
    outputSchema: ''
  };
}

function rowsFromBindings(value: unknown): ParamRow[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  return Object.entries(value as Record<string, unknown>).map(([key, raw]) => {
    if (raw && typeof raw === 'object' && !Array.isArray(raw) && Object.hasOwn(raw, 'source')) {
      const binding = raw as Record<string, any>;
      return {
        ...createBindingRow(key, String(binding.source || ''), String(binding.path || '$')),
        cardinality: binding.cardinality === 'many' ? 'many' : 'one',
        onEmpty: ['fail', 'skip', 'default'].includes(binding.on_empty) ? binding.on_empty : 'fail',
        onMultiple: binding.on_multiple === 'first' ? 'first' : 'fail',
        maxItems: Number(binding.max_items || 200),
        overflow: binding.overflow === 'truncate' ? 'truncate' : 'fail',
        value: binding.default === undefined ? '' : JSON.stringify(binding.default)
      };
    }
    return {
      ...createBindingRow(key, ''),
      mode: 'literal',
      value: typeof raw === 'string' ? raw : JSON.stringify(raw)
    };
  });
}

function foreachFormFromJson(value: string): { mode: StepConfigMode; form: ForeachForm } {
  const form = createForeachForm();
  try {
    const config = JSON.parse(value || '{}');
    if (
      !config ||
      typeof config !== 'object' ||
      Array.isArray(config) ||
      !config.body ||
      typeof config.body !== 'object'
    ) {
      return { mode: 'json', form };
    }
    const body = config.body as Record<string, any>;
    if (!['api', 'builtin'].includes(body.type) || !body.config || typeof body.config !== 'object')
      return { mode: 'json', form };
    form.items = typeof config.items === 'string' ? config.items : '';
    form.itemPath = typeof config.item_path === 'string' ? config.item_path : '';
    form.maxItems = Number(config.max_items || 50);
    form.maxAttempts = Number(config.max_attempts || 1);
    form.continueOnError = Boolean(config.continue_on_error);
    form.bodyType = body.type;
    form.toolCode = String(body.config.tool_code || '');
    form.params = rowsFromBindings(body.config.params);
    form.arguments = rowsFromBindings(body.config.arguments);
    const { items, item_path, max_items, max_attempts, continue_on_error, body: _body, ...preserved } = config;
    const { tool_code, params, arguments: bodyArguments, ...bodyPreserved } = body.config;
    form.preserved = Object.keys(bodyPreserved).length ? { ...preserved, bodyConfig: bodyPreserved } : preserved;
    return { mode: 'form', form };
  } catch {
    return { mode: 'json', form };
  }
}

function transformFormFromJson(value: string): { mode: StepConfigMode; form: TransformForm } {
  const form = createTransformForm();
  try {
    const config = JSON.parse(value || '{}');
    if (
      !config ||
      typeof config !== 'object' ||
      Array.isArray(config) ||
      (!config.inputs && !config.input) ||
      !Array.isArray(config.operations)
    ) {
      return { mode: 'json', form };
    }
    const inputs = config.inputs || config.input;
    form.inputs = rowsFromBindings(inputs);
    form.operations = config.operations.map((raw: any) => {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw) || typeof raw.op !== 'string')
        throw new Error('invalid operation');
      const { op, path = '', ...details } = raw;
      return createTransformOperation({
        op,
        path: typeof path === 'string' ? path : '',
        detailsJson: JSON.stringify(details, null, 2)
      });
    });
    const outputSchema = config.output_schema ? JSON.stringify(config.output_schema, null, 2) : '';
    const parsedOutputSchema = outputSchemaFormFromJson(outputSchema);
    form.outputSchema = outputSchema;
    form.outputSchemaMode = parsedOutputSchema.mode;
    form.outputSchemaForm = parsedOutputSchema.form;
    const { inputs: _inputs, input: _input, operations, output_schema: _outputSchema, ...preserved } = config;
    form.preserved = preserved;
    return { mode: 'form', form };
  } catch {
    return { mode: 'json', form };
  }
}

function isPlainRecord(value: unknown): value is Record<string, any> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: string[]) {
  return Object.keys(value).every(key => allowed.includes(key));
}

function isOutputSchemaType(value: unknown, allowNull = true) {
  const types = allowNull
    ? ['object', 'array', 'string', 'integer', 'number', 'boolean', 'null']
    : ['object', 'array', 'string', 'integer', 'number', 'boolean'];
  return types.includes(String(value));
}

function isSimpleOutputSchemaProperty(property: unknown, advancedKeys: string[], depth = 1): boolean {
  const propertyKeys = [
    'type',
    'description',
    'enum',
    'format',
    'pattern',
    'minLength',
    'maxLength',
    'minimum',
    'maximum',
    'minItems',
    'maxItems',
    'uniqueItems',
    'items',
    'additionalProperties',
    'properties',
    'required'
  ];
  if (!isPlainRecord(property) || !hasOnlyKeys(property, propertyKeys) || depth > 5) return false;
  if (advancedKeys.some(key => Object.hasOwn(property, key)) || !isOutputSchemaType(property.type, false)) return false;
  if (property.description !== undefined && typeof property.description !== 'string') return false;
  if (property.enum !== undefined && !Array.isArray(property.enum)) return false;
  if (
    !['minLength', 'maxLength', 'minimum', 'maximum', 'minItems', 'maxItems'].every(
      key => property[key] === undefined || typeof property[key] === 'number'
    )
  )
    return false;
  if (!['format', 'pattern'].every(key => property[key] === undefined || typeof property[key] === 'string'))
    return false;
  if (property.uniqueItems !== undefined && typeof property.uniqueItems !== 'boolean') return false;
  if (property.type === 'array') return isSimpleOutputSchemaProperty(property.items, advancedKeys, depth + 1);
  if (property.type !== 'object')
    return !['items', 'additionalProperties', 'properties', 'required'].some(key => Object.hasOwn(property, key));
  if (property.additionalProperties !== undefined && typeof property.additionalProperties !== 'boolean') return false;
  if (!isPlainRecord(property.properties)) return false;
  if (
    property.required !== undefined &&
    (!Array.isArray(property.required) || property.required.some((name: unknown) => typeof name !== 'string'))
  )
    return false;
  return (
    Object.values(property.properties).every(item => isSimpleOutputSchemaProperty(item, advancedKeys, depth + 1)) &&
    (!Array.isArray(property.required) ||
      property.required.every((name: string) => Object.hasOwn(property.properties, name)))
  );
}

function isSimpleOutputSchema(schema: Record<string, any>) {
  const advancedKeys = [
    '$ref',
    'definitions',
    '$defs',
    'oneOf',
    'anyOf',
    'allOf',
    'not',
    'if',
    'then',
    'else',
    'patternProperties',
    'dependentRequired',
    'dependencies'
  ];
  if (advancedKeys.some(key => Object.hasOwn(schema, key))) return false;
  const rootType = String(schema.type || '');
  if (!isOutputSchemaType(rootType)) return false;
  if (schema.$schema !== undefined && schema.$schema !== 'http://json-schema.org/draft-07/schema#') return false;
  if (
    (schema.title !== undefined && typeof schema.title !== 'string') ||
    (schema.description !== undefined && typeof schema.description !== 'string')
  ) {
    return false;
  }
  if (rootType === 'array') {
    return (
      hasOnlyKeys(schema, [
        '$schema',
        'type',
        'title',
        'description',
        'items',
        'minItems',
        'maxItems',
        'uniqueItems'
      ]) && isSimpleOutputSchemaProperty(schema.items, advancedKeys)
    );
  }
  if (rootType !== 'object') return hasOnlyKeys(schema, ['$schema', 'type', 'title', 'description']);
  if (
    !hasOnlyKeys(schema, ['$schema', 'type', 'title', 'description', 'additionalProperties', 'properties', 'required'])
  )
    return false;
  if (schema.additionalProperties !== undefined && typeof schema.additionalProperties !== 'boolean') return false;
  if (!isPlainRecord(schema.properties)) return false;
  if (
    schema.required !== undefined &&
    (!Array.isArray(schema.required) || schema.required.some((name: unknown) => typeof name !== 'string'))
  )
    return false;
  if (!Object.values(schema.properties).every(property => isSimpleOutputSchemaProperty(property, advancedKeys)))
    return false;
  return (
    !Array.isArray(schema.required) || schema.required.every((name: string) => Object.hasOwn(schema.properties, name))
  );
}

function outputSchemaFieldFromJson(name: string, property: Record<string, any>, required = false): OutputSchemaField {
  const field = createOutputSchemaField({
    name,
    type: property.type || 'string',
    description: typeof property.description === 'string' ? property.description : '',
    required,
    enumValues: Array.isArray(property.enum) ? property.enum.map((item: unknown) => JSON.stringify(item)) : [],
    format: typeof property.format === 'string' ? property.format : '',
    pattern: typeof property.pattern === 'string' ? property.pattern : '',
    minLength: typeof property.minLength === 'number' ? property.minLength : undefined,
    maxLength: typeof property.maxLength === 'number' ? property.maxLength : undefined,
    minimum: typeof property.minimum === 'number' ? property.minimum : undefined,
    maximum: typeof property.maximum === 'number' ? property.maximum : undefined,
    minItems: typeof property.minItems === 'number' ? property.minItems : undefined,
    maxItems: typeof property.maxItems === 'number' ? property.maxItems : undefined,
    uniqueItems: property.uniqueItems === true,
    additionalProperties: typeof property.additionalProperties === 'boolean' ? property.additionalProperties : undefined
  });
  const childRequired = new Set(Array.isArray(property.required) ? property.required.map(String) : []);
  field.properties = Object.entries(property.properties || {}).map(([childName, child]: [string, any]) =>
    outputSchemaFieldFromJson(childName, child, childRequired.has(childName))
  );
  if (property.items) field.items = outputSchemaFieldFromJson('', property.items);
  return field;
}

function outputSchemaFormFromJson(value: string): { mode: OutputSchemaMode; form: OutputSchemaForm } {
  const form = createOutputSchemaForm();
  if (!value?.trim()) return { mode: 'form', form };
  try {
    const schema = JSON.parse(value);
    if (!schema || typeof schema !== 'object' || Array.isArray(schema) || !isSimpleOutputSchema(schema)) {
      return { mode: 'json', form };
    }
    form.enabled = true;
    form.rootType = schema.type;
    form.title = typeof schema.title === 'string' ? schema.title : '';
    form.description = typeof schema.description === 'string' ? schema.description : '';
    form.includeDraft7 = schema.$schema === 'http://json-schema.org/draft-07/schema#';
    form.additionalProperties =
      typeof schema.additionalProperties === 'boolean' ? schema.additionalProperties : undefined;
    form.arrayItemType = typeof schema.items?.type === 'string' ? schema.items.type : 'object';
    if (schema.items) form.arrayItem = outputSchemaFieldFromJson('', schema.items);
    form.minItems = typeof schema.minItems === 'number' ? schema.minItems : undefined;
    form.maxItems = typeof schema.maxItems === 'number' ? schema.maxItems : undefined;
    form.uniqueItems = schema.uniqueItems === true;
    const required = new Set(Array.isArray(schema.required) ? schema.required.map(String) : []);
    form.fields = Object.entries(schema.properties || {}).map(([name, property]: [string, any]) =>
      outputSchemaFieldFromJson(name, property, required.has(name))
    );
    return { mode: 'form', form };
  } catch {
    return { mode: 'json', form };
  }
}

function serializeOutputSchema(form: OutputSchemaForm) {
  const schema: Record<string, any> = { type: form.rootType };
  if (form.includeDraft7) schema.$schema = 'http://json-schema.org/draft-07/schema#';
  if (form.title.trim()) schema.title = form.title.trim();
  if (form.description.trim()) schema.description = form.description.trim();
  if (form.rootType === 'object') {
    const { properties, required } = outputSchemaPropertiesFromFields(form.fields);
    if (typeof form.additionalProperties === 'boolean') schema.additionalProperties = form.additionalProperties;
    schema.properties = properties;
    if (required.length) schema.required = required;
  }
  if (form.rootType === 'array') {
    schema.items = outputSchemaPropertyFromField(form.arrayItem);
    if (typeof form.minItems === 'number') schema.minItems = form.minItems;
    if (typeof form.maxItems === 'number') schema.maxItems = form.maxItems;
    if (form.uniqueItems) schema.uniqueItems = true;
  }
  return JSON.stringify(schema);
}

function outputSchemaPropertiesFromFields(fields: OutputSchemaField[]) {
  const names = new Set<string>();
  const required: string[] = [];
  const properties: Record<string, any> = {};
  for (const field of fields) {
    const name = field.name.trim();
    if (!name) throw new Error(t('rag.skill.outputSchemaFieldNameRequired'));
    if (names.has(name)) throw new Error(t('rag.skill.outputSchemaFieldDuplicate'));
    names.add(name);
    const property = outputSchemaPropertyFromField(field);
    if (field.required) required.push(name);
    properties[name] = property;
  }
  return { properties, required };
}

function outputSchemaPropertyFromField(field: OutputSchemaField): Record<string, any> {
  const property: Record<string, any> = { type: field.type || 'string' };
  if (field.description.trim()) property.description = field.description.trim();
  const enumValues = field.enumValues.map(parseValue).filter(value => value !== '');
  if (enumValues.length) property.enum = enumValues;
  if (field.format.trim()) property.format = field.format.trim();
  if (field.pattern.trim()) property.pattern = field.pattern.trim();
  if (typeof field.minLength === 'number') property.minLength = field.minLength;
  if (typeof field.maxLength === 'number') property.maxLength = field.maxLength;
  if (typeof field.minimum === 'number') property.minimum = field.minimum;
  if (typeof field.maximum === 'number') property.maximum = field.maximum;
  if (field.type === 'object') {
    const { properties, required } = outputSchemaPropertiesFromFields(field.properties);
    if (typeof field.additionalProperties === 'boolean') property.additionalProperties = field.additionalProperties;
    property.properties = properties;
    if (required.length) property.required = required;
  }
  if (field.type === 'array') {
    property.items = outputSchemaPropertyFromField(field.items || createOutputSchemaField({ type: 'string' }));
    if (typeof field.minItems === 'number') property.minItems = field.minItems;
    if (typeof field.maxItems === 'number') property.maxItems = field.maxItems;
    if (field.uniqueItems) property.uniqueItems = true;
  }
  return property;
}

function syncOutputSchemaForm(step: SkillStepForm) {
  const parsed = outputSchemaFormFromJson(step.outputSchema);
  step.outputSchemaMode = parsed.mode;
  step.outputSchemaForm = parsed.form;
}

function hasOutputSchema(step: SkillStepForm) {
  return step.outputSchemaMode === 'form' ? step.outputSchemaForm.enabled : Boolean(step.outputSchema.trim());
}

function outputSchemaSummary(step: SkillStepForm) {
  if (!hasOutputSchema(step)) return '';
  if (step.outputSchemaMode === 'json') return t('rag.skill.outputSchemaAdvancedSummary');
  const formValue = step.outputSchemaForm;
  return t('rag.skill.outputSchemaFormSummary', {
    type: formValue.rootType,
    fields: formValue.rootType === 'object' ? formValue.fields.length : 0,
    required: formValue.fields.filter(field => field.required).length
  });
}

function outputSchemaPreview(step: SkillStepForm) {
  try {
    return JSON.stringify(JSON.parse(serializeOutputSchema(step.outputSchemaForm)), null, 2);
  } catch (error: any) {
    return error.message;
  }
}

function switchOutputSchemaMode(step: SkillStepForm, mode: OutputSchemaMode) {
  if (mode === 'form') {
    syncOutputSchemaForm(step);
    return;
  }
  if (!step.outputSchemaForm.enabled) {
    step.outputSchema = '';
    step.outputSchemaMode = 'json';
    return;
  }
  try {
    step.outputSchema = serializeOutputSchema(step.outputSchemaForm);
    step.outputSchemaMode = 'json';
  } catch (error: any) {
    ElMessage.warning(error.message);
  }
}

function transformOutputSchemaSummary(formValue: TransformForm) {
  if (formValue.outputSchemaMode === 'json')
    return formValue.outputSchema.trim() ? t('rag.skill.outputSchemaAdvancedSummary') : '';
  if (!formValue.outputSchemaForm.enabled) return '';
  return t('rag.skill.outputSchemaFormSummary', {
    type: formValue.outputSchemaForm.rootType,
    fields: formValue.outputSchemaForm.rootType === 'object' ? formValue.outputSchemaForm.fields.length : 0,
    required: formValue.outputSchemaForm.fields.filter(field => field.required).length
  });
}

function switchTransformOutputSchemaMode(formValue: TransformForm, mode: OutputSchemaMode) {
  if (mode === 'form') {
    const parsed = outputSchemaFormFromJson(formValue.outputSchema);
    formValue.outputSchemaMode = parsed.mode;
    formValue.outputSchemaForm = parsed.form;
    return;
  }
  if (!formValue.outputSchemaForm.enabled) {
    formValue.outputSchema = '';
    formValue.outputSchemaMode = 'json';
    return;
  }
  try {
    formValue.outputSchema = serializeOutputSchema(formValue.outputSchemaForm);
    formValue.outputSchemaMode = 'json';
  } catch (error: any) {
    ElMessage.warning(error.message);
  }
}

function createStep(index: number): SkillStepForm {
  const usedIds = new Set(steps.value.map(step => step.id));
  let suffix = index + 1;
  let id = `step_${suffix}`;
  while (usedIds.has(id)) {
    suffix += 1;
    id = `step_${suffix}`;
  }
  return {
    uid: nextStepUid(),
    id,
    dependencyId: id,
    type: 'rag',
    description: '',
    dependsOn: [],
    ragQuery: '',
    datasourceCode: '',
    queryHint: '',
    toolCode: '',
    promptTemplate: '',
    temperature: 0.7,
    params: [],
    arguments: [],
    rawConfig: '{}',
    advancedConfigMode: 'form',
    foreachForm: createForeachForm(),
    transformForm: createTransformForm(),
    outputSchema: '',
    outputSchemaMode: 'form',
    outputSchemaForm: createOutputSchemaForm()
  };
}

function fromDefinitionStep(raw: any): SkillStepForm {
  const config = raw.config || {};
  const outputSchema =
    raw.type === 'transform' || raw.type === 'foreach' || !config.output_schema
      ? ''
      : JSON.stringify(config.output_schema, null, 2);
  const parsedOutputSchema = outputSchemaFormFromJson(outputSchema);
  const parsedAdvancedConfig =
    raw.type === 'foreach'
      ? foreachFormFromJson(JSON.stringify(config, null, 2))
      : raw.type === 'transform'
        ? transformFormFromJson(JSON.stringify(config, null, 2))
        : { mode: 'form' as StepConfigMode, form: null };
  return {
    uid: nextStepUid(),
    id: raw.id || '',
    dependencyId: raw.id || '',
    type: raw.type || 'rag',
    description: raw.description || '',
    dependsOn: raw.dependsOn || raw.depends_on || [],
    ragQuery: config.query || '',
    datasourceCode: config.datasource_code || '',
    queryHint: config.query_hint || '',
    toolCode: config.tool_code || '',
    promptTemplate: config.prompt_template || '',
    temperature: Number(config.temperature ?? 0.7),
    params: rowsFromObject(config.params),
    arguments: rowsFromObject(config.arguments),
    rawConfig: JSON.stringify(config, null, 2),
    advancedConfigMode: parsedAdvancedConfig.mode,
    foreachForm: raw.type === 'foreach' ? (parsedAdvancedConfig.form as ForeachForm) : createForeachForm(),
    transformForm: raw.type === 'transform' ? (parsedAdvancedConfig.form as TransformForm) : createTransformForm(),
    outputSchema,
    outputSchemaMode: parsedOutputSchema.mode,
    outputSchemaForm: parsedOutputSchema.form
  };
}

function rowsFromObject(value: any): ParamRow[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  return Object.entries(value).map(([key, item]) => {
    const runtimeMatch = typeof item === 'string' ? item.match(/^\{\{runtime_args\.(.+)}}$/) : null;
    const binding = runtimeMatch
      ? { source: 'runtime_args', path: `$.${runtimeMatch[1]}` }
      : item && typeof item === 'object' && !Array.isArray(item) && 'source' in item
        ? (item as any)
        : null;
    return {
      key,
      value: binding
        ? binding.default === undefined
          ? ''
          : JSON.stringify(binding.default)
        : typeof item === 'string'
          ? item
          : JSON.stringify(item),
      mode: binding ? 'binding' : 'literal',
      source: binding?.source || '',
      path: binding?.path || '$',
      cardinality: binding?.cardinality || 'one',
      onEmpty: binding?.on_empty || 'fail',
      onMultiple: binding?.on_multiple || 'fail',
      maxItems: Number(binding?.max_items || 200),
      overflow: binding?.overflow || 'fail'
    };
  });
}

function rowsToObject(rows: ParamRow[]) {
  return Object.fromEntries(
    rows
      .filter(row => row.key.trim())
      .map(row => {
        if (row.mode !== 'binding') return [row.key.trim(), parseValue(row.value)];
        const binding: Record<string, any> = {
          source: row.source,
          path: row.path || '$',
          cardinality: row.cardinality,
          on_empty: row.onEmpty
        };
        if (row.cardinality === 'one') binding.on_multiple = row.onMultiple;
        if (row.cardinality === 'many') {
          binding.max_items = row.maxItems;
          binding.overflow = row.overflow;
        }
        if (row.onEmpty === 'default') binding.default = parseValue(row.value);
        return [row.key.trim(), binding];
      })
  );
}

function parseValue(value: string) {
  const text = value.trim();
  if (!text) return '';
  try {
    return JSON.parse(text);
  } catch {
    return value;
  }
}

function serializeForeachForm(formValue: ForeachForm) {
  if (!formValue.items.trim()) throw new Error(t('rag.skill.foreachItemsRequired'));
  if (!formValue.toolCode) throw new Error(t('rag.skill.toolRequired'));
  const bodyConfig: Record<string, any> = {
    ...(formValue.preserved.bodyConfig || {}),
    tool_code: formValue.toolCode
  };
  if (formValue.bodyType === 'api') bodyConfig.params = rowsToObject(formValue.params);
  else bodyConfig.arguments = rowsToObject(formValue.arguments);
  const { bodyConfig: _bodyConfig, ...preserved } = formValue.preserved;
  return JSON.stringify({
    ...preserved,
    items: formValue.items.trim(),
    ...(formValue.itemPath.trim() ? { item_path: formValue.itemPath.trim() } : {}),
    max_items: formValue.maxItems,
    max_attempts: formValue.maxAttempts,
    continue_on_error: formValue.continueOnError,
    body: { type: formValue.bodyType, config: bodyConfig }
  });
}

function serializeTransformForm(formValue: TransformForm) {
  if (!formValue.inputs.length) throw new Error(t('rag.skill.transformInputRequired'));
  if (!formValue.operations.length) throw new Error(t('rag.skill.transformOperationsRequired'));
  const operations = formValue.operations.map(operation => {
    const details = JSON.parse(operation.detailsJson || '{}');
    if (!details || typeof details !== 'object' || Array.isArray(details))
      throw new Error(t('rag.skill.transformJsonInvalid'));
    return { ...details, op: operation.op, ...(operation.path.trim() ? { path: operation.path.trim() } : {}) };
  });
  const config: Record<string, any> = { ...formValue.preserved, inputs: rowsToObject(formValue.inputs), operations };
  const outputSchema =
    formValue.outputSchemaMode === 'form'
      ? formValue.outputSchemaForm.enabled
        ? serializeOutputSchema(formValue.outputSchemaForm)
        : ''
      : formValue.outputSchema;
  if (outputSchema.trim()) config.output_schema = JSON.parse(outputSchema);
  return JSON.stringify(config);
}

function syncAdvancedConfigForm(step: SkillStepForm) {
  const parsed = step.type === 'foreach' ? foreachFormFromJson(step.rawConfig) : transformFormFromJson(step.rawConfig);
  step.advancedConfigMode = parsed.mode;
  if (step.type === 'foreach') step.foreachForm = parsed.form as ForeachForm;
  else step.transformForm = parsed.form as TransformForm;
}

function switchAdvancedConfigMode(step: SkillStepForm, mode: StepConfigMode) {
  if (mode === 'form') {
    syncAdvancedConfigForm(step);
    return;
  }
  try {
    step.rawConfig =
      step.type === 'foreach' ? serializeForeachForm(step.foreachForm) : serializeTransformForm(step.transformForm);
    step.advancedConfigMode = 'json';
  } catch (error: any) {
    ElMessage.warning(error.message);
  }
}

function builtinArgumentSpec(toolCode: string, key: string) {
  return builtinArgumentSpecs[toolCode]?.find(spec => spec.key === key);
}

function addBuiltinArgument(step: SkillStepForm) {
  const existing = new Set(step.arguments.map(row => row.key));
  const spec = (builtinArgumentSpecs[step.toolCode] || []).find(item => !existing.has(item.key));
  if (spec) {
    step.arguments.push({ ...createBindingRow(spec.key, ''), mode: 'literal' });
    return;
  }
  addRow(step.arguments);
}

function addTransformInput(step: SkillStepForm) {
  step.transformForm.inputs.push(createBindingRow('', step.dependsOn[0] || '', '$'));
}

function stepSummary(step: SkillStepForm) {
  const labels: string[] = [t(`rag.skill.types.${step.type}`)];
  if (step.dependsOn.length) labels.push(t('rag.skill.stepSummaryDependencies', { count: step.dependsOn.length }));
  if (step.type === 'api') labels.push(t('rag.skill.stepSummaryParameters', { count: step.params.length }));
  if (step.type === 'builtin') labels.push(t('rag.skill.stepSummaryParameters', { count: step.arguments.length }));
  if (step.type === 'foreach') labels.push(t('rag.skill.stepSummaryLoop'));
  if (step.type === 'transform') labels.push(t('rag.skill.stepSummaryTransform'));
  if (
    hasOutputSchema(step) ||
    (step.type === 'transform' && Boolean(transformOutputSchemaSummary(step.transformForm)))
  ) {
    labels.push(t('rag.skill.stepSummaryOutputSchema'));
  }
  return labels;
}

function apiUnknownParameters(step: SkillStepForm) {
  const parameters = toolParametersFor(step.toolCode);
  if (!step.toolCode || !Object.keys(parameters).length) return [];
  return step.params.map(row => row.key.trim()).filter(name => name && !parameters[name]);
}

function apiMissingRequiredParameters(step: SkillStepForm) {
  const configured = new Set(step.params.map(row => row.key.trim()));
  return toolRequiredParametersFor(step.toolCode).filter(
    name => !configured.has(name) && apiParameterMeta(step, name)?.default === undefined
  );
}

function stepUsesAdvancedJson(step: SkillStepForm) {
  if ((step.type === 'foreach' || step.type === 'transform') && step.advancedConfigMode === 'json') return true;
  if (step.type === 'transform')
    return step.transformForm.outputSchemaMode === 'json' && Boolean(step.transformForm.outputSchema.trim());
  return step.outputSchemaMode === 'json' && Boolean(step.outputSchema.trim());
}

function stepHasActionRisk(step: SkillStepForm) {
  if (step.type === 'api') return toolByCode(step.toolCode)?.operationType === 'action';
  if (step.type !== 'foreach' || step.foreachForm.bodyType !== 'api') return false;
  let toolCode = step.foreachForm.toolCode;
  if (step.advancedConfigMode === 'json') {
    try {
      toolCode = String(JSON.parse(step.rawConfig || '{}')?.body?.config?.tool_code || '');
    } catch {
      return false;
    }
  }
  return toolByCode(toolCode)?.operationType === 'action';
}

function stepStatusTags(step: SkillStepForm): StepStatusTag[] {
  const tags: StepStatusTag[] = [];
  const ids = steps.value.map(item => item.id.trim());
  const unknown = step.type === 'api' ? apiUnknownParameters(step) : [];
  const missing = step.type === 'api' ? apiMissingRequiredParameters(step) : [];
  const error = stepValidation(step, ids);
  if (unknown.length) tags.push({ key: 'unknown', label: t('rag.skill.stepStatusUnknownParameter'), type: 'danger' });
  if (missing.length) tags.push({ key: 'required', label: t('rag.skill.stepStatusRequiredParameter'), type: 'danger' });
  if (error && !unknown.length && !missing.length) {
    tags.push({ key: 'invalid', label: t('rag.skill.stepStatusNeedsFix', { reason: error }), type: 'danger' });
  }
  if (stepUsesAdvancedJson(step))
    tags.push({ key: 'advanced', label: t('rag.skill.stepStatusAdvancedJson'), type: 'info' });
  if (stepHasActionRisk(step))
    tags.push({ key: 'action', label: t('rag.skill.stepStatusActionRisk'), type: 'warning' });
  if (!error) tags.unshift({ key: 'complete', label: t('rag.skill.stepStatusComplete'), type: 'success' });
  return tags;
}

function dependencyChainSummary() {
  const validSteps = steps.value.filter(step => step.id.trim());
  const ids = new Set(validSteps.map(step => step.id.trim()));
  const children = new Map<string, string[]>();
  const roots: string[] = [];
  for (const step of validSteps) {
    const id = step.id.trim();
    const dependencies = step.dependsOn.filter(dependency => ids.has(dependency));
    if (!dependencies.length) roots.push(id);
    for (const dependency of dependencies) children.set(dependency, [...(children.get(dependency) || []), id]);
  }
  const paths: string[] = [];
  const walk = (id: string, path: string[], visited: Set<string>) => {
    if (visited.has(id)) return;
    const nextPath = [...path, id];
    const next = children.get(id) || [];
    if (!next.length) {
      paths.push(nextPath.join(' -> '));
      return;
    }
    for (const child of next) walk(child, nextPath, new Set(visited).add(id));
  };
  for (const root of roots) walk(root, [], new Set());
  return paths;
}

function toDefinitionStep(step: SkillStepForm) {
  let config: Record<string, any> = {};
  if (step.type === 'rag') config = step.ragQuery.trim() ? { query: step.ragQuery.trim() } : {};
  if (step.type === 'nl2sql')
    config = {
      datasource_code: step.datasourceCode,
      query_hint: step.queryHint
    };
  if (step.type === 'api') config = { tool_code: step.toolCode, params: rowsToObject(step.params) };
  if (step.type === 'builtin')
    config = {
      tool_code: step.toolCode,
      arguments: rowsToObject(step.arguments)
    };
  if (step.type === 'llm')
    config = {
      prompt_template: step.promptTemplate,
      temperature: step.temperature
    };
  if (step.type === 'foreach' || step.type === 'transform') {
    try {
      config = JSON.parse(
        step.advancedConfigMode === 'form'
          ? step.type === 'foreach'
            ? serializeForeachForm(step.foreachForm)
            : serializeTransformForm(step.transformForm)
          : step.rawConfig || '{}'
      );
    } catch {
      config = {};
    }
  }
  if (step.type !== 'foreach' && step.type !== 'transform' && hasOutputSchema(step)) {
    try {
      config.output_schema = JSON.parse(
        step.outputSchemaMode === 'form' ? serializeOutputSchema(step.outputSchemaForm) : step.outputSchema
      );
    } catch {
      // Local validation reports this before submission.
    }
  }
  return {
    id: step.id.trim(),
    type: step.type,
    description: step.description.trim(),
    dependsOn: effectiveDependencies(step),
    config
  };
}

function effectiveDependencies(step: SkillStepForm) {
  const dependencies = new Set(step.dependsOn);
  for (const row of [...step.params, ...step.arguments]) {
    if (row.mode === 'binding' && row.source && row.source !== 'runtime_args') dependencies.add(row.source);
  }
  return [...dependencies];
}

function definition() {
  return {
    description: form.value.description?.trim() || '',
    inputSchema: inputSchema(),
    goalContract: goalContract(),
    steps: steps.value.map(toDefinitionStep)
  };
}

function generateYaml() {
  const data = definition();
  const yamlSteps = data.steps.map(step => ({
    id: step.id,
    type: step.type,
    ...(step.description ? { description: step.description } : {}),
    ...(step.dependsOn.length ? { depends_on: step.dependsOn } : {}),
    config: step.config
  }));
  return stringify(
    {
      ...(data.description ? { description: data.description } : {}),
      ...(Object.keys(data.inputSchema).length ? { input_schema: data.inputSchema } : {}),
      ...(Object.keys(data.goalContract).length ? { goal_contract: data.goalContract } : {}),
      steps: yamlSteps
    },
    { lineWidth: 0 }
  );
}

function addStep() {
  steps.value.push(createStep(steps.value.length));
  activeTab.value = 'steps';
}

function removeStep(index: number) {
  const removedId = steps.value[index].id;
  steps.value.splice(index, 1);
  steps.value.forEach(step => {
    step.dependsOn = step.dependsOn.filter(id => id !== removedId);
  });
}

function syncStepId(step: SkillStepForm) {
  const previousId = step.dependencyId.trim();
  const nextId = step.id.trim();
  if (!previousId || !nextId || previousId === nextId) {
    if (nextId) step.dependencyId = nextId;
    return;
  }
  if (steps.value.some(item => item !== step && item.id.trim() === nextId)) return;
  steps.value.forEach(item => {
    item.dependsOn = item.dependsOn.map(id => (id === previousId ? nextId : id));
    item.ragQuery = replaceStepReference(item.ragQuery, previousId, nextId);
    item.queryHint = replaceStepReference(item.queryHint, previousId, nextId);
    item.promptTemplate = replaceStepReference(item.promptTemplate, previousId, nextId);
    item.rawConfig = replaceStepReference(item.rawConfig, previousId, nextId);
    item.params.forEach(row => (row.value = replaceStepReference(row.value, previousId, nextId)));
    item.arguments.forEach(row => (row.value = replaceStepReference(row.value, previousId, nextId)));
  });
  step.dependencyId = nextId;
}

function replaceStepReference(value: string, previousId: string, nextId: string) {
  if (!value || !previousId) return value;
  const escaped = previousId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return value.replace(new RegExp(`(\\{\\{\\s*)${escaped}(?=[.}\\s])`, 'g'), `$1${nextId}`);
}

function moveStep(index: number, offset: number) {
  const target = index + offset;
  if (target < 0 || target >= steps.value.length) return;
  const [step] = steps.value.splice(index, 1);
  steps.value.splice(target, 0, step);
}

function insertVariable(step: SkillStepForm, dependencyId: string) {
  step.promptTemplate += `${step.promptTemplate ? '\n' : ''}{{${dependencyId}}}`;
}

function insertRowVariable(row: ParamRow, dependencyId: string) {
  row.value = `${row.value || ''}{{${dependencyId}}}`;
}

function addRow(rows: ParamRow[]) {
  rows.push({
    key: '',
    value: '',
    mode: 'literal',
    source: '',
    path: '$',
    cardinality: 'one',
    onEmpty: 'fail',
    onMultiple: 'fail',
    maxItems: 200,
    overflow: 'fail'
  });
}

function createBindingRow(key: string, source: string, path = '$'): ParamRow {
  return {
    key,
    value: '',
    mode: 'binding',
    source,
    path,
    cardinality: 'one',
    onEmpty: 'fail',
    onMultiple: 'fail',
    maxItems: 200,
    overflow: 'fail'
  };
}

function insertTransformOperation(step: SkillStepForm, operation: string) {
  const examples: Record<string, Record<string, any>> = {
    select: { op: 'select', path: '$.records' },
    filter: { op: 'filter', path: '$.status', operator: 'equals', value: 'completed' },
    project: { op: 'project', fields: { id: '$.id', amount: '$.amount' } },
    rename: { op: 'rename', fields: { oldName: 'newName' } },
    distinct: { op: 'distinct', path: '$.id' },
    sort: { op: 'sort', path: '$.amount', direction: 'desc' },
    slice: { op: 'slice', offset: 0, limit: 20 },
    aggregate: { op: 'aggregate', function: 'sum', path: '$.amount' },
    object: { op: 'object', fields: { id: '$.id', total: '$.amount' } },
    merge: { op: 'merge', value: { source: 'skill' } },
    default: { op: 'default', value: [] },
    cast: { op: 'cast', to: 'string' }
  };
  if (step.advancedConfigMode === 'form') {
    const example = examples[operation];
    const { op, path = '', ...details } = example;
    step.transformForm.operations.push(
      createTransformOperation({ op, path, detailsJson: JSON.stringify(details, null, 2) })
    );
    return;
  }
  try {
    const config = JSON.parse(step.rawConfig || '{}');
    if (!config || typeof config !== 'object' || Array.isArray(config)) throw new Error('invalid root');
    if (!Array.isArray(config.operations)) config.operations = [];
    config.operations.push(examples[operation]);
    step.rawConfig = JSON.stringify(config, null, 2);
  } catch {
    ElMessage.warning(t('rag.skill.transformJsonInvalid'));
  }
}

function localValidation(): string | null {
  if (!form.value.name?.trim() || !form.value.code?.trim()) return $t('rag.skill.requiredFields');
  if (!steps.value.length) return $t('rag.skill.stepsRequired');
  const ids = steps.value.map(step => step.id.trim());
  if (ids.some(id => !id)) return $t('rag.skill.stepIdRequired');
  if (new Set(ids).size !== ids.length) return $t('rag.skill.stepIdDuplicate');
  const inputKeys = (form.value.inputFields || []).map((field: SkillInputField) => field.key.trim()).filter(Boolean);
  if (new Set(inputKeys).size !== inputKeys.length) return $t('rag.skill.inputNameDuplicate');
  if (inputKeys.some((key: string) => !/^[A-Za-z_][A-Za-z0-9_-]*$/.test(key))) return $t('rag.skill.inputNameInvalid');
  for (const step of steps.value) {
    const error = stepValidation(step, ids);
    if (error) return error;
  }
  if (hasDependencyCycle()) return $t('rag.skill.dependencyCycle');
  return null;
}

function hasDependencyCycle() {
  const dependencies = new Map(steps.value.map(step => [step.id.trim(), step.dependsOn]));
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (id: string): boolean => {
    if (visiting.has(id)) return true;
    if (visited.has(id)) return false;
    visiting.add(id);
    if ((dependencies.get(id) || []).some(visit)) return true;
    visiting.delete(id);
    visited.add(id);
    return false;
  };
  return [...dependencies.keys()].some(visit);
}

function stepValidation(step: SkillStepForm, ids: string[]): string | null {
  if (step.dependsOn.includes(step.id)) return $t('rag.skill.selfDependency');
  if (step.dependsOn.some(id => !ids.includes(id))) return $t('rag.skill.missingDependency');
  if (step.type === 'nl2sql' && !step.datasourceCode) return $t('rag.skill.datasourceRequired');
  if ((step.type === 'api' || step.type === 'builtin') && !step.toolCode) return $t('rag.skill.toolRequired');
  if (step.type === 'llm' && !step.promptTemplate.trim()) return $t('rag.skill.promptRequired');
  if (step.type === 'api' && hasDuplicateKeys(step.params)) return $t('rag.skill.parameterKeyDuplicate');
  if (step.type === 'api' && step.toolCode && Object.keys(toolParametersFor(step.toolCode)).length) {
    const parameters = toolParametersFor(step.toolCode);
    if (step.params.some(row => row.key.trim() && !parameters[row.key.trim()]))
      return $t('rag.skill.apiParameterUnknown');
    const configured = new Set(step.params.map(row => row.key.trim()));
    if (
      toolRequiredParametersFor(step.toolCode).some(
        name => !configured.has(name) && apiParameterMeta(step, name)?.default === undefined
      )
    ) {
      return $t('rag.skill.apiParameterRequiredMissing');
    }
    const literalError = step.params.map(row => apiLiteralValidation(step, row)).find(Boolean);
    if (literalError) return literalError;
  }
  if (step.type === 'api' && step.params.some(row => row.mode === 'binding'
    && row.source !== 'runtime_args' && !step.dependsOn.includes(row.source))) {
    return $t('rag.skill.missingDependency');
  }
  if (step.type === 'builtin' && hasDuplicateKeys(step.arguments)) return $t('rag.skill.parameterKeyDuplicate');
  if (step.type !== 'foreach' && step.type !== 'transform' && hasOutputSchema(step)) {
    try {
      const schema = JSON.parse(
        step.outputSchemaMode === 'form' ? serializeOutputSchema(step.outputSchemaForm) : step.outputSchema
      );
      if (!schema || typeof schema !== 'object' || Array.isArray(schema)) return $t('rag.skill.outputSchemaInvalid');
    } catch {
      return $t('rag.skill.outputSchemaInvalid');
    }
  }
  if (step.type !== 'foreach' && step.type !== 'transform') return null;
  try {
    const config = JSON.parse(
      step.advancedConfigMode === 'form'
        ? step.type === 'foreach'
          ? serializeForeachForm(step.foreachForm)
          : serializeTransformForm(step.transformForm)
        : step.rawConfig || '{}'
    );
    if (step.type === 'transform' && !config.inputs && !config.input) return $t('rag.skill.transformInputRequired');
    if (step.type === 'transform' && !Array.isArray(config.operations))
      return $t('rag.skill.transformOperationsRequired');
    return null;
  } catch {
    return $t(step.type === 'transform' ? 'rag.skill.transformJsonInvalid' : 'rag.skill.foreachJsonInvalid');
  }
}

function hasDuplicateKeys(rows: ParamRow[]) {
  const keys = rows.map(row => row.key.trim()).filter(Boolean);
  return new Set(keys).size !== keys.length;
}

async function validateYaml() {
  const res = await fetchValidateSkill({ yamlContent: yamlContent.value });
  validateResult.value = res.data;
}

async function applyYaml() {
  const res = await fetchParseSkillYaml({ yamlContent: yamlContent.value });
  validateResult.value = res.data;
  if (!res.data?.valid) return false;
  form.value.description = res.data.definition?.description || '';
  form.value.inputFields = inputFieldsFromDefinition(res.data.definition || {});
  steps.value = (res.data.definition?.steps || []).map(fromDefinitionStep);
  yamlDirty.value = false;
  ElMessage.success($t('rag.skill.yamlApplied'));
  return true;
}

async function save() {
  if (yamlDirty.value && !(await applyYaml())) {
    activeTab.value = 'yaml';
    return;
  }
  const error = localValidation();
  if (error) {
    ElMessage.warning(error);
    return;
  }
  const warnings = buildPublishWarnings();
  if (form.value.status === 1 && warnings.length) {
    try {
      await ElMessageBox.confirm(warnings.join('\n'), t('rag.skill.publishCheckTitle'), {
        type: 'warning',
        confirmButtonText: t('rag.skill.continueSave'),
        cancelButtonText: t('rag.skill.returnEdit')
      });
    } catch {
      return;
    }
  }
  saving.value = true;
  try {
    const payload = {
      name: form.value.name.trim(),
      code: form.value.code.trim(),
      status: form.value.status,
      definition: definition()
    };
    const { data, error } = isEdit.value ? await fetchUpdateSkill(form.value.id, payload) : await fetchCreateSkill(payload);
    if (error || !data) return;
    ElMessage.success($t(isEdit.value ? 'common.updateSuccess' : 'common.addSuccess'));
    dialogVisible.value = false;
    await loadData();
  } finally {
    saving.value = false;
  }
}

function buildPublishWarnings() {
  const warnings: string[] = [];
  if (steps.value.some(step => step.type === 'api' && !step.params.length)) {
    warnings.push(t('rag.skill.apiParamWarning'));
  }
  if (steps.value.some(step => step.type === 'nl2sql' && !step.datasourceCode)) {
    warnings.push(t('rag.skill.nl2sqlDatasourceWarning'));
  }
  if (steps.value.some(step => step.type === 'llm' && !step.dependsOn.length && !hasOutputSchema(step))) {
    warnings.push(t('rag.skill.llmDependencyWarning'));
  }
  if (steps.value.some(step => step.type === 'foreach')) {
    warnings.push(t('rag.skill.foreachWarning'));
  }
  return warnings;
}

async function deleteItem(row: any) {
  await ElMessageBox.confirm($t('rag.skill.deleteConfirm'), $t('common.tip'), {
    type: 'warning'
  });
  await fetchDeleteSkill(row.id);
  ElMessage.success($t('common.deleteSuccess'));
  await loadData();
}

function parseInputDefault(field: SkillInputField) {
  if (!field.defaultValue?.trim()) return field.type === 'boolean' ? undefined : '';
  try {
    const parsed = JSON.parse(field.defaultValue);
    if (field.type === 'array' || field.type === 'object') return JSON.stringify(parsed);
    if (field.type === 'number' || field.type === 'integer') return Number(parsed);
    if (field.type === 'boolean') return Boolean(parsed);
    return String(parsed);
  } catch {
    return field.defaultValue;
  }
}

function prepareRunInputFields(fields: SkillInputField[]) {
  runInputFields.value = fields.map(field => ({ ...field, value: parseInputDefault(field) }));
}

function runNumberValue(field: SkillRunInputField) {
  return typeof field.value === 'number' ? field.value : undefined;
}

function runTextValue(field: SkillRunInputField) {
  return typeof field.value === 'string' || typeof field.value === 'number' ? field.value : undefined;
}

async function openRunTest(row?: any) {
  runTargetSkill.value = row || (currentDesignTaskId.value
    ? { name: form.value.name, designTaskId: currentDesignTaskId.value }
    : null);
  runQuery.value = '';
  runResult.value = null;
  runExecuteActions.value = false;
  if (row?.id) {
    const detail = await fetchSkillDetail(row.id);
    prepareRunInputFields(inputFieldsFromDefinition(detail.data?.definition || {}));
  } else {
    prepareRunInputFields(form.value.inputFields || []);
  }
  runDialogVisible.value = true;
}

function buildRuntimeArgs() {
  const runtimeArgs: Record<string, unknown> = {};
  for (const field of runInputFields.value) {
    const value = field.value;
    const empty = value === undefined || value === null || value === '';
    if (empty) {
      if (field.required) throw new Error(t('rag.skill.runParameterRequired', { key: field.key }));
      continue;
    }
    if (field.type === 'integer' || field.type === 'number') {
      const numeric = Number(value);
      if (!Number.isFinite(numeric) || (field.type === 'integer' && !Number.isInteger(numeric))) {
        throw new Error(t('rag.skill.runParameterInvalid', { key: field.key }));
      }
      runtimeArgs[field.key] = numeric;
    } else if (field.type === 'boolean') {
      runtimeArgs[field.key] = value === true || value === 'true';
    } else if (field.type === 'array' || field.type === 'object') {
      try {
        const parsed = typeof value === 'string' ? JSON.parse(value) : value;
        if (field.type === 'array' && !Array.isArray(parsed)) throw new Error('array');
        if (field.type === 'object' && (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed))) {
          throw new Error('object');
        }
        runtimeArgs[field.key] = parsed;
      } catch {
        throw new Error(t('rag.skill.runParameterInvalid', { key: field.key }));
      }
    } else {
      runtimeArgs[field.key] = String(value);
    }
  }
  return runtimeArgs;
}

async function runSkillTest() {
  if (!runQuery.value.trim()) {
    ElMessage.warning(t('rag.skill.testQuestionRequired'));
    return;
  }
  if (!runTargetSkill.value) {
    const error = localValidation();
    if (error) {
      ElMessage.warning(error);
      return;
    }
  }
  runLoading.value = true;
  try {
    let runtimeArgs: Record<string, unknown>;
    try {
      runtimeArgs = buildRuntimeArgs();
    } catch (error) {
      ElMessage.warning(error instanceof Error ? error.message : String(error));
      return;
    }
    const res = runTargetSkill.value?.designTaskId
      ? await trialSkillDesignTask(runTargetSkill.value.designTaskId, {
          query: runQuery.value.trim(),
          executeActions: runExecuteActions.value,
          runtimeArgs
        })
      : await fetchRunSkillTest(
          runTargetSkill.value
            ? {
                skillId: runTargetSkill.value.id,
                query: runQuery.value.trim(),
                executeActions: runExecuteActions.value,
                runtimeArgs
              }
            : {
                definition: definition(),
                query: runQuery.value.trim(),
                executeActions: runExecuteActions.value,
                runtimeArgs
              }
        );
    runResult.value = res.data;
  } finally {
    runLoading.value = false;
  }
}

function shortOutput(value: string) {
  if (!value) return '';
  return value.length > 2000 ? `${value.slice(0, 2000)}\n${t('rag.skill.outputTruncated')}` : value;
}

function hasDryRunSkippedStep() {
  return Boolean(runResult.value?.steps?.some((step: { dryRunSkipped?: boolean }) => step.dryRunSkipped));
}

function resetSearch() {
  keyword.value = '';
  page.value = 1;
  loadData();
}

function onYamlInput() {
  yamlDirty.value = true;
  validateResult.value = null;
}

function handleTabChange(name: string | number) {
  if (name === 'yaml' && !yamlDirty.value) nextTick(() => (yamlContent.value = generateYaml()));
}

function goTo(path: string) {
  router.push(path);
}

function openGuideRoute(path: string) {
  firstUseGuideVisible.value = false;
  goTo(path);
}

function openAiDesignDialog() {
  aiForm.value = { name: '', code: '', description: t('rag.skill.aiDescriptionTemplate'), trialQuery: '' };
  aiTask.value = null;
  aiDialogVisible.value = true;
}

function aiStageLabel(task: any) {
  const value = task?.currentStage || task?.status || 'PENDING';
  return t(`rag.skill.aiStages.${value}` as any, value);
}

function aiStageType(task: any) {
  const status = task?.status;
  if (status === 'DRAFT_READY') return 'success';
  if (status === 'FAILED' || status === 'CANCELLED') return 'danger';
  if (status === 'TRIAL_INCOMPLETE') return 'warning';
  return 'info';
}
</script>

<template>
  <div class="page-container h-full">
    <ElCard class="w-full">
      <div class="mb-4 flex flex-wrap items-center gap-4">
        <ElInput
          v-model="keyword"
          :placeholder="$t('rag.common.keywordPlaceholder')"
          clearable
          class="w-48"
          @keyup.enter="loadData"
        />
        <ElButton type="primary" @click="loadData">{{ $t('rag.common.search') }}</ElButton>
        <ElButton @click="resetSearch">{{ $t('common.reset') }}</ElButton>
        <ElButton class="ml-auto" @click="firstUseGuideVisible = true">
          <SvgIcon icon="mdi:help-circle-outline" class="mr-1" />
          {{ t('rag.skill.firstUseGuideTitle') }}
        </ElButton>
      </div>
      <div class="mb-4 flex flex-wrap items-center gap-4">
        <ElButton type="primary" @click="openCreate">+ {{ $t('rag.common.create') }}</ElButton>
        <ElButton type="success" @click="openAiDesignDialog">{{ t('rag.skill.aiCreate') }}</ElButton>
        <ElButton @click="goTo('/rag/bad-case')">{{ t('rag.skill.viewBadCase') }}</ElButton>
      </div>
      <ElTable v-loading="loading" :data="list" stripe border class="w-full" :empty-text="t('rag.skill.emptyHint')">
        <ElTableColumn prop="name" :label="$t('rag.skill.name')" min-width="160" show-overflow-tooltip />
        <ElTableColumn prop="code" :label="$t('rag.skill.code')" min-width="140" show-overflow-tooltip />
        <ElTableColumn :label="t('rag.skill.validationStatus')" min-width="140" align="center">
          <template #default="{ row }">
            <ElTooltip v-if="row.validationMessage" :content="row.validationMessage" placement="top">
              <ElTag :type="validationStatusTagType(row.validationStatus)">
                {{ validationStatusText(row.validationStatus) }}
              </ElTag>
            </ElTooltip>
            <ElTag v-else :type="validationStatusTagType(row.validationStatus)">
              {{ validationStatusText(row.validationStatus) }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="version" :label="$t('rag.skill.version')" width="90" align="center" />
        <ElTableColumn :label="$t('rag.common.status')" width="90" align="center">
          <template #default="{ row }">
            <ElTag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? $t('common.on') : $t('common.off') }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn :label="$t('rag.common.action')" width="360" fixed="right" align="center">
          <template #default="{ row }">
            <ElButton link type="primary" @click="openRunTest(row)">{{ t('rag.skill.runTest') }}</ElButton>
            <ElButton link @click="openEdit(row)">{{ $t('rag.common.edit') }}</ElButton>
            <ElButton link type="danger" @click="deleteItem(row)">{{ $t('rag.common.delete') }}</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
      <div class="mt-4 flex justify-end">
        <ElPagination
          v-model:current-page="page"
          v-model:page-size="size"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="loadData"
          @size-change="
            () => {
              page = 1;
              loadData();
            }
          "
        />
      </div>
    </ElCard>

    <ElDialog
      v-model="firstUseGuideVisible"
      :title="t('rag.skill.firstUseGuideTitle')"
      width="min(680px, 95vw)"
      align-center
    >
      <ElAlert type="info" :closable="false" show-icon>
        <template #title>
          <div class="whitespace-pre-wrap leading-6">{{ t('rag.skill.firstUseGuide') }}</div>
        </template>
      </ElAlert>
      <div class="mt-4 flex flex-wrap justify-end gap-2">
        <ElButton @click="openGuideRoute('/rag/datasource')">{{ t('rag.skill.quickDatasource') }}</ElButton>
        <ElButton @click="openGuideRoute('/rag/tool')">{{ t('rag.skill.quickTool') }}</ElButton>
        <ElButton type="primary" @click="openGuideRoute('/rag/chat')">{{ t('rag.skill.quickChat') }}</ElButton>
      </div>
    </ElDialog>

    <ElDialog
      v-model="dialogVisible"
      width="min(1100px, 95vw)"
      class="skill-editor-dialog"
      align-center
      destroy-on-close
    >
      <template #header>
        <div class="flex items-center">
          <span class="text-base font-medium">{{ $t(isEdit ? 'rag.skill.editTitle' : 'rag.skill.createTitle') }}</span>
          <ConfigHelp
            :title="$t('rag.skill.help.title')"
            :description="$t('rag.skill.help.description')"
            :examples="[skillYamlExample]"
            :steps="[
              $t('rag.skill.help.step1'),
              $t('rag.skill.help.step2'),
              $t('rag.skill.help.step3'),
              $t('rag.skill.help.step4'),
              $t('rag.skill.help.step5'),
              $t('rag.skill.help.step6')
            ]"
            :guides="skillStepGuides"
            :parameters="skillParameters"
            :rules="[
              $t('rag.skill.help.rule1'),
              $t('rag.skill.help.rule2'),
              $t('rag.skill.help.rule3'),
              $t('rag.skill.help.rule4'),
              $t('rag.skill.help.rule5')
            ]"
            :effects="[$t('rag.skill.help.effect1'), $t('rag.skill.help.effect2')]"
            :notes="[$t('rag.skill.help.note1'), $t('rag.skill.help.note2'), $t('rag.skill.help.note3')]"
          />
        </div>
      </template>
      <ElTabs v-model="activeTab" class="skill-editor-tabs" @tab-change="handleTabChange">
        <ElTabPane :label="$t('rag.skill.basicInfo')" name="basic">
          <ElForm :model="form" label-width="120px" class="mx-auto mt-3 max-w-760px">
            <ElFormItem :label="t('rag.skill.configTemplate')">
              <div class="w-full flex flex-wrap items-center gap-2">
                <ElSelect v-model="selectedTemplate" class="w-52">
                  <ElOption
                    v-for="template in skillTemplates"
                    :key="template.key"
                    :label="template.name"
                    :value="template.key"
                  />
                </ElSelect>
                <ElButton @click="applySelectedTemplate">{{ t('rag.skill.applyTemplate') }}</ElButton>
                <span class="text-xs text-gray-500">
                  {{ skillTemplates.find(item => item.key === selectedTemplate)?.description }}
                </span>
              </div>
            </ElFormItem>
            <ElFormItem :label="$t('rag.skill.name')">
              <ElInput v-model="form.name" :placeholder="$t('rag.skill.namePlaceholder')" />
            </ElFormItem>
            <ElFormItem :label="$t('rag.skill.code')">
              <ElInput v-model="form.code" :placeholder="$t('rag.skill.codePlaceholder')" />
            </ElFormItem>
            <ElFormItem :label="$t('rag.tool.description')">
              <template #label>
                <span>{{ $t('rag.tool.description') }}</span>
                <ConfigHelp
                  field
                  :title="$t('rag.skill.help.descriptionTitle')"
                  :description="$t('rag.skill.help.descriptionField')"
                  :examples="[$t('rag.skill.help.descriptionExample')]"
                />
              </template>
              <ElInput
                v-model="form.description"
                type="textarea"
                :rows="3"
                :placeholder="$t('rag.skill.descriptionPlaceholder')"
              />
            </ElFormItem>
            <ElFormItem :label="$t('rag.skill.inputContract')">
              <div class="w-full rounded border border-blue-200 bg-blue-50 p-3">
                <div class="mb-2 text-xs text-gray-600">{{ $t('rag.skill.inputContractHint') }}</div>
                <div v-for="(field, index) in form.inputFields" :key="`input-field-${index}`" class="mb-2 grid grid-cols-1 gap-2 md:grid-cols-12">
                  <ElInput v-model="field.key" class="md:col-span-3" :placeholder="$t('rag.skill.inputNamePlaceholder')" />
                  <ElSelect v-model="field.type" class="md:col-span-2">
                    <ElOption label="string" value="string" />
                    <ElOption label="number" value="number" />
                    <ElOption label="integer" value="integer" />
                    <ElOption label="boolean" value="boolean" />
                    <ElOption label="array" value="array" />
                    <ElOption label="object" value="object" />
                  </ElSelect>
                  <ElInput v-model="field.description" class="md:col-span-3" :placeholder="$t('rag.skill.inputDescriptionPlaceholder')" />
                  <ElInput v-model="field.defaultValue" class="md:col-span-2" :placeholder="$t('rag.skill.inputDefaultPlaceholder')" />
                  <div class="flex items-center gap-2 md:col-span-2">
                    <ElCheckbox v-model="field.required">{{ $t('rag.skill.inputRequired') }}</ElCheckbox>
                    <ElButton text type="danger" @click="removeInputField(Number(index))">{{ $t('rag.common.delete') }}</ElButton>
                  </div>
                </div>
                <ElButton size="small" @click="addInputField">+ {{ $t('rag.skill.addInput') }}</ElButton>
              </div>
            </ElFormItem>
            <ElFormItem :label="$t('rag.skill.goalContract')">
              <div class="w-full rounded border border-emerald-200 bg-emerald-50 p-3">
                <div class="font-medium text-emerald-800">{{ $t('rag.skill.automaticGoalTitle') }}</div>
                <div class="mt-1 text-sm text-emerald-700">
                  {{ $t('rag.skill.automaticGoalSummary', { count: steps.length }) }}
                </div>
                <div class="mt-2 text-xs text-gray-600">{{ $t('rag.skill.automaticGoalEmptyResult') }}</div>
                <div class="mt-1 text-xs text-gray-600">{{ $t('rag.skill.automaticGoalFailure') }}</div>
              </div>
            </ElFormItem>
            <ElFormItem :label="$t('rag.common.status')">
              <ElSwitch v-model="form.status" :active-value="1" :inactive-value="0" />
            </ElFormItem>
            <ElAlert
              v-if="form.status === 1 && buildPublishWarnings().length"
              type="warning"
              :closable="false"
              show-icon
              class="mb-3"
              :title="t('rag.skill.publishCheckHint')"
            />
          </ElForm>
        </ElTabPane>

        <ElTabPane :label="`${$t('rag.skill.steps')} (${steps.length})`" name="steps">
          <div class="mb-3 flex items-center justify-between">
            <ElAlert :title="$t('rag.skill.stepsHint')" type="info" :closable="false" show-icon class="mr-3" />
            <ElButton type="primary" @click="addStep">+ {{ $t('rag.skill.addStep') }}</ElButton>
          </div>
          <div v-if="dependencyChainSummary().length" class="skill-dependency-chain">
            <span class="skill-dependency-chain__label">{{ $t('rag.skill.dependencyChain') }}</span>
            <ElTag v-for="chain in dependencyChainSummary()" :key="chain" size="small" effect="plain">
              {{ chain }}
            </ElTag>
          </div>
          <ElEmpty v-if="!steps.length" :description="$t('rag.skill.noSteps')">
            <ElButton type="primary" @click="addStep">{{ $t('rag.skill.addStep') }}</ElButton>
          </ElEmpty>
          <div v-for="(step, index) in steps" :key="step.uid" class="mb-4 border rounded p-4">
            <div class="mb-4 flex items-center justify-between border-b pb-3">
              <div>
                <div class="font-medium">
                  {{ $t('rag.skill.stepNumber', { number: index + 1 }) }} ·
                  {{ step.description || step.id }}
                </div>
                <div class="skill-step-summary">
                  <ElTag v-for="item in stepSummary(step)" :key="item" size="small" effect="plain">{{ item }}</ElTag>
                </div>
                <div class="skill-step-status">
                  <ElTag
                    v-for="item in stepStatusTags(step)"
                    :key="item.key"
                    size="small"
                    :type="item.type"
                    effect="light"
                  >
                    {{ item.label }}
                  </ElTag>
                </div>
              </div>
              <div class="flex items-center gap-1">
                <ElTooltip :content="$t('rag.skill.moveUp')">
                  <ElButton text circle :disabled="index === 0" @click="moveStep(index, -1)">
                    <SvgIcon icon="mdi:arrow-up" />
                  </ElButton>
                </ElTooltip>
                <ElTooltip :content="$t('rag.skill.moveDown')">
                  <ElButton text circle :disabled="index === steps.length - 1" @click="moveStep(index, 1)">
                    <SvgIcon icon="mdi:arrow-down" />
                  </ElButton>
                </ElTooltip>
                <ElTooltip :content="$t('rag.common.delete')">
                  <ElButton text circle type="danger" @click="removeStep(index)">
                    <SvgIcon icon="mdi:delete-outline" />
                  </ElButton>
                </ElTooltip>
              </div>
            </div>
            <div class="grid grid-cols-1 gap-x-4 md:grid-cols-2">
              <ElFormItem :label="$t('rag.skill.stepId')">
                <template #label>
                  <span>{{ $t('rag.skill.stepId') }}</span>
                  <ConfigHelp
                    field
                    :title="$t('rag.skill.help.stepIdTitle')"
                    :description="$t('rag.skill.help.stepIdDescription')"
                    :examples="['query_members']"
                  />
                </template>
                <ElInput
                  v-model="step.id"
                  :placeholder="$t('rag.skill.stepIdPlaceholder')"
                  @change="syncStepId(step)"
                />
              </ElFormItem>
              <ElFormItem :label="$t('rag.skill.type')">
                <ElSelect v-model="step.type" class="w-full">
                  <ElOption v-for="type in stepTypes" :key="type.value" :label="type.label" :value="type.value" />
                </ElSelect>
              </ElFormItem>
              <ElFormItem :label="$t('rag.tool.description')">
                <ElInput v-model="step.description" :placeholder="$t('rag.skill.stepDescriptionPlaceholder')" />
              </ElFormItem>
              <ElFormItem :label="$t('rag.skill.dependsOn')">
                <template #label>
                  <span>{{ $t('rag.skill.dependsOn') }}</span>
                  <ConfigHelp
                    field
                    :title="$t('rag.skill.help.dependsTitle')"
                    :description="$t('rag.skill.help.dependsDescription')"
                    :examples="[$t('rag.skill.help.dependsExample')]"
                  />
                </template>
                <ElSelect
                  v-model="step.dependsOn"
                  multiple
                  filterable
                  class="w-full"
                  :placeholder="$t('rag.skill.dependsPlaceholder')"
                >
                  <ElOption
                    v-for="candidate in steps.filter(item => item !== step)"
                    :key="candidate.uid"
                    :label="`${candidate.description || candidate.id} (${candidate.id})`"
                    :value="candidate.id"
                  />
                </ElSelect>
              </ElFormItem>
            </div>
            <ElFormItem v-if="step.type === 'rag'" :label="$t('rag.skill.ragQuery')">
              <template #label>
                <span>{{ $t('rag.skill.ragQuery') }}</span>
                <ConfigHelp
                  field
                  :title="$t('rag.skill.help.ragQueryTitle')"
                  :description="$t('rag.skill.help.fields.ragQuery')"
                  :examples="[$t('rag.skill.help.fieldExamples.ragQuery')]"
                  :rules="[$t('rag.skill.help.ragQueryRule1'), $t('rag.skill.help.ragQueryRule2')]"
                />
              </template>
              <ElInput
                v-model="step.ragQuery"
                type="textarea"
                :rows="2"
                :placeholder="$t('rag.skill.ragQueryPlaceholder')"
              />
            </ElFormItem>
            <template v-if="step.type === 'nl2sql'">
              <ElFormItem :label="$t('rag.skill.datasource')">
                <ElSelect
                  v-model="step.datasourceCode"
                  filterable
                  class="w-full"
                  :placeholder="$t('rag.skill.datasourcePlaceholder')"
                >
                  <ElOption
                    v-for="item in datasources"
                    :key="item.code"
                    :label="`${item.name} (${item.code})`"
                    :value="item.code"
                  />
                </ElSelect>
              </ElFormItem>
              <ElFormItem :label="$t('rag.skill.queryHint')">
                <template #label>
                  <span>{{ $t('rag.skill.queryHint') }}</span>
                  <ConfigHelp
                    field
                    :title="$t('rag.skill.help.queryHintTitle')"
                    :description="$t('rag.skill.help.fields.queryHint')"
                    :examples="[$t('rag.skill.help.fieldExamples.queryHint')]"
                    :rules="[$t('rag.skill.help.queryHintRule1'), $t('rag.skill.help.queryHintRule2')]"
                  />
                </template>
                <ElInput
                  v-model="step.queryHint"
                  type="textarea"
                  :rows="2"
                  :placeholder="$t('rag.skill.queryHintPlaceholder')"
                />
              </ElFormItem>
            </template>
            <template v-if="step.type === 'api'">
              <ElFormItem :label="$t('rag.skill.apiTool')">
                <ElSelect
                  v-model="step.toolCode"
                  filterable
                  class="w-full"
                  :placeholder="$t('rag.skill.apiToolPlaceholder')"
                  @change="onApiToolChange(step)"
                >
                  <ElOption
                    v-for="item in tools"
                    :key="item.code"
                    :label="`${item.name} (${item.code})`"
                    :value="item.code"
                  />
                </ElSelect>
              </ElFormItem>
              <ElFormItem>
                <template #label>
                  <span>{{ $t('rag.skill.parameters') }}</span>
                  <ConfigHelp
                    field
                    :title="$t('rag.skill.help.paramsTitle')"
                    :description="$t('rag.skill.help.paramsDescription')"
                    :parameters="apiBindingParameters"
                    :examples="[skillHelpExamples.params]"
                    :rules="[
                      $t('rag.skill.help.bindingRules.dependency'),
                      $t('rag.skill.help.bindingRules.safePath'),
                      $t('rag.skill.help.bindingRules.toolSchema'),
                      $t('rag.skill.help.bindingRules.transport')
                    ]"
                  />
                </template>
                <div class="skill-api-parameters">
                  <ElAlert
                    v-if="step.toolCode && toolSchemaLoading[step.toolCode]"
                    type="info"
                    :closable="false"
                    :title="$t('rag.skill.apiParameterLoading')"
                  />
                  <ElAlert
                    v-else-if="step.toolCode && !Object.keys(toolParametersFor(step.toolCode)).length"
                    type="warning"
                    :closable="false"
                    :title="$t('rag.skill.apiParameterSchemaUnavailable')"
                  />
                  <div v-else-if="step.toolCode" class="skill-api-parameters__summary">
                    <span>
                      {{
                        $t('rag.skill.apiParameterSummary', {
                          count: Object.keys(toolParametersFor(step.toolCode)).length,
                          required: toolRequiredParametersFor(step.toolCode).length
                        })
                      }}
                    </span>
                    <ElTag
                      size="small"
                      :type="toolByCode(step.toolCode)?.operationType === 'action' ? 'warning' : 'info'"
                    >
                      {{
                        toolByCode(step.toolCode)?.operationType === 'action'
                          ? $t('rag.skill.apiToolAction')
                          : $t('rag.skill.apiToolQuery')
                      }}
                    </ElTag>
                  </div>
                  <div v-for="(row, rowIndex) in step.params" :key="rowIndex" class="skill-api-parameter-row">
                    <div class="skill-api-parameter-row__head">
                      <ElSelect
                        v-if="Object.keys(toolParametersFor(step.toolCode)).length"
                        v-model="row.key"
                        filterable
                        class="skill-api-parameter-row__name"
                        :placeholder="$t('rag.skill.apiParameterSelect')"
                      >
                        <ElOption :label="apiParameterLabel(step, row.key)" :value="row.key" />
                        <ElOption
                          v-for="[name] in apiParameterOptions(step).filter(([name]) => name !== row.key)"
                          :key="name"
                          :label="apiParameterLabel(step, name)"
                          :value="name"
                        />
                      </ElSelect>
                      <ElInput
                        v-else
                        v-model="row.key"
                        :placeholder="$t('rag.skill.paramName')"
                        class="skill-api-parameter-row__name"
                      />
                      <ElRadioGroup v-model="row.mode" size="small">
                        <ElRadioButton value="literal">{{ $t('rag.skill.paramLiteral') }}</ElRadioButton>
                        <ElRadioButton value="binding">{{ $t('rag.skill.paramBinding') }}</ElRadioButton>
                      </ElRadioGroup>
                      <ElButton
                        text
                        circle
                        type="danger"
                        :title="$t('common.delete')"
                        @click="step.params.splice(rowIndex, 1)"
                      >
                        <SvgIcon icon="mdi:close" />
                      </ElButton>
                    </div>
                    <div class="skill-api-parameter-row__hint">{{ apiParameterHint(step, row) }}</div>
                    <ElAlert
                      v-if="apiLiteralValidation(step, row)"
                      type="warning"
                      :closable="false"
                      :title="apiLiteralValidation(step, row) || undefined"
                    />
                    <template v-if="row.mode === 'literal'">
                      <ElSelect
                        v-if="apiParameterMeta(step, row.key)?.enum?.length"
                        :model-value="parseValue(row.value)"
                        class="w-full"
                        clearable
                        @update:model-value="value => normalizeLiteralValue(step, row, value)"
                      >
                        <ElOption
                          v-for="item in apiParameterMeta(step, row.key)?.enum"
                          :key="JSON.stringify(item)"
                          :label="String(item)"
                          :value="item as any"
                        />
                      </ElSelect>
                      <ElSwitch
                        v-else-if="apiParameterValueType(step, row) === 'boolean'"
                        :model-value="parseValue(row.value) === true"
                        @update:model-value="value => normalizeLiteralValue(step, row, value)"
                      />
                      <ElInputNumber
                        v-else-if="['integer', 'number'].includes(apiParameterValueType(step, row))"
                        :model-value="
                          Number.isFinite(Number(parseValue(row.value))) ? Number(parseValue(row.value)) : undefined
                        "
                        class="w-full"
                        :precision="apiParameterValueType(step, row) === 'integer' ? 0 : undefined"
                        :step="apiParameterValueType(step, row) === 'integer' ? 1 : 0.1"
                        @update:model-value="value => normalizeLiteralValue(step, row, value)"
                      />
                      <ConfigCodeEditor
                        v-else-if="['array', 'object'].includes(apiParameterValueType(step, row))"
                        v-model="row.value"
                        :rows="4"
                        :expected-root="apiParameterExpectedRoot(step, row)"
                      />
                      <ElInput v-else v-model="row.value" :placeholder="$t('rag.skill.paramLiteralPlaceholder')" />
                    </template>
                    <div v-else class="skill-api-binding-grid">
                      <ElSelect v-model="row.source" :placeholder="$t('rag.skill.bindingSource')">
                        <ElOption v-for="id in step.dependsOn" :key="id" :label="id" :value="id" />
                        <ElOption v-if="form.inputFields?.length" :label="$t('rag.skill.skillInputSource')" value="runtime_args" />
                      </ElSelect>
                      <ElSelect v-if="row.source === 'runtime_args'" v-model="row.path" :placeholder="$t('rag.skill.inputSelectPlaceholder')">
                        <ElOption v-for="field in form.inputFields" :key="field.key" :label="field.key" :value="`$.${field.key}`" />
                      </ElSelect>
                      <ElInput v-else v-model="row.path" :placeholder="$t('rag.skill.bindingPath')" />
                      <ElSelect v-model="row.cardinality">
                        <ElOption :label="$t('rag.skill.cardinalityOne')" value="one" />
                        <ElOption :label="$t('rag.skill.cardinalityMany')" value="many" />
                      </ElSelect>
                      <ElSelect v-model="row.onEmpty">
                        <ElOption :label="$t('rag.skill.onEmptyFail')" value="fail" />
                        <ElOption :label="$t('rag.skill.onEmptySkip')" value="skip" />
                        <ElOption :label="$t('rag.skill.onEmptyDefault')" value="default" />
                      </ElSelect>
                      <ElSelect v-if="row.cardinality === 'one'" v-model="row.onMultiple">
                        <ElOption :label="$t('rag.skill.onMultipleFail')" value="fail" />
                        <ElOption :label="$t('rag.skill.onMultipleFirst')" value="first" />
                      </ElSelect>
                      <template v-else>
                        <ElInputNumber v-model="row.maxItems" :min="1" :max="200" controls-position="right" />
                        <ElSelect v-model="row.overflow">
                          <ElOption :label="$t('rag.skill.overflowFail')" value="fail" />
                          <ElOption :label="$t('rag.skill.overflowTruncate')" value="truncate" />
                        </ElSelect>
                      </template>
                      <ElInput
                        v-if="row.onEmpty === 'default'"
                        v-model="row.value"
                        :placeholder="$t('rag.skill.defaultValue')"
                      />
                    </div>
                  </div>
                  <ElButton
                    :disabled="
                      Boolean(
                        step.toolCode &&
                        Object.keys(toolParametersFor(step.toolCode)).length &&
                        !apiParameterOptions(step).length
                      )
                    "
                    @click="addApiParameter(step)"
                  >
                    <SvgIcon icon="mdi:plus" class="mr-1" />
                    {{ $t('rag.skill.addParameter') }}
                  </ElButton>
                </div>
              </ElFormItem>
            </template>
            <template v-if="step.type === 'builtin'">
              <ElFormItem :label="$t('rag.skill.builtinTool')">
                <ElSelect v-model="step.toolCode" class="w-full" :placeholder="$t('rag.skill.builtinPlaceholder')">
                  <ElOption v-for="item in builtinTools" :key="item.value" :label="item.label" :value="item.value" />
                </ElSelect>
              </ElFormItem>
              <ElFormItem :label="$t('rag.skill.arguments')">
                <template #label>
                  <span>{{ $t('rag.skill.arguments') }}</span>
                  <ConfigHelp
                    field
                    :title="$t('rag.skill.help.argumentsTitle')"
                    :description="$t('rag.skill.help.fields.arguments')"
                    :examples="[$t('rag.skill.help.argumentsExample')]"
                    :rules="[$t('rag.skill.help.argumentsRule1'), $t('rag.skill.help.argumentsRule2')]"
                  />
                </template>
                <div class="skill-builtin-arguments">
                  <ElAlert
                    v-if="step.toolCode"
                    type="info"
                    :closable="false"
                    :title="$t('rag.skill.builtinArgumentsHint')"
                  />
                  <div v-for="(row, rowIndex) in step.arguments" :key="rowIndex" class="flex gap-2">
                    <ElSelect
                      v-if="builtinArgumentSpecs[step.toolCode]?.length"
                      v-model="row.key"
                      filterable
                      allow-create
                      class="w-44"
                    >
                      <ElOption
                        v-for="spec in builtinArgumentSpecs[step.toolCode]"
                        :key="spec.key"
                        :label="`${spec.key}${spec.required ? ' *' : ''}`"
                        :value="spec.key"
                      />
                    </ElSelect>
                    <ElInput v-else v-model="row.key" :placeholder="$t('rag.skill.paramName')" class="w-40" />
                    <ElSelect
                      v-if="row.mode === 'literal' && builtinArgumentSpec(step.toolCode, row.key)?.type === 'select'"
                      v-model="row.value"
                      filterable
                      allow-create
                      class="flex-1"
                    >
                      <ElOption
                        v-for="option in builtinArgumentSpec(step.toolCode, row.key)?.options || []"
                        :key="option"
                        :label="option"
                        :value="option"
                      />
                    </ElSelect>
                    <ElInput
                      v-else-if="
                        row.mode === 'literal' &&
                        ['number', 'integer'].includes(builtinArgumentSpec(step.toolCode, row.key)?.type || '')
                      "
                      v-model="row.value"
                      type="number"
                      class="flex-1"
                    />
                    <ElInput
                      v-else
                      v-model="row.value"
                      :placeholder="
                        builtinArgumentSpec(step.toolCode, row.key)?.placeholder || $t('rag.skill.paramValue')
                      "
                      class="flex-1"
                    />
                    <ElDropdown v-if="step.dependsOn.length" trigger="click">
                      <ElButton text circle>
                        <SvgIcon icon="mdi:variable" />
                      </ElButton>
                      <template #dropdown>
                        <ElDropdownMenu>
                          <ElDropdownItem v-for="id in step.dependsOn" :key="id" @click="insertRowVariable(row, id)">
                            {{ id }}
                          </ElDropdownItem>
                        </ElDropdownMenu>
                      </template>
                    </ElDropdown>
                    <ElButton text circle type="danger" @click="step.arguments.splice(rowIndex, 1)">
                      <SvgIcon icon="mdi:close" />
                    </ElButton>
                  </div>
                  <ElButton @click="addBuiltinArgument(step)">+ {{ $t('rag.skill.addParameter') }}</ElButton>
                </div>
              </ElFormItem>
            </template>
            <template v-if="step.type === 'llm'">
              <ElFormItem>
                <template #label>
                  <span>{{ $t('rag.skill.promptTemplate') }}</span>
                  <ConfigHelp
                    field
                    :title="$t('rag.skill.help.promptTitle')"
                    :description="$t('rag.skill.help.promptDescription')"
                    :examples="[skillHelpExamples.prompt]"
                  />
                </template>
                <div class="w-full">
                  <div v-if="step.dependsOn.length" class="mb-2 flex flex-wrap gap-2">
                    <span class="text-xs text-gray-500">{{ $t('rag.skill.insertOutput') }}</span>
                    <ElButton v-for="id in step.dependsOn" :key="id" size="small" @click="insertVariable(step, id)">
                      {{ id }}
                    </ElButton>
                  </div>
                  <ElInput
                    v-model="step.promptTemplate"
                    type="textarea"
                    :rows="6"
                    :placeholder="$t('rag.skill.promptPlaceholder')"
                  />
                </div>
              </ElFormItem>
              <ElFormItem :label="$t('rag.skill.temperature')">
                <ElSlider v-model="step.temperature" :min="0" :max="1" :step="0.1" show-input />
              </ElFormItem>
            </template>
            <ElFormItem v-if="step.type === 'foreach'">
              <template #label>
                <span>{{ $t('rag.skill.foreachConfig') }}</span>
                <ConfigHelp
                  field
                  :title="$t('rag.skill.help.foreachTitle')"
                  :description="$t('rag.skill.help.foreachDescription')"
                  :parameters="foreachParameters"
                  :examples="[skillHelpExamples.foreach]"
                  :rules="[
                    $t('rag.skill.help.foreachRules.dependency'),
                    $t('rag.skill.help.foreachRules.limit'),
                    $t('rag.skill.help.foreachRules.retry'),
                    $t('rag.skill.help.foreachRules.body')
                  ]"
                />
              </template>
              <div class="skill-advanced-config">
                <div class="skill-advanced-config__header">
                  <div class="text-xs text-gray-500">{{ $t('rag.skill.foreachFormHint') }}</div>
                  <ElSegmented
                    :model-value="step.advancedConfigMode"
                    size="small"
                    :options="[
                      { label: $t('rag.skill.schemaForm'), value: 'form' },
                      { label: $t('rag.skill.schemaJson'), value: 'json' }
                    ]"
                    @change="value => switchAdvancedConfigMode(step, value as StepConfigMode)"
                  />
                </div>
                <template v-if="step.advancedConfigMode === 'form'">
                  <div class="skill-advanced-config__panel">
                    <ElForm label-position="top">
                      <div class="skill-advanced-config__grid">
                        <ElFormItem :label="$t('rag.skill.foreachItems')">
                          <ElInput v-model="step.foreachForm.items" placeholder="{{query_orders}}" />
                        </ElFormItem>
                        <ElFormItem :label="$t('rag.skill.foreachItemPath')">
                          <ElInput v-model="step.foreachForm.itemPath" placeholder="records" />
                        </ElFormItem>
                        <ElFormItem :label="$t('rag.skill.foreachMaxItems')">
                          <ElInputNumber v-model="step.foreachForm.maxItems" :min="1" :max="200" class="w-full" />
                        </ElFormItem>
                        <ElFormItem :label="$t('rag.skill.foreachMaxAttempts')">
                          <ElInputNumber v-model="step.foreachForm.maxAttempts" :min="1" :max="3" class="w-full" />
                        </ElFormItem>
                        <ElFormItem :label="$t('rag.skill.foreachContinueOnError')">
                          <ElSwitch v-model="step.foreachForm.continueOnError" />
                        </ElFormItem>
                        <ElFormItem :label="$t('rag.skill.foreachBodyType')">
                          <ElRadioGroup v-model="step.foreachForm.bodyType">
                            <ElRadio value="api">API</ElRadio>
                            <ElRadio value="builtin">{{ $t('rag.skill.types.builtin') }}</ElRadio>
                          </ElRadioGroup>
                        </ElFormItem>
                      </div>
                      <ElFormItem :label="$t('rag.skill.foreachBodyTool')">
                        <ElSelect
                          v-if="step.foreachForm.bodyType === 'api'"
                          v-model="step.foreachForm.toolCode"
                          filterable
                          class="w-full"
                        >
                          <ElOption v-for="tool in tools" :key="tool.code" :label="tool.name" :value="tool.code" />
                        </ElSelect>
                        <ElSelect v-else v-model="step.foreachForm.toolCode" class="w-full">
                          <ElOption
                            v-for="item in foreachBuiltinTools"
                            :key="item.value"
                            :label="item.label"
                            :value="item.value"
                          />
                        </ElSelect>
                      </ElFormItem>
                    </ElForm>
                  </div>
                  <div class="skill-advanced-config__subhead">
                    <span>
                      {{ step.foreachForm.bodyType === 'api' ? $t('rag.skill.parameters') : $t('rag.skill.arguments') }}
                    </span>
                    <ElButton
                      size="small"
                      @click="
                        addRow(
                          step.foreachForm.bodyType === 'api' ? step.foreachForm.params : step.foreachForm.arguments
                        )
                      "
                    >
                      <SvgIcon icon="mdi:plus" class="mr-1" />
                      {{ $t('rag.skill.addParameter') }}
                    </ElButton>
                  </div>
                  <div
                    v-for="(row, rowIndex) in step.foreachForm.bodyType === 'api'
                      ? step.foreachForm.params
                      : step.foreachForm.arguments"
                    :key="rowIndex"
                    class="skill-advanced-config__row"
                  >
                    <ElInput v-model="row.key" :placeholder="$t('rag.skill.paramName')" />
                    <ElInput v-model="row.value" placeholder="{{item.id}} / {{index}}" />
                    <ElButton
                      text
                      circle
                      type="danger"
                      :title="$t('common.delete')"
                      @click="
                        (step.foreachForm.bodyType === 'api'
                          ? step.foreachForm.params
                          : step.foreachForm.arguments
                        ).splice(rowIndex, 1)
                      "
                    >
                      <SvgIcon icon="mdi:close" />
                    </ElButton>
                  </div>
                </template>
                <ConfigCodeEditor
                  v-else
                  v-model="step.rawConfig"
                  :rows="10"
                  expected-root="object"
                  :example="skillHelpExamples.foreach"
                />
              </div>
            </ElFormItem>
            <ElFormItem v-if="step.type === 'transform'">
              <template #label>
                <span>{{ $t('rag.skill.transformConfig') }}</span>
                <ConfigHelp
                  field
                  :title="$t('rag.skill.help.transformTitle')"
                  :description="$t('rag.skill.help.transformDescription')"
                  :parameters="transformParameters"
                  :examples="[skillHelpExamples.transform]"
                  :rules="[
                    $t('rag.skill.help.transformRules.dependency'),
                    $t('rag.skill.help.transformRules.path'),
                    $t('rag.skill.help.transformRules.operations'),
                    $t('rag.skill.help.transformRules.limits')
                  ]"
                />
              </template>
              <div class="skill-advanced-config">
                <div class="skill-advanced-config__header">
                  <div class="text-xs text-gray-500">{{ $t('rag.skill.transformFormHint') }}</div>
                  <ElSegmented
                    :model-value="step.advancedConfigMode"
                    size="small"
                    :options="[
                      { label: $t('rag.skill.schemaForm'), value: 'form' },
                      { label: $t('rag.skill.schemaJson'), value: 'json' }
                    ]"
                    @change="value => switchAdvancedConfigMode(step, value as StepConfigMode)"
                  />
                </div>
                <template v-if="step.advancedConfigMode === 'form'">
                  <div class="skill-advanced-config__subhead">
                    <span>{{ $t('rag.skill.transformInputs') }}</span>
                    <ElButton size="small" @click="addTransformInput(step)">
                      <SvgIcon icon="mdi:plus" class="mr-1" />
                      {{ $t('rag.skill.addParameter') }}
                    </ElButton>
                  </div>
                  <div
                    v-for="(row, rowIndex) in step.transformForm.inputs"
                    :key="rowIndex"
                    class="skill-transform-input-row"
                  >
                    <ElInput v-model="row.key" :placeholder="$t('rag.skill.paramName')" />
                    <ElSelect v-model="row.source" class="w-full">
                      <ElOption v-for="id in step.dependsOn" :key="id" :label="id" :value="id" />
                      <ElOption v-if="form.inputFields?.length" :label="$t('rag.skill.skillInputSource')" value="runtime_args" />
                    </ElSelect>
                    <ElSelect v-if="row.source === 'runtime_args'" v-model="row.path" class="w-full">
                      <ElOption v-for="field in form.inputFields" :key="field.key" :label="field.key" :value="`$.${field.key}`" />
                    </ElSelect>
                    <ElInput v-else v-model="row.path" placeholder="$ / $[*]" />
                    <ElSelect v-model="row.cardinality" class="w-full">
                      <ElOption value="one" :label="$t('rag.skill.cardinalityOne')" />
                      <ElOption value="many" :label="$t('rag.skill.cardinalityMany')" />
                    </ElSelect>
                    <ElButton
                      text
                      circle
                      type="danger"
                      :title="$t('common.delete')"
                      @click="step.transformForm.inputs.splice(rowIndex, 1)"
                    >
                      <SvgIcon icon="mdi:close" />
                    </ElButton>
                  </div>
                  <div class="skill-advanced-config__subhead">
                    <span>{{ $t('rag.skill.transformOperationsTitle') }}</span>
                  </div>
                  <div
                    v-for="(operation, operationIndex) in step.transformForm.operations"
                    :key="operation.key"
                    class="skill-transform-operation-row"
                  >
                    <ElSelect v-model="operation.op">
                      <ElOption
                        v-for="option in transformOperationOptions"
                        :key="option.value"
                        :label="$t(option.label)"
                        :value="option.value"
                      />
                    </ElSelect>
                    <ElInput v-model="operation.path" placeholder="$.records" />
                    <ConfigCodeEditor v-model="operation.detailsJson" :rows="3" expected-root="object" />
                    <ElButton
                      text
                      circle
                      type="danger"
                      :title="$t('common.delete')"
                      @click="step.transformForm.operations.splice(operationIndex, 1)"
                    >
                      <SvgIcon icon="mdi:close" />
                    </ElButton>
                  </div>
                  <div class="skill-transform-output-schema">
                    <div class="skill-output-schema__header">
                      <div>
                        <div class="font-medium">{{ $t('rag.skill.outputSchema') }}</div>
                        <div class="text-xs text-gray-500">{{ $t('rag.skill.transformOutputSchemaHint') }}</div>
                        <div v-if="transformOutputSchemaSummary(step.transformForm)" class="mt-1 text-xs text-gray-500">
                          {{ transformOutputSchemaSummary(step.transformForm) }}
                        </div>
                      </div>
                      <ElSegmented
                        :model-value="step.transformForm.outputSchemaMode"
                        size="small"
                        :options="[
                          { label: $t('rag.skill.schemaForm'), value: 'form' },
                          { label: $t('rag.skill.schemaJson'), value: 'json' }
                        ]"
                        @change="
                          value => switchTransformOutputSchemaMode(step.transformForm, value as OutputSchemaMode)
                        "
                      />
                    </div>
                    <ElAlert
                      v-if="step.transformForm.outputSchemaMode === 'json'"
                      type="warning"
                      :closable="false"
                      :title="$t('rag.skill.outputSchemaAdvancedHint')"
                    />
                    <template v-else>
                      <ElCheckbox
                        v-model="step.transformForm.outputSchemaForm.enabled"
                        class="skill-output-schema__enabled"
                      >
                        {{ $t('rag.skill.outputSchemaEnabled') }}
                      </ElCheckbox>
                      <div v-if="step.transformForm.outputSchemaForm.enabled" class="skill-output-schema__root">
                        <ElForm label-position="top" class="skill-output-schema__form">
                          <div class="skill-output-schema__grid">
                            <ElFormItem :label="$t('rag.skill.outputSchemaRootType')">
                              <ElSelect v-model="step.transformForm.outputSchemaForm.rootType" class="w-full">
                                <ElOption
                                  v-for="type in ['object', 'array', 'string', 'integer', 'number', 'boolean', 'null']"
                                  :key="type"
                                  :label="type"
                                  :value="type"
                                />
                              </ElSelect>
                            </ElFormItem>
                            <ElFormItem :label="$t('rag.skill.outputSchemaTitle')">
                              <ElInput v-model="step.transformForm.outputSchemaForm.title" />
                            </ElFormItem>
                            <ElFormItem :label="$t('rag.skill.outputSchemaDescription')">
                              <ElInput v-model="step.transformForm.outputSchemaForm.description" />
                            </ElFormItem>
                          </div>
                          <div class="skill-output-schema__switches">
                            <ElCheckbox v-model="step.transformForm.outputSchemaForm.includeDraft7">
                              {{ $t('rag.skill.outputSchemaDraft7') }}
                            </ElCheckbox>
                            <ElCheckbox
                              v-if="step.transformForm.outputSchemaForm.rootType === 'object'"
                              :model-value="step.transformForm.outputSchemaForm.additionalProperties === true"
                              @update:model-value="
                                step.transformForm.outputSchemaForm.additionalProperties = Boolean($event)
                              "
                            >
                              {{ $t('rag.skill.outputSchemaAdditionalProperties') }}
                            </ElCheckbox>
                          </div>
                          <div
                            v-if="step.transformForm.outputSchemaForm.rootType === 'array'"
                            class="skill-output-schema__array-rules"
                          >
                            <ElFormItem :label="$t('rag.skill.outputSchemaMinItems')">
                              <ElInputNumber
                                v-model="step.transformForm.outputSchemaForm.minItems"
                                :min="0"
                                class="w-full"
                              />
                            </ElFormItem>
                            <ElFormItem :label="$t('rag.skill.outputSchemaMaxItems')">
                              <ElInputNumber
                                v-model="step.transformForm.outputSchemaForm.maxItems"
                                :min="0"
                                class="w-full"
                              />
                            </ElFormItem>
                            <ElFormItem :label="$t('rag.skill.outputSchemaUniqueItems')">
                              <ElCheckbox v-model="step.transformForm.outputSchemaForm.uniqueItems" />
                            </ElFormItem>
                          </div>
                        </ElForm>
                        <div
                          v-if="step.transformForm.outputSchemaForm.rootType === 'object'"
                          class="skill-output-schema__fields-header"
                        >
                          <div>
                            <div class="font-medium">{{ $t('rag.skill.outputSchemaFieldsTitle') }}</div>
                            <div class="text-xs text-gray-500">{{ $t('rag.skill.outputSchemaNestedFieldsHint') }}</div>
                          </div>
                          <ElButton
                            size="small"
                            type="primary"
                            plain
                            @click="step.transformForm.outputSchemaForm.fields.push(createOutputSchemaField())"
                          >
                            <SvgIcon icon="mdi:plus" class="mr-1" />
                            {{ $t('rag.skill.outputSchemaAddField') }}
                          </ElButton>
                        </div>
                        <OutputSchemaNodeEditor
                          v-for="(field, fieldIndex) in step.transformForm.outputSchemaForm.fields"
                          :key="field.key"
                          :model-value="field"
                          @remove="step.transformForm.outputSchemaForm.fields.splice(fieldIndex, 1)"
                        />
                        <template v-if="step.transformForm.outputSchemaForm.rootType === 'array'">
                          <div class="schema-node__item">{{ $t('rag.skill.outputSchemaArrayItems') }}</div>
                          <OutputSchemaNodeEditor
                            :model-value="step.transformForm.outputSchemaForm.arrayItem"
                            :show-name="false"
                          />
                        </template>
                      </div>
                    </template>
                    <ConfigCodeEditor
                      v-if="step.transformForm.outputSchemaMode === 'json'"
                      v-model="step.transformForm.outputSchema"
                      :rows="8"
                      expected-root="object"
                      :example="outputSchemaExample"
                    />
                  </div>
                </template>
                <div class="flex justify-end">
                  <ElDropdown trigger="click" @command="value => insertTransformOperation(step, String(value))">
                    <ElButton>
                      <SvgIcon icon="mdi:plus" class="mr-1" />
                      {{ $t('rag.skill.insertTransformOperation') }}
                    </ElButton>
                    <template #dropdown>
                      <ElDropdownMenu>
                        <ElDropdownItem
                          v-for="operation in transformOperationOptions"
                          :key="operation.value"
                          :command="operation.value"
                        >
                          {{ $t(operation.label) }}
                        </ElDropdownItem>
                      </ElDropdownMenu>
                    </template>
                  </ElDropdown>
                </div>
                <ConfigCodeEditor
                  v-if="step.advancedConfigMode === 'json'"
                  v-model="step.rawConfig"
                  :rows="14"
                  expected-root="object"
                  :example="skillHelpExamples.transform"
                />
              </div>
            </ElFormItem>
            <ElFormItem v-if="step.type !== 'transform' && step.type !== 'foreach'">
              <template #label>
                <span>{{ $t('rag.skill.outputSchema') }}</span>
                <ConfigHelp
                  field
                  :title="$t('rag.skill.outputSchema')"
                  :description="$t('rag.skill.outputSchemaHelp')"
                  :parameters="outputSchemaParameters"
                  :examples="[outputSchemaExample]"
                  :rules="outputSchemaRules"
                />
              </template>
              <div class="skill-output-schema">
                <div class="skill-output-schema__header">
                  <div>
                    <div class="text-xs text-gray-500">{{ $t('rag.skill.outputSchemaHint') }}</div>
                    <div v-if="hasOutputSchema(step)" class="mt-1 text-xs text-gray-500">
                      {{ outputSchemaSummary(step) }}
                    </div>
                  </div>
                  <ElSegmented
                    :model-value="step.outputSchemaMode"
                    size="small"
                    :options="[
                      { label: $t('rag.skill.schemaForm'), value: 'form' },
                      { label: $t('rag.skill.schemaJson'), value: 'json' }
                    ]"
                    @change="value => switchOutputSchemaMode(step, value as OutputSchemaMode)"
                  />
                </div>
                <ElAlert
                  v-if="step.outputSchemaMode === 'json'"
                  class="mb-3"
                  type="warning"
                  :closable="false"
                  :title="$t('rag.skill.outputSchemaAdvancedHint')"
                />
                <template v-if="step.outputSchemaMode === 'form'">
                  <ElCheckbox v-model="step.outputSchemaForm.enabled" class="skill-output-schema__enabled">
                    {{ $t('rag.skill.outputSchemaEnabled') }}
                  </ElCheckbox>
                  <ElAlert
                    v-if="!step.outputSchemaForm.enabled"
                    type="info"
                    :closable="false"
                    :title="$t('rag.skill.outputSchemaDisabledHint')"
                  />
                  <div v-if="step.outputSchemaForm.enabled" class="skill-output-schema__root">
                    <ElForm label-position="top" class="skill-output-schema__form">
                      <div class="skill-output-schema__grid">
                        <ElFormItem :label="$t('rag.skill.outputSchemaRootType')">
                          <ElSelect v-model="step.outputSchemaForm.rootType" class="w-full">
                            <ElOption
                              v-for="type in ['object', 'array', 'string', 'integer', 'number', 'boolean', 'null']"
                              :key="type"
                              :label="type"
                              :value="type"
                            />
                          </ElSelect>
                        </ElFormItem>
                        <ElFormItem :label="$t('rag.skill.outputSchemaTitle')">
                          <ElInput
                            v-model="step.outputSchemaForm.title"
                            :placeholder="$t('rag.skill.outputSchemaTitlePlaceholder')"
                          />
                        </ElFormItem>
                        <ElFormItem :label="$t('rag.skill.outputSchemaDescription')">
                          <ElInput
                            v-model="step.outputSchemaForm.description"
                            :placeholder="$t('rag.skill.outputSchemaDescriptionPlaceholder')"
                          />
                        </ElFormItem>
                      </div>
                      <div class="skill-output-schema__switches">
                        <ElCheckbox v-model="step.outputSchemaForm.includeDraft7">
                          {{ $t('rag.skill.outputSchemaDraft7') }}
                        </ElCheckbox>
                        <ElCheckbox
                          v-if="step.outputSchemaForm.rootType === 'object'"
                          :model-value="step.outputSchemaForm.additionalProperties === true"
                          @update:model-value="step.outputSchemaForm.additionalProperties = Boolean($event)"
                        >
                          {{ $t('rag.skill.outputSchemaAdditionalProperties') }}
                        </ElCheckbox>
                      </div>
                      <div v-if="step.outputSchemaForm.rootType === 'array'" class="skill-output-schema__array-rules">
                        <ElFormItem :label="$t('rag.skill.outputSchemaMinItems')">
                          <ElInputNumber v-model="step.outputSchemaForm.minItems" :min="0" class="w-full" />
                        </ElFormItem>
                        <ElFormItem :label="$t('rag.skill.outputSchemaMaxItems')">
                          <ElInputNumber v-model="step.outputSchemaForm.maxItems" :min="0" class="w-full" />
                        </ElFormItem>
                        <ElFormItem :label="$t('rag.skill.outputSchemaUniqueItems')">
                          <ElCheckbox v-model="step.outputSchemaForm.uniqueItems" />
                        </ElFormItem>
                      </div>
                    </ElForm>
                  </div>
                  <template v-if="step.outputSchemaForm.enabled && step.outputSchemaForm.rootType === 'object'">
                    <div class="skill-output-schema__fields-header">
                      <div>
                        <div class="font-medium">{{ $t('rag.skill.outputSchemaFieldsTitle') }}</div>
                        <div class="text-xs text-gray-500">{{ $t('rag.skill.outputSchemaFieldsHint') }}</div>
                      </div>
                      <ElButton
                        size="small"
                        type="primary"
                        plain
                        @click="step.outputSchemaForm.fields.push(createOutputSchemaField())"
                      >
                        <SvgIcon icon="mdi:plus" class="mr-1" />
                        {{ $t('rag.skill.outputSchemaAddField') }}
                      </ElButton>
                    </div>
                    <ElAlert
                      v-if="!step.outputSchemaForm.fields.length"
                      type="info"
                      :closable="false"
                      :title="$t('rag.skill.outputSchemaFieldsEmpty')"
                    />
                    <OutputSchemaNodeEditor
                      v-for="(field, fieldIndex) in step.outputSchemaForm.fields"
                      :key="field.key"
                      :model-value="field"
                      @remove="step.outputSchemaForm.fields.splice(fieldIndex, 1)"
                    />
                  </template>
                  <template v-else-if="step.outputSchemaForm.enabled && step.outputSchemaForm.rootType === 'array'">
                    <div class="schema-node__item">{{ $t('rag.skill.outputSchemaArrayItems') }}</div>
                    <OutputSchemaNodeEditor :model-value="step.outputSchemaForm.arrayItem" :show-name="false" />
                  </template>
                  <ElCollapse v-if="step.outputSchemaForm.enabled" class="skill-output-schema__preview">
                    <ElCollapseItem :title="$t('rag.skill.outputSchemaPreview')" name="preview">
                      <pre>{{ outputSchemaPreview(step) }}</pre>
                    </ElCollapseItem>
                  </ElCollapse>
                </template>
                <ConfigCodeEditor
                  v-else
                  v-model="step.outputSchema"
                  :rows="8"
                  expected-root="object"
                  :example="outputSchemaExample"
                />
              </div>
            </ElFormItem>
          </div>
        </ElTabPane>

        <ElTabPane :label="$t('rag.skill.yamlConfig')" name="yaml">
          <ElAlert :title="$t('rag.skill.yamlExpertHint')" type="warning" :closable="false" show-icon class="mb-3" />
          <div class="mb-2 flex flex-wrap gap-2">
            <ElButton @click="validateYaml">{{ $t('rag.skill.validate') }}</ElButton>
            <ElButton type="primary" @click="applyYaml">{{ $t('rag.skill.applyYaml') }}</ElButton>
            <ElButton
              @click="
                yamlDirty = false;
                yamlContent = generateYaml();
              "
            >
              {{ $t('rag.skill.regenerateYaml') }}
            </ElButton>
          </div>
          <div v-if="validateResult" class="mb-2">
            <ElAlert
              v-if="validateResult.valid"
              type="success"
              :title="$t('rag.skill.validateSuccess')"
              :closable="false"
            />
            <ElAlert v-else type="error" :closable="false">
              <template #title>
                <div v-for="error in validateResult.errors" :key="error">
                  {{ error }}
                </div>
              </template>
            </ElAlert>
          </div>
          <ConfigCodeEditor
            v-model="yamlContent"
            language="yaml"
            :rows="24"
            :example="skillYamlExample"
            @update:model-value="onYamlInput"
          />
        </ElTabPane>
      </ElTabs>
      <template #footer>
        <ElButton @click="openRunTest()">{{ t('rag.skill.runCurrentConfig') }}</ElButton>
        <ElButton @click="dialogVisible = false">{{ $t('rag.common.cancel') }}</ElButton>
        <ElButton type="primary" :loading="saving" @click="save">{{ $t('rag.common.save') }}</ElButton>
      </template>
    </ElDialog>

    <ElDialog v-model="aiDialogVisible" :title="t('rag.skill.aiCreate')" width="min(720px, 95vw)" align-center>
      <ElAlert
        class="mb-4"
        type="info"
        :closable="false"
         :title="t('rag.skill.aiIntro')"
        show-icon
      />
      <ElForm label-width="100px">
         <ElFormItem :label="t('rag.skill.name')" required><ElInput v-model="aiForm.name" maxlength="100" :placeholder="t('rag.skill.aiNamePlaceholder')" /></ElFormItem>
         <ElFormItem :label="t('rag.skill.code')" required><ElInput v-model="aiForm.code" maxlength="100" :placeholder="t('rag.skill.aiCodePlaceholder')" /></ElFormItem>
        <ElFormItem :label="t('rag.skill.aiDescription')" required>
          <ElInput
            v-model="aiForm.description"
            type="textarea"
            :rows="8"
             :placeholder="t('rag.skill.aiDescriptionPlaceholder')"
          />
        </ElFormItem>
        <ElFormItem :label="t('rag.skill.aiTrialQuery')" required>
          <ElInput
            v-model="aiForm.trialQuery"
            type="textarea"
            :rows="4"
            :placeholder="t('rag.skill.aiTrialQueryPlaceholder')"
          />
          <div class="mt-1 text-xs text-gray-500">{{ t('rag.skill.aiTrialQueryHint') }}</div>
        </ElFormItem>
         <ElFormItem v-if="aiTask" :label="t('rag.skill.aiStage')">
          <ElTag :type="aiStageType(aiTask)">
            {{ aiStageLabel(aiTask) }}
          </ElTag>
          <span v-if="aiTask.errorMessage" class="ml-2 text-danger">{{ aiTask.errorMessage }}</span>
        </ElFormItem>
        <ElDescriptions v-if="aiTask" :column="2" border size="small">
          <ElDescriptionsItem :label="t('rag.skill.aiFirstAttempt')">
            {{ aiTask.firstAttemptStatus || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem :label="t('rag.skill.aiAttemptCount')">
            {{ aiTask.attemptCount ?? 0 }}
          </ElDescriptionsItem>
          <ElDescriptionsItem :label="t('rag.skill.aiLedgerEvent')">
            {{ aiTask.latestLedgerEventId || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem :label="t('rag.skill.aiFailureType')">
            {{ aiTask.terminalFailureType || '-' }}
          </ElDescriptionsItem>
        </ElDescriptions>
      </ElForm>
      <template #footer>
         <ElButton :disabled="aiGenerating" @click="aiDialogVisible = false">{{ t('rag.common.cancel') }}</ElButton>
         <ElButton type="primary" :loading="aiGenerating" @click="startAiDesign">{{ t('rag.skill.aiGenerate') }}</ElButton>
      </template>
    </ElDialog>

    <ElDialog v-model="runDialogVisible" :title="t('rag.skill.runDialogTitle')" width="min(900px, 95vw)" align-center>
      <ElAlert class="mb-3" type="info" :closable="false" :title="t('rag.skill.runTestHint')" show-icon />
      <ElForm label-width="100px">
        <ElFormItem :label="t('rag.skill.testTarget')">
          <ElTag>{{ runTargetSkill?.name || t('rag.skill.currentEditingConfig') }}</ElTag>
        </ElFormItem>
        <ElFormItem :label="t('rag.skill.testQuestion')">
          <ElInput v-model="runQuery" type="textarea" :rows="3" :placeholder="t('rag.skill.runQuestionPlaceholder')" />
        </ElFormItem>
        <ElFormItem v-if="runInputFields.length" :label="t('rag.skill.runParameters')">
          <div class="w-full space-y-2">
            <div v-for="field in runInputFields" :key="field.key" class="rounded border border-gray-200 p-2">
              <div class="mb-1 flex items-center gap-2 text-xs">
                <span class="font-medium">{{ field.key }}</span>
                <ElTag size="small">{{ field.type }}</ElTag>
                <ElTag v-if="field.required" size="small" type="danger">{{ t('rag.skill.inputRequired') }}</ElTag>
              </div>
              <div v-if="field.type === 'boolean'">
                <ElSelect v-model="field.value" clearable class="w-full" :placeholder="field.description || field.key">
                  <ElOption :label="t('rag.skill.runBooleanTrue')" :value="true" />
                  <ElOption :label="t('rag.skill.runBooleanFalse')" :value="false" />
                </ElSelect>
              </div>
              <ElInputNumber
                v-else-if="field.type === 'integer' || field.type === 'number'"
                :model-value="runNumberValue(field)"
                class="w-full"
                :precision="field.type === 'integer' ? 0 : undefined"
                @update:model-value="field.value = $event"
              />
              <ElInput
                v-else
                :model-value="runTextValue(field)"
                :type="field.type === 'array' || field.type === 'object' ? 'textarea' : 'text'"
                :rows="field.type === 'array' || field.type === 'object' ? 2 : 1"
                :placeholder="field.description || field.key"
                @update:model-value="field.value = $event"
              />
              <div v-if="field.description" class="mt-1 text-xs text-gray-500">{{ field.description }}</div>
            </div>
          </div>
        </ElFormItem>
        <ElFormItem :label="t('rag.skill.actionGateCheck')">
          <ElSwitch v-model="runExecuteActions" />
          <span class="ml-2 text-xs text-gray-500">{{ t('rag.skill.actionGateCheckHint') }}</span>
        </ElFormItem>
      </ElForm>
      <div v-if="runResult" class="space-y-3">
        <ElAlert
          :type="runResult.success ? 'success' : 'warning'"
          :closable="false"
          :title="hasDryRunSkippedStep() ? t('rag.skill.runCompletedDry') : t('rag.skill.runCompleted')"
        />
        <ElTable :data="runResult.steps || []" border stripe max-height="420">
          <ElTableColumn prop="id" :label="t('rag.skill.stepColumn')" width="150" />
          <ElTableColumn prop="type" :label="t('rag.skill.typeColumn')" width="90" />
          <ElTableColumn prop="status" :label="t('rag.skill.statusColumn')" width="100">
            <template #default="{ row }">
              <ElTag :type="row.status === 'success' ? 'success' : row.status === 'failed' ? 'danger' : 'warning'">
                {{ row.status }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn :label="t('rag.skill.output')">
            <template #default="{ row }">
              <pre class="max-h-56 overflow-auto whitespace-pre-wrap rounded bg-gray-50 p-2 text-xs">{{
                shortOutput(row.output)
              }}</pre>
            </template>
          </ElTableColumn>
        </ElTable>
      </div>
      <template #footer>
        <ElButton @click="runDialogVisible = false">{{ t('rag.skill.close') }}</ElButton>
        <ElButton type="primary" :loading="runLoading" @click="runSkillTest">{{ t('rag.skill.startRun') }}</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<style scoped>
:deep(.skill-editor-dialog) {
  display: flex;
  max-height: min(90vh, 900px);
  flex-direction: column;
  margin: auto;
}

:deep(.skill-editor-dialog .el-dialog__header),
:deep(.skill-editor-dialog .el-dialog__footer) {
  flex: none;
}

:deep(.skill-editor-dialog .el-dialog__body) {
  min-height: 0;
  flex: 1;
  overflow-y: auto;
}

.skill-editor-tabs {
  min-width: 0;
}

.skill-api-parameters,
.skill-output-schema,
.skill-advanced-config,
.skill-builtin-arguments {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 12px;
}

.skill-output-schema__enabled {
  align-self: flex-start;
}

.skill-api-parameters__summary,
.skill-output-schema__header,
.skill-output-schema__fields-header,
.skill-advanced-config__header,
.skill-advanced-config__subhead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.skill-api-parameters__summary {
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  color: var(--el-text-color-regular);
  font-size: 12px;
}

.skill-api-parameter-row,
.skill-output-schema__root,
.skill-advanced-config__panel {
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background: var(--el-fill-color-blank);
}

.skill-api-parameter-row__head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.skill-api-parameter-row__name {
  min-width: 220px;
  flex: 1;
}

.skill-api-parameter-row__hint {
  margin: 8px 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.skill-api-binding-grid,
.skill-output-schema__grid,
.skill-output-schema__array-rules,
.skill-advanced-config__grid,
.skill-schema-popover__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px 12px;
}

.skill-output-schema__form :deep(.el-form-item),
.skill-schema-popover__form :deep(.el-form-item) {
  margin-bottom: 10px;
}

.skill-output-schema__switches {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
}

.skill-transform-output-schema {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.skill-output-schema__table-wrap {
  width: 100%;
  overflow-x: auto;
}

.skill-output-schema__table {
  min-width: 860px;
}

.skill-schema-popover__form {
  padding: 4px;
}

.skill-output-schema__preview pre {
  max-height: 260px;
  margin: 0;
  overflow: auto;
  white-space: pre-wrap;
  color: var(--el-text-color-regular);
  font-size: 12px;
  line-height: 1.5;
}

.skill-step-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}

.skill-step-status,
.skill-dependency-chain {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}

.skill-dependency-chain {
  align-items: center;
  margin: 0 0 12px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background: var(--el-fill-color-lighter);
}

.skill-dependency-chain__label {
  color: var(--el-text-color-secondary);
  font-size: 13px;
  font-weight: 500;
}

.skill-advanced-config__subhead {
  margin-top: 4px;
  color: var(--el-text-color-regular);
  font-size: 13px;
  font-weight: 500;
}

.skill-advanced-config__row,
.skill-transform-input-row {
  display: grid;
  grid-template-columns: minmax(140px, 0.8fr) minmax(220px, 1.2fr) auto;
  align-items: center;
  gap: 8px;
}

.skill-transform-input-row {
  grid-template-columns: repeat(4, minmax(130px, 1fr)) auto;
}

.skill-transform-operation-row {
  display: grid;
  grid-template-columns: minmax(140px, 0.65fr) minmax(160px, 0.75fr) minmax(280px, 1.6fr) auto;
  align-items: start;
  gap: 8px;
}

@media (max-width: 640px) {
  :deep(.skill-editor-dialog) {
    width: 96vw !important;
    max-height: 94vh;
  }

  :deep(.skill-editor-dialog .el-dialog__body) {
    padding-right: 12px;
    padding-left: 12px;
  }

  .skill-api-parameters__summary,
  .skill-output-schema__header,
  .skill-output-schema__fields-header,
  .skill-api-parameter-row__head {
    align-items: stretch;
    flex-direction: column;
  }

  .skill-api-parameter-row__name {
    min-width: 0;
  }

  .skill-api-binding-grid,
  .skill-output-schema__grid,
  .skill-output-schema__array-rules,
  .skill-advanced-config__grid,
  .skill-schema-popover__grid {
    grid-template-columns: 1fr;
  }

  .skill-advanced-config__row,
  .skill-transform-input-row,
  .skill-transform-operation-row {
    grid-template-columns: 1fr;
  }
}
</style>
