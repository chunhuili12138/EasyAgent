<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { fetchGetLogList, fetchGetTenantList } from '@/service/api/system-manage';
import { $t } from '@/locales';

defineOptions({ name: 'SystemLog' });

const loading = ref(false);
const dataList = ref<any[]>([]);
const total = ref(0);
const queryParams = reactive({
  current: 1,
  size: 10,
  account: '',
  tenantId: undefined as number | undefined,
  module: '',
  status: ''
});
const statusOptions = computed(() => [
  { value: '', label: $t('page.manage.log.all') },
  { value: '1', label: $t('page.manage.log.success') },
  { value: '0', label: $t('page.manage.log.fail') }
]);
const dateRange = ref<[string, string]>(['', '']);
const tenantOptions = ref<{ id: number; name: string }[]>([]);

async function loadTenants() {
  try {
    const { data, error } = await fetchGetTenantList({ current: 1, size: 200 });
    if (!error) tenantOptions.value = data?.records || [];
  } catch {
    /* ignore */
  }
}

async function getList() {
  loading.value = true;
  try {
    const params: any = { ...queryParams };
    if (dateRange.value?.[0]) params.startTime = `${dateRange.value[0]} 00:00:00`;
    if (dateRange.value?.[1]) params.endTime = `${dateRange.value[1]} 23:59:59`;
    const { data, error } = await fetchGetLogList(params);
    if (!error) {
      dataList.value = data?.records || [];
      total.value = data?.total || 0;
    }
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  queryParams.current = 1;
  getList();
}

function handleReset() {
  queryParams.account = '';
  queryParams.tenantId = undefined;
  queryParams.module = '';
  queryParams.status = '';
  dateRange.value = ['', ''];
  handleSearch();
}

function handlePageChange(page: number) {
  queryParams.current = page;
  getList();
}

function handleSizeChange(size: number) {
  queryParams.size = size;
  queryParams.current = 1;
  getList();
}

onMounted(() => {
  loadTenants();
  getList();
});
</script>

<template>
  <div class="page-container h-full">
    <ElCard class="w-full">
      <div class="mb-4 flex flex-wrap items-center gap-4">
        <ElInput
          v-model="queryParams.account"
          :placeholder="$t('page.manage.log.accountPlaceholder')"
          clearable
          style="width: 160px"
        />
        <ElSelect
          v-model="queryParams.tenantId"
          :placeholder="$t('page.manage.log.tenantPlaceholder')"
          clearable
          filterable
          style="width: 180px"
        >
          <ElOption v-for="t in tenantOptions" :key="t.id" :label="t.name" :value="t.id" />
        </ElSelect>
        <ElInput
          v-model="queryParams.module"
          :placeholder="$t('page.manage.log.module')"
          clearable
          style="width: 160px"
        />
        <ElSelect
          v-model="queryParams.status"
          :placeholder="$t('page.manage.log.status')"
          clearable
          style="width: 120px"
        >
          <ElOption v-for="opt in statusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </ElSelect>
        <ElDatePicker
          v-model="dateRange"
          type="daterange"
          :range-separator="$t('page.manage.log.to')"
          :start-placeholder="$t('page.manage.log.startDate')"
          :end-placeholder="$t('page.manage.log.endDate')"
          value-format="YYYY-MM-DD"
          style="width: 260px"
        />
        <ElButton type="primary" @click="handleSearch">{{ $t('common.search') }}</ElButton>
        <ElButton @click="handleReset">{{ $t('common.reset') }}</ElButton>
      </div>
      <ElTable v-loading="loading" :data="dataList" border stripe style="width: 100%">
        <ElTableColumn type="expand" width="50">
          <template #default="{ row }">
            <div class="p-2">
              <div class="mb-1">
                <strong>{{ $t('page.manage.log.requestParams') }}:</strong>
                {{ row.requestSummary || $t('page.manage.log.na') }}
              </div>
              <div>
                <strong>{{ $t('page.manage.log.response') }}:</strong>
                {{ row.responseSummary || $t('page.manage.log.na') }}
              </div>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="username" :label="$t('page.manage.log.account')" min-width="140" align="left" />
        <ElTableColumn prop="nickname" :label="$t('page.manage.log.nickname')" min-width="120" align="left" />
        <ElTableColumn prop="operation" :label="$t('page.manage.log.operation')" min-width="140" align="left" />
        <ElTableColumn prop="module" :label="$t('page.manage.log.module')" min-width="120" align="left" />
        <ElTableColumn
          prop="requestUrl"
          :label="$t('page.manage.log.requestUrl')"
          min-width="200"
          show-overflow-tooltip
          align="left"
        />
        <ElTableColumn prop="ip" :label="$t('page.manage.log.ip')" min-width="140" align="left" />
        <ElTableColumn prop="duration" :label="$t('page.manage.log.duration')" min-width="100" align="center" />
        <ElTableColumn prop="status" :label="$t('page.manage.log.status')" min-width="100" align="center">
          <template #default="{ row }">
            <ElTag :type="row.status === '1' || row.status === 1 ? 'success' : 'danger'">
              {{ row.status === '1' || row.status === 1 ? $t('page.manage.log.success') : $t('page.manage.log.fail') }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="tenantName" :label="$t('page.manage.tenant.name')" min-width="120" align="left" />
        <ElTableColumn prop="createdAt" :label="$t('common.createTime')" min-width="180" align="left" />
      </ElTable>
      <div class="mt-4 flex justify-end">
        <ElPagination
          v-model:current-page="queryParams.current"
          v-model:page-size="queryParams.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </ElCard>
  </div>
</template>
