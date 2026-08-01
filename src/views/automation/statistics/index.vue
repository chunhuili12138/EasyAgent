<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { $t } from '@/locales';
import {
  type AutomationReconcileResult,
  type AutomationRuntimeMetrics,
  fetchAutomationMetrics,
  fetchReconcileAutomationRuns
} from '@/service/api/automation';
import AutomationConfigHelp from '../components/automation-config-help.vue';
import AutomationLoadError from '../components/automation-load-error.vue';
import { automationStatusLabel } from '../automation-enum-label';

defineOptions({ name: 'AutomationStatistics' });
const t = $t;

const loading = ref(false);
const loadError = ref('');
const reconciling = ref(false);
const reconcileResult = ref<AutomationReconcileResult | null>(null);
const reconcileError = ref('');
const helpVisible = ref(false);
const metrics = ref<AutomationRuntimeMetrics>({
  statusCounts: {},
  totalRuns: 0,
  activeRuns: 0,
  queuedRuns: 0,
  waitingRuns: 0,
  retryAttempts: 0,
  openDeadLetters: 0,
  averageDurationMs: 0,
  averageQueueDelayMs: 0,
  averageWaitDurationMs: 0,
  averageNodeDurationMs: 0,
  successRate: 0,
  failureRate: 0,
  generatedAtEpochMs: 0
});

const statusRows = computed(() =>
  Object.entries(metrics.value.statusCounts)
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count)
);

async function loadData() {
  loading.value = true;
  try {
    const { data, error } = await fetchAutomationMetrics();
    if (data) {
      metrics.value = data;
      loadError.value = '';
    } else {
      loadError.value = error?.message || t('automation.common.loadFailed');
    }
  } finally {
    loading.value = false;
  }
}

async function reconcile() {
  await ElMessageBox.confirm(
    t('automation.statistics.reconcileConfirm'),
    t('automation.statistics.reconcile'),
    {
      type: 'warning',
      confirmButtonText: t('automation.statistics.startReconcile')
    }
  );
  reconciling.value = true;
  reconcileError.value = '';
  try {
    const { data, error } = await fetchReconcileAutomationRuns();
    if (error || !data) {
      reconcileError.value = error?.message || t('automation.statistics.reconcileFailed');
      return;
    }
    reconcileResult.value = data;
    ElMessage.success(data.repaired
      ? t('automation.statistics.repaired', { count: data.repaired })
      : t('automation.statistics.noRepair'));
    await loadData();
  } finally {
    reconciling.value = false;
  }
}

function duration(value: number) {
  if (value < 1000) return `${value} ms`;
  if (value < 60000) return `${(value / 1000).toFixed(1)} s`;
  return `${(value / 60000).toFixed(1)} min`;
}

function statusType(status: string) {
  if (status === 'SUCCESS') return 'success';
  if (['FAILED', 'PARTIAL_FAILURE'].includes(status)) return 'danger';
  if (['RUNNING', 'RETRY_WAIT', 'WAITING_EVENT', 'WAITING_TIMER'].includes(status)) return 'warning';
  return 'info';
}

onMounted(loadData);
</script>

