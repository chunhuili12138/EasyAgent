<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import DOMPurify from 'dompurify';
import {
  type ChatMode,
  type SessionAttachment,
  createChatStreamUrl,
  fetchCancelChatExecution,
  fetchCancelClarification,
  fetchCreateSession,
  fetchDeleteSession,
  fetchDeleteSessionAttachment,
  fetchHitlConfirm,
  fetchPendingClarification,
  fetchPendingHitl,
  fetchRetrySessionAttachment,
  fetchSessionAttachments,
  fetchSessionMessages,
  fetchSessions,
  fetchSubmitFeedback,
  fetchUpdateSession,
  fetchUploadSessionAttachment
} from '@/service/api/rag';
import { getToken } from '@/store/modules/auth/shared';
import { createSseParser, incompleteChatStreamMessage } from '@/utils/sse';
import {
  type ChatCitation,
  formatCitationAnchor,
  groupCitations,
  normalizeAssistantContent,
  normalizeCitations,
  parseAssistantMarkdown
} from '@/utils/chat-display';
import { $t } from '@/locales';

defineOptions({ name: 'RagChat' });

interface Message {
  id?: number;
  role: 'user' | 'assistant' | 'system' | 'thinking' | 'hitl' | 'clarification';
  content: string;
  citations?: ChatCitation[];
  feedback?: number;
  feedbackType?: string;
  feedbackReason?: string;
  streaming?: boolean;
  generationStopped?: boolean;
  status?: string;
  hitlCard?: {
    summary: string;
    riskLevel: string;
    actionType: string;
    toolCode: string;
    toolName?: string;
    details?: any;
  };
  hitlResolved?: boolean;
  hitlDetached?: boolean;
  clarificationPlanId?: number;
  clarificationQuestions?: string[];
  clarificationResolved?: boolean;
  answerMode?: ChatMode;
  answerOptions?: string[];
  answerOptionReason?: string;
  sourceQuestion?: string;
  createdAt?: string;
}

function hitlDetailEntries(msg: Message) {
  const details = msg.hitlCard?.details;
  const presented = details?.presentation?.parameters;
  if (Array.isArray(presented)) {
    return presented.map((item: any) => ({
      key: String(item.key || item.label),
      label: String(item.label || humanizeFieldName(item.key)),
      value: formatHitlDetailValue(item.value),
      source: item.source ? String(item.source) : ''
    }));
  }
  const parameters = details?.params || details?.arguments;
  if (!parameters || typeof parameters !== 'object' || Array.isArray(parameters)) return [];
  return Object.entries(parameters).map(([key, value]) => ({
    key,
    label: humanizeFieldName(key),
    value: formatHitlDetailValue(value),
    source: ''
  }));
}

function humanizeFieldName(key: unknown) {
  return String(key || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

function formatHitlDetailValue(value: unknown) {
  if (Array.isArray(value)) {
    if (!value.length) return '0 项';
    if (value.length === 1) return `1 项：${String(value[0])}`;
    return `${value.length} 项：${String(value[0])} 至 ${String(value[value.length - 1])}`;
  }
  if (value && typeof value === 'object') return JSON.stringify(value);
  return value == null ? '-' : String(value);
}

interface Session {
  id: number;
  title: string;
  isPinned: boolean;
  messageCount: number;
  lastMessageAt: string;
  createdAt: string;
}

const sessions = ref<Session[]>([]);
const currentSession = ref<Session | null>(null);
const messages = ref<Message[]>([]);
const inputText = ref('');
const loading = ref(false);
const sending = ref(false);
const showSidebar = ref(true);
const messageContainer = ref<HTMLElement | null>(null);
const searchKeyword = ref('');
const sessionPage = ref(1);
const sessionTotal = ref(0);
const abortController = ref<AbortController | null>(null);
const currentExecutionId = ref<string | null>(null);
const attachments = ref<SessionAttachment[]>([]);
const attachmentsExpanded = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const uploadingAttachment = ref(false);
const pendingClarificationPlanId = ref<number | null>(null);
const feedbackDialogVisible = ref(false);
const feedbackTarget = ref<Message | null>(null);
const feedbackType = ref('');
const feedbackReason = ref('');
const submittingFeedback = ref(false);
const CHAT_MODE_STORAGE_KEY = 'easy-agent-chat-mode';
const storedChatMode = localStorage.getItem(CHAT_MODE_STORAGE_KEY);
const chatMode = ref<ChatMode>(
  storedChatMode === 'knowledge' || storedChatMode === 'general' ? storedChatMode : 'auto'
);
const chatModeOptions = [
  { label: $t('rag.chat.modeAuto'), value: 'auto', title: $t('rag.chat.modeHint.auto') },
  { label: $t('rag.chat.modeKnowledge'), value: 'knowledge', title: $t('rag.chat.modeHint.knowledge') },
  { label: $t('rag.chat.modeGeneral'), value: 'general', title: $t('rag.chat.modeHint.general') }
];
const feedbackTypeOptions = [
  { label: $t('rag.chat.feedbackTypes.factualMismatch'), value: 'factual_mismatch' },
  { label: $t('rag.chat.feedbackTypes.instructionNotFollowed'), value: 'instruction_not_followed' },
  { label: $t('rag.chat.feedbackTypes.formatIssue'), value: 'format_issue' },
  { label: $t('rag.chat.feedbackTypes.contentError'), value: 'content_error' },
  { label: $t('rag.chat.feedbackTypes.incompleteAnswer'), value: 'incomplete_answer' },
  { label: $t('rag.chat.feedbackTypes.irrelevantAnswer'), value: 'irrelevant_answer' },
  { label: $t('rag.chat.feedbackTypes.other'), value: 'other' }
];
let attachmentPollTimer: number | undefined;

onMounted(() => {
  if (window.innerWidth < 768) showSidebar.value = false;
  loadSessions();
});

onUnmounted(() => {
  if (attachmentPollTimer) window.clearTimeout(attachmentPollTimer);
});

watch(
  () => messages.value.length,
  () => {
    nextTick(() => scrollToBottom());
  },
  { flush: 'post' }
);

watch(chatMode, value => localStorage.setItem(CHAT_MODE_STORAGE_KEY, value));

async function loadSessions() {
  const res = await fetchSessions({ page: sessionPage.value, size: 20, keyword: searchKeyword.value || undefined });
  sessions.value = res.data?.records || [];
  sessionTotal.value = res.data?.total || 0;
}

async function selectSession(session: Session) {
  currentSession.value = session;
  attachmentsExpanded.value = false;
  pendingClarificationPlanId.value = null;
  if (window.innerWidth < 768) showSidebar.value = false;
  messages.value = [];
  await loadMessages(session.id);
  await loadAttachments(session.id);
  await Promise.all([checkPendingHitl(session.id), checkPendingClarification(session.id)]);
}

async function loadMessages(sessionId: number) {
  const res = await fetchSessionMessages(sessionId, { page: 1, size: 100 });
  const msgs = (res.data?.records || []).map((m: any) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    citations: m.citations,
    feedback: m.feedback,
    feedbackType: m.feedbackType,
    feedbackReason: m.feedbackReason,
    answerMode: m.answerMode,
    createdAt: m.createdAt
  })) as Message[];
  messages.value = msgs;
  nextTick(() => scrollToBottom());
}

