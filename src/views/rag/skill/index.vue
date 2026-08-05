<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { parse, stringify } from 'yaml';
import {
  fetchCreateSkill,
  fetchDatasources,
  fetchDeleteSkill,
  fetchParseSkillYaml,
  fetchSkillDetail,
  fetchSkills,
  fetchTools,
  fetchUpdateSkill,
  fetchRunSkillTest,
  fetchTestSkillMatch,
  fetchValidateSkill
} from '@/service/api/rag';
import { $t } from '@/locales';
import ConfigHelp from '../shared/config-help.vue';
import ConfigCodeEditor from '../shared/config-code-editor.vue';
import { formatKeywords } from '../shared/display';

defineOptions({ name: 'RagSkill' });

type StepType = 'rag' | 'nl2sql' | 'api' | 'builtin' | 'llm' | 'foreach' | 'transform';
type SkillIntentType = 'knowledge' | 'action' | 'composite';
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
  outputSchema: string;
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
const matchDialogVisible = ref(false);
const matchQuery = ref('');
const matchResult = ref<any>(null);
const matchLoading = ref(false);
const runDialogVisible = ref(false);
const runQuery = ref('');
const runResult = ref<any>(null);
const runLoading = ref(false);
const runTargetSkill = ref<any>(null);
const runExecuteActions = ref(false);
const selectedTemplate = ref<SkillTemplateKey>('rag_answer');
let stepUid = 0;
const skillTemplates = computed(() => [
  {
    key: 'rag_answer',
    name: t('rag.skill.templateRagName'),
    description: t('rag.skill.templateRagDescription'),
    keywords: t('rag.skill.templateRagKeywords'),
    intentType: 'knowledge' as SkillIntentType
  },
  {
    key: 'data_query',
    name: t('rag.skill.templateDataName'),
    description: t('rag.skill.templateDataDescription'),
    keywords: t('rag.skill.templateDataKeywords'),
    intentType: 'action' as SkillIntentType
  },
  {
    key: 'api_action',
    name: t('rag.skill.templateToolName'),
    description: t('rag.skill.templateToolDescription'),
    keywords: t('rag.skill.templateToolKeywords'),
    intentType: 'action' as SkillIntentType
  },
  {
    key: 'data_transform_action',
    name: t('rag.skill.templateTransformName'),
    description: t('rag.skill.templateTransformDescription'),
    keywords: t('rag.skill.templateTransformKeywords'),
    intentType: 'composite' as SkillIntentType
  },
  {
    key: 'batch_action',
    name: t('rag.skill.templateBatchName'),
    description: t('rag.skill.templateBatchDescription'),
    keywords: t('rag.skill.templateBatchKeywords'),
    intentType: 'composite' as SkillIntentType
  }
] as const);
const skillHelpExamples = {
  params: 'recordId <- query_record / $[0].id / one\nrecordIds <- query_records / $[*].id / many',
  prompt: '根据规则 {{policy}} 和记录 {{query_record}} 输出结论、依据与待确认事项。',
  foreach:
    '{"items":"{{query_records}}","max_items":100,"max_attempts":1,"continue_on_error":true,"body":{"type":"api","config":{"tool_code":"configured_action","params":{"recordId":"{{item.id}}"}}}}',
  transform:
    '{"inputs":{"records":{"source":"query_records","path":"$","cardinality":"many"}},"operations":[{"op":"select","path":"$.records"},{"op":"project","fields":{"id":"$.id","amount":"$.amount"}}],"output_schema":{"type":"array","items":{"type":"object","required":["id"]}}}'
};
const outputSchemaExample = JSON.stringify(
  { type: 'object', required: ['answer'], properties: { answer: { type: 'string' } } },
  null,
  2
);
const transformOperationOptions = [
  { value: 'select', label: 'rag.skill.transformOperations.select' },
  { value: 'filter', label: 'rag.skill.transformOperations.filter' },
  { value: 'project', label: 'rag.skill.transformOperations.project' },
  { value: 'rename', label: 'rag.skill.transformOperations.rename' },
  { value: 'distinct', label: 'rag.skill.transformOperations.distinct' },
  { value: 'sort', label: 'rag.skill.transformOperations.sort' },
  { value: 'slice', label: 'rag.skill.transformOperations.slice' },
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
  nl2sql: 'id: query_records\ntype: nl2sql\nconfig:\n  datasource_code: business_readonly\n  query_hint: Return completed records from the last 30 days with id and amount',
  api: 'id: call_record_api\ntype: api\ndepends_on: [query_record]\nconfig:\n  tool_code: update_record\n  params:\n    recordId:\n      source: query_record\n      path: "$[0].id"\n      cardinality: one\n      on_empty: fail\n      on_multiple: fail',
  builtin: 'id: calculate_total\ntype: builtin\nconfig:\n  tool_code: calculator\n  arguments:\n    expression: "(125.5 + 86.3) * 0.9"',
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
    example: $t('rag.skill.help.descriptionExample'),
    required: true
  },
  {
    name: $t('rag.skill.triggerKeywords'),
    description: $t('rag.skill.help.fields.triggerKeywords'),
    example: $t('rag.skill.help.triggerExample')
  },
  {
    name: $t('rag.skill.minScore'),
    description: $t('rag.skill.help.fields.minScore'),
    example: '0.65',
    required: true
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
  { value: 'unit_convert', label: $t('rag.skill.builtins.unitConvert') }
]);

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
    triggerKeywords: '',
    intentType: 'knowledge',
    positiveExamples: '',
    negativeExamples: '',
    minScore: 0.65,
    status: 1
  };
  steps.value = [];
  applySkillTemplate('rag_answer', false);
  activeTab.value = 'basic';
  validateResult.value = null;
  yamlDirty.value = false;
  yamlContent.value = generateYaml();
  dialogVisible.value = true;
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
  form.value.triggerKeywords = form.value.triggerKeywords || template.keywords;
  form.value.intentType = template.intentType;
  steps.value = [];
  if (templateKey === 'rag_answer') {
    steps.value.push(templateStep('retrieve_knowledge', 'rag', {
      description: t('rag.skill.templateContent.retrieveKnowledge'), ragQuery: ''
    }));
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
        rawConfig: JSON.stringify({
          inputs: {
            records: {
              source: 'query_records', path: '$', cardinality: 'many',
              on_empty: 'fail', max_items: 200, overflow: 'fail'
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
        }, null, 2)
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
        rawConfig:
          '{"items":"{{query_items}}","max_items":50,"max_attempts":1,"continue_on_error":true,"body":{"type":"api","config":{"tool_code":"' +
          (tools.value[0]?.code || 'configured_action') +
          '","params":{"recordId":"{{item.id}}","_display":{"recordId":"{{item.name}}"}}}}}'
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
  yamlDirty.value = false;
  yamlContent.value = generateYaml();
  activeTab.value = 'steps';
}

function templateStep(id: string, type: StepType, patch: Partial<SkillStepForm>) {
  const step = createStep(steps.value.length);
  return {
    ...step,
    id,
    dependencyId: id,
    type,
    ...patch
  };
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
      step.outputSchema
  );
}

async function openEdit(row: any) {
  isEdit.value = true;
  const res = await fetchSkillDetail(row.id);
  const detail = res.data || row;
  let keywords = detail.triggerKeywords || '';
  try {
    keywords = JSON.parse(keywords).join(', ');
  } catch {
    // Keep legacy comma-separated trigger words.
  }
  form.value = {
    id: detail.id,
    name: detail.name,
    code: detail.code,
    description: detail.definition?.description || '',
    triggerKeywords: keywords,
    intentType: detail.definition?.intentType || 'knowledge',
    positiveExamples: examplesToText(detail.definition?.positiveExamples),
    negativeExamples: examplesToText(detail.definition?.negativeExamples),
    minScore: detail.minScore ?? 0.65,
    status: detail.status ?? 1
  };
  const parsedDefinition = definitionFromDetail(detail);
  steps.value = parsedDefinition.steps.map(fromDefinitionStep);
  form.value.description = parsedDefinition.description || form.value.description;
  form.value.intentType = parsedDefinition.intentType || form.value.intentType;
  form.value.positiveExamples = examplesToText(parsedDefinition.positiveExamples);
  form.value.negativeExamples = examplesToText(parsedDefinition.negativeExamples);
  activeTab.value = 'basic';
  validateResult.value = null;
  yamlDirty.value = false;
  yamlContent.value = detail.yamlContent || generateYaml();
  dialogVisible.value = true;
}

function definitionFromDetail(detail: any) {
  if (Array.isArray(detail.definition?.steps)) return detail.definition;
  if (!detail.yamlContent) return { description: '', intentType: 'knowledge', positiveExamples: [], negativeExamples: [], steps: [] };
  try {
    const parsed = parse(detail.yamlContent);
    return {
      description: typeof parsed?.description === 'string' ? parsed.description : '',
      intentType: parsed?.intent_type || 'knowledge',
      positiveExamples: Array.isArray(parsed?.positive_examples) ? parsed.positive_examples : [],
      negativeExamples: Array.isArray(parsed?.negative_examples) ? parsed.negative_examples : [],
      steps: Array.isArray(parsed?.steps) ? parsed.steps : []
    };
  } catch {
    return { description: '', intentType: 'knowledge', positiveExamples: [], negativeExamples: [], steps: [] };
  }
}

function examplesToText(value: unknown) {
  return Array.isArray(value) ? value.filter(item => typeof item === 'string').join('\n') : '';
}

function textToExamples(value: unknown) {
  if (typeof value !== 'string') return [];
  return value.split(/\r?\n/).map(item => item.trim()).filter(Boolean);
}

function nextStepUid() {
  stepUid += 1;
  return `skill-step-${stepUid}`;
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
    outputSchema: ''
  };
}

