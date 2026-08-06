<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import type { TagProps } from 'element-plus';
import { fetchBadCaseDetail, fetchBadCaseStats, fetchBadCases, fetchLabelBadCase } from '@/service/api/rag';
import { $t } from '@/locales';
import { badCaseStatusLabel } from '../shared/display';

defineOptions({ name: 'RagBadCase' });

const t = $t;
const list = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const size = ref(20);
const loading = ref(false);
const stats = ref<Record<string, number>>({});
const statusFilter = ref('');
const keyword = ref('');
const dateRange = ref<string[]>([]);
const labelDialogVisible = ref(false);
const detailDialogVisible = ref(false);
const currentItem = ref<any>(null);
const detailData = ref<any>(null);
const submitting = ref(false);
const labelForm = ref(defaultLabelForm());

const feedbackTypeOptions = [
  { label: t('rag.chat.feedbackTypes.factualMismatch'), value: 'factual_mismatch' },
  { label: t('rag.chat.feedbackTypes.instructionNotFollowed'), value: 'instruction_not_followed' },
  { label: t('rag.chat.feedbackTypes.formatIssue'), value: 'format_issue' },
  { label: t('rag.chat.feedbackTypes.contentError'), value: 'content_error' },
  { label: t('rag.chat.feedbackTypes.incompleteAnswer'), value: 'incomplete_answer' },
  { label: t('rag.chat.feedbackTypes.irrelevantAnswer'), value: 'irrelevant_answer' },
  { label: t('rag.chat.feedbackTypes.other'), value: 'other' }
];

const statusTagMap: Record<string, TagProps['type']> = {
  pending: 'warning',
  labeled: 'primary',
  exported: 'success'
};

function defaultLabelForm(source?: any) {
  return {
    correctAnswer: source?.correctAnswer || ''
  };
}

function feedbackTypeLabel(value?: string) {
  return feedbackTypeOptions.find(option => option.value === value)?.label || value || '-';
}

function formatTime(value?: string) {
  return value ? value.replace('T', ' ').substring(0, 19) : '';
}

async function loadData() {
  loading.value = true;
  try {
    const res = await fetchBadCases({
      page: page.value,
      size: size.value,
      status: statusFilter.value || undefined,
      keyword: keyword.value || undefined,
      dateFrom: dateRange.value?.[0] || undefined,
      dateTo: dateRange.value?.[1] || undefined
    });
    list.value = res.data?.records || [];
    total.value = res.data?.total || 0;
  } finally {
    loading.value = false;
  }
}

async function loadStats() {
  const res = await fetchBadCaseStats();
  stats.value = res.data || {};
}

async function openLabelDialog(row: any) {
  const res = await fetchBadCaseDetail(row.id);
  currentItem.value = res.data || row;
  labelForm.value = defaultLabelForm(currentItem.value);
  labelDialogVisible.value = true;
}

async function submitLabel() {
  if (!labelForm.value.correctAnswer.trim()) {
    ElMessage.warning(t('rag.badCase.labelPlaceholder'));
    return;
  }
  submitting.value = true;
  try {
    await fetchLabelBadCase(currentItem.value.id, labelForm.value);
    ElMessage.success(t('common.updateSuccess'));
    labelDialogVisible.value = false;
    await Promise.all([loadData(), loadStats()]);
  } finally {
    submitting.value = false;
  }
}

async function viewDetail(row: any) {
  const res = await fetchBadCaseDetail(row.id);
  detailData.value = res.data;
  detailDialogVisible.value = true;
}

function resetSearch() {
  keyword.value = '';
  statusFilter.value = '';
  dateRange.value = [];
  page.value = 1;
  loadData();
}

onMounted(() => {
  loadData();
  loadStats();
});
</script>

