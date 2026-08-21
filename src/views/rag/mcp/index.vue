<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  type McpServer,
  type McpTool,
  type McpEvent,
  fetchCreateMcpServer,
  fetchDeleteMcpServer,
  fetchMcpEventPage,
  fetchMcpHealth,
  fetchMcpServerPage,
  fetchMcpToolPage,
  fetchRefreshMcpServer,
  fetchSetMcpToolEnabled,
  fetchUpdateMcpToolScope,
  fetchUpdateMcpServer,
  fetchValidateMcpServer
} from '@/service/api/rag';
import { $t } from '@/locales';
import { useAuth } from '@/hooks/business/auth';
import { useAuthStore } from '@/store/modules/auth';

defineOptions({ name: 'RagMcp' });
const t = $t;
const { hasAuth } = useAuth();
const authStore = useAuthStore();
const can = (permission: string) => hasAuth(permission) || authStore.userInfo.roles.some(role => ['AGENT_ADMIN', 'SYS_ADMIN'].includes(role));
const servers = ref<McpServer[]>([]);
const tools = ref<McpTool[]>([]);
const selected = ref<McpServer | null>(null);
const loading = ref(false);
const toolsLoading = ref(false);
const serverPage = ref(1);
const serverTotal = ref(0);
const serverKeyword = ref('');
const serverHealth = ref('');
const toolPage = ref(1);
const toolTotal = ref(0);
const toolKeyword = ref('');
const toolEnabled = ref('');
const dialogVisible = ref(false);
const saving = ref(false);
const formStep = ref(1);
const formError = ref('');
const form = ref({
  name: '',
  code: '',
  endpoint: '',
  authType: 'none',
  authHeaderName: 'X-API-Key',
  authConfig: '',
  status: 0
});
const isEdit = ref(false);
const errorText = ref('');
const eventVisible = ref(false);
const events = ref<McpEvent[]>([]);
const eventPage = ref(1);
const eventTotal = ref(0);
const eventType = ref('');
const eventStatus = ref('');
const scopeVisible = ref(false);
const scopeSaving = ref(false);
const scopeTool = ref<McpTool | null>(null);
const scopeForm = ref<{ visibility: string; departmentId?: number; postId?: number; userId?: number }>({ visibility: 'public' });
const schemaVisible = ref(false);
const schemaTool = ref<McpTool | null>(null);

const enabledCount = computed(() => tools.value.filter(tool => tool.enabled === 1).length);

async function loadServers(page = serverPage.value) {
  loading.value = true;
  try {
    serverPage.value = page;
    const response = await fetchMcpServerPage({ page, size: 10, keyword: serverKeyword.value || undefined, healthStatus: serverHealth.value || undefined });
    servers.value = response.data?.records || [];
    serverTotal.value = response.data?.total || 0;
    if (!selected.value || !servers.value.some(server => server.id === selected.value?.id))
      selected.value = servers.value[0] || null;
    if (selected.value) await loadTools(selected.value);
  } catch (error: any) {
    errorText.value = error?.message || t('page.rag_mcp');
  } finally {
    loading.value = false;
  }
}

async function loadTools(server: McpServer) {
  selected.value = server;
  toolPage.value = 1;
  toolsLoading.value = true;
  try {
    const response = await fetchMcpToolPage(server.id, { page: toolPage.value, size: 10, keyword: toolKeyword.value || undefined, enabled: toolEnabled.value === '' ? undefined : Number(toolEnabled.value) });
    tools.value = response.data?.records || [];
    toolTotal.value = response.data?.total || 0;
  } catch (error: any) {
    errorText.value = error?.message || t('page.mcp.error');
  } finally {
    toolsLoading.value = false;
  }
}

async function changeToolPage(page: number) {
  if (!selected.value) return;
  toolPage.value = page;
  await loadToolsPage();
}

async function loadToolsPage() {
  if (!selected.value) return;
  toolsLoading.value = true;
  try {
    const response = await fetchMcpToolPage(selected.value.id, { page: toolPage.value, size: 10, keyword: toolKeyword.value || undefined, enabled: toolEnabled.value === '' ? undefined : Number(toolEnabled.value) });
    tools.value = response.data?.records || [];
    toolTotal.value = response.data?.total || 0;
  } catch (error: any) {
    errorText.value = error?.message || t('page.mcp.error');
  } finally {
    toolsLoading.value = false;
  }
}

