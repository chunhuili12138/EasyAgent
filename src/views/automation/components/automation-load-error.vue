<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '@/store/modules/auth';
import { $t } from '@/locales';

const props = defineProps<{ message?: string }>();
const emit = defineEmits<{ (e: 'retry'): void }>();
const authStore = useAuthStore();
const t = $t;
const title = computed(() =>
  authStore.userInfo.currentTenantId == null
    ? t('automation.common.tenantRequired')
    : props.message || t('automation.common.loadFailed')
);
</script>

<template>
  <ElAlert :title="title" type="error" :closable="false" show-icon>
    <ElButton link type="danger" @click="emit('retry')">{{ t('automation.common.retryLoad') }}</ElButton>
  </ElAlert>
</template>
