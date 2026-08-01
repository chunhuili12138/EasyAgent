<script setup lang="ts">
import { nextTick, onMounted, reactive, ref } from 'vue';
import type { ElTree } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import { $t } from '@/locales';
import {
  fetchAssignRoleMenus,
  fetchCreateRole,
  fetchDeleteRole,
  fetchGetMenuTree,
  fetchGetRoleList,
  fetchGetRoleMenus,
  fetchUpdateRole
} from '@/service/api/system-manage';

defineOptions({ name: 'SystemRole' });

const loading = ref(false);
const dataList = ref<any[]>([]);
const total = ref(0);
const queryParams = reactive({ current: 1, size: 10, name: '', code: '' });
const dialogVisible = ref(false);
const dialogTitle = ref('');
const formRef = ref();
const formData = reactive({ name: '', code: '', status: '1' });
const editingId = ref<number | null>(null);
const isCreate = ref(true);

const menuDialogVisible = ref(false);
const menuTreeData = ref<any[]>([]);
const menuTreeRef = ref<InstanceType<typeof ElTree>>();
const roleMenuIds = ref<number[]>([]);
const currentRoleId = ref<number | null>(null);

async function getList() {
  loading.value = true;
  try {
    const { data, error } = await fetchGetRoleList(queryParams);
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
  queryParams.name = '';
  queryParams.code = '';
  handleSearch();
}

function handleAdd() {
  isCreate.value = true;
  dialogTitle.value = $t('page.manage.role.addRole');
  editingId.value = null;
  formData.name = '';
  formData.code = '';
  formData.status = '1';
  dialogVisible.value = true;
}

function handleEdit(row: any) {
  isCreate.value = false;
  dialogTitle.value = $t('page.manage.role.editRole');
  editingId.value = row.id;
  formData.name = row.name || '';
  formData.code = row.code || '';
  formData.status = String(row.status ?? '1');
  dialogVisible.value = true;
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm($t('common.confirmDelete'), $t('common.confirm'), { type: 'warning' });
    const { error } = await fetchDeleteRole(row.id);
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
      const { error } = await fetchCreateRole(formData as any);
      if (error) throw error;
      ElMessage.success($t('common.addSuccess'));
    } else {
      const { error } = await fetchUpdateRole(editingId.value!, formData as any);
      if (error) throw error;
      ElMessage.success($t('common.updateSuccess'));
    }
    dialogVisible.value = false;
    getList();
  } catch {}
}

async function handleOpenMenuDialog(row: any) {
  currentRoleId.value = row.id;
  const [treeRes, menusRes] = await Promise.all([fetchGetMenuTree(), fetchGetRoleMenus(row.id)]);
  if (!treeRes.error) {
    menuTreeData.value = treeRes.data || [];
  }
  roleMenuIds.value = (menusRes.data as any) || [];
  menuDialogVisible.value = true;
  await nextTick();
  menuTreeRef.value?.setCheckedKeys(roleMenuIds.value);
}

async function handleMenuConfirm() {
  if (!currentRoleId.value) return;
  const checkedKeys = menuTreeRef.value?.getCheckedKeys() || [];
  const halfCheckedKeys = menuTreeRef.value?.getHalfCheckedKeys() || [];
  const menuIds = [...(checkedKeys as number[]), ...(halfCheckedKeys as number[])];
  try {
    const { error } = await fetchAssignRoleMenus(currentRoleId.value, menuIds);
    if (error) throw error;
    ElMessage.success($t('common.updateSuccess'));
    menuDialogVisible.value = false;
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
</script>

<template>
  <div class="h-full page-container">
    <ElCard class="w-full">
      <div class="mb-4 flex flex-wrap items-center gap-4">
        <ElInput v-model="queryParams.name" :placeholder="$t('page.manage.role.roleName')" clearable style="width: 180px" />
        <ElInput v-model="queryParams.code" :placeholder="$t('page.manage.role.roleCode')" clearable style="width: 180px" />
        <ElButton type="primary" @click="handleSearch">{{ $t('common.search') }}</ElButton>
        <ElButton @click="handleReset">{{ $t('common.reset') }}</ElButton>
      </div>
      <div class="mb-4 flex flex-wrap items-center gap-4">
        <ElButton type="primary" @click="handleAdd">{{ $t('page.manage.role.addRole') }}</ElButton>
      </div>
      <ElTable v-loading="loading" :data="dataList" border stripe style="width: 100%">
        <ElTableColumn prop="name" :label="$t('page.manage.role.roleName')" min-width="200" align="left" />
        <ElTableColumn prop="code" :label="$t('page.manage.role.roleCode')" min-width="200" align="left" />
        <ElTableColumn prop="status" :label="$t('page.manage.role.roleStatus')" min-width="100" align="center">
          <template #default="{ row }">
            <ElTag :type="row.status === '1' || row.status === 1 ? 'success' : 'danger'">
              {{ row.status === '1' || row.status === 1 ? $t('page.manage.common.status.enable') : $t('page.manage.common.status.disable') }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="createdAt" :label="$t('common.createTime')" min-width="180" align="left" />
        <ElTableColumn :label="$t('common.action')" min-width="150" fixed="right">
          <template #default="{ row }">
            <ElButton type="warning" link size="small" @click="handleOpenMenuDialog(row)">{{ $t('page.manage.role.menuPermission') }}</ElButton>
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
        <ElFormItem :label="$t('page.manage.role.roleName')" prop="name" :rules="[{ required: true, message: $t('page.manage.role.form.roleName') }]">
          <ElInput v-model="formData.name" :placeholder="$t('page.manage.role.form.roleName')" />
        </ElFormItem>
        <ElFormItem :label="$t('page.manage.role.roleCode')" prop="code" :rules="[{ required: true, message: $t('page.manage.role.form.roleCode') }]">
          <ElInput v-model="formData.code" :placeholder="$t('page.manage.role.form.roleCode')" />
        </ElFormItem>
        <ElFormItem :label="$t('page.manage.role.roleStatus')" prop="status">
          <ElSwitch v-model="formData.status" active-value="1" inactive-value="0" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">{{ $t('common.cancel') }}</ElButton>
        <ElButton type="primary" @click="handleSubmit">{{ $t('common.confirm') }}</ElButton>
      </template>
    </ElDialog>

    <ElDialog v-model="menuDialogVisible" :title="$t('page.manage.role.menuPermission')" width="500px">
      <ElTree
        ref="menuTreeRef"
        :data="menuTreeData"
        show-checkbox
        node-key="id"
        default-expand-all
        :props="{ label: 'name', children: 'children' }"
      />
      <template #footer>
        <ElButton @click="menuDialogVisible = false">{{ $t('common.cancel') }}</ElButton>
        <ElButton type="primary" @click="handleMenuConfirm">{{ $t('common.confirm') }}</ElButton>
      </template>
    </ElDialog>
  </div>
</template>
