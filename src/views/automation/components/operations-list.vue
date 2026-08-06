<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  type AutomationAttemptLog,
  type AutomationDeadLetter,
  type AutomationEventRecord,
  fetchAutomationAttempts,
  fetchAutomationDeadLetters,
  fetchAutomationEventRecords,
  fetchDiscardAutomationDeadLetter,
  fetchRetryAutomationDeadLetter
} from '@/service/api/automation';
import { fetchRagAclOptions } from '@/service/api/rag';
import { formatAutomationTime as formatTime } from '@/utils/automation-time';
import { $t } from '@/locales';
import {
  automationEventTypeLabel,
  automationFailureTypeLabel,
  automationSourceTypeLabel,
  automationStatusLabel
} from '../automation-enum-label';
import AutomationConfigHelp from './automation-config-help.vue';
import AutomationLoadError from './automation-load-error.vue';

type Mode = 'log' | 'failure' | 'event';

const props = defineProps<{ mode: Mode }>();
const t = $t;

const loading = ref(false);
const loadError = ref('');
const records = ref<Array<AutomationAttemptLog | AutomationDeadLetter | AutomationEventRecord>>([]);
const total = ref(0);
const direction = ref<'INBOX' | 'OUTBOX'>('INBOX');
const helpVisible = ref(false);
const handlerNames = ref<Record<number, string>>({});
const query = reactive({
  page: 1,
  size: 20,
  runId: undefined as number | undefined,
  nodeRunId: undefined as number | undefined,
  status: '',
  eventType: '',
  sourceType: ''
});

const statusOptions = computed(() => {
  if (props.mode === 'failure') return ['OPEN', 'REPLAYED', 'DISCARDED'];
  if (props.mode === 'log') return ['RUNNING', 'SUCCESS', 'FAILED', 'RETRY_WAIT'];
  return direction.value === 'OUTBOX'
    ? ['PENDING', 'PUBLISHED']
    : ['RECEIVED', 'STARTED', 'PROCESSED', 'MATCHED', 'UNMATCHED', 'REJECTED'];
});

const title = computed(
  () =>
    ({
      log: t('automation.operations.logTitle'),
      failure: t('automation.operations.failureTitle'),
      event: t('automation.operations.eventTitle')
    })[props.mode]
);
const subtitle = computed(
  () =>
    ({
      log: t('automation.operations.logDescription'),
      failure: t('automation.operations.failureDescription'),
      event: t('automation.operations.eventDescription')
    })[props.mode]
);

async function loadData() {
  loading.value = true;
  try {
    let response: any;
    if (props.mode === 'log') {
      response = await fetchAutomationAttempts({
        page: query.page,
        size: query.size,
        runId: query.runId,
        nodeRunId: query.nodeRunId,
        status: query.status || undefined
      });
    } else if (props.mode === 'failure') {
      response = await fetchAutomationDeadLetters({
        page: query.page,
        size: query.size,
        runId: query.runId,
        status: query.status || undefined
      });
    } else {
      response = await fetchAutomationEventRecords(direction.value, {
        page: query.page,
        size: query.size,
        status: query.status || undefined,
        eventType: query.eventType || undefined,
        sourceType: direction.value === 'INBOX' ? query.sourceType || undefined : undefined
      });
    }
    if (response.error || !response.data) {
      records.value = [];
      total.value = 0;
      loadError.value = response.error?.message || t('automation.common.loadFailed');
    } else {
      loadError.value = '';
      records.value = response.data.records || [];
      total.value = response.data.total || 0;
    }
  } finally {
    loading.value = false;
  }
}

function search() {
  query.page = 1;
  loadData();
}

function reset() {
  query.runId = undefined;
  query.nodeRunId = undefined;
  query.status = '';
  query.eventType = '';
  query.sourceType = '';
  search();
}

function statusType(status: string) {
  if (['SUCCESS', 'PUBLISHED', 'STARTED', 'MATCHED', 'PROCESSED', 'REPLAYED'].includes(status)) return 'success';
  if (['FAILED', 'REJECTED', 'OPEN'].includes(status)) return 'danger';
  if (['RUNNING', 'RECEIVED', 'PENDING', 'RETRY_WAIT'].includes(status)) return 'warning';
  return 'info';
}

