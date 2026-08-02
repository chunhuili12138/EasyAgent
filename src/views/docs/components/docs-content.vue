<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { $t } from '@/locales';
import { enhanceDocsContent, renderMarkdown } from '../shared/markdown';
import { useDocs } from '../shared/use-docs';

defineOptions({ name: 'DocsContent' });

const emit = defineEmits<{
  'update:headings': [value: Docs.TocItem[]];
  'update:active-heading': [value: string];
}>();

const { locale, activeKey, activePage, content, contentMissing, pageTitle, flatPages, navigate } = useDocs();

const articleRef = ref<HTMLElement>();
const scrollRef = ref<HTMLElement>();
const renderedHtml = ref('');
const headings = ref<Docs.TocItem[]>([]);
const activeHeading = ref('');

let observer: IntersectionObserver | null = null;

watch(
  [content, contentMissing],
  async () => {
    if (contentMissing.value) {
      headings.value = [];
      emit('update:headings', []);
      emit('update:active-heading', '');
      return;
    }
    renderedHtml.value = renderMarkdown(content.value);
    await nextTick();
    enhanceContent();
  },
  { immediate: true }
);

function enhanceContent() {
  const container = articleRef.value;
  if (!container) return;

  enhanceDocsContent(container, {
    copy: $t('page.docs.copy'),
    copied: $t('page.docs.copied')
  });

  const items: Docs.TocItem[] = [];
  container.querySelectorAll('h2, h3').forEach(heading => {
    if (!heading.id) return;
    items.push({ id: heading.id, text: heading.textContent?.trim() ?? '', level: Number(heading.tagName[1]) });
  });
  headings.value = items;
  emit('update:headings', items);
  setupScrollSpy();
}

function setupScrollSpy() {
  observer?.disconnect();
  const scrollContainer = scrollRef.value;
  if (!scrollContainer) return;
  observer = new IntersectionObserver(
    entries => {
      const visible = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible.length > 0) {
        activeHeading.value = visible[0].target.id;
        emit('update:active-heading', visible[0].target.id);
      }
    },
    { root: scrollContainer, rootMargin: '-72px 0px -60% 0px', threshold: 0 }
  );
  headings.value.forEach(item => {
    const el = scrollContainer.querySelector(`#${CSS.escape(item.id)}`);
    if (el) observer?.observe(el);
  });
}

function handlePrint() {
  window.print();
}

watch(activeKey, () => {
  scrollRef.value?.scrollTo({ top: 0 });
});

onBeforeUnmount(() => {
  observer?.disconnect();
});
</script>

<template>
  <div ref="scrollRef" class="docs-content min-h-0 min-w-0 flex-1 overflow-y-auto">
    <article ref="articleRef" class="doc-article mx-auto max-w-860px min-h-full w-full px-6 py-8">
      <template v-if="contentMissing">
        <ElEmpty :description="$t('page.docs.underConstruction')" class="mt-24" />
      </template>
      <template v-else>
        <div class="mb-6">
          <h1 class="text-2xl text-[var(--el-text-color-primary)] font-bold">
            {{ pageTitle(activePage.page, locale) }}
          </h1>
          <div class="mt-2 flex items-center justify-between">
            <span class="flex flex-y-center gap-1 text-xs text-[var(--el-text-color-secondary)]">
              <SvgIcon icon="mdi:folder-outline" class="text-sm" />
              {{ activePage.module.zhTitle }}（{{
                locale === 'zh-CN' ? activePage.module.zhTitle : activePage.module.enTitle
              }}）
            </span>
            <ElButton text size="small" class="hidden sm:inline-flex" @click="handlePrint">
              <SvgIcon icon="mdi:printer-outline" class="mr-1" />
              {{ $t('page.docs.print') }}
            </ElButton>
          </div>
          <ElDivider class="!mt-4" />
        </div>

        <div class="doc-markdown" v-html="renderedHtml" />

        <div
          class="mt-10 flex items-center justify-between gap-4 border-t border-[var(--el-border-color-lighter)] pt-5"
        >
          <div class="min-w-0 flex-1">
            <template v-if="flatPages.length > 0">
              <div v-if="activePage.index" class="docs-pager" @click="navigate(flatPages[activePage.index - 1].key)">
                <div class="docs-pager__label">{{ $t('page.docs.prev') }}</div>
                <div class="docs-pager__title">{{ pageTitle(flatPages[activePage.index - 1], locale) }}</div>
              </div>
            </template>
          </div>
          <div class="min-w-0 flex-1 text-right">
            <template v-if="flatPages.length > 0">
              <div
                v-if="activePage.index < flatPages.length - 1"
                class="docs-pager docs-pager--next"
                @click="navigate(flatPages[activePage.index + 1].key)"
              >
                <div class="docs-pager__label">{{ $t('page.docs.next') }}</div>
                <div class="docs-pager__title">{{ pageTitle(flatPages[activePage.index + 1], locale) }}</div>
              </div>
            </template>
          </div>
        </div>
      </template>
    </article>
  </div>
