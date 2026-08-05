<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import {
  type AutomationWorkflow,
  type WorkflowDefinition,
  type WorkflowDetail,
  type WorkflowNodeDefinition,
  fetchArchiveWorkflow,
  fetchCreateWorkflow,
  fetchDeleteWorkflow,
  fetchPublishWorkflow,
  fetchRestoreWorkflow,
  fetchStartWorkflow,
  fetchUpdateWorkflow,
  fetchValidateWorkflow,
  fetchWorkflowDetail,
  fetchWorkflows
} from '@/service/api/automation';
import { formatAutomationTime as formatTime } from '@/utils/automation-time';
import { $t } from '@/locales';
import ConfigCodeEditor from '@/views/rag/shared/config-code-editor.vue';
import AutomationConfigHelp from '../components/automation-config-help.vue';
import AutomationLoadError from '../components/automation-load-error.vue';
import { automationStatusLabel } from '../automation-enum-label';
import WorkflowDesigner from './components/workflow-designer.vue';

defineOptions({ name: 'AutomationWorkflow' });
const t = $t;

type SaveState = 'saved' | 'dirty' | 'saving' | 'conflict' | 'error';

const loading = ref(false);
const loadError = ref('');
const records = ref<AutomationWorkflow[]>([]);
const total = ref(0);
const query = reactive({ page: 1, size: 20, keyword: '', status: '' });
const mode = ref<'list' | 'editor'>('list');
const detail = ref<WorkflowDetail>();
const definition = ref<WorkflowDefinition>(emptyDefinition());
const saveState = ref<SaveState>('saved');
const validationErrors = ref<string[]>([]);
const validating = ref(false);
const publishing = ref(false);
const createVisible = ref(false);
const runVisible = ref(false);
const dslVisible = ref(false);
const helpVisible = ref(false);
const createStep = ref(0);
const templateKey = ref<'blank' | 'sequential' | 'approval' | 'batch'>('blank');
const createFormRef = ref<FormInstance>();
const designerRef = ref<InstanceType<typeof WorkflowDesigner>>();
const createForm = reactive({ name: '', code: '', description: '' });
const runInput = ref('{}');
const runVariables = ref('{}');
const runConfigTab = ref<'input' | 'variables'>('input');
let saveTimer: ReturnType<typeof setTimeout> | undefined;
let saveSequence = 0;

const createRules: FormRules = {
  name: [{ required: true, message: t('automation.workflow.nameRequired'), trigger: 'blur' }],
  code: [
    { required: true, message: t('automation.workflow.codeRequired'), trigger: 'blur' },
    {
      pattern: /^[a-z][a-z0-9_]{2,63}$/,
      message: t('automation.workflow.codeRule'),
      trigger: 'blur'
    }
  ]
};

const workflow = computed(() => detail.value?.workflow);
const publishedVersion = computed(() => detail.value?.publishedVersion);
const canRunPublishedVersion = computed(() => Boolean(workflow.value?.publishedVersionId && publishedVersion.value));
const hasUnpublishedDraft = computed(
  () => Boolean(publishedVersion.value && detail.value?.currentVersion.id !== publishedVersion.value.id)
);
const publishedRunLabel = computed(() =>
  publishedVersion.value
    ? t('automation.workflow.runPublishedVersion', { version: publishedVersion.value.version })
    : t('automation.workflow.noPublishedVersion')
);
const dslText = computed(() => JSON.stringify(definition.value, null, 2));
const saveLabel = computed(
  () =>
    ({
      saved: t('automation.workflow.saved'),
      dirty: t('automation.workflow.dirty'),
      saving: t('automation.workflow.saving'),
      conflict: t('automation.workflow.conflict'),
      error: t('automation.workflow.saveError')
    })[saveState.value]
);
const saveType = computed(
  () =>
    ({
      saved: 'success',
      dirty: 'warning',
      saving: 'info',
      conflict: 'danger',
      error: 'danger'
    })[saveState.value] as 'success' | 'warning' | 'info' | 'danger'
);
const templateOptions = computed(() => [
  { key: 'blank' as const, label: t('automation.workflow.templates.blank'), hint: t('automation.workflow.templateHints.blank') },
  { key: 'sequential' as const, label: t('automation.workflow.templates.sequential'), hint: t('automation.workflow.templateHints.sequential') },
  { key: 'approval' as const, label: t('automation.workflow.templates.approval'), hint: t('automation.workflow.templateHints.approval') },
  { key: 'batch' as const, label: t('automation.workflow.templates.batch'), hint: t('automation.workflow.templateHints.batch') }
]);

