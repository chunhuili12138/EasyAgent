<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  type McpServer,
  type McpTool,
  fetchCreateMcpServer,
  fetchDeleteMcpServer,
  fetchMcpServers,
  fetchMcpTools,
  fetchSetMcpToolEnabled,
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
const dialogVisible = ref(false);
const saving = ref(false);
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

const enabledCount = computed(() => tools.value.filter(tool => tool.enabled === 1).length);

async function loadServers() {
  loading.value = true;
  try {
    const response = await fetchMcpServers();
    if (response.data) servers.value = response.data;
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
  toolsLoading.value = true;
  try {
    const response = await fetchMcpTools(server.id);
    tools.value = response.data || [];
  } finally {
    toolsLoading.value = false;
  }
}

function openCreate() {
  isEdit.value = false;
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
  saving.value = true;
  try {
    const data: Record<string, unknown> = { ...form.value };
    if (!data.authConfig) delete data.authConfig;
    if (isEdit.value && selected.value) await fetchUpdateMcpServer(selected.value.id, data);
    else await fetchCreateMcpServer(data);
    dialogVisible.value = false;
    ElMessage.success(t('page.rag_mcp'));
    await loadServers();
  } finally {
    saving.value = false;
  }
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

async function remove(server: McpServer) {
  await ElMessageBox.confirm(`${server.name}`, t('page.rag_mcp'), { type: 'warning' });
  await fetchDeleteMcpServer(server.id);
  if (selected.value?.id === server.id) selected.value = null;
  await loadServers();
}

async function toggle(tool: McpTool) {
  await fetchSetMcpToolEnabled(tool.id, tool.enabled !== 1);
  tool.enabled = tool.enabled === 1 ? 0 : 1;
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
        <ElButton :loading="loading" @click="loadServers">{{ $t('common.refresh') }}</ElButton>
      </div>
    </div>
    <ElAlert v-if="errorText" :title="errorText" type="error" show-icon closable @close="errorText = ''" />
    <div class="workspace">
      <section class="servers-panel">
        <div class="section-title">
          <span>{{ $t('page.mcp.servers') }}</span>
          <ElTag size="small">{{ servers.length }}</ElTag>
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
            <ElButton v-if="can('rag:mcp:validate')" text size="small" @click.stop="validate(server)">{{ $t('page.mcp.validate') }}</ElButton>
            <ElButton v-if="can('rag:mcp:update')" text size="small" @click.stop="openEdit(server)">{{ $t('page.mcp.edit') }}</ElButton>
            <ElButton v-if="can('rag:mcp:delete')" text type="danger" size="small" @click.stop="remove(server)">{{ $t('page.mcp.disable') }}</ElButton>
          </div>
        </div>
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
              <template #default="{ row }"><ElTag size="small" type="success">{{ $t('page.mcp.readonly') }}</ElTag></template>
            </ElTableColumn>
            <ElTableColumn :label="$t('page.mcp.enabled')" width="100" align="right">
              <template #default="{ row }">
                <ElSwitch :model-value="row.enabled === 1" :disabled="row.readonlyHint !== 1 || !can('rag:mcp:enable')" @change="toggle(row)" />
              </template>
            </ElTableColumn>
          </ElTable>
        </template>
        <ElEmpty v-else :description="$t('page.mcp.selectServer')" />
      </section>
    </div>
    <ElDialog
      v-model="dialogVisible"
      :title="isEdit ? $t('page.mcp.editServer') : $t('page.mcp.addServer')"
      width="min(560px, calc(100vw - 32px))"
    >
      <ElForm label-position="top" @submit.prevent="save">
        <ElFormItem :label="$t('page.mcp.name')" required><ElInput v-model="form.name" maxlength="100" /></ElFormItem>
        <ElFormItem :label="$t('page.mcp.code')" required><ElInput v-model="form.code" :disabled="isEdit" maxlength="50" /></ElFormItem>
        <ElFormItem :label="$t('page.mcp.endpoint')" required>
          <ElInput v-model="form.endpoint" placeholder="https://mcp.example.com/mcp" />
        </ElFormItem>
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
          <ElInput
            v-model="form.authConfig"
            type="password"
            show-password
            :placeholder="$t('page.mcp.keepCredential')"
          />
        </ElFormItem>
        <ElFormItem :label="$t('page.mcp.status')"><ElSwitch v-model="form.status" :active-value="1" :inactive-value="0" /></ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">{{ $t('common.cancel') }}</ElButton>
        <ElButton type="primary" :loading="saving" @click="save">{{ $t('common.confirm') }}</ElButton>
      </template>
    </ElDialog>
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
}
</style>
