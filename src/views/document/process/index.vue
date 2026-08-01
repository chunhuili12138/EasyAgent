<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
const { t: $t } = useI18n();
import { ElMessage, ElMessageBox } from 'element-plus';
import type { TagProps } from 'element-plus';
import {
  fetchGetProcessPage, fetchStartProcess, fetchBatchStartProcess,
  fetchGetProcessResult, fetchUpdateChunk,
  fetchRetryProcess, fetchImportToEs, fetchDeleteProcess
} from '@/service/api/document';
import { request } from '@/service/request';
import { DOC_TYPES, ACL_MODES } from '@/constants/document';
import DocumentProcessingHelp from '../shared/document-processing-help.vue';

const securityOptions = ACL_MODES.map(o => ({ value: o.value, label: $t(o.labelKey) }));
const protectedTagKeys = [
  'year', 'doc_type', 'department', 'post', 'security_level',
  'allow_department', 'allow_post', 'allow_users', 'keywords',
  'chunk_visibility', 'department_id', 'post_id'
];

defineOptions({ name: 'DocumentProcess' });

const loading = ref(false);
const dataList = ref<any[]>([]);
const total = ref(0);
const queryParams = reactive({ current: 1, size: 10, fileName: '', status: '' });
const selectedRows = ref<any[]>([]);

const resultDialogVisible = ref(false);
const resultData = ref<any>(null);
const selectedChunk = ref<any>(null);
const resultLoadingId = ref<number | null>(null);
const treeRef = ref<any>(null);
const editingTab = ref('content'); // content | summary | tags | qa
const isEditing = ref(false);
const editSnapshot = ref<any>(null);
const tagSecurityLevel = ref('public');
const tagForm = reactive<Record<string, any>>({});
const customTags = ref<Record<string, string>[]>([]);
const preservedTags = ref<Record<string, any>>({});
const deptList = ref<{ id: number; name: string }[]>([]);
const postList = ref<{ id: number; name: string }[]>([]);
const userList = ref<{ id: number; nickname: string }[]>([]);
const saving = ref(false);
const importLoading = ref(false);
const treeFilter = ref('');
const kwInput = ref('');
const helpVisible = ref(false);

const treeProps = { children: 'children', label: 'title' };

const flatChunks = computed(() => flattenChunks(resultData.value?.chunks || []));

const chunkStats = computed(() => {
  const flat = flatChunks.value;
  const scores = flat.map((chunk: any) => chunk.qualityScore).filter((score: any) => Number.isFinite(score));
  return {
    total: flat.length,
    parent: flat.filter((chunk: any) => chunk.chunkType === 'parent').length,
    child: flat.filter((chunk: any) => chunk.chunkType === 'child').length,
    qa: flat.reduce((count: number, chunk: any) => count + (chunk.questions?.length || 0), 0),
    averageQuality: scores.length ? Math.round(scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length) : null,
    minimumQuality: scores.length ? Math.min(...scores) : null,
    lowQuality: scores.filter((score: number) => score < 65).length
  };
});

const sectionCoverage = computed(() => {
  const sections = new Map<string, boolean>();
  flatChunks.value.filter((chunk: any) => chunk.chunkType === 'child').forEach((chunk: any) => {
    const key = getSectionKey(chunk.breadcrumb);
    sections.set(key, (sections.get(key) || false) || (chunk.questions?.length || 0) > 0);
  });
  return { covered: [...sections.values()].filter(Boolean).length, total: sections.size };
});

const resultDuration = computed(() => {
  if (!resultData.value?.startedAt || !resultData.value?.completedAt) return '-';
  const seconds = Math.max(0, Math.round((new Date(resultData.value.completedAt).getTime()
    - new Date(resultData.value.startedAt).getTime()) / 1000));
  return seconds < 60 ? `${seconds}${$t('page.manage.process.duration.seconds')}`
    : `${(seconds / 60).toFixed(1)}${$t('page.manage.process.duration.minutes')}`;
});

const hasUnsavedChanges = computed(() => {
  if (!isEditing.value || !editSnapshot.value || !selectedChunk.value) return false;
  return JSON.stringify(currentDraft()) !== JSON.stringify(editSnapshot.value);
});

const aclSubjectLabels = computed(() => {
  if (tagSecurityLevel.value === 'department') return resolveSubjectNames(tagForm.allow_department, deptList.value);
  if (tagSecurityLevel.value === 'post') return resolveSubjectNames(tagForm.allow_post, postList.value);
  if (tagSecurityLevel.value === 'user') return resolveSubjectNames(tagForm.allow_users, userList.value, 'nickname');
  return [];
});

let pollTimer: number | null = null;

const statusMap: Record<string, { label: string; tagType: TagProps['type'] }> = {
  pending: { label: $t('page.manage.process.pending'), tagType: 'info' },
  processing: { label: $t('page.manage.process.processing'), tagType: 'warning' },
  indexing: { label: $t('page.manage.process.indexing'), tagType: 'warning' },
  done: { label: $t('page.manage.process.done'), tagType: 'success' },
  failed: { label: $t('page.manage.process.failed'), tagType: 'danger' },
  indexed: { label: $t('page.manage.process.indexed'), tagType: 'primary' }
};

const stepLabels: Record<string, string> = {
  chunking: $t('page.manage.process.step.chunking'), labeling: $t('page.manage.process.step.labeling'), save: $t('page.manage.process.step.save'),
  summarizing: $t('page.manage.process.step.summarizing'), qa: $t('page.manage.process.step.qa')
};

