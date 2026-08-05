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
import { $t } from '@/locales';
import { useAppStore } from '@/store/modules/app';
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
  schema:
    '{"type":"object","properties":{"recordId":{"type":"integer","description":"业务记录编号"},"reason":{"type":"string","description":"操作原因"}},"required":["recordId"]}',
  request: '{"record_id":"{{recordId}}","operation_reason":"{{reason}}"}',
  responseRule:
    '{"httpSuccessStatuses":[200,201],"successPath":"code","successOperator":"in","successValues":[0,"0","SUCCESS"],"messagePath":"message","dataPath":"data"}',
  response: '{"recordId":"id","recordName":"name","statusName":"status_name"}'
};
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
    example: t('rag.configFields.tool.fieldExamples.description'),
    required: true
  },
  {
    name: t('rag.tool.urlTemplate'),
    description: t('rag.configFields.tool.fields.urlTemplate'),
    example: 'https://api.example.com/v1/records/{{recordId}}',
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
    example: toolHelpExamples.schema
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
    description: t('rag.configFields.tool.fields.responseMapping'),
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
  for (const [field, value] of [
    [t('rag.tool.paramSchema'), form.value.paramSchema],
    [t('rag.tool.requestHeaders'), form.value.requestHeaders],
    [t('rag.tool.requestTemplate'), form.value.requestTemplate],
    [t('rag.responseRule'), form.value.responseRule],
    [t('rag.tool.responseMapping'), form.value.responseMapping]
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
    const payload = { ...form.value };
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
    if (!params || typeof params !== 'object' || Array.isArray(params)) throw new Error();
  } catch {
    ElMessage.warning(t('rag.common.invalidJson', { field: t('rag.skill.parameters') }));
    return;
  }
  testLoading.value = true;
  try {
    const res = await fetchTestTool(testTool.value.id, {
      params,
      execute: testExecute.value
    });
    testResult.value = res.data;
  } finally {
    testLoading.value = false;
  }
}

function formatPreview(value: any) {
  if (value === undefined || value === null || value === '') return '-';
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2);
}
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
      <ElTable v-loading="loading" :data="list" stripe border class="w-full">
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
        <ElTableColumn prop="urlTemplate" :label="t('rag.tool.urlTemplate')" min-width="200" show-overflow-tooltip />
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
            <ElButton size="small" link type="primary" @click="openToolTest(row)">{{ t('rag.tool.startTest') }}</ElButton>
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

    <ElDialog v-model="dialogVisible" width="min(820px, 95vw)" class="config-editor-dialog" align-center>
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
          <ElForm :model="form" label-width="160px" class="mt-2">
            <ElFormItem :label="t('rag.tool.paramSchema')">
              <template #label>
                <span>{{ t('rag.tool.paramSchema') }}</span>
                <ConfigHelp
                  field
                  :title="t('rag.configHelp.tool.schemaTitle')"
                  :description="t('rag.configHelp.tool.schemaDescription')"
                  :examples="[toolHelpExamples.schema]"
                />
              </template>
              <ConfigCodeEditor
                v-model="form.paramSchema"
                :rows="6"
                expected-root="object"
                :example="toolHelpExamples.schema"
              />
            </ElFormItem>
            <ElFormItem :label="t('rag.tool.requestHeaders')">
              <div class="w-full">
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
              </div>
            </ElFormItem>
            <ElFormItem :label="t('rag.tool.requestTemplate')">
              <template #label>
                <span>{{ t('rag.tool.requestTemplate') }}</span>
                <ConfigHelp
                  field
                  :title="t('rag.configHelp.tool.requestTitle')"
                  :description="t('rag.configHelp.tool.requestDescription')"
                  :examples="[toolHelpExamples.request]"
                />
              </template>
              <ConfigCodeEditor
                v-model="form.requestTemplate"
                :rows="6"
                expected-root="object"
                :example="toolHelpExamples.request"
              />
            </ElFormItem>
            <ElFormItem :label="t('rag.responseRule')">
              <template #label>
                <span>{{ t('rag.responseRule') }}</span>
              </template>
              <ConfigCodeEditor
                v-model="form.responseRule"
                :rows="6"
                expected-root="object"
                :example="toolHelpExamples.responseRule"
              />
            </ElFormItem>
            <ElFormItem :label="t('rag.tool.responseMapping')">
              <template #label>
                <span>{{ t('rag.tool.responseMapping') }}</span>
                <ConfigHelp
                  field
                  :title="t('rag.configHelp.tool.responseTitle')"
                  :description="t('rag.configHelp.tool.responseDescription')"
                  :examples="[toolHelpExamples.response]"
                />
              </template>
              <ConfigCodeEditor
                v-model="form.responseMapping"
                :rows="5"
                expected-root="object"
                :example="toolHelpExamples.response"
              />
            </ElFormItem>
          </ElForm>
        </ElTabPane>
      </ElTabs>
      <template #footer>
        <ElButton @click="dialogVisible = false">{{ t('rag.common.cancel') }}</ElButton>
        <ElButton type="primary" :loading="saving" @click="save">{{ t('rag.common.save') }}</ElButton>
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
          :title="testResult.valid ? (testResult.dryRun ? t('rag.tool.dryRunPassed') : t('rag.tool.requestCompleted')) : t('rag.tool.configInvalid')"
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
            <pre class="max-h-56 overflow-auto whitespace-pre-wrap text-xs">{{ formatPreview(testResult.output) }}</pre>
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