function emptyDefinition(): WorkflowDefinition {
  return {
    schemaVersion: 2,
    nodes: [],
    edges: [],
    inputSchema: { type: 'object', properties: {} },
    outputSchema: { type: 'object', properties: {} },
    variablesSchema: { type: 'object', properties: {} },
    finalOutput: [],
    policies: {},
    resourceBindings: []
  };
}

function starterDefinition(template: typeof templateKey.value = 'blank'): WorkflowDefinition {
  const base = emptyDefinition();
  const start: WorkflowNodeDefinition =
    {
      id: 'start',
      type: 'start',
      name: t('automation.designer.nodes.start'),
      config: {},
      inputSchema: {},
      inputMapping: [],
      outputSchema: {},
      outputMapping: [],
      executionPolicy: {
        maxRetries: 0,
        retryDelay: 'PT10S',
        timeoutMs: 60000,
        failurePolicy: 'FAIL_WORKFLOW'
      }
    };
  const end: WorkflowNodeDefinition =
    {
      id: 'end',
      type: 'end',
      name: t('automation.designer.nodes.end'),
      config: {},
      inputSchema: {},
      inputMapping: [],
      outputSchema: {},
      outputMapping: [],
      executionPolicy: {
        maxRetries: 0,
        retryDelay: 'PT10S',
        timeoutMs: 60000,
        failurePolicy: 'FAIL_WORKFLOW'
      }
    };
  base.nodes = [start, end];
  base.edges = [{ id: 'edge_start_end', source: 'start', target: 'end', defaultBranch: false }];
  const positions: Record<string, { x: number; y: number }> = { start: { x: 100, y: 180 }, end: { x: 430, y: 180 } };
  if (template === 'sequential') {
    const task: WorkflowNodeDefinition = {
      ...start,
      id: 'task',
      type: 'builtin',
      name: t('automation.designer.nodes.builtin'),
      config: { toolCode: 'current_datetime' }
    };
    base.nodes = [start, task, end];
    base.edges = [
      { id: 'edge_start_task', source: 'start', target: 'task', defaultBranch: false },
      { id: 'edge_task_end', source: 'task', target: 'end', defaultBranch: false }
    ];
    Object.assign(positions, { task: { x: 330, y: 180 }, end: { x: 560, y: 180 } });
  }
  if (template === 'approval') {
    const wait: WorkflowNodeDefinition = { ...start, id: 'waitApproval', type: 'wait_event', name: t('automation.designer.nodes.wait_event') };
    base.nodes = [start, wait, end];
    base.edges = [
      { id: 'edge_start_wait', source: 'start', target: 'waitApproval', defaultBranch: false },
      { id: 'edge_wait_end', source: 'waitApproval', target: 'end', defaultBranch: false }
    ];
    Object.assign(positions, { waitApproval: { x: 330, y: 180 }, end: { x: 560, y: 180 } });
  }
  if (template === 'batch') {
    const batch: WorkflowNodeDefinition = {
      ...start,
      id: 'batch', type: 'batch_loop', name: t('automation.designer.nodes.batch_loop'),
      config: {
        itemsPath: 'workflow.input.items', batchSize: 50, maxConcurrency: 4,
        rateLimitPerSecond: 10, maxAttempts: 2, failureThreshold: 1,
        body: { id: 'loop_item', type: 'builtin', name: t('automation.designer.nodes.builtin'), config: { toolCode: 'current_datetime' } }
      }
    };
    base.inputSchema = { type: 'object', required: ['items'], properties: { items: { type: 'array', items: {} } } };
    base.nodes = [start, batch, end];
    base.edges = [
      { id: 'edge_start_batch', source: 'start', target: 'batch', defaultBranch: false },
      { id: 'edge_batch_end', source: 'batch', target: 'end', defaultBranch: false }
    ];
    Object.assign(positions, { batch: { x: 330, y: 180 }, end: { x: 560, y: 180 } });
  }
  base.policies = {
    designer: {
      positions
    }
  };
  return base;
}