const docTypes = DOC_TYPES;

function startPolling() { stopPolling(); pollTimer = window.setInterval(() => { if (dataList.value.some(r => r.status === 'pending' || r.status === 'processing' || r.status === 'indexing')) getList(); }, 20000); }
function stopPolling() { if (pollTimer) { clearInterval(pollTimer); pollTimer = null; } }
function stepLabel(name: string) { return (stepLabels as any)[name] || name; }

function computeDuration(row: any) {
  if (!row.startedAt) return '';
  const start = new Date(row.startedAt).getTime();
  const end = row.completedAt ? new Date(row.completedAt).getTime() : Date.now();
  const s = Math.round((end - start) / 1000);
  return s < 60 ? s + $t('page.manage.process.duration.seconds') : s < 3600 ? (s / 60).toFixed(1) + $t('page.manage.process.duration.minutes') : (s / 3600).toFixed(1) + $t('page.manage.process.duration.hours');
}

async function getList() {
  loading.value = true;
  try {
    const { data, error } = await fetchGetProcessPage(queryParams) as any;
    if (!error) {
      dataList.value = data?.records || [];
      total.value = data?.total || 0;
      // 加载排队状态
      const processing = dataList.value.filter((r: any) => r.status === 'processing' && !r.stepTotal);
      for (const row of processing) {
        try {
          const { data: qs } = await request({ url: `/document/process/queue-status?taskId=${row.id}`, method: 'get' }) as any;
          row.queueAhead = qs?.aheadCount || 0;
        } catch { row.queueAhead = 0; }
      }
      dataList.value.some(r => r.status === 'pending' || r.status === 'processing' || r.status === 'indexing') ? startPolling() : stopPolling();
    }
  } finally { loading.value = false; }
}

function handleSearch() { queryParams.current = 1; getList(); }
function handleReset() { queryParams.fileName = ''; queryParams.status = ''; handleSearch(); }

async function showResult(id: number) {
  editingTab.value = 'content';
  resultLoadingId.value = id;
  try {
    const { data, error } = await fetchGetProcessResult(id) as any;
    if (error) return;
    resultData.value = data;
    setSelectedChunk(data?.chunks?.[0] || null);
    resultDialogVisible.value = true;
    await nextTick();
    treeRef.value?.setCurrentKey(selectedChunk.value?.id);
    loadSelectOptions();
  } finally {
    resultLoadingId.value = null;
  }
}

function setSelectedChunk(chunk: any) {
  selectedChunk.value = chunk;
  isEditing.value = false;
  editSnapshot.value = null;
  if (chunk) parseTagsToForm(chunk.tags);
}

async function selectChunk(chunk: any) {
  if (!chunk || chunk.id === selectedChunk.value?.id) return;
  if (!(await confirmDiscardChanges())) {
    await nextTick();
    treeRef.value?.setCurrentKey(selectedChunk.value?.id);
    return;
  }
  setSelectedChunk(chunk);
  await nextTick();
  treeRef.value?.setCurrentKey(chunk.id);
}

function parseTagsToForm(tagsStr: string) {
  let tags: any = {};
  try { tags = JSON.parse(tagsStr); } catch { tags = {}; }
  const rawLevel = tags.security_level || 'public';
  tagSecurityLevel.value = rawLevel;
  tagForm.year = tags.year || '';
  tagForm.doc_type = tags.doc_type || '';
  tagForm.department = Array.isArray(tags.department) ? tags.department : (tags.department ? [tags.department] : []);
  tagForm.post = Array.isArray(tags.post) ? tags.post : (tags.post ? [tags.post] : []);
  tagForm.allow_department = Array.isArray(tags.allow_department) ? tags.allow_department : [];
  tagForm.allow_post = Array.isArray(tags.allow_post) ? tags.allow_post : [];
  tagForm.allow_users = Array.isArray(tags.allow_users) ? tags.allow_users : [];
  tagForm.keywords = Array.isArray(tags.keywords) ? tags.keywords : [];
  const internalKeys = ['chunk_visibility', 'department_id', 'post_id'];
  preservedTags.value = Object.fromEntries(internalKeys.filter(key => tags[key] !== undefined)
    .map(key => [key, tags[key]]));
  const custom: Record<string, string>[] = [];
  for (const [k, v] of Object.entries(tags)) {
    if (!protectedTagKeys.includes(k)) custom.push({ key: k, value: String(v) });
  }
  customTags.value = custom;
}

function buildTagsJson(): string {
  const tags: any = { ...preservedTags.value };
  if (tagForm.year) tags.year = tagForm.year;
  if (tagForm.doc_type) tags.doc_type = tagForm.doc_type;
  if (tagForm.department?.length) tags.department = tagForm.department;
  if (tagForm.post?.length) tags.post = tagForm.post;
  tags.security_level = tagSecurityLevel.value;
  if (tagSecurityLevel.value === 'department') tags.allow_department = tagForm.allow_department || [];
  if (tagSecurityLevel.value === 'post') tags.allow_post = tagForm.allow_post || [];
  if (tagSecurityLevel.value === 'user') tags.allow_users = tagForm.allow_users || [];
  if (tagForm.keywords?.length) tags.keywords = tagForm.keywords;
  for (const ct of customTags.value) {
    if (ct.key && !protectedTagKeys.includes(ct.key)) tags[ct.key] = ct.value;
  }
  return JSON.stringify(tags);
}

