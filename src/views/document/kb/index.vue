<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { $t } from '@/locales';
import {
  fetchGetEsDataPage, fetchGetKbStats, fetchUnindexFile
} from '@/service/api/document';
import { ACL_MODES } from '@/constants/document';

defineOptions({ name: 'DocumentKb' });

const loading = ref(false);
const dataList = ref<any[]>([]);
const total = ref(0);
const stats = ref({ totalChunks: 0 });
const queryParams = reactive({ current: 1, size: 20, keyword: '', department: '', securityLevel: '', year: '', docType: '' });
const detailDialogVisible = ref(false);
const detailRow = ref<any>(null);

async function getList() {
  loading.value = true;
  try {
    const { data, error } = await fetchGetEsDataPage(queryParams) as any;
    if (!error) { dataList.value = data?.records || []; total.value = data?.total || 0; }
  } finally { loading.value = false; }
}

async function loadStats() {
  const { data } = await fetchGetKbStats() as any;
  if (data) stats.value = data;
}

function handleSearch() { queryParams.current = 1; getList(); }
function handleReset() { queryParams.keyword = ''; queryParams.department = ''; queryParams.securityLevel = ''; queryParams.year = ''; queryParams.docType = ''; handleSearch(); }

function showDetail(row: any) { detailRow.value = row; detailDialogVisible.value = true; }

async function handleUnindex(row: any) {
  try {
    await ElMessageBox.confirm(
      $t('page.manage.kb.unindexConfirmMessage', { name: row.file_name || '-' }),
      $t('page.manage.kb.unindexConfirm'),
      { type: 'warning' }
    );
    const { error } = await fetchUnindexFile(Number(row.file_id)) as any;
    if (error) return;
    ElMessage.success($t('page.manage.kb.unindexSuccess'));
    detailDialogVisible.value = false;
    await Promise.all([getList(), loadStats()]);
  } catch {}
}

function getTagValue(tags: any, key: string) {
  if (!tags) return '';
  if (typeof tags === 'object') return tags[key] || '';
  try { const obj = JSON.parse(tags); return obj[key] || ''; } catch { return ''; }
}

function getTagKeywords(tags: any): string[] {
  if (!tags) return [];
  if (typeof tags === 'object') return tags.keywords || [];
  try { const obj = JSON.parse(tags); return obj.keywords || []; } catch { return []; }
}

function translateSecurityLevel(level: string) {
  if (!level) return '';
  const opt = ACL_MODES.find(o => o.value === level);
  return opt ? $t(opt.labelKey) : level;
}

function handlePageChange(page: number) { queryParams.current = page; getList(); }

onMounted(() => { getList(); loadStats(); });
</script>

