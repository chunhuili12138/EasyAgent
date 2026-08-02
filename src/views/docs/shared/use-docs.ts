import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAppStore } from '@/store/modules/app';
import { docsManifest } from '@/assets/docs/manifest';

const contentModules = import.meta.glob('@/assets/docs/content/**/*.md', { query: '?raw', import: 'default' });

const loadersByLocale = new Map<Docs.Locale, Map<string, () => Promise<string>>>();

Object.entries(contentModules).forEach(([path, loader]) => {
  const parts = path.split('/');
  const contentIndex = parts.indexOf('content');
  const locale = parts[contentIndex + 1] as Docs.Locale | undefined;
  const file = parts.slice(contentIndex + 2).join('/');
  if (!locale || (locale !== 'zh-CN' && locale !== 'en-US') || !file) return;
  if (!loadersByLocale.has(locale)) loadersByLocale.set(locale, new Map());
  loadersByLocale.get(locale)!.set(file, loader as () => Promise<string>);
});

export function useDocs() {
  const appStore = useAppStore();
  const route = useRoute();
  const router = useRouter();

  const locale = computed<Docs.Locale>(() => (appStore.locale === 'en-US' ? 'en-US' : 'zh-CN'));
  const moduleList = computed(() => docsManifest);
  const flatPages = computed(() => docsManifest.flatMap(module => module.pages));

  const activeKey = computed(() => (route.query.page as string) || docsManifest[0].pages[0].key);
  const activePage = computed(() => {
    const index = flatPages.value.findIndex(page => page.key === activeKey.value);
    if (index >= 0) {
      for (const module of docsManifest) {
        if (module.pages.some(page => page.key === activeKey.value)) {
          return { module, page: module.pages.find(page => page.key === activeKey.value)!, index };
        }
      }
    }
    return { module: docsManifest[0], page: docsManifest[0].pages[0], index: 0 };
  });

  const content = ref('');
  const contentMissing = ref(false);

  function pageTitle(page: Docs.PageDef, lang: Docs.Locale) {
    return lang === 'zh-CN' ? page.zhTitle : page.enTitle;
  }

  function moduleTitle(module: Docs.ModuleDef, lang: Docs.Locale) {
    return lang === 'zh-CN' ? module.zhTitle : module.enTitle;
  }

  async function loadContent() {
    const { page } = activePage.value;
    const loaders = loadersByLocale.get(locale.value);
    const loader = loaders?.get(page.file);
    if (!loader) {
      contentMissing.value = true;
      content.value = '';
      return;
    }
    try {
      content.value = await loader();
      contentMissing.value = false;
    } catch (error) {
      console.error(`Failed to load docs content: ${page.file}`, error);
      contentMissing.value = true;
      content.value = '';
    }
  }

  function navigate(pageKey: string) {
    if (pageKey === activeKey.value) return;
    router.push({ path: '/docs', query: { page: pageKey } });
  }

  watch(activeKey, loadContent, { immediate: true });
  watch(locale, loadContent);

  return {
    locale,
    moduleList,
    flatPages,
    activeKey,
    activePage,
    content,
    contentMissing,
    pageTitle,
    moduleTitle,
    navigate
  };
}
