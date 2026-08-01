import { request } from '../request';

export type WorkflowStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface WorkflowExecutionPolicy {
  maxRetries: number;
  retryDelay: string;
  timeoutMs: number;
  failurePolicy: 'FAIL_WORKFLOW' | 'ERROR_BRANCH';
  failureTarget?: string;
}

export interface WorkflowFieldMapping {
  target: string;
  sourceKind: 'PATH' | 'CONSTANT';
  source?: string;
  value?: unknown;
  required: boolean;
  nullable: boolean;
  defaultValue?: unknown;
  conversion?: string;
  missingPolicy: string;
  sensitive: boolean;
}

export interface WorkflowNodeDefinition {
  id: string;
  type: string;
  name: string;
  config: Record<string, any>;
  inputSchema: Record<string, any>;
  inputMapping: WorkflowFieldMapping[];
  outputSchema: Record<string, any>;
  outputMapping: WorkflowFieldMapping[];
  executionPolicy: WorkflowExecutionPolicy;
}

export interface WorkflowEdgeDefinition {
  id: string;
  source: string;
  target: string;
  condition?: string;
  defaultBranch: boolean;
}

export interface WorkflowDefinition {
  schemaVersion: number;
  nodes: WorkflowNodeDefinition[];
  edges: WorkflowEdgeDefinition[];
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
  variablesSchema: Record<string, any>;
  finalOutput: WorkflowFieldMapping[];
  policies: Record<string, any>;
  resourceBindings: Array<Record<string, any>>;
}

