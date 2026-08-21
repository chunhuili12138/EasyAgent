import { putFileDirectly } from '@/utils/direct-upload';
import { getServiceBaseURL } from '@/utils/service';
import { request } from '../request';

const pendingAttachmentCompletions = new Map<string, string>();

export function fetchSessions(params?: { page?: number; size?: number; keyword?: string }) {
  return request<{ records: any[]; total: number; current: number; size: number }>({
    url: '/rag/sessions',
    method: 'get',
    params
  });
}

export function fetchCreateSession(data?: { title?: string }) {
  return request<any>({ url: '/rag/sessions', method: 'post', data: data || {} });
}

export function fetchUpdateSession(id: number, data: { title?: string; isPinned?: boolean }) {
  return request<any>({ url: `/rag/sessions/${id}`, method: 'put', data });
}

export function fetchDeleteSession(id: number) {
  return request<any>({ url: `/rag/sessions/${id}`, method: 'delete' });
}

export interface SessionAttachment {
  id: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  status: 'uploaded' | 'parsing' | 'processing' | 'ready' | 'failed';
  errorMessage?: string;
  qualityScore?: number;
  createdAt: string;
}

export function fetchSessionAttachments(sessionId: number) {
  return request<SessionAttachment[]>({ url: `/rag/sessions/${sessionId}/attachments`, method: 'get' });
}

export async function fetchUploadSessionAttachment(sessionId: number, file: File) {
  const pendingKey = `${sessionId}:${file.name}:${file.size}:${file.lastModified}`;
  const pendingUploadId = pendingAttachmentCompletions.get(pendingKey);
  if (pendingUploadId) {
    const completed = await request<SessionAttachment>({
      url: `/rag/sessions/${sessionId}/attachments/direct-upload/${pendingUploadId}/complete`,
      method: 'post'
    });
    if (completed.error) throw completed.error;
    pendingAttachmentCompletions.delete(pendingKey);
    return completed;
  }
  const initiated = await request<{
    uploadId: string;
    uploadUrl: string;
    headers: Record<string, string>;
  }>({
    url: `/rag/sessions/${sessionId}/attachments/direct-upload/initiate`,
    method: 'post',
    data: {
      fileName: file.name,
      fileSize: file.size,
      contentType: file.type || 'application/octet-stream'
    }
  });
  if (initiated.error || !initiated.data) throw initiated.error || new Error('Unable to initiate attachment upload');
  const { uploadId, uploadUrl, headers } = initiated.data;
  try {
    await putFileDirectly(uploadUrl, file, headers);
    pendingAttachmentCompletions.set(pendingKey, uploadId);
    const completed = await request<SessionAttachment>({
      url: `/rag/sessions/${sessionId}/attachments/direct-upload/${uploadId}/complete`,
      method: 'post'
    });
    if (completed.error) throw completed.error;
    pendingAttachmentCompletions.delete(pendingKey);
    return completed;
  } catch (error) {
    if (!pendingAttachmentCompletions.has(pendingKey)) {
      await request<void>({
        url: `/rag/sessions/${sessionId}/attachments/direct-upload/${uploadId}`,
        method: 'delete'
      });
    }
    throw error;
  }
}

export function fetchDeleteSessionAttachment(sessionId: number, attachmentId: number) {
  return request<void>({ url: `/rag/sessions/${sessionId}/attachments/${attachmentId}`, method: 'delete' });
}

export function fetchRetrySessionAttachment(sessionId: number, attachmentId: number) {
  return request<void>({ url: `/rag/sessions/${sessionId}/attachments/${attachmentId}/retry`, method: 'post' });
}

export function fetchSessionMessages(sessionId: number, params?: { page?: number; size?: number }) {
  return request<{
    records: Array<{
      id: number;
      role: string;
      content: string;
      citations?: unknown[];
      feedback?: number;
      feedbackType?: string;
      feedbackReason?: string;
      answerMode?: ChatMode;
      createdAt?: string;
    }>;
    total: number;
  }>({
    url: `/rag/sessions/${sessionId}/messages`,
    method: 'get',
    params
  });
}

export function fetchSubmitFeedback(
  messageId: number,
  data: { feedback: number; feedbackType?: string; reason?: string }
) {
  return request<any>({ url: `/rag/messages/${messageId}/feedback`, method: 'put', data });
}

