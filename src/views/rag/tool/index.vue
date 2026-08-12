<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  fetchCreateTool,
  fetchDeleteTool,
  fetchRagAclOptions,
  fetchTestTool,
  fetchToolDetail,
  fetchTools,
  fetchUpdateTool
} from '@/service/api/rag';
import { useAppStore } from '@/store/modules/app';
import { $t } from '@/locales';
import ConfigHelp from '../shared/config-help.vue';
import ConfigCodeEditor from '../shared/config-code-editor.vue';
import { authTypeLabel, operationTypeLabel, visibilityLabel } from '../shared/display';

defineOptions({ name: 'RagTool' });

const t = $t;
const appStore = useAppStore();
const list = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const size = ref(20);
const loading = ref(false);
const keyword = ref('');
const dialogVisible = ref(false);
const form = ref<any>({});
const isEdit = ref(false);
const activeTab = ref('basic');
const departments = ref<any[]>([]);
const posts = ref<any[]>([]);
const users = ref<any[]>([]);
const saving = ref(false);
const testDialogVisible = ref(false);
const testTool = ref<any>(null);
const testParams = ref('{}');
const testExecute = ref(false);
const testResult = ref<any>(null);
const testLoading = ref(false);
type ResponseView = 'formatted' | 'raw';
const responseView = ref<ResponseView>('formatted');
const responseViewOptions = computed(() => [
  { label: t('rag.editor.format'), value: 'formatted' as ResponseView },
  { label: t('rag.tool.rawView'), value: 'raw' as ResponseView }
]);
const originalAuthType = ref('none');
const authFields = ref({
  token: '',
  username: '',
  password: '',
  header: 'X-API-Key',
  value: '',
  accessKey: '',
  secretKey: ''
});
const requestHeaderPreset = ref('');
const requestHeaderPresetPlaceholder = computed(() =>
  appStore.locale === 'zh-CN' ? '选择标准请求头模板' : 'Select a standard request-header template'
);
const requestHeaderPresets = computed(() => [
  {
    value: 'accept-json',
    label: appStore.locale === 'zh-CN' ? '仅接收 JSON' : 'Accept JSON only',
    content: '{"Accept":"application/json"}'
  },
  {
    value: 'json',
    label: appStore.locale === 'zh-CN' ? 'JSON 请求' : 'JSON request',
    content: '{"Accept":"application/json","Content-Type":"application/json"}'
  },
  {
    value: 'form-url-encoded',
    label: appStore.locale === 'zh-CN' ? '表单请求' : 'URL-encoded form request',
    content: '{"Accept":"application/json","Content-Type":"application/x-www-form-urlencoded"}'
  },
  {
    value: 'xml',
    label: appStore.locale === 'zh-CN' ? 'XML 请求' : 'XML request',
    content: '{"Accept":"application/xml","Content-Type":"application/xml"}'
  },
  {
    value: 'text',
    label: appStore.locale === 'zh-CN' ? '纯文本请求' : 'Plain text request',
    content: '{"Accept":"text/plain","Content-Type":"text/plain"}'
  }
]);
const toolHelpExamples = {
  auth: 'Bearer: {"token":"your-token"}\nBasic: {"username":"api-user","password":"your-password"}\nAPI Key: {"header":"X-API-Key","value":"your-key"}\nAK/SK: {"accessKey":"your-ak","secretKey":"your-sk"}',
  request: '{"source":"easyagent","operation_reason":"{{reason}}"}',
  responseRule:
    '{"httpSuccessStatuses":[200,201],"successPath":"code","successOperator":"in","successValues":[0,"0","SUCCESS"],"messagePath":"message","dataPath":"data"}',
  response: '{"recordId":"id","recordName":"name","statusName":"status_name"}'
};
type BuilderMode = 'form' | 'json';
type RequestTemplateMode = BuilderMode | 'auto';

let builderItemKey = 0;
const paramSchemaMode = ref<BuilderMode>('form');
const requestTemplateMode = ref<RequestTemplateMode>('auto');
const responseRuleMode = ref<BuilderMode>('form');
const responseMappingMode = ref<BuilderMode>('form');
const paramRows = ref<any[]>([]);
const requestTemplateRows = ref<any[]>([]);
const responseMappingRows = ref<any[]>([]);
const paramSchemaRootExtra = ref<Record<string, any>>({ additionalProperties: false });
const responseRuleExtra = ref<Record<string, any>>({});
const responseRuleForm = ref({
  httpSuccessStatuses: [] as string[],
  checkBusinessStatus: false,
  successPath: '',
  successOperator: 'equals',
  successValues: [] as string[],
  messagePath: '',
  dataPath: ''
});
const parameterTypeOptions = ['string', 'integer', 'number', 'boolean', 'array', 'object'];
const parameterLocationOptions = computed(() => [
  { value: 'auto', label: t('rag.tool.parameterLocationAuto') },
  { value: 'query', label: 'Query' },
  { value: 'path', label: 'Path' },
  { value: 'body', label: 'Body' },
  { value: 'header', label: 'Header' }
]);
const responseOperatorOptions = computed(() => [
  { value: 'equals', label: t('rag.tool.responseOperatorEquals') },
  { value: 'in', label: t('rag.tool.responseOperatorIn') },
  { value: 'exists', label: t('rag.tool.responseOperatorExists') },
  { value: 'not_empty', label: t('rag.tool.responseOperatorNotEmpty') }
]);
const requestFixedTypeOptions = computed(() => [
  { value: 'string', label: t('rag.tool.requestFixedString') },
  { value: 'number', label: t('rag.tool.requestFixedNumber') },
  { value: 'boolean', label: t('rag.tool.requestFixedBoolean') },
  { value: 'json', label: 'JSON' }
]);

function nextBuilderItemKey() {
  builderItemKey += 1;
  return builderItemKey;
}

function createParamRow(value?: Partial<any>) {
  return {
    key: nextBuilderItemKey(),
    name: '',
    description: '',
    type: 'string',
    location: 'auto',
    httpName: '',
    required: false,
    enumValues: [] as string[],
    hasDefault: false,
    defaultValue: '',
    minimum: undefined as number | undefined,
    maximum: undefined as number | undefined,
    extra: {} as Record<string, any>,
    ...value
  };
}

function createRequestTemplateRow(value?: Partial<any>) {
  return {
    key: nextBuilderItemKey(),
    name: '',
    source: 'parameter',
    parameter: '',
    fixedValue: '',
    fixedType: 'string',
    ...value
  };
}

function createResponseMappingRow(value?: Partial<any>) {
  return {
    key: nextBuilderItemKey(),
    name: '',
    path: '',
    ...value
  };
}

function parseJsonObject(value?: string) {
  if (!value?.trim()) return undefined;
  const parsed = JSON.parse(value);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Expected JSON object');
  return parsed as Record<string, any>;
}

function parseEditorValue(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed;
  }
}

function omitKeys<T extends Record<string, any>>(value: T, keys: string[]) {
  return Object.fromEntries(Object.entries(value).filter(([key]) => !keys.includes(key)));
}

function inferFixedType(value: any) {
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  return 'string';
}

function loadParamSchemaEditor(value?: string) {
  paramRows.value = [];
  paramSchemaRootExtra.value = { additionalProperties: false };
  paramSchemaMode.value = 'form';
  if (!value?.trim()) return;
  try {
    const schema = parseJsonObject(value) || {};
    if (schema?.type && schema.type !== 'object' || schema?.properties && (typeof schema.properties !== 'object' || Array.isArray(schema.properties))) {
      paramSchemaMode.value = 'json';
      return;
    }
    const required = new Set(Array.isArray(schema?.required) ? schema.required.map(String) : []);
    const rootExtra = omitKeys(schema, ['type', 'properties', 'required']);
    paramSchemaRootExtra.value = rootExtra;
    Object.entries(schema?.properties || {}).forEach(([name, definition]) => {
      if (!definition || typeof definition !== 'object' || Array.isArray(definition)) {
        paramSchemaMode.value = 'json';
        return;
      }
      const property = definition as Record<string, any>;
      const extra = omitKeys(property, [
        'type',
        'description',
        'enum',
        'default',
        'minimum',
        'maximum',
        'x-in',
        'in',
        'x-http-name',
        'httpName'
      ]);
      const hasDefault = Object.hasOwn(property, 'default');
      paramRows.value.push(
        createParamRow({
          name,
          description: typeof property.description === 'string' ? property.description : '',
          type: typeof property.type === 'string' ? property.type : 'string',
          location: property['x-in'] || property.in || 'auto',
          httpName: property['x-http-name'] || property.httpName || '',
          required: required.has(name),
          enumValues: Array.isArray(property.enum) ? property.enum.map(item => JSON.stringify(item)) : [],
          hasDefault,
          defaultValue: hasDefault ? JSON.stringify(property.default) : '',
          minimum: typeof property.minimum === 'number' ? property.minimum : undefined,
          maximum: typeof property.maximum === 'number' ? property.maximum : undefined,
          extra
        })
      );
    });
  } catch {
    paramSchemaMode.value = 'json';
  }
}

