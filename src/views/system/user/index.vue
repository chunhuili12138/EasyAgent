<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { $t } from '@/locales';
import { useAuthStore } from '@/store/modules/auth';
import {
  fetchCreateUser,
  fetchDeleteUser,
  fetchGetAllRoles,
  fetchGetAllTenants,
  fetchGetAllPosts,
  fetchGetDepartmentTree,
  fetchGetUserList,
  fetchGetUserRoles,
  fetchGetUserTenants,
  fetchGetUserOrganization,
  fetchResetPassword,
  fetchUpdateUser
} from '@/service/api/system-manage';

defineOptions({ name: 'SystemUser' });

const authStore = useAuthStore();

const loading = ref(false);
const dataList = ref<any[]>([]);
const total = ref(0);
const queryParams = reactive({ current: 1, size: 10, keyword: '' });
const dialogVisible = ref(false);
const dialogTitle = ref('');
const formRef = ref();
const formData = reactive({
  phone: '',
  nickname: '',
  email: '',
  password: '',
  status: '1',
  selectedRoleIds: [] as number[],
  selectedTenantIds: [] as number[],
  departmentId: null as number | null,
  postId: null as number | null
});
const editingId = ref<number | null>(null);
const isCreate = ref(true);
const isPasswordCreate = ref(false);

const allRoles = ref<any[]>([]);
const allTenants = ref<any[]>([]);
const departmentTree = ref<Api.SystemManage.DepartmentTree[]>([]);
const allPosts = ref<Api.SystemManage.Post[]>([]);
const submitting = ref(false);
let postLoadSequence = 0;
const availablePosts = computed(() =>
  allPosts.value.filter(post => post.departmentId === formData.departmentId && Number(post.status) === 1)
);

const resetPwdVisible = ref(false);
const resetPwdFormRef = ref();
const resetPwdData = reactive({ newPassword: '' });

async function getList() {
  loading.value = true;
  try {
    const { data, error } = await fetchGetUserList(queryParams);
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
  handleSearch();
}

async function loadDropdowns() {
  const [rolesRes, tenantsRes, departmentsRes] = await Promise.all([
    fetchGetAllRoles(),
    fetchGetAllTenants(),
    fetchGetDepartmentTree()
  ]);
  allRoles.value = (rolesRes.data as any) || [];
  allTenants.value = (tenantsRes.data as any) || [];
  departmentTree.value = departmentsRes.data || [];
  allPosts.value = [];
}

async function loadPosts(departmentId: number | null) {
  const sequence = ++postLoadSequence;
  if (departmentId == null) {
    allPosts.value = [];
    return;
  }
  const { data, error } = await fetchGetAllPosts(departmentId);
  if (sequence === postLoadSequence && !error) allPosts.value = data || [];
}

function handleDepartmentChange() {
  formData.postId = null;
  loadPosts(formData.departmentId);
}

async function handleAdd() {
  await loadDropdowns();
  isCreate.value = true;
  isPasswordCreate.value = true;
  dialogTitle.value = $t('page.manage.user.addUser');
  editingId.value = null;
  formData.phone = '';
  formData.nickname = '';
  formData.email = '';
  formData.password = '';
  formData.password = '';
  formData.status = '1';
  formData.selectedRoleIds = [];
  formData.selectedTenantIds = authStore.userInfo.currentTenantId ? [authStore.userInfo.currentTenantId] : [];
  formData.departmentId = null;
  formData.postId = null;
  dialogVisible.value = true;
}

async function handleEdit(row: any) {
  await loadDropdowns();
  isCreate.value = false;
  isPasswordCreate.value = false;
  dialogTitle.value = $t('page.manage.user.editUser');
  editingId.value = row.id;
  formData.phone = row.phone;
  formData.nickname = row.nickname || '';
  formData.email = row.email || '';
  formData.status = String(row.status ?? '1');

  const [rolesRes, tenantsRes, organizationRes] = await Promise.all([
    fetchGetUserRoles(row.id),
    fetchGetUserTenants(row.id),
    fetchGetUserOrganization(row.id)
  ]);
  formData.selectedRoleIds = (rolesRes.data as any) || [];
  formData.selectedTenantIds = (tenantsRes.data as any) || [];
  formData.departmentId = organizationRes.data?.departmentId ?? null;
  formData.postId = organizationRes.data?.postId ?? null;
  await loadPosts(formData.departmentId);

  dialogVisible.value = true;
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm($t('common.confirmDelete'), $t('common.confirm'), { type: 'warning' });
    await fetchDeleteUser(row.id);
    ElMessage.success($t('common.deleteSuccess'));
    getList();
  } catch {}
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;
  const currentTenantId = authStore.userInfo.currentTenantId;
  if (!currentTenantId || !formData.selectedTenantIds.includes(currentTenantId)) {
    ElMessage.warning($t('page.manage.user.selectTenant'));
    return;
  }
  if (formData.selectedRoleIds.length === 0) {
    ElMessage.warning($t('page.manage.user.selectRole'));
    return;
  }
  if ((formData.departmentId == null) !== (formData.postId == null)) {
    ElMessage.warning($t('page.manage.user.selectDepartmentAndPost'));
    return;
  }
  submitting.value = true;
  try {
    if (isCreate.value) {
      const { data, error } = await fetchCreateUser({
        phone: formData.phone,
        nickname: formData.nickname,
        email: formData.email,
        password: formData.password,
        roleIds: formData.selectedRoleIds,
        tenantIds: formData.selectedTenantIds,
        departmentId: formData.departmentId,
        postId: formData.postId
      });
      if (error) throw error;
      if (data == null) throw new Error('User creation returned no id');
    } else {
      const userId = editingId.value!;
      const { error } = await fetchUpdateUser(userId, {
        nickname: formData.nickname,
        email: formData.email,
        status: Number(formData.status),
        roleIds: formData.selectedRoleIds,
        tenantIds: formData.selectedTenantIds,
        organization: {
          departmentId: formData.departmentId,
          postId: formData.postId
        }
      });
      if (error) throw error;
    }
    ElMessage.success(isCreate.value ? $t('common.addSuccess') : $t('common.updateSuccess'));
    dialogVisible.value = false;
    getList();
  } catch {
    // request interceptor displays the server error
  } finally {
    submitting.value = false;
  }
}