function parseDefinition(value?: string): WorkflowDefinition {
  if (!value) return starterDefinition();
  try {
    return { ...emptyDefinition(), ...JSON.parse(value) };
  } catch {
    return starterDefinition();
  }
}

async function loadList() {
  loading.value = true;
  try {
    const { data, error } = (await fetchWorkflows({
      page: query.page,
      size: query.size,
      keyword: query.keyword || undefined,
      status: query.status || undefined
    })) as any;
    if (!error && data) {
      loadError.value = '';
      records.value = data.records || [];
      total.value = Number(data.total || 0);
    } else {
      records.value = [];
      total.value = 0;
      loadError.value = error?.message || t('automation.common.loadFailed');
    }
  } finally {
    loading.value = false;
  }
}

function search() {
  query.page = 1;
  loadList();
}

function resetSearch() {
  query.keyword = '';
  query.status = '';
  search();
}

function openCreate() {
  Object.assign(createForm, { name: '', code: '', description: '' });
  createStep.value = 0;
  templateKey.value = 'blank';
  createVisible.value = true;
  nextTick(() => createFormRef.value?.clearValidate());
}

async function createWorkflow() {
  if (!(await createFormRef.value?.validate().catch(() => false))) return;
  const { data, error } = (await fetchCreateWorkflow({
    ...createForm,
    definition: starterDefinition(templateKey.value)
  })) as any;
  if (error || !data) return;
  createVisible.value = false;
  ElMessage.success(t('automation.workflow.created'));
  await enterEditor(data);
}

async function openWorkflow(row: AutomationWorkflow) {
  if (row.status === 'ARCHIVED') return;
  loading.value = true;
  try {
    const { data, error } = (await fetchWorkflowDetail(row.id)) as any;
    if (!error && data) await enterEditor(data);
  } finally {
    loading.value = false;
  }
}

async function archiveWorkflow(row: AutomationWorkflow) {
  try {
    await ElMessageBox.confirm(
      t('automation.workflow.archiveConfirm', { name: row.name }),
      t('automation.workflow.archive'),
      { type: 'warning' }
    );
  } catch {
    return;
  }
  const { error } = (await fetchArchiveWorkflow(row.id)) as any;
  if (error) return;
  ElMessage.success(t('automation.workflow.archivedMessage'));
  await loadList();
}

async function restoreWorkflow(row: AutomationWorkflow) {
  const { data, error } = (await fetchRestoreWorkflow(row.id)) as any;
  if (error || !data) return;
  ElMessage.success(t('automation.workflow.restoredMessage'));
  await enterEditor(data);
}

async function deleteWorkflow(row: AutomationWorkflow) {
  try {
    await ElMessageBox.confirm(
      t('automation.workflow.deleteConfirm', { name: row.name }),
      t('automation.workflow.delete'),
      { type: 'warning' }
    );
  } catch {
    return;
  }
  const { error } = (await fetchDeleteWorkflow(row.id)) as any;
  if (error) return;
  ElMessage.success(t('automation.workflow.deletedMessage'));
  await loadList();
}

async function enterEditor(value: WorkflowDetail) {
  clearTimeout(saveTimer);
  detail.value = value;
  definition.value = parseDefinition(value.currentVersion?.definitionJson);
  validationErrors.value = value.currentVersion?.validationErrors
    ? safeErrors(value.currentVersion.validationErrors)
    : [];
  saveState.value = 'saved';
  mode.value = 'editor';
}

function safeErrors(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [value];
  } catch {
    return value ? [value] : [];
  }
}

async function leaveEditor() {
  if (saveState.value === 'dirty') await saveDraft(false);
  clearTimeout(saveTimer);
  mode.value = 'list';
  detail.value = undefined;
  validationErrors.value = [];
  await loadList();
}

