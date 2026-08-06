<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElMessage, type TagProps } from 'element-plus';
import { fetchAuditDetail, fetchAuditStats, fetchAudits, fetchRagAclOptions } from '@/service/api/rag';
import { $t } from '@/locales';
import { auditActionLabel, auditStatusLabel, riskLabel } from '../shared/display';

defineOptions({ name: 'RagAudit' });

const t = $t;
const list = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const size = ref(20);
const loading = ref(false);
const actionType = ref('');
const status = ref('');
const userId = ref<number | undefined>();
const dateRange = ref<string[]>([]);
const detailVisible = ref(false);
const current = ref<any>({});
const stats = ref<any>({});
const users = ref<any[]>([]);

onMounted(async () => {
  loadData();
  loadStats();
  const res = await fetchRagAclOptions();
  users.value = res.data?.users || [];
});

async function loadData() {
  loading.value = true;
  const from = dateRange.value?.[0] || undefined;
  const to = dateRange.value?.[1] || undefined;
  try {
    const res = await fetchAudits({
      page: page.value,
      size: size.value,
      actionType: actionType.value || undefined,
      status: status.value || undefined,
      userId: userId.value,
      dateFrom: from,
      dateTo: to
    });
    list.value = res.data?.records || [];
    total.value = res.data?.total || 0;
  } finally {
    loading.value = false;
  }
}
async function loadStats() {
  const res = await fetchAuditStats();
  stats.value = res.data || {};
}
async function viewDetail(row: any) {
  const res = await fetchAuditDetail(row.id);
  current.value = res.data || {};
  detailVisible.value = true;
}
function riskColor(level: string): TagProps['type'] {
  return ({ high: 'danger', medium: 'warning', low: 'info' } as Record<string, TagProps['type']>)[level] || 'info';
}
function resetSearch() {
  userId.value = undefined;
  actionType.value = '';
  status.value = '';
  dateRange.value = [];
  page.value = 1;
  loadData();
}
function userLabel(id?: number) {
  const user = users.value.find(item => item.id === id);
  return user?.name || user?.nickname || (id ? `#${id}` : '-');
}
function formattedJson(value: unknown) {
  if (!value) return '-';
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return JSON.stringify(redact(parsed), null, 2);
  } catch {
    return String(value);
  }
}
function redact(value: any): any {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        /password|secret|token|api[-_]?key|authorization|cookie/i.test(key) ? '******' : redact(item)
      ])
    );
  return value;
}
async function copyText(value: unknown) {
  await navigator.clipboard.writeText(formattedJson(value));
  ElMessage.success(t('rag.common.copySuccess'));
}
</script>

