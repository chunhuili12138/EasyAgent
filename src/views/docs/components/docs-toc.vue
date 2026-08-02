<script setup lang="ts">
import { $t } from '@/locales';

defineOptions({ name: 'DocsToc' });

defineProps<{ headings: Docs.TocItem[]; activeHeading: string }>();

function scrollToHeading(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
</script>

<template>
  <aside
    class="docs-toc hidden w-240px flex-shrink-0 overflow-y-auto border-l border-[var(--el-border-color-lighter)] px-4 py-6 xl:block"
  >
    <div class="mb-3 text-xs text-[var(--el-text-color-secondary)] font-medium">{{ $t('page.docs.toc') }}</div>
    <nav v-if="headings.length">
      <a
        v-for="heading in headings"
        :key="heading.id"
        class="block cursor-pointer truncate leading-7 transition-colors hover:text-[var(--el-color-primary)]"
        :class="[
          heading.level === 3 ? 'pl-4 text-[12px]' : 'text-[13px]',
          activeHeading === heading.id
            ? 'font-medium text-[var(--el-color-primary)]'
            : 'text-[var(--el-text-color-regular)]'
        ]"
        @click="scrollToHeading(heading.id)"
      >
        {{ heading.text }}
      </a>
    </nav>
    <div v-else class="text-xs text-[var(--el-text-color-secondary)]">{{ $t('page.docs.tocEmpty') }}</div>
  </aside>
</template>

<style scoped></style>
