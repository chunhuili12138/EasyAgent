<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { TagProps } from 'element-plus';
import {
  fetchBatchStartProcess,
  fetchDeleteParse,
  fetchGetParseContent,
  fetchGetParsePage,
  fetchRetryParse,
  fetchStartProcess
} from '@/service/api/document';
import { request } from '@/service/request';
import { $t } from '@/locales';
import DocumentProcessingHelp from '../shared/document-processing-help.vue';

defineOptions({ name: 'DocumentParse' });

const loading = ref(false);
const dataList = ref<any[]>([]);
const total = ref(0);
const queryParams = reactive({ current: 1, size: 10, fileName: '', status: '', processStatus: '' });
const selectedRows = ref<any[]>([]);

const contentDialogVisible = ref(false);
const contentDialogTitle = ref('');
const mdContent = ref('');
const editing = ref(false);
const editingTaskId = ref<number>(0);
const metricsDialogVisible = ref(false);
const metrics = ref<any>({});
const helpVisible = ref(false);

let pollTimer: number | null = null;

const parseStatusMap: Record<string, { labelKey: App.I18n.I18nKey; tagType: TagProps['type'] }> = {
  pending: { labelKey: 'page.manage.parse.pending', tagType: 'info' },
  processing: { labelKey: 'page.manage.parse.parsing', tagType: 'warning' },
  done: { labelKey: 'page.manage.parse.done', tagType: 'success' },
  failed: { labelKey: 'page.manage.parse.failed', tagType: 'danger' }
};

const processStatusMap: Record<string, { labelKey: App.I18n.I18nKey; tagType: TagProps['type'] }> = {
  not_processed: { labelKey: 'page.manage.parse.notProcessed', tagType: 'info' },
  processing: { labelKey: 'page.manage.parse.processing', tagType: 'warning' },
  processed: { labelKey: 'page.manage.parse.processed', tagType: 'success' },
  failed: { labelKey: 'page.manage.parse.processFailed', tagType: 'danger' }
};

function startPolling() {
  stopPolling();
  pollTimer = window.setInterval(() => {
    if (dataList.value.some(row => row.status === 'processing' || row.processStatus === 'processing')) getList();
  }, 20000);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function formatEstimated(seconds: number | null) {
  if (!seconds) return '-';
  if (seconds < 60) return $t('page.manage.parse.aboutSeconds', { count: seconds });
  if (seconds < 3600) return $t('page.manage.parse.aboutMinutes', { count: (seconds / 60).toFixed(0) });
  return $t('page.manage.parse.aboutHours', { count: (seconds / 3600).toFixed(1) });
}

function formatActual(ms: number | null) {
  if (ms == null) return '-';
  const seconds = ms / 1000;
  if (seconds < 60) return $t('page.manage.parse.durationSeconds', { count: seconds.toFixed(1) });
  return $t('page.manage.parse.durationMinutes', { count: (seconds / 60).toFixed(1) });
}

function formatPercent(value: number | null | undefined) {
  if (value == null) return '-';
  return `${(value * 100).toFixed(1)}%`;
}

function formatMetricList(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) return '-';
  return value.join(', ');
}

function showQueueFeedback(data: any) {
  const state = String(data?.queueState || 'accepted').toLowerCase();
  if (state === 'deferred') {
    ElMessage.warning($t('page.manage.parse.queueDeferred'));
  } else if (state === 'duplicate') {
    ElMessage.info($t('page.manage.parse.queueDuplicate'));
  } else {
    ElMessage.success($t('page.manage.parse.processSubmitted'));
  }
}

function showMetrics(row: any) {
  try {
    metrics.value = typeof row.parseDetail === 'string' ? JSON.parse(row.parseDetail) : row.parseDetail || {};
  } catch {
    metrics.value = {};
  }
  metricsDialogVisible.value = true;
}

