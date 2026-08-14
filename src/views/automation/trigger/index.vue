<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  type AutomationTrigger,
  type AutomationTriggerSecret,
  type AutomationTriggerType,
  type AutomationWorkflow,
  fetchAutomationTriggers,
  fetchCreateAutomationTrigger,
  fetchRotateAutomationTriggerSecret,
  fetchSetAutomationTriggerEnabled,
  fetchUpdateAutomationTrigger,
  fetchWorkflows
} from '@/service/api/automation';
import { formatAutomationTime as formatTime } from '@/utils/automation-time';
import { $t } from '@/locales';
import ConfigCodeEditor from '@/views/rag/shared/config-code-editor.vue';
import AutomationConfigHelp from '../components/automation-config-help.vue';
import AutomationLoadError from '../components/automation-load-error.vue';
import { automationOverlapPolicyLabel, automationTriggerTypeLabel } from '../automation-enum-label';

defineOptions({ name: 'AutomationTrigger' });
const t = $t;

const activeType = ref<AutomationTriggerType>('CRON');
const loading = ref(false);
const loadError = ref('');
const records = ref<AutomationTrigger[]>([]);
const total = ref(0);
const editorVisible = ref(false);
const editingId = ref<number>();
const secretVisible = ref(false);
const secret = ref<AutomationTriggerSecret>();
const helpVisible = ref(false);
const workflowOptions = ref<AutomationWorkflow[]>([]);
const cronPreset = ref('hourly');
const triggerJsonTab = ref<'schemaJson' | 'inputJson' | 'variablesJson'>('inputJson');
const query = reactive({
  page: 1,
  size: 20,
  workflowId: undefined as number | undefined,
  status: undefined as number | undefined
});
const form = reactive({
  workflowId: undefined as number | undefined,
  name: '',
  cron: '0 0 * * * *',
  timezone: 'Asia/Shanghai',
  misfireWindowSeconds: 300,
  overlapPolicy: 'SKIP',
  timeWindowSeconds: 300,
  eventType: '',
  schemaJson: '{}',
  inputJson: '{}',
  variablesJson: '{}'
});

const typeLabel = computed(
  () =>
    ({
      CRON: t('automation.trigger.cron'),
      WEBHOOK: t('automation.trigger.webhook'),
      EVENT: t('automation.trigger.event'),
      APPROVAL: t('automation.trigger.approval')
    })[activeType.value]
);
const cronPresets = computed(() => [
  { value: 'custom', label: t('automation.trigger.cronPresets.custom'), cron: '' },
  { value: 'fiveMinutes', label: t('automation.trigger.cronPresets.everyFiveMinutes'), cron: '0 */5 * * * *' },
  { value: 'hourly', label: t('automation.trigger.cronPresets.hourly'), cron: '0 0 * * * *' },
  { value: 'daily', label: t('automation.trigger.cronPresets.daily'), cron: '0 0 9 * * *' },
  { value: 'weekly', label: t('automation.trigger.cronPresets.everySevenDays'), cron: '0 0 9 * * MON' },
  { value: 'monthly', label: t('automation.trigger.cronPresets.everyThirtyDays'), cron: '0 0 9 1 * *' }
]);
const overlapOptions = computed(() => [
  { value: 'SKIP', label: t('automation.trigger.overlap.skip') },
  { value: 'QUEUE', label: t('automation.trigger.overlap.queue') },
  { value: 'PARALLEL', label: t('automation.trigger.overlap.parallel') },
  { value: 'REPLACE', label: t('automation.trigger.overlap.replace') }
]);
const timezoneOptions = ['Asia/Shanghai', 'UTC', 'Asia/Tokyo', 'Europe/London', 'America/New_York'];
const schemaExample = computed(() =>
  JSON.stringify({
    type: 'object',
    required: activeType.value === 'APPROVAL' ? ['correlationKey', 'status'] : ['eventId'],
    properties:
      activeType.value === 'APPROVAL'
        ? { correlationKey: { type: 'string' }, status: { type: 'string' } }
        : { eventId: { type: 'string' } }
  })
);
const inputExample = JSON.stringify({ query: '查询今日待处理退款申请' });
const variablesExample = JSON.stringify({ operator: 'after_sales', dryRun: false });
const typeGuide = computed(
  () =>
    ({
      CRON: t('automation.trigger.guides.cron'),
      WEBHOOK: t('automation.trigger.guides.webhook'),
      EVENT: t('automation.trigger.guides.event'),
      APPROVAL: t('automation.trigger.guides.approval')
    })[activeType.value]
);

