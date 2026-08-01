<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { $t } from '@/locales';
import {
  fetchCreateTenant,
  fetchDeleteTenant,
  fetchGetTenantList,
  fetchUpdateTenant
} from '@/service/api/system-manage';

defineOptions({ name: 'SystemTenant' });

const loading = ref(false);
const dataList = ref<any[]>([]);
const total = ref(0);
const queryParams = reactive({ current: 1, size: 10, name: '', code: '' });
const dialogVisible = ref(false);
const dialogTitle = ref('');
const formRef = ref();
const formData = reactive({ name: '', code: '', contactName: '', contactPhone: '', status: '1' });
const editingId = ref<number | null>(null);
const isCreate = ref(true);

async function getList() {
  loading.value = true;
  try {
    const { data, error } = await fetchGetTenantList(queryParams);
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
  dialogTitle.value = $t('page.manage.tenant.addTenant');
  editingId.value = null;
  formData.name = '';
  formData.code = '';
  formData.contactName = '';
  formData.contactPhone = '';
  formData.status = '1';
  dialogVisible.value = true;
}

function handleEdit(row: any) {
  isCreate.value = false;
  dialogTitle.value = $t('page.manage.tenant.editTenant');
  editingId.value = row.id;
  formData.name = row.name || '';
  formData.code = row.code || '';
  formData.contactName = row.contactName || '';
  formData.contactPhone = row.contactPhone || '';
  formData.status = String(row.status ?? '1');
  dialogVisible.value = true;
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm($t('common.confirmDelete'), $t('common.confirm'), { type: 'warning' });
    const { error } = await fetchDeleteTenant(row.id);
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
      const { error } = await fetchCreateTenant(formData);
      if (error) throw error;
      ElMessage.success($t('common.addSuccess'));
    } else {
      const { error } = await fetchUpdateTenant(editingId.value!, formData);
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

onMounted(getList);
</script>

<template>
  <div class="h-full page-container">
    <ElCard class="w-full">
      <div class="mb-4 flex flex-wrap items-center gap-4">
        <ElInput v-model="queryParams.name" :placeholder="$t('page.manage.tenant.name')" clearable style="width: 180px" />
        <ElInput v-model="queryParams.code" :placeholder="$t('page.manage.tenant.code')" clearable style="width: 180px" />
        <ElButton type="primary" @click="handleSearch">{{ $t('common.search') }}</ElButton>
        <ElButton @click="handleReset">{{ $t('common.reset') }}</ElButton>
      </div>
      <div class="mb-4 flex flex-wrap items-center gap-4">
        <ElButton type="primary" @click="handleAdd">{{ $t('page.manage.tenant.addTenant') }}</ElButton>
      </div>
      <ElTable v-loading="loading" :data="dataList" border stripe style="width: 100%">
        <ElTableColumn prop="name" :label="$t('page.manage.tenant.name')" min-width="160" align="left" />
        <ElTableColumn prop="code" :label="$t('page.manage.tenant.code')" min-width="120" align="left" />
        <ElTableColumn prop="contactName" :label="$t('page.manage.tenant.contact')" min-width="120" align="left" />
        <ElTableColumn prop="contactPhone" :label="$t('page.manage.tenant.contactPhone')" min-width="140" align="left" />
        <ElTableColumn prop="status" :label="$t('common.status')" min-width="100" align="center">
          <template #default="{ row }">
            <ElTag :type="row.status === '1' || row.status === 1 ? 'success' : 'danger'">
              {{ row.status === '1' || row.status === 1 ? $t('page.manage.common.status.enable') : $t('page.manage.common.status.disable') }}
            </ElTag>
          </template>
        </ElTableColumn>
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
      <ElForm ref="formRef" :model="formData" label-width="120px">
        <ElFormItem :label="$t('page.manage.tenant.name')" prop="name" :rules="[{ required: true, message: $t('page.manage.tenant.form.name') }]">
          <ElInput v-model="formData.name" :placeholder="$t('page.manage.tenant.form.name')" />
        </ElFormItem>
        <ElFormItem :label="$t('page.manage.tenant.code')" prop="code" :rules="[{ required: true, message: $t('page.manage.tenant.form.code') }]">
          <ElInput v-model="formData.code" :placeholder="$t('page.manage.tenant.form.code')" />
        </ElFormItem>
        <ElFormItem :label="$t('page.manage.tenant.form.contactName')" prop="contactName">
          <ElInput v-model="formData.contactName" :placeholder="$t('page.manage.tenant.form.contactName')" />
        </ElFormItem>
        <ElFormItem :label="$t('page.manage.tenant.form.contactPhone')" prop="contactPhone">
          <ElInput v-model="formData.contactPhone" :placeholder="$t('page.manage.tenant.form.contactPhone')" />
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