function scheduleSave() {
  validationErrors.value = [];
  saveState.value = 'dirty';
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveDraft(false), 1200);
}

async function saveDraft(showMessage = true): Promise<boolean> {
  if (!workflow.value || saveState.value === 'saving') return saveState.value === 'saved';
  clearTimeout(saveTimer);
  saveSequence += 1;
  const sequence = saveSequence;
  saveState.value = 'saving';
  const payload = JSON.parse(JSON.stringify(definition.value));
  const { data, error } = (await fetchUpdateWorkflow(workflow.value.id, {
    name: workflow.value.name,
    description: workflow.value.description,
    definition: payload
  })) as any;
  if (sequence !== saveSequence) return false;
  if (error || !data) {
    const status = Number(error?.response?.status || error?.status || 0);
    saveState.value = status === 409 ? 'conflict' : 'error';
    if (status === 409) ElMessage.error(t('automation.workflow.conflictMessage'));
    return false;
  }
  detail.value = data;
  saveState.value = 'saved';
  if (showMessage) ElMessage.success(t('automation.workflow.draftSaved'));
  return true;
}

async function reloadDraft() {
  if (!workflow.value) return;
  const { data, error } = (await fetchWorkflowDetail(workflow.value.id)) as any;
  if (!error && data) await enterEditor(data);
}

async function validateWorkflow(): Promise<boolean> {
  if (!workflow.value || !(await saveDraft(false))) return false;
  validating.value = true;
  try {
    const { data, error } = (await fetchValidateWorkflow(workflow.value.id)) as any;
    if (error || !data) return false;
    validationErrors.value = data.errors || [];
    if (data.valid) {
      ElMessage.success(t('automation.workflow.validationPassed'));
      return true;
    }
    ElMessage.error(t('automation.workflow.validationFailed', { count: validationErrors.value.length }));
    focusFirstError();
    return false;
  } finally {
    validating.value = false;
  }
}

function focusFirstError() {
  const error = validationErrors.value[0] || '';
  const node = definition.value.nodes.find(item => error.includes(item.id));
  if (node) designerRef.value?.focusNode(node.id);
}

async function publishWorkflow() {
  if (!workflow.value || !(await validateWorkflow())) return;
  try {
    await ElMessageBox.confirm(
      t('automation.workflow.publishConfirm', { version: workflow.value.currentVersion }),
      t('automation.workflow.publishTitle'),
      { type: 'warning', confirmButtonText: t('automation.workflow.publish'), cancelButtonText: t('automation.common.cancel') }
    );
  } catch {
    return;
  }
  publishing.value = true;
  try {
    const { data, error } = (await fetchPublishWorkflow(workflow.value.id)) as any;
    if (!error && data) {
      detail.value = data;
      ElMessage.success(t('automation.workflow.publishedMessage'));
    }
  } finally {
    publishing.value = false;
  }
}

function openRun() {
  if (!canRunPublishedVersion.value) {
    ElMessage.warning(t('automation.workflow.publishBeforeRun'));
    return;
  }
  runInput.value = '{}';
  runVariables.value = '{}';
  runConfigTab.value = 'input';
  runVisible.value = true;
}

async function startRun() {
  if (!workflow.value) return;
  let input: unknown;
  let variables: unknown;
  try {
    input = JSON.parse(runInput.value || '{}');
    variables = JSON.parse(runVariables.value || '{}');
  } catch {
    ElMessage.error(t('automation.workflow.runJsonInvalid'));
    return;
  }
  const { data, error } = (await fetchStartWorkflow(workflow.value.id, {
    input,
    variables
  })) as any;
  if (!error && data) {
    runVisible.value = false;
    ElMessage.success(t('automation.workflow.runSubmitted', { id: data.id }));
  }
}

function statusType(status: string) {
  if (status === 'PUBLISHED') return 'success';
  if (status === 'ARCHIVED') return 'info';
  return 'warning';
}

onMounted(loadList);
onBeforeUnmount(() => clearTimeout(saveTimer));
</script>