async function loadWorkflows() {
  const collected: AutomationWorkflow[] = [];
  let page = 1;
  while (true) {
    const { data, error } = await fetchWorkflows({ page, size: 100, status: 'PUBLISHED' });
    if (error || !data) {
      loadError.value = error?.message || t('automation.common.loadFailed');
      return;
    }
    collected.push(...(data.records || []));
    if (!data.records?.length || collected.length >= Number(data.total || 0)) break;
    page += 1;
  }
  workflowOptions.value = collected;
}

function workflowLabel(workflowId: number) {
  const workflow = workflowOptions.value.find(item => item.id === workflowId);
  return workflow ? `${workflow.name} (${workflow.code})` : `#${workflowId}`;
}

function triggerConfigSummary(row: AutomationTrigger) {
  try {
    const config = JSON.parse(row.configJson || '{}');
    if (row.triggerType === 'CRON') return `${config.cron || '-'} · ${config.timezone || 'Asia/Shanghai'}`;
    if (row.triggerType === 'EVENT') return config.eventType || '-';
    return t('automation.trigger.signatureSummary', { seconds: config.timeWindowSeconds ?? 300 });
  } catch {
    return t('automation.trigger.invalidStoredConfig');
  }
}

async function loadData() {
  loading.value = true;
  try {
    const { data, error } = await fetchAutomationTriggers(activeType.value, query);
    if (error || !data) {
      records.value = [];
      total.value = 0;
      loadError.value = error?.message || t('automation.common.loadFailed');
    } else {
      loadError.value = '';
      records.value = data.records || [];
      total.value = data.total || 0;
    }
  } finally {
    loading.value = false;
  }
}