<template>
  <div class="page-container h-full">
    <ElAlert class="mb-4" type="info" :closable="false" show-icon :title="t('rag.badCase.pageGuide')" />
    <div class="grid grid-cols-2 mb-4 gap-4">
      <ElCard
        v-for="card in [
          { label: t('rag.badCase.pending'), key: 'pending' },
          { label: t('rag.badCase.labeled'), key: 'labeled' }
        ]"
        :key="card.key"
        shadow="never"
      >
        <div class="text-center">
          <div class="text-2xl font-bold">{{ stats[card.key] || 0 }}</div>
          <div class="text-sm text-gray-500">{{ card.label }}</div>
        </div>
      </ElCard>
    </div>

    <ElCard class="w-full">
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <ElInput
          v-model="keyword"
          :placeholder="t('rag.badCase.searchPlaceholder')"
          clearable
          class="w-56"
          @keyup.enter="loadData"
        />
        <ElSelect
          v-model="statusFilter"
          :placeholder="t('rag.common.status')"
          clearable
          class="w-32"
          @change="loadData"
        >
          <ElOption
            v-for="status in ['pending', 'labeled']"
            :key="status"
            :label="badCaseStatusLabel(status)"
            :value="status"
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

      <ElTable v-loading="loading" :data="list" stripe border class="w-full" :empty-text="t('rag.badCase.emptyHint')">
        <ElTableColumn prop="userQuery" :label="t('rag.badCase.userQuery')" min-width="220" show-overflow-tooltip />
        <ElTableColumn :label="t('rag.badCase.feedbackType')" min-width="150">
          <template #default="{ row }">{{ feedbackTypeLabel(row.feedbackType) }}</template>
        </ElTableColumn>
        <ElTableColumn
          prop="feedbackReason"
          :label="t('rag.badCase.feedbackReason')"
          min-width="180"
          show-overflow-tooltip
        >
          <template #default="{ row }">{{ row.feedbackReason || '-' }}</template>
        </ElTableColumn>
        <ElTableColumn :label="t('rag.common.status')" width="100">
          <template #default="{ row }">
            <ElTag :type="statusTagMap[row.status] || 'info'" size="small">{{ badCaseStatusLabel(row.status) }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn :label="t('common.createTime')" width="180">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </ElTableColumn>
        <ElTableColumn :label="t('rag.common.action')" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <ElButton size="small" text @click="viewDetail(row)">{{ t('rag.common.detail') }}</ElButton>
            <ElButton v-if="row.status === 'pending'" size="small" text type="warning" @click="openLabelDialog(row)">
              {{ t('rag.badCase.label') }}
            </ElButton>
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

    <ElDialog
      v-model="labelDialogVisible"
      :title="t('rag.badCase.labelTitle')"
      width="640px"
      @close="labelForm = defaultLabelForm()"
    >
      <div class="text-sm space-y-3">
        <div>
          <span class="text-gray-500">{{ t('rag.badCase.question') }}:</span>
          <div class="mt-1 whitespace-pre-wrap rounded bg-gray-50 p-2">{{ currentItem?.userQuery }}</div>
        </div>
        <div>
          <span class="text-gray-500">{{ t('rag.badCase.aiAnswer') }}:</span>
          <div class="mt-1 max-h-36 overflow-y-auto whitespace-pre-wrap rounded bg-gray-50 p-2">
            {{ currentItem?.llmResponse || '-' }}
          </div>
        </div>
        <div>
          <span class="text-gray-500">{{ t('rag.badCase.feedbackType') }}:</span>
          <div class="mt-1">{{ feedbackTypeLabel(currentItem?.feedbackType) }}</div>
        </div>
        <div v-if="currentItem?.feedbackReason">
          <span class="text-gray-500">{{ t('rag.badCase.feedbackReason') }}:</span>
          <div class="mt-1 whitespace-pre-wrap rounded bg-orange-50 p-2">{{ currentItem.feedbackReason }}</div>
        </div>
        <div>
          <span class="text-gray-500">{{ t('rag.badCase.correctAnswer') }}:</span>
          <ElInput
            v-model="labelForm.correctAnswer"
            type="textarea"
            :rows="4"
            :placeholder="t('rag.badCase.labelPlaceholder')"
            class="mt-1"
          />
        </div>
      </div>
      <template #footer>
        <ElButton @click="labelDialogVisible = false">{{ t('rag.common.cancel') }}</ElButton>
        <ElButton type="primary" :loading="submitting" @click="submitLabel">{{ t('common.save') }}</ElButton>
      </template>
    </ElDialog>

    <ElDialog v-model="detailDialogVisible" :title="t('rag.badCase.detailTitle')" width="640px">
      <div class="max-h-500px overflow-y-auto text-sm space-y-3">
        <ElDescriptions :column="1" border size="small">
          <ElDescriptionsItem :label="t('rag.badCase.sessionId')">
            {{ detailData?.sessionId || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem :label="t('rag.badCase.messageId')">
            {{ detailData?.messageId || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem :label="t('rag.common.status')">
            {{ badCaseStatusLabel(detailData?.status) }}
          </ElDescriptionsItem>
        </ElDescriptions>
        <div>
          <span class="text-gray-500">{{ t('rag.badCase.question') }}:</span>
          <div class="mt-1 whitespace-pre-wrap rounded bg-gray-50 p-2">{{ detailData?.userQuery }}</div>
        </div>
        <div>
          <span class="text-gray-500">{{ t('rag.badCase.aiAnswer') }}:</span>
          <div class="mt-1 max-h-48 overflow-y-auto whitespace-pre-wrap rounded bg-gray-50 p-2">
            {{ detailData?.llmResponse || '-' }}
          </div>
        </div>
        <div>
          <span class="text-gray-500">{{ t('rag.badCase.feedbackType') }}:</span>
          <div class="mt-1">{{ feedbackTypeLabel(detailData?.feedbackType) }}</div>
        </div>
        <div v-if="detailData?.feedbackReason">
          <span class="text-gray-500">{{ t('rag.badCase.feedbackReason') }}:</span>
          <div class="mt-1 whitespace-pre-wrap rounded bg-orange-50 p-2">{{ detailData.feedbackReason }}</div>
        </div>
        <div v-if="detailData?.retrievalResults">
          <span class="text-gray-500">{{ t('rag.badCase.retrievalResults') }}:</span>
          <pre class="mt-1 max-h-40 overflow-auto rounded bg-gray-50 p-2 text-xs">{{
            detailData.retrievalResults
          }}</pre>
        </div>
        <div v-if="detailData?.correctAnswer">
          <span class="text-gray-500">{{ t('rag.badCase.correctAnswer') }}:</span>
          <div class="mt-1 whitespace-pre-wrap rounded bg-green-50 p-2">{{ detailData.correctAnswer }}</div>
        </div>
      </div>
    </ElDialog>
  </div>
</template>
