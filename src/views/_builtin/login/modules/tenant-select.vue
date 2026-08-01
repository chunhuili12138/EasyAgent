<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAuthStore } from '@/store/modules/auth';
import { $t } from '@/locales';

defineOptions({ name: 'TenantSelect' });

const authStore = useAuthStore();

const visible = computed(() => authStore.needsTenantSelection);

const tenants = computed(() => authStore.userInfo.tenants);

const loading = ref(false);

async function handleSelect(tenantId: number) {
  loading.value = true;
  await authStore.selectTenant(tenantId);
  loading.value = false;
}
</script>

<template>
  <ElDialog
    :model-value="visible"
    :close-on-click-modal="false"
    :show-close="false"
    :title="$t('page.manage.tenant.selectTitle')"
    width="420px"
    align-center
  >
    <div class="mb-16px text-14px text-#666">{{ $t('page.manage.tenant.selectDescription') }}</div>
    <div class="flex flex-col gap-12px">
      <ElButton
        v-for="item in tenants"
        :key="item.id"
        :loading="loading"
        size="large"
        class="w-full !h-48px !ml-0"
        @click="handleSelect(item.id)"
      >
        {{ item.name }}
      </ElButton>
    </div>
  </ElDialog>
</template>
