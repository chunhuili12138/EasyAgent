<script setup lang="ts">
import { ref } from 'vue';
import { useMediaQuery } from '@vueuse/core';
import DocsContent from './components/docs-content.vue';
import DocsHeader from './components/docs-header.vue';
import DocsSidebar from './components/docs-sidebar.vue';
import DocsToc from './components/docs-toc.vue';

defineOptions({ name: 'DocsPage' });

const isMobile = useMediaQuery('(max-width: 767px)');
const sidebarOpen = ref(false);
const headings = ref<Docs.TocItem[]>([]);
const activeHeading = ref('');
</script>

<template>
  <div class="docs-shell h-full flex flex-col overflow-hidden bg-[var(--el-bg-color-page)]">
    <DocsHeader @toggle-sidebar="sidebarOpen = !sidebarOpen" />
    <div class="relative min-h-0 flex flex-1">
      <DocsSidebar v-if="!isMobile || sidebarOpen" @close="sidebarOpen = false" />
      <div
        v-if="isMobile && sidebarOpen"
        class="docs-shell__mask absolute inset-0 z-30 bg-black/40"
        @click="sidebarOpen = false"
      />
      <DocsContent v-model:headings="headings" v-model:active-heading="activeHeading" />
      <DocsToc v-if="!isMobile" :headings="headings" :active-heading="activeHeading" />
    </div>
  </div>
</template>

<style scoped>
@media print {
  :global(.docs-shell) {
    height: auto;
    overflow: visible;
  }

  :global(.docs-header),
  :global(.docs-sidebar),
  :global(.docs-toc) {
    display: none !important;
  }

  :global(.docs-content) {
    overflow: visible !important;
  }
}
</style>