<template>
  <div class="page-container h-full">
    <ElAlert class="mb-4" type="info" :closable="false" show-icon :title="t('rag.audit.pageGuide')" />
    <div class="mb-4 flex gap-4">
      <ElCard
        v-for="card in [
          { l: t('rag.quota.total'), v: stats.total },
          { l: t('rag.audit.confirmed'), v: stats.confirmed },
          { l: t('rag.audit.cancelled'), v: stats.cancelled }
        ]"
        :key="card.l"
        shadow="never"
        class="flex-1 text-center"
      >
        <div class="text-2xl font-bold">{{ card.v || 0 }}</div>
        <div class="text-sm text-gray-500">{{ card.l }}</div>
      </ElCard>
    </div>
    <ElCard class="w-full">
      <div class="mb-4 flex flex-wrap items-center gap-4">
        <ElSelect
          v-model="userId"
          :placeholder="t('rag.audit.userPlaceholder')"
          clearable
          filterable
          class="w-48"
          @change="loadData"
        >
          <ElOption
            v-for="user in users"
            :key="user.id"
            :label="user.name || user.nickname || `#${user.id}`"
            :value="user.id"
          />
        </ElSelect>
        <ElSelect
          v-model="actionType"
          :placeholder="t('rag.audit.actionType')"
          clearable
          class="w-36"
          @change="loadData"
        >
          <ElOption
            v-for="item in ['api_call', 'sql_exec']"
            :key="item"
            :label="auditActionLabel(item)"
            :value="item"
          />
        </ElSelect>
        <ElSelect v-model="status" :placeholder="t('rag.common.status')" clearable class="w-32" @change="loadData">
          <ElOption
            v-for="s in ['pending', 'confirmed', 'cancelled', 'timeout']"
            :key="s"
            :label="auditStatusLabel(s)"
            :value="s"
          />
        </ElSelect>
        <ElDatePicker
          v-model="dateRange"
          type="daterange"
          value-format="YYYY-MM-DD"
          :start-placeholder="t('rag.common.startDate')"
          :end-placeholder="t('rag.common.endDate')"
          class="w-60"
          @change="loadData"
        />
        <ElButton type="primary" @click="loadData">{{ t('rag.common.search') }}</ElButton>
        <ElButton @click="resetSearch">{{ t('common.reset') }}</ElButton>
      </div>
      <ElTable v-loading="loading" :data="list" stripe border class="w-full" :empty-text="t('rag.audit.emptyHint')">
        <ElTableColumn :label="t('rag.audit.actionType')" width="100">
          <template #default="{ row }">
            <ElTag size="small">{{ auditActionLabel(row.actionType) }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="toolCode" :label="t('rag.audit.toolCode')" min-width="120" />
        <ElTableColumn :label="t('rag.audit.riskLevel')" width="80">
          <template #default="{ row }">
            <ElTag :type="riskColor(row.riskLevel)" size="small">{{ riskLabel(row.riskLevel) }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn :label="t('rag.common.status')" width="90">
          <template #default="{ row }">
            <ElTag
              :type="row.status === 'confirmed' ? 'success' : row.status === 'cancelled' ? 'danger' : 'warning'"
              size="small"
            >
              {{ auditStatusLabel(row.status) }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn :label="t('rag.audit.user')" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">{{ userLabel(row.userId) }}</template>
        </ElTableColumn>
        <ElTableColumn :label="t('common.createTime')" width="180">
          <template #default="{ row }">{{ (row.createdAt || '').replace('T', ' ').substring(0, 19) }}</template>
        </ElTableColumn>
        <ElTableColumn :label="t('rag.common.action')" width="80" fixed="right" align="center">
          <template #default="{ row }">
            <ElButton size="small" text @click="viewDetail(row)">{{ t('rag.common.detail') }}</ElButton>
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

    <ElDialog v-model="detailVisible" :title="t('rag.audit.detailTitle')" width="560px">
      <div class="text-sm space-y-3">
        <div>
          <span class="text-gray-500">{{ t('rag.audit.actionType') }}：</span>
          <ElTag size="small">{{ auditActionLabel(current.actionType) }}</ElTag>
        </div>
        <div>
          <span class="text-gray-500">{{ t('rag.audit.toolCode') }}：</span>
          {{ current.toolCode }}
        </div>
        <div>
          <span class="text-gray-500">{{ t('rag.audit.riskLevel') }}：</span>
          <ElTag :type="riskColor(current.riskLevel)" size="small">{{ riskLabel(current.riskLevel) }}</ElTag>
        </div>
        <div>
          <span class="text-gray-500">{{ t('rag.common.status') }}：</span>
          <ElTag size="small">{{ auditStatusLabel(current.status) }}</ElTag>
        </div>
        <div>
          <div class="flex items-center justify-between">
            <span class="text-gray-500">{{ t('rag.audit.toolInput') }}：</span>
            <ElButton link size="small" @click="copyText(current.toolInput)">{{ t('rag.common.copy') }}</ElButton>
          </div>
          <pre class="mt-1 max-h-56 overflow-auto rounded bg-gray-50 p-2 text-xs font-mono">{{
            formattedJson(current.toolInput)
          }}</pre>
        </div>
        <div v-if="current.cancelReason">
          <span class="text-gray-500">{{ t('rag.audit.cancelReason') }}：</span>
          {{ current.cancelReason }}
        </div>
        <div>
          <div class="flex items-center justify-between">
            <span class="text-gray-500">{{ t('rag.audit.contextSnapshot') }}：</span>
            <ElButton link size="small" @click="copyText(current.contextSnapshot)">{{ t('rag.common.copy') }}</ElButton>
          </div>
          <pre class="mt-1 max-h-56 overflow-auto rounded bg-gray-50 p-2 text-xs font-mono">{{
            formattedJson(current.contextSnapshot)
          }}</pre>
        </div>
      </div>
    </ElDialog>
  </div>
</template>
