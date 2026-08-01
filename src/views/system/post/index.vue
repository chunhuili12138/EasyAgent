<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { $t } from '@/locales';
import {
  fetchCreatePost,
  fetchDeletePost,
  fetchGetDepartmentTree,
  fetchGetPostList,
  fetchUpdatePost
} from '@/service/api/system-manage';

defineOptions({ name: 'SystemPost' });

const loading = ref(false);
const dataList = ref<any[]>([]);
const total = ref(0);
const queryParams = reactive({ current: 1, size: 10, name: '', code: '', departmentId: null as number | null });
const dialogVisible = ref(false);
const dialogTitle = ref('');
const formRef = ref();
const formData = reactive({ name: '', code: '', sort: 1, status: '1', departmentId: null as number | null });
const editingId = ref<number | null>(null);
const isCreate = ref(true);

const departmentTree = ref<any[]>([]);

async function getDepartmentTree() {
  const { data, error } = await fetchGetDepartmentTree();
  if (!error) {
    departmentTree.value = data || [];
  }
}

async function getList() {
  loading.value = true;
  try {
    const { data, error } = await fetchGetPostList(queryParams);
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

function handleDepartmentChange(value: number | null) {
  queryParams.departmentId = value;
  handleSearch();
}

function handleReset() {
  queryParams.name = '';
  queryParams.code = '';
  queryParams.departmentId = null;
  handleSearch();
}

function handleAdd() {
  isCreate.value = true;
  dialogTitle.value = $t('page.manage.post.addPost');
  editingId.value = null;
  formData.name = '';
  formData.code = '';
  formData.sort = 1;
  formData.status = '1';
  formData.departmentId = null;
  dialogVisible.value = true;
}

function handleEdit(row: any) {
  isCreate.value = false;
  dialogTitle.value = $t('page.manage.post.editPost');
  editingId.value = row.id;
  formData.name = row.name || '';
  formData.code = row.code || '';
  formData.sort = row.sort ?? 1;
  formData.status = String(row.status ?? '1');
  formData.departmentId = row.departmentId ?? null;
  dialogVisible.value = true;
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm($t('common.confirmDelete'), $t('common.confirm'), { type: 'warning' });
    const { error } = await fetchDeletePost(row.id);
    if (error) throw error;
    ElMessage.success($t('common.deleteSuccess'));
    getList();
  } catch {}
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;
  try {
    if (isCreate.value) {
      const { error } = await fetchCreatePost(formData);
      if (error) throw error;
      ElMessage.success($t('common.addSuccess'));
    } else {
      const { error } = await fetchUpdatePost(editingId.value!, formData);
      if (error) throw error;
      ElMessage.success($t('common.updateSuccess'));
    }
    dialogVisible.value = false;
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

onMounted(() => {
  getDepartmentTree();
  getList();
});
</script>

<template>
  <div class="h-full page-container">
    <ElCard class="w-full">
      <div class="mb-4 flex flex-wrap items-center gap-4">
        <ElTreeSelect
          v-model="queryParams.departmentId"
          :data="departmentTree"
          node-key="id"
          :placeholder="$t('page.manage.post.allDepartments')"
          clearable
          check-strictly
          :render-after-expand="false"
          :props="{ label: 'name', children: 'children' }"
          style="width: 200px"
          @change="handleDepartmentChange"
        />
        <ElInput v-model="queryParams.name" :placeholder="$t('page.manage.post.form.name')" clearable style="width: 180px" />
        <ElInput v-model="queryParams.code" :placeholder="$t('page.manage.post.form.code')" clearable style="width: 180px" />
        <ElButton type="primary" @click="handleSearch">{{ $t('common.search') }}</ElButton>
        <ElButton @click="handleReset">{{ $t('common.reset') }}</ElButton>
      </div>
      <div class="mb-4 flex flex-wrap items-center gap-4">
        <ElButton type="primary" @click="handleAdd">{{ $t('page.manage.post.addPost') }}</ElButton>
      </div>
      <ElTable v-loading="loading" :data="dataList" border stripe style="width: 100%">
        <ElTableColumn prop="departmentName" :label="$t('page.manage.post.department')" min-width="200" align="left" />
        <ElTableColumn prop="name" :label="$t('page.manage.post.name')" min-width="160" align="left" />
        <ElTableColumn prop="code" :label="$t('page.manage.post.code')" min-width="160" align="left" />
        <ElTableColumn prop="sort" :label="$t('page.manage.post.sort')" min-width="80" align="center" />
        <ElTableColumn prop="status" :label="$t('common.status')" min-width="100" align="center">
          <template #default="{ row }">
            <ElTag :type="row.status === '1' || row.status === 1 ? 'success' : 'danger'">
              {{ row.status === '1' || row.status === 1 ? $t('page.manage.common.status.enable') : $t('page.manage.common.status.disable') }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="tenantName" :label="$t('page.manage.tenant.name')" min-width="130" align="left" />
        <ElTableColumn prop="createdAt" :label="$t('common.createTime')" min-width="180" align="left" />
        <ElTableColumn :label="$t('common.action')" min-width="150" fixed="right">
          <template #default="{ row }">
            <ElButton type="primary" link size="small" @click="handleEdit(row)">{{ $t('common.edit') }}</ElButton>
            <ElButton type="danger" link size="small" @click="handleDelete(row)">{{ $t('common.delete') }}</ElButton>
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
      <ElDialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <ElForm ref="formRef" :model="formData" label-width="100px">
        <ElFormItem :label="$t('page.manage.post.department')" prop="departmentId" :rules="[{ required: true, message: $t('page.manage.post.selectDepartment') }]">
          <ElTreeSelect
            v-model="formData.departmentId"
            :data="departmentTree"
            node-key="id"
            :placeholder="$t('page.manage.post.selectDepartment')"
            clearable
            check-strictly
            :render-after-expand="false"
            :props="{ label: 'name', children: 'children' }"
            style="width: 100%"
          />
        </ElFormItem>
        <ElFormItem :label="$t('page.manage.post.name')" prop="name" :rules="[{ required: true, message: $t('page.manage.post.form.name') }]">
          <ElInput v-model="formData.name" :placeholder="$t('page.manage.post.form.name')" />
        </ElFormItem>
        <ElFormItem :label="$t('page.manage.post.code')" prop="code" :rules="[{ required: true, message: $t('page.manage.post.form.code') }]">
          <ElInput v-model="formData.code" :placeholder="$t('page.manage.post.form.code')" />
        </ElFormItem>
        <ElFormItem :label="$t('page.manage.post.sort')" prop="sort">
          <ElInputNumber v-model="formData.sort" :min="1" style="width: 100%" />
        </ElFormItem>
        <ElFormItem :label="$t('common.status')" prop="status">
          <ElSwitch v-model="formData.status" active-value="1" inactive-value="0" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">{{ $t('common.cancel') }}</ElButton>
        <ElButton type="primary" @click="handleSubmit">{{ $t('common.confirm') }}</ElButton>
      </template>
    </ElDialog>
  </div>
</template>
