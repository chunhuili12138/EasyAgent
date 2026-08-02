<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAppStore } from '@/store/modules/app';
import { useRouteStore } from '@/store/modules/route';
import { useThemeStore } from '@/store/modules/theme';
import { $t } from '@/locales';

defineOptions({ name: 'DocsHeader' });

defineEmits<{ toggleSidebar: [] }>();

const router = useRouter();
const appStore = useAppStore();
const themeStore = useThemeStore();
const routeStore = useRouteStore();

function goBack() {
  router.push({ name: routeStore.routeHome });
}

function changeLang(lang: App.I18n.LangType) {
  appStore.changeLocale(lang);
}
</script>

<template>
  <DarkModeContainer
    class="docs-header z-10 h-56px flex flex-shrink-0 items-center justify-between px-12px shadow-header"
  >
    <div class="min-w-0 flex flex-y-center gap-2">
      <ElButton
        text
        circle
        class="docs-header__menu !hidden"
        :aria-label="$t('page.docs.menu')"
        @click="$emit('toggleSidebar')"
      >
        <SvgIcon icon="mdi:menu" class="text-lg" />
      </ElButton>
      <ElButton text circle :aria-label="$t('page.docs.back')" @click="goBack">
        <SvgIcon icon="mdi:arrow-left" class="text-lg" />
      </ElButton>
      <div class="flex flex-y-center gap-2">
        <SvgIcon icon="mdi:book-open-page-variant-outline" class="text-xl text-[var(--el-color-primary)]" />
        <span class="text-sm font-bold">{{ $t('page.docs.title') }}</span>
        <span class="hidden text-xs text-[var(--el-text-color-secondary)] sm:inline">
          {{ $t('page.docs.subtitle') }}
        </span>
      </div>
    </div>
    <div class="flex flex-y-center gap-1">
      <ElDropdown trigger="click">
        <div>
          <ButtonIcon icon="mdi:translate" :tooltip-content="$t('page.docs.lang')" tooltip-placement="bottom" />
        </div>
        <template #dropdown>
          <ElDropdownMenu>
            <ElDropdownItem
              v-for="option in appStore.localeOptions"
              :key="option.key"
              class="mx-4px my-1px"
              :class="{ 'is-active': appStore.locale === option.key }"
              @click="changeLang(option.key)"
            >
              {{ option.label }}
            </ElDropdownItem>
          </ElDropdownMenu>
        </template>
      </ElDropdown>
      <ButtonIcon
        :icon="themeStore.darkMode ? 'material-symbols:nightlight-rounded' : 'material-symbols:sunny'"
        :tooltip-content="themeStore.darkMode ? $t('page.docs.lightMode') : $t('page.docs.darkMode')"
        @click="themeStore.toggleThemeScheme"
      />
    </div>
  </DarkModeContainer>
</template>

<style scoped>
@media (max-width: 767px) {
  .docs-header__menu {
    display: inline-flex;
  }
}
</style>