function handleOpenResetPwd(row: any) {
  editingId.value = row.id;
  resetPwdData.newPassword = '';
  resetPwdVisible.value = true;
}

async function handleResetPwdSubmit() {
  const valid = await resetPwdFormRef.value.validate().catch(() => false);
  if (!valid) return;
  try {
    await fetchResetPassword(editingId.value!, resetPwdData.newPassword);
    ElMessage.success($t('common.updateSuccess'));
    resetPwdVisible.value = false;
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
  getList();
  loadDropdowns();
});
</script>

<template>
  <div class="h-full page-container">
    <ElCard class="w-full">
      <div class="mb-4 flex flex-wrap items-center gap-4">
        <ElInput v-model="queryParams.keyword" :placeholder="$t('page.manage.user.userPhone') + '/' + $t('page.manage.user.nickName')" clearable style="width: 180px" />
        <ElButton type="primary" @click="handleSearch">{{ $t('common.search') }}</ElButton>
        <ElButton @click="handleReset">{{ $t('common.reset') }}</ElButton>
      </div>
      <div class="mb-4 flex flex-wrap items-center gap-4">
        <ElButton type="primary" @click="handleAdd">{{ $t('page.manage.user.addUser') }}</ElButton>
      </div>
      <ElTable v-loading="loading" :data="dataList" border stripe style="width: 100%">
        <ElTableColumn prop="phone" :label="$t('page.manage.user.userPhone')" min-width="120" align="left" />
        <ElTableColumn prop="nickname" :label="$t('page.manage.user.nickName')" min-width="100" align="left" />
        <ElTableColumn prop="email" :label="$t('page.manage.user.userEmail')" min-width="150" align="left" />
        <ElTableColumn prop="departmentName" :label="$t('page.manage.department.name')" min-width="120" align="left">
          <template #default="{ row }">{{ row.departmentName || '-' }}</template>
        </ElTableColumn>
        <ElTableColumn prop="postName" :label="$t('page.manage.post.name')" min-width="160" align="left">
          <template #default="{ row }">{{ row.postName || '-' }}</template>
        </ElTableColumn>
        <ElTableColumn prop="status" :label="$t('page.manage.user.userStatus')" min-width="100" align="center">
          <template #default="{ row }">
            <ElTag :type="row.status === '1' || row.status === 1 ? 'success' : 'danger'">
              {{ row.status === '1' || row.status === 1 ? $t('page.manage.common.status.enable') : $t('page.manage.common.status.disable') }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="tenantName" :label="$t('page.manage.tenant.name')" min-width="200" align="left" />
        <ElTableColumn prop="createdAt" :label="$t('common.createTime')" min-width="180" align="left" />
        <ElTableColumn :label="$t('common.action')" min-width="200" fixed="right">
          <template #default="{ row }">
            <ElButton type="primary" link size="small" @click="handleEdit(row)">{{ $t('common.edit') }}</ElButton>
            <ElButton type="warning" link size="small" @click="handleOpenResetPwd(row)">{{ $t('page.manage.user.resetPwd') }}</ElButton>
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

    <ElDialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <ElForm ref="formRef" :model="formData" label-width="100px">
        <ElFormItem :label="$t('page.manage.user.userPhone')" prop="phone" :rules="[{ required: true, message: $t('page.manage.user.form.userPhone') }]">
          <ElInput v-model="formData.phone" :placeholder="$t('page.manage.user.form.userPhone')" :disabled="!isCreate" />
        </ElFormItem>
        <ElFormItem :label="$t('page.manage.user.nickName')" prop="nickname">
          <ElInput v-model="formData.nickname" :placeholder="$t('page.manage.user.form.nickName')" />
        </ElFormItem>
        <ElFormItem :label="$t('page.manage.user.userEmail')" prop="email">
          <ElInput v-model="formData.email" :placeholder="$t('page.manage.user.form.userEmail')" />
        </ElFormItem>
        <ElFormItem v-if="isCreate" :label="$t('form.pwd.required')" prop="password" :rules="[{ required: true, message: $t('form.pwd.required') }]">
          <ElInput v-model="formData.password" type="password" show-password :placeholder="$t('form.pwd.required')" />
        </ElFormItem>
        <ElFormItem :label="$t('page.manage.user.userStatus')" prop="status">
          <ElSwitch v-model="formData.status" active-value="1" inactive-value="0" />
        </ElFormItem>
        <ElFormItem :label="$t('page.manage.tenant.title')">
          <ElSelect v-model="formData.selectedTenantIds" multiple filterable :placeholder="$t('page.manage.tenant.form.name')" style="width: 100%">
            <ElOption
              v-for="tenant in allTenants"
              :key="tenant.id"
              :label="tenant.name"
              :value="tenant.id"
              :disabled="tenant.id === authStore.userInfo.currentTenantId"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem :label="$t('page.manage.user.userRole')" required>
          <ElSelect v-model="formData.selectedRoleIds" multiple filterable :placeholder="$t('page.manage.user.form.userRole')" style="width: 100%">
            <ElOption v-for="role in allRoles" :key="role.id" :label="role.name" :value="role.id" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem :label="$t('page.manage.department.name')">
          <ElTreeSelect
            v-model="formData.departmentId"
            :data="departmentTree"
            node-key="id"
            :props="{ label: 'name', children: 'children' }"
            check-strictly
            clearable
            filterable
            :placeholder="$t('page.manage.post.selectDepartment')"
            style="width: 100%"
            @change="handleDepartmentChange"
          />
        </ElFormItem>
        <ElFormItem :label="$t('page.manage.post.name')">
          <ElSelect
            v-model="formData.postId"
            filterable
            clearable
            :disabled="formData.departmentId == null"
            :placeholder="$t('page.manage.user.selectPost')"
            style="width: 100%"
          >
            <ElOption v-for="post in availablePosts" :key="post.id" :label="post.name" :value="post.id" />
          </ElSelect>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">{{ $t('common.cancel') }}</ElButton>
        <ElButton type="primary" :loading="submitting" @click="handleSubmit">{{ $t('common.confirm') }}</ElButton>
      </template>
    </ElDialog>

    <ElDialog v-model="resetPwdVisible" :title="$t('page.manage.user.resetPwdTitle')" width="400px">
      <ElForm ref="resetPwdFormRef" :model="resetPwdData" label-width="100px">
        <ElFormItem :label="$t('form.pwd.required')" prop="newPassword" :rules="[{ required: true, message: $t('form.pwd.required') }]">
          <ElInput v-model="resetPwdData.newPassword" type="password" show-password :placeholder="$t('form.pwd.required')" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="resetPwdVisible = false">{{ $t('common.cancel') }}</ElButton>
        <ElButton type="primary" @click="handleResetPwdSubmit">{{ $t('common.confirm') }}</ElButton>
      </template>
    </ElDialog>
  </div>
</template>
