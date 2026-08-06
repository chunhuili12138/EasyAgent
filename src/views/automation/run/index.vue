<script setup lang="ts">
import { computed, onMounted, reactive, ref, shallowRef } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { type Edge, MarkerType, type Node, VueFlow, type VueFlowStore } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { Controls } from '@vue-flow/controls';
import { MiniMap } from '@vue-flow/minimap';
import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
import '@vue-flow/controls/dist/style.css';
import '@vue-flow/minimap/dist/style.css';
import {
  type AutomationLoopBatch,
  type AutomationLoopItem,
  type AutomationWorkflow,
  type AutomationWorkflowRun,
  type WorkflowDefinition,
  type WorkflowRunDetail,
  fetchAutomationLoopBatches,
  fetchAutomationLoopItems,
  fetchCancelWorkflowRun,
  fetchRetryWorkflowRun,
  fetchWorkflowRunDetail,
  fetchWorkflowRuns,
  fetchWorkflows
} from '@/service/api/automation';
import { formatAutomationTime as formatTime, parseAutomationTime } from '@/utils/automation-time';
import { $t } from '@/locales';
import AutomationConfigHelp from '../components/automation-config-help.vue';
import AutomationLoadError from '../components/automation-load-error.vue';
import {
  automationEventTypeLabel,
  automationNodeTypeLabel,
  automationStatusLabel,
  automationTriggerTypeLabel
} from '../automation-enum-label';

defineOptions({ name: 'AutomationRun' });
const t = $t;

const loading = ref(false);
const loadError = ref('');
const records = ref<AutomationWorkflowRun[]>([]);
const total = ref(0);
const workflowOptions = ref<AutomationWorkflow[]>([]);
const detailVisible = ref(false);
const detail = ref<WorkflowRunDetail>();
const helpVisible = ref(false);
const activeTab = ref('graph');
const nodes = shallowRef<Node[]>([]);
const edges = shallowRef<Edge[]>([]);
const loopBatches = ref<AutomationLoopBatch[]>([]);
const loopDrawerVisible = ref(false);
const selectedBatch = ref<AutomationLoopBatch>();
const loopItems = ref<AutomationLoopItem[]>([]);
const loopItemTotal = ref(0);
const loopItemLoading = ref(false);
const loopItemQuery = reactive({ page: 1, size: 20, status: '' });
const query = reactive({ page: 1, size: 20, workflowId: undefined as number | undefined, status: '' });

const nodeStatus = computed(() => {
  const map = new Map<string, string>();
  detail.value?.nodes.forEach(node => map.set(node.nodeId, node.status));
  return map;
});

async function loadData() {
  loading.value = true;
  try {
    const { data, error } = await fetchWorkflowRuns({ ...query, status: query.status || undefined });
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

async function loadWorkflowOptions() {
  const workflows = new Map<number, AutomationWorkflow>();
  for (const status of [undefined, 'ARCHIVED']) {
    let page = 1;
    while (true) {
      const { data, error } = await fetchWorkflows({ page, size: 100, status });
      if (error || !data) break;
      for (const workflow of data.records || []) workflows.set(workflow.id, workflow);
      if (!data.records?.length || page * 100 >= Number(data.total || 0)) break;
      page += 1;
    }
  }
  workflowOptions.value = [...workflows.values()].sort((left, right) => left.name.localeCompare(right.name));
}

function search() {
  query.page = 1;
  loadData();
}
function reset() {
  query.workflowId = undefined;
  query.status = '';
  search();
}

async function openDetail(row: AutomationWorkflowRun) {
  const [{ data }, batches] = await Promise.all([
    fetchWorkflowRunDetail(row.id),
    fetchAutomationLoopBatches({ page: 1, size: 100, runId: row.id })
  ]);
  if (!data) return;
  detail.value = data;
  loopBatches.value = batches.data?.records || [];
  activeTab.value = 'graph';
  buildGraph(data.version.definitionJson);
  detailVisible.value = true;
}

function fitRunGraph(flow: VueFlowStore) {
  flow.fitView({ padding: 0.2, maxZoom: 1 });
}

async function openLoopItems(batch: AutomationLoopBatch) {
  selectedBatch.value = batch;
  loopItemQuery.page = 1;
  loopItemQuery.status = '';
  loopDrawerVisible.value = true;
  await loadLoopItems();
}

async function loadLoopItems() {
  if (!selectedBatch.value) return;
  loopItemLoading.value = true;
  try {
    const { data } = await fetchAutomationLoopItems(selectedBatch.value.id, {
      page: loopItemQuery.page,
      size: loopItemQuery.size,
      status: loopItemQuery.status || undefined
    });
    loopItems.value = data?.records || [];
    loopItemTotal.value = data?.total || 0;
  } finally {
    loopItemLoading.value = false;
  }
}

function loopProgress(batch: AutomationLoopBatch) {
  return batch.totalItems ? Math.round((batch.completedItems / batch.totalItems) * 100) : 100;
}

function buildGraph(json: string) {
  let definition: WorkflowDefinition;
  try {
    definition = JSON.parse(json);
  } catch {
    nodes.value = [];
    edges.value = [];
    return;
  }
  const positions = definition.policies?.designer?.positions || {};
  nodes.value = definition.nodes.map((node, index) => ({
    id: node.id,
    position: positions[node.id] || { x: 70 + (index % 4) * 220, y: 60 + Math.floor(index / 4) * 110 },
    label: node.name,
    data: { type: node.type },
    class: `run-node status-${(nodeStatus.value.get(node.id) || 'PENDING').toLowerCase()}`
  }));
  edges.value = definition.edges.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: 'smoothstep',
    label: edge.condition || (edge.defaultBranch ? t('automation.common.default') : ''),
    markerEnd: MarkerType.ArrowClosed
  }));
}

