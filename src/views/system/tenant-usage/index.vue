<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { $t } from '@/locales';
import {
  fetchGetTenantUsageList,
  fetchGetTenantUsageTrend,
  fetchUpdateTenantQuota
} from '@/service/api/system-manage';

defineOptions({ name: 'SystemTenantUsage' });

const loading = ref(false);
const rows = ref<Api.SystemManage.TenantUsage[]>([]);
const keyword = ref('');
const quotaVisible = ref(false);
const trendVisible = ref(false);
const editing = ref<Api.SystemManage.TenantUsage | null>(null);
const trend = ref<Api.SystemManage.TenantUsageTrend[]>([]);
const form = reactive({ documentLimitMb: 100, dailyTokenLimit: 5_000_000, monthlyTokenLimit: 100_000_000, rateLimitQps: 10 });

const filteredRows = computed(() => {
  const value = keyword.value.trim().toLowerCase();
  if (!value) return rows.value;
  return rows.value.filter(item =>
    item.tenantName.toLowerCase().includes(value) || item.tenantCode.toLowerCase().includes(value)
  );
});
const summary = computed(() => ({
  tenants: rows.value.length,
  documents: rows.value.reduce((sum, item) => sum + item.documentUsedBytes, 0),
  monthTokens: rows.value.reduce((sum, item) => sum + item.monthTokens, 0),
  alerts: rows.value.filter(item => item.warningLevel !== 'normal').length
}));

async function load() {
  loading.value = true;
  try {
    const { data, error } = await fetchGetTenantUsageList();
    if (!error) rows.value = data || [];
  } finally {
    loading.value = false;
  }
}

function ratio(used: number, limit: number) {
  if (limit <= 0) return used > 0 ? 100 : 0;
  return Math.min(100, Math.round((used / limit) * 1000) / 10);
}
function progressStatus(used: number, limit: number) {
  const value = ratio(used, limit);
  if (value >= 100) return 'exception';
  if (value >= 80) return 'warning';
  return 'success';
}
function formatBytes(value: number) {
  if (value < 1024 ** 2) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 ** 3) return `${(value / 1024 ** 2).toFixed(1)} MB`;
  return `${(value / 1024 ** 3).toFixed(2)} GB`;
}
function formatNumber(value: number) {
  return new Intl.NumberFormat().format(value);
}
function warningLabel(level: Api.SystemManage.TenantUsage['warningLevel']) {
  if (level === 'normal') return $t('page.manage.tenantUsage.normal');
  if (level === 'warning') return $t('page.manage.tenantUsage.warning');
  if (level === 'danger') return $t('page.manage.tenantUsage.danger');
  return $t('page.manage.tenantUsage.exceeded');
}
function warningType(level: Api.SystemManage.TenantUsage['warningLevel']) {
  return level === 'normal' ? 'success' : level === 'warning' ? 'warning' : 'danger';
}

function openQuota(row: Api.SystemManage.TenantUsage) {
  editing.value = row;
  form.documentLimitMb = Math.round(row.documentLimitBytes / 1024 ** 2);
  form.dailyTokenLimit = row.dailyTokenLimit;
  form.monthlyTokenLimit = row.monthlyTokenLimit;
  form.rateLimitQps = row.rateLimitQps;
  quotaVisible.value = true;
}
async function saveQuota() {
  if (!editing.value) return;
  const { error } = await fetchUpdateTenantQuota(editing.value.tenantId, {
    documentLimitBytes: Math.round(form.documentLimitMb * 1024 ** 2),
    dailyTokenLimit: form.dailyTokenLimit,
    monthlyTokenLimit: form.monthlyTokenLimit,
    rateLimitQps: form.rateLimitQps
  });
  if (error) return;
  ElMessage.success($t('page.manage.tenantUsage.quotaSaved'));
  quotaVisible.value = false;
  await load();
}
async function openTrend(row: Api.SystemManage.TenantUsage) {
  editing.value = row;
  const { data, error } = await fetchGetTenantUsageTrend(row.tenantId);
  if (error) return;
  trend.value = data || [];
  trendVisible.value = true;
}

onMounted(load);
</script>