function currentDraft() {
  return {
    content: selectedChunk.value?.content || '',
    summary: selectedChunk.value?.summary || '',
    tags: buildTagsJson(),
    questions: [...(selectedChunk.value?.questions || [])]
  };
}

function startEditing() {
  if (!selectedChunk.value) return;
  isEditing.value = true;
  editSnapshot.value = currentDraft();
}

function cancelEditing() {
  if (!editSnapshot.value || !selectedChunk.value) {
    isEditing.value = false;
    return;
  }
  selectedChunk.value.content = editSnapshot.value.content;
  selectedChunk.value.summary = editSnapshot.value.summary;
  selectedChunk.value.questions = [...editSnapshot.value.questions];
  selectedChunk.value.tags = editSnapshot.value.tags;
  parseTagsToForm(editSnapshot.value.tags);
  isEditing.value = false;
  editSnapshot.value = null;
}

async function confirmDiscardChanges() {
  if (!hasUnsavedChanges.value) return true;
  try {
    await ElMessageBox.confirm(
      $t('page.manage.process.unsavedMessage'),
      $t('page.manage.process.unsavedTitle'),
      { type: 'warning', confirmButtonText: $t('page.manage.process.discardChanges') }
    );
    cancelEditing();
    return true;
  } catch {
    return false;
  }
}

async function loadSelectOptions() {
  try {
    const { data: d1 } = await request({ url: '/system/department/list', method: 'get' }) as any;
    deptList.value = d1 || [];
  } catch (e) {
    console.warn('部门列表加载失败', e);
    deptList.value = [];
  }
  try {
    const { data: d2 } = await request({ url: '/system/post/list', method: 'get' }) as any;
    postList.value = d2?.map((p: any) => ({ id: p.id, name: p.name })) || [];
  } catch (e) {
    console.warn('岗位列表加载失败', e);
    postList.value = [];
  }
  try {
    const { data: d3 } = await request({ url: '/system/user/list', method: 'get' }) as any;
    userList.value = d3?.map((u: any) => ({ id: u.id, nickname: u.nickname || String(u.id) })) || [];
  } catch (e) {
    console.warn('用户列表加载失败', e);
    userList.value = [];
  }
}

watch(tagSecurityLevel, (v) => {
  if (v === 'department') { tagForm.allow_department = tagForm.allow_department || []; }
  if (v !== 'department') tagForm.allow_department = [];
  if (v !== 'post') tagForm.allow_post = [];
  if (v !== 'user') tagForm.allow_users = [];
});

async function handleImport(id: number) {
  try {
    await ElMessageBox.confirm($t('page.manage.process.confirmImport'), $t('page.manage.process.importConfirm'), { type: 'warning' });
    importLoading.value = true;
    const row = dataList.value.find(item => item.id === id);
    if (row) row.status = 'indexing';
    startPolling();
    const { error } = await fetchImportToEs(id) as any;
    importLoading.value = false;
    if (error) {
      await getList();
      ElMessage.warning(error?.message || $t('page.manage.process.importFailed'));
      return;
    }
    ElMessage.success($t('page.manage.process.importSuccess'));
    if (resultData.value?.processTaskId === id) {
      const selectedId = selectedChunk.value?.id;
      const { data } = await fetchGetProcessResult(id) as any;
      if (data) {
        resultData.value = data;
        setSelectedChunk(flattenChunks(data.chunks || []).find((chunk: any) => chunk.id === selectedId)
          || data.chunks?.[0] || null);
        await nextTick();
        treeRef.value?.setCurrentKey(selectedChunk.value?.id);
      }
    }
    getList();
  } catch { importLoading.value = false; }
}

async function handleRetry(id: number) {
  try { await ElMessageBox.confirm($t('page.manage.parse.retryConfirm'), $t('common.tip'), { type: 'warning' }); } catch { return; }
  const { error } = await fetchRetryProcess(id) as any;
  if (error) return;
  const row = dataList.value.find(item => item.id === id);
  if (row) {
    Object.assign(row, {
      status: 'pending', errorMessage: null, totalChunks: 0, llmCalls: 0, tokenCost: 0,
      startedAt: null, completedAt: null, stepCurrent: null, stepDone: 0,
      stepTotal: 0, stepIndex: 0, queueAhead: 0
    });
  }
  selectedRows.value = selectedRows.value.filter(item => item.id !== id);
  ElMessage.success($t('page.manage.parse.retrySubmitted'));
  startPolling();
  await getList();
}

async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm($t('page.manage.process.confirmDelete'), $t('page.manage.process.deleteConfirm'), { type: 'warning' });
    const { error } = await fetchDeleteProcess(id) as any;
    if (error) { ElMessage.warning(error?.message || $t('page.manage.process.deleteFailed')); return; }
    ElMessage.success($t('page.manage.process.deleteSuccess'));
    getList();
  } catch {}
}

async function handleBatchImport() {
  if (selectedRows.value.length === 0) { ElMessage.warning($t('page.manage.process.selectRecords')); return; }
  try {
    await ElMessageBox.confirm($t('page.manage.process.batchImportConfirm', { n: selectedRows.value.length }), $t('page.manage.process.batchImportTitle'), { type: 'warning' });
    importLoading.value = true;
    for (const row of selectedRows.value) {
      row.status = 'indexing';
      startPolling();
      const { error } = await fetchImportToEs(row.id) as any;
      if (error) {
        await getList();
        throw error;
      }
    }
    importLoading.value = false;
    ElMessage.success($t('page.manage.process.batchImportDone'));
    getList();
  } catch { importLoading.value = false; }
}