async function loadHandlerNames() {
  const { data } = await fetchRagAclOptions();
  handlerNames.value = Object.fromEntries((data?.users || []).map(user => [user.id, user.name]));
}

function handlerLabel(id?: number) {
  if (id == null) return '-';
  return handlerNames.value[id] || t('automation.operations.userId', { id });
}

async function discardDeadLetter(row: AutomationDeadLetter) {
  await ElMessageBox.confirm(
    t('automation.operations.discardConfirm', { id: row.id }),
    t('automation.operations.discardTitle'),
    { type: 'warning' }
  );
  const { data } = await fetchDiscardAutomationDeadLetter(row.id);
  if (data) {
    ElMessage.success(t('automation.operations.discarded'));
    loadData();
  }
}

async function retryDeadLetter(row: AutomationDeadLetter) {
  await ElMessageBox.confirm(
    t('automation.operations.retryConfirm', { id: row.runId }),
    t('automation.operations.retryTitle'),
    {
      type: 'warning'
    }
  );
  const { data } = await fetchRetryAutomationDeadLetter(row.id);
  if (data) {
    ElMessage.success(t('automation.operations.retryCreated', { id: data.id }));
    loadData();
  }
}

watch(direction, () => {
  query.status = '';
  query.sourceType = '';
  search();
});
onMounted(() => {
  loadData();
  if (props.mode === 'failure') loadHandlerNames();
});
</script>

