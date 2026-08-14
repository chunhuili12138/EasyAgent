import { $t } from '@/locales';

type EnumLabelMap = Record<string, App.I18n.I18nKey>;

const statusKeys: EnumLabelMap = {
  DRAFT: 'automation.enum.status.draft',
  PUBLISHED: 'automation.enum.status.published',
  DISABLED: 'automation.enum.status.disabled',
  ARCHIVED: 'automation.enum.status.archived',
  SUPERSEDED: 'automation.enum.status.superseded',
  CREATED: 'automation.enum.status.created',
  QUEUED: 'automation.enum.status.queued',
  PENDING: 'automation.enum.status.pending',
  READY: 'automation.enum.status.ready',
  READY_TO_RESUME: 'automation.enum.status.readyToResume',
  RUNNING: 'automation.enum.status.running',
  WAITING: 'automation.enum.status.waiting',
  WAITING_EVENT: 'automation.enum.status.waitingEvent',
  WAITING_TIMER: 'automation.enum.status.waitingTimer',
  PENDING_APPROVAL: 'automation.enum.status.pendingApproval',
  RETRY_WAIT: 'automation.enum.status.retryWait',
  SUCCESS: 'automation.enum.status.success',
  PARTIAL_FAILURE: 'automation.enum.status.partialFailure',
  FAILED: 'automation.enum.status.failed',
  CANCELLED: 'automation.enum.status.cancelled',
  SKIPPED: 'automation.enum.status.skipped',
  OPEN: 'automation.enum.status.open',
  REPLAYED: 'automation.enum.status.replayed',
  DISCARDED: 'automation.enum.status.discarded',
  RECEIVED: 'automation.enum.status.received',
  PROCESSED: 'automation.enum.status.processed',
  STARTED: 'automation.enum.status.started',
  MATCHED: 'automation.enum.status.matched',
  UNMATCHED: 'automation.enum.status.unmatched',
  REJECTED: 'automation.enum.status.rejected',
  APPROVED: 'automation.enum.status.approved',
  TIMEOUT: 'automation.enum.status.timeout'
};

const triggerTypeKeys: EnumLabelMap = {
  MANUAL: 'automation.enum.triggerType.manual',
  CRON: 'automation.enum.triggerType.cron',
  WEBHOOK: 'automation.enum.triggerType.webhook',
  EVENT: 'automation.enum.triggerType.event',
  APPROVAL: 'automation.enum.triggerType.approval',
  RETRY: 'automation.enum.triggerType.retry',
  SUBFLOW: 'automation.enum.triggerType.subflow'
};

const overlapPolicyKeys: EnumLabelMap = {
  SKIP: 'automation.trigger.overlap.skip',
  QUEUE: 'automation.trigger.overlap.queue',
  PARALLEL: 'automation.trigger.overlap.parallel',
  REPLACE: 'automation.trigger.overlap.replace'
};

const sourceTypeKeys: EnumLabelMap = {
  INTERNAL: 'automation.enum.sourceType.internal',
  WEBHOOK: 'automation.enum.sourceType.webhook',
  CRON: 'automation.enum.sourceType.cron',
  APPROVAL: 'automation.enum.sourceType.approval'
};

const failureTypeKeys: EnumLabelMap = {
  VALIDATION: 'automation.enum.failureType.validation',
  AUTH: 'automation.enum.failureType.auth',
  RATE_LIMIT: 'automation.enum.failureType.rateLimit',
  TIMEOUT: 'automation.enum.failureType.timeout',
  TRANSIENT: 'automation.enum.failureType.transient',
  BUSINESS: 'automation.enum.failureType.business',
  POLICY: 'automation.enum.failureType.policy',
  CANCELLED: 'automation.enum.failureType.cancelled',
  UNKNOWN: 'automation.enum.failureType.unknown'
};

const eventTypeKeys: EnumLabelMap = {
  approval: 'automation.enum.eventType.approval',
  webhook: 'automation.enum.eventType.webhook',
  'after_sales.acceptance': 'automation.enum.eventType.afterSalesAcceptance',
  RUN_STARTED: 'automation.enum.eventType.runStarted',
  RUN_COMPLETED: 'automation.enum.eventType.runCompleted',
  RUN_CANCELLED: 'automation.enum.eventType.runCancelled',
  RUN_RETRIED: 'automation.enum.eventType.runRetried',
  RUN_RECONCILED: 'automation.enum.eventType.runReconciled',
  NODE_STARTED: 'automation.enum.eventType.nodeStarted',
  NODE_COMPLETED: 'automation.enum.eventType.nodeCompleted',
  NODE_FAILED: 'automation.enum.eventType.nodeFailed',
  NODE_FAILED_HANDLED: 'automation.enum.eventType.nodeFailedHandled',
  NODE_RETRY_SCHEDULED: 'automation.enum.eventType.nodeRetryScheduled',
  EVENT_WAIT_STARTED: 'automation.enum.eventType.eventWaitStarted',
  EVENT_WAIT_COMPLETED: 'automation.enum.eventType.eventWaitCompleted',
  EXTERNAL_EVENT_RECEIVED: 'automation.enum.eventType.externalEventReceived'
};

const nodeTypeKeys: EnumLabelMap = {
  start: 'automation.designer.nodes.start',
  end: 'automation.designer.nodes.end',
  condition: 'automation.designer.nodes.condition',
  parallel: 'automation.designer.nodes.parallel',
  delay: 'automation.designer.nodes.delay',
  wait_event: 'automation.designer.nodes.wait_event',
  batch_loop: 'automation.designer.nodes.batch_loop',
  aggregate: 'automation.designer.nodes.aggregate',
  transform: 'automation.designer.nodes.transform',
  builtin: 'automation.designer.nodes.builtin',
  datasource: 'automation.designer.nodes.datasource',
  skill: 'automation.designer.nodes.skill',
  agent: 'automation.designer.nodes.agent',
  rag: 'automation.designer.nodes.rag',
  llm: 'automation.designer.nodes.llm',
  nl2sql: 'automation.designer.nodes.nl2sql',
  api: 'automation.designer.nodes.api',
  subflow: 'automation.designer.nodes.subflow'
};

function enumLabel(value: unknown, keys: EnumLabelMap) {
  const normalized = String(value ?? '').trim();
  const key = keys[normalized] || keys[normalized.toUpperCase()] || keys[normalized.toLowerCase()];
  return key ? $t(key) : normalized || '-';
}

export const automationStatusLabel = (value: unknown) => enumLabel(value, statusKeys);
export const automationTriggerTypeLabel = (value: unknown) => enumLabel(value, triggerTypeKeys);
export const automationOverlapPolicyLabel = (value: unknown) => enumLabel(value, overlapPolicyKeys);
export const automationSourceTypeLabel = (value: unknown) => enumLabel(value, sourceTypeKeys);
export const automationFailureTypeLabel = (value: unknown) => enumLabel(value, failureTypeKeys);
export const automationEventTypeLabel = (value: unknown) => enumLabel(value, eventTypeKeys);
export const automationNodeTypeLabel = (value: unknown) => enumLabel(value, nodeTypeKeys);
