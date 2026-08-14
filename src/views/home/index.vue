<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { ProgressProps, TagProps } from 'element-plus';
import { fetchGetDashboardStatistics } from '@/service/api/system-manage';
import { useAuthStore } from '@/store/modules/auth';
import { $t } from '@/locales';

defineOptions({ name: 'HomePage' });

const authStore = useAuthStore();
const loading = ref(false);
const statistics = ref<Api.SystemManage.DashboardStatistics | null>(null);
const updatedAt = ref('');
let requestSequence = 0;

type Metric = Api.SystemManage.DashboardMetric;
type Usage = Api.SystemManage.TenantUsage;
type MetricGroupDefinition = { key: string; icon: string; metricKeys: string[] };

const metricGroupDefinitions: MetricGroupDefinition[] = [
  { key: 'platform', icon: 'mdi:view-dashboard-outline', metricKeys: ['activeTenants', 'activeUsers'] },
  { key: 'organization', icon: 'mdi:office-building-cog-outline', metricKeys: ['tenantUsers', 'departments', 'posts'] },
  {
    key: 'document',
    icon: 'mdi:file-document-multiple-outline',
    metricKeys: ['documents', 'pendingParseTasks', 'failedParseTasks', 'indexedDocuments']
  },
  {
    key: 'agent',
    icon: 'mdi:robot-outline',
    metricKeys: [
      'activeSkills',
      'activeDatasources',
      'activeApiTools',
      'activeExperiences',
      'pendingBadCases',
      'sqlIssues'
    ]
  },
  {
    key: 'activity',
    icon: 'mdi:message-processing-outline',
    metricKeys: [
      'mySessions',
      'myQuestions',
      'pendingApprovals',
      'readyAttachments',
      'tenantSessions',
      'tenantQuestions',
      'tenantPendingApprovals',
      'tenantReadyAttachments'
    ]
  }
];

const metricIcons: Record<string, string> = {
  activeTenants: 'mdi:office-building',
  activeUsers: 'mdi:account-group',
  tenantUsers: 'mdi:account-group',
  departments: 'mdi:source-branch',
  posts: 'mdi:briefcase',
  documents: 'mdi:file-document-multiple',
  pendingParseTasks: 'mdi:file-clock',
  failedParseTasks: 'mdi:file-alert',
  indexedDocuments: 'mdi:database-check',
  activeSkills: 'mdi:puzzle',
  activeDatasources: 'mdi:database',
  activeApiTools: 'mdi:tools',
  activeExperiences: 'mdi:brain',
  pendingBadCases: 'mdi:alert-circle',
  sqlIssues: 'mdi:database-alert',
  mySessions: 'mdi:message-text',
  myQuestions: 'mdi:comment-question',
  pendingApprovals: 'mdi:account-clock',
  readyAttachments: 'mdi:paperclip-check',
  tenantSessions: 'mdi:message-text',
  tenantQuestions: 'mdi:comment-question',
  tenantPendingApprovals: 'mdi:account-clock',
  tenantReadyAttachments: 'mdi:paperclip-check'
};

const scopeLabel = computed(() => {
  if (authStore.isSysAdmin && !authStore.userInfo.currentTenantId) return $t('page.home.globalScope');
  return authStore.userInfo.currentTenantName || $t('page.home.tenantScope');
});
const resourceUsage = computed(() => statistics.value?.resourceUsage || null);
const metricGroups = computed(() => {
  const metricsByKey = new Map((statistics.value?.metrics || []).map(metric => [metric.key, metric]));
  return metricGroupDefinitions
    .map(group => ({
      ...group,
      metrics: group.metricKeys.map(key => metricsByKey.get(key)).filter((metric): metric is Metric => Boolean(metric))
    }))
    .filter(group => group.metrics.length > 0);
});
const metricCount = computed(() => statistics.value?.metrics.length || 0);
const warningCount = computed(() => statistics.value?.metrics.filter(metric => metric.level !== 'normal').length || 0);
const usageItems = computed(() => {
  const usage = resourceUsage.value;
  if (!usage) return [];
  return [
    {
      key: 'document',
      icon: 'mdi:folder-multiple-outline',
      used: usage.documentUsedBytes,
      limit: usage.documentLimitBytes,
      usedText: formatBytes(usage.documentUsedBytes),
      limitText: formatBytes(usage.documentLimitBytes),
      remainingText: formatBytes(Math.max(0, usage.documentLimitBytes - usage.documentUsedBytes))
    },
    {
      key: 'todayTokens',
      icon: 'mdi:calendar-today-outline',
      used: usage.todayTokens,
      limit: usage.dailyTokenLimit,
      usedText: formatNumber(usage.todayTokens),
      limitText: formatNumber(usage.dailyTokenLimit),
      remainingText: formatNumber(Math.max(0, usage.dailyTokenLimit - usage.todayTokens))
    },
    {
      key: 'monthTokens',
      icon: 'mdi:calendar-month-outline',
      used: usage.monthTokens,
      limit: usage.monthlyTokenLimit,
      usedText: formatNumber(usage.monthTokens),
      limitText: formatNumber(usage.monthlyTokenLimit),
      remainingText: formatNumber(Math.max(0, usage.monthlyTokenLimit - usage.monthTokens))
    }
  ];
});