function openCreate() {
  isEdit.value = false;
  formStep.value = 1;
  formError.value = '';
  form.value = {
    name: '',
    code: '',
    endpoint: '',
    authType: 'none',
    authHeaderName: 'X-API-Key',
    authConfig: '',
    status: 0
  };
  dialogVisible.value = true;
}

function openEdit(server: McpServer) {
  isEdit.value = true;
  formStep.value = 1;
  formError.value = '';
  form.value = {
    name: server.name,
    code: server.code,
    endpoint: server.endpoint,
    authType: server.authType,
    authHeaderName: 'X-API-Key',
    authConfig: '',
    status: server.status
  };
  dialogVisible.value = true;
}

async function save() {
  if (!validateFormStep(3)) return;
  saving.value = true;
  formError.value = '';
  try {
    const data: Record<string, unknown> = { ...form.value };
    if (!data.authConfig) delete data.authConfig;
    if (isEdit.value && selected.value) await fetchUpdateMcpServer(selected.value.id, data);
    else await fetchCreateMcpServer(data);
    dialogVisible.value = false;
    ElMessage.success(t('page.rag_mcp'));
    await loadServers();
  } catch (error: any) {
    formError.value = error?.message || t('page.mcp.saveFailed');
  } finally {
    saving.value = false;
  }
}

