<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  fetchCreateDictData,
  fetchCreateDictType,
  fetchDeleteDictData,
  fetchDeleteDictType,
  fetchGetDictDataList,
  fetchGetDictTypeList,
  fetchUpdateDictData,
  fetchUpdateDictType
} from '@/service/api/system-manage';
import { $t } from '@/locales';

defineOptions({ name: 'SystemDict' });

const loading = ref(false);
const dictTypeList = ref<any[]>([]);
const dictTypeTotal = ref(0);
const typeQuery = reactive({ current: 1, size: 10, keyword: '' });
const selectedType = ref<any>(null);

const dataLoading = ref(false);
const dictDataList = ref<any[]>([]);
const dictDataTotal = ref(0);
const dataQuery = reactive({ current: 1, size: 10 });

const typeDialogVisible = ref(false);
const typeDialogTitle = ref('');
const typeFormRef = ref();
const typeForm = reactive({ name: '', code: '', status: '1' });
const typeEditingId = ref<number | null>(null);
const typeIsCreate = ref(true);

const dataDialogVisible = ref(false);
const dataDialogTitle = ref('');
const dataFormRef = ref();
const dataForm = reactive({ label: '', value: '', sort: 1, status: '1' });
const dataEditingId = ref<number | null>(null);
const dataIsCreate = ref(true);

async function getDictTypes() {
  loading.value = true;
  try {
    const { data, error } = await fetchGetDictTypeList(typeQuery);
    if (!error) {
      dictTypeList.value = data?.records || [];
      dictTypeTotal.value = data?.total || 0;
    }
  } finally {
    loading.value = false;
  }
}

async function getDictDataList() {
  if (!selectedType.value) return;
  dataLoading.value = true;
  try {
    const { data, error } = await fetchGetDictDataList({ ...dataQuery, dictTypeId: selectedType.value.id } as any);
    if (!error) {
      dictDataList.value = data?.records || [];
      dictDataTotal.value = data?.total || 0;
    }
  } finally {
    dataLoading.value = false;
  }
}

function handleSelectType(row: any) {
  selectedType.value = row;
  dataQuery.current = 1;
  getDictDataList();
}

function handleTypeSearch() {
  typeQuery.current = 1;
  getDictTypes();
}

function handleTypeReset() {
  typeQuery.keyword = '';
  handleTypeSearch();
}

function handleTypeAdd() {
  typeIsCreate.value = true;
  typeDialogTitle.value = $t('page.manage.dict.addType');
  typeEditingId.value = null;
  typeForm.name = '';
  typeForm.code = '';
  typeForm.status = '1';
  typeDialogVisible.value = true;
}

function handleTypeEdit(row: any) {
  typeIsCreate.value = false;
  typeDialogTitle.value = $t('page.manage.dict.editType');
  typeEditingId.value = row.id;
  typeForm.name = row.name || '';
  typeForm.code = row.code || '';
  typeForm.status = String(row.status ?? '1');
  typeDialogVisible.value = true;
}

async function handleTypeDelete(row: any) {
  try {
    await ElMessageBox.confirm($t('common.confirmDelete'), $t('common.confirm'), { type: 'warning' });
    const { error } = await fetchDeleteDictType(row.id);
    if (error) throw error;
    ElMessage.success($t('common.deleteSuccess'));
    if (selectedType.value?.id === row.id) selectedType.value = null;
    getDictTypes();
  } catch {}
}

async function handleTypeSubmit() {
  const valid = await typeFormRef.value.validate().catch(() => false);
  if (!valid) return;
  try {
    if (typeIsCreate.value) {
      const { error } = await fetchCreateDictType(typeForm);
      if (error) throw error;
      ElMessage.success($t('common.addSuccess'));
    } else {
      const { error } = await fetchUpdateDictType(typeEditingId.value!, typeForm);
      if (error) throw error;
      ElMessage.success($t('common.updateSuccess'));
    }
    typeDialogVisible.value = false;
    getDictTypes();
  } catch {}
}

function handleDataAdd() {
  if (!selectedType.value) {
    ElMessage.warning($t('page.manage.dict.selectTypeFirst'));
    return;
  }
  dataIsCreate.value = true;
  dataDialogTitle.value = $t('page.manage.dict.addData');
  dataEditingId.value = null;
  dataForm.label = '';
  dataForm.value = '';
  dataForm.sort = 1;
  dataForm.status = '1';
  dataDialogVisible.value = true;
}