async function checkPendingHitl(sessionId: number) {
  try {
    const res = await fetchPendingHitl(sessionId);
    if (res.data?.hasPending) {
      messages.value.push({
        role: 'hitl',
        content: '',
        hitlCard: res.data.card,
        streaming: false,
        hitlDetached: true
      });
    }
  } catch {}
}

async function checkPendingClarification(sessionId: number) {
  try {
    const res = await fetchPendingClarification(sessionId);
    if (res.data?.hasPending) {
      pendingClarificationPlanId.value = Number(res.data.planId);
      messages.value.push({
        role: 'clarification',
        content: '',
        clarificationPlanId: Number(res.data.planId),
        clarificationQuestions: Array.isArray(res.data.questions) ? res.data.questions : [],
        streaming: false
      });
    } else {
      pendingClarificationPlanId.value = null;
    }
  } catch {}
}

function activateSession(session: Session, options: { resetMessages?: boolean; resetAttachments?: boolean } = {}) {
  currentSession.value = session;
  pendingClarificationPlanId.value = null;
  attachmentsExpanded.value = false;
  if (options.resetMessages !== false) messages.value = [];
  if (options.resetAttachments !== false) attachments.value = [];
  if (window.innerWidth < 768) showSidebar.value = false;
}

async function createSession() {
  const res = await fetchCreateSession({ title: $t('rag.chat.newSession') });
  if (res.error || !res.data) return null;
  const s: Session = {
    id: res.data.id,
    title: res.data.title || $t('rag.chat.newSession'),
    isPinned: false,
    messageCount: 0,
    lastMessageAt: '',
    createdAt: ''
  };
  sessions.value.unshift(s);
  activateSession(s);
  return s;
}

async function loadAttachments(sessionId: number) {
  if (attachmentPollTimer) window.clearTimeout(attachmentPollTimer);
  const res = await fetchSessionAttachments(sessionId);
  if (currentSession.value?.id !== sessionId) return;
  attachments.value = res.data || [];
  if (attachments.value.some(item => ['uploaded', 'parsing', 'processing'].includes(item.status))) {
    attachmentPollTimer = window.setTimeout(() => void loadAttachments(sessionId), 2000);
  }
}

async function openAttachmentPicker() {
  if (!currentSession.value) await createSession();
  fileInput.value?.click();
}

async function handleAttachmentFiles(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files || []);
  input.value = '';
  if (!currentSession.value || !files.length) return;
  attachmentsExpanded.value = true;
  uploadingAttachment.value = true;
  try {
    for (const file of files) await fetchUploadSessionAttachment(currentSession.value.id, file);
    await loadAttachments(currentSession.value.id);
  } catch (error) {
    ElMessage.error($t('rag.chat.attachmentUploadFailed'));
    console.error('Attachment upload failed', error);
  } finally {
    uploadingAttachment.value = false;
  }
}

async function removeAttachment(attachment: SessionAttachment) {
  if (!currentSession.value) return;
  await fetchDeleteSessionAttachment(currentSession.value.id, attachment.id);
  await loadAttachments(currentSession.value.id);
}

async function retryAttachment(attachment: SessionAttachment) {
  if (!currentSession.value) return;
  await fetchRetrySessionAttachment(currentSession.value.id, attachment.id);
  await loadAttachments(currentSession.value.id);
}