</template>

<style scoped>
.doc-markdown {
  color: var(--el-text-color-primary);
  font-size: 14px;
  line-height: 1.8;
}

.doc-markdown :deep(h2) {
  margin: 2rem 0 0.75rem;
  padding-bottom: 0.4rem;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: 1.25rem;
  font-weight: 600;
  scroll-margin-top: 72px;
}

.doc-markdown :deep(h3) {
  margin: 1.5rem 0 0.5rem;
  font-size: 1.05rem;
  font-weight: 600;
  scroll-margin-top: 72px;
}

.doc-markdown :deep(h4) {
  margin: 1.25rem 0 0.5rem;
  font-size: 0.95rem;
  font-weight: 600;
}

.doc-markdown :deep(p) {
  margin: 0 0 0.75rem;
}

.doc-markdown :deep(ul),
.doc-markdown :deep(ol) {
  margin: 0.25rem 0 0.75rem;
  padding-left: 1.5rem;
}

.doc-markdown :deep(li) {
  margin: 0.2rem 0;
}

.doc-markdown :deep(li > ul),
.doc-markdown :deep(li > ol) {
  margin: 0.2rem 0;
}

.doc-markdown :deep(a) {
  color: var(--el-color-primary);
  text-decoration: none;
}

.doc-markdown :deep(a:hover) {
  text-decoration: underline;
}

.doc-markdown :deep(strong) {
  font-weight: 600;
}

.doc-markdown :deep(code) {
  border-radius: 4px;
  background: var(--el-fill-color-light);
  padding: 0.12rem 0.35rem;
  font-size: 0.85em;
  font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
}

.doc-markdown :deep(.doc-table-wrap) {
  margin: 0.5rem 0 1rem;
  overflow-x: auto;
}

.doc-markdown :deep(table) {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.doc-markdown :deep(th) {
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-light);
  padding: 8px 12px;
  font-weight: 600;
  text-align: left;
  white-space: nowrap;
}

.doc-markdown :deep(td) {
  border: 1px solid var(--el-border-color-lighter);
  padding: 8px 12px;
  vertical-align: top;
}

.doc-markdown :deep(tr:nth-child(2n)) {
  background: var(--el-fill-color-blank);
}

.doc-markdown :deep(tr:nth-child(2n + 1)) {
  background: var(--el-fill-color-lighter);
}

.doc-markdown :deep(.doc-code-block) {
  margin: 0.75rem 0 1rem;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  overflow: hidden;
}

.doc-markdown :deep(.doc-code-header) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.doc-markdown :deep(.doc-code-lang) {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.doc-markdown :deep(.doc-copy-btn) {
  border: none;
  background: transparent;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  cursor: pointer;
}

.doc-markdown :deep(.doc-copy-btn:hover) {
  color: var(--el-color-primary);
}

.doc-markdown :deep(.doc-code-block pre) {
  margin: 0;
  padding: 0.75rem 1rem;
  overflow-x: auto;
  background: var(--el-bg-color-page);
}

.doc-markdown :deep(.doc-code-block pre code) {
  background: transparent;
  padding: 0;
  font-size: 12.5px;
  line-height: 1.7;
}

.doc-markdown :deep(blockquote.doc-callout) {
  margin: 0.75rem 0 1rem;
  border: none;
  border-left: 3px solid;
  border-radius: 0 6px 6px 0;
  padding: 0.6rem 1rem;
  color: var(--el-text-color-primary);
  font-size: 13.5px;
}

.doc-markdown :deep(blockquote.doc-callout--info) {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.doc-markdown :deep(blockquote.doc-callout--warning) {
  border-color: var(--el-color-warning);
  background: var(--el-color-warning-light-9);
}

.doc-markdown :deep(blockquote.doc-callout--success) {
  border-color: var(--el-color-success);
  background: var(--el-color-success-light-9);
}

.doc-markdown :deep(.doc-flow) {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0.75rem 0 1rem;
  padding: 1rem;
  border: 1px dashed var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
}

.doc-markdown :deep(.doc-flow-step) {
  padding: 0.35rem 0.85rem;
  border-radius: 999px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-size: 13px;
}

.doc-markdown :deep(.doc-flow-step:not(:first-child)::before) {
  content: '→';
  margin-right: 0.6rem;
  color: var(--el-text-color-secondary);
}

.doc-markdown :deep(img) {
  max-width: 100%;
  border-radius: 8px;
}

.docs-pager {
  display: inline-block;
  cursor: pointer;
  padding: 0.5rem 0.9rem;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  transition: all 0.2s;
}

.docs-pager:hover {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
}

.docs-pager--next {
  text-align: right;
}

.docs-pager__label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.docs-pager__title {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
@media (max-width: 767px) {
  .doc-article {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}
</style>