function handleDataEdit(row: any) {
  dataIsCreate.value = false;
  dataDialogTitle.value = $t('page.manage.dict.editData');
  dataEditingId.value = row.id;
  dataForm.label = row.label || '';
  dataForm.value = row.value || '';
  dataForm.sort = row.sort ?? 1;
  dataForm.status = String(row.status ?? '1');
  dataDialogVisible.value = true;
}

async function handleDataDelete(row: any) {
  try {
    await ElMessageBox.confirm($t('common.confirmDelete'), $t('common.confirm'), { type: 'warning' });
    const { error } = await fetchDeleteDictData(row.id);
    if (error) throw error;
    ElMessage.success($t('common.deleteSuccess'));
    getDictDataList();
  } catch {}
}

async function handleDataSubmit() {
  const valid = await dataFormRef.value.validate().catch(() => false);
  if (!valid) return;
  try {
    const payload = { ...dataForm, dictTypeId: selectedType.value.id };
    if (dataIsCreate.value) {
      const { error } = await fetchCreateDictData(payload);
      if (error) throw error;
      ElMessage.success($t('common.addSuccess'));
    } else {
      const { error } = await fetchUpdateDictData(dataEditingId.value!, payload);
      if (error) throw error;
      ElMessage.success($t('common.updateSuccess'));
    }
    dataDialogVisible.value = false;
    getDictDataList();
  } catch {}
}

function handleTypePageChange(page: number) {
  typeQuery.current = page;
  getDictTypes();
}

function handleTypeSizeChange(size: number) {
  typeQuery.size = size;
  typeQuery.current = 1;
  getDictTypes();
}

function handleDataPageChange(page: number) {
  dataQuery.current = page;
  getDictDataList();
}

function handleDataSizeChange(size: number) {
  dataQuery.size = size;
  dataQuery.current = 1;
  getDictDataList();
}

onMounted(getDictTypes);
</script>