function attachmentStatusLabel(status: string) {
  return $t(`rag.chat.attachmentStatus.${status}` as any);
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function formatAttachmentType(attachment: SessionAttachment) {
  const type = attachment.fileType?.split('/').pop();
  if (type) return type.toUpperCase();
  const extension = attachment.fileName.split('.').pop();
  return extension && extension !== attachment.fileName ? extension.toUpperCase() : $t('rag.chat.unknownFormat');
}

function attachmentPanelSummary() {
  const ready = attachments.value.filter(item => item.status === 'ready').length;
  const failed = attachments.value.filter(item => item.status === 'failed').length;
  const processing = attachments.value.length - ready - failed;
  return [
    ready ? $t('rag.chat.attachmentSummaryReady', { count: ready }) : '',
    processing ? $t('rag.chat.attachmentSummaryProcessing', { count: processing }) : '',
    failed ? $t('rag.chat.attachmentSummaryFailed', { count: failed }) : ''
  ]
    .filter(Boolean)
    .join(' · ');
}

function hasPendingAttachments() {
  return attachments.value.some(item => item.status !== 'ready' && item.status !== 'failed');
}

async function deleteSession(session: Session) {
  await fetchDeleteSession(session.id);
  sessions.value = sessions.value.filter(s => s.id !== session.id);
  if (currentSession.value?.id === session.id) {
    currentSession.value = null;
    messages.value = [];
    attachments.value = [];
    attachmentsExpanded.value = false;
  }
}

async function togglePin(session: Session) {
  const newPinned = !session.isPinned;
  const { data, error } = await fetchUpdateSession(session.id, { isPinned: newPinned });
  if (error || !data) return;
  session.isPinned = newPinned;
}

async function sendMessage(overrideText?: string, overrideMode?: ChatMode) {
  const text = (overrideText ?? inputText.value).trim();
  if (!text || sending.value || hasPendingAttachments()) return;
  if (!currentSession.value) {
    await createSession();
  }
  if (!currentSession.value) return;
  const sessionId = currentSession.value.id;

  if (!overrideText) inputText.value = '';
  sending.value = true;

  const createdAt = new Date().toISOString();
  const userMsg: Message = { role: 'user', content: text, createdAt };
  messages.value.push(userMsg);

  messages.value.push({
    role: 'assistant',
    content: '',
    streaming: true,
    status: $t('rag.chat.statusAnalyzing'),
    sourceQuestion: text,
    answerMode: overrideMode ?? chatMode.value,
    createdAt
  });
  const assistantMsg = messages.value[messages.value.length - 1];
  const clarificationPlanId = pendingClarificationPlanId.value;
  const executionId = crypto.randomUUID();
  currentExecutionId.value = executionId;

  try {
    await streamChat(sessionId, text, assistantMsg, clarificationPlanId, executionId, overrideMode ?? chatMode.value);
    if (clarificationPlanId && pendingClarificationPlanId.value === clarificationPlanId) {
      pendingClarificationPlanId.value = null;
      const card = messages.value.find(item => item.clarificationPlanId === clarificationPlanId);
      if (card) card.clarificationResolved = true;
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      assistantMsg.generationStopped = true;
      assistantMsg.status = undefined;
    } else {
      assistantMsg.content = assistantMsg.content || `[${$t('common.requestFailed')}]`;
      ElMessage.error($t('common.requestFailed'));
      console.error('Chat stream failed', error);
    }
  } finally {
    sending.value = false;
    assistantMsg.streaming = false;
    abortController.value = null;
    currentExecutionId.value = null;
  }
}

async function streamChat(
  sessionId: number,
  msg: string,
  aiMsg: Message,
  clarificationPlanId: number | null,
  executionId: string,
  mode: ChatMode
) {
  const controller = new AbortController();
  abortController.value = controller;

  const url = createChatStreamUrl();
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`
    },
    body: JSON.stringify({ executionId, sessionId, message: msg, clarificationPlanId, mode }),
    signal: controller.signal
  });

  if (!response.ok) {
    aiMsg.content = '[连接失败]';
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let streamCompleted = false;
  const parser = createSseParser(({ event, data }) => {
    try {
      handleSSEEvent(event === 'message' ? 'token' : event, JSON.parse(data), aiMsg);
      if (event === 'done' || event === 'error' || event === 'cancelled' || event === 'timeout') {
        streamCompleted = true;
      }
    } catch (error) {
      console.warn('Invalid chat SSE event', { event, data, error });
    }
  });

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    parser.push(decoder.decode(value, { stream: true }));
    if (streamCompleted) {
      await reader.cancel();
      break;
    }
  }
  if (!streamCompleted) {
    parser.push(decoder.decode());
    parser.finish();
    const fallback = incompleteChatStreamMessage(
      aiMsg.content,
      streamCompleted,
      $t('rag.chat.streamInterrupted')
    );
    if (fallback) {
      aiMsg.content = fallback;
      aiMsg.status = undefined;
    }
  }
}

function handleSSEEvent(type: string, payload: any, aiMsg: Message) {
  switch (type) {
    case 'execution_started':
      if (typeof payload.executionId === 'string') currentExecutionId.value = payload.executionId;
      break;
    case 'thinking':
      aiMsg.status = typeof payload.content === 'string' ? payload.content : '';
      break;
    case 'answer_mode':
      break;
    case 'answer_options':
      aiMsg.answerOptions = Array.isArray(payload.actions) ? payload.actions.map(String) : [];
      aiMsg.answerOptionReason = typeof payload.reason === 'string' ? payload.reason : undefined;
      break;
    case 'token':
      if (typeof payload.content === 'string' && payload.content) {
        aiMsg.status = undefined;
        aiMsg.content += payload.content;
      }
      break;
    case 'citations':
      aiMsg.citations = normalizeCitations(payload.refs);
      break;
    case 'hitl_confirm':
      aiMsg.status = undefined;
      messages.value.push({
        role: 'hitl',
        content: '',
        hitlCard: {
          summary: payload.summary,
          riskLevel: payload.riskLevel || 'medium',
          actionType: payload.actionType,
          toolCode: payload.toolCode,
          toolName: payload.details?.presentation?.toolName,
          details: payload.details
        },
        streaming: false,
        hitlDetached: true
      });
      break;
    case 'hitl_timeout':
      messages.value.push({ role: 'system', content: $t('rag.audit.timeout') ? '[操作已超时]' : '', streaming: false });
      break;
    case 'clarification_required': {
      const planId = Number(payload.planId);
      pendingClarificationPlanId.value = planId;
      messages.value.push({
        role: 'clarification',
        content: '',
        clarificationPlanId: planId,
        clarificationQuestions: Array.isArray(payload.questions) ? payload.questions : [],
        streaming: false
      });
      break;
    }
    case 'done':
      aiMsg.streaming = false;
      aiMsg.status = undefined;
      if (payload.messageId) aiMsg.id = payload.messageId;
      refreshSession();
      break;
    case 'error':
      aiMsg.content += `\n[错误: ${payload.message}]`;
      aiMsg.streaming = false;
      aiMsg.status = undefined;
      break;
    case 'cancelled':
      aiMsg.streaming = false;
      aiMsg.status = undefined;
      aiMsg.generationStopped = true;
      break;
    case 'timeout':
      aiMsg.content = aiMsg.content || $t('rag.chat.streamTimeout');
      aiMsg.streaming = false;
      aiMsg.status = undefined;
      break;
  }
}

function answerModeLabel(mode?: ChatMode) {
  if (mode === 'knowledge') return $t('rag.chat.modeKnowledge');
  if (mode === 'general') return $t('rag.chat.modeGeneral');
  return $t('rag.chat.modeAuto');
}

function answerGenerally(msg: Message) {
  if (!msg.sourceQuestion || sending.value) return;
  void sendMessage(msg.sourceQuestion, 'general');
}

function rephraseQuestion(msg: Message) {
  if (!msg.sourceQuestion) return;
  inputText.value = msg.sourceQuestion;
  nextTick(() => document.querySelector<HTMLTextAreaElement>('.chat-composer textarea')?.focus());
}

async function cancelClarification(msg: Message) {
  if (!currentSession.value || !msg.clarificationPlanId) return;
  try {
    await fetchCancelClarification(currentSession.value.id, msg.clarificationPlanId);
    msg.clarificationResolved = true;
    if (pendingClarificationPlanId.value === msg.clarificationPlanId) {
      pendingClarificationPlanId.value = null;
    }
  } catch {
    ElMessage.error($t('common.requestFailed'));
  }
}

async function refreshSession() {
  if (currentSession.value) {
    const res = await fetchSessions({ page: 1, size: 20 });
    const updated = (res.data?.records || []).find((s: any) => s.id === currentSession.value!.id);
    if (updated) {
      currentSession.value.title = updated.title;
      currentSession.value.messageCount = updated.messageCount;
      currentSession.value.lastMessageAt = updated.lastMessageAt;
    }
  }
}

async function handleFeedback(msg: Message, feedback: number) {
  if (!msg.id) return;
  if (feedback < 0) {
    feedbackTarget.value = msg;
    feedbackType.value = msg.feedbackType || '';
    feedbackReason.value = msg.feedbackReason || '';
    feedbackDialogVisible.value = true;
    return;
  }
  try {
    await fetchSubmitFeedback(msg.id, { feedback });
    msg.feedback = feedback;
    ElMessage.success($t('rag.chat.feedbackSubmitted'));
  } catch {
    ElMessage.error($t('common.requestFailed'));
  }
}

async function submitNegativeFeedback() {
  const msg = feedbackTarget.value;
  if (!msg?.id) return;
  if (!feedbackType.value) {
    ElMessage.warning($t('rag.chat.feedbackTypeRequired'));
    return;
  }
  const reason = feedbackReason.value.trim();
  submittingFeedback.value = true;
  try {
    await fetchSubmitFeedback(msg.id, { feedback: -1, feedbackType: feedbackType.value, reason: reason || undefined });
    msg.feedback = -1;
    msg.feedbackType = feedbackType.value;
    msg.feedbackReason = reason;
    feedbackDialogVisible.value = false;
    feedbackTarget.value = null;
    feedbackType.value = '';
    feedbackReason.value = '';
    ElMessage.success($t('rag.chat.feedbackSubmitted'));
  } catch {
    ElMessage.error($t('common.requestFailed'));
  } finally {
    submittingFeedback.value = false;
  }
}

async function handleHitlAction(msg: Message, confirmed: boolean) {
  if (!currentSession.value) return;
  const sessionId = currentSession.value.id;
  try {
    await fetchHitlConfirm(sessionId, { confirmed });
    msg.hitlResolved = true;
    const resultMsg: Message = {
      role: 'system',
      content: confirmed ? $t('rag.audit.confirmed') : $t('rag.audit.cancelled'),
      streaming: false
    };
    messages.value.push(resultMsg);
    if (confirmed && msg.hitlDetached) {
      const knownIds = new Set(messages.value.map(item => item.id).filter((id): id is number => id !== undefined));
      void waitForResumedResult(sessionId, knownIds);
    }
  } catch {
    ElMessage.error($t('common.requestFailed'));
  }
}

async function waitForResumedResult(sessionId: number, knownIds: Set<number>) {
  for (let attempt = 0; attempt < 300; attempt += 1) {
    await new Promise(resolve => window.setTimeout(resolve, 1000));
    const response = await fetchSessionMessages(sessionId, { page: 1, size: 100 });
    const records = response.data?.records || [];
    const hasNewAssistant = records.some((item: any) => item.role === 'assistant' && item.id && !knownIds.has(item.id));
    if (hasNewAssistant) {
      if (currentSession.value?.id === sessionId) await loadMessages(sessionId);
      await loadSessions();
      return;
    }
    try {
      const pending = await fetchPendingHitl(sessionId);
      if (
        pending.data?.hasPending &&
        currentSession.value?.id === sessionId &&
        !messages.value.some(item => item.role === 'hitl' && !item.hitlResolved)
      ) {
        messages.value.push({
          role: 'hitl',
          content: '',
          hitlCard: pending.data.card,
          streaming: false,
          hitlDetached: true
        });
        return;
      }
    } catch {
      // Keep polling the execution result through transient request failures.
    }
  }
}

async function stopGeneration() {
  const controller = abortController.value;
  const executionId = currentExecutionId.value;
  const sessionId = currentSession.value?.id;
  if (sessionId && executionId) {
    try {
      await fetchCancelChatExecution(sessionId, executionId);
    } catch (error) {
      console.warn('Unable to cancel backend execution', error);
    }
  }
  controller?.abort();
  sending.value = false;
  const aiMsg = messages.value.find(m => m.streaming);
  if (aiMsg) {
    aiMsg.streaming = false;
    aiMsg.status = undefined;
    aiMsg.generationStopped = true;
  }
}

function scrollToBottom() {
  messageContainer.value?.scrollTo({ top: messageContainer.value.scrollHeight, behavior: 'smooth' });
}

function handleKeydown(e: Event | KeyboardEvent) {
  if (!(e instanceof KeyboardEvent)) return;
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

function formatTime(t?: string) {
  if (!t) return '';
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function riskColor(level: string) {
  return { high: '#f56c6c', medium: '#e6a23c', low: '#67c23a' }[level] || '#909399';
}

function copyContent(content: string) {
  navigator.clipboard?.writeText(normalizeAssistantContent(content));
}

function renderContent(content: string) {
  const html = parseAssistantMarkdown(content);
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
}
</script>

<template>
  <div class="chat-shell relative h-full min-h-0 flex overflow-hidden">
    <!-- Left: Session List -->
    <div
      v-if="showSidebar"
      class="session-sidebar h-full min-h-0 w-280px flex flex-col flex-shrink-0 border-r bg-white"
    >
      <div class="border-b p-3">
        <ElInput
          v-model="searchKeyword"
          :placeholder="$t('common.search')"
          size="small"
          clearable
          @clear="loadSessions"
          @keyup.enter="loadSessions"
        >
          <template #prefix><SvgIcon icon="mdi:magnify" class="text-gray-400" /></template>
        </ElInput>
      </div>
      <div class="border-b p-2">
        <ElButton size="small" class="w-full" @click="createSession()">
          <SvgIcon icon="mdi:plus" class="mr-1" />
          {{ $t('rag.chat.newSession') }}
        </ElButton>
      </div>
      <div class="flex-1 overflow-y-auto">
        <div
          v-for="s in sessions"
          :key="s.id"
          class="cursor-pointer px-3 py-2.5 transition-colors hover:bg-gray-50"
          :class="{ 'bg-blue-50 border-l-3 border-l-blue-500': currentSession?.id === s.id }"
          @click="selectSession(s)"
        >
          <div class="flex items-center justify-between">
            <span class="flex-1 truncate text-sm font-medium">{{ s.title }}</span>
            <ElPopconfirm :title="$t('page.manage.process.deleteConfirm')" @confirm="deleteSession(s)">
              <template #reference>
                <span class="ml-1 inline-flex text-xs text-gray-400 hover:text-red-500">
                  <SvgIcon icon="mdi:close" />
                </span>
              </template>
            </ElPopconfirm>
          </div>
          <div class="mt-0.5 text-xs text-gray-400">
            {{ $t('rag.chat.messageCount', { count: s.messageCount || 0 }) }}
          </div>
        </div>
        <ElEmpty v-if="!sessions.length" :description="$t('rag.chat.noSession')" :image-size="60" />
      </div>
    </div>

    <!-- Center: Chat -->
    <div class="min-h-0 min-w-0 flex flex-col flex-1 overflow-hidden">
      <!-- Header -->
      <div class="flex flex-shrink-0 items-center justify-between border-b bg-white px-4 py-2.5">
        <div class="flex items-center gap-2">
          <ElButton size="small" text @click="showSidebar = !showSidebar">
            <SvgIcon :icon="showSidebar ? 'mdi:menu-open' : 'mdi:menu'" class="text-lg" />
          </ElButton>
          <span class="max-w-300px truncate text-sm font-medium">
            {{ currentSession?.title || $t('rag.chat.selectSession') }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <ElButton v-if="currentSession" size="small" text @click="togglePin(currentSession)">
            <SvgIcon
              :icon="currentSession.isPinned ? 'mdi:pin' : 'mdi:pin-outline'"
              class="text-base"
              :class="{ 'text-blue-500': currentSession.isPinned }"
            />
          </ElButton>
        </div>
      </div>

      <!-- Messages -->
      <div ref="messageContainer" class="min-h-0 flex-1 overflow-y-auto bg-gray-50 px-4 py-4">
        <ElEmpty v-if="!messages.length" :description="$t('rag.chat.noMessages')" :image-size="80" class="mt-20" />

        <div v-for="(msg, idx) in messages" :key="idx" class="mb-4">
          <!-- User message -->
          <div v-if="msg.role === 'user'" class="flex justify-end">
            <div class="max-w-75% flex flex-col items-end gap-1">
              <div class="rounded-lg bg-blue-500 px-4 py-2.5 text-sm text-white shadow-sm">
                {{ msg.content }}
              </div>
              <time v-if="formatTime(msg.createdAt)" class="px-1 text-xs text-gray-400" :datetime="msg.createdAt">
                {{ formatTime(msg.createdAt) }}
              </time>
            </div>
          </div>

          <!-- AI message -->
          <div v-else-if="msg.role === 'assistant'" class="min-w-0 flex gap-3">
            <div
              class="mt-1 h-8 w-8 flex flex-shrink-0 items-center justify-center rounded-full from-blue-400 to-purple-500 bg-gradient-to-br text-xs text-white font-bold"
            >
              AI
            </div>
            <div class="max-w-85% min-w-0">
              <div class="overflow-hidden border rounded-lg bg-white px-4 py-2.5 shadow-sm">
                <div v-if="msg.streaming && msg.status" class="flex items-center gap-2 text-sm text-gray-500">
                  <SvgIcon icon="mdi:loading" class="animate-spin text-base text-blue-500" />
                  <span>{{ msg.status }}</span>
                </div>
                <div v-if="msg.content" class="rag-markdown break-words text-sm" v-html="renderContent(msg.content)" />
                <div
                  v-if="msg.streaming && msg.content"
                  class="ml-0.5 inline-block h-4 w-2 animate-pulse bg-blue-500 align-middle"
                />
                <div
                  v-if="msg.generationStopped"
                  class="generation-stopped-notice"
                  :class="{ 'mt-2 border-t pt-2': msg.content }"
                >
                  <SvgIcon icon="mdi:stop-circle-outline" class="flex-shrink-0 text-base" />
                  <span>
                    {{ msg.content ? $t('rag.chat.generationStoppedPartial') : $t('rag.chat.generationStopped') }}
                  </span>
                </div>
              </div>
              <div v-if="msg.answerOptions?.length" class="answer-actions mt-2 flex flex-wrap gap-2">
                <ElButton
                  v-if="msg.answerOptions.includes('general')"
                  size="small"
                  plain
                  type="primary"
                  :disabled="sending"
                  @click="answerGenerally(msg)"
                >
                  <SvgIcon icon="mdi:chat-outline" class="mr-1" />
                  {{ $t('rag.chat.answerGenerally') }}
                </ElButton>
                <ElButton
                  v-if="msg.answerOptions.includes('rephrase')"
                  size="small"
                  plain
                  @click="rephraseQuestion(msg)"
                >
                  <SvgIcon icon="mdi:pencil-outline" class="mr-1" />
                  {{ $t('rag.chat.rephrase') }}
                </ElButton>
              </div>
              <!-- Citations -->
              <div v-if="msg.citations?.length" class="mt-2 flex flex-wrap gap-1.5">
                <ElPopover
                  v-for="(group, ri) in groupCitations(msg.citations)"
                  :key="group.key"
                  placement="top"
                  :width="420"
                  trigger="click"
                >
                  <template #reference>
                    <ElTag size="small" type="info" class="cursor-pointer">
                      {{ group.fileName || `${$t('rag.chat.source')} ${ri + 1}` }}
                      <span v-if="group.items.length > 1" class="ml-1">({{ group.items.length }})</span>
                    </ElTag>
                  </template>
                  <div class="max-h-72 overflow-y-auto text-sm">
                    <div class="mb-2 font-medium">{{ group.fileName || $t('rag.chat.source') }}</div>
                    <div
                      v-for="(ref, chunkIndex) in group.items"
                      :key="String(ref.chunkId ?? chunkIndex)"
                      class="border-t py-2 first:border-t-0 first:pt-0"
                    >
                      <div class="flex items-start justify-between gap-3 text-gray-500">
                        <span>{{ formatCitationAnchor(ref.anchor) || $t('rag.chat.source') }}</span>
                        <code class="flex-shrink-0 text-xs">
                          {{ $t('rag.chat.chunk') }} {{ ref.chunkId ?? chunkIndex + 1 }}
                        </code>
                      </div>
                      <div v-if="ref.snippet" class="mt-2">
                        <div class="mb-1 text-xs text-gray-500 font-medium">{{ $t('rag.chat.evidence') }}</div>
                        <div class="whitespace-pre-wrap text-gray-700 leading-6">{{ ref.snippet }}</div>
                      </div>
                    </div>
                  </div>
                </ElPopover>
              </div>
              <!-- Feedback -->
              <div class="mt-2 flex items-center gap-2">
                <template v-if="msg.content">
                  <ElButton
                    size="small"
                    text
                    :title="$t('rag.chat.like')"
                    :aria-label="$t('rag.chat.like')"
                    :type="msg.feedback === 1 ? 'success' : 'default'"
                    :disabled="!!msg.feedback"
                    @click="handleFeedback(msg, 1)"
                  >
                    <SvgIcon icon="mdi:thumb-up-outline" class="text-sm" />
                  </ElButton>
                  <ElButton
                    size="small"
                    text
                    :title="$t('rag.chat.dislike')"
                    :aria-label="$t('rag.chat.dislike')"
                    :type="msg.feedback === -1 ? 'danger' : 'default'"
                    :disabled="!!msg.feedback"
                    @click="handleFeedback(msg, -1)"
                  >
                    <SvgIcon icon="mdi:thumb-down-outline" class="text-sm" />
                  </ElButton>
                  <ElButton
                    size="small"
                    text
                    :title="$t('rag.chat.copyAnswer')"
                    :aria-label="$t('rag.chat.copyAnswer')"
                    @click="copyContent(msg.content)"
                  >
                    <SvgIcon icon="mdi:content-copy" class="text-sm" />
                  </ElButton>
                </template>
                <div class="ml-auto flex flex-shrink-0 items-center gap-2">
                  <ElTag v-if="msg.answerMode" size="small" effect="plain">
                    {{ answerModeLabel(msg.answerMode) }}
                  </ElTag>
                  <time
                    v-if="formatTime(msg.createdAt)"
                    class="whitespace-nowrap text-xs text-gray-400"
                    :datetime="msg.createdAt"
                  >
                    {{ formatTime(msg.createdAt) }}
                  </time>
                </div>
              </div>
            </div>
          </div>

          <!-- HITL Card -->
          <div v-else-if="msg.role === 'hitl' && !msg.hitlResolved" class="flex justify-center">
            <div class="max-w-md w-full border rounded-xl bg-white px-5 py-3 shadow-sm">
              <div class="mb-3 flex items-center gap-2">
                <div
                  class="h-3 w-3 rounded-full"
                  :style="{ background: riskColor(msg.hitlCard?.riskLevel || 'medium') }"
                />
                <span class="text-sm font-medium">操作确认</span>
              </div>
              <div class="mb-1 text-sm text-gray-700">{{ msg.hitlCard?.summary }}</div>
              <div class="mb-3 text-xs text-gray-400">
                {{ msg.hitlCard?.toolName || msg.hitlCard?.toolCode }} · {{ msg.hitlCard?.actionType }}
                <span v-if="msg.hitlCard?.details?.presentation?.impactCount > 1">
                  · 影响 {{ msg.hitlCard?.details?.presentation?.impactCount }} 项
                </span>
              </div>
              <dl v-if="hitlDetailEntries(msg).length" class="hitl-details mb-3">
                <div v-for="item in hitlDetailEntries(msg)" :key="item.key" class="hitl-detail-row">
                  <dt>{{ item.label }}</dt>
                  <dd :title="item.value">
                    {{ item.value }}
                    <small v-if="item.source">· {{ item.source }}</small>
                  </dd>
                </div>
              </dl>
              <div class="flex gap-2">
                <ElButton size="small" type="primary" @click="handleHitlAction(msg, true)">确认</ElButton>
                <ElButton size="small" @click="handleHitlAction(msg, false)">取消</ElButton>
              </div>
            </div>
          </div>

          <div v-else-if="msg.role === 'clarification' && !msg.clarificationResolved" class="flex justify-center">
            <div class="clarification-card">
              <div class="mb-2 flex items-center gap-2">
                <SvgIcon icon="mdi:comment-question-outline" class="text-lg text-primary" />
                <span class="text-sm font-medium">需要补充信息</span>
              </div>
              <div class="mb-3 text-xs text-gray-500">请在下方输入框回答，系统会从中断处继续规划。</div>
              <ol class="clarification-questions">
                <li v-for="(question, questionIndex) in msg.clarificationQuestions" :key="questionIndex">
                  {{ question }}
                </li>
              </ol>
              <div class="mt-3 flex justify-end">
                <ElButton size="small" @click="cancelClarification(msg)">取消任务</ElButton>
              </div>
            </div>
          </div>

          <!-- System message -->
          <div v-else-if="msg.role === 'system'" class="flex justify-center">
            <span class="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-400">{{ msg.content }}</span>
          </div>
        </div>
      </div>

      <ElDialog v-model="feedbackDialogVisible" :title="$t('rag.chat.feedbackTitle')" width="420px">
        <div class="mb-4">
          <div class="mb-2 text-sm text-gray-600">{{ $t('rag.chat.feedbackType') }}</div>
          <ElRadioGroup v-model="feedbackType" class="grid grid-cols-1 w-full gap-2 sm:grid-cols-2">
            <ElRadio
              v-for="option in feedbackTypeOptions"
              :key="option.value"
              :value="option.value"
              border
              class="!m-0 !w-full"
            >
              {{ option.label }}
            </ElRadio>
          </ElRadioGroup>
        </div>
        <div class="mb-2 text-sm text-gray-600">{{ $t('rag.chat.feedbackReasonOptional') }}</div>
        <ElInput
          v-model="feedbackReason"
          type="textarea"
          :rows="4"
          maxlength="200"
          show-word-limit
          :placeholder="$t('rag.chat.feedbackPlaceholder')"
        />
        <template #footer>
          <ElButton @click="feedbackDialogVisible = false">{{ $t('common.cancel') }}</ElButton>
          <ElButton type="primary" :loading="submittingFeedback" @click="submitNegativeFeedback">
            {{ $t('rag.chat.submitFeedback') }}
          </ElButton>
        </template>
      </ElDialog>

      <!-- Input -->
      <div class="flex-shrink-0 border-t bg-white px-4 py-3">
        <div class="mx-auto max-w-4xl">
          <div v-if="attachments.length" class="attachment-panel mb-2">
            <button
              type="button"
              class="attachment-panel-header"
              :title="$t(attachmentsExpanded ? 'rag.chat.collapseAttachments' : 'rag.chat.expandAttachments')"
              :aria-expanded="attachmentsExpanded"
              @click="attachmentsExpanded = !attachmentsExpanded"
            >
              <span class="attachment-panel-title">
                <SvgIcon icon="mdi:folder-multiple-outline" class="text-base" />
                {{ $t('rag.chat.attachments') }}
                <span class="attachment-count">{{ attachments.length }}</span>
              </span>
              <span class="attachment-panel-summary">{{ attachmentPanelSummary() }}</span>
              <SvgIcon :icon="attachmentsExpanded ? 'mdi:chevron-up' : 'mdi:chevron-down'" class="text-base" />
            </button>
            <div v-show="attachmentsExpanded" class="attachment-list">
              <div
                v-for="attachment in attachments"
                :key="attachment.id"
                class="attachment-row"
                :class="{ 'is-failed': attachment.status === 'failed' }"
              >
                <SvgIcon icon="mdi:file-document-outline" class="flex-shrink-0 text-lg" />
                <div class="attachment-file-info">
                  <div class="attachment-file-name" :title="attachment.fileName">{{ attachment.fileName }}</div>
                  <div class="attachment-file-meta">
                    {{ formatAttachmentType(attachment) }} · {{ formatFileSize(attachment.fileSize) }} ·
                    {{ attachmentStatusLabel(attachment.status) }}
                    <span v-if="attachment.qualityScore != null">
                      · {{ $t('rag.chat.attachmentQuality', { score: attachment.qualityScore }) }}
                    </span>
                  </div>
                  <div v-if="attachment.errorMessage" class="attachment-error" :title="attachment.errorMessage">
                    {{ attachment.errorMessage }}
                  </div>
                </div>
                <SvgIcon
                  v-if="['uploaded', 'parsing', 'processing'].includes(attachment.status)"
                  icon="mdi:loading"
                  class="animate-spin"
                />
                <ElButton
                  v-if="attachment.status === 'failed'"
                  text
                  circle
                  size="small"
                  :title="$t('rag.chat.retryAttachment')"
                  @click.stop="retryAttachment(attachment)"
                >
                  <SvgIcon icon="mdi:refresh" />
                </ElButton>
                <ElButton
                  text
                  circle
                  size="small"
                  :title="$t('rag.chat.removeAttachment')"
                  @click.stop="removeAttachment(attachment)"
                >
                  <SvgIcon icon="mdi:delete-outline" />
                </ElButton>
              </div>
            </div>
          </div>
          <div class="composer-shell">
            <input
              ref="fileInput"
              type="file"
              multiple
              class="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.html,.csv,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.webp"
              @change="handleAttachmentFiles"
            />
            <ElInput
              v-model="inputText"
              type="textarea"
              :rows="1"
              :autosize="{ minRows: 1, maxRows: 5 }"
              :placeholder="$t('rag.chat.inputPlaceholder')"
              :disabled="sending || hasPendingAttachments()"
              class="chat-composer"
              @keydown="handleKeydown"
            />
            <div class="composer-footer">
              <div class="composer-tools">
                <ElButton
                  circle
                  size="small"
                  :loading="uploadingAttachment"
                  :title="$t('rag.chat.addAttachment')"
                  @click="openAttachmentPicker"
                >
                  <SvgIcon icon="mdi:paperclip" class="text-base" />
                </ElButton>
                <div class="chat-mode-control" role="group" :aria-label="$t('rag.chat.answerMode')">
                  <button
                    v-for="option in chatModeOptions"
                    :key="option.value"
                    type="button"
                    class="chat-mode-button"
                    :class="{ active: chatMode === option.value }"
                    :title="option.title"
                    @click="chatMode = option.value as ChatMode"
                  >
                    {{ option.label }}
                  </button>
                </div>
              </div>
              <ElButton v-if="sending" type="danger" size="small" @click="stopGeneration">
                <SvgIcon icon="mdi:stop" class="mr-1" />
                {{ $t('rag.chat.stop') }}
              </ElButton>
              <ElButton
                v-else
                type="primary"
                size="small"
                :disabled="!inputText.trim() || hasPendingAttachments()"
                @click="sendMessage()"
              >
                <SvgIcon icon="mdi:send" class="mr-1" />
                {{ $t('rag.chat.send') }}
              </ElButton>
            </div>
          </div>
          <div v-if="hasPendingAttachments()" class="mt-1 text-xs text-gray-500">
            {{ $t('rag.chat.waitForAttachments') }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.el-textarea__inner) {
  border-radius: 8px;
  padding: 0.6rem 1rem;
  font-size: 0.875rem;
}

.rag-markdown {
  min-width: 0;
  max-width: 100%;
  line-height: 1.7;
  color: var(--el-text-color-primary);
  overflow-wrap: anywhere;
}

.rag-markdown :deep(p) {
  margin: 0 0 0.65rem;
}

.rag-markdown :deep(p:last-child) {
  margin-bottom: 0;
}

.rag-markdown :deep(ul),
.rag-markdown :deep(ol) {
  margin: 0.4rem 0 0.65rem;
  padding-left: 1.4rem;
}

.rag-markdown :deep(li + li) {
  margin-top: 0.25rem;
}

.rag-markdown :deep(li > ul),
.rag-markdown :deep(li > ol) {
  margin-bottom: 0.25rem;
}

.rag-markdown :deep(h1),
.rag-markdown :deep(h2),
.rag-markdown :deep(h3),
.rag-markdown :deep(h4) {
  margin: 1rem 0 0.5rem;
  line-height: 1.4;
  font-weight: 600;
}

.rag-markdown :deep(h1:first-child),
.rag-markdown :deep(h2:first-child),
.rag-markdown :deep(h3:first-child),
.rag-markdown :deep(h4:first-child) {
  margin-top: 0;
}

.rag-markdown :deep(h1) {
  font-size: 1.2rem;
}

.generation-stopped-notice {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  border-color: var(--el-border-color-lighter);
  color: var(--el-text-color-secondary);
  font-size: 0.8125rem;
  line-height: 1.5;
}

.rag-markdown :deep(h2) {
  padding-bottom: 0.3rem;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: 1.08rem;
}

.rag-markdown :deep(h3),
.rag-markdown :deep(h4) {
  font-size: 0.95rem;
}

.rag-markdown :deep(strong) {
  font-weight: 600;
}

.rag-markdown :deep(a) {
  color: var(--el-color-primary);
  text-decoration: none;
  overflow-wrap: anywhere;
}

.rag-markdown :deep(a:hover) {
  text-decoration: underline;
}

.rag-markdown :deep(blockquote) {
  margin: 0.65rem 0;
  border-left: 3px solid var(--el-color-primary-light-5);
  border-radius: 0 4px 4px 0;
  background: var(--el-color-primary-light-9);
  padding: 0.55rem 0.8rem;
  color: var(--el-text-color-regular);
}

.rag-markdown :deep(blockquote p:last-child) {
  margin-bottom: 0;
}

.rag-markdown :deep(hr) {
  margin: 0.9rem 0;
  border: 0;
  border-top: 1px solid var(--el-border-color-lighter);
}

.rag-markdown :deep(code) {
  border-radius: 4px;
  background: var(--el-fill-color-light);
  padding: 0.1rem 0.3rem;
  font-size: 0.85em;
  font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
  overflow-wrap: anywhere;
}

.rag-markdown :deep(pre) {
  margin: 0.65rem 0;
  max-width: 100%;
  overflow-x: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background: var(--el-bg-color-page);
  padding: 0.75rem 0.9rem;
  tab-size: 2;
}

.rag-markdown :deep(pre code) {
  background: transparent;
  padding: 0;
  white-space: pre;
  overflow-wrap: normal;
  line-height: 1.6;
}

.rag-markdown :deep(.rag-table-wrap) {
  max-width: 100%;
  margin: 0.65rem 0;
  overflow-x: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  scrollbar-width: thin;
  scrollbar-color: var(--el-border-color) transparent;
}

.rag-markdown :deep(.rag-table-wrap::-webkit-scrollbar) {
  height: 8px;
}

.rag-markdown :deep(.rag-table-wrap::-webkit-scrollbar-thumb) {
  border-radius: 4px;
  background: var(--el-border-color);
}

.rag-markdown :deep(table) {
  width: max-content;
  min-width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
  line-height: 1.55;
}

.rag-markdown :deep(th),
.rag-markdown :deep(td) {
  min-width: 7rem;
  max-width: 24rem;
  border-right: 1px solid var(--el-border-color-lighter);
  border-bottom: 1px solid var(--el-border-color-lighter);
  padding: 0.5rem 0.7rem;
  text-align: left;
  vertical-align: top;
  overflow-wrap: anywhere;
}

.rag-markdown :deep(th) {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  font-weight: 600;
  white-space: nowrap;
}

.rag-markdown :deep(td:last-child),
.rag-markdown :deep(th:last-child) {
  border-right: 0;
}

.rag-markdown :deep(tr:last-child td) {
  border-bottom: 0;
}

.rag-markdown :deep(tbody tr:nth-child(even)) {
  background: var(--el-fill-color-extra-light);
}

.rag-markdown :deep(tbody tr:hover) {
  background: var(--el-color-primary-light-9);
}

.rag-markdown :deep(img) {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 0.65rem 0;
  border-radius: 6px;
}

.attachment-panel {
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  overflow: hidden;
  background: var(--el-bg-color);
}

.attachment-panel-header {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  min-height: 2.5rem;
  padding: 0.45rem 0.65rem;
  border: 0;
  background: var(--el-fill-color-extra-light);
  color: var(--el-text-color-primary);
  cursor: pointer;
  text-align: left;
}

.attachment-panel-title,
.composer-tools {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.attachment-panel-title {
  font-size: 0.8125rem;
  font-weight: 600;
}

.attachment-count {
  min-width: 1.25rem;
  padding: 0 0.35rem;
  border-radius: 999px;
  background: var(--el-fill-color-darker);
  font-size: 0.6875rem;
  line-height: 1.25rem;
  text-align: center;
}

.attachment-panel-summary {
  overflow: hidden;
  color: var(--el-text-color-secondary);
  font-size: 0.75rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attachment-list {
  border-top: 1px solid var(--el-border-color-lighter);
}

.attachment-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 0.55rem;
  min-height: 3.5rem;
  padding: 0.5rem 0.65rem;
}

.attachment-row + .attachment-row {
  border-top: 1px solid var(--el-border-color-lighter);
}

.attachment-row.is-failed {
  border-color: var(--el-color-danger-light-5);
  color: var(--el-color-danger);
}

.attachment-file-info {
  min-width: 0;
}

.attachment-file-name {
  overflow-wrap: anywhere;
  color: var(--el-text-color-primary);
  font-size: 0.8125rem;
  font-weight: 500;
  line-height: 1.35;
}

.attachment-file-meta,
.attachment-error {
  margin-top: 0.15rem;
  color: var(--el-text-color-secondary);
  font-size: 0.6875rem;
  line-height: 1.35;
}

.attachment-error {
  overflow: hidden;
  color: var(--el-color-danger);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.composer-shell {
  padding: 0.45rem;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  background: var(--el-bg-color);
}

.chat-composer {
  width: 100%;
}

.chat-composer :deep(.el-textarea__inner) {
  padding: 0.35rem 0.45rem 0.5rem;
  border: 0;
  box-shadow: none;
  resize: none;
}

.composer-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 0.25rem;
}

.chat-mode-control {
  display: inline-flex;
  align-items: center;
  height: 1.75rem;
  padding: 2px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 5px;
  background: var(--el-fill-color-light);
}

.chat-mode-button {
  height: 1.375rem;
  padding: 0 0.55rem;
  border: 0;
  border-radius: 3px;
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  font-size: 0.6875rem;
  white-space: nowrap;
}

.chat-mode-button:hover {
  color: var(--el-color-primary);
}

.chat-mode-button.active {
  background: var(--el-bg-color);
  box-shadow: 0 1px 2px rgb(0 0 0 / 8%);
  color: var(--el-color-primary);
  font-weight: 600;
}

.hitl-details {
  display: grid;
  gap: 0.3rem;
  padding: 0.5rem 0;
  border-top: 1px solid var(--el-border-color-lighter);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.hitl-detail-row {
  display: grid;
  grid-template-columns: 5rem minmax(0, 1fr);
  gap: 0.5rem;
  font-size: 0.75rem;
}

.hitl-detail-row dt {
  color: var(--el-text-color-secondary);
}

.hitl-detail-row dd {
  overflow: hidden;
  margin: 0;
  color: var(--el-text-color-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.clarification-card {
  width: min(32rem, 100%);
  padding: 1rem;
  border: 1px solid var(--el-color-primary-light-7);
  border-radius: 6px;
  background: var(--el-color-primary-light-9);
}

.clarification-questions {
  display: grid;
  gap: 0.4rem;
  margin: 0;
  padding-left: 1.25rem;
  color: var(--el-text-color-primary);
  font-size: 0.875rem;
  line-height: 1.5;
}

@media (max-width: 767px) {
  .session-sidebar {
    position: absolute;
    inset: 0 auto 0 0;
    z-index: 20;
    width: min(280px, calc(100% - 48px));
    box-shadow: var(--el-box-shadow-light);
  }
}
</style>