function fromDefinitionStep(raw: any): SkillStepForm {
  const config = raw.config || {};
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
    outputSchema:
      raw.type === 'transform' || raw.type === 'foreach' || !config.output_schema
        ? ''
        : JSON.stringify(config.output_schema, null, 2)
  };
}

function rowsFromObject(value: any): ParamRow[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  return Object.entries(value).map(([key, item]) => {
    const binding = item && typeof item === 'object' && !Array.isArray(item) && 'source' in item ? (item as any) : null;
    return {
      key,
      value: binding ? (binding.default === undefined ? '' : JSON.stringify(binding.default)) : typeof item === 'string' ? item : JSON.stringify(item),
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
    rows.filter(row => row.key.trim()).map(row => {
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
      config = JSON.parse(step.rawConfig || '{}');
    } catch {
      config = {};
    }
  }
  if (step.type !== 'foreach' && step.type !== 'transform' && step.outputSchema.trim()) {
    try {
      config.output_schema = JSON.parse(step.outputSchema);
    } catch {
      // Local validation reports this before submission.
    }
  }
  return {
    id: step.id.trim(),
    type: step.type,
    description: step.description.trim(),
    dependsOn: step.dependsOn,
    config
  };
}

function definition() {
  return {
    description: form.value.description?.trim() || '',
    intentType: form.value.intentType || 'knowledge',
    positiveExamples: textToExamples(form.value.positiveExamples),
    negativeExamples: textToExamples(form.value.negativeExamples),
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
      intent_type: data.intentType,
      ...(data.positiveExamples.length ? { positive_examples: data.positiveExamples } : {}),
      ...(data.negativeExamples.length ? { negative_examples: data.negativeExamples } : {}),
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
    key: '', value: '', mode: 'literal', source: '', path: '$', cardinality: 'one',
    onEmpty: 'fail', onMultiple: 'fail', maxItems: 200, overflow: 'fail'
  });
}

function createBindingRow(key: string, source: string, path = '$'): ParamRow {
  return {
    key, value: '', mode: 'binding', source, path, cardinality: 'one',
    onEmpty: 'fail', onMultiple: 'fail', maxItems: 200, overflow: 'fail'
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
  if (step.type === 'api' && step.params.some(row => row.mode === 'binding' && !step.dependsOn.includes(row.source))) {
    return $t('rag.skill.missingDependency');
  }
  if (step.type === 'builtin' && hasDuplicateKeys(step.arguments)) return $t('rag.skill.parameterKeyDuplicate');
  if (step.type !== 'foreach' && step.type !== 'transform' && step.outputSchema.trim()) {
    try {
      const schema = JSON.parse(step.outputSchema);
      if (!schema || typeof schema !== 'object' || Array.isArray(schema)) return $t('rag.skill.outputSchemaInvalid');
    } catch {
      return $t('rag.skill.outputSchemaInvalid');
    }
  }
  if (step.type !== 'foreach' && step.type !== 'transform') return null;
  try {
    const config = JSON.parse(step.rawConfig || '{}');
    if (step.type === 'transform' && (!config.inputs && !config.input)) return $t('rag.skill.transformInputRequired');
    if (step.type === 'transform' && !Array.isArray(config.operations)) return $t('rag.skill.transformOperationsRequired');
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
  form.value.intentType = res.data.definition?.intentType || 'knowledge';
  form.value.positiveExamples = examplesToText(res.data.definition?.positiveExamples);
  form.value.negativeExamples = examplesToText(res.data.definition?.negativeExamples);
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
      triggerKeywords: form.value.triggerKeywords,
      minScore: form.value.minScore,
      status: form.value.status,
      definition: definition()
    };
    if (isEdit.value) await fetchUpdateSkill(form.value.id, payload);
    else await fetchCreateSkill(payload);
    ElMessage.success($t(isEdit.value ? 'common.updateSuccess' : 'common.addSuccess'));
    dialogVisible.value = false;
    await loadData();
  } finally {
    saving.value = false;
  }
}

function buildPublishWarnings() {
  const warnings: string[] = [];
  if (!form.value.triggerKeywords?.trim()) warnings.push(t('rag.skill.missingTriggerWarning'));
  if (steps.value.some(step => step.type === 'api' && !step.params.length)) {
    warnings.push(t('rag.skill.apiParamWarning'));
  }
  if (steps.value.some(step => step.type === 'nl2sql' && !step.datasourceCode)) {
    warnings.push(t('rag.skill.nl2sqlDatasourceWarning'));
  }
  if (steps.value.some(step => step.type === 'llm' && !step.dependsOn.length && !step.outputSchema.trim())) {
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

function openMatchTest(row?: any) {
  matchQuery.value = row?.triggerKeywords ? formatKeywords(row.triggerKeywords).split(/[，,]/)[0] || '' : '';
  matchResult.value = null;
  matchDialogVisible.value = true;
}

async function runMatchTest() {
  if (!matchQuery.value.trim()) {
    ElMessage.warning(t('rag.skill.testQuestionRequired'));
    return;
  }
  matchLoading.value = true;
  try {
    const res = await fetchTestSkillMatch({ query: matchQuery.value.trim() });
    matchResult.value = res.data;
  } finally {
    matchLoading.value = false;
  }
}

function openRunTest(row?: any) {
  runTargetSkill.value = row || null;
  runQuery.value = '';
  runResult.value = null;
  runExecuteActions.value = false;
  runDialogVisible.value = true;
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
    const payload = runTargetSkill.value
      ? { skillId: runTargetSkill.value.id, query: runQuery.value.trim(), executeActions: runExecuteActions.value }
      : { definition: definition(), query: runQuery.value.trim(), executeActions: runExecuteActions.value };
    const res = await fetchRunSkillTest(payload);
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
</script>

<template>
  <div class="page-container h-full">
    <ElCard class="w-full">
      <ElAlert type="info" :closable="false" show-icon class="mb-4">
        <template #title>
          <div class="flex flex-wrap items-center gap-3">
            <span>{{ t('rag.skill.firstUseGuide') }}</span>
            <ElButton size="small" @click="goTo('/rag/datasource')">{{ t('rag.skill.quickDatasource') }}</ElButton>
            <ElButton size="small" @click="goTo('/rag/tool')">{{ t('rag.skill.quickTool') }}</ElButton>
            <ElButton size="small" type="primary" @click="goTo('/rag/chat')">{{ t('rag.skill.quickChat') }}</ElButton>
          </div>
        </template>
      </ElAlert>
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
      </div>
      <div class="mb-4 flex flex-wrap items-center gap-4">
        <ElButton type="primary" @click="openCreate">+ {{ $t('rag.common.create') }}</ElButton>
        <ElButton @click="openMatchTest()">{{ t('rag.skill.matchTest') }}</ElButton>
        <ElButton @click="goTo('/rag/bad-case')">{{ t('rag.skill.viewBadCase') }}</ElButton>
      </div>
      <ElTable v-loading="loading" :data="list" stripe border class="w-full">
        <ElTableColumn prop="name" :label="$t('rag.skill.name')" min-width="160" show-overflow-tooltip />
        <ElTableColumn prop="code" :label="$t('rag.skill.code')" min-width="140" show-overflow-tooltip />
        <ElTableColumn :label="$t('rag.skill.triggerKeywords')" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">{{ formatKeywords(row.triggerKeywords) }}</template>
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
            <ElButton link @click="openMatchTest(row)">{{ t('rag.skill.matchTest') }}</ElButton>
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
              <div class="flex w-full flex-wrap items-center gap-2">
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
            <ElFormItem :label="$t('rag.skill.triggerKeywords')">
              <template #label>
                <span>{{ $t('rag.skill.triggerKeywords') }}</span>
                <ConfigHelp
                  field
                  :title="$t('rag.skill.help.triggerTitle')"
                  :description="$t('rag.skill.help.triggerDescription')"
                  :examples="[$t('rag.skill.help.triggerExample')]"
                />
              </template>
              <ElInput v-model="form.triggerKeywords" :placeholder="$t('rag.skill.triggerPlaceholder')" />
            </ElFormItem>
            <ElFormItem :label="$t('rag.skill.intentType')">
              <ElSelect v-model="form.intentType" class="w-full">
                <ElOption :label="$t('rag.skill.intentTypes.knowledge')" value="knowledge" />
                <ElOption :label="$t('rag.skill.intentTypes.action')" value="action" />
                <ElOption :label="$t('rag.skill.intentTypes.composite')" value="composite" />
              </ElSelect>
              <div class="mt-1 text-xs text-gray-500">{{ $t('rag.skill.intentTypeHint') }}</div>
            </ElFormItem>
            <ElFormItem :label="$t('rag.skill.positiveExamples')">
              <ElInput
                v-model="form.positiveExamples"
                type="textarea"
                :rows="3"
                :placeholder="$t('rag.skill.positiveExamplesPlaceholder')"
              />
            </ElFormItem>
            <ElFormItem :label="$t('rag.skill.negativeExamples')">
              <ElInput
                v-model="form.negativeExamples"
                type="textarea"
                :rows="3"
                :placeholder="$t('rag.skill.negativeExamplesPlaceholder')"
              />
            </ElFormItem>
            <ElFormItem :label="$t('rag.skill.minScore')">
              <template #label>
                <span>{{ $t('rag.skill.minScore') }}</span>
                <ConfigHelp
                  field
                  :title="$t('rag.skill.help.scoreTitle')"
                  :description="$t('rag.skill.help.scoreDescription')"
                  :examples="['0.65']"
                />
              </template>
              <ElSlider v-model="form.minScore" :min="0.5" :max="1" :step="0.05" show-input />
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
          <ElEmpty v-if="!steps.length" :description="$t('rag.skill.noSteps')">
            <ElButton type="primary" @click="addStep">{{ $t('rag.skill.addStep') }}</ElButton>
          </ElEmpty>
          <div v-for="(step, index) in steps" :key="step.uid" class="mb-4 border rounded p-4">
            <div class="mb-4 flex items-center justify-between border-b pb-3">
              <div class="font-medium">
                {{ $t('rag.skill.stepNumber', { number: index + 1 }) }} ·
                {{ step.description || step.id }}
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
                    :examples="[skillHelpExamples.params]"
                  />
                </template>
                <div class="w-full space-y-2">
                  <div v-for="(row, rowIndex) in step.params" :key="rowIndex" class="border-b border-gray-200 pb-3">
                    <div class="mb-2 flex items-center gap-2">
                      <ElInput v-model="row.key" :placeholder="$t('rag.skill.paramName')" class="w-48" />
                      <ElRadioGroup v-model="row.mode" size="small">
                        <ElRadioButton value="literal">{{ $t('rag.skill.paramLiteral') }}</ElRadioButton>
                        <ElRadioButton value="binding">{{ $t('rag.skill.paramBinding') }}</ElRadioButton>
                      </ElRadioGroup>
                      <ElButton text circle type="danger" :title="$t('common.delete')" @click="step.params.splice(rowIndex, 1)">
                        <SvgIcon icon="mdi:close" />
                      </ElButton>
                    </div>
                    <ElInput
                      v-if="row.mode === 'literal'"
                      v-model="row.value"
                      :placeholder="$t('rag.skill.paramLiteralPlaceholder')"
                    />
                    <div v-else class="grid grid-cols-1 gap-2 md:grid-cols-3">
                      <ElSelect v-model="row.source" :placeholder="$t('rag.skill.bindingSource')">
                        <ElOption v-for="id in step.dependsOn" :key="id" :label="id" :value="id" />
                      </ElSelect>
                      <ElInput v-model="row.path" :placeholder="$t('rag.skill.bindingPath')" />
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
                  <ElButton @click="addRow(step.params)">+ {{ $t('rag.skill.addParameter') }}</ElButton>
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
                <div class="w-full space-y-2">
                  <div v-for="(row, rowIndex) in step.arguments" :key="rowIndex" class="flex gap-2">
                    <ElInput v-model="row.key" :placeholder="$t('rag.skill.paramName')" class="w-40" />
                    <ElInput v-model="row.value" :placeholder="$t('rag.skill.paramValue')" />
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
                  <ElButton @click="addRow(step.arguments)">+ {{ $t('rag.skill.addParameter') }}</ElButton>
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
                  :examples="[skillHelpExamples.foreach]"
                />
              </template>
              <ConfigCodeEditor
                v-model="step.rawConfig"
                :rows="10"
                expected-root="object"
                :example="skillHelpExamples.foreach"
              />
            </ElFormItem>
            <ElFormItem v-if="step.type === 'transform'">
              <template #label>
                <span>{{ $t('rag.skill.transformConfig') }}</span>
                <ConfigHelp
                  field
                  :title="$t('rag.skill.help.transformTitle')"
                  :description="$t('rag.skill.help.transformDescription')"
                  :examples="[skillHelpExamples.transform]"
                />
              </template>
              <div class="w-full space-y-2">
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
                  :examples="[outputSchemaExample]"
                />
              </template>
              <div class="w-full">
                <div class="mb-2 text-xs text-gray-500">{{ $t('rag.skill.outputSchemaHint') }}</div>
                <ConfigCodeEditor
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

    <ElDialog v-model="matchDialogVisible" :title="t('rag.skill.matchTest')" width="min(560px, 95vw)" align-center>
      <ElForm label-width="90px">
        <ElFormItem :label="t('rag.skill.testQuestion')">
          <ElInput v-model="matchQuery" type="textarea" :rows="3" :placeholder="t('rag.skill.testQuestionPlaceholder')" />
        </ElFormItem>
      </ElForm>
      <ElAlert
        v-if="matchResult"
        class="mb-3"
        :type="matchResult.matched ? 'success' : 'warning'"
        :closable="false"
        :title="
          matchResult.matched
            ? t('rag.skill.matchedResult', { name: matchResult.skillName, code: matchResult.skillCode, score: Number(matchResult.score || 0).toFixed(2) })
            : t('rag.skill.noMatch')
        "
      />
      <template #footer>
        <ElButton @click="matchDialogVisible = false">{{ t('rag.skill.close') }}</ElButton>
        <ElButton type="primary" :loading="matchLoading" @click="runMatchTest">{{ t('rag.skill.startTest') }}</ElButton>
      </template>
    </ElDialog>

    <ElDialog v-model="runDialogVisible" :title="t('rag.skill.runDialogTitle')" width="min(900px, 95vw)" align-center>
      <ElForm label-width="100px">
        <ElFormItem :label="t('rag.skill.testTarget')">
          <ElTag>{{ runTargetSkill?.name || t('rag.skill.currentEditingConfig') }}</ElTag>
        </ElFormItem>
        <ElFormItem :label="t('rag.skill.testQuestion')">
          <ElInput v-model="runQuery" type="textarea" :rows="3" :placeholder="t('rag.skill.runQuestionPlaceholder')" />
        </ElFormItem>
        <ElFormItem :label="t('rag.skill.executeActions')">
          <ElSwitch v-model="runExecuteActions" />
          <span class="ml-2 text-xs text-gray-500">{{ t('rag.skill.dryRunActionHint') }}</span>
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
              <pre class="max-h-56 overflow-auto whitespace-pre-wrap rounded bg-gray-50 p-2 text-xs">{{ shortOutput(row.output) }}</pre>
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

@media (max-width: 640px) {
  :deep(.skill-editor-dialog) {
    width: 96vw !important;
    max-height: 94vh;
  }

  :deep(.skill-editor-dialog .el-dialog__body) {
    padding-right: 12px;
    padding-left: 12px;
  }
}
</style>
