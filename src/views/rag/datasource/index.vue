<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  fetchCreateDatasource,
  fetchCreateSchema,
  fetchDatasources,
  fetchDeleteDatasource,
  fetchDeleteSchema,
  fetchRagAclOptions,
  fetchSchemas,
  fetchTestConnection,
  fetchTestSchema,
  fetchUpdateDatasource,
  fetchUpdateSchema
} from '@/service/api/rag';
import { useAppStore } from '@/store/modules/app';
import { $t } from '@/locales';
import ConfigHelp from '../shared/config-help.vue';
import ConfigCodeEditor from '../shared/config-code-editor.vue';
import { visibilityLabel } from '../shared/display';

defineOptions({ name: 'RagDatasource' });
const t = $t;
const appStore = useAppStore();
const list = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const size = ref(20);
const loading = ref(false);
const keyword = ref('');
const dialogVisible = ref(false);
const form = ref<any>({});
const isEdit = ref(false);
const saving = ref(false);
const schemaVisible = ref(false);
const schemaDialogVisible = ref(false);
const schemas = ref<any[]>([]);
const schemaForm = ref<any>({});
const schemaDatasource = ref<any>(null);
const schemaEdit = ref(false);
const schemaSaving = ref(false);
const schemaTestDialogVisible = ref(false);
const schemaTestTarget = ref<any>(null);
const schemaTestQuery = ref('');
const schemaTestResult = ref<any>(null);
const schemaTestLoading = ref(false);
const aclOptions = ref<any>({ departments: [], posts: [], users: [] });
const schemaAllowedFunctions = ref<string[]>([]);
const commonSqlFunctions = [
  { value: 'COUNT', zhName: '计数' },
  { value: 'SUM', zhName: '求和' },
  { value: 'AVG', zhName: '平均值' },
  { value: 'MIN', zhName: '最小值' },
  { value: 'MAX', zhName: '最大值' },
  { value: 'ROUND', zhName: '四舍五入' },
  { value: 'COALESCE', zhName: '取首个非空值' },
  { value: 'NULLIF', zhName: '相等置空' },
  { value: 'DATE_FORMAT', zhName: '日期格式化' },
  { value: 'DATE_TRUNC', zhName: '日期截断' },
  { value: 'YEAR', zhName: '年份' },
  { value: 'MONTH', zhName: '月份' },
  { value: 'DAY', zhName: '日期' },
  { value: 'CONCAT', zhName: '字符串拼接' },
  { value: 'LOWER', zhName: '转为小写' },
  { value: 'UPPER', zhName: '转为大写' }
];
const sqlFunctionOptions = computed(() =>
  commonSqlFunctions.map(item => ({
    value: item.value,
    label: appStore.locale === 'zh-CN' ? `${item.value}（${item.zhName}）` : item.value
  }))
);
const schemaHelpExamples = {
  columns: JSON.stringify(
    [
      { name: 'order_no', type: 'VARCHAR(32)', description: '业务订单号，唯一标识一笔订单' },
      { name: 'status', type: 'VARCHAR(20)', description: '订单状态：paid=已付款，shipped=已发货，completed=已完成' },
      { name: 'paid_amount', type: 'DECIMAL(12,2)', description: '实付金额，单位元，可求和或取平均值' },
      { name: 'paid_at', type: 'DATETIME', description: '付款时间，Asia/Shanghai 时区，用于按日或按月统计' },
      { name: 'customer_name_masked', type: 'VARCHAR(64)', description: '脱敏后的顾客姓名，仅用于结果展示' }
    ],
    null,
    2
  ),
  fewShot: JSON.stringify(
    [
      {
        question: '查询已付款且实付金额大于 1000 元的订单',
        sql: "SELECT order_no, paid_amount FROM v_after_sales_order WHERE status = 'paid' AND paid_amount > 1000 ORDER BY paid_amount DESC LIMIT 20"
      },
      {
        question: '统计各订单状态的订单数',
        sql: 'SELECT status, COUNT(*) AS order_count FROM v_after_sales_order GROUP BY status ORDER BY order_count DESC'
      }
    ],
    null,
    2
  ),
  functions: '["COUNT", "SUM", "AVG", "ROUND"]',
  sensitive: '["customer_phone", "id_card_number", "bank_card_no"]'
};
const columnsMetaParameters = computed(() => [
  { name: '[]', description: t('rag.configHelp.schema.columnsFields.root'), example: '[{...}, {...}]', required: true },
  { name: 'name', description: t('rag.configHelp.schema.columnsFields.name'), example: 'paid_amount', required: true },
  { name: 'type', description: t('rag.configHelp.schema.columnsFields.type'), example: 'DECIMAL(12,2)' },
  { name: 'description', description: t('rag.configHelp.schema.columnsFields.description'), example: t('rag.configHelp.schema.columnsFields.descriptionExample') }
]);
const fewShotParameters = computed(() => [
  { name: '[]', description: t('rag.configHelp.schema.fewShotFields.root'), example: '[{...}, {...}]', required: true },
  { name: 'question', description: t('rag.configHelp.schema.fewShotFields.question'), example: t('rag.configHelp.schema.fewShotFields.questionExample'), required: true },
  { name: 'sql', description: t('rag.configHelp.schema.fewShotFields.sql'), example: 'SELECT status, COUNT(*) AS order_count ...', required: true }
]);
const datasourceParameters = computed(() => [
  {
    name: t('rag.datasource.name'),
    description: t('rag.configFields.datasource.fields.name'),
    example: t('rag.configFields.datasource.fieldExamples.name'),
    required: true
  },
  {
    name: t('rag.datasource.code'),
    description: t('rag.configFields.datasource.fields.code'),
    example: 'business_readonly',
    required: true
  },
  {
    name: t('rag.datasource.dbType'),
    description: t('rag.configFields.datasource.dbTypeDescription'),
    example: 'mysql',
    required: true
  },
  {
    name: t('rag.datasource.jdbcUrl'),
    description: t('rag.configFields.datasource.fields.jdbcUrl'),
    example: 'jdbc:mysql://db.internal:3306/business',
    required: true
  },
  {
    name: t('rag.datasource.username'),
    description: t('rag.configFields.datasource.fields.username'),
    example: 'agent_readonly',
    required: true
  },
  {
    name: t('rag.datasource.password'),
    description: t('rag.configFields.datasource.fields.password'),
    example: t('rag.configFields.datasource.fieldExamples.password'),
    required: true
  },
  {
    name: t('rag.datasource.maxConnections'),
    description: t('rag.configFields.datasource.fields.maxConnections'),
    example: '10',
    required: true
  },
  {
    name: t('rag.datasource.queryTimeout'),
    description: t('rag.configFields.datasource.fields.queryTimeout'),
    example: '30',
    required: true
  },
  {
    name: t('rag.common.status'),
    description: t('rag.configFields.datasource.fields.status'),
    example: t('common.on'),
    required: true
  }
]);
const schemaParameters = computed(() => [
  {
    name: t('rag.datasource.domainCode'),
    description: t('rag.configFields.schema.fields.domainCode'),
    example: 'order_summary',
    required: true
  },
  {
    name: t('rag.datasource.domainName'),
    description: t('rag.configFields.schema.fields.domainName'),
    example: t('rag.configFields.schema.fieldExamples.domainName'),
    required: true
  },
  {
    name: t('rag.datasource.viewName'),
    description: t('rag.configFields.schema.fields.viewName'),
    example: 'reporting.v_order_summary',
    required: true
  },
  {
    name: t('rag.tool.description'),
    description: t('rag.configFields.schema.fields.description'),
    example: t('rag.configFields.schema.fieldExamples.description')
  },
  {
    name: t('rag.datasource.columnsMeta'),
    description: t('rag.configFields.schema.fields.columnsMeta'),
    example: schemaHelpExamples.columns
  },
  {
    name: t('rag.datasource.fewShotExamples'),
    description: t('rag.configFields.schema.fields.fewShotExamples'),
    example: schemaHelpExamples.fewShot
  },
  {
    name: t('rag.datasource.allowedFunctions'),
    description: t('rag.configFields.schema.fields.allowedFunctions'),
    example: schemaHelpExamples.functions
  },
  {
    name: t('rag.datasource.sensitiveColumns'),
    description: t('rag.configFields.schema.fields.sensitiveColumns'),
    example: schemaHelpExamples.sensitive
  },
  {
    name: t('rag.tool.visibility'),
    description: t('rag.configFields.schema.fields.visibility'),
    example: 'department',
    required: true
  },
  {
    name: t('rag.configFields.schema.fieldExamples.aclSubjectName'),
    description: t('rag.configFields.schema.fields.aclSubjects'),
    example: t('rag.configFields.schema.fieldExamples.aclSubjects')
  },
  {
    name: t('rag.common.status'),
    description: t('rag.configFields.schema.fields.status'),
    example: t('common.on'),
    required: true
  }
]);

