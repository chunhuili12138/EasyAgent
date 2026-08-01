<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  fetchDeleteExperience,
  fetchExperienceDetail,
  fetchExperienceStats,
  fetchExperiences
} from '@/service/api/rag';
import { $t } from '@/locales';
import { visibilityLabel } from '../shared/display';

defineOptions({ name: 'RagExperience' });
const t = $t;
const list = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const size = ref(20);
const loading = ref(false);
const keyword = ref('');
const visibility = ref('');
const minScore = ref<number | undefined>();
const detailVisible = ref(false);
const currentItem = ref<any>({});
const stats = ref<any>({});

onMounted(() => {
  loadData();
  loadStats();
});
async function loadData() {
  loading.value = true;
  try {
    const res = await fetchExperiences({
      page: page.value,
      size: size.value,
      keyword: keyword.value || undefined,
      visibility: visibility.value || undefined,
      minScore: minScore.value
    });
    list.value = res.data?.records || [];
    total.value = res.data?.total || 0;
  } finally {
    loading.value = false;
  }
}
async function loadStats() {
  const res = await fetchExperienceStats();
  stats.value = res.data || {};
}
async function viewItem(item: any) {
  const res = await fetchExperienceDetail(item.id);
  currentItem.value = res.data || {};
  detailVisible.value = true;
}
async function deleteItem(item: any) {
  await ElMessageBox.confirm(t('rag.experience.deleteConfirm'), t('common.tip'), { type: 'warning' });
  await fetchDeleteExperience(item.id);
  ElMessage.success(t('common.deleteSuccess'));
  await Promise.all([loadData(), loadStats()]);
}
function resetSearch() {
  keyword.value = '';
  visibility.value = '';
  minScore.value = undefined;
  page.value = 1;
  loadData();
}
function formatTime(value?: string) {
  return value ? value.replace('T', ' ').substring(0, 19) : '-';
}
function sourceReferences() {
  try {
    const refs = JSON.parse(currentItem.value.citations || '[]');
    return Array.isArray(refs) ? refs : [];
  } catch {
    return [];
  }
}
</script>

<template>
  <div class="page-container h-full">
    <div class="mb-4 flex gap-4">
      <ElCard
        v-for="card in [
          { label: t('rag.quota.total'), v: stats.totalCount },
          { label: t('common.on'), v: stats.activeCount },
          { label: t('rag.experience.eliminated'), v: stats.eliminatedCount }
        ]"
        :key="card.label"
        shadow="never"
        class="flex-1 text-center"
      >
        <div class="text-2xl font-bold">{{ card.v || 0 }}</div>
        <div class="text-sm text-gray-500">{{ card.label }}</div>
      </ElCard>
    </div>
    <ElCard class="w-full">
      <div class="mb-4 flex flex-wrap items-center gap-4">
        <ElInput
          v-model="keyword"
          :placeholder="t('rag.common.keywordPlaceholder')"
          clearable
          class="w-50"
          @keyup.enter="loadData"
        />
        <ElSelect
          v-model="visibility"
          :placeholder="t('rag.experience.visibility')"
          clearable
          class="w-32"
          @change="loadData"
        >
          <ElOption
            v-for="v in ['public', 'department', 'post', 'user']"
            :key="v"
            :label="visibilityLabel(v)"
            :value="v"
          />
        </ElSelect>
        <ElInputNumber v-model="minScore" :min="0" :max="1" :step="0.05" :precision="2" :placeholder="t('rag.experience.minScore')" class="w-36" />
        <ElButton type="primary" @click="loadData">{{ t('rag.common.search') }}</ElButton>
        <ElButton @click="resetSearch">{{ t('common.reset') }}</ElButton>
      </div>
      <ElTable v-loading="loading" :data="list" stripe border class="w-full">
        <ElTableColumn prop="queryText" :label="t('rag.experience.queryText')" min-width="200" show-overflow-tooltip />
        <ElTableColumn prop="qualityScore" :label="t('rag.experience.qualityScore')" width="90" />
        <ElTableColumn prop="hitCount" :label="t('rag.experience.hitCount')" width="80" />
        <ElTableColumn prop="visibility" :label="t('rag.experience.visibility')" width="100">
          <template #default="{ row }">
            <ElTag size="small">{{ visibilityLabel(row.visibility) }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn :label="t('rag.experience.lastHitAt')" width="170">
          <template #default="{ row }">{{ formatTime(row.lastHitAt) }}</template>
        </ElTableColumn>
        <ElTableColumn :label="t('rag.common.action')" width="120" fixed="right" align="center">
          <template #default="{ row }">
            <ElButton size="small" link @click="viewItem(row)">{{ t('rag.common.detail') }}</ElButton>
            <ElButton size="small" link type="danger" :disabled="!row.deletable" @click="deleteItem(row)">
              {{ t('rag.common.delete') }}
            </ElButton>
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
    <ElDialog v-model="detailVisible" :title="t('rag.experience.detailTitle')" width="680px">
      <ElDescriptions :column="1" border>
        <ElDescriptionsItem :label="t('rag.experience.queryText')">{{ currentItem.queryText }}</ElDescriptionsItem>
        <ElDescriptionsItem :label="t('rag.experience.answer')">
          <div class="whitespace-pre-wrap">{{ currentItem.answerContent || '-' }}</div>
        </ElDescriptionsItem>
        <ElDescriptionsItem :label="t('rag.experience.visibility')">
          {{ visibilityLabel(currentItem.visibility) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem :label="t('rag.experience.sourceChunks')">
          <div v-if="sourceReferences().length" class="space-y-2">
            <div v-for="refItem in sourceReferences()" :key="refItem.chunkId" class="rounded border border-gray-200 p-2">
              <div class="font-medium">{{ refItem.fileName || t('rag.experience.unknownSource') }}</div>
              <div v-if="refItem.anchor" class="text-xs text-gray-500">{{ refItem.anchor }}</div>
              <div v-if="refItem.snippet" class="mt-1 whitespace-pre-wrap text-sm">{{ refItem.snippet }}</div>
            </div>
          </div>
          <span v-else>{{ currentItem.sourceChunkIds || '-' }}</span>
        </ElDescriptionsItem>
      </ElDescriptions>
    </ElDialog>
  </div>
</template>