function search() {
  query.page = 1;
  loadData();
}
function resetSearch() {
  query.workflowId = undefined;
  query.status = undefined;
  search();
}
function resetForm() {
  editingId.value = undefined;
  cronPreset.value = 'hourly';
  Object.assign(form, {
    workflowId: undefined,
    name: '',
    cron: '0 0 * * * *',
    timezone: 'Asia/Shanghai',
    misfireWindowSeconds: 300,
    overlapPolicy: 'SKIP',
    timeWindowSeconds: 300,
    eventType: '',
    schemaJson: '{}',
    inputJson: '{}',
    variablesJson: '{}'
  });
}
function openCreate() {
  resetForm();
  triggerJsonTab.value = activeType.value === 'CRON' ? 'inputJson' : 'schemaJson';
  editorVisible.value = true;
}
function applyCronPreset(value: string) {
  const preset = cronPresets.value.find(item => item.value === value);
  if (preset?.cron) form.cron = preset.cron;
}
function syncCronPreset(value: string) {
  cronPreset.value = cronPresets.value.find(item => item.cron === value.trim())?.value || 'custom';
}
function openEdit(row: AutomationTrigger) {
  resetForm();
  editingId.value = row.id;
  let config: Record<string, any> = {};
  try {
    config = JSON.parse(row.configJson || '{}');
  } catch {
    config = {};
  }
  Object.assign(form, {
    workflowId: row.workflowId,
    name: row.name,
    cron: config.cron || form.cron,
    timezone: config.timezone || form.timezone,
    misfireWindowSeconds: config.misfireWindowSeconds ?? 300,
    overlapPolicy: row.overlapPolicy || 'SKIP',
    timeWindowSeconds: config.timeWindowSeconds ?? 300,
    eventType: config.eventType || '',
    schemaJson: JSON.stringify(config.payloadSchema || config.callbackSchema || {}, null, 2),
    inputJson: JSON.stringify(config.input || {}, null, 2),
    variablesJson: JSON.stringify(config.variables || {}, null, 2)
  });
  syncCronPreset(form.cron);
  triggerJsonTab.value = activeType.value === 'CRON' ? 'inputJson' : 'schemaJson';
  editorVisible.value = true;
}
function parseJson(label: string, value: string) {
  try {
    return JSON.parse(value || '{}');
  } catch {
    throw new Error(t('automation.common.jsonInvalid', { field: label }));
  }
}
async function submit() {
  if (!form.workflowId || !form.name.trim()) {
    ElMessage.warning(t('automation.trigger.required'));
    return;
  }
  let data: Record<string, unknown> = { workflowId: form.workflowId, name: form.name.trim() };
  try {
    if (activeType.value === 'CRON')
      data = {
        ...data,
        cron: form.cron,
        timezone: form.timezone,
        misfireWindowSeconds: form.misfireWindowSeconds,
        overlapPolicy: form.overlapPolicy,
        input: parseJson(t('automation.trigger.input'), form.inputJson),
        variables: parseJson(t('automation.trigger.variables'), form.variablesJson)
      };
    if (activeType.value === 'WEBHOOK')
      data = {
        ...data,
        timeWindowSeconds: form.timeWindowSeconds,
        payloadSchema: parseJson('Payload Schema', form.schemaJson),
        input: parseJson(t('automation.trigger.input'), form.inputJson),
        variables: parseJson(t('automation.trigger.variables'), form.variablesJson)
      };
    if (activeType.value === 'EVENT')
      data = {
        ...data,
        eventType: form.eventType,
        payloadSchema: parseJson('Payload Schema', form.schemaJson),
        input: parseJson(t('automation.trigger.input'), form.inputJson),
        variables: parseJson(t('automation.trigger.variables'), form.variablesJson)
      };
    if (activeType.value === 'APPROVAL')
      data = {
        ...data,
        timeWindowSeconds: form.timeWindowSeconds,
        callbackSchema: parseJson('Callback Schema', form.schemaJson)
      };
  } catch (error) {
    ElMessage.error((error as Error).message);
    return;
  }
  const response = editingId.value
    ? await fetchUpdateAutomationTrigger(editingId.value, activeType.value, data)
    : await fetchCreateAutomationTrigger(activeType.value, data);
  if (!response.data) return;
  editorVisible.value = false;
  if ('secret' in response.data) showSecret(response.data);
  ElMessage.success(editingId.value ? t('automation.trigger.updated') : t('automation.trigger.created'));
  if (!editingId.value && (activeType.value === 'WEBHOOK' || activeType.value === 'APPROVAL')) {
    ElMessage.warning(t('automation.trigger.createdDisabledHint'));
  }
  loadData();
}
async function toggle(row: AutomationTrigger) {
  const enabled = row.status !== 1;
  const { data } = await fetchSetAutomationTriggerEnabled(row.id, activeType.value, enabled);
  if (data) {
    ElMessage.success(enabled ? t('automation.trigger.enabled') : t('automation.trigger.disabled'));
    loadData();
  }
}
async function rotate(row: AutomationTrigger) {
  await ElMessageBox.confirm(t('automation.trigger.rotateConfirm'), t('automation.trigger.rotateSecret'), {
    type: 'warning'
  });
  const { data } = await fetchRotateAutomationTriggerSecret(row.id, activeType.value as 'WEBHOOK' | 'APPROVAL');
  if (data) showSecret(data);
}
function showSecret(value: AutomationTriggerSecret) {
  secret.value = value;
  secretVisible.value = true;
}
async function copy(value?: string) {
  if (!value) return;
  await navigator.clipboard.writeText(value);
  ElMessage.success(t('automation.common.copied'));
}
watch(activeType, () => {
  query.page = 1;
  loadData();
});
onMounted(() => {
  loadData();
  loadWorkflows();
});
</script>

