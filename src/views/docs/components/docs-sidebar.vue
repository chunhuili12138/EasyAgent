<script setup lang="ts">
import { computed, ref } from 'vue';
import { $t } from '@/locales';
import { useDocs } from '../shared/use-docs';

defineOptions({ name: 'DocsSidebar' });

const emit = defineEmits<{ close: [] }>();

const { moduleList, activeKey, locale, navigate, pageTitle, moduleTitle } = useDocs();
const keyword = ref('');

const filteredModules = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  if (!kw) return moduleList.value;
  return moduleList.value
    .map(module => ({
      ...module,
      pages: module.pages.filter(
        page => pageTitle(page, locale.value).toLowerCase().includes(kw) || page.key.includes(kw)
      )
    }))
    .filter(module => module.pages.length > 0);
});

function handleNavigate(key: string) {
  navigate(key);
  emit('close');
}
</script>

<template>
  <aside
    class="docs-sidebar h-full w-260px flex flex-col flex-shrink-0 border-r border-[var(--el-border-color-lighter)] bg-[var(--el-bg-color)]"
  >
    <div class="flex-shrink-0 border-b border-[var(--el-border-color-lighter)] p-3">
      <ElInput v-model="keyword" :placeholder="$t('page.docs.searchPlaceholder')" size="small" clearable>
        <template #prefix>
          <SvgIcon icon="mdi:magnify" class="text-[var(--el-text-color-secondary)]" />
        </template>
      </ElInput>
    </div>
    <div class="min-h-0 flex-1 overflow-y-auto p-2">
      <ElEmpty
        v-if="!filteredModules.length"
        :description="$t('page.docs.searchEmpty')"
        :image-size="60"
        class="mt-10"
      />
      <div v-for="module in filteredModules" :key="module.key" class="mb-2">
        <div class="flex flex-y-center gap-1.5 px-2 py-1.5 text-xs text-[var(--el-text-color-secondary)] font-medium">
          <SvgIcon :icon="module.icon" class="text-sm" />
          <span class="truncate">{{ moduleTitle(module, locale) }}</span>
        </div>
        <div
          v-for="page in module.pages"
          :key="page.key"
          class="docs-sidebar__item mb-0.5 flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-[13px] transition-colors hover:bg-[var(--el-fill-color-light)]"
          :class="{ 'docs-sidebar__item--active': activeKey === page.key }"
          @click="handleNavigate(page.key)"
        >
          <span class="truncate">{{ pageTitle(page, locale) }}</span>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.docs-sidebar__item--active {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-left: 3px solid var(--el-color-primary);
  padding-left: 9px;
}

@media (max-width: 767px) {
  .docs-sidebar {
    position: absolute;
    inset: 0 auto 0 0;
    z-index: 40;
    max-width: 80vw;
    box-shadow: var(--el-box-shadow-light);
  }
}
</style>