<template>
  <div class="h-full page-container">
    <div class="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div class="metric"><span>{{ $t('page.manage.tenantUsage.tenants') }}</span><strong>{{ summary.tenants }}</strong></div>
      <div class="metric"><span>{{ $t('page.manage.tenantUsage.documentTotal') }}</span><strong>{{ formatBytes(summary.documents) }}</strong></div>
      <div class="metric"><span>{{ $t('page.manage.tenantUsage.monthTokens') }}</span><strong>{{ formatNumber(summary.monthTokens) }}</strong></div>
      <div class="metric"><span>{{ $t('page.manage.tenantUsage.alertTenants') }}</span><strong>{{ summary.alerts }}</strong></div>
    </div>

    <ElCard shadow="never">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <ElInput v-model="keyword" clearable :placeholder="$t('page.manage.tenantUsage.search')" style="width: 260px" />
        <ElButton :loading="loading" @click="load">
          <template #icon><icon-mdi-refresh /></template>
          {{ $t('page.manage.tenantUsage.refresh') }}
        </ElButton>
      </div>
      <ElTable v-loading="loading" :data="filteredRows" border stripe>
        <ElTableColumn :label="$t('page.manage.tenantUsage.tenant')" min-width="180">
          <template #default="{ row }">
            <div class="font-medium">{{ row.tenantName }}</div>
            <div class="text-xs text-gray-500">{{ row.tenantCode }}</div>
          </template>
        </ElTableColumn>
        <ElTableColumn :label="$t('page.manage.tenantUsage.documentSpace')" min-width="220">
          <template #default="{ row }">
            <div class="mb-1 text-xs">{{ formatBytes(row.documentUsedBytes) }} / {{ formatBytes(row.documentLimitBytes) }}</div>
            <ElProgress :percentage="ratio(row.documentUsedBytes, row.documentLimitBytes)" :status="progressStatus(row.documentUsedBytes, row.documentLimitBytes)" :stroke-width="8" />
          </template>
        </ElTableColumn>
        <ElTableColumn :label="$t('page.manage.tenantUsage.todayTokens')" min-width="220">
          <template #default="{ row }">
            <div class="mb-1 text-xs">{{ formatNumber(row.todayTokens) }} / {{ formatNumber(row.dailyTokenLimit) }}</div>
            <ElProgress :percentage="ratio(row.todayTokens, row.dailyTokenLimit)" :status="progressStatus(row.todayTokens, row.dailyTokenLimit)" :stroke-width="8" />
          </template>
        </ElTableColumn>
        <ElTableColumn :label="$t('page.manage.tenantUsage.monthTokens')" min-width="220">
          <template #default="{ row }">
            <div class="mb-1 text-xs">{{ formatNumber(row.monthTokens) }} / {{ formatNumber(row.monthlyTokenLimit) }}</div>
            <ElProgress :percentage="ratio(row.monthTokens, row.monthlyTokenLimit)" :status="progressStatus(row.monthTokens, row.monthlyTokenLimit)" :stroke-width="8" />
          </template>
        </ElTableColumn>
        <ElTableColumn prop="rateLimitQps" :label="$t('page.manage.tenantUsage.qps')" width="80" align="center" />
        <ElTableColumn :label="$t('page.manage.tenantUsage.status')" width="110" align="center">
          <template #default="{ row }"><ElTag :type="warningType(row.warningLevel)">{{ warningLabel(row.warningLevel) }}</ElTag></template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <ElButton type="primary" link @click="openQuota(row)">{{ $t('page.manage.tenantUsage.configure') }}</ElButton>
            <ElButton link @click="openTrend(row)">{{ $t('page.manage.tenantUsage.trend') }}</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>

    <ElDialog
      v-model="quotaVisible"
      :title="`${$t('page.manage.tenantUsage.quotaTitle')} - ${editing?.tenantName || ''}`"
      width="520px"
      destroy-on-close
    >
      <ElForm label-width="140px">
        <ElFormItem :label="$t('page.manage.tenantUsage.documentLimit')">
          <ElInputNumber v-model="form.documentLimitMb" :min="0" :precision="0" :step="100" class="w-full" />
          <span class="ml-2">MB</span>
        </ElFormItem>
        <ElFormItem :label="$t('page.manage.tenantUsage.dailyLimit')"><ElInputNumber v-model="form.dailyTokenLimit" :min="0" :step="100000" class="w-full" /></ElFormItem>
        <ElFormItem :label="$t('page.manage.tenantUsage.monthlyLimit')"><ElInputNumber v-model="form.monthlyTokenLimit" :min="0" :step="1000000" class="w-full" /></ElFormItem>
        <ElFormItem :label="$t('page.manage.tenantUsage.qpsLimit')"><ElInputNumber v-model="form.rateLimitQps" :min="1" :max="10000" class="w-full" /></ElFormItem>
      </ElForm>
      <template #footer><ElButton @click="quotaVisible = false">{{ $t('common.cancel') }}</ElButton><ElButton type="primary" @click="saveQuota">{{ $t('common.save') }}</ElButton></template>
    </ElDialog>

    <ElDrawer v-model="trendVisible" :title="`${$t('page.manage.tenantUsage.trendTitle')} - ${editing?.tenantName || ''}`" size="560px">
      <ElTable :data="trend" border>
        <ElTableColumn prop="statDate" :label="$t('page.manage.tenantUsage.date')" min-width="120" />
        <ElTableColumn label="Token" min-width="140"><template #default="{ row }">{{ formatNumber(row.tokens) }}</template></ElTableColumn>
        <ElTableColumn prop="requests" :label="$t('page.manage.tenantUsage.requests')" min-width="100" />
      </ElTable>
      <ElEmpty v-if="trend.length === 0" :description="$t('page.manage.tenantUsage.noTrend')" />
    </ElDrawer>
  </div>
</template>

<style scoped>
.metric {
  display: flex;
  min-height: 88px;
  flex-direction: column;
  justify-content: center;
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  background: var(--el-bg-color);
  padding: 14px 18px;
}
.metric span { color: var(--el-text-color-secondary); font-size: 13px; }
.metric strong { margin-top: 6px; color: var(--el-text-color-primary); font-size: 24px; line-height: 1.2; }
</style>
