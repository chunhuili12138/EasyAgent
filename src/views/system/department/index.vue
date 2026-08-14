<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  fetchCreateDepartment,
  fetchDeleteDepartment,
  fetchGetDepartmentTree,
  fetchUpdateDepartment
} from '@/service/api/system-manage';
import { $t } from '@/locales';

defineOptions({ name: 'SystemDepartment' });

const loading = ref(false);
const treeData = ref<any[]>([]);
const dialogVisible = ref(false);
const dialogTitle = ref('');
const formRef = ref();
const formData = ref<any>({ parentId: 0, name: '', leader: '', phone: '', sort: 1, status: '1' });
const editingId = ref<number | null>(null);
const isCreate = ref(true);

async function getTree() {
  loading.value = true;
  try {
    const { data, error } = await fetchGetDepartmentTree();
    if (!error) {
      treeData.value = data || [];
    }
  } finally {
    loading.value = false;
  }
}

function handleAdd(parentId?: number) {
  isCreate.value = true;
  dialogTitle.value = $t('page.manage.department.addDepartment');
  editingId.value = null;
  formData.value = {
    parentId: parentId && parentId > 0 ? parentId : null,
    name: '',
    leader: '',
    phone: '',
    sort: 1,
    status: '1'
  };
  dialogVisible.value = true;
}

function handleEdit(row: any) {
  isCreate.value = false;
  dialogTitle.value = $t('page.manage.department.editDepartment');
  editingId.value = row.id;
  formData.value = {
    parentId: row.parentId && row.parentId > 0 ? row.parentId : null,
    name: row.name || '',
    leader: row.leader || '',
    phone: row.phone || '',
    sort: row.sort ?? 1,
    status: String(row.status ?? '1')
  };
  dialogVisible.value = true;
}

async function handleDelete(row: any) {
  if (row.children && row.children.length > 0) {
    ElMessage.warning($t('page.manage.department.deleteChildFirst'));
    return;
  }
  try {
    await ElMessageBox.confirm($t('common.confirmDelete'), $t('common.confirm'), { type: 'warning' });
    await fetchDeleteDepartment(row.id);
    ElMessage.success($t('common.deleteSuccess'));
    getTree();
  } catch {}
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;
  try {
    if (isCreate.value) {
      const { error } = await fetchCreateDepartment(formData.value);
      if (error) throw error;
      ElMessage.success($t('common.addSuccess'));
    } else {
      const { error } = await fetchUpdateDepartment(editingId.value!, formData.value);
      if (error) throw error;
      ElMessage.success($t('common.updateSuccess'));
    }
    dialogVisible.value = false;
    getTree();
  } catch {
    // onError in request interceptor already shows the error message
  }
}

onMounted(getTree);
</script>

<template>
  <div class="page-container h-full">
    <ElCard class="w-full">
      <div class="mb-4 flex flex-wrap items-center gap-4">
        <ElButton type="primary" @click="handleAdd(0)">{{ $t('page.manage.department.addDepartment') }}</ElButton>
      </div>
      <ElTable v-loading="loading" :data="treeData" border stripe row-key="id" default-expand-all style="width: 100%">
        <ElTableColumn prop="name" :label="$t('page.manage.department.name')" min-width="180" align="left" />
        <ElTableColumn prop="leader" :label="$t('page.manage.department.leader')" min-width="120" />
        <ElTableColumn prop="phone" :label="$t('page.manage.department.phone')" min-width="140" />
        <ElTableColumn prop="sort" :label="$t('page.manage.department.sort')" min-width="60" align="center" />
        <ElTableColumn prop="status" :label="$t('common.status')" min-width="100" align="center">
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
        <ElTableColumn prop="tenantName" :label="$t('page.manage.tenant.name')" min-width="120" />
        <ElTableColumn prop="createdAt" :label="$t('common.createTime')" min-width="180" />
        <ElTableColumn :label="$t('common.action')" min-width="180" fixed="right">
          <template #default="{ row }">
            <ElButton type="primary" link size="small" @click="handleAdd(row.id)">
              {{ $t('page.manage.department.addChild') }}
            </ElButton>
            <ElButton type="primary" link size="small" @click="handleEdit(row)">{{ $t('common.edit') }}</ElButton>
            <ElButton type="danger" link size="small" @click="handleDelete(row)">{{ $t('common.delete') }}</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>
    <ElDialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <ElForm ref="formRef" :model="formData" label-width="120px">
        <ElFormItem :label="$t('page.manage.department.parent')" prop="parentId">
          <ElTreeSelect
            v-model="formData.parentId"
            :data="treeData"
            :props="{ label: 'name', value: 'id', children: 'children' } as any"
            :placeholder="$t('page.manage.department.rootParent')"
            clearable
            style="width: 100%"
          />
        </ElFormItem>
        <ElFormItem
          :label="$t('page.manage.department.name')"
          prop="name"
          :rules="[{ required: true, message: $t('page.manage.department.form.name') }]"
        >
          <ElInput v-model="formData.name" :placeholder="$t('page.manage.department.form.name')" />
        </ElFormItem>
        <ElFormItem :label="$t('page.manage.department.leader')" prop="leader">
          <ElInput v-model="formData.leader" :placeholder="$t('page.manage.department.form.leader')" />
        </ElFormItem>
        <ElFormItem :label="$t('page.manage.department.phone')" prop="phone">
          <ElInput v-model="formData.phone" :placeholder="$t('page.manage.department.form.phone')" />
        </ElFormItem>
        <ElFormItem :label="$t('page.manage.department.sort')" prop="sort">
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