<template>
  <div class="trigger-root">
    <div class="trigger-page">
      <header class="page-heading">
        <div>
          <h1>{{ t('automation.trigger.title') }}</h1>
          <p>{{ t('automation.trigger.description') }}</p>
        </div>
        <ElButton type="primary" @click="openCreate">
          <SvgIcon icon="mdi:plus" />
          {{ t('automation.trigger.createType', { type: typeLabel }) }}
        </ElButton>
      </header>
      <div class="type-band">
        <ElSegmented
          v-model="activeType"
          :options="[
            { label: t('automation.trigger.cron'), value: 'CRON' },
            { label: t('automation.trigger.webhook'), value: 'WEBHOOK' },
            { label: t('automation.trigger.event'), value: 'EVENT' },
            { label: t('automation.trigger.approval'), value: 'APPROVAL' }
          ]"
        />
      </div>
      <ElAlert class="type-guide" type="info" :closable="false" :title="typeGuide" show-icon />
      <div class="filter-band">
        <ElSelect v-model="query.workflowId" clearable filterable :placeholder="t('automation.trigger.selectWorkflow')">
          <ElOption
            v-for="item in workflowOptions"
            :key="item.id"
            :label="`${item.name} (${item.code})`"
            :value="item.id"
          />
        </ElSelect>
        <ElSelect v-model="query.status" clearable :placeholder="t('automation.common.allStatus')">
          <ElOption :label="t('automation.common.enabled')" :value="1" />
          <ElOption :label="t('automation.common.disabled')" :value="0" />
        </ElSelect>
        <ElButton type="primary" @click="search">{{ t('automation.common.search') }}</ElButton>
        <ElButton @click="resetSearch">{{ t('automation.common.reset') }}</ElButton>
        <ElTooltip :content="t('automation.common.configurationHelp')">
          <ElButton circle @click="helpVisible = true"><SvgIcon icon="mdi:help-circle-outline" /></ElButton>
        </ElTooltip>
        <span>{{ t('automation.common.totalItems', { count: total }) }}</span>
      </div>
      <div class="table-band">
        <AutomationLoadError v-if="loadError" :message="loadError" @retry="loadData" />
        <ElTable v-loading="loading" :data="records" height="100%" class="records-table">
          <ElTableColumn prop="name" :label="t('automation.common.name')" min-width="190" />
          <ElTableColumn :label="t('automation.common.workflow')" min-width="190" show-overflow-tooltip>
            <template #default="{ row }">{{ workflowLabel(row.workflowId) }}</template>
          </ElTableColumn>
          <ElTableColumn :label="t('automation.common.type')" width="120">
            <template #default="{ row }">{{ automationTriggerTypeLabel(row.triggerType) }}</template>
          </ElTableColumn>
          <ElTableColumn :label="t('automation.common.status')" width="100">
            <template #default="{ row }">
              <ElTag :type="row.status === 1 ? 'success' : 'info'" size="small">
                {{ row.status === 1 ? t('automation.common.enable') : t('automation.common.disable') }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn :label="t('automation.trigger.triggerConfig')" min-width="190" show-overflow-tooltip>
            <template #default="{ row }">{{ triggerConfigSummary(row) }}</template>
          </ElTableColumn>
          <ElTableColumn v-if="activeType === 'CRON'" :label="t('automation.trigger.overlapPolicy')" width="120">
            <template #default="{ row }">{{ automationOverlapPolicyLabel(row.overlapPolicy) }}</template>
          </ElTableColumn>
          <ElTableColumn
            v-if="activeType === 'APPROVAL'"
            prop="id"
            :label="t('automation.trigger.providerId')"
            width="100"
          />
          <ElTableColumn
            v-if="activeType === 'WEBHOOK' || activeType === 'APPROVAL'"
            prop="publicKey"
            :label="t('automation.trigger.publicKey')"
            min-width="180"
            show-overflow-tooltip
          />
          <ElTableColumn v-if="activeType === 'CRON'" :label="t('automation.trigger.nextFireAt')" width="180">
            <template #default="{ row }">{{ formatTime(row.nextFireAt) }}</template>
          </ElTableColumn>
          <ElTableColumn :label="t('automation.common.action')" width="190" fixed="right" align="center">
            <template #default="{ row }">
              <ElTooltip :content="t('automation.common.edit')">
                <ElButton link @click="openEdit(row)"><SvgIcon icon="mdi:pencil-outline" /></ElButton>
              </ElTooltip>
              <ElTooltip :content="row.status === 1 ? t('automation.common.disable') : t('automation.common.enable')">
                <ElButton link :type="row.status === 1 ? 'danger' : 'success'" @click="toggle(row)">
                  <SvgIcon :icon="row.status === 1 ? 'mdi:pause-circle-outline' : 'mdi:play-circle-outline'" />
                </ElButton>
              </ElTooltip>
              <ElTooltip
                v-if="activeType === 'WEBHOOK' || activeType === 'APPROVAL'"
                :content="t('automation.trigger.rotateSecret')"
              >
                <ElButton link type="warning" @click="rotate(row)"><SvgIcon icon="mdi:key-change" /></ElButton>
              </ElTooltip>
            </template>
          </ElTableColumn>
        </ElTable>
      </div>
      <footer class="pagination-band">
        <ElPagination
          v-model:current-page="query.page"
          v-model:page-size="query.size"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @current-change="loadData"
          @size-change="search"
        />
      </footer>
    </div>

    <ElDialog
      v-model="editorVisible"
      :title="t(editingId ? 'automation.trigger.editType' : 'automation.trigger.createType', { type: typeLabel })"
      width="660px"
      destroy-on-close
    >
      <ElAlert class="editor-guide" type="info" :closable="false" :title="typeGuide" show-icon />
      <ElForm label-position="top">
        <div class="form-grid">
          <ElFormItem :label="t('automation.common.workflow')">
            <ElSelect v-model="form.workflowId" filterable :placeholder="t('automation.trigger.selectWorkflow')">
              <ElOption
                v-for="item in workflowOptions"
                :key="item.id"
                :label="`${item.name} (${item.code})`"
                :value="item.id"
              />
            </ElSelect>
            <div class="field-help">{{ t('automation.trigger.workflowHelp') }}</div>
          </ElFormItem>
          <ElFormItem :label="t('automation.common.name')">
            <ElInput v-model="form.name" :placeholder="t('automation.trigger.namePlaceholder')" maxlength="100" />
          </ElFormItem>
        </div>
        <template v-if="activeType === 'CRON'">
          <div class="form-grid">
            <ElFormItem :label="t('automation.trigger.cronPreset')">
              <ElSelect
                v-model="cronPreset"
                :placeholder="t('automation.trigger.cronPresetPlaceholder')"
                @change="applyCronPreset"
              >
                <ElOption v-for="item in cronPresets" :key="item.value" :label="item.label" :value="item.value" />
              </ElSelect>
            </ElFormItem>
            <ElFormItem :label="t('automation.trigger.cronExpression')">
              <ElInput
                v-model="form.cron"
                :placeholder="t('automation.trigger.cronPlaceholder')"
                @change="syncCronPreset(form.cron)"
              />
              <div class="field-help">{{ t('automation.trigger.cronHelp') }}</div>
            </ElFormItem>
          </div>
          <div class="form-grid">
            <ElFormItem :label="t('automation.trigger.timezone')">
              <ElSelect
                v-model="form.timezone"
                filterable
                allow-create
                :placeholder="t('automation.trigger.timezonePlaceholder')"
              >
                <ElOption v-for="timezone in timezoneOptions" :key="timezone" :label="timezone" :value="timezone" />
              </ElSelect>
            </ElFormItem>
            <ElFormItem :label="t('automation.trigger.misfireWindow')">
              <ElInputNumber
                v-model="form.misfireWindowSeconds"
                :min="0"
                :max="86400"
                :placeholder="t('automation.trigger.misfirePlaceholder')"
              />
              <div class="field-help">{{ t('automation.trigger.misfireHelp') }}</div>
            </ElFormItem>
          </div>
          <ElFormItem :label="t('automation.trigger.overlapPolicy')">
            <ElSelect v-model="form.overlapPolicy" :placeholder="t('automation.trigger.overlapPlaceholder')">
              <ElOption v-for="item in overlapOptions" :key="item.value" :label="item.label" :value="item.value" />
            </ElSelect>
            <div class="field-help">{{ t('automation.trigger.overlapHelp') }}</div>
          </ElFormItem>
        </template>
        <ElFormItem
          v-if="activeType === 'WEBHOOK' || activeType === 'APPROVAL'"
          :label="t('automation.trigger.signatureWindow')"
        >
          <ElInputNumber
            v-model="form.timeWindowSeconds"
            :min="30"
            :max="3600"
            :placeholder="t('automation.trigger.signatureWindowPlaceholder')"
          />
          <div class="field-help">{{ t('automation.trigger.signatureHelp') }}</div>
        </ElFormItem>
        <ElFormItem v-if="activeType === 'EVENT'" :label="t('automation.trigger.eventType')">
          <ElInput v-model="form.eventType" :placeholder="t('automation.trigger.eventTypePlaceholder')" />
          <div class="field-help">{{ t('automation.trigger.eventTypeHelp') }}</div>
        </ElFormItem>
        <ElTabs v-model="triggerJsonTab" stretch class="trigger-json-tabs">
          <ElTabPane
            v-if="activeType !== 'CRON'"
            :label="
              activeType === 'APPROVAL' ? t('automation.trigger.callbackSchema') : t('automation.trigger.payloadSchema')
            "
            name="schemaJson"
          >
            <ConfigCodeEditor v-model="form.schemaJson" :rows="10" expected-root="object" :example="schemaExample" />
            <div class="json-hint">
              {{
                t(
                  activeType === 'APPROVAL'
                    ? 'automation.trigger.approvalSchemaHelp'
                    : 'automation.trigger.payloadSchemaHelp'
                )
              }}
            </div>
          </ElTabPane>
          <ElTabPane v-if="activeType !== 'APPROVAL'" :label="t('automation.trigger.input')" name="inputJson">
            <ConfigCodeEditor v-model="form.inputJson" :rows="10" expected-root="object" :example="inputExample" />
            <div class="json-hint">{{ t('automation.trigger.inputHelp') }}</div>
          </ElTabPane>
          <ElTabPane v-if="activeType !== 'APPROVAL'" :label="t('automation.trigger.variables')" name="variablesJson">
            <ConfigCodeEditor
              v-model="form.variablesJson"
              :rows="10"
              expected-root="object"
              :example="variablesExample"
            />
            <div class="json-hint">{{ t('automation.trigger.variablesHelp') }}</div>
          </ElTabPane>
        </ElTabs>
      </ElForm>
      <template #footer>
        <ElButton @click="editorVisible = false">{{ t('automation.common.cancel') }}</ElButton>
        <ElButton type="primary" @click="submit">{{ t('automation.common.save') }}</ElButton>
      </template>
    </ElDialog>

    <ElDialog
      v-model="secretVisible"
      :title="t('automation.trigger.secretOnce')"
      width="620px"
      :close-on-click-modal="false"
    >
      <ElAlert type="warning" :closable="false" :title="t('automation.trigger.secretWarning')" />
      <div v-if="secret" class="secret-list">
        <div>
          <span>{{ t('automation.trigger.publicKey') }}</span>
          <code>{{ secret.publicKey }}</code>
          <ElButton text circle @click="copy(secret.publicKey)"><SvgIcon icon="mdi:content-copy" /></ElButton>
        </div>
        <div v-if="activeType === 'APPROVAL'">
          <span>{{ t('automation.trigger.providerId') }}</span>
          <code>{{ secret.providerId }}</code>
          <ElButton text circle @click="copy(String(secret.providerId))"><SvgIcon icon="mdi:content-copy" /></ElButton>
        </div>
        <div>
          <span>{{ t('automation.trigger.callbackPath') }}</span>
          <code>{{ secret.webhookPath || secret.callbackPath }}</code>
          <ElButton text circle @click="copy(secret.webhookPath || secret.callbackPath)">
            <SvgIcon icon="mdi:content-copy" />
          </ElButton>
        </div>
        <div>
          <span>{{ t('automation.trigger.signingSecret') }}</span>
          <code>{{ secret.secret }}</code>
          <ElButton text circle @click="copy(secret.secret)"><SvgIcon icon="mdi:content-copy" /></ElButton>
        </div>
      </div>
      <div class="secret-help">{{ t('automation.trigger.callbackPathHelp') }}</div>
      <template #footer>
        <ElButton type="primary" @click="secretVisible = false">{{ t('automation.trigger.savedSecret') }}</ElButton>
      </template>
    </ElDialog>
    <AutomationConfigHelp v-model="helpVisible" topic="trigger" />
  </div>
</template>

<style scoped>
.trigger-root {
  height: 100%;
  min-width: 0;
  min-height: 0;
}
.trigger-page {
  display: grid;
  height: 100%;
  min-width: 0;
  min-height: 0;
  grid-template-rows: auto auto auto auto minmax(0, 1fr) auto;
  gap: 12px;
  padding: 18px;
  overflow: hidden;
  background: #f3f5f7;
  color: #303840;
}
.trigger-page > * {
  min-width: 0;
}
.page-heading,
.filter-band {
  display: flex;
  align-items: center;
}
.page-heading {
  justify-content: space-between;
}
.page-heading h1 {
  margin: 0;
  font-size: 20px;
  letter-spacing: 0;
}
.page-heading p {
  margin: 4px 0 0;
  color: #7b848d;
  font-size: 13px;
}
.type-band,
.filter-band,
.pagination-band {
  min-width: 0;
  padding: 11px 14px;
  background: #fff;
}
.type-guide {
  box-sizing: border-box;
}
.editor-guide {
  margin-bottom: 14px;
}
.filter-band {
  gap: 10px;
  border-bottom: 1px solid #e2e6e9;
}
.filter-band > span {
  margin-left: auto;
  color: #78818a;
  font-size: 12px;
}
.filter-band :deep(.el-input-number) {
  width: 190px;
}
.filter-band :deep(.el-select) {
  width: 150px;
}
.table-band {
  display: grid;
  min-width: 0;
  min-height: 0;
  grid-template-rows: auto minmax(0, 1fr);
  overflow: hidden;
  padding: 0 14px;
  background: #fff;
}
.records-table {
  min-width: 0;
  min-height: 0;
  grid-row: 2;
}
.pagination-band {
  display: flex;
  min-height: 54px;
  align-items: center;
  justify-content: flex-end;
  overflow: hidden;
}
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.form-grid :deep(.el-input-number),
.form-grid :deep(.el-select),
.el-form-item :deep(.el-select) {
  width: 100%;
}
.secret-list code {
  font-family: Consolas, 'Courier New', monospace;
}
.trigger-json-tabs {
  margin-top: 4px;
}
.field-help,
.json-hint,
.secret-help {
  width: 100%;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  line-height: 1.55;
}
.field-help,
.json-hint {
  margin-top: 5px;
}
.secret-help {
  margin-top: 12px;
}
.secret-list {
  display: grid;
  gap: 10px;
  margin-top: 16px;
}
.secret-list > div {
  display: grid;
  grid-template-columns: 90px minmax(0, 1fr) 34px;
  align-items: center;
  gap: 8px;
}
.secret-list span {
  color: #77818a;
  font-size: 12px;
}
.secret-list code {
  overflow: auto;
  padding: 8px;
  border: 1px solid #e0e5e8;
  background: #f6f8f9;
  font-size: 12px;
  white-space: nowrap;
}
</style>
