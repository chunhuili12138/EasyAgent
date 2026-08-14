<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { fetchGetMessageList, fetchReadAllMessages, fetchReadMessage } from '@/service/api/system-manage';
import { $t } from '@/locales';

defineOptions({ name: 'SystemMessage' });

const loading = ref(false);
const dataList = ref<any[]>([]);
const total = ref(0);
const queryParams = reactive({ current: 1, size: 10, keyword: '', type: '', isRead: '' });

const typeOptions = computed(() => [
  { value: '', label: $t('page.manage.message.all') },
  { value: 'info', label: $t('page.manage.message.info') },
  { value: 'warning', label: $t('page.manage.message.warning') },
  { value: 'error', label: $t('page.manage.message.error') },
  { value: 'success', label: $t('page.manage.message.success') },
  { value: 'doc_parse', label: $t('page.manage.message.docParse') }
]);

async function getList() {
  loading.value = true;
  try {
    const { data, error } = await fetchGetMessageList(queryParams);
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
  queryParams.keyword = '';
  queryParams.type = '';
  queryParams.isRead = '';
  handleSearch();
}

async function handleRead(row: any) {
  try {
    const { error } = await fetchReadMessage(row.id);
    if (error) throw error;
    ElMessage.success($t('page.manage.message.markRead'));
    getList();
  } catch {}
}

async function handleReadAll() {
  try {
    await ElMessageBox.confirm($t('page.manage.message.markAllRead'), $t('common.confirm'), { type: 'info' });
    const { error } = await fetchReadAllMessages();
    if (error) throw error;
    ElMessage.success($t('page.manage.message.markAllRead'));
    getList();
  } catch {}
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

onMounted(getList);

function getTypeTagType(type: string) {
  const map: Record<string, string> = {
    system: 'info',
    alert: 'warning',
    operation: 'success',
    doc_parse: 'primary',
    doc_process: 'success'
  };
  return (map[type] || 'info') as any;
}

function getTypeLabel(type: string) {
  const map: Record<string, string> = {
    system: $t('page.manage.message.info'),
    alert: $t('page.manage.message.warning'),
    operation: $t('page.manage.message.success'),
    doc_parse: $t('page.manage.message.docParse'),
    doc_process: $t('page.manage.message.docProcess')
  };
  return map[type] || type;
}
</script>

<template>
  <div class="page-container h-full">
    <ElCard class="w-full">
      <div class="mb-4 flex flex-wrap items-center gap-4">
        <ElInput
          v-model="queryParams.keyword"
          :placeholder="$t('page.manage.message.title')"
          clearable
          style="width: 180px"
        />
        <ElSelect
          v-model="queryParams.type"
          :placeholder="$t('page.manage.message.type')"
          clearable
          style="width: 120px"
        >
          <ElOption v-for="opt in typeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </ElSelect>
        <ElSelect
          v-model="queryParams.isRead"
          :placeholder="$t('page.manage.message.readStatus')"
          clearable
          style="width: 140px"
        >
          <ElOption :label="$t('page.manage.message.all')" value="" />
          <ElOption :label="$t('page.manage.message.read')" value="1" />
          <ElOption :label="$t('page.manage.message.unread')" value="0" />
        </ElSelect>
        <ElButton type="primary" @click="handleSearch">{{ $t('common.search') }}</ElButton>
        <ElButton @click="handleReset">{{ $t('common.reset') }}</ElButton>
      </div>
      <div class="mb-4 flex flex-wrap items-center gap-4">
        <ElButton type="primary" @click="handleReadAll">{{ $t('page.manage.message.markAllRead') }}</ElButton>
      </div>
      <ElTable v-loading="loading" :data="dataList" border stripe style="width: 100%">
        <ElTableColumn
          prop="title"
          :label="$t('page.manage.message.title')"
          min-width="200"
          show-overflow-tooltip
          align="left"
        />
        <ElTableColumn
          prop="content"
          :label="$t('page.manage.log.response')"
          min-width="300"
          show-overflow-tooltip
          align="left"
        />
        <ElTableColumn prop="type" :label="$t('page.manage.message.type')" min-width="100" align="center">
          <template #default="{ row }">
            <ElTag :type="getTypeTagType(row.type)">
              {{ getTypeLabel(row.type) }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="isRead" :label="$t('page.manage.message.readStatus')" min-width="100" align="center">
          <template #default="{ row }">
            <ElTag :type="row.isRead === '1' || row.isRead === 1 ? 'info' : 'danger'">
              {{
                row.isRead === '1' || row.isRead === 1
                  ? $t('page.manage.message.read')
                  : $t('page.manage.message.unread')
              }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="createdAt" :label="$t('common.createTime')" min-width="180" align="left" />
        <ElTableColumn :label="$t('common.action')" min-width="140" fixed="right">
          <template #default="{ row }">
            <ElButton
              type="primary"
              link
              size="small"
              :disabled="row.isRead === '1' || row.isRead === 1"
              @click="handleRead(row)"
            >
              {{ $t('page.manage.message.markRead') }}
            </ElButton>
          </template>
        </ElTableColumn>
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