function formatNumber(value: number) {
  return new Intl.NumberFormat().format(value);
}
function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 ** 2) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 ** 3) return `${(value / 1024 ** 2).toFixed(1)} MB`;
  return `${(value / 1024 ** 3).toFixed(2)} GB`;
}
function usageRatio(used: number, limit: number) {
  if (limit <= 0) return used > 0 ? 100 : 0;
  return Math.min(100, Math.round((used / limit) * 1000) / 10);
}
function progressStatus(used: number, limit: number): ProgressProps['status'] {
  const ratio = usageRatio(used, limit);
  if (ratio >= 100) return 'exception';
  if (ratio >= 80) return 'warning';
  return 'success';
}
function warningType(level?: Usage['warningLevel']): TagProps['type'] {
  if (level === 'warning') return 'warning';
  if (level === 'danger' || level === 'exceeded') return 'danger';
  return 'success';
}
function metricLabel(key: string) {
  return $t(`page.home.metrics.${key}` as any);
}
function groupLabel(key: string) {
  return $t(`page.home.groups.${key}` as any);
}
function groupDescription(key: string) {
  return $t(`page.home.groupDescriptions.${key}` as any);
}

async function loadStatistics() {
  const currentRequest = ++requestSequence;
  loading.value = true;
  try {
    const { data, error } = await fetchGetDashboardStatistics();
    if (currentRequest === requestSequence && !error) {
      statistics.value = data || null;
      updatedAt.value = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(new Date());
    }
  } finally {
    if (currentRequest === requestSequence) loading.value = false;
  }
}

watch(
  () => authStore.userInfo.currentTenantId,
  () => {
    statistics.value = null;
    updatedAt.value = '';
    void loadStatistics();
  },
  { immediate: true }
);
</script>