async function getList() {
  loading.value = true;
  try {
    const { data, error } = (await fetchGetParsePage(queryParams)) as any;
    if (!error) {
      dataList.value = data?.records || [];
      total.value = data?.total || 0;
      dataList.value.some(r => r.status === 'processing' || r.processStatus === 'processing')
        ? startPolling()
        : stopPolling();
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
  queryParams.fileName = '';
  queryParams.status = '';
  queryParams.processStatus = '';
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

async function handleRetry(id: number) {
  try {
    await ElMessageBox.confirm($t('page.manage.parse.retryConfirm'), $t('common.tip'), { type: 'warning' });
  } catch {
    return;
  }
  const { error } = (await fetchRetryParse(id)) as any;
  if (error) return;
  ElMessage.success($t('page.manage.parse.retrySubmitted'));
  getList();
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm(
      $t('page.manage.parse.deleteConfirmMessage', { name: row.fileName }),
      $t('page.manage.parse.deleteConfirm'),
      { type: 'warning' }
    );
    const { error } = (await fetchDeleteParse(row.id)) as any;
    if (error) return;
    ElMessage.success($t('page.manage.parse.deleteSuccess'));
    getList();
  } catch {}
}

async function showContent(id: number, fileName: string) {
  const { data, error } = (await fetchGetParseContent(id)) as any;
  if (error) return;
  contentDialogTitle.value = `${$t('page.manage.parse.viewContent')} — ${fileName}`;
  mdContent.value = data || '';
  editingTaskId.value = id;
  editing.value = false;
  contentDialogVisible.value = true;
}

async function saveContent() {
  try {
    await ElMessageBox.confirm($t('page.manage.parse.saveContentConfirm'), $t('common.tip'), { type: 'warning' });
  } catch {
    return;
  }
  const { error } = (await request({
    url: `/document/parse/${editingTaskId.value}/content`,
    method: 'put',
    data: { mdContent: mdContent.value }
  })) as any;
  if (error) {
    ElMessage.warning(error?.message || $t('page.manage.parse.saveFailed'));
    return;
  }
  ElMessage.success($t('page.manage.parse.saveSuccess'));
  editing.value = false;
}

async function handleStartProcess(row: any) {
  try {
    await ElMessageBox.confirm(
      $t('page.manage.parse.submitProcessMsg', { name: row.fileName, score: row.qualityScore ?? '-' }),
      $t('common.confirm'),
      { type: 'warning' }
    );
    const { data, error } = (await fetchStartProcess(row.id)) as any;
    if (error) return;
    if (data?.needConfirm) {
      try {
        await ElMessageBox.confirm(data.message, $t('common.confirm'), { type: 'warning' });
        const { data: queued, error: e2 } = (await fetchStartProcess(row.id, true)) as any;
        if (e2) return;
        showQueueFeedback(queued);
      } catch {
        return;
      }
    } else {
      showQueueFeedback(data);
    }
    getList();
  } catch {}
}

async function handleReProcess(row: any) {
  const isIndexed = row.processStatus === 'processed';
  const msg = isIndexed
    ? $t('page.manage.parse.reprocessMsgIndexed', { name: row.fileName })
    : $t('page.manage.parse.reprocessMsgDone', { name: row.fileName });
  try {
    await ElMessageBox.confirm(msg, $t('page.manage.parse.reprocessConfirm'), { type: 'warning' });
    const { data, error } = (await fetchStartProcess(row.id, true)) as any;
    if (error) return;
    showQueueFeedback(data);
    getList();
  } catch {}
}

async function handleRetryProcess(row: any) {
  try {
    await ElMessageBox.confirm(
      $t('page.manage.parse.retryProcessConfirm', { name: row.fileName }),
      $t('page.manage.parse.retryProcess'),
      { type: 'warning' }
    );
    const { error } = (await fetchStartProcess(row.id, true)) as any;
    if (error) return;
    ElMessage.success($t('page.manage.parse.retryProcessSubmitted'));
    getList();
  } catch {}
}

async function handleBatchProcess() {
  const validRows = selectedRows.value.filter(
    r => r.status === 'done' && (r.processStatus === 'not_processed' || !r.processStatus)
  );
  if (validRows.length === 0) {
    ElMessage.warning($t('page.manage.parse.selectValid'));
    return;
  }
  try {
    await ElMessageBox.confirm(
      $t('page.manage.parse.batchProcessConfirm', { n: validRows.length }),
      $t('common.confirm'),
      { type: 'warning' }
    );
    const ids = validRows.map(r => r.id);
    const { error } = (await fetchBatchStartProcess(ids)) as any;
    if (error) return;
    ElMessage.success($t('page.manage.parse.batchSubmitted'));
    selectedRows.value = [];
    getList();
  } catch {}
}

function handleSelectionChange(rows: any[]) {
  selectedRows.value = rows;
}

onMounted(getList);
onUnmounted(stopPolling);
</script>

<template>
  <div class="page-container h-full">
    <ElCard class="w-full">
      <div class="mb-4 flex flex-wrap items-center gap-4">
        <ElInput
          v-model="queryParams.fileName"
          :placeholder="$t('page.manage.parse.fileName')"
          clearable
          style="width: 180px"
        />
        <ElSelect
          v-model="queryParams.status"
          :placeholder="$t('page.manage.parse.parseStatus')"
          clearable
          style="width: 130px"
        >
          <ElOption :label="$t('page.manage.parse.pending')" value="pending" />
          <ElOption :label="$t('page.manage.parse.parsing')" value="processing" />
          <ElOption :label="$t('page.manage.parse.done')" value="done" />
          <ElOption :label="$t('page.manage.parse.failed')" value="failed" />
        </ElSelect>
        <ElSelect
          v-model="queryParams.processStatus"
          :placeholder="$t('page.manage.parse.processStatus')"
          clearable
          style="width: 130px"
        >
          <ElOption :label="$t('page.manage.parse.notProcessed')" value="not_processed" />
          <ElOption :label="$t('page.manage.parse.processing')" value="processing" />
          <ElOption :label="$t('page.manage.parse.processed')" value="processed" />
          <ElOption :label="$t('page.manage.parse.processFailed')" value="failed" />
        </ElSelect>
        <ElButton type="primary" @click="handleSearch">{{ $t('common.search') }}</ElButton>
        <ElButton @click="handleReset">{{ $t('common.reset') }}</ElButton>
      </div>
      <div class="mb-4 flex gap-2">
        <ElButton type="primary" :disabled="selectedRows.length === 0" @click="handleBatchProcess">
          {{ $t('page.manage.parse.batchProcess') }} ({{ selectedRows.length }})
        </ElButton>
        <ElTooltip :content="$t('page.manage.parse.helpTitle')">
          <ElButton circle :aria-label="$t('page.manage.parse.helpTitle')" @click="helpVisible = true">
            <SvgIcon icon="mdi:help-circle-outline" />
          </ElButton>
        </ElTooltip>
      </div>
      <ElTable
        v-loading="loading"
        :data="dataList"
        border
        stripe
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <ElTableColumn
          type="selection"
          width="50"
          :selectable="
            (row: any) => row.status === 'done' && (row.processStatus === 'not_processed' || !row.processStatus)
          "
        />
        <ElTableColumn type="index" width="50" label="#" />
        <ElTableColumn
          prop="fileName"
          :label="$t('page.manage.parse.fileName')"
          min-width="200"
          align="left"
          show-overflow-tooltip
        />
        <ElTableColumn prop="fileType" :label="$t('page.manage.parse.fileType')" min-width="80" align="center">
          <template #default="{ row }">{{ (row.fileType || '').toUpperCase() }}</template>
        </ElTableColumn>
        <ElTableColumn :label="$t('page.manage.parse.duration')" min-width="100" align="center">
          <template #default="{ row }">
            <span v-if="row.parseDuration != null" class="text-12px">{{ formatActual(row.parseDuration) }}</span>
            <span v-else-if="row.status === 'processing'" class="text-12px text-blue-400">
              {{ $t('page.manage.parse.parsing') }}...
            </span>
            <span v-else class="text-12px text-gray-400">-</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="qualityScore" :label="$t('page.manage.parse.qualityScore')" min-width="100" align="center">
          <template #default="{ row }">
            <span
              v-if="row.qualityScore != null"
              class="text-14px font-600"
              :class="[
                row.qualityScore >= 70 ? 'text-green-500' : row.qualityScore >= 50 ? 'text-orange-500' : 'text-red-500'
              ]"
            >
              {{ row.qualityScore }}{{ $t('page.manage.parse.scoreUnit') }}
            </span>
            <span v-else class="text-gray-400">-</span>
          </template>
        </ElTableColumn>
        <ElTableColumn :label="$t('page.manage.parse.parseStatus')" min-width="110" align="center">
          <template #default="{ row }">
            <ElTag :type="(parseStatusMap[row.status] || { tagType: 'info' }).tagType" size="small">
              {{ $t((parseStatusMap[row.status] || { labelKey: 'common.noData' }).labelKey) }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn :label="$t('page.manage.parse.processStatus')" min-width="100" align="center">
          <template #default="{ row }">
            <ElTag
              v-if="row.processStatus"
              :type="(processStatusMap[row.processStatus] || { tagType: 'info' }).tagType"
              size="small"
            >
              {{ $t((processStatusMap[row.processStatus] || { labelKey: 'common.noData' }).labelKey) }}
            </ElTag>
            <span v-else>-</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="createdAt" :label="$t('common.createTime')" min-width="170" align="left" />
        <ElTableColumn :label="$t('common.action')" min-width="280" fixed="right" align="center">
          <template #default="{ row }">
            <ElButton
              v-if="row.status === 'done' && (!row.processStatus || row.processStatus === 'not_processed')"
              type="success"
              link
              size="small"
              @click="handleStartProcess(row)"
            >
              {{ $t('page.manage.parse.submitProcess') }}
            </ElButton>
            <ElButton
              v-if="row.status === 'done' && row.processStatus === 'processed'"
              type="warning"
              link
              size="small"
              @click="handleReProcess(row)"
            >
              {{ $t('page.manage.parse.reprocess') }}
            </ElButton>
            <ElButton
              v-if="row.status === 'done' && row.processStatus === 'failed'"
              type="warning"
              link
              size="small"
              @click="handleRetryProcess(row)"
            >
              {{ $t('page.manage.parse.retryProcess') }}
            </ElButton>
            <ElButton
              v-if="row.status === 'done'"
              type="primary"
              link
              size="small"
              @click="showContent(row.id, row.fileName)"
            >
              {{ $t('page.manage.parse.viewContent') }}
            </ElButton>
            <ElButton v-if="row.parseDetail" type="info" link size="small" @click="showMetrics(row)">
              {{ $t('page.manage.parse.metrics') }}
            </ElButton>
            <ElButton v-if="row.status === 'failed'" type="warning" link size="small" @click="handleRetry(row.id)">
              {{ $t('page.manage.parse.retry') }}
            </ElButton>
            <ElButton
              v-if="row.status !== 'processing' && row.processStatus !== 'processing'"
              type="danger"
              link
              size="small"
              @click="handleDelete(row)"
            >
              {{ $t('page.manage.parse.delete') }}
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

    <ElDialog
      v-model="contentDialogVisible"
      :title="contentDialogTitle"
      width="800px"
      top="5vh"
      @close="editing = false"
    >
      <div
        v-if="!editing"
        class="markdown-body"
        style="
          max-height: 70vh;
          overflow-y: auto;
          white-space: pre-wrap;
          font-family: monospace;
          background: #f8f9fa;
          padding: 16px;
          border-radius: 4px;
        "
      >
        {{ mdContent || $t('page.manage.parse.noContent') }}
      </div>
      <ElInput v-else v-model="mdContent" type="textarea" :rows="20" />
      <ElAlert
        v-if="editing"
        class="mt-3"
        type="warning"
        :closable="false"
        show-icon
        :title="$t('page.manage.parse.manualEditScoreWarning')"
      />
      <template #footer>
        <ElButton v-if="!editing" type="primary" @click="editing = true">{{ $t('page.manage.parse.edit') }}</ElButton>
        <ElButton v-if="editing" type="primary" @click="saveContent">{{ $t('page.manage.parse.save') }}</ElButton>
        <ElButton v-if="editing" @click="editing = false">{{ $t('common.cancel') }}</ElButton>
        <ElButton v-if="!editing" @click="contentDialogVisible = false">{{ $t('common.cancel') }}</ElButton>
      </template>
    </ElDialog>

    <ElDialog
      v-model="metricsDialogVisible"
      :title="$t('page.manage.parse.metricsTitle')"
      width="min(1100px, 96vw)"
      top="8vh"
    >
      <ElDescriptions :column="3" border>
        <ElDescriptionsItem :label="$t('page.manage.parse.parser')">{{ metrics.parser || '-' }}</ElDescriptionsItem>
        <ElDescriptionsItem :label="$t('page.manage.parse.parserFallback')">
          {{ metrics.fallbackFrom || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem :label="$t('page.manage.parse.ocrPages')">
          {{ formatMetricList(metrics.ocrPages) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem :label="$t('page.manage.parse.ocrRegions')">
          {{ metrics.ocrRegions ?? 0 }}
        </ElDescriptionsItem>
        <ElDescriptionsItem :label="$t('page.manage.parse.ocrImages')">{{ metrics.ocrImages ?? 0 }}</ElDescriptionsItem>
        <ElDescriptionsItem :label="$t('page.manage.parse.ocrPreprocessing')">
          {{ formatMetricList(metrics.ocrPreprocessing) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem :label="$t('page.manage.parse.downloadStage')">
          {{ formatActual(metrics.stages?.downloadMs) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem :label="$t('page.manage.parse.extractionStage')">
          {{ formatActual(metrics.stages?.extractionMs) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem :label="$t('page.manage.parse.assessmentStage')">
          {{ formatActual(metrics.stages?.assessmentMs) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem :label="$t('page.manage.parse.markdownStage')">
          {{ formatActual(metrics.stages?.markdownMs) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem :label="$t('page.manage.parse.contentCoverage')">
          {{ formatPercent(metrics.markdownQuality?.contentCoverage) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem :label="$t('page.manage.parse.numericCoverage')">
          {{ formatPercent(metrics.markdownQuality?.numericCoverage) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem :label="$t('page.manage.parse.structureScore')">
          {{ metrics.markdownQuality?.structureScore ?? '-' }}/30
        </ElDescriptionsItem>
        <ElDescriptionsItem :label="$t('page.manage.parse.semanticRetries')">
          {{ metrics.semanticRetries ?? 0 }}
        </ElDescriptionsItem>
        <ElDescriptionsItem :label="$t('page.manage.parse.sourceFallbacks')">
          {{ metrics.sourceFallbacks ?? 0 }}
        </ElDescriptionsItem>
      </ElDescriptions>
      <ElTable v-if="metrics.llmCalls?.length" :data="metrics.llmCalls" border class="mt-4" max-height="300">
        <ElTableColumn prop="taskType" :label="$t('page.manage.parse.taskType')" min-width="150" />
        <ElTableColumn prop="provider" :label="$t('page.manage.parse.provider')" min-width="110" />
        <ElTableColumn prop="model" :label="$t('page.manage.parse.model')" min-width="130" />
        <ElTableColumn prop="thinking" :label="$t('page.manage.parse.thinking')" width="90" />
        <ElTableColumn prop="inputChars" :label="$t('page.manage.parse.inputChars')" width="100" align="right" />
        <ElTableColumn prop="outputChars" :label="$t('page.manage.parse.outputChars')" width="100" align="right" />
        <ElTableColumn prop="promptTokens" :label="$t('page.manage.parse.promptTokens')" width="110" align="right" />
        <ElTableColumn
          prop="completionTokens"
          :label="$t('page.manage.parse.completionTokens')"
          width="120"
          align="right"
        />
        <ElTableColumn
          prop="reasoningTokens"
          :label="$t('page.manage.parse.reasoningTokens')"
          width="120"
          align="right"
        />
        <ElTableColumn prop="retryCount" :label="$t('page.manage.parse.retryCount')" width="90" align="right" />
        <ElTableColumn prop="fallbackProvider" :label="$t('page.manage.parse.fallbackProvider')" min-width="120" />
        <ElTableColumn :label="$t('page.manage.parse.duration')" width="100" align="right">
          <template #default="{ row }">{{ formatActual(row.durationMs) }}</template>
        </ElTableColumn>
      </ElTable>
    </ElDialog>
    <DocumentProcessingHelp v-model="helpVisible" topic="parse" />
  </div>
</template>