<template>
  <div v-loading="loading" class="statistics-page">
    <header class="page-heading">
      <div>
        <h1>{{ t('automation.statistics.title') }}</h1>
        <p>{{ t('automation.statistics.description') }}</p>
      </div>
      <div class="heading-actions">
        <ElButton :loading="reconciling" @click="reconcile">
          <SvgIcon icon="mdi:database-sync-outline" />
          {{ t('automation.statistics.reconcile') }}
        </ElButton>
        <ElButton circle :title="t('automation.common.configurationHelp')" @click="helpVisible = true"><SvgIcon icon="mdi:help-circle-outline" /></ElButton>
        <ElButton circle :title="t('automation.common.refresh')" @click="loadData"><SvgIcon icon="mdi:refresh" /></ElButton>
      </div>
    </header>
    <AutomationLoadError v-if="loadError" :message="loadError" @retry="loadData" />

    <section class="summary-band" :aria-label="t('automation.statistics.overview')">
      <div>
        <span>{{ t('automation.statistics.totalRuns') }}</span>
        <strong>{{ metrics.totalRuns }}</strong>
      </div>
      <div>
        <span>{{ t('automation.statistics.activeRuns') }}</span>
        <strong>{{ metrics.activeRuns }}</strong>
      </div>
      <div>
        <span>{{ t('automation.statistics.queuedRuns') }}</span>
        <strong :class="{ warning: metrics.queuedRuns > 0 }">{{ metrics.queuedRuns }}</strong>
      </div>
      <div>
        <span>{{ t('automation.statistics.waitingRuns') }}</span>
        <strong>{{ metrics.waitingRuns }}</strong>
      </div>
      <div>
        <span>{{ t('automation.statistics.successRate') }}</span>
        <strong class="success">{{ metrics.successRate.toFixed(1) }}%</strong>
      </div>
      <div>
        <span>{{ t('automation.statistics.failureRate') }}</span>
        <strong :class="{ danger: metrics.failureRate > 0 }">{{ metrics.failureRate.toFixed(1) }}%</strong>
      </div>
      <div>
        <span>{{ t('automation.statistics.retryAttempts') }}</span>
        <strong>{{ metrics.retryAttempts }}</strong>
      </div>
      <div>
        <span>{{ t('automation.statistics.openDeadLetters') }}</span>
        <strong :class="{ danger: metrics.openDeadLetters > 0 }">{{ metrics.openDeadLetters }}</strong>
      </div>
    </section>

    <section class="latency-band" :aria-label="t('automation.statistics.latency')">
      <div>
        <span>{{ t('automation.statistics.avgDuration') }}</span>
        <strong>{{ duration(metrics.averageDurationMs) }}</strong>
      </div>
      <div>
        <span>{{ t('automation.statistics.avgQueueDelay') }}</span>
        <strong>{{ duration(metrics.averageQueueDelayMs) }}</strong>
      </div>
      <div>
        <span>{{ t('automation.statistics.avgWait') }}</span>
        <strong>{{ duration(metrics.averageWaitDurationMs) }}</strong>
      </div>
      <div>
        <span>{{ t('automation.statistics.avgNodeDuration') }}</span>
        <strong>{{ duration(metrics.averageNodeDurationMs) }}</strong>
      </div>
    </section>

    <section class="workspace-band">
      <div class="status-panel">
        <header>
          <h2>{{ t('automation.statistics.statusDistribution') }}</h2>
          <span>{{ t('automation.statistics.generatedAt', { time: new Date(metrics.generatedAtEpochMs).toLocaleString() }) }}</span>
        </header>
        <ElTable :data="statusRows" height="100%">
          <ElTableColumn :label="t('automation.common.status')" min-width="180">
            <template #default="{ row }">
              <ElTag :type="statusType(row.status)" size="small">{{ automationStatusLabel(row.status) }}</ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="count" :label="t('automation.statistics.instances')" width="100" />
          <ElTableColumn :label="t('automation.statistics.ratio')" min-width="200">
            <template #default="{ row }">
              <ElProgress
                :percentage="metrics.totalRuns ? Math.round((row.count / metrics.totalRuns) * 100) : 0"
                :stroke-width="8"
              />
            </template>
          </ElTableColumn>
        </ElTable>
      </div>

      <div class="reconcile-panel">
        <header>
          <h2>{{ t('automation.statistics.lastReconcile') }}</h2>
          <span>{{ t('automation.statistics.autoReconcile') }}</span>
        </header>
        <div v-if="reconcileError" class="reconcile-content">
          <ElAlert type="error" :closable="false" :title="t('automation.statistics.reconcileIncomplete')" :description="reconcileError" show-icon />
        </div>
        <div v-else-if="reconcileResult" class="reconcile-content">
          <div class="reconcile-counts">
            <div>
              <span>{{ t('automation.statistics.inspected') }}</span>
              <strong>{{ reconcileResult.inspected }}</strong>
            </div>
            <div>
              <span>{{ t('automation.statistics.repairedCount') }}</span>
              <strong class="success">{{ reconcileResult.repaired }}</strong>
            </div>
          </div>
          <ElAlert
            v-if="reconcileResult.activeTerminalRuns.length"
            type="warning"
            :closable="false"
            :title="t('automation.statistics.activeTerminal', { ids: reconcileResult.activeTerminalRuns.join(', ') })"
          />
          <ElAlert
            v-if="reconcileResult.unresolvedRuns.length"
            type="error"
            :closable="false"
            :title="t('automation.statistics.unresolved', { ids: reconcileResult.unresolvedRuns.join(', ') })"
          />
          <ElEmpty
            v-if="!reconcileResult.activeTerminalRuns.length && !reconcileResult.unresolvedRuns.length"
            :image-size="52"
            :description="t('automation.statistics.noDifference')"
          />
        </div>
        <ElEmpty v-else :image-size="58" :description="t('automation.statistics.neverReconciled')" />
      </div>
    </section>
    <AutomationConfigHelp v-model="helpVisible" topic="runtime" />
  </div>
