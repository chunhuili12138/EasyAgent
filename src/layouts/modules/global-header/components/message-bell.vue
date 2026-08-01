<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { $t } from '@/locales';
import { request } from '@/service/request';
import { useAuthStore } from '@/store/modules/auth';

defineOptions({ name: 'MessageBell' });

const router = useRouter();
const authStore = useAuthStore();
const unreadCount = ref(0);
const popoverVisible = ref(false);
const recentMessages = ref<any[]>([]);
const loading = ref(false);
let timer: number | null = null;

async function fetchUnread() {
  const tenantId = authStore.userInfo.currentTenantId;
  const { data } = await request<number>({
    url: '/system/message/unread-count',
    method: 'get'
  }) as any;
  if (tenantId === authStore.userInfo.currentTenantId && data != null) unreadCount.value = data;
}

async function fetchRecentMessages() {
  const tenantId = authStore.userInfo.currentTenantId;
  loading.value = true;
  try {
    const { data } = await request<{ records: any[] }>({
      url: '/system/message/page',
      method: 'get',
      params: { current: 1, size: 5 }
    }) as any;
    if (tenantId === authStore.userInfo.currentTenantId) {
      recentMessages.value = data?.records || [];
    }
  } finally {
    loading.value = false;
  }
}

async function handleMarkRead(msg: any) {
  if (msg.isRead === 0) {
    await request({ url: `/system/message/${msg.id}/read`, method: 'put' });
    msg.isRead = 1;
    unreadCount.value = Math.max(0, unreadCount.value - 1);
  }
}

async function handleMarkAllRead() {
  await request({ url: '/system/message/read-all', method: 'put' });
  recentMessages.value.forEach(m => (m.isRead = 1));
  unreadCount.value = 0;
}

function goMessages() {
  popoverVisible.value = false;
  router.push({ name: 'message' });
}

function onPopoverShow() {
  fetchRecentMessages();
}

onMounted(() => {
  fetchUnread();
  timer = window.setInterval(fetchUnread, 30000);
});

watch(
  () => authStore.userInfo.currentTenantId,
  () => {
    unreadCount.value = 0;
    recentMessages.value = [];
    popoverVisible.value = false;
    fetchUnread();
  }
);

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

function formatTime(time: string) {
  if (!time) return '';
  const d = new Date(time);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  return `${d.getMonth() + 1}-${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function getTypeTag(type: string) {
  const map: Record<string, { label: string; type: string }> = {
    system: { label: $t('page.manage.message.info'), type: 'info' },
    alert: { label: $t('page.manage.message.warning'), type: 'warning' },
    operation: { label: $t('page.manage.message.success'), type: 'success' },
    doc_parse: { label: $t('page.manage.message.docParse'), type: 'primary' },
    doc_process: { label: $t('page.manage.message.docProcess'), type: 'success' }
  };
  return map[type] || { label: type, type: 'info' };
}
</script>

<template>
  <ElPopover v-model:visible="popoverVisible" placement="bottom-end" :width="380" trigger="click" @show="onPopoverShow">
    <template #reference>
      <ElBadge :value="unreadCount" :hidden="unreadCount === 0" :max="99">
        <ButtonIcon tooltip-content="">
          <icon-ant-design-bell-outlined />
        </ButtonIcon>
      </ElBadge>
    </template>

    <div>
      <div class="flex items-center justify-between mb-3">
        <span class="text-14px font-medium">{{ $t('page.manage.message.title') }}</span>
        <ElButton type="primary" link size="small" @click="handleMarkAllRead" :disabled="unreadCount === 0">
          {{ $t('page.manage.message.markAllRead') }}
        </ElButton>
      </div>

      <div v-loading="loading">
        <div v-if="recentMessages.length === 0" class="py-8 text-center text-14px text-gray-400">
          {{ $t('common.noData') }}
        </div>
        <div v-else>
          <div
            v-for="msg in recentMessages"
            :key="msg.id"
            class="flex items-start gap-3 py-2 border-b cursor-pointer hover:bg-gray-50"
            @click="handleMarkRead(msg)"
          >
            <ElTag :type="(getTypeTag(msg.type).type as any)" size="small" class="mt-1 flex-shrink-0">
              {{ getTypeTag(msg.type).label }}
            </ElTag>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-13px truncate">{{ msg.title }}</span>
                <ElBadge v-if="msg.isRead === 0" :is-dot="true" class="flex-shrink-0" />
              </div>
              <div class="text-12px text-gray-400 mt-1 truncate">{{ msg.content }}</div>
            </div>
            <span class="text-12px text-gray-400 flex-shrink-0 whitespace-nowrap">{{ formatTime(msg.createdAt) }}</span>
          </div>
        </div>
      </div>

      <div class="mt-3 text-center">
        <ElButton type="primary" link size="small" @click="goMessages">
          查看全部
        </ElButton>
      </div>
    </div>
  </ElPopover>
</template>