<template>
  <div class="h-full page-container">
    <ElCard class="w-full">
      <div class="mb-4 flex flex-wrap items-center gap-4">
        <ElInput v-model="queryParams.keyword" :placeholder="$t('page.manage.kb.keywordSearch')" clearable style="width: 180px" />
        <ElInput v-model="queryParams.department" :placeholder="$t('page.manage.kb.department')" clearable style="width: 120px" />
        <ElSelect v-model="queryParams.securityLevel" :placeholder="$t('page.manage.kb.securityLevel')" clearable style="width: 110px">
          <ElOption v-for="m in ACL_MODES" :key="m.value" :label="$t(m.labelKey)" :value="m.value" />
        </ElSelect>
        <ElInput v-model="queryParams.year" :placeholder="$t('page.manage.kb.year')" clearable style="width: 90px" />
        <ElButton type="primary" @click="handleSearch">{{ $t('common.search') }}</ElButton><ElButton @click="handleReset">{{ $t('common.reset') }}</ElButton>
      </div>
      <div class="mb-4 flex items-center gap-2">
        <span class="text-13px text-gray-500 ml-auto">{{ $t('page.manage.kb.totalCount') }}: {{ stats.totalChunks }}</span>
      </div>
      <ElTable v-loading="loading" :data="dataList" border stripe style="width: 100%">
        <ElTableColumn prop="file_name" :label="$t('page.manage.kb.fileName')" min-width="180" align="left" show-overflow-tooltip />
        <ElTableColumn :label="$t('page.manage.kb.year')" min-width="60" align="center">
          <template #default="{ row }"><span class="text-13px">{{ getTagValue(row.tags, 'year') }}</span></template>
        </ElTableColumn>
        <ElTableColumn :label="$t('page.manage.kb.department')" min-width="120" align="left">
          <template #default="{ row }"><span class="text-13px">{{ getTagValue(row.tags, 'department') }}</span></template>
        </ElTableColumn>
        <ElTableColumn :label="$t('page.manage.kb.securityLevel')" min-width="90" align="center">
          <template #default="{ row }">
            <ElTag v-if="getTagValue(row.tags, 'security_level')" :type="getTagValue(row.tags, 'security_level') === 'user' ? 'danger' : getTagValue(row.tags, 'security_level') === 'post' ? 'warning' : getTagValue(row.tags, 'security_level') === 'department' ? 'primary' : 'info'" size="small">
              {{ translateSecurityLevel(getTagValue(row.tags, 'security_level')) }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn :label="$t('page.manage.kb.tags')" min-width="180" align="left">
          <template #default="{ row }">
            <div class="flex flex-wrap gap-1">
              <ElTag v-for="kw in getTagKeywords(row.tags)" :key="kw" size="small" type="info">{{ kw }}</ElTag>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="summary" :label="$t('page.manage.kb.summary')" min-width="200" align="left" show-overflow-tooltip>
          <template #default="{ row }">{{ (row.summary || '').substring(0, 80) }}</template>
        </ElTableColumn>
        <ElTableColumn :label="$t('page.manage.kb.action')" min-width="140" fixed="right" align="center">
          <template #default="{ row }">
            <ElButton type="primary" link size="small" @click="showDetail(row)">{{ $t('page.manage.kb.viewDetail') }}</ElButton>
            <ElButton type="warning" link size="small" @click="handleUnindex(row)">{{ $t('page.manage.kb.unindex') }}</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
      <div class="mt-4 flex justify-end">
        <ElPagination v-model:current-page="queryParams.current" v-model:page-size="queryParams.size" :page-sizes="[10,20,50]" :total="total" layout="total, sizes, prev, pager, next" @current-change="handlePageChange" />
      </div>
    </ElCard>

    <ElDialog v-model="detailDialogVisible" :title="$t('page.manage.kb.detail')" width="800px" top="5vh" destroy-on-close>
      <div v-if="detailRow" class="space-y-4">
        <div class="flex items-center gap-4 text-13px text-gray-500">
          <span><strong>{{ $t('page.manage.kb.source') }}:</strong> {{ detailRow.file_name }}</span>
          <span>ChunkID: {{ detailRow.chunk_id || detailRow._id }}</span>
        </div>

        <div class="flex flex-wrap gap-2 text-13px">
          <span v-if="getTagValue(detailRow.tags, 'year')" class="px-2 py-1 bg-blue-50 text-blue-700 rounded">{{ $t('page.manage.kb.year') }}: {{ getTagValue(detailRow.tags, 'year') }}</span>
          <span v-if="getTagValue(detailRow.tags, 'department')" class="px-2 py-1 bg-green-50 text-green-700 rounded">{{ $t('page.manage.kb.department') }}: {{ getTagValue(detailRow.tags, 'department') }}</span>
          <span v-if="getTagValue(detailRow.tags, 'security_level')" class="px-2 py-1 rounded" :class="getTagValue(detailRow.tags, 'security_level') === 'user' ? 'bg-red-100 text-red-800' : getTagValue(detailRow.tags, 'security_level') === 'post' ? 'bg-orange-100 text-orange-800' : getTagValue(detailRow.tags, 'security_level') === 'department' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'">{{ $t('page.manage.kb.securityLevel') }}: {{ translateSecurityLevel(getTagValue(detailRow.tags, 'security_level')) }}</span>
          <span v-if="getTagValue(detailRow.tags, 'doc_type')" class="px-2 py-1 bg-purple-50 text-purple-700 rounded">{{ getTagValue(detailRow.tags, 'doc_type') }}</span>
        </div>

        <div>
          <div class="text-13px font-500 text-gray-500 mb-1">{{ $t('page.manage.kb.content') }}</div>
          <div class="p-3 bg-gray-50 rounded text-14px leading-relaxed" style="max-height:250px;overflow-y:auto;white-space:pre-wrap;font-family:monospace;border:1px solid #e5e7eb">{{ detailRow.content }}</div>
        </div>

        <div>
          <div class="text-13px font-500 text-gray-500 mb-1">{{ $t('page.manage.kb.summary') }}</div>
          <div class="text-14px leading-relaxed p-3 bg-blue-50 rounded" style="border:1px solid #dbeafe">{{ detailRow.summary || '-' }}</div>
        </div>

        <div v-if="detailRow.qa && detailRow.qa.length > 0">
          <div class="text-13px font-500 text-gray-500 mb-1">{{ $t('page.manage.kb.questions') }}</div>
          <ul class="space-y-1">
            <li v-for="(q,i) in detailRow.qa" :key="i" class="flex items-start gap-2 text-14px">
              <span class="text-blue-500 font-500 flex-shrink-0">{{ Number(i) + 1 }}.</span>
              <span>{{ q }}</span>
            </li>
          </ul>
        </div>
      </div>
      <template #footer><ElButton @click="detailDialogVisible = false">{{ $t('common.cancel') }}</ElButton></template>
    </ElDialog>
  </div>
</template>
