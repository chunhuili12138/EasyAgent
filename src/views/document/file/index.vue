<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { TagProps } from 'element-plus';
import { ACL_MODES, DOC_TYPES } from '@/constants/document';
import {
  fetchBatchParse,
  fetchBatchUpdateFileAcl,
  fetchCompleteDocumentDirectUpload,
  fetchDeleteFile,
  fetchDocumentAclOptions,
  fetchDownloadFile,
  fetchGetFileAcl,
  fetchGetFilePage,
  fetchInitiateDocumentDirectUpload,
  fetchParseCheck,
  fetchSubmitParse,
  fetchUpdateFileAcl
} from '@/service/api/document';
import type { DirectUploadTicket } from '@/service/api/document';
import { putFileDirectly } from '@/utils/direct-upload';
import { $t } from '@/locales';

const aclModeOptions = computed(() => ACL_MODES.map(o => ({ value: o.value, label: $t(o.labelKey) })));

defineOptions({ name: 'DocumentFile' });

const loading = ref(false);
const dataList = ref<any[]>([]);
const total = ref(0);
const queryParams = reactive({ current: 1, size: 10, fileName: '', fileType: '', status: '' });

const uploadDialogVisible = ref(false);
const uploadFiles = ref<any[]>([]);
const year = ref(String(new Date().getFullYear()));
const docType = ref('');
const departmentId = ref<number | null>(null);
const postId = ref<number | null>(null);
const aclMode = ref('public');
const allowedDepts = ref<number[]>([]);
const allowedPosts = ref<number[]>([]);
const allowedUsers = ref<number[]>([]);
const aclOptions = reactive<{
  departments: Array<{ id: number; name: string; parentId?: number | null }>;
  posts: Array<{ id: number; name: string; departmentId: number }>;
  users: Array<{ id: number; name: string }>;
}>({ departments: [], posts: [], users: [] });
const deptTree = computed(() => buildTree(aclOptions.departments));
const filteredPosts = computed(() => {
  if (!departmentId.value) return aclOptions.posts;
  return aclOptions.posts.filter(p => p.departmentId === departmentId.value || !p.departmentId);
});

function onDeptChange() {
  postId.value = null;
}