function loadRequestTemplateEditor(value?: string) {
  requestTemplateRows.value = [];
  requestTemplateMode.value = 'auto';
  if (!value?.trim()) return;
  try {
    const template = parseJsonObject(value);
    for (const [name, rawValue] of Object.entries(template || {})) {
      if (rawValue && typeof rawValue === 'object') {
        requestTemplateMode.value = 'json';
        return;
      }
      const placeholder = typeof rawValue === 'string' ? rawValue.match(/^{{([^{}]+)}}$/) : undefined;
      const fixedType = inferFixedType(rawValue);
      requestTemplateRows.value.push(
        createRequestTemplateRow({
          name,
          source: placeholder ? 'parameter' : 'fixed',
          parameter: placeholder?.[1] || '',
          fixedValue: placeholder ? '' : String(rawValue ?? ''),
          fixedType
        })
      );
    }
    requestTemplateMode.value = 'form';
  } catch {
    requestTemplateMode.value = 'json';
  }
}

function loadResponseRuleEditor(value?: string) {
  responseRuleMode.value = 'form';
  responseRuleExtra.value = {};
  responseRuleForm.value = {
    httpSuccessStatuses: [],
    checkBusinessStatus: false,
    successPath: '',
    successOperator: 'equals',
    successValues: [],
    messagePath: '',
    dataPath: ''
  };
  if (!value?.trim()) return;
  try {
    const rule = parseJsonObject(value) || {};
    const extra = omitKeys(rule, ['httpSuccessStatuses', 'successPath', 'successOperator', 'successValues', 'messagePath', 'dataPath']);
    responseRuleExtra.value = extra;
    responseRuleForm.value = {
      httpSuccessStatuses: Array.isArray(rule?.httpSuccessStatuses) ? rule.httpSuccessStatuses.map(String) : [],
      checkBusinessStatus: Boolean(rule?.successPath),
      successPath: typeof rule?.successPath === 'string' ? rule.successPath : '',
      successOperator: typeof rule?.successOperator === 'string' ? rule.successOperator : 'equals',
      successValues: Array.isArray(rule?.successValues) ? rule.successValues.map(item => JSON.stringify(item)) : [],
      messagePath: typeof rule?.messagePath === 'string' ? rule.messagePath : '',
      dataPath: typeof rule?.dataPath === 'string' ? rule.dataPath : ''
    };
  } catch {
    responseRuleMode.value = 'json';
  }
}

function loadResponseMappingEditor(value?: string) {
  responseMappingRows.value = [];
  responseMappingMode.value = 'form';
  if (!value?.trim()) return;
  try {
    const mapping = parseJsonObject(value);
    if (Object.values(mapping || {}).some(path => typeof path !== 'string')) {
      responseMappingMode.value = 'json';
      return;
    }
    responseMappingRows.value = Object.entries(mapping || {}).map(([name, path]) =>
      createResponseMappingRow({ name, path })
    );
  } catch {
    responseMappingMode.value = 'json';
  }
}

function loadStructuredEditors() {
  loadParamSchemaEditor(form.value.paramSchema);
  loadRequestTemplateEditor(form.value.requestTemplate);
  loadResponseRuleEditor(form.value.responseRule);
  loadResponseMappingEditor(form.value.responseMapping);
}

function serializeParamSchema() {
  if (!paramRows.value.length) return '';
  const names = new Set<string>();
  const required: string[] = [];
  const properties: Record<string, any> = {};
  for (const row of paramRows.value) {
    const name = row.name.trim();
    if (!name) throw new Error(t('rag.tool.parameterNameRequired'));
    if (names.has(name)) throw new Error(t('rag.tool.parameterNameDuplicate'));
    if (row.location === 'path' && !form.value.urlTemplate?.includes(`{{${name}}}`)) {
      throw new Error(t('rag.tool.pathParameterMissing', { name }));
    }
    names.add(name);
    const property: Record<string, any> = { ...row.extra, type: row.type || 'string' };
    if (row.description.trim()) property.description = row.description.trim();
    if (row.location !== 'auto') property['x-in'] = row.location;
    if (row.httpName.trim()) property['x-http-name'] = row.httpName.trim();
    const enumValues = row.enumValues.map((value: string) => parseEditorValue(value)).filter((value: any) => value !== '');
    if (enumValues.length) property.enum = enumValues;
    if (row.hasDefault) property.default = parseEditorValue(row.defaultValue);
    if (typeof row.minimum === 'number') property.minimum = row.minimum;
    if (typeof row.maximum === 'number') property.maximum = row.maximum;
    if (row.required) required.push(name);
    properties[name] = property;
  }
  const schema: Record<string, any> = { ...paramSchemaRootExtra.value, type: 'object', properties };
  if (required.length) schema.required = required;
  return JSON.stringify(schema);
}

function serializeRequestTemplate() {
  if (requestTemplateMode.value === 'auto' || !requestTemplateRows.value.length) return '';
  const template: Record<string, any> = {};
  for (const row of requestTemplateRows.value) {
    const name = row.name.trim();
    if (!name) throw new Error(t('rag.tool.requestTemplateIncomplete'));
    if (Object.hasOwn(template, name)) throw new Error(t('rag.tool.requestTemplateDuplicate'));
    if (row.source === 'parameter') {
      if (!row.parameter) throw new Error(t('rag.tool.requestTemplateIncomplete'));
      template[name] = `{{${row.parameter}}}`;
    } else if (row.fixedType === 'number') {
      const value = Number(row.fixedValue);
      if (!Number.isFinite(value)) throw new Error(t('rag.tool.requestTemplateIncomplete'));
      template[name] = value;
    } else if (row.fixedType === 'boolean') {
      if (!['true', 'false'].includes(row.fixedValue)) throw new Error(t('rag.tool.requestTemplateIncomplete'));
      template[name] = row.fixedValue === 'true';
    } else if (row.fixedType === 'json') {
      try {
        template[name] = JSON.parse(row.fixedValue);
      } catch {
        throw new Error(t('rag.tool.requestTemplateIncomplete'));
      }
    } else {
      template[name] = row.fixedValue;
    }
  }
  return JSON.stringify(template);
}

function serializeResponseRule() {
  const hasConfig =
    responseRuleForm.value.httpSuccessStatuses.length > 0 ||
    responseRuleForm.value.checkBusinessStatus ||
    responseRuleForm.value.messagePath.trim() ||
    responseRuleForm.value.dataPath.trim();
  if (!hasConfig) return '';
  const rule: Record<string, any> = { ...responseRuleExtra.value };
  const statuses = responseRuleForm.value.httpSuccessStatuses.filter(Boolean).map(value => Number(value));
  if (statuses.some(value => !Number.isInteger(value) || value < 100 || value > 599)) {
    throw new Error(t('rag.tool.responseStatusInvalid'));
  }
  if (statuses.length) rule.httpSuccessStatuses = statuses;
  if (responseRuleForm.value.checkBusinessStatus) {
    const successPath = responseRuleForm.value.successPath.trim();
    if (!successPath) throw new Error(t('rag.tool.responseRuleIncomplete'));
    rule.successPath = successPath;
    rule.successOperator = responseRuleForm.value.successOperator;
    if (['equals', 'in'].includes(rule.successOperator)) {
      const values = responseRuleForm.value.successValues.map(parseEditorValue).filter(value => value !== '');
      if (!values.length) throw new Error(t('rag.tool.responseRuleIncomplete'));
      rule.successValues = values;
    }
  }
  if (responseRuleForm.value.messagePath.trim()) rule.messagePath = responseRuleForm.value.messagePath.trim();
  if (responseRuleForm.value.dataPath.trim()) rule.dataPath = responseRuleForm.value.dataPath.trim();
  return JSON.stringify(rule);
}