export interface AutomationWorkflow {
  id: number;
  name: string;
  code: string;
  description?: string;
  currentVersion: number;
  publishedVersionId?: number;
  status: WorkflowStatus;
  lockVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationWorkflowVersion {
  id: number;
  workflowId: number;
  version: number;
  definitionJson: string;
  validationStatus?: string;
  validationErrors?: string;
  status: string;
  publishedAt?: string;
}

export interface WorkflowDetail {
  workflow: AutomationWorkflow;
  currentVersion: AutomationWorkflowVersion;
  publishedVersion?: AutomationWorkflowVersion;
}

export interface WorkflowValidationResult {
  version: number;
  valid: boolean;
  errors: string[];
}

export interface WorkflowUpsertPayload {
  name?: string;
  code?: string;
  description?: string;
  definition?: WorkflowDefinition;
}

export interface AutomationWorkflowRun {
  id: number;
  workflowId: number;
  workflowVersionId: number;
  workflowName?: string;
  workflowCode?: string;
  workflowVersion?: number;
  triggerType: string;
  triggerId?: string;
  retryFromRunId?: number;
  retrySequence: number;
  status: string;
  inputJson?: string;
  outputJson?: string;
  errorCategory?: string;
  errorCode?: string;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface AutomationNodeRun {
  id: number;
  runId: number;
  nodeId: string;
  executionKey: string;
  nodeType: string;
  status: string;
  attemptCount: number;
  errorCategory?: string;
  errorCode?: string;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface AutomationAttemptLog {
  id: number;
  runId: number;
  nodeRunId: number;
  attemptNo: number;
  status: string;
  workerId?: string;
  errorCategory?: string;
  errorCode?: string;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
  retryAt?: string;
}

export interface AutomationExecutionEvent {
  id: number;
  runId: number;
  nodeRunId?: number;
  eventType: string;
  eventKey: string;
  payloadJson?: string;
  createdAt: string;
}

export interface WorkflowRunDetail {
  run: AutomationWorkflowRun;
  workflow: AutomationWorkflow;
  version: AutomationWorkflowVersion;
  nodes: AutomationNodeRun[];
  attempts: AutomationAttemptLog[];
  events: AutomationExecutionEvent[];
}

export interface AutomationDeadLetter {
  id: number;
  runId: number;
  nodeRunId: number;
  reasonCode: string;
  status: string;
  handledBy?: number;
  handledAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AutomationEventRecord {
  id: number;
  direction: 'INBOX' | 'OUTBOX';
  sourceType: string;
  eventId: string;
  eventType: string;
  status: string;
  triggerId?: number;
  runId?: number;
  payloadHash: string;
  errorMessage?: string;
  occurredAt?: string;
  receivedAt?: string;
  processedAt?: string;
}

export interface AutomationLoopBatch {
  id: number;
  runId: number;
  nodeId: string;
  executionKey: string;
  status: string;
  totalItems: number;
  completedItems: number;
  failedItems: number;
  cursorIndex: number;
  batchSize: number;
  maxConcurrency: number;
  rateLimitPerSecond: number;
  maxAttempts: number;
  failureThreshold: number;
  nextDispatchAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AutomationLoopItem {
  id: number;
  batchId: number;
  itemIndex: number;
  itemKey: string;
  status: string;
  attemptCount: number;
  errorMessage?: string;
  nextRetryAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AutomationRuntimeMetrics {
  statusCounts: Record<string, number>;
  totalRuns: number;
  activeRuns: number;
  queuedRuns: number;
  waitingRuns: number;
  retryAttempts: number;
  openDeadLetters: number;
  averageDurationMs: number;
  averageQueueDelayMs: number;
  averageWaitDurationMs: number;
  averageNodeDurationMs: number;
  successRate: number;
  failureRate: number;
  generatedAtEpochMs: number;
}

export interface AutomationReconcileResult {
  inspected: number;
  repaired: number;
  activeTerminalRuns: number[];
  unresolvedRuns: number[];
}

export type AutomationTriggerType = 'CRON' | 'WEBHOOK' | 'EVENT' | 'APPROVAL';

export interface AutomationTrigger {
  id: number;
  workflowId: number;
  name: string;
  triggerType: AutomationTriggerType;
  configJson: string;
  overlapPolicy: string;
  status: number;
  nextFireAt?: string;
  lastFireAt?: string;
  publicKey?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AutomationTriggerSecret {
  triggerId?: number;
  providerId?: number;
  publicKey: string;
  webhookPath?: string;
  callbackPath?: string;
  secret: string;
}

interface AutomationPage<T> {
  records: T[];
  total: number;
  current: number;
  size: number;
}

export function fetchWorkflows(params: { page: number; size: number; keyword?: string; status?: string }) {
  return request<{
    records: AutomationWorkflow[];
    total: number;
    current: number;
    size: number;
  }>({
    url: '/automation/workflows',
    method: 'get',
    params
  });
}

export function fetchWorkflowDetail(id: number) {
  return request<WorkflowDetail>({
    url: `/automation/workflows/${id}`,
    method: 'get'
  });
}

export function fetchCreateWorkflow(data: WorkflowUpsertPayload) {
  return request<WorkflowDetail>({
    url: '/automation/workflows',
    method: 'post',
    data
  });
}

export function fetchUpdateWorkflow(id: number, data: WorkflowUpsertPayload) {
  return request<WorkflowDetail>({
    url: `/automation/workflows/${id}`,
    method: 'put',
    data
  });
}

export function fetchValidateWorkflow(id: number) {
  return request<WorkflowValidationResult>({
    url: `/automation/workflows/${id}/validate`,
    method: 'post'
  });
}

export function fetchPublishWorkflow(id: number) {
  return request<WorkflowDetail>({
    url: `/automation/workflows/${id}/publish`,
    method: 'post'
  });
}

export function fetchArchiveWorkflow(id: number) {
  return request<AutomationWorkflow>({ url: `/automation/workflows/${id}/archive`, method: 'post' });
}

export function fetchRestoreWorkflow(id: number) {
  return request<WorkflowDetail>({ url: `/automation/workflows/${id}/restore`, method: 'post' });
}

export function fetchDeleteWorkflow(id: number) {
  return request<void>({ url: `/automation/workflows/${id}`, method: 'delete' });
}

export function fetchStartWorkflow(id: number, data: { input: unknown; variables: unknown }) {
  return request<{
    id: number;
    status: string;
    flowableProcessInstanceId?: string;
  }>({
    url: `/automation/workflows/${id}/runs`,
    method: 'post',
    data
  });
}

export function fetchWorkflowRuns(params: { page: number; size: number; workflowId?: number; status?: string }) {
  return request<AutomationPage<AutomationWorkflowRun>>({ url: '/automation/runs', method: 'get', params });
}

export function fetchWorkflowRunDetail(id: number) {
  return request<WorkflowRunDetail>({ url: `/automation/runs/${id}`, method: 'get' });
}

export function fetchCancelWorkflowRun(id: number) {
  return request<AutomationWorkflowRun>({ url: `/automation/runs/${id}/cancel`, method: 'post' });
}

export function fetchRetryWorkflowRun(id: number) {
  return request<AutomationWorkflowRun>({ url: `/automation/runs/${id}/retry`, method: 'post' });
}

export function fetchAutomationAttempts(params: {
  page: number;
  size: number;
  runId?: number;
  nodeRunId?: number;
  status?: string;
}) {
  return request<AutomationPage<AutomationAttemptLog>>({
    url: '/automation/operations/attempts',
    method: 'get',
    params
  });
}

export function fetchAutomationDeadLetters(params: { page: number; size: number; runId?: number; status?: string }) {
  return request<AutomationPage<AutomationDeadLetter>>({
    url: '/automation/operations/dead-letters',
    method: 'get',
    params
  });
}

export function fetchDiscardAutomationDeadLetter(id: number) {
  return request<AutomationDeadLetter>({
    url: `/automation/operations/dead-letters/${id}/discard`,
    method: 'post'
  });
}

export function fetchRetryAutomationDeadLetter(id: number) {
  return request<AutomationWorkflowRun>({
    url: `/automation/operations/dead-letters/${id}/retry`,
    method: 'post'
  });
}

export function fetchAutomationLoopBatches(params: { page: number; size: number; runId?: number; status?: string }) {
  return request<AutomationPage<AutomationLoopBatch>>({
    url: '/automation/operations/loop-batches',
    method: 'get',
    params
  });
}

export function fetchAutomationLoopItems(batchId: number, params: { page: number; size: number; status?: string }) {
  return request<AutomationPage<AutomationLoopItem>>({
    url: `/automation/operations/loop-batches/${batchId}/items`,
    method: 'get',
    params
  });
}

export function fetchRetryAutomationLoopItems(batchId: number) {
  return request<AutomationLoopBatch>({ url: `/automation/loops/${batchId}/retry-failed`, method: 'post' });
}

export function fetchAutomationEventRecords(
  direction: 'INBOX' | 'OUTBOX',
  params: { page: number; size: number; sourceType?: string; status?: string; eventType?: string }
) {
  return request<AutomationPage<AutomationEventRecord>>({
    url: `/automation/operations/event-${direction.toLowerCase()}`,
    method: 'get',
    params
  });
}

export function fetchAutomationMetrics() {
  return request<AutomationRuntimeMetrics>({ url: '/automation/runs/metrics', method: 'get' });
}

export function fetchReconcileAutomationRuns() {
  return request<AutomationReconcileResult>({ url: '/automation/runs/reconcile', method: 'post' });
}

function triggerPath(type: AutomationTriggerType) {
  return type === 'CRON' ? '' : `/${type.toLowerCase()}`;
}

export function fetchAutomationTriggers(
  type: AutomationTriggerType,
  params: { page: number; size: number; workflowId?: number; status?: number }
) {
  return request<AutomationPage<AutomationTrigger>>({
    url: `/automation/triggers${triggerPath(type)}`,
    method: 'get',
    params
  });
}

export function fetchCreateAutomationTrigger(type: AutomationTriggerType, data: Record<string, unknown>) {
  return request<AutomationTrigger | AutomationTriggerSecret>({
    url: `/automation/triggers/${type.toLowerCase()}`,
    method: 'post',
    data
  });
}

export function fetchUpdateAutomationTrigger(id: number, type: AutomationTriggerType, data: Record<string, unknown>) {
  return request<AutomationTrigger>({
    url: `/automation/triggers/${id}/${type.toLowerCase()}`,
    method: 'put',
    data
  });
}

export function fetchSetAutomationTriggerEnabled(id: number, type: AutomationTriggerType, enabled: boolean) {
  const suffix =
    type === 'CRON' ? `/${enabled ? 'enable' : 'disable'}` : `/${type.toLowerCase()}/${enabled ? 'enable' : 'disable'}`;
  return request<AutomationTrigger>({ url: `/automation/triggers/${id}${suffix}`, method: 'post' });
}

export function fetchRotateAutomationTriggerSecret(id: number, type: 'WEBHOOK' | 'APPROVAL') {
  return request<AutomationTriggerSecret>({
    url: `/automation/triggers/${id}/${type.toLowerCase()}/rotate-secret`,
    method: 'post'
  });
}
