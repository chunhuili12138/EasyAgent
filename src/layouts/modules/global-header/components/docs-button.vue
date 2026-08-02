<script setup lang="ts">
import { useRouter } from 'vue-router';
import { $t } from '@/locales';

defineOptions({ name: 'DocsButton' });

const router = useRouter();

function openDocs() {
  router.push({ path: '/docs' });
}
</script>

<template>
  <ButtonIcon icon="mdi:book-open-page-variant-outline" :tooltip-content="$t('page.docs.button')" @click="openDocs" />
</template>

<style scoped></style>