<template>
  <div class="operations-page" :class="{ 'has-mode-band': mode === 'event' }">
    <header class="page-heading">
      <div>
        <h1>{{ title }}</h1>
        <p>{{ subtitle }}</p>
      </div>
      <div class="heading-actions">
        <ElButton circle :title="t('automation.common.configurationHelp')" @click="helpVisible = true">
          <SvgIcon icon="mdi:help-circle-outline" />
        </ElButton>
        <ElButton circle :title="t('automation.common.refresh')" @click="loadData">
          <SvgIcon icon="mdi:refresh" />
        </ElButton>
      </div>
    </header>

    <div v-if="mode === 'event'" class="mode-band">
      <ElSegmented
        v-model="direction"
        :options="[
          { label: t('automation.operations.inbox'), value: 'INBOX' },
          { label: t('automation.operations.outbox'), value: 'OUTBOX' }
        ]"
      />
    </div>

    <div class="filter-band">
      <ElInputNumber
        v-if="mode !== 'event'"
        v-model="query.runId"
        :min="1"
        :controls="false"
        :placeholder="t('automation.common.runId')"
      />
      <ElInputNumber
        v-if="mode === 'log'"
        v-model="query.nodeRunId"
        :min="1"
        :controls="false"
        :placeholder="t('automation.common.nodeRun')"
      />
      <ElInput
        v-if="mode === 'event'"
        v-model="query.eventType"
        clearable
        :placeholder="t('automation.operations.eventType')"
        @keyup.enter="search"
      />
      <ElSelect
        v-if="mode === 'event' && direction === 'INBOX'"
        v-model="query.sourceType"
        clearable
        :placeholder="t('automation.operations.allSources')"
      >
        <ElOption
          v-for="value in ['INTERNAL', 'WEBHOOK', 'APPROVAL']"
          :key="value"
          :label="automationSourceTypeLabel(value)"
          :value="value"
        />
      </ElSelect>
      <ElSelect v-model="query.status" clearable :placeholder="t('automation.common.allStatus')">
        <ElOption
          v-for="value in statusOptions"
          :key="value"
          :label="automationStatusLabel(value)"
          :value="value"
        />
      </ElSelect>
      <ElButton type="primary" @click="search">{{ t('automation.common.search') }}</ElButton>
      <ElButton @click="reset">{{ t('automation.common.reset') }}</ElButton>
      <span class="result-count">{{ t('automation.common.totalRecords', { count: total }) }}</span>
    </div>

    <div class="table-band">
      <AutomationLoadError v-if="loadError" :message="loadError" @retry="loadData" />
      <ElTable v-if="mode === 'log'" v-loading="loading" :data="records" height="100%" class="records-table">
        <ElTableColumn prop="id" :label="t('automation.common.attempt')" width="100" />
        <ElTableColumn prop="runId" :label="t('automation.common.runId')" width="110" />
        <ElTableColumn prop="nodeRunId" :label="t('automation.common.nodeRun')" width="110" />
        <ElTableColumn prop="attemptNo" :label="t('automation.common.attempts')" width="72" align="center" />
        <ElTableColumn :label="t('automation.common.status')" width="120">
          <template #default="{ row }">
            <ElTag :type="statusType(row.status)" size="small">{{ automationStatusLabel(row.status) }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="workerId" :label="t('automation.common.executor')" min-width="160" show-overflow-tooltip />
        <ElTableColumn :label="t('automation.common.errorCategory')" width="120">
          <template #default="{ row }">{{ automationFailureTypeLabel(row.errorCategory) }}</template>
        </ElTableColumn>
        <ElTableColumn prop="errorCode" :label="t('automation.common.errorCode')" width="160" show-overflow-tooltip />
        <ElTableColumn
          prop="errorMessage"
          :label="t('automation.common.errorSummary')"
          min-width="240"
          show-overflow-tooltip
        />
        <ElTableColumn :label="t('automation.common.startedAt')" width="180">
          <template #default="{ row }">{{ formatTime(row.startedAt) }}</template>
        </ElTableColumn>
        <ElTableColumn :label="t('automation.common.completedAt')" width="180">
          <template #default="{ row }">{{ formatTime(row.completedAt) }}</template>
        </ElTableColumn>
      </ElTable>

      <ElTable v-else-if="mode === 'failure'" v-loading="loading" :data="records" height="100%" class="records-table">
        <ElTableColumn prop="id" :label="t('automation.operations.deadLetterId')" width="100" />
        <ElTableColumn prop="runId" :label="t('automation.common.runId')" width="110" />
        <ElTableColumn prop="nodeRunId" :label="t('automation.common.nodeRun')" width="110" />
        <ElTableColumn :label="t('automation.operations.failureType')" min-width="180">
          <template #default="{ row }">
            <ElTooltip :content="row.reasonCode">
              <span>{{ automationFailureTypeLabel(row.reasonCode) }}</span>
            </ElTooltip>
          </template>
        </ElTableColumn>
        <ElTableColumn :label="t('automation.common.status')" width="120">
          <template #default="{ row }">
            <ElTag :type="statusType(row.status)" size="small">{{ automationStatusLabel(row.status) }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn :label="t('automation.operations.handledBy')" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">{{ handlerLabel(row.handledBy) }}</template>
        </ElTableColumn>
        <ElTableColumn :label="t('automation.common.createdAt')" width="180">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </ElTableColumn>
        <ElTableColumn :label="t('automation.operations.handledAt')" width="180">
          <template #default="{ row }">{{ formatTime(row.handledAt) }}</template>
        </ElTableColumn>
        <ElTableColumn :label="t('automation.common.action')" width="120" fixed="right" align="center">
          <template #default="{ row }">
            <template v-if="row.status === 'OPEN'">
              <ElTooltip :content="t('automation.operations.safeRetry')">
                <ElButton
                  link
                  type="warning"
                  :aria-label="t('automation.operations.safeRetry')"
                  @click="retryDeadLetter(row)"
                >
                  <SvgIcon icon="mdi:restart" />
                </ElButton>
              </ElTooltip>
              <ElTooltip :content="t('automation.operations.discard')">
                <ElButton
                  link
                  type="danger"
                  :aria-label="t('automation.operations.discard')"
                  @click="discardDeadLetter(row)"
                >
                  <SvgIcon icon="mdi:close-circle-outline" />
                </ElButton>
              </ElTooltip>
            </template>
          </template>
        </ElTableColumn>
      </ElTable>

      <ElTable v-else v-loading="loading" :data="records" height="100%" class="records-table">
        <ElTableColumn
          prop="eventId"
          :label="t('automation.operations.eventId')"
          min-width="190"
          show-overflow-tooltip
        />
        <ElTableColumn :label="t('automation.operations.eventType')" min-width="170">
          <template #default="{ row }">
            <ElTooltip :content="row.eventType">
              <span>{{ automationEventTypeLabel(row.eventType) }}</span>
            </ElTooltip>
          </template>
        </ElTableColumn>
        <ElTableColumn :label="t('automation.operations.source')" width="110">
          <template #default="{ row }">{{ automationSourceTypeLabel(row.sourceType) }}</template>
        </ElTableColumn>
        <ElTableColumn :label="t('automation.common.status')" width="120">
          <template #default="{ row }">
            <ElTag :type="statusType(row.status)" size="small">{{ automationStatusLabel(row.status) }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn
          v-if="direction === 'INBOX'"
          prop="triggerId"
          :label="t('automation.operations.trigger')"
          width="100"
        />
        <ElTableColumn
          v-if="direction === 'INBOX'"
          prop="runId"
          :label="t('automation.common.runId')"
          width="100"
        />
        <ElTableColumn
          prop="payloadHash"
          :label="t('automation.common.payloadHash')"
          min-width="220"
          show-overflow-tooltip
        />
        <ElTableColumn
          v-if="direction === 'INBOX'"
          prop="errorMessage"
          :label="t('automation.common.errorSummary')"
          min-width="220"
          show-overflow-tooltip
        />
        <ElTableColumn :label="t('automation.operations.occurredAt')" width="180">
          <template #default="{ row }">{{ formatTime(row.occurredAt) }}</template>
        </ElTableColumn>
        <ElTableColumn v-if="direction === 'INBOX'" :label="t('automation.operations.receivedAt')" width="180">
          <template #default="{ row }">{{ formatTime(row.receivedAt) }}</template>
        </ElTableColumn>
        <ElTableColumn
          :label="
            direction === 'INBOX'
              ? t('automation.operations.processedAt')
              : t('automation.operations.publishedAt')
          "
          width="180"
        >
          <template #default="{ row }">{{ formatTime(row.processedAt) }}</template>
        </ElTableColumn>
      </ElTable>
    </div>

    <footer class="pagination-band">
      <ElPagination
        v-model:current-page="query.page"
        v-model:page-size="query.size"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next"
        @current-change="loadData"
        @size-change="search"
      />
    </footer>
    <AutomationConfigHelp
      v-model="helpVisible"
      :topic="mode === 'log' ? 'log' : mode === 'failure' ? 'failure' : 'event'"
    />
  </div>
</template>

<style scoped>
.operations-page {
  display: grid;
  height: 100%;
  min-width: 0;
  min-height: 0;
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  gap: 12px;
  padding: 18px;
  overflow: hidden;
  background: #f3f5f7;
  color: #303840;
}
.operations-page.has-mode-band {
  grid-template-rows: auto auto auto minmax(0, 1fr) auto;
}
.operations-page > * {
  min-width: 0;
}
.page-heading,
.filter-band,
.mode-band {
  display: flex;
  align-items: center;
}
.page-heading {
  justify-content: space-between;
}
.heading-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
}
.page-heading h1 {
  margin: 0;
  font-size: 20px;
  letter-spacing: 0;
}
.page-heading p {
  margin: 4px 0 0;
  color: #7b848d;
  font-size: 13px;
}
.mode-band,
.filter-band,
.pagination-band {
  padding: 11px 14px;
  background: #fff;
}
.filter-band {
  gap: 10px;
  border-bottom: 1px solid #e2e6e9;
}
.filter-band :deep(.el-input),
.filter-band :deep(.el-input-number) {
  width: 220px;
}
.filter-band :deep(.el-select) {
  width: 170px;
}
.result-count {
  margin-left: auto;
  color: #78818a;
  font-size: 12px;
}
.table-band {
  display: grid;
  min-height: 0;
  grid-template-rows: auto minmax(0, 1fr);
  overflow: hidden;
  padding: 0 14px;
  background: #fff;
}
.records-table {
  min-width: 0;
  min-height: 0;
  grid-row: 2;
}
.pagination-band {
  display: flex;
  min-height: 54px;
  align-items: center;
  justify-content: flex-end;
  overflow: hidden;
}
</style>