async function cancelRun(row: AutomationWorkflowRun) {
  await ElMessageBox.confirm(t('automation.run.cancelConfirm', { id: row.id }), t('automation.run.cancelTitle'), {
    type: 'warning'
  });
  const { error } = await fetchCancelWorkflowRun(row.id);
  if (!error) {
    ElMessage.success(t('automation.run.cancelled'));
    loadData();
  }
}

async function retryRun(row: AutomationWorkflowRun) {
  await ElMessageBox.confirm(t('automation.run.retryConfirm', { id: row.id }), t('automation.run.retryTitle'), {
    type: 'warning'
  });
  const { data } = await fetchRetryWorkflowRun(row.id);
  if (data) {
    ElMessage.success(t('automation.run.retryCreated', { id: data.id }));
    loadData();
  }
}

function isActive(status: string) {
  return ['CREATED', 'QUEUED', 'RUNNING', 'WAITING_EVENT', 'WAITING_TIMER', 'RETRY_WAIT'].includes(status);
}
function statusType(status: string) {
  if (status === 'SUCCESS') return 'success';
  if (['FAILED', 'PARTIAL_FAILURE'].includes(status)) return 'danger';
  if (isActive(status)) return 'warning';
  return 'info';
}
function duration(row: AutomationWorkflowRun) {
  if (!row.startedAt) return '-';
  const end = row.completedAt ? parseAutomationTime(row.completedAt).getTime() : Date.now();
  const ms = Math.max(0, end - parseAutomationTime(row.startedAt).getTime());
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`;
}

onMounted(() => {
  loadData();
  loadWorkflowOptions();
});
</script>

<template>
  <div class="run-route">
    <div class="run-page">
      <header class="page-heading">
        <div>
          <h1>{{ t('automation.run.title') }}</h1>
          <p>{{ t('automation.run.description') }}</p>
        </div>
        <div class="heading-actions">
          <ElButton circle :title="t('automation.common.configurationHelp')" @click="helpVisible = true">
            <SvgIcon icon="mdi:help-circle-outline" />
          </ElButton>
          <ElButton circle :title="t('automation.common.refresh')" @click="loadData">
            <SvgIcon icon="mdi:refresh" />
          </ElButton>
        </div>
      </header>
      <div class="filter-band">
        <ElSelect
          v-model="query.workflowId"
          class="workflow-filter"
          clearable
          filterable
          :placeholder="t('automation.run.selectWorkflow')"
        >
          <ElOption
            v-for="workflow in workflowOptions"
            :key="workflow.id"
            :label="`${workflow.name} (${workflow.code})`"
            :value="workflow.id"
          />
        </ElSelect>
        <ElSelect v-model="query.status" clearable :placeholder="t('automation.common.allStatus')">
          <ElOption
            v-for="value in [
              'CREATED',
              'QUEUED',
              'RUNNING',
              'WAITING_EVENT',
              'WAITING_TIMER',
              'RETRY_WAIT',
              'SUCCESS',
              'PARTIAL_FAILURE',
              'FAILED',
              'CANCELLED'
            ]"
            :key="value"
            :label="automationStatusLabel(value)"
            :value="value"
          />
        </ElSelect>
        <ElButton type="primary" @click="search">{{ t('automation.common.search') }}</ElButton>
        <ElButton @click="reset">{{ t('automation.common.reset') }}</ElButton>
        <span class="result-count">{{ t('automation.run.instanceCount', { count: total }) }}</span>
      </div>
      <div class="table-band">
        <AutomationLoadError v-if="loadError" :message="loadError" @retry="loadData" />
        <ElTable v-loading="loading" :data="records" height="100%" class="records-table" @row-dblclick="openDetail">
          <ElTableColumn prop="id" :label="t('automation.common.runId')" width="105" />
          <ElTableColumn :label="t('automation.common.workflow')" min-width="190">
            <template #default="{ row }">
              <div class="workflow-reference">
                <strong>{{ row.workflowName || `#${row.workflowId}` }}</strong>
                <span v-if="row.workflowCode">{{ row.workflowCode }}</span>
              </div>
            </template>
          </ElTableColumn>
          <ElTableColumn :label="t('automation.common.version')" width="90">
            <template #default="{ row }">
              {{ row.workflowVersion ? `v${row.workflowVersion}` : `#${row.workflowVersionId}` }}
            </template>
          </ElTableColumn>
          <ElTableColumn :label="t('automation.run.triggerType')" width="120">
            <template #default="{ row }">{{ automationTriggerTypeLabel(row.triggerType) }}</template>
          </ElTableColumn>
          <ElTableColumn :label="t('automation.common.status')" width="150">
            <template #default="{ row }">
              <ElTag :type="statusType(row.status)" size="small">{{ automationStatusLabel(row.status) }}</ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn :label="t('automation.run.duration')" width="110">
            <template #default="{ row }">{{ duration(row) }}</template>
          </ElTableColumn>
          <ElTableColumn
            prop="errorCode"
            :label="t('automation.common.errorCode')"
            min-width="150"
            show-overflow-tooltip
          />
          <ElTableColumn
            prop="errorMessage"
            :label="t('automation.common.errorSummary')"
            min-width="220"
            show-overflow-tooltip
          />
          <ElTableColumn :label="t('automation.common.startedAt')" width="180">
            <template #default="{ row }">{{ formatTime(row.startedAt) }}</template>
          </ElTableColumn>
          <ElTableColumn :label="t('automation.common.action')" width="160" fixed="right" align="center">
            <template #default="{ row }">
              <ElTooltip :content="t('automation.run.viewDetail')">
                <ElButton link @click="openDetail(row)"><SvgIcon icon="mdi:eye-outline" /></ElButton>
              </ElTooltip>
              <ElTooltip v-if="isActive(row.status)" :content="t('automation.run.cancel')">
                <ElButton link type="danger" @click="cancelRun(row)">
                  <SvgIcon icon="mdi:stop-circle-outline" />
                </ElButton>
              </ElTooltip>
              <ElTooltip v-if="row.status === 'FAILED'" :content="t('automation.run.retry')">
                <ElButton link type="warning" @click="retryRun(row)"><SvgIcon icon="mdi:restart" /></ElButton>
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
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @current-change="loadData"
          @size-change="search"
        />
      </footer>
    </div>

    <ElDrawer
      v-model="detailVisible"
      :title="
        detail
          ? t('automation.run.detail', { name: detail.workflow.name, id: detail.run.id })
          : t('automation.run.viewDetail')
      "
      size="82%"
      destroy-on-close
    >
      <div v-if="detail" class="detail-body">
        <div class="detail-summary">
          <ElTag :type="statusType(detail.run.status)">{{ automationStatusLabel(detail.run.status) }}</ElTag>
          <span>{{ t('automation.common.version') }} v{{ detail.version.version }}</span>
          <span>{{ automationTriggerTypeLabel(detail.run.triggerType) }}</span>
          <span>{{ formatTime(detail.run.startedAt) }}</span>
          <span>{{ t('automation.run.duration') }} {{ duration(detail.run) }}</span>
          <span v-if="detail.run.retryFromRunId">
            {{ t('automation.run.retryOrigin', { id: detail.run.retryFromRunId, sequence: detail.run.retrySequence }) }}
          </span>
        </div>
        <ElTabs v-model="activeTab" class="detail-tabs">
          <ElTabPane :label="t('automation.run.graph')" name="graph">
            <div class="graph-host">
              <VueFlow
                id="run-detail-flow"
                v-model:nodes="nodes"
                v-model:edges="edges"
                :nodes-draggable="false"
                :nodes-connectable="false"
                :elements-selectable="true"
                :min-zoom="0.25"
                :max-zoom="1.8"
                @pane-ready="fitRunGraph"
              >
                <Background :gap="18" :size="1" pattern-color="#d8dde2" />
                <MiniMap pannable zoomable />
                <Controls :show-interactive="false" />
              </VueFlow>
            </div>
          </ElTabPane>
          <ElTabPane :label="t('automation.run.nodes', { count: detail.nodes.length })" name="nodes">
            <ElTable :data="detail.nodes" height="100%">
              <ElTableColumn prop="nodeId" :label="t('automation.run.node')" min-width="180" />
              <ElTableColumn :label="t('automation.common.type')" width="130">
                <template #default="{ row }">{{ automationNodeTypeLabel(row.nodeType) }}</template>
              </ElTableColumn>
              <ElTableColumn :label="t('automation.common.status')" width="140">
                <template #default="{ row }">
                  <ElTag :type="statusType(row.status)" size="small">{{ automationStatusLabel(row.status) }}</ElTag>
                </template>
              </ElTableColumn>
              <ElTableColumn prop="attemptCount" :label="t('automation.common.attempt')" width="90" />
              <ElTableColumn
                prop="errorCode"
                :label="t('automation.common.errorCode')"
                min-width="150"
                show-overflow-tooltip
              />
              <ElTableColumn
                prop="errorMessage"
                :label="t('automation.common.errorSummary')"
                min-width="260"
                show-overflow-tooltip
              />
              <ElTableColumn :label="t('automation.common.startedAt')" width="180">
                <template #default="{ row }">{{ formatTime(row.startedAt) }}</template>
              </ElTableColumn>
              <ElTableColumn :label="t('automation.common.completedAt')" width="180">
                <template #default="{ row }">{{ formatTime(row.completedAt) }}</template>
              </ElTableColumn>
            </ElTable>
          </ElTabPane>
          <ElTabPane :label="t('automation.run.attempts', { count: detail.attempts.length })" name="attempts">
            <ElTable :data="detail.attempts" height="100%">
              <ElTableColumn prop="id" label="ID" width="90" />
              <ElTableColumn prop="nodeRunId" :label="t('automation.common.nodeRun')" width="110" />
              <ElTableColumn prop="attemptNo" :label="t('automation.common.attempts')" width="70" />
              <ElTableColumn :label="t('automation.common.status')" width="130">
                <template #default="{ row }">
                  <ElTag :type="statusType(row.status)" size="small">{{ automationStatusLabel(row.status) }}</ElTag>
                </template>
              </ElTableColumn>
              <ElTableColumn prop="workerId" :label="t('automation.common.executor')" min-width="180" />
              <ElTableColumn
                prop="errorCode"
                :label="t('automation.common.errorCode')"
                min-width="150"
                show-overflow-tooltip
              />
              <ElTableColumn
                prop="errorMessage"
                :label="t('automation.common.errorSummary')"
                min-width="260"
                show-overflow-tooltip
              />
              <ElTableColumn :label="t('automation.common.startedAt')" width="180">
                <template #default="{ row }">{{ formatTime(row.startedAt) }}</template>
              </ElTableColumn>
              <ElTableColumn :label="t('automation.common.completedAt')" width="180">
                <template #default="{ row }">{{ formatTime(row.completedAt) }}</template>
              </ElTableColumn>
            </ElTable>
          </ElTabPane>
          <ElTabPane :label="t('automation.run.loopBatches', { count: loopBatches.length })" name="loops">
            <ElTable :data="loopBatches" height="100%">
              <ElTableColumn prop="id" :label="t('automation.run.batchId')" width="100" />
              <ElTableColumn
                prop="nodeId"
                :label="t('automation.run.loopNode')"
                min-width="160"
                show-overflow-tooltip
              />
              <ElTableColumn :label="t('automation.common.status')" width="140">
                <template #default="{ row }">
                  <ElTag :type="statusType(row.status)" size="small">{{ automationStatusLabel(row.status) }}</ElTag>
                </template>
              </ElTableColumn>
              <ElTableColumn :label="t('automation.run.progress')" min-width="230">
                <template #default="{ row }">
                  <div class="loop-progress">
                    <ElProgress :percentage="loopProgress(row)" :stroke-width="8" />
                    <span>
                      {{
                        t('automation.run.progressText', {
                          completed: row.completedItems,
                          failed: row.failedItems,
                          total: row.totalItems
                        })
                      }}
                    </span>
                  </div>
                </template>
              </ElTableColumn>
              <ElTableColumn prop="maxConcurrency" :label="t('automation.run.concurrency')" width="80" />
              <ElTableColumn prop="rateLimitPerSecond" :label="t('automation.run.rateLimit')" width="100" />
              <ElTableColumn :label="t('automation.common.createdAt')" width="180">
                <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
              </ElTableColumn>
              <ElTableColumn :label="t('automation.common.action')" width="120" fixed="right" align="center">
                <template #default="{ row }">
                  <ElTooltip :content="t('automation.run.viewLoopItems')">
                    <ElButton link @click="openLoopItems(row)"><SvgIcon icon="mdi:format-list-bulleted" /></ElButton>
                  </ElTooltip>
                </template>
              </ElTableColumn>
            </ElTable>
          </ElTabPane>
          <ElTabPane :label="t('automation.run.timeline', { count: detail.events.length })" name="events">
            <div class="timeline-scroll">
              <ElTimeline>
                <ElTimelineItem
                  v-for="event in detail.events"
                  :key="event.id"
                  :timestamp="formatTime(event.createdAt)"
                  placement="top"
                >
                  <ElTooltip :content="event.eventType">
                    <strong>{{ automationEventTypeLabel(event.eventType) }}</strong>
                  </ElTooltip>
                  <p>{{ event.eventKey }}</p>
                </ElTimelineItem>
              </ElTimeline>
            </div>
          </ElTabPane>
        </ElTabs>
      </div>
    </ElDrawer>

    <ElDrawer
      v-model="loopDrawerVisible"
      :title="selectedBatch ? t('automation.run.loopDetail', { id: selectedBatch.id }) : t('automation.run.loopItems')"
      size="64%"
      append-to-body
      destroy-on-close
    >
      <div class="loop-items-body">
        <div class="loop-filter">
          <ElSelect
            v-model="loopItemQuery.status"
            clearable
            :placeholder="t('automation.common.allStatus')"
            @change="loadLoopItems"
          >
            <ElOption
              v-for="value in ['PENDING', 'RUNNING', 'RETRY_WAIT', 'SUCCESS', 'FAILED', 'SKIPPED']"
              :key="value"
              :label="automationStatusLabel(value)"
              :value="value"
            />
          </ElSelect>
          <ElButton circle :title="t('automation.common.refresh')" @click="loadLoopItems">
            <SvgIcon icon="mdi:refresh" />
          </ElButton>
        </div>
        <div class="loop-items-table">
          <ElTable v-loading="loopItemLoading" :data="loopItems" height="100%">
            <ElTableColumn prop="itemIndex" label="#" width="72" />
            <ElTableColumn
              prop="itemKey"
              :label="t('automation.common.itemKey')"
              min-width="180"
              show-overflow-tooltip
            />
            <ElTableColumn :label="t('automation.common.status')" width="130">
              <template #default="{ row }">
                <ElTag :type="statusType(row.status)" size="small">{{ automationStatusLabel(row.status) }}</ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn prop="attemptCount" :label="t('automation.common.attempt')" width="90" />
            <ElTableColumn
              prop="errorMessage"
              :label="t('automation.common.errorSummary')"
              min-width="260"
              show-overflow-tooltip
            />
            <ElTableColumn :label="t('automation.run.nextRetry')" width="180">
              <template #default="{ row }">{{ formatTime(row.nextRetryAt) }}</template>
            </ElTableColumn>
            <ElTableColumn :label="t('automation.common.completedAt')" width="180">
              <template #default="{ row }">{{ formatTime(row.completedAt) }}</template>
            </ElTableColumn>
          </ElTable>
        </div>
        <div class="loop-pagination">
          <ElPagination
            v-model:current-page="loopItemQuery.page"
            v-model:page-size="loopItemQuery.size"
            :total="loopItemTotal"
            :page-sizes="[20, 50, 100]"
            layout="total, sizes, prev, pager, next"
            @current-change="loadLoopItems"
            @size-change="loadLoopItems"
          />
        </div>
      </div>
    </ElDrawer>
    <AutomationConfigHelp v-model="helpVisible" topic="runtime" />
  </div>
</template>

<style scoped>
.run-route {
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}
.run-page {
  display: grid;
  height: 100%;
  min-width: 0;
  min-height: 0;
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  gap: 12px;
  padding: 18px;
  overflow: hidden;
  background: #f3f5f7;
  color: #303840;
}
.run-page > * {
  min-width: 0;
}
.page-heading,
.filter-band,
.detail-summary {
  display: flex;
  align-items: center;
}
.page-heading {
  justify-content: space-between;
}
.heading-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
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
.filter-band,
.pagination-band {
  padding: 11px 14px;
  background: #fff;
}
.filter-band {
  gap: 10px;
  border-bottom: 1px solid #e2e6e9;
}
.filter-band :deep(.el-select) {
  width: 190px;
}
.filter-band :deep(.workflow-filter) {
  width: 280px;
}
.result-count {
  margin-left: auto;
  color: #78818a;
  font-size: 12px;
}
.table-band {
  display: grid;
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
.workflow-reference {
  display: flex;
  min-width: 0;
  flex-direction: column;
}
.workflow-reference strong,
.workflow-reference span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.workflow-reference span {
  color: #7b848d;
  font-size: 12px;
}
.pagination-band {
  display: flex;
  min-height: 54px;
  align-items: center;
  justify-content: flex-end;
  overflow: hidden;
}
.detail-body {
  display: grid;
  height: 100%;
  min-height: 0;
  grid-template-rows: auto minmax(0, 1fr);
}
.detail-summary {
  flex-wrap: wrap;
  gap: 18px;
  padding: 0 4px 12px;
  border-bottom: 1px solid #e4e8eb;
  color: #69727b;
  font-size: 13px;
}
.detail-tabs {
  display: flex;
  min-height: 0;
  flex-direction: column;
}
.detail-tabs :deep(.el-tabs__header) {
  flex: 0 0 auto;
}
.detail-tabs :deep(.el-tabs__content) {
  min-height: 0;
  flex: 1;
}
.detail-tabs :deep(.el-tab-pane) {
  height: 100%;
  min-height: 0;
}
.timeline-scroll {
  box-sizing: border-box;
  height: 100%;
  overflow-y: auto;
  padding: 8px 12px 8px 4px;
}
.timeline-scroll :deep(.el-timeline) {
  margin: 0;
}
.graph-host {
  height: 100%;
  min-height: 460px;
  border: 1px solid #dfe4e8;
  background: #f7f9fa;
}
.loop-progress {
  display: grid;
  gap: 4px;
}
.loop-progress span {
  color: #7a838c;
  font-size: 11px;
}
.loop-items-body {
  display: grid;
  height: 100%;
  min-height: 0;
  grid-template-rows: auto minmax(0, 1fr) auto;
  gap: 12px;
}
.loop-filter,
.loop-pagination {
  display: flex;
  align-items: center;
  gap: 8px;
}
.loop-filter :deep(.el-select) {
  width: 180px;
}
.loop-items-table {
  min-height: 0;
}
.loop-pagination {
  justify-content: flex-end;
}
:deep(.run-node) {
  width: 170px;
  border: 2px solid #a8b1ba;
  border-radius: 6px;
  background: #fff;
  font-size: 12px;
}
.graph-host :deep(.status-success) {
  border-color: #43a36f;
  background: #f0faf4;
}
.graph-host :deep(.status-failed) {
  border-color: #cf4c4c;
  background: #fff3f3;
}
.graph-host :deep(.status-running) {
  border-color: #cf9637;
  background: #fff9ec;
}
.graph-host :deep(.status-waiting),
.graph-host :deep(.status-waiting_event),
.graph-host :deep(.status-waiting_timer) {
  border-color: #398aa3;
  background: #eef8fa;
}
</style>