function addKeyword() {
  if (!kwInput.value) return;
  if (!tagForm.keywords) tagForm.keywords = [];
  tagForm.keywords.push(kwInput.value);
  kwInput.value = '';
}

  async function saveChunk() {
    if (!resultData.value || !selectedChunk.value) return;
    try { await ElMessageBox.confirm($t('page.manage.process.saveChunkConfirm'), $t('common.tip'), { type: 'warning' }); } catch { return; }
    saving.value = true;
  try {
    const tags = buildTagsJson();
    const { error } = await fetchUpdateChunk(resultData.value.processTaskId, selectedChunk.value.id, {
      content: selectedChunk.value.content,
      summary: selectedChunk.value.summary,
      tags,
      questions: selectedChunk.value.questions
    }) as any;
    if (error) { ElMessage.warning(error?.message || $t('page.manage.process.saveFailed')); return; }
    ElMessage.success($t('page.manage.process.saveSuccess'));
    const selectedId = selectedChunk.value.id;
    const { data } = await fetchGetProcessResult(resultData.value.processTaskId) as any;
    if (data) {
      resultData.value = data;
      const refreshed = flattenChunks(data.chunks || []).find((chunk: any) => chunk.id === selectedId);
      setSelectedChunk(refreshed || data.chunks?.[0] || null);
      await nextTick();
      treeRef.value?.setCurrentKey(selectedChunk.value?.id);
    } else {
      selectedChunk.value.tags = tags;
      isEditing.value = false;
      editSnapshot.value = null;
    }
  } finally { saving.value = false; }
}

async function navigateChunk(delta: number) {
  if (!resultData.value?.chunks) return;
  const flat = flattenChunks(resultData.value.chunks);
  const idx = flat.findIndex((c: any) => c.id === selectedChunk.value?.id);
  const next = flat[idx + delta];
  if (next) await selectChunk(next);
}

function flattenChunks(chunks: any[]): any[] {
  const result: any[] = [];
  for (const c of chunks) {
    result.push(c);
    if (c.children) result.push(...flattenChunks(c.children));
  }
  return result;
}

function filterChunkNode(value: string, data: any) {
  if (!value) return true;
  const keyword = value.toLowerCase();
  return [data.title, data.content, data.summary, data.keywords, parseBreadcrumb(data.breadcrumb)]
    .some(item => String(item || '').toLowerCase().includes(keyword));
}

function findRootKeys() {
  return (resultData.value?.chunks || []).map((chunk: any) => chunk.id);
}

function getSectionKey(breadcrumb: string) {
  if (!breadcrumb) return '__document__';
  try {
    const value = JSON.parse(breadcrumb);
    return value.h2 ? `${value.h1 || ''} / ${value.h2}` : (value.h1 || '__document__');
  } catch {
    return breadcrumb;
  }
}

function resolveSubjectNames(values: any[], options: any[], labelKey = 'name') {
  return (values || []).map(value => {
    const option = options.find(item => String(item.id) === String(value));
    return option?.[labelKey] || String(value);
  });
}

function qualityTagType(score: number | null | undefined): TagProps['type'] {
  if (score == null) return 'info';
  if (score < 65) return 'danger';
  if (score < 85) return 'warning';
  return 'success';
}

async function requestCloseResult() {
  if (!(await confirmDiscardChanges())) return;
  resultDialogVisible.value = false;
}

async function beforeResultClose(done: () => void) {
  if (await confirmDiscardChanges()) done();
}

function handleResultClosed() {
  setSelectedChunk(null);
  resultData.value = null;
  treeFilter.value = '';
}

function parseBreadcrumb(bc: string) {
  if (!bc) return '';
  try {
    const b = JSON.parse(bc);
    return Object.values(b).join(' > ');
  } catch { return bc; }
}

watch(treeFilter, value => treeRef.value?.filter(value));

onMounted(getList);
onUnmounted(stopPolling);
</script>