<template>
  <div class="h-full flex gap-4">
    <div class="flex-panel">
      <ElCard>
        <div class="mb-4 flex flex-wrap items-center gap-4">
          <ElInput
            v-model="typeQuery.keyword"
            :placeholder="$t('page.manage.dict.form.name')"
            clearable
            style="width: 180px"
          />
          <ElButton type="primary" @click="handleTypeSearch">{{ $t('common.search') }}</ElButton>
          <ElButton @click="handleTypeReset">{{ $t('common.reset') }}</ElButton>
        </div>
        <div class="mb-4 flex flex-wrap items-center gap-4">
          <ElButton type="primary" @click="handleTypeAdd">{{ $t('page.manage.dict.addType') }}</ElButton>
        </div>
        <ElTable
          v-loading="loading"
          :data="dictTypeList"
          border
          stripe
          style="width: 100%"
          highlight-current-row
          @row-click="handleSelectType"
        >
          <ElTableColumn prop="name" :label="$t('page.manage.dict.name')" min-width="140" align="left" />
          <ElTableColumn prop="code" :label="$t('page.manage.dict.code')" min-width="150" align="left" />
          <ElTableColumn prop="status" :label="$t('common.status')" min-width="80" align="center">
            <template #default="{ row }">
              <ElTag :type="row.status === '1' || row.status === 1 ? 'success' : 'danger'">
                {{
                  row.status === '1' || row.status === 1
                    ? $t('page.manage.common.status.enable')
                    : $t('page.manage.common.status.disable')
                }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="createdAt" :label="$t('common.createTime')" min-width="160" align="left" />
          <ElTableColumn :label="$t('common.action')" min-width="140" fixed="right">
            <template #default="{ row }">
              <ElButton type="primary" link size="small" @click.stop="handleTypeEdit(row)">
                {{ $t('common.edit') }}
              </ElButton>
              <ElButton type="danger" link size="small" @click.stop="handleTypeDelete(row)">
                {{ $t('common.delete') }}
              </ElButton>
            </template>
          </ElTableColumn>
        </ElTable>
        <div class="mt-4 flex justify-end">
          <ElPagination
            v-model:current-page="typeQuery.current"
            v-model:page-size="typeQuery.size"
            :page-sizes="[5, 10, 20]"
            :total="dictTypeTotal"
            layout="total, sizes, prev, pager, next, jumper"
            small
            @current-change="handleTypePageChange"
            @size-change="handleTypeSizeChange"
          />
        </div>
      </ElCard>
    </div>
    <div class="flex-panel">
      <ElCard>
        <div class="mb-4 flex flex-wrap items-center gap-4">
          <ElButton type="primary" :disabled="!selectedType" @click="handleDataAdd">
            {{ $t('page.manage.dict.addData') }}
          </ElButton>
        </div>
        <ElTable v-loading="dataLoading" :data="dictDataList" border stripe style="width: 100%">
          <ElTableColumn prop="label" :label="$t('page.manage.dict.label')" min-width="140" align="left" />
          <ElTableColumn prop="value" :label="$t('page.manage.dict.value')" min-width="150" align="left" />
          <ElTableColumn prop="sort" :label="$t('page.manage.dict.sort')" min-width="60" align="center" />
          <ElTableColumn prop="status" :label="$t('common.status')" min-width="80" align="center">
            <template #default="{ row }">
              <ElTag :type="row.status === '1' || row.status === 1 ? 'success' : 'danger'">
                {{
                  row.status === '1' || row.status === 1
                    ? $t('page.manage.common.status.enable')
                    : $t('page.manage.common.status.disable')
                }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="createdAt" :label="$t('common.createTime')" min-width="150" align="left" />
          <ElTableColumn :label="$t('common.action')" min-width="140" fixed="right">
            <template #default="{ row }">
              <ElButton type="primary" link size="small" @click="handleDataEdit(row)">{{ $t('common.edit') }}</ElButton>
              <ElButton type="danger" link size="small" @click="handleDataDelete(row)">
                {{ $t('common.delete') }}
              </ElButton>
            </template>
          </ElTableColumn>
        </ElTable>
        <div class="mt-4 flex justify-end">
          <ElPagination
            v-model:current-page="dataQuery.current"
            v-model:page-size="dataQuery.size"
            :page-sizes="[5, 10, 20]"
            :total="dictDataTotal"
            layout="total, sizes, prev, pager, next, jumper"
            small
            @current-change="handleDataPageChange"
            @size-change="handleDataSizeChange"
          />
        </div>
      </ElCard>
    </div>
    <ElDialog v-model="typeDialogVisible" :title="typeDialogTitle" width="500px">
      <ElForm ref="typeFormRef" :model="typeForm" label-width="100px">
        <ElFormItem
          :label="$t('page.manage.dict.name')"
          prop="name"
          :rules="[{ required: true, message: $t('page.manage.dict.form.name') }]"
        >
          <ElInput v-model="typeForm.name" :placeholder="$t('page.manage.dict.form.name')" />
        </ElFormItem>
        <ElFormItem
          :label="$t('page.manage.dict.code')"
          prop="code"
          :rules="[{ required: true, message: $t('page.manage.dict.form.code') }]"
        >
          <ElInput v-model="typeForm.code" :placeholder="$t('page.manage.dict.form.code')" />
        </ElFormItem>
        <ElFormItem :label="$t('common.status')" prop="status">
          <ElSwitch v-model="typeForm.status" active-value="1" inactive-value="0" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="typeDialogVisible = false">{{ $t('common.cancel') }}</ElButton>
        <ElButton type="primary" @click="handleTypeSubmit">{{ $t('common.confirm') }}</ElButton>
      </template>
    </ElDialog>
    <ElDialog v-model="dataDialogVisible" :title="dataDialogTitle" width="500px">
      <ElForm ref="dataFormRef" :model="dataForm" label-width="100px">
        <ElFormItem
          :label="$t('page.manage.dict.label')"
          prop="label"
          :rules="[{ required: true, message: $t('page.manage.dict.form.label') }]"
        >
          <ElInput v-model="dataForm.label" :placeholder="$t('page.manage.dict.form.label')" />
        </ElFormItem>
        <ElFormItem
          :label="$t('page.manage.dict.value')"
          prop="value"
          :rules="[{ required: true, message: $t('page.manage.dict.form.value') }]"
        >
          <ElInput v-model="dataForm.value" :placeholder="$t('page.manage.dict.form.value')" />
        </ElFormItem>
        <ElFormItem :label="$t('page.manage.dict.sort')" prop="sort">
          <ElInputNumber v-model="dataForm.sort" :min="1" style="width: 100%" />
        </ElFormItem>
        <ElFormItem :label="$t('common.status')" prop="status">
          <ElSwitch v-model="dataForm.status" active-value="1" inactive-value="0" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dataDialogVisible = false">{{ $t('common.cancel') }}</ElButton>
        <ElButton type="primary" @click="handleDataSubmit">{{ $t('common.confirm') }}</ElButton>
      </template>
    </ElDialog>
  </div>
</template>