function serializeResponseMapping() {
  if (!responseMappingRows.value.length) return '';
  const mapping: Record<string, string> = {};
  for (const row of responseMappingRows.value) {
    const name = row.name.trim();
    const path = row.path.trim();
    if (!name || !path) throw new Error(t('rag.tool.responseMappingIncomplete'));
    if (Object.hasOwn(mapping, name)) throw new Error(t('rag.tool.responseMappingDuplicate'));
    mapping[name] = path;
  }
  return JSON.stringify(mapping);
}

function buildStructuredFields() {
  return {
    paramSchema: paramSchemaMode.value === 'form' ? serializeParamSchema() : form.value.paramSchema,
    requestTemplate:
      requestTemplateMode.value === 'json' ? form.value.requestTemplate : serializeRequestTemplate(),
    responseRule: responseRuleMode.value === 'form' ? serializeResponseRule() : form.value.responseRule,
    responseMapping: responseMappingMode.value === 'form' ? serializeResponseMapping() : form.value.responseMapping
  };
}

function switchParamSchemaMode(mode: BuilderMode) {
  if (mode === 'form') {
    loadParamSchemaEditor(form.value.paramSchema);
    return;
  }
  try {
    form.value.paramSchema = serializeParamSchema();
    paramSchemaMode.value = 'json';
  } catch (error: any) {
    ElMessage.warning(error.message);
    paramSchemaMode.value = 'form';
  }
}

function switchRequestTemplateMode(mode: RequestTemplateMode) {
  if (mode === 'form') {
    loadRequestTemplateEditor(form.value.requestTemplate);
    requestTemplateMode.value = 'form';
    return;
  }
  if (mode === 'json') {
    try {
      form.value.requestTemplate = serializeRequestTemplate();
    } catch (error: any) {
      ElMessage.warning(error.message);
      requestTemplateMode.value = 'form';
      return;
    }
  }
  requestTemplateMode.value = mode;
}

function switchResponseRuleMode(mode: BuilderMode) {
  if (mode === 'form') {
    loadResponseRuleEditor(form.value.responseRule);
    return;
  }
  try {
    form.value.responseRule = serializeResponseRule();
    responseRuleMode.value = 'json';
  } catch (error: any) {
    ElMessage.warning(error.message);
    responseRuleMode.value = 'form';
  }
}

function switchResponseMappingMode(mode: BuilderMode) {
  if (mode === 'form') {
    loadResponseMappingEditor(form.value.responseMapping);
    return;
  }
  try {
    form.value.responseMapping = serializeResponseMapping();
    responseMappingMode.value = 'json';
  } catch (error: any) {
    ElMessage.warning(error.message);
    responseMappingMode.value = 'form';
  }
}
const toolSchemaExample = computed(() =>
  appStore.locale === 'zh-CN'
    ? `{
  "type": "object",
  "additionalProperties": false,
  "required": ["orderNo"],
  "properties": {
    "orderNo": {
      "type": "string",
      "description": "订单编号",
      "x-in": "path",
      "x-http-name": "orderNo"
    },
    "status": {
      "type": "string",
      "description": "订单状态",
      "enum": ["PAID", "SHIPPED", "COMPLETED"],
      "x-in": "query",
      "x-http-name": "order_status"
    },
    "page": {
      "type": "integer",
      "description": "页码，从 1 开始",
      "minimum": 1,
      "default": 1,
      "x-in": "query"
    },
    "reason": {
      "type": "string",
      "description": "操作原因",
      "minLength": 2,
      "maxLength": 200,
      "x-in": "body",
      "x-http-name": "operation_reason"
    },
    "requestId": {
      "type": "string",
      "description": "调用方请求编号",
      "x-in": "header",
      "x-http-name": "X-Request-Id"
    }
  }
}`
    : `{
  "type": "object",
  "additionalProperties": false,
  "required": ["orderNo"],
  "properties": {
    "orderNo": {
      "type": "string",
      "description": "Order number",
      "x-in": "path",
      "x-http-name": "orderNo"
    },
    "status": {
      "type": "string",
      "description": "Order status",
      "enum": ["PAID", "SHIPPED", "COMPLETED"],
      "x-in": "query",
      "x-http-name": "order_status"
    },
    "page": {
      "type": "integer",
      "description": "Page number starting from 1",
      "minimum": 1,
      "default": 1,
      "x-in": "query"
    },
    "reason": {
      "type": "string",
      "description": "Reason for the operation",
      "minLength": 2,
      "maxLength": 200,
      "x-in": "body",
      "x-http-name": "operation_reason"
    },
    "requestId": {
      "type": "string",
      "description": "Caller request ID",
      "x-in": "header",
      "x-http-name": "X-Request-Id"
    }
  }
}`
);
const toolParameters = computed(() => [
  {
    name: t('rag.tool.name'),
    description: t('rag.configFields.tool.fields.name'),
    example: t('rag.configFields.tool.fieldExamples.name'),
    required: true
  },
  {
    name: t('rag.tool.code'),
    description: t('rag.configFields.tool.fields.code'),
    example: 'query_records',
    required: true
  },
  {
    name: t('rag.tool.description'),
    description: t('rag.configFields.tool.fields.description'),
    example: t('rag.configFields.tool.fieldExamples.description')
  },
  {
    name: t('rag.tool.urlTemplate'),
    description: t('rag.configFields.tool.fields.urlTemplate'),
    example: 'https://api.example.com/v1/orders/{{orderNo}}',
    required: true
  },
  {
    name: t('rag.tool.method'),
    description: t('rag.configFields.tool.fields.httpMethod'),
    example: 'GET',
    required: true
  },
  {
    name: t('rag.tool.operationType'),
    description: t('rag.configFields.tool.fields.operationType'),
    example: 'query',
    required: true
  },
  {
    name: t('rag.tool.visibility'),
    description: t('rag.configFields.tool.fields.visibility'),
    example: 'department',
    required: true
  },
  {
    name: t('rag.configFields.tool.fieldExamples.aclSubjectName'),
    description: t('rag.configFields.tool.fields.aclSubject'),
    example: t('rag.configFields.tool.fieldExamples.aclSubject')
  },
  {
    name: t('rag.tool.timeout'),
    description: t('rag.configFields.tool.fields.timeout'),
    example: '10',
    required: true
  },
  {
    name: t('rag.tool.retryCount'),
    description: t('rag.configFields.tool.fields.retryCount'),
    example: '0',
    required: true
  },
  {
    name: t('rag.common.status'),
    description: t('rag.configFields.tool.fields.status'),
    example: t('common.on'),
    required: true
  },
  {
    name: t('rag.tool.authType'),
    description: t('rag.configFields.tool.fields.authType'),
    example: 'api_key',
    required: true
  },
  {
    name: t('rag.tool.authConfig'),
    description: t('rag.configFields.tool.fields.authConfig'),
    example: '{"header":"X-API-Key","value":"your-key"}'
  },
  {
    name: t('rag.tool.identityPropagation'),
    description: t('rag.configFields.tool.fields.identityPropagation'),
    example: t('common.off'),
    required: true
  },
  {
    name: t('rag.tool.identityHeaderName'),
    description: t('rag.configFields.tool.fields.identityHeaderName'),
    example: 'X-Platform-User-Context'
  },
  {
    name: t('rag.tool.paramSchema'),
    description: t('rag.configFields.tool.fields.paramSchema'),
    example: toolSchemaExample.value
  },
  {
    name: t('rag.tool.requestHeaders'),
    description: t('rag.configFields.tool.fields.requestHeaders'),
    example: '{"Accept":"application/json"}'
  },
  {
    name: t('rag.tool.requestTemplate'),
    description: t('rag.configFields.tool.fields.requestTemplate'),
    example: toolHelpExamples.request
  },
  {
    name: t('rag.responseRule'),
    description: t('rag.configFields.tool.fields.responseRule'),
    example: toolHelpExamples.responseRule
  },
  {
    name: t('rag.tool.responseMapping'),
    description: t('rag.configFields.tool.fields.responseMapping'),
    example: toolHelpExamples.response
  }
]);

onMounted(() => {
  loadData();
  loadAclOptions();
});

async function loadAclOptions() {
  const res = await fetchRagAclOptions();
  departments.value = res.data?.departments || [];
  posts.value = res.data?.posts || [];
  users.value = res.data?.users || [];
}