<template>
  <div class="h-full page-container">
    <ElCard class="w-full">
      <div class="mb-4 flex flex-wrap items-center gap-4">
        <ElInput v-model="queryParams.fileName" :placeholder="$t('page.manage.process.fileName')" clearable style="width: 180px" />
        <ElSelect v-model="queryParams.status" :placeholder="$t('page.manage.process.status')" clearable style="width: 130px">
          <ElOption :label="$t('page.manage.process.pending')" value="pending" />
          <ElOption :label="$t('page.manage.process.processing')" value="processing" />
          <ElOption :label="$t('page.manage.process.indexing')" value="indexing" />
          <ElOption :label="$t('page.manage.process.done')" value="done" />
          <ElOption :label="$t('page.manage.process.failed')" value="failed" />
          <ElOption :label="$t('page.manage.process.indexed')" value="indexed" />
        </ElSelect>
        <ElButton type="primary" @click="handleSearch">{{ $t('page.manage.process.search') }}</ElButton>
        <ElButton @click="handleReset">{{ $t('page.manage.process.reset') }}</ElButton>
      </div>
      <div class="mb-4 flex gap-2">
        <ElButton type="primary" :loading="importLoading" :disabled="selectedRows.length === 0" @click="handleBatchImport">
          {{ $t('page.manage.process.batchImport') }}({{ selectedRows.length }})
        </ElButton>
        <ElTooltip :content="$t('page.manage.process.helpTitle')">
          <ElButton circle :aria-label="$t('page.manage.process.helpTitle')" @click="helpVisible = true">
            <SvgIcon icon="mdi:help-circle-outline" />
          </ElButton>
        </ElTooltip>
      </div>
      <ElTable v-loading="loading" :data="dataList" border stripe style="width: 100%" @selection-change="(rows: any[]) => selectedRows = rows">
        <ElTableColumn type="selection" width="50" :selectable="(row: any) => row.status === 'done' || row.status === 'indexed'" />
        <ElTableColumn prop="fileName" :label="$t('page.manage.process.fileName')" min-width="200" align="left" show-overflow-tooltip />
        <ElTableColumn :label="$t('page.manage.process.status')" min-width="100" align="center">
          <template #default="{ row }"><ElTag :type="(statusMap[row.status] || {}).tagType" size="small">{{ (statusMap[row.status] || {}).label || row.status }}</ElTag></template>
        </ElTableColumn>
        <ElTableColumn prop="totalChunks" :label="$t('page.manage.process.totalChunks')" min-width="80" align="center">
          <template #default="{ row }">{{ row.totalChunks || '-' }}</template>
        </ElTableColumn>
        <ElTableColumn prop="tokenCost" :label="$t('page.manage.process.tokenCost')" min-width="100" align="center">
          <template #default="{ row }">{{ row.tokenCost || '-' }}</template>
        </ElTableColumn>
        <ElTableColumn prop="createdAt" :label="$t('page.manage.process.createdAt')" min-width="170" align="left" />
        <ElTableColumn :label="$t('page.manage.process.progress')" min-width="180" align="center">
          <template #default="{ row }">
                <div v-if="(row.status === 'pending' || row.status === 'processing') && row.stepTotal">
              <div class="flex items-center justify-center gap-1 mb-1">
                <span class="text-13px text-blue-500">{{ $t('page.manage.process.stepProgress', { current: row.stepIndex || (row.stepDone + 1), total: row.stepTotal }) }}</span>
                <span v-if="row.stepCurrent" class="text-12px text-gray-500">· {{ stepLabel(row.stepCurrent) }}</span>
              </div>
              <ElProgress :percentage="Math.round(((row.stepIndex || (row.stepDone + 1)) - 1) / row.stepTotal * 100)" :show-text="false" :stroke-width="4" />
              <div v-if="row.queueAhead > 0" class="text-12px text-gray-400 mt-1">{{ $t('page.manage.process.queueAhead', { n: row.queueAhead }) }}</div>
            </div>
            <div v-else-if="row.status === 'done' || row.status === 'indexed'" class="text-12px">
              <span class="text-green-500">{{ $t('page.manage.process.done') }}</span>
              <span class="text-gray-500 ml-1">{{ computeDuration(row) }}</span>
            </div>
            <span v-else-if="row.status === 'pending'" class="text-12px text-gray-500">{{ $t('page.manage.process.pending') }}</span>
            <span v-else-if="row.status === 'indexing'" class="text-12px text-blue-500">{{ $t('page.manage.process.indexing') }}</span>
            <span v-else-if="row.status === 'failed'" class="text-12px text-red-400">{{ $t('page.manage.process.failed') }}</span>
            <span v-else class="text-12px text-gray-400">-</span>
          </template>
        </ElTableColumn>
        <ElTableColumn :label="$t('page.manage.process.action')" min-width="200" fixed="right" align="center">
          <template #default="{ row }">
            <ElButton v-if="row.status === 'done' || row.status === 'indexed'" type="primary" link size="small" :loading="resultLoadingId === row.id" @click="showResult(row.id)">{{ $t('page.manage.process.result') }}</ElButton>
            <ElButton v-if="row.status === 'done'" type="success" link size="small" :loading="importLoading" @click="handleImport(row.id)">{{ $t('page.manage.process.importKb') }}</ElButton>
            <ElButton v-if="row.status === 'indexed'" type="warning" link size="small" :loading="importLoading" @click="handleImport(row.id)">{{ $t('page.manage.process.updateKb') }}</ElButton>
            <ElButton v-if="row.status === 'failed'" type="warning" link size="small" @click="handleRetry(row.id)">{{ $t('page.manage.parse.retry') }}</ElButton>
            <ElButton v-if="row.status !== 'processing' && row.status !== 'indexing'" type="danger" link size="small" @click="handleDelete(row.id)">{{ $t('page.manage.process.delete') }}</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
      <div class="mt-4 flex justify-end">
        <ElPagination v-model:current-page="queryParams.current" v-model:page-size="queryParams.size" :page-sizes="[10,20,50,100]" :total="total" layout="total, sizes, prev, pager, next, jumper" @current-change="(v:number) => { queryParams.current = v; getList(); }" @size-change="(v:number) => { queryParams.size = v; queryParams.current = 1; getList(); }" />
      </div>
    </ElCard>

    <ElDialog
      v-model="resultDialogVisible"
      :title="$t('page.manage.process.resultTitle') + ' — ' + (resultData?.fileName || '')"
      fullscreen
      :before-close="beforeResultClose"
      @closed="handleResultClosed"
    >
      <div v-if="resultData" class="result-dialog-body">
        <div class="stats-bar">
          <div class="stat-item"><span class="stat-label">{{ $t('page.manage.process.statsTotal') }}</span><strong>{{ chunkStats.total }}</strong></div>
          <div class="stat-item"><span class="stat-label">{{ $t('page.manage.process.statsParent') }}/{{ $t('page.manage.process.statsChild') }}</span><strong>{{ chunkStats.parent }}/{{ chunkStats.child }}</strong></div>
          <div class="stat-item"><span class="stat-label">{{ $t('page.manage.process.tabQa') }}</span><strong>{{ chunkStats.qa }}</strong></div>
          <div class="stat-item"><span class="stat-label">{{ $t('page.manage.process.sectionCoverage') }}</span><strong>{{ sectionCoverage.covered }}/{{ sectionCoverage.total }}</strong></div>
          <div class="stat-item"><span class="stat-label">{{ $t('page.manage.process.averageQuality') }}</span><strong>{{ chunkStats.averageQuality ?? '-' }}</strong></div>
          <div class="stat-item"><span class="stat-label">{{ $t('page.manage.process.llmCalls') }}</span><strong>{{ resultData.llmCalls ?? '-' }}</strong></div>
          <div class="stat-item"><span class="stat-label">Token</span><strong>{{ resultData.tokenCost ?? '-' }}</strong></div>
          <div class="stat-item"><span class="stat-label">{{ $t('page.manage.process.durationLabel') }}</span><strong>{{ resultDuration }}</strong></div>
          <ElTag :type="resultData.status === 'indexed' ? 'primary' : 'success'" size="small" class="status-tag">
            {{ (statusMap[resultData.status] || {}).label || resultData.status }}
          </ElTag>
        </div>

        <div class="result-workspace">
          <aside class="chunk-tree-panel">
            <ElInput v-model="treeFilter" :placeholder="$t('page.manage.process.chunkSearch')" size="small" clearable class="mb-2" />
            <ElTree
              ref="treeRef"
              :data="resultData.chunks"
              :props="treeProps"
              node-key="id"
              :default-expanded-keys="findRootKeys()"
              :filter-node-method="filterChunkNode"
              highlight-current
              :expand-on-click-node="false"
              class="chunk-tree"
              @node-click="selectChunk"
            >
              <template #default="{ data }">
                <div class="tree-node-row">
                  <ElTag :type="data.chunkType === 'parent' ? 'info' : undefined" size="small" effect="plain">
                    {{ data.chunkType === 'parent' ? $t('page.manage.process.parent') : $t('page.manage.process.child') }}
                  </ElTag>
                  <span class="tree-node-title" :title="data.title">{{ data.title || $t('page.manage.process.noTitle') }}</span>
                  <span v-if="data.qualityScore != null" :class="['quality-dot', `quality-${qualityTagType(data.qualityScore)}`]">{{ data.qualityScore }}</span>
                </div>
              </template>
            </ElTree>
          </aside>

          <main class="chunk-detail-panel">
            <div v-if="selectedChunk" class="editor-body">
              <div class="chunk-header">
                <div class="min-w-0">
                  <div class="chunk-title">{{ selectedChunk.title || $t('page.manage.process.noTitle') }}</div>
                  <div v-if="selectedChunk.breadcrumb" class="breadcrumb-text">{{ parseBreadcrumb(selectedChunk.breadcrumb) }}</div>
                </div>
                <div class="chunk-meta-tags">
                  <ElTag :type="qualityTagType(selectedChunk.qualityScore)" size="small">
                    {{ $t('page.manage.process.qualityScore') }} {{ selectedChunk.qualityScore ?? '-' }}
                  </ElTag>
                  <ElTag size="small" type="info" effect="plain">#{{ selectedChunk.chunkIndex ?? '-' }}</ElTag>
                  <ElTag size="small" type="info" effect="plain">{{ selectedChunk.tokenCount ?? 0 }} Token</ElTag>
                </div>
              </div>

              <ElAlert
                v-if="isEditing"
                class="mb-3"
                type="warning"
                :closable="false"
                show-icon
                :title="$t('page.manage.process.manualEditWarning')"
              />

              <div class="metadata-strip">
                <span><b>MD5</b> {{ selectedChunk.md5 || '-' }}</span>
                <span><b>{{ $t('page.manage.process.indexStatus') }}</b> {{ selectedChunk.esDocId ? $t('page.manage.process.indexed') : $t('page.manage.process.notIndexed') }}</span>
                <span v-if="selectedChunk.embeddingModel"><b>{{ $t('page.manage.process.embeddingModel') }}</b> {{ selectedChunk.embeddingModel }}</span>
              </div>

              <ElTabs v-model="editingTab" class="result-tabs">
                <ElTabPane :label="$t('page.manage.process.tabContent')" name="content" />
                <ElTabPane :label="$t('page.manage.process.tabSummary')" name="summary" />
                <ElTabPane :label="$t('page.manage.process.tabTags')" name="tags" />
                <ElTabPane :label="`QA (${(selectedChunk.questions || []).length})`" name="qa" />
              </ElTabs>

              <div v-show="editingTab === 'content'" class="tab-content">
                <div class="field-caption">
                  {{ selectedChunk.chunkType === 'parent' ? $t('page.manage.process.parentBlock') : $t('page.manage.process.childBlock') }}
                  · {{ selectedChunk.content?.length || 0 }} {{ $t('page.manage.process.charCount') }}
                </div>
                <ElInput v-model="selectedChunk.content" type="textarea" :rows="18" resize="vertical" :readonly="!isEditing" class="font-mono" />
              </div>

              <div v-show="editingTab === 'summary'" class="tab-content">
                <div class="field-caption">{{ $t('page.manage.process.tabSummary') }}</div>
                <ElInput v-model="selectedChunk.summary" type="textarea" :rows="8" resize="vertical" :readonly="!isEditing" />
              </div>

              <div v-show="editingTab === 'tags'" class="tags-form tab-content">
                <h4 class="text-14px font-500 mb-3">{{ $t('page.manage.process.inheritedTitle') }}</h4>
                <div class="form-grid">
                  <div class="form-row">
                    <span class="form-label">{{ $t('page.manage.process.inheritableYear') }}</span>
                    <ElInput v-model="tagForm.year" size="small" style="width: 120px" disabled />
                  </div>
                  <div class="form-row">
                    <span class="form-label">{{ $t('page.manage.process.inheritableDocType') }}</span>
                    <ElSelect v-model="tagForm.doc_type" size="small" style="width: 140px" disabled>
                      <ElOption v-for="t in docTypes" :key="t" :label="t" :value="t" />
                    </ElSelect>
                  </div>
                  <div class="form-row">
                    <span class="form-label">{{ $t('page.manage.process.inheritableDept') }}</span>
                    <ElSelect v-model="tagForm.department" multiple size="small" style="width: 220px" disabled>
                      <ElOption v-for="d in deptList" :key="d.id" :label="d.name" :value="d.name" />
                    </ElSelect>
                  </div>
                  <div class="form-row">
                    <span class="form-label">{{ $t('page.manage.process.inheritablePost') }}</span>
                    <ElSelect v-model="tagForm.post" multiple size="small" style="width: 220px" disabled>
                      <ElOption v-for="p in postList" :key="p.id" :label="p.name" :value="p.name" />
                    </ElSelect>
                  </div>
                </div>

                <h4 class="text-14px font-500 mt-4 mb-3">{{ $t('page.manage.process.inheritableSecurityTitle') }}</h4>
                <div class="form-row mb-3">
                  <span class="form-label">{{ $t('page.manage.process.inheritableSecurityLevel') }}</span>
                  <ElSelect v-model="tagSecurityLevel" size="small" style="width: 140px" disabled>
                    <ElOption v-for="o in securityOptions" :key="o.value" :label="o.label" :value="o.value" />
                  </ElSelect>
                </div>

                <div v-if="tagSecurityLevel !== 'public'" class="acl-subjects">
                  <span class="form-label">{{ $t('page.manage.process.authorizedSubjects') }}</span>
                  <div class="flex flex-wrap gap-1">
                    <ElTag v-for="subject in aclSubjectLabels" :key="subject" size="small" effect="plain">{{ subject }}</ElTag>
                    <span v-if="aclSubjectLabels.length === 0" class="text-13px text-gray-400">{{ $t('common.noData') }}</span>
                  </div>
                </div>

                <h4 class="text-14px font-500 mt-4 mb-3">{{ $t('page.manage.process.inheritableKeywords') }}</h4>
                <div class="flex flex-wrap gap-1 mb-2">
                  <ElTag v-for="(k, i) in (tagForm.keywords || [])" :key="i" :closable="isEditing" size="small" @close="tagForm.keywords.splice(i,1)">{{ k }}</ElTag>
                  <template v-if="isEditing">
                    <ElInput v-model="kwInput" :placeholder="$t('page.manage.process.addKeyword')" size="small" style="width: 140px" @keyup.enter="addKeyword" />
                    <ElTooltip :content="$t('page.manage.process.addKeyword')">
                      <ElButton size="small" circle @click="addKeyword">
                        <SvgIcon icon="mdi:plus" />
                      </ElButton>
                    </ElTooltip>
                  </template>
                </div>

                <h4 class="text-14px font-500 mt-4 mb-3">{{ $t('page.manage.process.customTags') }}</h4>
                <div v-for="(ct, i) in customTags" :key="i" class="flex items-center gap-1 mb-1">
                  <ElInput v-model="ct.key" :placeholder="$t('page.manage.process.tagKey')" size="small" style="width: 140px" :readonly="!isEditing" />
                  <ElInput v-model="ct.value" :placeholder="$t('page.manage.process.tagValue')" size="small" style="width: min(260px, 100%)" :readonly="!isEditing" />
                  <ElButton v-if="isEditing" size="small" type="danger" plain @click="customTags.splice(i,1)">{{ $t('page.manage.process.delete') }}</ElButton>
                </div>
                <ElButton v-if="isEditing" size="small" @click="customTags.push({key:'',value:''})">+ {{ $t('page.manage.process.add') }}</ElButton>
              </div>

              <div v-show="editingTab === 'qa'" class="tab-content">
                <div v-for="(q, i) in (selectedChunk.questions || [])" :key="i" class="flex items-center gap-2 mb-2">
                  <span class="text-12px text-gray-400 min-w-24px">{{ Number(i) + 1 }}.</span>
                  <ElInput v-model="selectedChunk.questions[i]" size="small" style="flex:1" :readonly="!isEditing" />
                  <ElButton v-if="isEditing" size="small" type="danger" plain @click="selectedChunk.questions.splice(i, 1)">{{ $t('page.manage.process.delete') }}</ElButton>
                </div>
                <ElEmpty v-if="(selectedChunk.questions || []).length === 0" :description="$t('page.manage.process.noQuestions')" :image-size="64" />
                <ElButton v-if="isEditing" size="small" @click="selectedChunk.questions = [...(selectedChunk.questions || []), '']">+ {{ $t('page.manage.process.addQuestion') }}</ElButton>
              </div>
            </div>
            <ElEmpty v-else :description="$t('page.manage.process.selectChunkHint')" />
          </main>
        </div>
      </div>
      <template #footer>
        <div class="result-footer">
          <div class="footer-group">
            <ElButton size="small" @click="navigateChunk(-1)">{{ $t('page.manage.process.prev') }}</ElButton>
            <ElButton size="small" @click="navigateChunk(1)">{{ $t('page.manage.process.next') }}</ElButton>
          </div>
          <div class="footer-group">
            <ElButton v-if="!isEditing" type="primary" :disabled="!selectedChunk" @click="startEditing">{{ $t('page.manage.process.editChunk') }}</ElButton>
            <template v-else>
              <ElButton type="primary" :loading="saving" :disabled="!hasUnsavedChanges" @click="saveChunk">{{ $t('page.manage.process.saveEdit') }}</ElButton>
              <ElButton :disabled="saving" @click="cancelEditing">{{ $t('common.cancel') }}</ElButton>
            </template>
            <ElButton v-if="resultData" :loading="importLoading" :disabled="hasUnsavedChanges || saving" @click="handleImport(resultData.processTaskId)">
              {{ resultData.status === 'indexed' ? $t('page.manage.process.updateKb') : $t('page.manage.process.importKb') }}
            </ElButton>
            <ElButton @click="requestCloseResult">{{ $t('page.manage.process.close') }}</ElButton>
          </div>
        </div>
      </template>
    </ElDialog>
    <DocumentProcessingHelp v-model="helpVisible" topic="process" />
  </div>
