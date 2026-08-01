<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { fetchGetTenantList } from '@/service/api';
import { useAuthStore } from '@/store/modules/auth';
import { $t } from '@/locales';

defineOptions({ name: 'TenantSwitcher' });

const authStore = useAuthStore();

const allTenants = ref<{ id: number; name: string; code: string }[]>([]);

const showSwitcher = computed(() => authStore.isLogin);

const currentLabel = computed(() => {
  if (authStore.userInfo.currentTenantName) {
    return authStore.userInfo.currentTenantName;
  }
  return $t('page.manage.tenant.globalMode');
});

type DropdownKey = 'global' | number;

const options = computed(() => {
  const opts: { key: DropdownKey; label: string; disabled?: boolean }[] = [];

  if (authStore.isSysAdmin) {
    opts.push({
      label: $t('page.manage.tenant.globalMode'),
      key: 'global',
      disabled: !authStore.userInfo.currentTenantId
    });
  }

  const tenantSource = authStore.isSysAdmin ? allTenants.value : authStore.userInfo.tenants;

  tenantSource.forEach(t => {
    const isActive = t.id === authStore.userInfo.currentTenantId;
    opts.push({
      label: `${t.name}${isActive ? ' ✓' : ''}`,
      key: t.id,
      disabled: isActive
    });
  });

  return opts;
});

async function handleCommand(key: DropdownKey) {
  if (key === 'global') {
    await authStore.clearCurrentTenant();
  } else {
    await authStore.switchCurrentTenant(key as number);
  }
}

onMounted(async () => {
  if (authStore.isSysAdmin) {
    const { data } = await fetchGetTenantList({ current: 1, size: 999 });
    if (data?.records) {
      allTenants.value = data.records.map((r: any) => ({ id: r.id, name: r.name, code: r.code }));
    }
  }
});
</script>

<template>
  <ElDropdown v-if="showSwitcher" trigger="click" @command="handleCommand">
    <ElButton text class="flex-y-center px-8px">
      <SvgIcon icon="ph:buildings" class="mr-4px text-icon-small" />
      <span class="max-w-120px truncate text-13px">{{ currentLabel }}</span>
      <ElIcon class="ml-4px"><SvgIcon icon="ph:caret-down" /></ElIcon>
    </ElButton>
    <template #dropdown>
      <ElDropdownMenu>
        <ElDropdownItem v-for="item in options" :key="String(item.key)" :command="item.key" :disabled="item.disabled">
          {{ item.label }}
        </ElDropdownItem>
      </ElDropdownMenu>
    </template>
  </ElDropdown>
</template>