<template>
  <div class="workflow-route">
    <div v-if="mode === 'list'" class="workflow-page">
      <div class="page-heading">
        <div>
          <h1>{{ t('automation.workflow.title') }}</h1>
          <p>{{ t('automation.workflow.description') }}</p>
        </div>
        <div class="page-heading-actions">
          <ElTooltip :content="t('automation.common.configurationHelp')">
            <ElButton
              circle
              :aria-label="t('automation.common.configurationHelp')"
              @click="helpVisible = true"
            >
              <SvgIcon icon="mdi:help-circle-outline" />
            </ElButton>
          </ElTooltip>
          <ElButton type="primary" @click="openCreate">
            <SvgIcon icon="mdi:plus" />
            {{ t('automation.workflow.create') }}
          </ElButton>
        </div>
      </div>
      <div class="filter-band">
        <ElInput v-model="query.keyword" clearable :placeholder="t('automation.workflow.searchPlaceholder')" @keyup.enter="search">
          <template #prefix><SvgIcon icon="mdi:magnify" /></template>
        </ElInput>
        <ElSelect v-model="query.status" clearable :placeholder="t('automation.common.allStatus')">
          <ElOption :label="t('automation.workflow.draft')" value="DRAFT" />
          <ElOption :label="t('automation.workflow.published')" value="PUBLISHED" />
          <ElOption :label="t('automation.workflow.archived')" value="ARCHIVED" />
        </ElSelect>
        <ElButton type="primary" plain @click="search">{{ t('automation.common.search') }}</ElButton>
        <ElButton @click="resetSearch">{{ t('automation.common.reset') }}</ElButton>
        <span class="result-count">{{ t('automation.common.totalItems', { count: total }) }}</span>
      </div>
      <div class="table-band">
        <AutomationLoadError v-if="loadError" :message="loadError" @retry="loadList" />
        <ElTable v-loading="loading" :data="records" height="100%" @row-dblclick="openWorkflow">
          <ElTableColumn :label="t('automation.common.workflow')" min-width="240">
            <template #default="{ row }">
              <div class="workflow-cell">
                <span class="workflow-mark"><SvgIcon icon="mdi:transit-connection-variant" /></span>
                <div>
                  <strong>{{ row.name }}</strong>
                  <span>{{ row.code }}</span>
                </div>
              </div>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="description" :label="t('automation.workflow.descriptionLabel')" min-width="260" show-overflow-tooltip />
          <ElTableColumn :label="t('automation.common.version')" width="100" align="center">
            <template #default="{ row }">v{{ row.currentVersion }}</template>
          </ElTableColumn>
          <ElTableColumn :label="t('automation.common.status')" width="110" align="center">
            <template #default="{ row }">
              <ElTag :type="statusType(row.status)" size="small">{{ automationStatusLabel(row.status) }}</ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn :label="t('automation.common.updatedAt')" width="180">
            <template #default="{ row }">{{ formatTime(row.updatedAt) }}</template>
          </ElTableColumn>
          <ElTableColumn :label="t('automation.common.action')" width="220" fixed="right" align="center">
            <template #default="{ row }">
              <ElButton v-if="row.status !== 'ARCHIVED'" link type="primary" @click="openWorkflow(row)">
                {{ t('automation.workflow.openDesigner') }}
              </ElButton>
              <ElButton v-if="row.status !== 'ARCHIVED'" link type="warning" @click="archiveWorkflow(row)">
                {{ t('automation.workflow.archive') }}
              </ElButton>
              <ElButton v-if="row.status === 'ARCHIVED'" link type="primary" @click="restoreWorkflow(row)">
                {{ t('automation.workflow.restore') }}
              </ElButton>
              <ElButton
                v-if="row.status === 'DRAFT' && !row.publishedVersionId"
                link
                type="danger"
                @click="deleteWorkflow(row)"
              >
                {{ t('automation.workflow.delete') }}
              </ElButton>
            </template>
          </ElTableColumn>
        </ElTable>
      </div>
      <div class="pagination-band">
        <ElPagination
          v-model:current-page="query.page"
          v-model:page-size="query.size"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @current-change="loadList"
          @size-change="search"
        />
      </div>
    </div>

    <div v-else class="editor-page">
      <header class="editor-header">
        <div class="editor-identity">
          <ElButton text circle @click="leaveEditor"><SvgIcon icon="mdi:arrow-left" /></ElButton>
          <span class="editor-symbol"><SvgIcon icon="mdi:transit-connection-variant" /></span>
          <div>
            <div class="editor-title">
              <strong>{{ workflow?.name }}</strong>
              <ElTag size="small" :type="statusType(workflow?.status || 'DRAFT')">
                v{{ workflow?.currentVersion }}
              </ElTag>
            </div>
            <span>{{ workflow?.code }}</span>
          </div>
        </div>
        <div class="editor-actions">
          <ElTag class="save-status" :type="saveType" effect="plain" size="small">
            <SvgIcon
              :icon="
                saveState === 'saving'
                  ? 'mdi:loading'
                  : saveState === 'saved'
                    ? 'mdi:check-circle-outline'
                    : 'mdi:alert-circle-outline'
              "
              :class="{ spinning: saveState === 'saving' }"
            />
            <span>{{ saveLabel }}</span>
          </ElTag>
          <ElButton v-if="saveState === 'conflict'" type="danger" plain @click="reloadDraft">{{ t('automation.workflow.reload') }}</ElButton>
          <ElTooltip :content="t('automation.workflow.readonlyDsl')">
            <ElButton circle :aria-label="t('automation.workflow.readonlyDsl')" @click="dslVisible = true">
              <SvgIcon icon="mdi:code-json" />
            </ElButton>
          </ElTooltip>
          <ElTooltip :content="t('automation.common.configurationHelp')">
            <ElButton circle :aria-label="t('automation.common.configurationHelp')" @click="helpVisible = true">
              <SvgIcon icon="mdi:help-circle-outline" />
            </ElButton>
          </ElTooltip>
          <ElButton :loading="validating" @click="validateWorkflow">
            <SvgIcon icon="mdi:check-decagram-outline" />
            {{ t('automation.workflow.validate') }}
          </ElButton>
          <ElTooltip :content="t('automation.workflow.publishedRunHint')">
            <span>
              <ElButton :disabled="!canRunPublishedVersion" @click="openRun">
                <SvgIcon icon="mdi:play-outline" />
                {{ publishedRunLabel }}
              </ElButton>
            </span>
          </ElTooltip>
          <ElButton @click="saveDraft(true)">
            <SvgIcon icon="mdi:content-save-outline" />
            {{ t('automation.common.save') }}
          </ElButton>
          <ElButton type="primary" :loading="publishing" @click="publishWorkflow">
            <SvgIcon icon="mdi:publish" />
            {{ t('automation.workflow.publish') }}
          </ElButton>
        </div>
      </header>
      <div v-if="validationErrors.length" class="validation-bar">
        <SvgIcon icon="mdi:alert-circle-outline" />
        <span>{{ validationErrors[0] }}</span>
        <ElButton link type="danger" @click="focusFirstError">{{ t('automation.common.locate') }}</ElButton>
        <ElPopover placement="bottom-end" :width="520" trigger="click">
          <template #reference>
            <ElButton link>{{ t('automation.workflow.viewAllErrors', { count: validationErrors.length }) }}</ElButton>
          </template>
          <ol class="error-list">
            <li v-for="error in validationErrors" :key="error">{{ error }}</li>
          </ol>
        </ElPopover>
      </div>
      <div class="designer-host">
        <WorkflowDesigner
          ref="designerRef"
          v-model="definition"
          :validation-errors="validationErrors"
          @change="scheduleSave"
        />
      </div>
    </div>

    <ElDialog v-model="createVisible" :title="t('automation.workflow.createTitle')" width="620px" destroy-on-close>
      <ElSteps :active="createStep" finish-status="success" simple class="create-steps">
        <ElStep :title="t('automation.workflow.template')" />
        <ElStep :title="t('automation.common.name')" />
      </ElSteps>
      <div v-if="createStep === 0" class="template-grid">
        <button
          v-for="option in templateOptions"
          :key="option.key"
          type="button"
          :class="['template-option', { active: templateKey === option.key }]"
          @click="templateKey = option.key"
        >
          <strong>{{ option.label }}</strong>
          <span>{{ option.hint }}</span>
        </button>
      </div>
      <ElForm v-else ref="createFormRef" :model="createForm" :rules="createRules" label-position="top">
        <ElFormItem :label="t('automation.common.name')" prop="name">
          <ElInput v-model="createForm.name" :placeholder="t('automation.workflow.namePlaceholder')" maxlength="80" />
        </ElFormItem>
        <ElFormItem :label="t('automation.workflow.code')" prop="code">
          <ElInput v-model="createForm.code" :placeholder="t('automation.workflow.codePlaceholder')" maxlength="64" />
        </ElFormItem>
        <ElFormItem :label="t('automation.workflow.descriptionLabel')">
          <ElInput
            v-model="createForm.description"
            type="textarea"
            :rows="3"
            :placeholder="t('automation.workflow.descriptionPlaceholder')"
            maxlength="500"
            show-word-limit
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="createVisible = false">{{ t('automation.common.cancel') }}</ElButton>
        <ElButton v-if="createStep > 0" @click="createStep = 0">{{ t('automation.common.previous') }}</ElButton>
        <ElButton v-if="createStep === 0" type="primary" @click="createStep = 1">{{ t('automation.common.next') }}</ElButton>
        <ElButton v-else type="primary" @click="createWorkflow">{{ t('automation.workflow.createAndDesign') }}</ElButton>
      </template>
    </ElDialog>

    <ElDialog v-model="runVisible" :title="publishedRunLabel" width="680px" destroy-on-close>
      <ElAlert
        :title="
          hasUnpublishedDraft
            ? t('automation.workflow.draftNotIncluded', {
                draftVersion: detail?.currentVersion.version,
                publishedVersion: publishedVersion?.version
              })
            : t('automation.workflow.publishedRunNotice', { version: publishedVersion?.version })
        "
        :type="hasUnpublishedDraft ? 'warning' : 'info'"
        :closable="false"
        show-icon
        class="run-version-alert"
      />
      <ElTabs v-model="runConfigTab" stretch>
        <ElTabPane :label="t('automation.workflow.input')" name="input">
          <ConfigCodeEditor v-model="runInput" :rows="14" expected-root="object" />
        </ElTabPane>
        <ElTabPane :label="t('automation.workflow.variables')" name="variables">
          <ConfigCodeEditor v-model="runVariables" :rows="14" expected-root="object" />
        </ElTabPane>
      </ElTabs>
      <template #footer>
        <ElButton @click="runVisible = false">{{ t('automation.common.cancel') }}</ElButton>
        <ElButton type="primary" @click="startRun">
          <SvgIcon icon="mdi:play" />
          {{ t('automation.workflow.submitRun') }}
        </ElButton>
      </template>
    </ElDialog>

    <ElDrawer v-model="dslVisible" :title="t('automation.workflow.dslTitle')" size="520px">
      <pre class="dsl-view">{{ dslText }}</pre>
    </ElDrawer>
    <AutomationConfigHelp v-model="helpVisible" topic="workflow" />
  </div>