</template>

<style scoped>
.result-dialog-body { height: calc(100vh - 132px); min-height: 0; display: flex; flex-direction: column; }
.stats-bar { display: flex; align-items: stretch; flex-wrap: wrap; gap: 0; padding: 8px 10px; background: #f5f7fa; border: 1px solid #e4e7ed; border-radius: 6px; margin-bottom: 12px; }
.stat-item { min-width: 92px; padding: 2px 12px; border-right: 1px solid #dcdfe6; display: flex; flex-direction: column; gap: 2px; }
.stat-item strong { font-size: 15px; color: #303133; font-weight: 600; }
.stat-label { font-size: 12px; color: #909399; }
.status-tag { align-self: center; margin-left: auto; }
.result-workspace { min-height: 0; flex: 1; display: grid; grid-template-columns: minmax(260px, 320px) minmax(0, 1fr); border: 1px solid #e4e7ed; }
.chunk-tree-panel { min-width: 0; overflow: auto; padding: 12px; border-right: 1px solid #e4e7ed; background: #fafafa; }
.chunk-tree { min-width: 100%; background: transparent; }
.tree-node-row { width: 100%; min-width: 0; display: flex; align-items: center; gap: 6px; padding-right: 6px; }
.tree-node-title { min-width: 0; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; }
.quality-dot { flex: none; min-width: 24px; font-size: 11px; text-align: right; }
.quality-success { color: #529b2e; }
.quality-warning { color: #b88230; }
.quality-danger { color: #c45656; }
.quality-info { color: #909399; }
.chunk-detail-panel { min-width: 0; overflow: auto; padding: 16px 20px; }
.chunk-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
.chunk-title { overflow-wrap: anywhere; color: #303133; font-size: 16px; font-weight: 600; }
.breadcrumb-text { margin-top: 4px; overflow-wrap: anywhere; color: #909399; font-size: 12px; }
.chunk-meta-tags { flex: none; display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 6px; }
.metadata-strip { display: flex; flex-wrap: wrap; gap: 8px 20px; padding: 8px 10px; background: #f8f9fa; border-left: 3px solid #909399; color: #606266; font-size: 12px; overflow-wrap: anywhere; }
.result-tabs { margin-top: 8px; }
.tab-content { padding-bottom: 16px; }
.field-caption { margin-bottom: 8px; color: #909399; font-size: 12px; }
.acl-subjects { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 12px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.form-row { display: flex; align-items: center; gap: 8px; }
.form-label { min-width: 70px; font-size: 13px; color: #606266; text-align: right; }
.result-footer { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.footer-group { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }

@media (max-width: 900px) {
  .result-dialog-body { height: calc(100vh - 150px); }
  .stats-bar { max-height: 132px; overflow: auto; }
  .stat-item { min-width: 80px; flex: 1 0 25%; border-bottom: 1px solid #dcdfe6; }
  .status-tag { margin: 6px 8px; }
  .result-workspace { grid-template-columns: 1fr; grid-template-rows: minmax(150px, 30vh) minmax(0, 1fr); }
  .chunk-tree-panel { border-right: 0; border-bottom: 1px solid #e4e7ed; }
  .chunk-detail-panel { padding: 12px; }
  .chunk-header { flex-direction: column; }
  .chunk-meta-tags { justify-content: flex-start; }
  .form-grid { grid-template-columns: 1fr; }
  .form-row { align-items: flex-start; flex-wrap: wrap; }
  .form-label { min-width: 64px; text-align: left; }
  .result-footer { align-items: flex-start; flex-direction: column; }
  .footer-group:last-child { width: 100%; justify-content: flex-end; }
}
</style>