function buildTree(list: any[]) {
  if (!list.length) return [];
  if (list[0]?.children) return list;
  const map = new Map<number, any>();
  const roots: any[] = [];
  list.forEach(item => map.set(item.id, { ...item, children: [] }));
  list.forEach(item => {
    const node = map.get(item.id);
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId).children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots.length ? roots : list.map(item => ({ ...item, children: [] }));
}

const uploading = ref(false);
const selectedRows = ref<any[]>([]);
const fileInputRef = ref<HTMLInputElement>();
const aclDialogVisible = ref(false);
const aclSubmitting = ref(false);
const aclTargetIds = ref<number[]>([]);
const aclEditMode = ref('public');
const aclSubjectIds = ref<number[]>([]);

let pollTimer: number | null = null;

function startPolling() {
  stopPolling();
  pollTimer = window.setInterval(() => {
    if (dataList.value.some(row => row.status === 'parsing')) getList();
  }, 20000);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

const fileTypes = [
  { label: 'PDF', value: 'pdf' },
  { label: 'DOCX', value: 'docx' },
  { label: 'DOC', value: 'doc' },
  { label: 'XLSX', value: 'xlsx' },
  { label: 'XLS', value: 'xls' },
  { label: 'PPTX', value: 'pptx' },
  { label: 'PPT', value: 'ppt' },
  { label: 'TXT', value: 'txt' },
  { label: 'MD', value: 'md' },
  { label: 'HTML', value: 'html' },
  { label: 'CSV', value: 'csv' },
  { label: 'JPG', value: 'jpg' },
  { label: 'PNG', value: 'png' },
  { label: 'GIF', value: 'gif' },
  { label: 'BMP', value: 'bmp' },
  { label: 'TIFF', value: 'tiff' },
  { label: 'WEBP', value: 'webp' }
];

const parseStatusMap: Record<string, { label: string; tagType: TagProps['type'] }> = {
  uploaded: { label: $t('page.manage.file.uploaded'), tagType: 'info' },
  not_parsed: { label: $t('page.manage.file.uploaded'), tagType: 'info' },
  parsing: { label: $t('page.manage.file.parsing'), tagType: 'warning' },
  parsed: { label: $t('page.manage.file.parsed'), tagType: 'success' },
  parse_failed: { label: $t('page.manage.file.parseFailed'), tagType: 'danger' }
};

function getStatusTag(status: string) {
  return parseStatusMap[status] || { label: status, tagType: 'info' };
}

function triggerFileInput() {
  fileInputRef.value?.click();
}

async function getList() {
  loading.value = true;
  try {
    const { data, error } = (await fetchGetFilePage(queryParams)) as any;
    if (!error) {
      dataList.value = data?.records || [];
      total.value = data?.total || 0;
      dataList.value.some(r => r.status === 'parsing') ? startPolling() : stopPolling();
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
  queryParams.fileType = '';
  queryParams.status = '';
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

async function showUpload() {
  uploadFiles.value = [];
  uploadDialogVisible.value = true;
  await ensureAclOptions();
}

async function ensureAclOptions() {
  if (aclOptions.departments.length || aclOptions.posts.length || aclOptions.users.length) return;
  const { data } = (await fetchDocumentAclOptions()) as any;
  if (data) Object.assign(aclOptions, data);
}

async function openAclDialog(row?: any) {
  await ensureAclOptions();
  aclTargetIds.value = row ? [row.id] : selectedRows.value.map(item => item.id);
  if (!aclTargetIds.value.length) {
    ElMessage.warning($t('page.manage.file.selectFile'));
    return;
  }
  aclEditMode.value = row?.aclMode || 'public';
  aclSubjectIds.value = [];
  if (row) {
    const { data } = (await fetchGetFileAcl(row.id)) as any;
    aclSubjectIds.value = (data || []).map((item: any) => Number(item.subjectId));
  }
  aclDialogVisible.value = true;
}

function aclEditOptions() {
  if (aclEditMode.value === 'department') return aclOptions.departments;
  if (aclEditMode.value === 'post') return aclOptions.posts;
  if (aclEditMode.value === 'user') return aclOptions.users;
  return [];
}

async function submitAcl() {
  if (aclEditMode.value !== 'public' && !aclSubjectIds.value.length) {
    ElMessage.warning($t('page.manage.process.selectAclSubject'));
    return;
  }
  const payload = {
    aclMode: aclEditMode.value,
    aclList: aclSubjectIds.value.map(subjectId => ({ subjectType: aclEditMode.value, subjectId }))
  };
  try {
    await ElMessageBox.confirm($t('page.manage.process.confirmAclSave'), $t('common.tip'), { type: 'warning' });
  } catch {
    return;
  }
  aclSubmitting.value = true;
  try {
    const response =
      aclTargetIds.value.length === 1
        ? ((await fetchUpdateFileAcl(aclTargetIds.value[0], payload)) as any)
        : ((await fetchBatchUpdateFileAcl(aclTargetIds.value, payload)) as any);
    if (response.error) throw response.error;
    ElMessage.success($t('page.manage.process.aclUpdated'));
    aclDialogVisible.value = false;
    getList();
  } finally {
    aclSubmitting.value = false;
  }
}

function handleFileChange(files: FileList | null) {
  if (!files) return;
  for (let i = 0; i < files.length; i++) {
    uploadFiles.value.push({ file: files[i], status: 'pending', progress: 0 });
  }
}

function handleDrop(e: DragEvent) {
  if (e.dataTransfer?.files) {
    handleFileChange(e.dataTransfer.files);
  }
}

function removeFile(index: number) {
  uploadFiles.value.splice(index, 1);
}

async function startUpload() {
  if (uploadFiles.value.length === 0) {
    ElMessage.warning($t('page.manage.file.selectFile'));
    return;
  }
  try {
    await ElMessageBox.confirm($t('page.manage.file.confirmUpload'), $t('common.tip'), { type: 'warning' });
  } catch {
    return;
  }
  uploading.value = true;
  const selectedDepartment = aclOptions.departments.find(item => item.id === departmentId.value);
  const selectedPost = aclOptions.posts.find(item => item.id === postId.value);

  try {
    const pendingItems = uploadFiles.value.filter(item => item.status !== 'success' && !item.ossUploaded);
    if (pendingItems.length) {
      const { data: tickets, error } = (await fetchInitiateDocumentDirectUpload({
        files: pendingItems.map(item => ({
          fileName: item.file.name,
          fileSize: item.file.size,
          contentType: item.file.type || 'application/octet-stream'
        })),
        year: year.value || undefined,
        docType: docType.value || undefined,
        departmentId: selectedDepartment?.id,
        department: selectedDepartment?.name,
        postId: selectedPost?.id,
        post: selectedPost?.name,
        aclMode: aclMode.value,
        allowedDepts: allowedDepts.value,
        allowedPosts: allowedPosts.value,
        allowedUsers: allowedUsers.value
      })) as any;
      if (error || !tickets) throw error || new Error('Unable to initiate direct upload');
      pendingItems.forEach((item, index) => {
        item.ticket = tickets[index] as DirectUploadTicket;
        item.uploadId = tickets[index].uploadId;
      });
    }

    for (const item of uploadFiles.value.filter(entry => entry.status !== 'success')) {
      try {
        item.status = 'uploading';
        if (!item.ossUploaded) {
          const ticket = item.ticket as DirectUploadTicket;
          await putFileDirectly(ticket.uploadUrl, item.file, ticket.headers, percent => {
            item.progress = percent;
          });
          item.ossUploaded = true;
        }
        const { error } = (await fetchCompleteDocumentDirectUpload(item.uploadId)) as any;
        if (error) throw error;
        item.status = 'success';
        item.progress = 100;
      } catch (error) {
        item.status = 'failed';
        item.error = (error as any)?.message || $t('page.manage.file.uploadFailed');
      }
    }
    const failed = uploadFiles.value.filter(item => item.status === 'failed');
    if (failed.length) {
      ElMessage.error(failed[0].error || $t('page.manage.file.uploadFailed'));
    } else {
      ElMessage.success($t('page.manage.file.uploadDone'));
      uploadDialogVisible.value = false;
    }
    await getList();
  } catch (error) {
    uploadFiles.value
      .filter(item => item.status !== 'success')
      .forEach(item => {
        item.status = 'failed';
      });
    ElMessage.error((error as any)?.message || $t('page.manage.file.uploadFailed'));
  } finally {
    uploading.value = false;
  }
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm($t('page.manage.file.confirmDelete'), $t('page.manage.file.deleteConfirm'), {
      type: 'warning'
    });
    const { error } = (await fetchDeleteFile(row.id)) as any;
    if (error) throw error;
    ElMessage.success($t('common.deleteSuccess'));
    getList();
  } catch {
    /* canceled */
  }
}

async function handleDownload(row: any) {
  const { data } = (await fetchDownloadFile(row.id)) as any;
  if (data) window.open(data, '_blank');
}

async function handleParse(row: any) {
  const { data } = (await fetchParseCheck([row.id])) as any;
  if (!data) return;

  try {
    await ElMessageBox.confirm(
      $t('page.manage.file.parseConfirm', { name: row.fileName }),
      $t('page.manage.parse.processSubmitted'),
      { type: 'warning' }
    );
  } catch {
    return;
  }

  const isReparse = data.needConfirm && data.needConfirm.length > 0;
  const { data: result, error } = (await fetchSubmitParse(row.id, isReparse)) as any;
  if (error) {
    ElMessage.warning(error?.message || $t('page.manage.file.uploadFailed'));
    return;
  }
  if (result?.needConfirm) {
    ElMessage.warning($t('page.manage.file.reparseConfirm'));
    return;
  }
  ElMessage.success($t('page.manage.parse.processSubmitted'));
  getList();
}

async function handleBatchParse() {
  if (selectedRows.value.length === 0) {
    ElMessage.warning($t('page.manage.file.selectFile'));
    return;
  }
  const fileIds = selectedRows.value.map(r => r.id);
  const { data } = (await fetchParseCheck(fileIds)) as any;
  if (!data) return;

  try {
    await ElMessageBox.confirm(
      $t('page.manage.file.batchParseConfirm', { count: selectedRows.value.length }),
      $t('page.manage.parse.batchSubmitted'),
      { type: 'warning' }
    );
  } catch {
    return;
  }

  const isReparse = data.needConfirm && data.needConfirm.length > 0;
  const { error } = (await fetchBatchParse(fileIds, isReparse)) as any;
  if (error) {
    ElMessage.warning(error?.message || $t('page.manage.file.uploadFailed'));
    return;
  }
  ElMessage.success($t('page.manage.parse.batchSubmitted'));
  getList();
}

function handleSelectionChange(rows: any[]) {
  selectedRows.value = rows;
}

function formatSize(bytes: number) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(1)} ${units[i]}`;
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
          :placeholder="$t('page.manage.file.fileName')"
          clearable
          style="width: 180px"
        />
        <ElSelect
          v-model="queryParams.fileType"
          :placeholder="$t('page.manage.parse.fileType')"
          clearable
          style="width: 120px"
        >
          <ElOption v-for="ft in fileTypes" :key="ft.value" :label="ft.label" :value="ft.value" />
        </ElSelect>
        <ElSelect
          v-model="queryParams.status"
          :placeholder="$t('page.manage.parse.parseStatus')"
          clearable
          style="width: 130px"
        >
          <ElOption :label="$t('page.manage.file.uploaded')" value="uploaded" />
          <ElOption :label="$t('page.manage.file.parsing')" value="parsing" />
          <ElOption :label="$t('page.manage.file.parsed')" value="parsed" />
          <ElOption :label="$t('page.manage.file.parseFailed')" value="parse_failed" />
        </ElSelect>
        <ElButton type="primary" @click="handleSearch">{{ $t('common.search') }}</ElButton>
        <ElButton @click="handleReset">{{ $t('common.reset') }}</ElButton>
      </div>
      <div class="mb-4 flex flex-wrap items-center gap-4">
        <ElButton type="success" @click="showUpload">{{ $t('page.manage.file.upload') }}</ElButton>
        <ElButton type="primary" :disabled="selectedRows.length === 0" @click="handleBatchParse">
          {{ $t('page.manage.file.batchParse') }}({{ selectedRows.length }})
        </ElButton>
        <ElButton :disabled="selectedRows.length === 0" @click="openAclDialog()">
          {{ $t('page.manage.process.uploadSecurityLevel') }}({{ selectedRows.length }})
        </ElButton>
      </div>
      <ElTable
        v-loading="loading"
        :data="dataList"
        border
        stripe
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <ElTableColumn type="selection" width="40" />
        <ElTableColumn
          prop="fileName"
          :label="$t('page.manage.file.fileName')"
          min-width="300"
          align="left"
          show-overflow-tooltip
        />
        <ElTableColumn prop="fileType" :label="$t('page.manage.file.status')" min-width="80" align="center">
          <template #default="{ row }">{{ (row.fileType || '').toUpperCase() }}</template>
        </ElTableColumn>
        <ElTableColumn prop="fileSize" :label="$t('page.manage.file.fileSize')" min-width="90" align="center">
          <template #default="{ row }">{{ formatSize(row.fileSize) }}</template>
        </ElTableColumn>
        <ElTableColumn prop="status" :label="$t('page.manage.parse.parseStatus')" min-width="100" align="center">
          <template #default="{ row }">
            <ElTag :type="getStatusTag(row.status).tagType" size="small">
              {{ getStatusTag(row.status).label }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn
          prop="aclMode"
          :label="$t('page.manage.process.uploadSecurityLevel')"
          min-width="100"
          align="center"
        >
          <template #default="{ row }">
            <ElTag size="small">
              {{ aclModeOptions.find(item => item.value === row.aclMode)?.label || row.aclMode }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="createdAt" :label="$t('common.createTime')" min-width="170" align="left" />
        <ElTableColumn :label="$t('common.action')" min-width="280" fixed="right" align="center">
          <template #default="{ row }">
            <ElButton v-if="row.status === 'parsed'" type="warning" link @click="handleParse(row)">
              {{ $t('page.manage.file.reparse') }}
            </ElButton>
            <ElButton v-else-if="row.status !== 'parsing'" type="success" link @click="handleParse(row)">
              {{ $t('page.manage.file.parse') }}
            </ElButton>
            <ElButton type="primary" link @click="handleDownload(row)">{{ $t('page.manage.file.download') }}</ElButton>
            <ElButton link @click="openAclDialog(row)">{{ $t('page.manage.process.uploadSecurityLevel') }}</ElButton>
            <ElButton type="danger" link @click="handleDelete(row)">{{ $t('page.manage.file.delete') }}</ElButton>
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
      v-model="uploadDialogVisible"
      :title="$t('page.manage.file.upload')"
      width="650px"
      @close="
        uploadFiles = [];
        uploading = false;
      "
    >
      <!-- 文档元数据区 -->
      <div class="upload-form-section">
        <div class="form-row">
          <div class="form-field">
            <label class="form-label">{{ $t('page.manage.process.uploadYear') }}</label>
            <ElInput v-model="year" class="w-full" placeholder="2026" />
          </div>
          <div class="form-field">
            <label class="form-label">{{ $t('page.manage.process.uploadDocType') }}</label>
            <ElSelect
              v-model="docType"
              class="w-full"
              filterable
              allow-create
              clearable
              :placeholder="$t('page.manage.process.uploadDocTypeHint')"
            >
              <ElOption v-for="t in DOC_TYPES" :key="t" :label="t" :value="t" />
            </ElSelect>
          </div>
        </div>
        <div class="form-row">
          <div class="form-field">
            <label class="form-label">{{ $t('page.manage.process.uploadDept') }}</label>
            <ElTreeSelect
              v-model="departmentId"
              :data="deptTree"
              :render-after-expand="false"
              node-key="id"
              class="w-full"
              filterable
              clearable
              :placeholder="$t('page.manage.process.uploadDept')"
              :props="{ label: 'name', children: 'children' }"
              check-strictly
              @change="onDeptChange"
            />
          </div>
          <div class="form-field">
            <label class="form-label">{{ $t('page.manage.process.uploadPost') }}</label>
            <ElSelect
              v-model="postId"
              class="w-full"
              filterable
              clearable
              :placeholder="$t('page.manage.process.uploadPost')"
            >
              <ElOption v-for="item in filteredPosts" :key="item.id" :label="item.name" :value="item.id" />
            </ElSelect>
          </div>
        </div>
        <div class="form-row">
          <div class="form-field">
            <label class="form-label">{{ $t('page.manage.process.uploadSecurityLevel') }}</label>
            <ElSelect v-model="aclMode" class="w-full">
              <ElOption v-for="m in aclModeOptions" :key="m.value" :label="m.label" :value="m.value" />
            </ElSelect>
          </div>
        </div>
        <div v-if="aclMode === 'department'" class="form-row">
          <div class="form-field">
            <label class="form-label">{{ $t('page.manage.process.uploadAclDept') }}</label>
            <ElTreeSelect
              v-model="allowedDepts"
              :data="deptTree"
              :render-after-expand="false"
              node-key="id"
              class="w-full"
              multiple
              filterable
              clearable
              :placeholder="$t('page.manage.process.uploadAclDept')"
              :props="{ label: 'name', children: 'children' }"
              check-strictly
            />
          </div>
        </div>
        <div v-if="aclMode === 'post'" class="form-row">
          <div class="form-field">
            <label class="form-label">{{ $t('page.manage.process.uploadAclPost') }}</label>
            <ElSelect v-model="allowedPosts" multiple filterable class="w-full">
              <ElOption v-for="item in aclOptions.posts" :key="item.id" :label="item.name" :value="item.id" />
            </ElSelect>
          </div>
        </div>
        <div v-if="aclMode === 'user'" class="form-row">
          <div class="form-field">
            <label class="form-label">{{ $t('page.manage.process.uploadAclUser') }}</label>
            <ElSelect v-model="allowedUsers" multiple filterable class="w-full">
              <ElOption v-for="item in aclOptions.users" :key="item.id" :label="item.name" :value="item.id" />
            </ElSelect>
          </div>
        </div>
      </div>
      <div
        class="upload-area cursor-pointer border-2 border-gray-300 rounded-lg border-dashed p-8 text-center hover:border-blue-400"
        @click="triggerFileInput"
        @dragover.prevent
        @drop.prevent="handleDrop"
      >
        <input
          ref="fileInputRef"
          type="file"
          multiple
          class="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.html,.csv,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.webp"
          @change="(e: Event) => handleFileChange((e.target as HTMLInputElement).files)"
        />
        <div class="mb-2 text-gray-400" style="font-size: 40px">+</div>
        <div class="text-14px text-gray-500">{{ $t('page.manage.file.dropHint') }}</div>
        <div class="mt-1 text-12px text-gray-400">
          {{ $t('page.manage.file.supportedFormats') }}
        </div>
      </div>
      <div v-if="uploadFiles.length > 0" class="mb-4">
        <div class="flex items-center gap-3 border-b px-1 py-2 text-12px text-gray-500">
          <span class="min-w-0 flex-1">{{ $t('page.manage.file.fileName') }}</span>
          <span class="w-80 text-right">{{ $t('page.manage.file.fileSize') }}</span>
          <span class="w-20 text-center">{{ $t('page.manage.file.status') }}</span>
          <span class="w-12 text-center">{{ $t('page.manage.file.action') }}</span>
        </div>
        <div v-for="(item, idx) in uploadFiles" :key="idx" class="flex items-center gap-3 border-b px-1 py-2">
          <span class="min-w-0 flex-1 truncate text-14px" :title="item.file.name">{{ item.file.name }}</span>
          <span class="w-80 text-right text-12px text-gray-400">{{ formatSize(item.file.size) }}</span>
          <span class="w-20 text-center">
            <ElTag v-if="item.status === 'pending'" type="info" size="small">
              {{ $t('page.manage.file.waitUpload') }}
            </ElTag>
            <ElTag v-else-if="item.status === 'uploading'" type="warning" size="small">
              {{ $t('page.manage.file.uploading') }}
            </ElTag>
            <ElTag v-else-if="item.status === 'success'" type="success" size="small">
              {{ $t('page.manage.file.uploadComplete') }}
            </ElTag>
            <ElTag v-else type="danger" size="small">{{ $t('page.manage.file.uploadFailed') }}</ElTag>
            <ElProgress
              v-if="item.status === 'uploading'"
              class="mt-1"
              :percentage="item.progress"
              :show-text="false"
              :stroke-width="4"
            />
          </span>
          <span class="w-12 text-center">
            <ElButton v-if="item.status === 'pending'" type="danger" link @click="removeFile(idx)">
              {{ $t('page.manage.file.remove') }}
            </ElButton>
          </span>
        </div>
      </div>
      <template #footer>
        <ElButton :disabled="uploading" @click="uploadDialogVisible = false">
          {{ $t('page.manage.file.cancel') }}
        </ElButton>
        <ElButton type="primary" :loading="uploading" :disabled="uploadFiles.length === 0" @click="startUpload">
          {{ $t('page.manage.file.startUpload') }}
        </ElButton>
      </template>
    </ElDialog>

    <ElDialog v-model="aclDialogVisible" :title="$t('page.manage.process.uploadSecurityLevel')" width="520px">
      <ElForm label-width="100px">
        <ElFormItem :label="$t('page.manage.process.uploadSecurityLevel')">
          <ElSelect v-model="aclEditMode" class="w-full" @change="aclSubjectIds = []">
            <ElOption v-for="mode in aclModeOptions" :key="mode.value" :label="mode.label" :value="mode.value" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem
          v-if="aclEditMode !== 'public'"
          :label="aclModeOptions.find(item => item.value === aclEditMode)?.label"
        >
          <ElSelect v-model="aclSubjectIds" multiple filterable collapse-tags class="w-full">
            <ElOption v-for="item in aclEditOptions()" :key="item.id" :label="item.name" :value="item.id" />
          </ElSelect>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="aclDialogVisible = false">{{ $t('common.cancel') }}</ElButton>
        <ElButton type="primary" :loading="aclSubmitting" @click="submitAcl">{{ $t('common.save') }}</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<style scoped>
.upload-form-section {
  margin-bottom: 16px;
  padding: 14px 16px;
  background: #f8f9fb;
  border-radius: 8px;
  border: 1px solid #ebeef5;
}
.upload-form-section .section-title {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}
.form-row {
  display: flex;
  gap: 16px;
  margin-bottom: 10px;
}
.form-row:last-child {
  margin-bottom: 0;
}
.form-field {
  flex: 1;
  min-width: 0;
}
.form-label {
  display: block;
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}
.upload-area:hover {
  border-color: #409eff;
  background-color: #f5f7fa;
}
</style>