onMounted(() => loadData());
async function loadData() {
  loading.value = true;
  try {
    const res = await fetchDatasources({
      page: page.value,
      size: size.value,
      keyword: keyword.value || undefined
    });
    list.value = res.data?.records || [];
    total.value = res.data?.total || 0;
  } finally {
    loading.value = false;
  }
}
function openCreate() {
  isEdit.value = false;
  form.value = {
    dbType: 'mysql',
    maxConnections: 10,
    queryTimeout: 30,
    status: 1
  };
  dialogVisible.value = true;
}
function openEdit(row: any) {
  isEdit.value = true;
  form.value = { ...row, password: '' };
  dialogVisible.value = true;
}
async function save() {
  if (
    !form.value.name?.trim() ||
    !form.value.code?.trim() ||
    !form.value.dbType ||
    !form.value.jdbcUrl?.trim() ||
    !form.value.username?.trim()
  ) {
    ElMessage.warning(t('rag.datasource.requiredFields'));
    return;
  }
  saving.value = true;
  try {
    const payload = { ...form.value };
    if (isEdit.value && !payload.password) delete payload.password;
    if (isEdit.value) await fetchUpdateDatasource(payload.id, payload);
    else await fetchCreateDatasource(payload);
    ElMessage.success(t(isEdit.value ? 'common.updateSuccess' : 'common.addSuccess'));
    dialogVisible.value = false;
    await loadData();
  } finally {
    saving.value = false;
  }
}
async function deleteItem(row: any) {
  await ElMessageBox.confirm(t('rag.datasource.deleteConfirm'), t('common.tip'), { type: 'warning' });
  await fetchDeleteDatasource(row.id);
  ElMessage.success(t('common.deleteSuccess'));
  await loadData();
}
async function testConnection(row: any) {
  const res = await fetchTestConnection(row.id);
  ElMessage.info(res.data || '');
}
function parseIds(value?: string) {
  try {
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}
function parseStringArray(value?: string) {
  try {
    const parsed = value ? JSON.parse(value) : [];
    return Array.isArray(parsed)
      ? parsed.filter(item => typeof item === 'string' && item.trim()).map(item => item.trim())
      : [];
  } catch {
    return [];
  }
}
async function manageSchemas(row: any) {
  schemaDatasource.value = row;
  schemaVisible.value = true;
  const [schemaRes, aclRes] = await Promise.all([fetchSchemas(row.id), fetchRagAclOptions()]);
  schemas.value = schemaRes.data || [];
  aclOptions.value = aclRes.data || aclOptions.value;
}
function openSchemaCreate() {
  schemaEdit.value = false;
  schemaForm.value = {
    visibility: 'public',
    allowedDepartmentIds: [],
    allowedPostIds: [],
    allowedUserIds: [],
    columnsMeta: '[]',
    fewShotExamples: '[]',
    allowedFunctions: '[]',
    sensitiveColumns: '[]',
    status: 1
  };
  schemaAllowedFunctions.value = [];
  schemaDialogVisible.value = true;
}
function openSchemaEdit(row: any) {
  schemaEdit.value = true;
  schemaForm.value = {
    ...row,
    allowedDepartmentIds: parseIds(row.allowedDepartmentIds),
    allowedPostIds: parseIds(row.allowedPostIds),
    allowedUserIds: parseIds(row.allowedUserIds)
  };
  schemaAllowedFunctions.value = parseStringArray(row.allowedFunctions);
  schemaDialogVisible.value = true;
}
async function saveSchema() {
  if (
    !schemaForm.value.domainCode?.trim() ||
    !schemaForm.value.domainName?.trim() ||
    !schemaForm.value.viewName?.trim()
  ) {
    ElMessage.warning(t('rag.datasource.schemaRequiredFields'));
    return;
  }
  schemaForm.value.allowedFunctions = JSON.stringify([
    ...new Set(schemaAllowedFunctions.value.map(item => item.trim().toUpperCase()).filter(Boolean))
  ]);
  for (const [field, value] of [
    [t('rag.datasource.columnsMeta'), schemaForm.value.columnsMeta],
    [t('rag.datasource.fewShotExamples'), schemaForm.value.fewShotExamples],
    [t('rag.datasource.allowedFunctions'), schemaForm.value.allowedFunctions],
    [t('rag.datasource.sensitiveColumns'), schemaForm.value.sensitiveColumns]
  ]) {
    try {
      JSON.parse(value || '[]');
    } catch {
      ElMessage.warning(t('rag.common.invalidJson', { field }));
      return;
    }
  }
  schemaSaving.value = true;
  try {
    const payload = {
      ...schemaForm.value,
      allowedDepartmentIds: JSON.stringify(schemaForm.value.allowedDepartmentIds || []),
      allowedPostIds: JSON.stringify(schemaForm.value.allowedPostIds || []),
      allowedUserIds: JSON.stringify(schemaForm.value.allowedUserIds || [])
    };
    if (schemaEdit.value) await fetchUpdateSchema(payload.id, payload);
    else await fetchCreateSchema(schemaDatasource.value.id, payload);
    ElMessage.success(t(schemaEdit.value ? 'common.updateSuccess' : 'common.addSuccess'));
    schemaDialogVisible.value = false;
    await manageSchemas(schemaDatasource.value);
  } finally {
    schemaSaving.value = false;
  }
}
async function deleteSchema(row: any) {
  await ElMessageBox.confirm(t('rag.datasource.schemaDeleteConfirm'), t('common.tip'), { type: 'warning' });
  await fetchDeleteSchema(row.id);
  await manageSchemas(schemaDatasource.value);
}
function resetSearch() {
  keyword.value = '';
  page.value = 1;
  loadData();
}

function openSchemaTest(row: any) {
  schemaTestTarget.value = row;
  schemaTestQuery.value = defaultSchemaQuestion(row);
  schemaTestResult.value = null;
  schemaTestDialogVisible.value = true;
}

function defaultSchemaQuestion(row: any) {
  try {
    const examples = JSON.parse(row.fewShotExamples || '[]');
    if (Array.isArray(examples) && examples[0]?.question) return examples[0].question;
  } catch {
    // Ignore malformed examples and let the user type a question.
  }
  return t('rag.datasource.defaultTestQuestion', {
    name: row.domainName || row.viewName || t('rag.datasource.defaultDomainName')
  });
}

async function runSchemaTest() {
  if (!schemaTestTarget.value?.id) return;
  if (!schemaTestQuery.value.trim()) {
    ElMessage.warning(t('rag.datasource.testQuestionRequired'));
    return;
  }
  schemaTestLoading.value = true;
  try {
    const res = await fetchTestSchema(schemaTestTarget.value.id, { query: schemaTestQuery.value.trim() });
    schemaTestResult.value = res.data;
  } finally {
    schemaTestLoading.value = false;
  }
}

function previewRows(rows: any[]) {
  return Array.isArray(rows) ? rows.slice(0, 20) : [];
}
</script>

<template>
  <div class="page-container h-full">
    <ElCard class="w-full">
      <ElAlert class="mb-4" type="info" :closable="false" show-icon :title="t('rag.datasource.pageGuide')" />
      <div class="mb-4 flex flex-wrap items-center gap-4">
        <ElInput
          v-model="keyword"
          :placeholder="t('rag.common.keywordPlaceholder')"
          clearable
          class="w-50"
          @keyup.enter="loadData"
        />
        <ElButton type="primary" @click="loadData">{{ t('rag.common.search') }}</ElButton>
        <ElButton @click="resetSearch">{{ t('common.reset') }}</ElButton>
      </div>
      <div class="mb-4 flex flex-wrap items-center gap-4">
        <ElButton type="primary" @click="openCreate">+ {{ t('rag.common.create') }}</ElButton>
      </div>
      <ElTable
        v-loading="loading"
        :data="list"
        stripe
        border
        class="w-full"
        :empty-text="t('rag.datasource.emptyHint')"
      >
        <ElTableColumn prop="name" :label="t('rag.datasource.name')" min-width="150" />
        <ElTableColumn prop="code" :label="t('rag.datasource.code')" min-width="150" />
        <ElTableColumn prop="dbType" :label="t('rag.datasource.dbType')" width="90" />
        <ElTableColumn prop="jdbcUrl" :label="t('rag.datasource.jdbcUrl')" min-width="250" show-overflow-tooltip />
        <ElTableColumn :label="t('rag.common.status')" width="80">
          <template #default="{ row }">
            <ElTag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? t('common.on') : t('common.off') }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn :label="t('rag.common.action')" width="240" fixed="right" align="center">
          <template #default="{ row }">
            <ElButton size="small" text @click="testConnection(row)">{{ t('rag.datasource.testConn') }}</ElButton>
            <ElButton size="small" text type="primary" @click="manageSchemas(row)">
              {{ t('rag.datasource.schemas') }}
            </ElButton>
            <ElButton size="small" text @click="openEdit(row)">{{ t('rag.common.edit') }}</ElButton>
            <ElButton size="small" text type="danger" @click="deleteItem(row)">{{ t('rag.common.delete') }}</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
      <div class="mt-4 flex justify-end">
        <ElPagination
          v-model:current-page="page"
          v-model:page-size="size"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="loadData"
          @size-change="
            () => {
              page = 1;
              loadData();
            }
          "
        />
      </div>
    </ElCard>
    <ElDialog v-model="dialogVisible" width="min(520px, 95vw)" class="config-editor-dialog" align-center>
      <template #header>
        <div class="flex items-center">
          <span class="text-base font-medium">{{ t(isEdit ? 'common.edit' : 'common.create') }}</span>
          <ConfigHelp
            :title="t('rag.configHelp.datasource.title')"
            :description="t('rag.configHelp.datasource.description')"
            :examples="[t('rag.configHelp.datasource.example')]"
            :parameters="datasourceParameters"
            :steps="[
              t('rag.configHelp.datasource.step1'),
              t('rag.configHelp.datasource.step2'),
              t('rag.configHelp.datasource.step3'),
              t('rag.configHelp.datasource.step4'),
              t('rag.configHelp.datasource.step5')
            ]"
            :rules="[
              t('rag.configHelp.datasource.rule1'),
              t('rag.configHelp.datasource.rule2'),
              t('rag.configHelp.datasource.rule3'),
              t('rag.configHelp.datasource.rule4')
            ]"
            :effects="[t('rag.configHelp.datasource.effect1'), t('rag.configHelp.datasource.effect2')]"
            :notes="[
              t('rag.configHelp.datasource.note1'),
              t('rag.configHelp.datasource.note2'),
              t('rag.configHelp.datasource.note3')
            ]"
          />
        </div>
      </template>
      <ElForm :model="form" label-width="100px">
        <ElFormItem :label="t('rag.datasource.name')">
          <ElInput v-model="form.name" :placeholder="t('rag.datasource.namePlaceholder')" />
        </ElFormItem>
        <ElFormItem :label="t('rag.datasource.code')">
          <ElInput v-model="form.code" :disabled="isEdit" :placeholder="t('rag.datasource.codePlaceholder')" />
        </ElFormItem>
        <ElFormItem :label="t('rag.datasource.dbType')">
          <ElSelect v-model="form.dbType" :placeholder="t('rag.datasource.dbTypePlaceholder')" class="w-full">
            <ElOption v-for="db in ['mysql', 'postgresql', 'oracle', 'sqlserver']" :key="db" :label="db" :value="db" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem :label="t('rag.datasource.jdbcUrl')">
          <template #label>
            <span>{{ t('rag.datasource.jdbcUrl') }}</span>
            <ConfigHelp
              field
              :title="t('rag.configHelp.datasource.jdbcTitle')"
              :description="t('rag.configHelp.datasource.jdbcDescription')"
              :examples="[t('rag.configHelp.datasource.jdbcExample')]"
            />
          </template>
          <ElInput v-model="form.jdbcUrl" :placeholder="t('rag.datasource.jdbcPlaceholder')" />
        </ElFormItem>
        <ElFormItem :label="t('rag.datasource.username')">
          <ElInput v-model="form.username" autocomplete="off" :placeholder="t('rag.datasource.usernamePlaceholder')" />
        </ElFormItem>
        <ElFormItem :label="t('rag.datasource.password')">
          <ElInput
            v-model="form.password"
            type="password"
            autocomplete="new-password"
            show-password
            :placeholder="isEdit ? t('rag.datasource.passwordKeep') : ''"
          />
        </ElFormItem>
        <ElFormItem :label="t('rag.datasource.maxConnections')">
          <ElInputNumber v-model="form.maxConnections" :min="1" :max="100" />
        </ElFormItem>
        <ElFormItem :label="t('rag.datasource.queryTimeout')">
          <ElInputNumber v-model="form.queryTimeout" :min="5" :max="300" />
        </ElFormItem>
        <ElFormItem :label="t('rag.common.status')">
          <ElSwitch v-model="form.status" :active-value="1" :inactive-value="0" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">{{ t('rag.common.cancel') }}</ElButton>
        <ElButton type="primary" :loading="saving" @click="save">{{ t('rag.common.save') }}</ElButton>
      </template>
    </ElDialog>
    <ElDrawer
      v-model="schemaVisible"
      :title="`${schemaDatasource?.name || ''} - ${t('rag.datasource.schemas')}`"
      size="72%"
    >
      <div class="mb-3">
        <ElButton type="primary" @click="openSchemaCreate">+ {{ t('rag.datasource.createSchema') }}</ElButton>
      </div>
      <ElTable :data="schemas" stripe border class="w-full">
        <ElTableColumn prop="domainName" :label="t('rag.datasource.domainName')" min-width="120" />
        <ElTableColumn prop="viewName" :label="t('rag.datasource.viewName')" min-width="160" />
        <ElTableColumn prop="visibility" :label="t('rag.tool.visibility')" width="110">
          <template #default="{ row }">{{ visibilityLabel(row.visibility) }}</template>
        </ElTableColumn>
        <ElTableColumn :label="t('rag.common.status')" width="80">
          <template #default="{ row }">
            <ElTag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? t('common.on') : t('common.off') }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn :label="t('rag.common.action')" width="250" fixed="right" align="center">
          <template #default="{ row }">
            <ElButton link type="primary" @click="openSchemaTest(row)">{{ t('rag.datasource.testSchema') }}</ElButton>
            <ElButton link @click="openSchemaEdit(row)">{{ t('rag.common.edit') }}</ElButton>
            <ElButton link type="danger" @click="deleteSchema(row)">{{ t('rag.common.delete') }}</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElDrawer>
    <ElDialog v-model="schemaDialogVisible" width="min(720px, 95vw)" class="config-editor-dialog" align-center>
      <template #header>
        <div class="flex items-center">
          <span class="text-base font-medium">
            {{ schemaEdit ? t('common.edit') : t('rag.datasource.createSchema') }}
          </span>
          <ConfigHelp
            :title="t('rag.configHelp.schema.title')"
            :description="t('rag.configHelp.schema.description')"
            :examples="[t('rag.configHelp.schema.example')]"
            :parameters="schemaParameters"
            :steps="[
              t('rag.configHelp.schema.step1'),
              t('rag.configHelp.schema.step2'),
              t('rag.configHelp.schema.step3'),
              t('rag.configHelp.schema.step4'),
              t('rag.configHelp.schema.step5'),
              t('rag.configHelp.schema.step6')
            ]"
            :rules="[
              t('rag.configHelp.schema.rule1'),
              t('rag.configHelp.schema.rule2'),
              t('rag.configHelp.schema.rule3'),
              t('rag.configHelp.schema.rule4')
            ]"
            :effects="[t('rag.configHelp.schema.effect1'), t('rag.configHelp.schema.effect2')]"
            :notes="[
              t('rag.configHelp.schema.note1'),
              t('rag.configHelp.schema.note2'),
              t('rag.configHelp.schema.note3')
            ]"
          />
        </div>
      </template>
      <ElForm :model="schemaForm" label-width="130px">
        <div class="grid grid-cols-1 gap-x-3 md:grid-cols-2">
          <ElFormItem :label="t('rag.datasource.domainCode')">
            <ElInput v-model="schemaForm.domainCode" :placeholder="t('rag.datasource.domainCodePlaceholder')" />
          </ElFormItem>
          <ElFormItem :label="t('rag.datasource.domainName')">
            <ElInput v-model="schemaForm.domainName" :placeholder="t('rag.datasource.domainNamePlaceholder')" />
          </ElFormItem>
        </div>
        <ElFormItem :label="t('rag.datasource.viewName')">
          <ElInput v-model="schemaForm.viewName" :placeholder="t('rag.datasource.viewNamePlaceholder')" />
        </ElFormItem>
        <ElFormItem :label="t('rag.tool.description')">
          <template #label>
            <span>{{ t('rag.tool.description') }}</span>
            <ConfigHelp
              field
              :title="t('rag.configHelp.schema.descriptionTitle')"
              :description="t('rag.configFields.schema.fields.description')"
              :examples="[t('rag.configFields.schema.fieldExamples.description')]"
              :rules="[t('rag.configHelp.schema.descriptionRule1'), t('rag.configHelp.schema.descriptionRule2')]"
            />
          </template>
          <ElInput
            v-model="schemaForm.description"
            type="textarea"
            :rows="2"
            :placeholder="t('rag.datasource.descriptionPlaceholder')"
          />
        </ElFormItem>
        <ElFormItem :label="t('rag.datasource.columnsMeta')">
          <template #label>
            <span>{{ t('rag.datasource.columnsMeta') }}</span>
            <ConfigHelp
              field
              :title="t('rag.configHelp.schema.columnsTitle')"
              :description="t('rag.configHelp.schema.columnsDescription')"
              :parameters="columnsMetaParameters"
              :examples="[schemaHelpExamples.columns]"
              :rules="[
                t('rag.configHelp.schema.columnsRule1'),
                t('rag.configHelp.schema.columnsRule2'),
                t('rag.configHelp.schema.jsonRule')
              ]"
            />
          </template>
          <ConfigCodeEditor
            v-model="schemaForm.columnsMeta"
            :rows="4"
            expected-root="array"
            :example="schemaHelpExamples.columns"
          />
        </ElFormItem>
        <ElFormItem :label="t('rag.datasource.fewShotExamples')">
          <template #label>
            <span>{{ t('rag.datasource.fewShotExamples') }}</span>
            <ConfigHelp
              field
              :title="t('rag.configHelp.schema.fewShotTitle')"
              :description="t('rag.configHelp.schema.fewShotDescription')"
              :parameters="fewShotParameters"
              :examples="[schemaHelpExamples.fewShot]"
              :rules="[
                t('rag.configHelp.schema.fewShotRule1'),
                t('rag.configHelp.schema.fewShotRule2'),
                t('rag.configHelp.schema.jsonRule')
              ]"
            />
          </template>
          <ConfigCodeEditor
            v-model="schemaForm.fewShotExamples"
            :rows="3"
            expected-root="array"
            :example="schemaHelpExamples.fewShot"
          />
        </ElFormItem>
        <ElFormItem :label="t('rag.datasource.allowedFunctions')">
          <template #label>
            <span>{{ t('rag.datasource.allowedFunctions') }}</span>
            <ConfigHelp
              field
              :title="t('rag.configHelp.schema.functionsTitle')"
              :description="t('rag.configHelp.schema.functionsDescription')"
              :examples="[schemaHelpExamples.functions]"
              :rules="[t('rag.configHelp.schema.functionsRule1'), t('rag.configHelp.schema.functionsRule2')]"
            />
          </template>
          <ElSelect
            v-model="schemaAllowedFunctions"
            multiple
            filterable
            allow-create
            default-first-option
            class="w-full"
            :placeholder="t('rag.datasource.allowedFunctionsPlaceholder')"
          >
            <ElOption v-for="item in sqlFunctionOptions" :key="item.value" :label="item.label" :value="item.value" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem :label="t('rag.datasource.sensitiveColumns')">
          <template #label>
            <span>{{ t('rag.datasource.sensitiveColumns') }}</span>
            <ConfigHelp
              field
              :title="t('rag.configHelp.schema.sensitiveTitle')"
              :description="t('rag.configHelp.schema.sensitiveDescription')"
              :examples="[schemaHelpExamples.sensitive]"
              :rules="[
                t('rag.configHelp.schema.sensitiveRule1'),
                t('rag.configHelp.schema.sensitiveRule2'),
                t('rag.configHelp.schema.jsonRule')
              ]"
            />
          </template>
          <ConfigCodeEditor
            v-model="schemaForm.sensitiveColumns"
            :rows="2"
            expected-root="array"
            :example="schemaHelpExamples.sensitive"
          />
        </ElFormItem>
        <ElFormItem :label="t('rag.tool.visibility')">
          <template #label>
            <span>{{ t('rag.tool.visibility') }}</span>
            <ConfigHelp
              field
              :title="t('rag.configHelp.schema.visibilityTitle')"
              :description="t('rag.configHelp.schema.visibilityDescription')"
            />
          </template>
          <ElSelect v-model="schemaForm.visibility" class="w-full">
            <ElOption
              v-for="item in ['public', 'department', 'post', 'user']"
              :key="item"
              :value="item"
              :label="visibilityLabel(item)"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem v-if="schemaForm.visibility === 'department'" :label="t('rag.tool.department')">
          <ElSelect v-model="schemaForm.allowedDepartmentIds" multiple filterable class="w-full">
            <ElOption v-for="item in aclOptions.departments" :key="item.id" :label="item.name" :value="item.id" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem v-if="schemaForm.visibility === 'post'" :label="t('rag.tool.post')">
          <ElSelect v-model="schemaForm.allowedPostIds" multiple filterable class="w-full">
            <ElOption v-for="item in aclOptions.posts" :key="item.id" :label="item.name" :value="item.id" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem v-if="schemaForm.visibility === 'user'" :label="t('rag.tool.user')">
          <ElSelect v-model="schemaForm.allowedUserIds" multiple filterable class="w-full">
            <ElOption v-for="item in aclOptions.users" :key="item.id" :label="item.name" :value="item.id" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem :label="t('rag.common.status')">
          <ElSwitch v-model="schemaForm.status" :active-value="1" :inactive-value="0" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="schemaDialogVisible = false">{{ t('rag.common.cancel') }}</ElButton>
        <ElButton type="primary" :loading="schemaSaving" @click="saveSchema">{{ t('rag.common.save') }}</ElButton>
      </template>
    </ElDialog>

    <ElDialog
      v-model="schemaTestDialogVisible"
      :title="t('rag.datasource.schemaTestTitle')"
      width="min(900px, 95vw)"
      align-center
    >
      <ElAlert class="mb-4" type="warning" :closable="false" show-icon :title="t('rag.datasource.schemaTestWarning')" />
      <ElForm label-width="100px">
        <ElFormItem :label="t('rag.datasource.testSchema')">
          <ElTag>{{ schemaTestTarget?.domainName }} ({{ schemaTestTarget?.viewName }})</ElTag>
        </ElFormItem>
        <ElFormItem :label="t('rag.datasource.testQuestion')">
          <ElInput
            v-model="schemaTestQuery"
            type="textarea"
            :rows="3"
            :placeholder="t('rag.datasource.testQuestionPlaceholder')"
          />
        </ElFormItem>
      </ElForm>
      <div v-if="schemaTestResult" class="space-y-3">
        <ElAlert
          :type="schemaTestResult.success ? 'success' : 'warning'"
          :closable="false"
          :title="
            schemaTestResult.success
              ? t('rag.datasource.querySuccess', { count: schemaTestResult.rowCount || 0 })
              : t('rag.datasource.queryFailed')
          "
        />
        <div>
          <div class="mb-1 text-sm text-gray-500">{{ t('rag.datasource.generatedSql') }}</div>
          <pre class="overflow-auto rounded bg-gray-50 p-3 text-xs">{{ schemaTestResult.sql || '-' }}</pre>
        </div>
        <ElTable
          v-if="previewRows(schemaTestResult.rows).length"
          :data="previewRows(schemaTestResult.rows)"
          border
          stripe
          max-height="320"
        >
          <ElTableColumn
            v-for="key in Object.keys(previewRows(schemaTestResult.rows)[0] || {})"
            :key="key"
            :prop="key"
            :label="key"
            min-width="120"
            show-overflow-tooltip
          />
        </ElTable>
        <div v-if="schemaTestResult.errorMessage" class="text-sm text-red-500">
          {{ schemaTestResult.errorMessage }}
        </div>
      </div>
      <template #footer>
        <ElButton @click="schemaTestDialogVisible = false">{{ t('rag.datasource.close') }}</ElButton>
        <ElButton type="primary" :loading="schemaTestLoading" @click="runSchemaTest">
          {{ t('rag.datasource.startTest') }}
        </ElButton>
      </template>
    </ElDialog>
  </div>
</template>