async function loadData() {
  loading.value = true;
  try {
    const res = await fetchTools({
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
function openCreate() {
  isEdit.value = false;
  form.value = {
    httpMethod: 'GET',
    operationType: 'query',
    authType: 'none',
    visibility: 'public',
    identityPropagation: 0,
    identityHeaderName: 'X-Platform-User-Context',
    timeout: 10,
    retryCount: 0,
    status: 1
  };
  originalAuthType.value = 'none';
  resetAuthFields();
  requestHeaderPreset.value = '';
  activeTab.value = 'basic';
  loadStructuredEditors();
  dialogVisible.value = true;
}
async function openEdit(row: any) {
  isEdit.value = true;
  const res = await fetchToolDetail(row.id);
  form.value = { ...res.data, authConfig: '' };
  originalAuthType.value = form.value.authType || 'none';
  resetAuthFields();
  requestHeaderPreset.value = '';
  activeTab.value = 'basic';
  loadStructuredEditors();
  dialogVisible.value = true;
}
async function save() {
  if (!form.value.name?.trim() || !form.value.code?.trim() || !form.value.urlTemplate?.trim()) {
    ElMessage.warning(t('rag.tool.requiredFields'));
    return;
  }
  let authConfig: string | undefined;
  try {
    authConfig = buildAuthConfig();
  } catch (error: any) {
    ElMessage.warning(error.message);
    activeTab.value = 'auth';
    return;
  }
  let structuredFields: Record<string, string>;
  try {
    structuredFields = buildStructuredFields();
  } catch (error: any) {
    ElMessage.warning(error.message);
    activeTab.value = 'params';
    return;
  }
  const payload = { ...form.value, ...structuredFields };
  for (const [field, value] of [
    [t('rag.tool.paramSchema'), payload.paramSchema],
    [t('rag.tool.requestHeaders'), form.value.requestHeaders],
    [t('rag.tool.requestTemplate'), payload.requestTemplate],
    [t('rag.responseRule'), payload.responseRule],
    [t('rag.tool.responseMapping'), payload.responseMapping]
  ]) {
    if (value) {
      try {
        JSON.parse(value);
      } catch {
        ElMessage.warning(t('rag.common.invalidJson', { field }));
        return;
      }
    }
  }
  saving.value = true;
  try {
    delete payload.authConfig;
    if (authConfig) payload.authConfig = authConfig;
    if (isEdit.value) await fetchUpdateTool(payload.id, payload);
    else await fetchCreateTool(payload);
    ElMessage.success(t(isEdit.value ? 'common.updateSuccess' : 'common.addSuccess'));
    dialogVisible.value = false;
    await loadData();
  } finally {
    saving.value = false;
  }
}

function resetAuthFields() {
  authFields.value = {
    token: '',
    username: '',
    password: '',
    header: 'X-API-Key',
    value: '',
    accessKey: '',
    secretKey: ''
  };
}

function handleAuthTypeChange() {
  resetAuthFields();
}

function applyRequestHeaderPreset(value?: string) {
  const preset = requestHeaderPresets.value.find(item => item.value === value);
  if (preset) form.value.requestHeaders = preset.content;
}

function buildAuthConfig() {
  const type = form.value.authType || 'none';
  if (type === 'none') return undefined;
  const fields = authFields.value;
  const valuesByType: Record<string, Record<string, string>> = {
    bearer: { token: fields.token.trim() },
    basic: { username: fields.username.trim(), password: fields.password },
    api_key: {
      header: fields.header.trim() || 'X-API-Key',
      value: fields.value
    },
    hmac_ak_sk: {
      accessKey: fields.accessKey.trim(),
      secretKey: fields.secretKey
    }
  };
  const values = valuesByType[type];
  if (!values) throw new Error(t('rag.tool.unsupportedAuthType'));
  const hasCredential = Object.entries(values).some(([key, value]) => key !== 'header' && Boolean(value));
  if (isEdit.value && type === originalAuthType.value && !hasCredential) return undefined;
  const missing = Object.entries(values).find(([, value]) => !value);
  if (missing) {
    const fieldLabels = {
      token: t('rag.tool.authFields.token'),
      username: t('rag.tool.authFields.username'),
      password: t('rag.tool.authFields.password'),
      header: t('rag.tool.authFields.header'),
      value: t('rag.tool.authFields.value'),
      accessKey: t('rag.tool.authFields.accessKey'),
      secretKey: t('rag.tool.authFields.secretKey')
    };
    throw new Error(
      t('rag.tool.authFieldRequired', {
        field: fieldLabels[missing[0] as keyof typeof fieldLabels]
      })
    );
  }
  return JSON.stringify(values);
}
async function deleteItem(row: any) {
  await ElMessageBox.confirm(t('rag.tool.deleteConfirm'), t('common.tip'), {
    type: 'warning'
  });
  await fetchDeleteTool(row.id);
  ElMessage.success(t('common.deleteSuccess'));
  await loadData();
}
function resetSearch() {
  keyword.value = '';
  page.value = 1;
  loadData();
}

async function openToolTest(row: any) {
  const res = await fetchToolDetail(row.id);
  testTool.value = res.data || row;
  testParams.value = defaultParamsFromSchema(testTool.value.paramSchema);
  testExecute.value = false;
  testResult.value = null;
  responseView.value = 'formatted';
  testDialogVisible.value = true;
}

function defaultParamsFromSchema(schemaText?: string) {
  if (!schemaText) return '{}';
  try {
    const schema = JSON.parse(schemaText);
    const properties = schema?.properties && typeof schema.properties === 'object' ? schema.properties : {};
    const required = Array.isArray(schema?.required) ? schema.required : Object.keys(properties);
    const params: Record<string, any> = {};
    required.forEach((key: string) => {
      const type = properties[key]?.type;
      if (type === 'integer' || type === 'number') params[key] = 1;
      else if (type === 'boolean') params[key] = true;
      else if (type === 'array') params[key] = [];
      else if (type === 'object') params[key] = {};
      else params[key] = '';
    });
    return JSON.stringify(params, null, 2);
  } catch {
    return '{}';
  }
}

async function runToolTest() {
  if (!testTool.value?.id) return;
  let params: Record<string, any>;
  try {
    params = JSON.parse(testParams.value || '{}');
    if (!params || typeof params !== 'object' || Array.isArray(params)) throw new Error('Expected JSON object');
  } catch {
    ElMessage.warning(t('rag.common.invalidJson', { field: t('rag.skill.parameters') }));
    return;
  }
  if (testExecute.value && testTool.value.operationType === 'action') {
    try {
      await ElMessageBox.confirm(t('rag.tool.realActionConfirm'), t('rag.tool.realActionConfirmTitle'), {
        type: 'warning',
        confirmButtonText: t('rag.tool.confirmExecute'),
        cancelButtonText: t('rag.common.cancel')
      });
    } catch {
      return;
    }
  }
  testLoading.value = true;
  try {
    const res = await fetchTestTool(testTool.value.id, {
      params,
      execute: testExecute.value
    });
    testResult.value = res.data;
    responseView.value = 'formatted';
  } finally {
    testLoading.value = false;
  }
}

function formatPreview(value: any) {
  if (value === undefined || value === null || value === '') return '-';
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2);
}

const responsePayload = computed<{ valid: boolean; value: any }>(() => {
  const output = testResult.value?.output;
  if (output === undefined || output === null || output === '') return { valid: false, value: output };
  if (typeof output !== 'string') return { valid: true, value: output };
  try {
    return { valid: true, value: JSON.parse(output) };
  } catch {
    return { valid: false, value: output };
  }
});

const responseDisplay = computed(() => {
  const output = testResult.value?.output;
  if (output === undefined || output === null || output === '') return '-';
  if (responseView.value === 'formatted' && responsePayload.value.valid) {
    return JSON.stringify(responsePayload.value.value, null, 2);
  }
  return formatPreview(output);
});
</script>

<template>
  <div class="page-container h-full">
    <ElCard class="w-full">
      <div class="mb-4 flex flex-wrap items-center gap-4">
        <ElInput
          v-model="keyword"
          :placeholder="t('rag.common.keywordPlaceholder')"
          clearable
          class="w-48"
          @keyup.enter="loadData"
        />
        <ElButton type="primary" @click="loadData">{{ t('rag.common.search') }}</ElButton>
        <ElButton @click="resetSearch">{{ t('common.reset') }}</ElButton>
      </div>
      <div class="mb-4 flex flex-wrap items-center gap-4">
        <ElButton type="primary" @click="openCreate">+ {{ t('rag.common.create') }}</ElButton>
      </div>
      <ElTable v-loading="loading" :data="list" stripe border class="w-full" :empty-text="t('rag.tool.emptyHint')">
          <ElTableColumn prop="name" :label="t('rag.tool.name')" min-width="150" />
          <ElTableColumn prop="code" :label="t('rag.tool.code')" min-width="120" />
          <ElTableColumn prop="httpMethod" :label="t('rag.tool.method')" width="70" />
          <ElTableColumn :label="t('rag.tool.operationType')" width="90">
            <template #default="{ row }">{{ operationTypeLabel(row.operationType) }}</template>
          </ElTableColumn>
          <ElTableColumn :label="t('rag.tool.authType')" width="100">
            <template #default="{ row }">{{ authTypeLabel(row.authType) }}</template>
          </ElTableColumn>
          <ElTableColumn :label="t('rag.tool.visibility')" width="110">
            <template #default="{ row }">{{ visibilityLabel(row.visibility) }}</template>
          </ElTableColumn>
          <ElTableColumn :label="t('rag.tool.urlTemplate')" min-width="200">
            <template #default="{ row }">
              <span class="tool-url-cell" :title="row.urlTemplate">{{ row.urlTemplate }}</span>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="timeout" :label="t('rag.tool.timeout')" width="80" />
          <ElTableColumn :label="t('rag.common.status')" width="70">
            <template #default="{ row }">
              <ElTag :type="row.status === 1 ? 'success' : 'danger'" size="small">
                {{ row.status === 1 ? t('common.on') : t('common.off') }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn :label="t('rag.common.action')" width="170" fixed="right" align="center">
            <template #default="{ row }">
              <ElButton size="small" link type="primary" @click="openToolTest(row)">
                {{ t('rag.tool.startTest') }}
              </ElButton>
              <ElButton size="small" link @click="openEdit(row)">{{ t('rag.common.edit') }}</ElButton>
              <ElButton size="small" link type="danger" @click="deleteItem(row)">{{ t('rag.common.delete') }}</ElButton>
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
      width="min(1280px, 96vw)"
      class="config-editor-dialog tool-config-dialog"
      align-center
    >
      <template #header>
        <div class="flex items-center">
          <span class="text-base font-medium">{{ isEdit ? t('common.edit') : t('common.create') }}</span>
          <ConfigHelp
            :title="t('rag.configHelp.tool.title')"
            :description="t('rag.configHelp.tool.description')"
            :examples="[t('rag.configHelp.tool.example')]"
            :parameters="toolParameters"
            :steps="[
              t('rag.configHelp.tool.step1'),
              t('rag.configHelp.tool.step2'),
              t('rag.configFields.tool.step3'),
              t('rag.configHelp.tool.step4'),
              t('rag.configHelp.tool.step5'),
              t('rag.configHelp.tool.step6'),
              t('rag.configHelp.tool.step7')
            ]"
            :rules="[
              t('rag.configHelp.tool.rule1'),
              t('rag.configHelp.tool.rule2'),
              t('rag.configHelp.tool.rule3'),
              t('rag.configHelp.tool.rule4')
            ]"
            :effects="[t('rag.configHelp.tool.effect1'), t('rag.configHelp.tool.effect2')]"
            :notes="[t('rag.configHelp.tool.note1'), t('rag.configHelp.tool.note2'), t('rag.configHelp.tool.note3')]"
          />
        </div>
      </template>
      <ElTabs v-model="activeTab">
        <ElTabPane :label="t('rag.tool.basicInfo')" name="basic">
          <ElForm :model="form" label-width="160px" class="mt-2">
            <ElFormItem :label="t('rag.tool.name')">
              <ElInput v-model="form.name" :placeholder="t('rag.tool.namePlaceholder')" />
            </ElFormItem>
            <ElFormItem :label="t('rag.tool.code')">
              <ElInput v-model="form.code" :disabled="isEdit" :placeholder="t('rag.tool.codePlaceholder')" />
            </ElFormItem>
            <ElFormItem :label="t('rag.tool.description')">
              <ElInput
                v-model="form.description"
                type="textarea"
                :rows="2"
                :placeholder="t('rag.tool.descriptionPlaceholder')"
              />
            </ElFormItem>
            <ElFormItem :label="t('rag.tool.urlTemplate')">
              <ElInput v-model="form.urlTemplate" :placeholder="t('rag.tool.urlPlaceholder')" />
            </ElFormItem>
            <ElFormItem :label="t('rag.tool.method')">
              <ElSelect v-model="form.httpMethod" class="w-full">
                <ElOption v-for="m in ['GET', 'POST', 'PUT', 'DELETE']" :key="m" :label="m" :value="m" />
              </ElSelect>
            </ElFormItem>
            <ElFormItem :label="t('rag.tool.operationType')">
              <template #label>
                <span>{{ t('rag.tool.operationType') }}</span>
                <ConfigHelp
                  field
                  :title="t('rag.configHelp.tool.operationTitle')"
                  :description="t('rag.configHelp.tool.operationDescription')"
                />
              </template>
              <ElSegmented
                v-model="form.operationType"
                :options="[
                  { label: t('rag.tool.query'), value: 'query' },
                  { label: t('rag.tool.actionType'), value: 'action' }
                ]"
              />
            </ElFormItem>
            <ElFormItem :label="t('rag.tool.visibility')">
              <ElSelect v-model="form.visibility" class="w-full">
                <ElOption
                  v-for="v in ['public', 'department', 'post', 'user']"
                  :key="v"
                  :label="visibilityLabel(v)"
                  :value="v"
                />
              </ElSelect>
            </ElFormItem>
            <ElFormItem v-if="form.visibility === 'department'" :label="t('rag.tool.department')">
              <ElSelect
                v-model="form.departmentId"
                filterable
                class="w-full"
                :placeholder="t('rag.tool.departmentPlaceholder')"
              >
                <ElOption v-for="item in departments" :key="item.id" :label="item.name" :value="item.id" />
              </ElSelect>
            </ElFormItem>
            <ElFormItem v-if="form.visibility === 'post'" :label="t('rag.tool.post')">
              <ElSelect v-model="form.postId" filterable class="w-full" :placeholder="t('rag.tool.postPlaceholder')">
                <ElOption v-for="post in posts" :key="post.id" :label="post.name" :value="post.id" />
              </ElSelect>
            </ElFormItem>
            <ElFormItem v-if="form.visibility === 'user'" :label="t('rag.tool.user')">
              <ElSelect v-model="form.userId" filterable class="w-full" :placeholder="t('rag.tool.userPlaceholder')">
                <ElOption v-for="user in users" :key="user.id" :label="user.name" :value="user.id" />
              </ElSelect>
            </ElFormItem>
            <ElFormItem :label="t('rag.tool.timeout')">
              <ElInputNumber v-model="form.timeout" :min="1" :max="60" />
            </ElFormItem>
            <ElFormItem :label="t('rag.tool.retryCount')">
              <ElInputNumber v-model="form.retryCount" :min="0" :max="2" />
            </ElFormItem>
            <ElFormItem :label="t('rag.common.status')">
              <ElSwitch v-model="form.status" :active-value="1" :inactive-value="0" />
            </ElFormItem>
          </ElForm>
        </ElTabPane>
        <ElTabPane :label="t('rag.tool.authConfig')" name="auth">
          <ElForm :model="form" label-width="160px" class="mt-2">
            <ElFormItem :label="t('rag.tool.authType')">
              <ElSelect v-model="form.authType" @change="handleAuthTypeChange">
                <ElOption
                  v-for="a in ['none', 'bearer', 'basic', 'api_key', 'hmac_ak_sk']"
                  :key="a"
                  :label="authTypeLabel(a)"
                  :value="a"
                />
              </ElSelect>
            </ElFormItem>
            <ElAlert
              v-if="isEdit && form.authType !== 'none' && form.authType === originalAuthType"
              :title="t('rag.tool.credentialKeepHint')"
              type="info"
              :closable="false"
              show-icon
              class="mb-3"
            />
            <template v-if="form.authType !== 'none'">
              <div class="mb-2 flex items-center text-sm font-medium">
                <span>{{ t('rag.tool.authConfig') }}</span>
                <ConfigHelp
                  field
                  :title="t('rag.configHelp.tool.authTitle')"
                  :description="t('rag.configFields.tool.authDescription')"
                  :examples="[toolHelpExamples.auth]"
                />
              </div>
              <ElFormItem v-if="form.authType === 'bearer'" :label="t('rag.tool.authFields.token')">
                <ElInput v-model="authFields.token" type="password" show-password autocomplete="new-password" />
              </ElFormItem>
              <template v-if="form.authType === 'basic'">
                <ElFormItem :label="t('rag.tool.authFields.username')">
                  <ElInput v-model="authFields.username" autocomplete="off" />
                </ElFormItem>
                <ElFormItem :label="t('rag.tool.authFields.password')">
                  <ElInput v-model="authFields.password" type="password" show-password autocomplete="new-password" />
                </ElFormItem>
              </template>
              <template v-if="form.authType === 'api_key'">
                <ElFormItem :label="t('rag.tool.authFields.header')">
                  <ElInput v-model="authFields.header" placeholder="X-API-Key" />
                </ElFormItem>
                <ElFormItem :label="t('rag.tool.authFields.value')">
                  <ElInput v-model="authFields.value" type="password" show-password autocomplete="new-password" />
                </ElFormItem>
              </template>
              <template v-if="form.authType === 'hmac_ak_sk'">
                <ElFormItem :label="t('rag.tool.authFields.accessKey')">
                  <ElInput v-model="authFields.accessKey" autocomplete="off" />
                </ElFormItem>
                <ElFormItem :label="t('rag.tool.authFields.secretKey')">
                  <ElInput v-model="authFields.secretKey" type="password" show-password autocomplete="new-password" />
                </ElFormItem>
              </template>
            </template>
            <ElFormItem :label="t('rag.tool.identityPropagation')">
              <ElSwitch v-model="form.identityPropagation" :active-value="1" :inactive-value="0" />
            </ElFormItem>
            <ElFormItem v-if="form.identityPropagation === 1" :label="t('rag.tool.identityHeaderName')">
              <ElInput v-model="form.identityHeaderName" :placeholder="t('rag.tool.identityHeaderPlaceholder')" />
            </ElFormItem>
          </ElForm>
        </ElTabPane>
        <ElTabPane :label="t('rag.tool.paramSchema')" name="params">
          <div class="tool-builder-tab">
            <section class="tool-builder-section">
              <div class="tool-builder-section__header">
                <div>
                  <div class="tool-builder-section__title">
                    <span>{{ t('rag.tool.paramSchema') }}</span>
                    <ConfigHelp
                      field
                      :title="t('rag.configHelp.tool.schemaTitle')"
                      :description="t('rag.configHelp.tool.schemaDescription')"
                      :examples="[toolSchemaExample]"
                    />
                  </div>
                  <div class="tool-builder-section__hint">{{ t('rag.tool.paramSchemaBuilderHint') }}</div>
                </div>
                <div class="tool-builder-section__actions">
                  <ElSegmented
                    :model-value="paramSchemaMode"
                    size="small"
                    :options="[
                      { label: t('rag.tool.builderForm'), value: 'form' },
                      { label: t('rag.tool.builderJson'), value: 'json' }
                    ]"
                    @change="switchParamSchemaMode"
                  />
                  <ElButton v-if="paramSchemaMode === 'form'" size="small" type="primary" plain @click="paramRows.push(createParamRow())">
                    <SvgIcon icon="mdi:plus" />
                    {{ t('rag.tool.addParameter') }}
                  </ElButton>
                </div>
              </div>
              <template v-if="paramSchemaMode === 'form'">
                <ElAlert
                  v-if="!paramRows.length"
                  class="mb-3"
                  type="info"
                  :closable="false"
                  :title="t('rag.tool.parameterEmptyHint')"
                />
                <div v-else class="tool-builder-table-wrap">
                  <ElTable :data="paramRows" border class="tool-builder-table" row-key="key">
                    <ElTableColumn :label="t('rag.tool.parameterName')" min-width="150">
                      <template #default="{ row }">
                        <ElInput v-model="row.name" :placeholder="t('rag.tool.parameterNamePlaceholder')" />
                      </template>
                    </ElTableColumn>
                    <ElTableColumn :label="t('rag.tool.parameterDescription')" min-width="210">
                      <template #default="{ row }">
                        <ElInput v-model="row.description" :placeholder="t('rag.tool.parameterDescriptionPlaceholder')" />
                      </template>
                    </ElTableColumn>
                    <ElTableColumn :label="t('rag.tool.parameterType')" width="138">
                      <template #default="{ row }">
                        <ElSelect v-model="row.type" class="w-full" filterable allow-create>
                          <ElOption v-for="type in parameterTypeOptions" :key="type" :label="type" :value="type" />
                        </ElSelect>
                      </template>
                    </ElTableColumn>
                    <ElTableColumn :label="t('rag.tool.parameterLocation')" width="138">
                      <template #default="{ row }">
                        <ElSelect v-model="row.location" class="w-full">
                          <ElOption
                            v-for="location in parameterLocationOptions"
                            :key="location.value"
                            :label="location.label"
                            :value="location.value"
                          />
                        </ElSelect>
                      </template>
                    </ElTableColumn>
                    <ElTableColumn :label="t('rag.tool.parameterHttpName')" min-width="150">
                      <template #default="{ row }">
                        <ElInput v-model="row.httpName" :placeholder="row.name || t('rag.tool.parameterName')" />
                      </template>
                    </ElTableColumn>
                    <ElTableColumn :label="t('rag.tool.parameterRequired')" width="82" align="center">
                      <template #default="{ row }"><ElSwitch v-model="row.required" /></template>
                    </ElTableColumn>
                    <ElTableColumn :label="t('rag.common.action')" width="100" fixed="right" align="center">
                      <template #default="{ row, $index }">
                        <ElPopover placement="left" :title="t('rag.tool.parameterAdvanced')" :width="420" trigger="click">
                          <template #reference>
                            <ElButton
                              link
                              type="primary"
                              size="small"
                              :title="t('rag.tool.parameterAdvanced')"
                              :aria-label="t('rag.tool.parameterAdvanced')"
                            >
                              <SvgIcon icon="mdi:tune-variant" />
                            </ElButton>
                          </template>
                          <ElForm label-position="top" class="tool-popover-form">
                            <ElFormItem :label="t('rag.tool.parameterDefault')">
                              <ElInput v-model="row.defaultValue" :placeholder="t('rag.tool.parameterDefaultPlaceholder')">
                                <template #prepend><ElSwitch v-model="row.hasDefault" /></template>
                              </ElInput>
                            </ElFormItem>
                            <ElFormItem :label="t('rag.tool.parameterEnum')">
                              <ElSelect
                                v-model="row.enumValues"
                                class="w-full"
                                multiple
                                filterable
                                allow-create
                                default-first-option
                                :placeholder="t('rag.tool.parameterEnumPlaceholder')"
                              />
                            </ElFormItem>
                            <div class="grid grid-cols-2 gap-3">
                              <ElFormItem :label="t('rag.tool.parameterMinimum')">
                                <ElInputNumber v-model="row.minimum" class="w-full" controls-position="right" />
                              </ElFormItem>
                              <ElFormItem :label="t('rag.tool.parameterMaximum')">
                                <ElInputNumber v-model="row.maximum" class="w-full" controls-position="right" />
                              </ElFormItem>
                            </div>
                          </ElForm>
                        </ElPopover>
                        <ElButton
                          link
                          type="danger"
                          size="small"
                          :title="t('rag.common.delete')"
                          :aria-label="t('rag.common.delete')"
                          @click="paramRows.splice($index, 1)"
                        >
                          <SvgIcon icon="mdi:delete-outline" />
                        </ElButton>
                      </template>
                    </ElTableColumn>
                  </ElTable>
                </div>
              </template>
              <ConfigCodeEditor
                v-else
                v-model="form.paramSchema"
                :rows="12"
                expected-root="object"
                :example="toolSchemaExample"
              />
            </section>

            <section class="tool-builder-section">
              <div class="tool-builder-section__header">
                <div>
                  <div class="tool-builder-section__title">
                    <span>{{ t('rag.tool.requestHeaders') }}</span>
                  </div>
                  <div class="tool-builder-section__hint">{{ t('rag.tool.requestHeadersHint') }}</div>
                </div>
              </div>
              <ElSelect
                v-model="requestHeaderPreset"
                class="mb-2 w-full"
                clearable
                :placeholder="requestHeaderPresetPlaceholder"
                @change="applyRequestHeaderPreset"
              >
                <ElOption
                  v-for="preset in requestHeaderPresets"
                  :key="preset.value"
                  :label="preset.label"
                  :value="preset.value"
                />
              </ElSelect>
              <ConfigCodeEditor v-model="form.requestHeaders" :rows="5" expected-root="object" />
            </section>

            <section class="tool-builder-section">
              <div class="tool-builder-section__header">
                <div>
                  <div class="tool-builder-section__title">
                    <span>{{ t('rag.tool.requestTemplate') }}</span>
                    <ConfigHelp
                      field
                      :title="t('rag.configHelp.tool.requestTitle')"
                      :description="t('rag.configHelp.tool.requestDescription')"
                      :examples="[toolHelpExamples.request]"
                    />
                  </div>
                  <div class="tool-builder-section__hint">{{ t('rag.tool.requestTemplateBuilderHint') }}</div>
                </div>
                <div class="tool-builder-section__actions">
                  <ElSegmented
                    :model-value="requestTemplateMode"
                    size="small"
                    :options="[
                      { label: t('rag.tool.requestTemplateAuto'), value: 'auto' },
                      { label: t('rag.tool.builderForm'), value: 'form' },
                      { label: t('rag.tool.builderJson'), value: 'json' }
                    ]"
                    @change="switchRequestTemplateMode"
                  />
                  <ElButton
                    v-if="requestTemplateMode === 'form'"
                    size="small"
                    type="primary"
                    plain
                    @click="requestTemplateRows.push(createRequestTemplateRow())"
                  >
                    <SvgIcon icon="mdi:plus" />
                    {{ t('rag.tool.addRequestField') }}
                  </ElButton>
                </div>
              </div>
              <ElAlert
                v-if="requestTemplateMode === 'auto'"
                type="info"
                :closable="false"
                :title="t('rag.tool.requestTemplateAutoHint')"
              />
              <template v-else-if="requestTemplateMode === 'form'">
                <ElAlert
                  v-if="!requestTemplateRows.length"
                  type="info"
                  :closable="false"
                  :title="t('rag.tool.requestTemplateEmptyHint')"
                />
                <div v-else class="tool-builder-table-wrap">
                  <ElTable :data="requestTemplateRows" border class="tool-builder-table" row-key="key">
                    <ElTableColumn :label="t('rag.tool.requestField')" min-width="180">
                      <template #default="{ row }"><ElInput v-model="row.name" :placeholder="t('rag.tool.requestFieldPlaceholder')" /></template>
                    </ElTableColumn>
                    <ElTableColumn :label="t('rag.tool.requestValueSource')" width="150">
                      <template #default="{ row }">
                        <ElSelect v-model="row.source" class="w-full">
                          <ElOption :label="t('rag.tool.requestParameterSource')" value="parameter" />
                          <ElOption :label="t('rag.tool.requestFixedSource')" value="fixed" />
                        </ElSelect>
                      </template>
                    </ElTableColumn>
                    <ElTableColumn :label="t('rag.tool.requestValue')" min-width="260">
                      <template #default="{ row }">
                        <ElSelect
                          v-if="row.source === 'parameter'"
                          v-model="row.parameter"
                          class="w-full"
                          filterable
                          allow-create
                          :placeholder="t('rag.tool.requestParameterPlaceholder')"
                        >
                          <ElOption v-for="parameter in paramRows" :key="parameter.key" :label="parameter.name" :value="parameter.name" />
                        </ElSelect>
                        <ElInput v-else v-model="row.fixedValue" :placeholder="t('rag.tool.requestFixedValuePlaceholder')" />
                      </template>
                    </ElTableColumn>
                    <ElTableColumn v-if="requestTemplateRows.some(row => row.source === 'fixed')" :label="t('rag.tool.requestFixedType')" width="140">
                      <template #default="{ row }">
                        <ElSelect v-if="row.source === 'fixed'" v-model="row.fixedType" class="w-full">
                          <ElOption v-for="type in requestFixedTypeOptions" :key="type.value" :label="type.label" :value="type.value" />
                        </ElSelect>
                      </template>
                    </ElTableColumn>
                    <ElTableColumn :label="t('rag.common.action')" width="72" fixed="right" align="center">
                      <template #default="{ $index }">
                        <ElButton
                          link
                          type="danger"
                          size="small"
                          :title="t('rag.common.delete')"
                          :aria-label="t('rag.common.delete')"
                          @click="requestTemplateRows.splice($index, 1)"
                        >
                          <SvgIcon icon="mdi:delete-outline" />
                        </ElButton>
                      </template>
                    </ElTableColumn>
                  </ElTable>
                </div>
              </template>
              <ConfigCodeEditor
                v-else
                v-model="form.requestTemplate"
                :rows="10"
                expected-root="object"
                :example="toolHelpExamples.request"
              />
            </section>

            <section class="tool-builder-section">
              <div class="tool-builder-section__header">
                <div>
                  <div class="tool-builder-section__title">
                    <span>{{ t('rag.responseRule') }}</span>
                    <ConfigHelp
                      field
                      :title="t('rag.responseRule')"
                      :description="t('rag.configFields.tool.fields.responseRule')"
                      :examples="[toolHelpExamples.responseRule]"
                    />
                  </div>
                  <div class="tool-builder-section__hint">{{ t('rag.tool.responseRuleBuilderHint') }}</div>
                </div>
                <ElSegmented
                  :model-value="responseRuleMode"
                  size="small"
                  :options="[
                    { label: t('rag.tool.builderForm'), value: 'form' },
                    { label: t('rag.tool.builderJson'), value: 'json' }
                  ]"
                  @change="switchResponseRuleMode"
                />
              </div>
              <template v-if="responseRuleMode === 'form'">
                <ElForm label-position="top" class="tool-builder-form">
                  <div class="tool-builder-grid tool-builder-grid--three">
                    <ElFormItem :label="t('rag.tool.responseHttpStatuses')">
                      <ElSelect
                        v-model="responseRuleForm.httpSuccessStatuses"
                        class="w-full"
                        multiple
                        filterable
                        allow-create
                        default-first-option
                        :placeholder="t('rag.tool.responseHttpStatusesPlaceholder')"
                      >
                        <ElOption v-for="status in ['200', '201', '202', '204']" :key="status" :label="status" :value="status" />
                      </ElSelect>
                    </ElFormItem>
                    <ElFormItem :label="t('rag.tool.responseBusinessCheck')">
                      <ElSwitch v-model="responseRuleForm.checkBusinessStatus" />
                    </ElFormItem>
                    <ElFormItem :label="t('rag.tool.responseDataPath')">
                      <ElInput v-model="responseRuleForm.dataPath" placeholder="data.items" />
                    </ElFormItem>
                  </div>
                  <div v-if="responseRuleForm.checkBusinessStatus" class="tool-builder-grid tool-builder-grid--three">
                    <ElFormItem :label="t('rag.tool.responseStatusPath')">
                      <ElInput v-model="responseRuleForm.successPath" placeholder="code" />
                    </ElFormItem>
                    <ElFormItem :label="t('rag.tool.responseStatusOperator')">
                      <ElSelect v-model="responseRuleForm.successOperator" class="w-full">
                        <ElOption v-for="operator in responseOperatorOptions" :key="operator.value" :label="operator.label" :value="operator.value" />
                      </ElSelect>
                    </ElFormItem>
                    <ElFormItem v-if="['equals', 'in'].includes(responseRuleForm.successOperator)" :label="t('rag.tool.responseExpectedValues')">
                      <ElSelect
                        v-model="responseRuleForm.successValues"
                        class="w-full"
                        multiple
                        filterable
                        allow-create
                        default-first-option
                        :placeholder="t('rag.tool.responseExpectedValuesPlaceholder')"
                      />
                    </ElFormItem>
                  </div>
                  <div class="tool-builder-grid tool-builder-grid--two">
                    <ElFormItem :label="t('rag.tool.responseMessagePath')">
                      <ElInput v-model="responseRuleForm.messagePath" placeholder="message" />
                    </ElFormItem>
                    <div class="tool-builder-inline-hint">{{ t('rag.tool.responseRuleEmptyHint') }}</div>
                  </div>
                </ElForm>
              </template>
              <ConfigCodeEditor
                v-else
                v-model="form.responseRule"
                :rows="10"
                expected-root="object"
                :example="toolHelpExamples.responseRule"
              />
            </section>

            <section class="tool-builder-section">
              <div class="tool-builder-section__header">
                <div>
                  <div class="tool-builder-section__title">
                    <span>{{ t('rag.tool.responseMapping') }}</span>
                    <ConfigHelp
                      field
                      :title="t('rag.configHelp.tool.responseTitle')"
                      :description="t('rag.configHelp.tool.responseDescription')"
                      :examples="[toolHelpExamples.response]"
                    />
                  </div>
                  <div class="tool-builder-section__hint">{{ t('rag.tool.responseMappingBuilderHint') }}</div>
                </div>
                <div class="tool-builder-section__actions">
                  <ElSegmented
                    :model-value="responseMappingMode"
                    size="small"
                    :options="[
                      { label: t('rag.tool.builderForm'), value: 'form' },
                      { label: t('rag.tool.builderJson'), value: 'json' }
                    ]"
                    @change="switchResponseMappingMode"
                  />
                  <ElButton
                    v-if="responseMappingMode === 'form'"
                    size="small"
                    type="primary"
                    plain
                    @click="responseMappingRows.push(createResponseMappingRow())"
                  >
                    <SvgIcon icon="mdi:plus" />
                    {{ t('rag.tool.addResponseMapping') }}
                  </ElButton>
                </div>
              </div>
              <template v-if="responseMappingMode === 'form'">
                <ElAlert
                  v-if="!responseMappingRows.length"
                  type="info"
                  :closable="false"
                  :title="t('rag.tool.responseMappingEmptyHint')"
                />
                <div v-else class="tool-builder-table-wrap">
                  <ElTable :data="responseMappingRows" border class="tool-builder-table" row-key="key">
                    <ElTableColumn :label="t('rag.tool.responseMappingField')" min-width="220">
                      <template #default="{ row }"><ElInput v-model="row.name" :placeholder="t('rag.tool.responseMappingFieldPlaceholder')" /></template>
                    </ElTableColumn>
                    <ElTableColumn :label="t('rag.tool.responseMappingPath')" min-width="320">
                      <template #default="{ row }"><ElInput v-model="row.path" placeholder="id or customer.id" /></template>
                    </ElTableColumn>
                    <ElTableColumn :label="t('rag.common.action')" width="72" fixed="right" align="center">
                      <template #default="{ $index }">
                        <ElButton
                          link
                          type="danger"
                          size="small"
                          :title="t('rag.common.delete')"
                          :aria-label="t('rag.common.delete')"
                          @click="responseMappingRows.splice($index, 1)"
                        >
                          <SvgIcon icon="mdi:delete-outline" />
                        </ElButton>
                      </template>
                    </ElTableColumn>
                  </ElTable>
                </div>
              </template>
              <ConfigCodeEditor
                v-else
                v-model="form.responseMapping"
                :rows="10"
                expected-root="object"
                :example="toolHelpExamples.response"
              />
            </section>
          </div>
        </ElTabPane>
      </ElTabs>
      <template #footer>
        <div class="tool-dialog-footer">
          <span class="tool-dialog-footer__hint">{{ t('rag.tool.saveHint') }}</span>
          <div class="tool-dialog-footer__actions">
            <ElButton @click="dialogVisible = false">{{ t('rag.common.cancel') }}</ElButton>
            <ElButton type="primary" :loading="saving" @click="save">{{ t('rag.common.save') }}</ElButton>
          </div>
        </div>
      </template>
    </ElDialog>

    <ElDialog v-model="testDialogVisible" :title="t('rag.tool.testTitle')" width="min(820px, 95vw)" align-center>
      <ElForm label-width="100px">
        <ElFormItem :label="t('rag.tool.testTool')">
          <ElTag>{{ testTool?.name }} ({{ testTool?.code }})</ElTag>
        </ElFormItem>
        <ElFormItem :label="t('rag.tool.inputJson')">
          <ConfigCodeEditor
            v-model="testParams"
            :rows="8"
            expected-root="object"
            :example="defaultParamsFromSchema(testTool?.paramSchema)"
          />
        </ElFormItem>
        <ElFormItem :label="t('rag.tool.realRequest')">
          <ElSwitch v-model="testExecute" />
          <span class="ml-2 text-xs text-gray-500">{{ t('rag.tool.dryRunHint') }}</span>
        </ElFormItem>
      </ElForm>
      <div v-if="testResult" class="space-y-3">
        <ElAlert
          :type="testResult.valid && testResult.success !== false ? 'success' : 'warning'"
          :closable="false"
          :title="
            testResult.valid
              ? testResult.dryRun
                ? t('rag.tool.dryRunPassed')
                : t('rag.tool.requestCompleted')
              : t('rag.tool.configInvalid')
          "
        />
        <ElDescriptions :column="1" border>
          <ElDescriptionsItem :label="t('rag.tool.requestMethod')">{{ testResult.method || '-' }}</ElDescriptionsItem>
          <ElDescriptionsItem :label="t('rag.tool.requestUrl')">
            <span class="break-all">{{ testResult.url || '-' }}</span>
          </ElDescriptionsItem>
          <ElDescriptionsItem :label="t('rag.tool.requestHeader')">
            <pre class="whitespace-pre-wrap text-xs">{{ formatPreview(testResult.headers) }}</pre>
          </ElDescriptionsItem>
          <ElDescriptionsItem :label="t('rag.tool.requestBody')">
            <pre class="whitespace-pre-wrap text-xs">{{ formatPreview(testResult.body) }}</pre>
          </ElDescriptionsItem>
          <ElDescriptionsItem v-if="testResult.output" :label="t('rag.tool.responseResult')">
            <div class="tool-test-result">
              <div v-if="responsePayload.valid" class="tool-test-result__toolbar">
                <ElSegmented v-model="responseView" size="small" :options="responseViewOptions" />
              </div>
              <pre class="tool-test-output">{{ responseDisplay }}</pre>
            </div>
          </ElDescriptionsItem>
          <ElDescriptionsItem v-if="testResult.error" :label="t('rag.tool.errorMessage')">
            <span class="text-red-500">{{ testResult.error }}</span>
          </ElDescriptionsItem>
        </ElDescriptions>
      </div>
      <template #footer>
        <ElButton @click="testDialogVisible = false">{{ t('rag.tool.close') }}</ElButton>
        <ElButton type="primary" :loading="testLoading" @click="runToolTest">{{ t('rag.tool.startTest') }}</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<style scoped>