</template>

<style scoped>
.workflow-route {
  height: 100%;
  min-height: 0;
}
.workflow-page,
.editor-page {
  height: 100%;
  min-height: 0;
  background: #f3f5f7;
  color: #303840;
}
.workflow-page {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  gap: 14px;
  padding: 18px;
  overflow: hidden;
}
.workflow-page > * {
  min-width: 0;
}
.page-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.page-heading-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
}
.page-heading h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 650;
  letter-spacing: 0;
}
.page-heading p {
  margin: 4px 0 0;
  color: #7b848d;
  font-size: 13px;
}
.filter-band {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid #e2e6e9;
  background: #fff;
}
.filter-band :deep(.el-input) {
  width: 260px;
}
.filter-band :deep(.el-select) {
  width: 150px;
}
.result-count {
  margin-left: auto;
  color: #78818a;
  font-size: 12px;
}
.run-version-alert {
  margin-bottom: 12px;
}
.table-band {
  min-height: 0;
  padding: 0 14px;
  background: #fff;
  overflow: hidden;
}
.pagination-band {
  display: flex;
  justify-content: flex-end;
  padding: 10px 14px;
  background: #fff;
}
.workflow-cell {
  display: flex;
  align-items: center;
  gap: 11px;
}
.workflow-cell > div {
  display: flex;
  min-width: 0;
  flex-direction: column;
}
.workflow-cell strong {
  color: #303840;
  font-size: 14px;
}
.workflow-cell span {
  color: #89919a;
  font-size: 12px;
}
.workflow-mark,
.editor-symbol {
  display: grid;
  place-items: center;
  border-radius: 6px;
  background: #e8f3f5;
  color: #176b87;
}
.workflow-mark {
  width: 34px;
  height: 34px;
  font-size: 18px;
}
.editor-symbol {
  width: 36px;
  height: 36px;
  font-size: 20px;
}
.editor-page {
  display: grid;
  grid-template-rows: 58px auto minmax(0, 1fr);
  overflow: hidden;
}
.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 14px 0 8px;
  border-bottom: 1px solid #dfe3e7;
  background: #fff;
}
.editor-identity,
.editor-actions,
.editor-title {
  display: flex;
  align-items: center;
}
.editor-identity {
  min-width: 0;
  gap: 9px;
}
.editor-identity > div:last-child {
  display: flex;
  min-width: 0;
  flex-direction: column;
}
.editor-title {
  gap: 8px;
}
.editor-title strong {
  overflow: hidden;
  max-width: 260px;
  color: #293138;
  font-size: 15px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.editor-identity span {
  color: #8b939b;
  font-size: 11px;
}
.editor-actions {
  flex: 0 0 auto;
  gap: 7px;
}
.save-status {
  min-width: 72px;
  padding-inline: 8px;
  white-space: nowrap;
}
.save-status :deep(.el-tag__content) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  line-height: 1;
}
.save-status :deep(svg) {
  flex: 0 0 auto;
}
.spinning {
  animation: spin 1s linear infinite;
}
.validation-bar {
  display: flex;
  min-width: 0;
  height: 38px;
  align-items: center;
  gap: 7px;
  padding: 0 14px;
  border-bottom: 1px solid #f1b8b8;
  background: #fff2f2;
  color: #aa3030;
  font-size: 12px;
}
.validation-bar > span {
  overflow: hidden;
  flex: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.designer-host {
  min-height: 0;
  padding: 10px;
  overflow: hidden;
}
.error-list {
  max-height: 360px;
  margin: 0;
  overflow: auto;
  padding-left: 22px;
  color: #5f3333;
  font-size: 12px;
  line-height: 1.8;
}
.dsl-view {
  font-family: Consolas, 'Courier New', monospace;
}
.create-steps {
  margin-bottom: 18px;
}
.template-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.template-option {
  display: grid;
  min-height: 88px;
  gap: 7px;
  align-content: center;
  padding: 14px;
  border: 1px solid #dfe3e7;
  border-radius: 6px;
  background: #fff;
  color: #303840;
  cursor: pointer;
  text-align: left;
}
.template-option:hover,
.template-option.active {
  border-color: #16845b;
  background: #f1faf6;
}
.template-option span {
  color: #78818a;
  font-size: 12px;
  line-height: 1.5;
}
.dsl-view {
  min-height: 100%;
  margin: 0;
  padding: 16px;
  overflow: auto;
  border: 1px solid #dfe3e7;
  border-radius: 5px;
  background: #f6f8fa;
  color: #2f3942;
  font-size: 12px;
  line-height: 1.55;
  white-space: pre-wrap;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@media (max-width: 1100px) {
  .editor-header {
    overflow-x: auto;
  }
  .editor-actions {
    padding-right: 4px;
  }
  .page-heading p {
    display: none;
  }
}
</style>