function validateFormStep(step: number) {
  formError.value = '';
  if (step >= 1 && (!form.value.name.trim() || !form.value.code.trim() || !form.value.endpoint.trim())) {
    formError.value = t('page.mcp.basicRequired');
    return false;
  }
  if (step >= 2 && !/^https:\/\/[^\s/?#]+(?:\/[^\s?#]*)?$/.test(form.value.endpoint.trim())) {
    formError.value = t('page.mcp.endpointInvalid');
    return false;
  }
  const keepingExistingCredential = isEdit.value && selected.value?.credentialConfigured && !form.value.authConfig.trim();
  if (step >= 2 && form.value.authType !== 'none' && !form.value.authConfig.trim() && !keepingExistingCredential) {
    formError.value = t('page.mcp.credentialRequired');
    return false;
  }
  return true;
}

function nextFormStep() {
  if (validateFormStep(formStep.value)) formStep.value = Math.min(formStep.value + 1, 3);
}

function previousFormStep() {
  formError.value = '';
  formStep.value = Math.max(formStep.value - 1, 1);
}

function openSchema(tool: McpTool) {
  schemaTool.value = tool;
  schemaVisible.value = true;
}

function authLabel(authType: string) {
  if (authType === 'api_key') return t('page.mcp.apiKey');
  if (authType === 'bearer') return t('page.mcp.bearer');
  return t('page.mcp.none');
}

async function validate(server: McpServer) {
  try {
    await fetchValidateMcpServer(server.id);
    ElMessage.success(t('page.rag_mcp'));
    await loadServers();
  } catch (error: any) {
    ElMessage.error(error?.message || 'MCP validation failed');
    await loadServers();
  }
}

async function refreshSelected() {
  if (!selected.value) return;
  loading.value = true;
  try {
    await fetchRefreshMcpServer(selected.value.id);
    ElMessage.success(t('page.rag_mcp'));
    await loadServers();
  } catch (error: any) {
    ElMessage.error(error?.message || t('page.mcp.error'));
    await loadServers();
  } finally {
    loading.value = false;
  }
}

async function showHealth(server: McpServer) {
  try {
    const response = await fetchMcpHealth(server.id);
    Object.assign(server, response.data || {});
    if (selected.value?.id === server.id) selected.value = { ...server };
  } catch (error: any) {
    ElMessage.error(error?.message || t('page.mcp.healthFailed'));
  }
}

async function remove(server: McpServer) {
  await ElMessageBox.confirm(`${server.name}`, t('page.rag_mcp'), { type: 'warning' });
  await fetchDeleteMcpServer(server.id);
  if (selected.value?.id === server.id) selected.value = null;
  await loadServers();
}

async function toggle(tool: McpTool) {
  try {
    await fetchSetMcpToolEnabled(tool.id, tool.enabled !== 1);
    tool.enabled = tool.enabled === 1 ? 0 : 1;
  } catch (error: any) {
    ElMessage.error(error?.message || t('page.mcp.error'));
  }
}

function openScope(tool: McpTool) {
  scopeTool.value = tool;
  scopeForm.value = { visibility: tool.visibility || 'public', departmentId: tool.departmentId, postId: tool.postId, userId: tool.userId };
  scopeVisible.value = true;
}

async function saveScope() {
  if (!scopeTool.value) return;
  scopeSaving.value = true;
  try {
    await fetchUpdateMcpToolScope(scopeTool.value.id, scopeForm.value);
    scopeVisible.value = false;
    await loadToolsPage();
    ElMessage.success(t('page.mcp.scopeSaved'));
  } catch (error: any) {
    ElMessage.error(error?.message || t('page.mcp.error'));
  } finally {
    scopeSaving.value = false;
  }
}

async function openEvents(page = 1) {
  eventVisible.value = true;
  eventPage.value = page;
  try {
    const response = await fetchMcpEventPage({ page, size: 15, eventType: eventType.value || undefined, status: eventStatus.value || undefined });
    events.value = response.data?.records || [];
    eventTotal.value = response.data?.total || 0;
  } catch (error: any) {
    ElMessage.error(error?.message || t('page.mcp.auditFailed'));
  }
}

onMounted(loadServers);
</script>

<template>
  <div class="mcp-page">
    <div class="page-header">
      <div>
        <h1>{{ $t('route.rag_mcp') }}</h1>
        <p>{{ $t('page.mcp.description') }}</p>
      </div>
      <div class="header-actions">
        <ElButton v-if="can('rag:mcp:create')" type="primary" @click="openCreate">{{ $t('common.add') }}</ElButton>
        <ElButton v-if="can('rag:mcp:audit')" @click="() => openEvents(1)">{{ $t('page.mcp.events') }}</ElButton>
        <ElButton :loading="loading" @click="loadServers(1)">{{ $t('common.refresh') }}</ElButton>
      </div>
    </div>
    <ElAlert v-if="errorText" :title="errorText" type="error" show-icon closable @close="errorText = ''" />
    <div class="workspace">
      <section class="servers-panel">
        <div class="section-title">
          <span>{{ $t('page.mcp.servers') }}</span>
          <ElTag size="small">{{ servers.length }}</ElTag>
        </div>
        <div class="filters">
          <ElInput v-model="serverKeyword" clearable :placeholder="$t('page.mcp.searchServers')" @keyup.enter="loadServers(1)" />
          <ElSelect v-model="serverHealth" clearable :placeholder="$t('page.mcp.health')" @change="loadServers(1)">
            <ElOption :label="$t('page.mcp.healthy')" value="healthy" />
            <ElOption :label="$t('page.mcp.unhealthy')" value="unhealthy" />
            <ElOption :label="$t('page.mcp.unknown')" value="unknown" />
          </ElSelect>
        </div>
        <ElEmpty v-if="!loading && !servers.length" :description="$t('page.mcp.noServer')" />
        <div
          v-for="server in servers"
          :key="server.id"
          class="server-row"
          :class="{ active: selected?.id === server.id }"
          @click="loadTools(server)"
        >
          <div class="server-main">
            <strong>{{ server.name }}</strong>
            <span>{{ server.code }}</span>
          </div>
          <div class="server-meta">
            <ElTag
              size="small"
              :type="
                server.healthStatus === 'healthy' ? 'success' : server.healthStatus === 'unhealthy' ? 'danger' : 'info'
              "
            >
              {{ server.healthStatus }}
            </ElTag>
            <span>{{ server.toolCount || 0 }} tools</span>
          </div>
          <div class="server-actions">
            <ElButton text size="small" @click.stop="showHealth(server)">{{ $t('page.mcp.health') }}</ElButton>
            <ElButton v-if="can('rag:mcp:validate')" text size="small" @click.stop="validate(server)">{{ $t('page.mcp.validate') }}</ElButton>
            <ElButton v-if="can('rag:mcp:update')" text size="small" @click.stop="openEdit(server)">{{ $t('page.mcp.edit') }}</ElButton>
            <ElButton v-if="can('rag:mcp:delete')" text type="danger" size="small" @click.stop="remove(server)">{{ $t('page.mcp.disable') }}</ElButton>
          </div>
        </div>
        <ElPagination
          v-if="serverTotal > 10"
          class="pagination"
          layout="prev, pager, next"
          :current-page="serverPage"
          :page-size="10"
          :total="serverTotal"
          @current-change="loadServers"
        />
      </section>
      <section class="catalog-panel">
        <template v-if="selected">
          <div class="catalog-header">
            <div>
              <h2>{{ selected.name }}</h2>
              <code>{{ selected.endpoint }}</code>
            </div>
            <ElTag type="success">{{ enabledCount }}/{{ tools.length }} enabled</ElTag>
          </div>
          <ElAlert v-if="selected.lastError" :title="selected.lastError" type="warning" show-icon />
          <div class="filters tool-filters">
            <ElInput v-model="toolKeyword" clearable :placeholder="$t('page.mcp.searchTools')" @keyup.enter="loadToolsPage" />
            <ElSelect v-model="toolEnabled" clearable :placeholder="$t('page.mcp.enabledFilter')" @change="loadToolsPage">
              <ElOption :label="$t('page.mcp.enabledOnly')" value="1" />
              <ElOption :label="$t('page.mcp.disabledOnly')" value="0" />
            </ElSelect>
            <ElButton v-if="can('rag:mcp:refresh')" :loading="loading" @click="refreshSelected">{{ $t('page.mcp.refreshCatalog') }}</ElButton>
          </div>
          <ElTable v-loading="toolsLoading" :data="tools" row-key="id" class="tool-table">
            <ElTableColumn :label="$t('page.mcp.tool')" min-width="220">
              <template #default="{ row }">
                <div class="tool-name">
                  <strong>{{ row.title || row.externalName }}</strong>
                  <code>{{ row.exposedName }}</code>
                </div>
              </template>
            </ElTableColumn>
            <ElTableColumn prop="description" :label="$t('page.mcp.descriptionLabel')" min-width="260" show-overflow-tooltip />
            <ElTableColumn :label="$t('page.mcp.mode')" width="110">
              <template #default><ElTag size="small" type="success">{{ $t('page.mcp.readonly') }}</ElTag></template>
            </ElTableColumn>
            <ElTableColumn :label="$t('page.mcp.enabled')" width="100" align="right">
              <template #default="{ row }">
                <ElSwitch :model-value="row.enabled === 1" :disabled="row.readonlyHint !== 1 || !can('rag:mcp:enable')" @change="toggle(row)" />
              </template>
            </ElTableColumn>
            <ElTableColumn :label="$t('page.mcp.access')" width="120" align="right">
              <template #default="{ row }">
                <ElButton v-if="can('rag:mcp:update')" text size="small" @click="openScope(row)">{{ row.visibility || 'public' }}</ElButton>
                <span v-else>{{ row.visibility || 'public' }}</span>
              </template>
            </ElTableColumn>
            <ElTableColumn :label="$t('page.mcp.catalogStatus')" width="130">
              <template #default="{ row }">
                <ElTag size="small" :type="row.catalogStatus === 'ACTIVE' ? 'success' : row.catalogStatus === 'SCHEMA_CHANGED' ? 'warning' : 'danger'">
                  {{ row.catalogStatus || 'UNKNOWN' }}
                </ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn :label="$t('page.mcp.schema')" width="100" align="right">
              <template #default="{ row }">
                <ElButton text size="small" @click="openSchema(row)">{{ $t('page.mcp.view') }}</ElButton>
              </template>
            </ElTableColumn>
          </ElTable>
          <ElPagination
            v-if="toolTotal > 10"
            class="pagination"
            layout="prev, pager, next"
            :current-page="toolPage"
            :page-size="10"
            :total="toolTotal"
            @current-change="changeToolPage"
          />
        </template>
        <ElEmpty v-else :description="$t('page.mcp.selectServer')" />
      </section>
    </div>
    <ElDialog
      v-model="dialogVisible"
      :title="isEdit ? $t('page.mcp.editServer') : $t('page.mcp.addServer')"
      width="min(560px, calc(100vw - 32px))"
    >
      <ElSteps :active="formStep - 1" finish-status="success" align-center class="form-steps">
        <ElStep :title="$t('page.mcp.stepBasic')" />
        <ElStep :title="$t('page.mcp.stepAuth')" />
        <ElStep :title="$t('page.mcp.stepConfirm')" />
      </ElSteps>
      <ElAlert v-if="formError" :title="formError" type="error" show-icon class="form-error" />
      <ElForm v-if="formStep === 1" label-position="top" @submit.prevent="nextFormStep">
        <ElFormItem :label="$t('page.mcp.name')" required><ElInput v-model="form.name" maxlength="100" /></ElFormItem>
        <ElFormItem :label="$t('page.mcp.code')" required><ElInput v-model="form.code" :disabled="isEdit" maxlength="50" /></ElFormItem>
        <ElFormItem :label="$t('page.mcp.endpoint')" required>
          <ElInput v-model="form.endpoint" :placeholder="$t('page.mcp.endpointPlaceholder')" />
        </ElFormItem>
      </ElForm>
      <ElForm v-else-if="formStep === 2" label-position="top" @submit.prevent="nextFormStep">
        <ElFormItem :label="$t('page.mcp.authentication')">
          <ElSelect v-model="form.authType" class="full-width">
            <ElOption :label="$t('page.mcp.none')" value="none" />
            <ElOption :label="$t('page.mcp.apiKey')" value="api_key" />
            <ElOption :label="$t('page.mcp.bearer')" value="bearer" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem v-if="form.authType === 'api_key'" :label="$t('page.mcp.headerName')">
          <ElInput v-model="form.authHeaderName" />
        </ElFormItem>
        <ElFormItem v-if="form.authType !== 'none'" :label="$t('page.mcp.credential')">
          <ElInput v-model="form.authConfig" type="password" show-password :placeholder="$t('page.mcp.keepCredential')" />
        </ElFormItem>
        <ElFormItem :label="$t('page.mcp.status')"><ElSwitch v-model="form.status" :active-value="1" :inactive-value="0" /></ElFormItem>
      </ElForm>
      <div v-else class="form-confirm">
        <ElDescriptions :column="1" border>
          <ElDescriptionsItem :label="$t('page.mcp.name')">{{ form.name }}</ElDescriptionsItem>
          <ElDescriptionsItem :label="$t('page.mcp.code')">{{ form.code }}</ElDescriptionsItem>
          <ElDescriptionsItem :label="$t('page.mcp.endpoint')">{{ form.endpoint }}</ElDescriptionsItem>
          <ElDescriptionsItem :label="$t('page.mcp.authentication')">{{ authLabel(form.authType) }}</ElDescriptionsItem>
          <ElDescriptionsItem :label="$t('page.mcp.credential')">{{ form.authType === 'none' ? $t('page.mcp.none') : $t('page.mcp.credentialConfigured') }}</ElDescriptionsItem>
        </ElDescriptions>
      </div>
      <template #footer>
        <ElButton @click="dialogVisible = false">{{ $t('common.cancel') }}</ElButton>
        <ElButton v-if="formStep > 1" @click="previousFormStep">{{ $t('page.mcp.previous') }}</ElButton>
        <ElButton v-if="formStep < 3" type="primary" @click="nextFormStep">{{ $t('page.mcp.next') }}</ElButton>
        <ElButton v-else type="primary" :loading="saving" @click="save">{{ $t('page.mcp.verifyAndSave') }}</ElButton>
      </template>
    </ElDialog>
    <ElDialog v-model="schemaVisible" :title="$t('page.mcp.schemaTitle')" width="min(760px, calc(100vw - 32px))">
      <template v-if="schemaTool">
        <div class="schema-meta">
          <strong>{{ schemaTool.title || schemaTool.externalName }}</strong>
          <code>{{ schemaTool.exposedName }}</code>
          <ElTag size="small">{{ schemaTool.schemaHash || $t('page.mcp.noSchemaHash') }}</ElTag>
        </div>
        <ElTabs>
          <ElTabPane :label="$t('page.mcp.inputSchema')">
            <ElInput :model-value="schemaTool.inputSchema || '{}'" type="textarea" :rows="18" readonly />
          </ElTabPane>
          <ElTabPane :label="$t('page.mcp.outputSchema')">
            <ElInput :model-value="schemaTool.outputSchema || '{}'" type="textarea" :rows="18" readonly />
          </ElTabPane>
        </ElTabs>
      </template>
    </ElDialog>
    <ElDialog v-model="scopeVisible" :title="$t('page.mcp.accessTitle')" width="min(440px, calc(100vw - 32px))">
      <ElForm label-position="top">
        <ElFormItem :label="$t('page.mcp.access')">
          <ElSelect v-model="scopeForm.visibility" class="full-width">
            <ElOption label="public" value="public" />
            <ElOption label="department" value="department" />
            <ElOption label="post" value="post" />
            <ElOption label="user" value="user" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem v-if="scopeForm.visibility === 'department'" :label="$t('page.mcp.departmentId')"><ElInputNumber v-model="scopeForm.departmentId" :min="1" class="full-width" /></ElFormItem>
        <ElFormItem v-if="scopeForm.visibility === 'post'" :label="$t('page.mcp.postId')"><ElInputNumber v-model="scopeForm.postId" :min="1" class="full-width" /></ElFormItem>
        <ElFormItem v-if="scopeForm.visibility === 'user'" :label="$t('page.mcp.userId')"><ElInputNumber v-model="scopeForm.userId" :min="1" class="full-width" /></ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="scopeVisible = false">{{ $t('common.cancel') }}</ElButton>
        <ElButton type="primary" :loading="scopeSaving" @click="saveScope">{{ $t('common.confirm') }}</ElButton>
      </template>
    </ElDialog>
    <ElDrawer v-model="eventVisible" :title="$t('page.mcp.events')" direction="rtl" size="min(620px, 100vw)">
      <div class="filters event-filters">
        <ElInput v-model="eventType" clearable :placeholder="$t('page.mcp.eventType')" @keyup.enter="openEvents(1)" />
        <ElSelect v-model="eventStatus" clearable :placeholder="$t('page.mcp.eventStatus')" @change="openEvents(1)">
          <ElOption label="SUCCEEDED" value="SUCCEEDED" />
          <ElOption label="FAILED" value="FAILED" />
        </ElSelect>
      </div>
      <ElTable :data="events" size="small">
        <ElTableColumn prop="eventType" :label="$t('page.mcp.eventColumn')" min-width="160" />
        <ElTableColumn prop="status" :label="$t('page.mcp.statusColumn')" width="110" />
        <ElTableColumn prop="errorCode" :label="$t('page.mcp.errorColumn')" min-width="140" />
        <ElTableColumn prop="createdAt" :label="$t('page.mcp.timeColumn')" min-width="160" />
      </ElTable>
      <ElPagination
        v-if="eventTotal > 15"
        class="pagination"
        layout="prev, pager, next"
        :current-page="eventPage"
        :page-size="15"
        :total="eventTotal"
        @current-change="openEvents"
      />
    </ElDrawer>
  </div>
</template>

<style scoped>
.mcp-page {
  padding: 24px;
  min-height: 100%;
  background: var(--el-bg-color-page);
  color: var(--el-text-color-primary);
}
.page-header,
.catalog-header,
.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.page-header {
  margin-bottom: 20px;
}
h1,
h2,
p {
  margin: 0;
}
h1 {
  font-size: 22px;
}
h2 {
  font-size: 18px;
  margin-bottom: 6px;
}
p,
code,
.server-main span {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.header-actions {
  display: flex;
  gap: 8px;
}
.workspace {
  display: grid;
  grid-template-columns: minmax(270px, 0.8fr) minmax(0, 2fr);
  gap: 16px;
  margin-top: 16px;
}
.servers-panel,
.catalog-panel {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  padding: 16px;
  min-height: 480px;
}
.section-title {
  margin-bottom: 12px;
  font-weight: 600;
}
.server-row {
  padding: 12px;
  border: 1px solid transparent;
  border-radius: 5px;
  cursor: pointer;
  margin-bottom: 8px;
  transition:
    background 0.15s,
    border-color 0.15s;
}
.server-row:hover,
.server-row.active {
  background: var(--el-fill-color-light);
  border-color: var(--el-color-primary-light-5);
}
.server-main,
.server-meta,
.server-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.server-main {
  justify-content: space-between;
}
.filters {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.filters .el-input,
.filters .el-select {
  min-width: 0;
  flex: 1;
}
.tool-filters {
  align-items: center;
}
.tool-filters .el-button {
  flex: 0 0 auto;
}
.pagination {
  justify-content: flex-end;
  margin-top: 14px;
}
.server-meta {
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.server-actions {
  justify-content: flex-end;
  margin-top: 6px;
}
.catalog-header {
  margin-bottom: 16px;
}
.tool-name {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.full-width {
  width: 100%;
}
.form-steps {
  margin: 4px 0 22px;
}
.form-error {
  margin-bottom: 16px;
}
.form-confirm {
  min-height: 220px;
}
.schema-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.schema-meta code {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
@media (max-width: 800px) {
  .mcp-page {
    padding: 16px;
  }
  .workspace {
    grid-template-columns: 1fr;
  }
  .servers-panel,
  .catalog-panel {
    min-height: 0;
  }
  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }
  .header-actions {
    width: 100%;
  }
  .header-actions .el-button {
    flex: 1;
  }
  .filters {
    flex-wrap: wrap;
  }
  .filters .el-input,
  .filters .el-select,
  .tool-filters .el-button {
    width: 100%;
    flex-basis: 100%;
  }
}
</style>