</template>

<style scoped>
.statistics-page {
  display: grid;
  height: 100%;
  min-height: 0;
  grid-template-rows: auto auto auto minmax(0, 1fr);
  gap: 12px;
  padding: 18px;
  overflow: auto;
  background: #f3f5f7;
  color: #303840;
}
.page-heading,
.workspace-band header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.page-heading h1,
.workspace-band h2 {
  margin: 0;
  letter-spacing: 0;
}
.page-heading h1 {
  font-size: 20px;
}
.page-heading p {
  margin: 4px 0 0;
  color: #7b848d;
  font-size: 13px;
}
.heading-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.summary-band,
.latency-band {
  display: grid;
  border-bottom: 1px solid #e2e6e9;
  background: #fff;
}
.summary-band {
  grid-template-columns: repeat(4, minmax(130px, 1fr));
}
.latency-band {
  grid-template-columns: repeat(4, minmax(150px, 1fr));
}
.summary-band > div,
.latency-band > div {
  display: flex;
  min-height: 72px;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  padding: 0 18px;
  border-right: 1px solid #e7eaed;
}
.summary-band > div:nth-child(4n),
.latency-band > div:last-child {
  border-right: 0;
}
.summary-band span,
.latency-band span,
.reconcile-counts span {
  color: #7b848d;
  font-size: 12px;
}
.summary-band strong {
  font-size: 22px;
  font-weight: 650;
}
.latency-band strong {
  font-size: 16px;
  font-weight: 600;
}
.danger {
  color: #c54444;
}
.warning {
  color: #b56d18;
}
.success {
  color: #26845a;
}
.workspace-band {
  display: grid;
  min-height: 340px;
  grid-template-columns: minmax(0, 1.5fr) minmax(320px, 0.8fr);
  gap: 12px;
}
.status-panel,
.reconcile-panel {
  display: grid;
  min-height: 0;
  grid-template-rows: auto minmax(0, 1fr);
  padding: 0 16px 14px;
  background: #fff;
}
.workspace-band header {
  min-height: 50px;
  border-bottom: 1px solid #e7eaed;
}
.workspace-band h2 {
  font-size: 15px;
}
.workspace-band header span {
  color: #8a929a;
  font-size: 12px;
}
.reconcile-content {
  display: flex;
  min-height: 0;
  flex-direction: column;
  gap: 10px;
  padding-top: 12px;
  overflow: auto;
}
.reconcile-counts {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  border-bottom: 1px solid #e7eaed;
}
.reconcile-counts > div {
  display: flex;
  min-height: 64px;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
}
.reconcile-counts strong {
  font-size: 20px;
}
@media (max-width: 1100px) {
  .summary-band {
    grid-template-columns: repeat(2, minmax(130px, 1fr));
  }
  .summary-band > div:nth-child(2n) {
    border-right: 0;
  }
  .workspace-band {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 760px) {
  .latency-band {
    grid-template-columns: repeat(2, 1fr);
  }
  .latency-band > div:nth-child(2n) {
    border-right: 0;
  }
}
</style>
