<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { $t } from '@/locales';
import { fetchCreateMenu, fetchDeleteMenu, fetchGetMenuTree, fetchUpdateMenu } from '@/service/api/system-manage';

defineOptions({ name: 'SystemMenu' });

const loading = ref(false);
const treeData = ref<any[]>([]);
const dialogVisible = ref(false);
const dialogTitle = ref('');
const formRef = ref();
const formData = ref<any>({
  parentId: 0,
  menuType: 'menu',
  name: '',
  icon: '',
  path: '',
  component: '',
  permission: '',
  sort: 1,
  visible: '1',
  status: '1'
});
const editingId = ref<number | null>(null);
const isCreate = ref(true);

const menuTypeOptions = [
  { value: 'dir', label: $t('page.manage.menu.type.directory') },
  { value: 'menu', label: $t('page.manage.menu.type.menu') },
  { value: 'button', label: $t('common.config') }
];

async function getTree() {
  loading.value = true;
  try {
    const { data, error } = await fetchGetMenuTree();
    if (!error) {
      treeData.value = data || [];
    }
  } finally {
    loading.value = false;
  }
}

function handleAdd(parentId?: number) {
  isCreate.value = true;
  dialogTitle.value = $t('page.manage.menu.addMenu');
  editingId.value = null;
  formData.value = {
    parentId: parentId || 0,
    menuType: 'menu',
    name: '',
    icon: '',
    path: '',
    component: '',
    permission: '',
    sort: 1,
    visible: '1',
    status: '1'
  };
  dialogVisible.value = true;
}

function handleEdit(row: any) {
  isCreate.value = false;
  dialogTitle.value = $t('page.manage.menu.editMenu');
  editingId.value = row.id;
  formData.value = {
    parentId: row.parentId && row.parentId > 0 ? row.parentId : null,
    menuType: row.menuType || 'menu',
    name: row.name || '',
    icon: row.icon || '',
    path: row.path || '',
    component: row.component || '',
    permission: row.permission || '',
    sort: row.sort ?? 1,
    visible: String(row.visible ?? '1'),
    status: String(row.status ?? '1')
  };
  dialogVisible.value = true;
}

async function handleDelete(row: any) {
  if (row.children && row.children.length > 0) {
    ElMessage.warning($t('page.manage.menu.deleteChildFirst'));
    return;
  }
  try {
    await ElMessageBox.confirm($t('common.confirmDelete'), $t('common.confirm'), { type: 'warning' });
    const { error } = await fetchDeleteMenu(row.id);
    if (error) throw error;
    ElMessage.success($t('common.deleteSuccess'));
    getTree();
  } catch {}
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;
  try {
    if (isCreate.value) {
      const submitData = { ...formData.value, parentId: formData.value.parentId ?? 0 };
      const { error } = await fetchCreateMenu(submitData);
      if (error) throw error;
      ElMessage.success($t('common.addSuccess'));
    } else {
      const submitData = { ...formData.value, parentId: formData.value.parentId ?? 0 };
      const { error } = await fetchUpdateMenu(editingId.value!, submitData);
      if (error) throw error;
      ElMessage.success($t('common.updateSuccess'));
    }
    dialogVisible.value = false;
    getTree();
  } catch {}
}

onMounted(getTree);
</script>

<template>
  <div class="h-full page-container">
    <ElCard class="w-full">
      <div class="mb-4 flex flex-wrap items-center gap-4">
        <ElButton type="primary" @click="handleAdd(0)">{{ $t('page.manage.menu.addMenu') }}</ElButton>
      </div>
      <ElTable v-loading="loading" :data="treeData" border stripe row-key="id" default-expand-all style="width: 100%">
        <ElTableColumn prop="name" :label="$t('page.manage.menu.menuName')" min-width="180" align="left" />
        <ElTableColumn prop="icon" :label="$t('page.manage.menu.icon')" min-width="80" align="center">
          <template #default="{ row }">
            <ElIcon v-if="row.icon">
              <component :is="'icon-' + row.icon" />
            </ElIcon>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="sort" :label="$t('page.manage.menu.order')" min-width="60" align="center" />
        <ElTableColumn prop="permission" :label="$t('page.manage.menu.permission')" min-width="160" align="left" />
        <ElTableColumn prop="component" :label="$t('page.manage.menu.component')" min-width="160" align="left" />
        <ElTableColumn prop="status" :label="$t('page.manage.menu.menuStatus')" min-width="100" align="center">
          <template #default="{ row }">
            <ElTag :type="row.status === '1' || row.status === 1 ? 'success' : 'danger'">
              {{ row.status === '1' || row.status === 1 ? $t('page.manage.common.status.enable') : $t('page.manage.common.status.disable') }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn :label="$t('common.action')" min-width="250" fixed="right">
          <template #default="{ row }">
            <ElButton type="primary" link size="small" @click="handleAdd(row.id)">{{ $t('page.manage.menu.addChild') }}</ElButton>
            <ElButton type="primary" link size="small" @click="handleEdit(row)">{{ $t('common.edit') }}</ElButton>
            <ElButton type="danger" link size="small" @click="handleDelete(row)">{{ $t('common.delete') }}</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>
    <ElDialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <ElForm ref="formRef" :model="formData" label-width="110px">
        <ElFormItem :label="$t('page.manage.menu.menuType')" prop="menuType">
          <ElSelect v-model="formData.menuType" :placeholder="$t('page.manage.menu.form.menuType')" style="width: 100%">
            <ElOption v-for="opt in menuTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem :label="$t('page.manage.menu.parent')" prop="parentId">
          <ElTreeSelect
            v-model="formData.parentId"
            :data="treeData"
            :props="{ label: 'name', value: 'id', children: 'children' } as any"
            :placeholder="$t('page.manage.menu.rootParent')"
            clearable
            style="width: 100%"
          />
        </ElFormItem>
        <ElFormItem :label="$t('page.manage.menu.menuName')" prop="name" :rules="[{ required: true, message: $t('page.manage.menu.form.menuName') }]">
          <ElInput v-model="formData.name" :placeholder="$t('page.manage.menu.form.menuName')" />
        </ElFormItem>
        <ElFormItem :label="$t('page.manage.menu.icon')" prop="icon">
          <ElInput v-model="formData.icon" :placeholder="$t('page.manage.menu.form.icon')" />
        </ElFormItem>
        <ElFormItem :label="$t('page.manage.menu.path')" prop="path">
          <ElInput v-model="formData.path" :placeholder="$t('page.manage.menu.form.path')" />
        </ElFormItem>
        <ElFormItem :label="$t('page.manage.menu.component')" prop="component">
          <ElInput v-model="formData.component" :placeholder="$t('page.manage.menu.form.component')" />
        </ElFormItem>
        <ElFormItem :label="$t('page.manage.menu.permission')" prop="permission">
          <ElInput v-model="formData.permission" :placeholder="$t('page.manage.menu.form.permission')" />
        </ElFormItem>
        <ElFormItem :label="$t('page.manage.menu.order')" prop="sort">
          <ElInputNumber v-model="formData.sort" :min="1" style="width: 100%" />
        </ElFormItem>
        <ElFormItem :label="$t('page.manage.menu.visible')" prop="visible">
          <ElSwitch v-model="formData.visible" active-value="1" inactive-value="0" />
        </ElFormItem>
        <ElFormItem :label="$t('page.manage.menu.menuStatus')" prop="status">
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