<template>
  <div v-loading="loading" class="page-container h-full">
    <header class="dashboard-header">
      <div class="min-w-0">
        <h1 class="m-0 text-20px font-600">{{ $t('page.home.title') }}</h1>
        <div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
          <span>{{ scopeLabel }}</span>
          <span v-if="updatedAt">{{ $t('page.home.updatedAt', { time: updatedAt }) }}</span>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <ElTag v-if="warningCount" type="warning" effect="plain">
          {{ $t('page.home.warningItems', { count: warningCount }) }}
        </ElTag>
        <ElTag v-else-if="statistics" type="success" effect="plain">{{ $t('page.home.statusNormal') }}</ElTag>
        <ElButton :loading="loading" @click="loadStatistics">
          <template #icon><icon-mdi-refresh /></template>
          {{ $t('page.home.refresh') }}
        </ElButton>
      </div>
    </header>

    <section v-if="resourceUsage" class="usage-section">
      <div class="section-heading">
        <div>
          <div class="section-title">
            <SvgIcon icon="mdi:gauge" />
            <span>{{ $t('page.home.resource.title') }}</span>
          </div>
          <p>{{ $t('page.home.resource.description') }}</p>
        </div>
        <div class="flex flex-wrap items-center justify-end gap-2">
          <ElTag :type="warningType(resourceUsage.warningLevel)" effect="light">
            {{ $t(`page.home.resource.status.${resourceUsage.warningLevel}` as any) }}
          </ElTag>
          <span class="text-xs text-gray-500">
            {{ $t('page.home.resource.qps', { value: resourceUsage.rateLimitQps }) }}
          </span>
        </div>
      </div>

      <div class="usage-grid">
        <article v-for="item in usageItems" :key="item.key" class="usage-item">
          <div class="usage-item__header">
            <span class="usage-item__icon"><SvgIcon :icon="item.icon" /></span>
            <div class="min-w-0">
              <div class="font-600">{{ $t(`page.home.resource.items.${item.key}` as any) }}</div>
              <div class="mt-1 text-xs text-gray-500">{{ item.usedText }} / {{ item.limitText }}</div>
            </div>
            <strong>{{ usageRatio(item.used, item.limit) }}%</strong>
          </div>
          <ElProgress
            :percentage="usageRatio(item.used, item.limit)"
            :status="progressStatus(item.used, item.limit)"
            :stroke-width="8"
            :show-text="false"
          />
          <div class="usage-item__footer">
            <span>{{ $t('page.home.resource.used') }} {{ item.usedText }}</span>
            <span>{{ $t('page.home.resource.remaining') }} {{ item.remainingText }}</span>
          </div>
        </article>
      </div>
      <div class="mt-3 text-xs text-gray-500">{{ $t('page.home.resource.cacheHint') }}</div>
    </section>

    <div v-if="metricGroups.length" class="mt-4 flex flex-col gap-3">
      <div class="data-overview">
        <div>
          <strong>{{ $t('page.home.businessData') }}</strong>
          <span>{{ $t('page.home.metricCount', { count: metricCount }) }}</span>
        </div>
      </div>
      <section v-for="group in metricGroups" :key="group.key" class="metric-group">
        <div class="metric-group__header">
          <div class="metric-group__heading">
            <span class="metric-group__icon"><SvgIcon :icon="group.icon" /></span>
            <div>
              <div class="font-600">{{ groupLabel(group.key) }}</div>
              <div class="mt-1 text-xs text-gray-500">{{ groupDescription(group.key) }}</div>
            </div>
          </div>
          <span class="metric-group__count">{{ group.metrics.length }}</span>
        </div>
        <div class="metric-grid">
          <ElCard
            v-for="metric in group.metrics"
            :key="metric.key"
            shadow="never"
            class="metric-card"
            :class="`metric-card--${metric.level}`"
          >
            <div class="flex items-center justify-between gap-3">
              <div class="min-w-0">
                <div class="truncate text-sm text-gray-500">{{ metricLabel(metric.key) }}</div>
                <div class="mt-2 text-24px font-700 leading-none">{{ formatNumber(metric.value) }}</div>
              </div>
              <div class="metric-icon" :class="`metric-icon--${metric.level}`">
                <SvgIcon :icon="metricIcons[metric.key] || 'mdi:chart-box'" class="text-20px" />
              </div>
            </div>
          </ElCard>
        </div>
      </section>
    </div>
    <ElEmpty v-else-if="!loading && !resourceUsage" :description="$t('page.home.noData')" />
  </div>
</template>

<style scoped>
.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.usage-section {
  margin-top: 14px;
  padding: 14px 16px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  background: var(--el-fill-color-extra-light);
}
.section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.section-title {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 16px;
  font-weight: 600;
}
.section-heading p {
  margin: 5px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
.usage-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 14px;
}
.usage-item {
  min-width: 0;
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background: var(--el-bg-color);
}
.usage-item__header {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto;
  align-items: center;
  gap: 9px;
  margin-bottom: 10px;
}
.usage-item__header strong {
  font-size: 16px;
}
.usage-item__icon {
  display: flex;
  width: 34px;
  height: 34px;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-size: 18px;
}
.usage-item__footer {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: 7px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.data-overview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 32px;
}
.data-overview div {
  display: flex;
  align-items: baseline;
  gap: 10px;
}
.data-overview strong {
  font-size: 16px;
}
.data-overview span {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.metric-group {
  padding: 12px 14px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background: var(--el-bg-color);
}
.metric-group__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}
.metric-group__heading {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 9px;
}
.metric-group__icon {
  display: flex;
  width: 30px;
  height: 30px;
  flex: none;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-size: 17px;
}
.metric-group__count {
  min-width: 24px;
  padding: 2px 7px;
  border-radius: 10px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  text-align: center;
  font-size: 12px;
}
.metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 190px), 1fr));
  gap: 9px;
}
.metric-card {
  min-height: 88px;
  border-color: var(--el-border-color-extra-light);
  border-radius: 6px;
}
.metric-card--warning {
  border-color: var(--el-color-warning-light-7);
}
.metric-card--danger {
  border-color: var(--el-color-danger-light-7);
}
.metric-icon {
  display: flex;
  width: 38px;
  height: 38px;
  flex: none;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}
.metric-icon--warning {
  background: var(--el-color-warning-light-9);
  color: var(--el-color-warning);
}
.metric-icon--danger {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}
@media (max-width: 900px) {
  .usage-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 640px) {
  .dashboard-header,
  .section-heading {
    align-items: stretch;
    flex-direction: column;
  }
  .section-heading > div:last-child {
    justify-content: flex-start;
  }
  .usage-section {
    padding: 12px;
  }
  .usage-item__footer {
    align-items: flex-start;
    flex-direction: column;
    gap: 2px;
  }
}
</style>