export function fetchPendingHitl(sessionId: number) {
  return request<any>({ url: `/rag/chat/${sessionId}/pending-hitl`, method: 'get' });
}

export function fetchHitlConfirm(sessionId: number, data: { confirmed: boolean; reason?: string }) {
  return request<any>({ url: `/rag/chat/${sessionId}/confirm`, method: 'post', data });
}

export function fetchPendingClarification(sessionId: number) {
  return request<any>({ url: `/rag/chat/${sessionId}/pending-clarification`, method: 'get' });
}

export function fetchCancelClarification(sessionId: number, planId: number) {
  return request<void>({
    url: `/rag/chat/${sessionId}/clarifications/${planId}/cancel`,
    method: 'post'
  });
}

export function fetchCancelChatExecution(sessionId: number, executionId: string) {
  return request<void>({
    url: `/rag/chat/${sessionId}/executions/${executionId}/cancel`,
    method: 'post'
  });
}

export function fetchSearch(data: { query: string; topK?: number; enableRerank?: boolean; filters?: any }) {
  return request<any>({ url: '/search', method: 'post', data });
}

export type ChatMode = 'auto' | 'knowledge' | 'general';

export function createChatStreamUrl(): string {
  const isHttpProxy = import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y';
  const { baseURL } = getServiceBaseURL(import.meta.env, isHttpProxy);
  return `${baseURL.replace(/\/$/, '')}/rag/chat/stream`;
}

