<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { fetchSqlLogDetail, fetchSqlLogStats, fetchSqlLogs } from '@/service/api/rag';
import { $t } from '@/locales';
import { sqlStatusLabel } from '../shared/display';

defineOptions({ name: 'RagSqlLog' });

const t = $t;
const list = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const size = ref(20);
const loading = ref(false);
const status = ref('');
const keyword = ref('');
const dateRange = ref<string[]>([]);
const detailVisible = ref(false);
const current = ref<any>({});
const stats = ref<any>({});

onMounted(() => {
  loadData();
  loadStats();
});

async function loadData() {
  loading.value = true;
  const from = dateRange.value?.[0] || undefined;
  const to = dateRange.value?.[1] || undefined;
  try {
    const res = await fetchSqlLogs({
      page: page.value,
      size: size.value,
      status: status.value || undefined,
      keyword: keyword.value || undefined,
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
  const res = await fetchSqlLogStats();
  stats.value = res.data || {};
}
async function viewDetail(row: any) {
  const res = await fetchSqlLogDetail(row.id);
  current.value = res.data || {};
  detailVisible.value = true;
}
function resetSearch() {
  keyword.value = '';
  status.value = '';
  dateRange.value = [];
  page.value = 1;
  loadData();
}
async function copySql(value?: string) {
  if (!value) return;
  await navigator.clipboard.writeText(value);
  ElMessage.success(t('rag.common.copySuccess'));
}
</script>

<template>
  <div class="page-container h-full">
    <div class="mb-4 flex gap-4">
      <ElCard
        v-for="card in [
          { l: t('rag.quota.total'), v: stats.total },
          { l: t('rag.quota.success'), v: stats.success },
          { l: t('rag.quota.blocked'), v: stats.blocked }
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
        <ElInput
          v-model="keyword"
          :placeholder="t('rag.sqlLog.searchPlaceholder')"
          clearable
          class="w-48"
          @keyup.enter="loadData"
        />
        <ElSelect v-model="status" :placeholder="t('rag.common.status')" clearable class="w-36" @change="loadData">
          <ElOption v-for="s in ['success', 'blocked', 'failed']" :key="s" :label="sqlStatusLabel(s)" :value="s" />
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
      <ElTable v-loading="loading" :data="list" stripe border class="w-full">
        <ElTableColumn
          prop="naturalQuery"
          :label="t('rag.sqlLog.naturalQuery')"
          min-width="200"
          show-overflow-tooltip
        />
        <ElTableColumn prop="generatedSql" :label="t('rag.sqlLog.generatedSql')" min-width="250" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="text-xs font-mono">{{ row.generatedSql }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn :label="t('rag.common.status')" width="80">
          <template #default="{ row }">
            <ElTag
              :type="row.status === 'success' ? 'success' : row.status === 'blocked' ? 'warning' : 'danger'"
              size="small"
            >
              {{ sqlStatusLabel(row.status) }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn :label="t('rag.sqlLog.execTime')" width="90">
          <template #default="{ row }">{{ row.executionTime ?? '-' }} ms</template>
        </ElTableColumn>
        <ElTableColumn prop="resultCount" :label="t('rag.sqlLog.rowCount')" width="70" />
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

    <ElDialog v-model="detailVisible" :title="t('rag.sqlLog.detailTitle')" width="600px">
      <div class="text-sm space-y-3">
        <div>
          <span class="text-gray-500">{{ t('rag.sqlLog.naturalQuery') }}：</span>
          {{ current.naturalQuery }}
        </div>
        <div>
          <div class="flex items-center justify-between">
            <span class="text-gray-500">{{ t('rag.sqlLog.generatedSql') }}：</span>
            <ElButton link size="small" @click="copySql(current.generatedSql)">{{ t('rag.common.copy') }}</ElButton>
          </div>
          <pre class="mt-1 max-h-48 overflow-auto rounded bg-gray-50 p-2 text-xs font-mono">{{
            current.generatedSql
          }}</pre>
        </div>
        <div>
          <div class="flex items-center justify-between">
            <span class="text-gray-500">{{ t('rag.sqlLog.finalSql') }}：</span>
            <ElButton link size="small" @click="copySql(current.finalSql || current.generatedSql)">
              {{ t('rag.common.copy') }}
            </ElButton>
          </div>
          <pre class="mt-1 max-h-48 overflow-auto rounded bg-gray-50 p-2 text-xs font-mono">{{
            current.finalSql || current.generatedSql
          }}</pre>
        </div>
        <div>
          <span class="text-gray-500">{{ t('rag.common.status') }}：</span>
          <ElTag size="small">{{ sqlStatusLabel(current.status) }}</ElTag>
        </div>
        <div v-if="current.blockReason">
          <span class="text-gray-500">{{ t('rag.sqlLog.blockReason') }}：</span>
          <span class="text-red-500">{{ current.blockReason }}</span>
        </div>
      </div>
    </ElDialog>
  </div>
</template>