.tool-builder-tab {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tool-url-cell {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tool-builder-section {
  padding: 16px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  background: var(--el-bg-color);
}

.tool-builder-section__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.tool-builder-section__title {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-weight: 600;
}

.tool-builder-section__hint {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.tool-builder-section__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.tool-builder-table-wrap {
  width: 100%;
  overflow-x: auto;
}

.tool-builder-table {
  min-width: 920px;
}

.tool-builder-form :deep(.el-form-item) {
  margin-bottom: 12px;
}

.tool-builder-grid {
  display: grid;
  gap: 12px 16px;
}

.tool-builder-grid--three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.tool-builder-grid--two {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: center;
}

.tool-builder-inline-hint {
  align-self: center;
  padding: 8px 12px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.tool-popover-form :deep(.el-form-item) {
  margin-bottom: 12px;
}

.tool-dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.tool-dialog-footer__hint {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.tool-dialog-footer__actions {
  display: flex;
  flex-shrink: 0;
  gap: 8px;
}

:global(.tool-config-dialog .el-dialog__body) {
  max-height: calc(100vh - 190px);
  overflow-y: auto;
  padding-top: 8px;
}

:global(.tool-config-dialog .el-dialog__footer) {
  border-top: 1px solid var(--el-border-color-lighter);
}

@media (max-width: 768px) {
  .tool-builder-section__header,
  .tool-dialog-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .tool-builder-section__actions,
  .tool-dialog-footer__actions {
    justify-content: flex-start;
  }

  .tool-builder-grid--three,
  .tool-builder-grid--two {
    grid-template-columns: 1fr;
  }
}

.tool-test-result {
  min-width: 0;
  max-width: 100%;
}

.tool-test-result__toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}

.tool-test-output {
  box-sizing: border-box;
  max-width: 100%;
  max-height: 360px;
  margin: 0;
  overflow: auto;
  padding: 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  font-family: var(--el-font-family-monospace, Consolas, monospace);
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-word;
}

:deep(.el-descriptions__content) {
  min-width: 0;
}
</style>