export function fetchBadCases(params?: {
  page?: number;
  size?: number;
  status?: string;
  keyword?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  return request<{ records: any[]; total: number }>({
    url: '/rag/bad-cases',
    method: 'get',
    params
  });
}

export function fetchBadCaseDetail(id: number) {
  return request<any>({ url: `/rag/bad-cases/${id}`, method: 'get' });
}

export function fetchLabelBadCase(
  id: number,
  data: {
    correctAnswer?: string;
  }
) {
  return request<any>({ url: `/rag/bad-cases/${id}/label`, method: 'put', data });
}

export function fetchBadCaseStats() {
  return request<any>({ url: '/rag/bad-cases/stats', method: 'get' });
}

export function fetchSkills(params?: { page?: number; size?: number; keyword?: string; status?: number }) {
  return request<{ records: any[]; total: number }>({ url: '/rag/skills', method: 'get', params });
}

export interface McpPage<T> { records: T[]; total: number; current: number; size: number; pages: number; }
export interface McpServer {
  id: number; name: string; code: string; endpoint: string; transport: string; authType: string;
  credentialConfigured?: boolean; status: number; healthStatus: string; toolCount: number;
  lastError?: string; catalogVersion?: string; createdAt?: string; updatedAt?: string;
}
export interface McpTool {
  id: number; serverId: number; externalName: string; exposedName: string; title?: string;
  description?: string; inputSchema: string; outputSchema?: string; annotations?: string;
  schemaHash?: string; readonlyHint: number; enabled: number; visibility?: 'public' | 'department' | 'post' | 'user';
  departmentId?: number; postId?: number; userId?: number; catalogStatus?: string; catalogVersion?: string;
}
export interface McpEvent { id: number; eventId?: string; eventType: string; status: string; errorCode: string; errorMessage?: string; provenance?: string; sessionId?: number; turnId?: string; createdAt: string; }
export function fetchMcpServers() { return request<McpServer[]>({ url: '/rag/mcp/servers', method: 'get' }); }
export function fetchMcpServerPage(params?: { page?: number; size?: number; keyword?: string; status?: number; healthStatus?: string }) { return request<McpPage<McpServer>>({ url: '/rag/mcp/servers/page', method: 'get', params }); }
export function fetchCreateMcpServer(data: Record<string, unknown>) { return request<McpServer>({ url: '/rag/mcp/servers', method: 'post', data }); }
export function fetchUpdateMcpServer(id: number, data: Record<string, unknown>) { return request<void>({ url: `/rag/mcp/servers/${id}`, method: 'put', data }); }
export function fetchDeleteMcpServer(id: number) { return request<void>({ url: `/rag/mcp/servers/${id}`, method: 'delete' }); }
export function fetchValidateMcpServer(id: number) { return request<McpServer>({ url: `/rag/mcp/servers/${id}/validate`, method: 'post', timeout: 60000 }); }
export function fetchRefreshMcpServer(id: number) { return request<McpServer>({ url: `/rag/mcp/servers/${id}/refresh`, method: 'post', timeout: 60000 }); }
export function fetchMcpHealth(id: number) { return request<{ serverId: number; serverCode: string; serverStatus: number; healthStatus: string; lastError?: string; catalogVersion?: string; toolCount: number; checkedAt?: string }>({ url: `/rag/mcp/servers/${id}/health`, method: 'get' }); }
export function fetchMcpTools(id: number) { return request<McpTool[]>({ url: `/rag/mcp/servers/${id}/tools`, method: 'get' }); }
export function fetchMcpToolPage(id: number, params?: { page?: number; size?: number; keyword?: string; catalogStatus?: string; enabled?: number }) { return request<McpPage<McpTool>>({ url: `/rag/mcp/servers/${id}/tools/page`, method: 'get', params }); }
export function fetchSetMcpToolEnabled(id: number, enabled: boolean) { return request<void>({ url: `/rag/mcp/tools/${id}/enabled`, method: 'put', data: { enabled } }); }
export function fetchUpdateMcpToolScope(id: number, data: { visibility: string; departmentId?: number; postId?: number; userId?: number }) { return request<void>({ url: `/rag/mcp/tools/${id}/scope`, method: 'put', data }); }
export function fetchMcpEvents(limit = 50) { return request<McpEvent[]>({ url: '/rag/mcp/events', method: 'get', params: { limit } }); }
export function fetchMcpEventPage(params?: { page?: number; size?: number; eventType?: string; status?: string }) { return request<McpPage<McpEvent>>({ url: '/rag/mcp/events/page', method: 'get', params }); }

export function fetchSkillDetail(id: number) {
  return request<any>({ url: `/rag/skills/${id}`, method: 'get' });
}

export function fetchCreateSkill(data: any) {
  return request<any>({ url: '/rag/skills', method: 'post', data });
}

export function fetchUpdateSkill(id: number, data: any) {
  return request<any>({ url: `/rag/skills/${id}`, method: 'put', data });
}

export function fetchDeleteSkill(id: number) {
  return request<any>({ url: `/rag/skills/${id}`, method: 'delete' });
}

export function fetchValidateSkill(data: { yamlContent: string }) {
  return request<any>({ url: '/rag/skills/validate', method: 'post', data });
}

export function fetchParseSkillYaml(data: { yamlContent: string }) {
  return request<any>({ url: '/rag/skills/parse-yaml', method: 'post', data });
}

export function fetchRunSkillTest(data: {
  query: string;
  skillId?: number;
  definition?: any;
  yamlContent?: string;
  executeActions?: boolean;
  runtimeArgs?: Record<string, unknown>;
}) {
  return request<any>({ url: '/rag/skills/test-run', method: 'post', data, timeout: 180000 });
}

export function createSkillDesignTask(data: {
  name: string;
  code: string;
  description: string;
  trialQuery: string;
}) {
  return request<any>({ url: '/rag/skill-design/tasks', method: 'post', data, timeout: 180000 });
}

export function fetchSkillDesignTask(taskId: string) {
  return request<any>({ url: `/rag/skill-design/tasks/${taskId}`, method: 'get' });
}

export function confirmSkillDesignManualReview(taskId: string) {
  return request<any>({ url: `/rag/skill-design/tasks/${taskId}/confirm-manual-review`, method: 'post' });
}

export function fetchSkillDesignEvents(taskId: string, after?: number) {
  return request<any[]>({ url: `/rag/skill-design/tasks/${taskId}/events`, method: 'get', params: { after } });
}

export function cancelSkillDesignTask(taskId: string) {
  return request<any>({ url: `/rag/skill-design/tasks/${taskId}/cancel`, method: 'post' });
}

export function trialSkillDesignTask(taskId: string, data: {
  query?: string;
  runtimeArgs?: Record<string, unknown>;
  executeActions?: boolean;
}) {
  return request<any>({ url: `/rag/skill-design/tasks/${taskId}/trial`, method: 'post', data, timeout: 180000 });
}

export function fetchDatasources(params?: {
  page?: number;
  size?: number;
  keyword?: string;
  dbType?: string;
  status?: number;
}) {
  return request<{ records: any[]; total: number }>({ url: '/rag/datasources', method: 'get', params });
}

export function fetchCreateDatasource(data: any) {
  return request<any>({ url: '/rag/datasources', method: 'post', data });
}

export function fetchUpdateDatasource(id: number, data: any) {
  return request<any>({ url: `/rag/datasources/${id}`, method: 'put', data });
}

export function fetchDeleteDatasource(id: number) {
  return request<any>({ url: `/rag/datasources/${id}`, method: 'delete' });
}

export function fetchTestConnection(id: number) {
  return request<string>({ url: `/rag/datasources/${id}/test`, method: 'post' });
}

export function fetchSchemas(datasourceId: number) {
  return request<any[]>({ url: `/rag/datasources/${datasourceId}/schemas`, method: 'get' });
}

export function fetchCreateSchema(datasourceId: number, data: any) {
  return request<any>({ url: `/rag/datasources/${datasourceId}/schemas`, method: 'post', data });
}

export function fetchUpdateSchema(id: number, data: any) {
  return request<any>({ url: `/rag/schemas/${id}`, method: 'put', data });
}

export function fetchDeleteSchema(id: number) {
  return request<any>({ url: `/rag/schemas/${id}`, method: 'delete' });
}

export function fetchTestSchema(id: number, data: { query: string }) {
  return request<any>({ url: `/rag/schemas/${id}/test`, method: 'post', data, timeout: 180000 });
}

export interface RagAclOption {
  id: number;
  name: string;
}

export interface RagAclOptions {
  departments: RagAclOption[];
  posts: RagAclOption[];
  users: RagAclOption[];
}

export function fetchRagAclOptions() {
  return request<RagAclOptions>({ url: '/rag/acl/options', method: 'get' });
}

export function fetchTools(params?: {
  page?: number;
  size?: number;
  keyword?: string;
  httpMethod?: string;
  status?: number;
}) {
  return request<{ records: any[]; total: number }>({ url: '/rag/tools', method: 'get', params });
}

export function fetchCreateTool(data: any) {
  return request<any>({ url: '/rag/tools', method: 'post', data });
}

export function fetchToolDetail(id: number) {
  return request<any>({ url: `/rag/tools/${id}`, method: 'get' });
}

export function fetchUpdateTool(id: number, data: any) {
  return request<any>({ url: `/rag/tools/${id}`, method: 'put', data });
}

export function fetchDeleteTool(id: number) {
  return request<any>({ url: `/rag/tools/${id}`, method: 'delete' });
}

export function fetchToolSchema(id: number) {
  return request<any>({ url: `/rag/tools/${id}/schema`, method: 'get' });
}

export function fetchTestTool(id: number, data: { params?: Record<string, any>; execute?: boolean }) {
  return request<any>({ url: `/rag/tools/${id}/test`, method: 'post', data, timeout: 120000 });
}

export function fetchExperiences(params?: {
  page?: number;
  size?: number;
  keyword?: string;
  visibility?: string;
  minScore?: number;
  status?: number;
}) {
  return request<{ records: any[]; total: number }>({ url: '/rag/experiences', method: 'get', params });
}

export function fetchDeleteExperience(id: number) {
  return request<any>({ url: `/rag/experiences/${id}`, method: 'delete' });
}

export function fetchExperienceDetail(id: number) {
  return request<any>({ url: `/rag/experiences/${id}`, method: 'get' });
}

export function fetchExperienceStats() {
  return request<any>({ url: '/rag/experiences/stats', method: 'get' });
}

export function fetchSqlLogs(params?: {
  page?: number;
  size?: number;
  status?: string;
  keyword?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  return request<{ records: any[]; total: number }>({ url: '/rag/sql-logs', method: 'get', params });
}

export function fetchSqlLogDetail(id: number) {
  return request<any>({ url: `/rag/sql-logs/${id}`, method: 'get' });
}

export function fetchSqlLogStats() {
  return request<any>({ url: '/rag/sql-logs/stats', method: 'get' });
}

export function fetchAudits(params?: {
  page?: number;
  size?: number;
  actionType?: string;
  status?: string;
  userId?: number;
  dateFrom?: string;
  dateTo?: string;
}) {
  return request<{ records: any[]; total: number }>({ url: '/rag/audits', method: 'get', params });
}

export function fetchAuditDetail(id: number) {
  return request<any>({ url: `/rag/audits/${id}`, method: 'get' });
}

export function fetchAuditStats() {
  return request<any>({ url: '/rag/audits/stats', method: 'get' });
}
