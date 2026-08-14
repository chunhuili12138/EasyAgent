<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import type { VNode } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { fetchChangeCurrentPassword, fetchLogout } from '@/service/api';
import { useAuthStore } from '@/store/modules/auth';
import { useRouterPush } from '@/hooks/common/router';
import { useSvgIcon } from '@/hooks/common/icon';
import { useFormRules } from '@/hooks/common/form';
import { localStg } from '@/utils/storage';
import { $t } from '@/locales';

defineOptions({ name: 'UserAvatar' });

const authStore = useAuthStore();
const { toLogin } = useRouterPush();
const { SvgIconVNode } = useSvgIcon();
const { formRules } = useFormRules();

const passwordDialogVisible = ref(false);
const passwordSubmitting = ref(false);
const passwordFormRef = ref<FormInstance>();
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const passwordRules = computed<FormRules>(() => ({
  currentPassword: [{ required: true, message: $t('common.currentPasswordRequired'), trigger: 'blur' }],
  newPassword: [
    ...formRules.pwd,
    {
      asyncValidator: () => {
        if (passwordForm.newPassword === passwordForm.currentPassword) {
          return Promise.reject(new Error($t('common.newPasswordSame')));
        }
        return Promise.resolve();
      },
      trigger: 'blur'
    }
  ],
  confirmPassword: [
    { required: true, message: $t('form.confirmPwd.required'), trigger: 'blur' },
    {
      asyncValidator: () => {
        if (passwordForm.confirmPassword !== passwordForm.newPassword) {
          return Promise.reject(new Error($t('form.confirmPwd.invalid')));
        }
        return Promise.resolve();
      },
      trigger: 'input'
    }
  ]
}));

function loginOrRegister() {
  toLogin();
}

type DropdownKey = 'changePassword' | 'logout';

type DropdownOption = {
  key: DropdownKey;
  label: string;
  icon?: () => VNode;
};

const options = computed(() => {
  const opts: DropdownOption[] = [
    {
      label: $t('common.changePassword'),
      key: 'changePassword',
      icon: SvgIconVNode({ icon: 'ph:key', fontSize: 18 })
    },
    {
      label: $t('common.logout'),
      key: 'logout',
      icon: SvgIconVNode({ icon: 'ph:sign-out', fontSize: 18 })
    }
  ];

  return opts;
});

function logout() {
  window.$messageBox
    ?.confirm($t('common.logoutConfirm'), $t('common.tip'), {
      confirmButtonText: $t('common.confirm'),
      cancelButtonText: $t('common.cancel'),
      type: 'warning'
    })
    .then(async () => {
      await logoutAndReset();
    });
}

async function logoutAndReset() {
  const refreshToken = localStg.get('refreshToken');
  await fetchLogout(refreshToken || undefined);
  await authStore.resetStore();
}

function resetPasswordForm() {
  passwordForm.currentPassword = '';
  passwordForm.newPassword = '';
  passwordForm.confirmPassword = '';
  passwordFormRef.value?.clearValidate();
}

function openPasswordDialog() {
  resetPasswordForm();
  passwordDialogVisible.value = true;
}

async function submitPasswordChange() {
  const valid = await passwordFormRef.value?.validate().catch(() => false);
  if (!valid) return;

  passwordSubmitting.value = true;
  try {
    const { error } = await fetchChangeCurrentPassword(passwordForm.currentPassword, passwordForm.newPassword);
    if (error) return;
    passwordDialogVisible.value = false;
    window.$message?.success($t('common.changePasswordSuccess'));
    await logoutAndReset();
  } finally {
    passwordSubmitting.value = false;
  }
}

function handleDropdown(key: DropdownKey) {
  if (key === 'changePassword') openPasswordDialog();
  else logout();
}
</script>

<template>
  <ElButton v-if="!authStore.isLogin" text @click="loginOrRegister">
    {{ $t('page.login.common.loginOrRegister') }}
  </ElButton>

  <ElDropdown class="px-14px" trigger="click" @command="handleDropdown">
    <template #dropdown>
      <ElDropdownMenu>
        <ElDropdownItem
          v-for="{ key, label, icon } in options"
          :key="key"
          class="mx-4px my-1px rounded-6px"
          :icon="icon"
          :command="key"
        >
          {{ label }}
        </ElDropdownItem>
      </ElDropdownMenu>
    </template>
    <div class="flex items-center">
      <SvgIcon icon="ph:user-circle" class="mr-5px text-icon-large" />
      <span class="text-16px font-medium">{{ authStore.userInfo.nickname }}</span>
    </div>
  </ElDropdown>

  <ElDialog
    v-model="passwordDialogVisible"
    :title="$t('common.changePasswordTitle')"
    width="440px"
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
    @closed="resetPasswordForm"
  >
    <ElForm ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-position="top">
      <ElFormItem :label="$t('common.currentPassword')" prop="currentPassword">
        <ElInput
          v-model="passwordForm.currentPassword"
          type="password"
          show-password
          autocomplete="current-password"
          :placeholder="$t('common.currentPasswordPlaceholder')"
        />
      </ElFormItem>
      <ElFormItem :label="$t('common.newPassword')" prop="newPassword">
        <ElInput
          v-model="passwordForm.newPassword"
          type="password"
          show-password
          autocomplete="new-password"
          :placeholder="$t('common.newPasswordPlaceholder')"
        />
      </ElFormItem>
      <ElFormItem :label="$t('common.confirmNewPassword')" prop="confirmPassword">
        <ElInput
          v-model="passwordForm.confirmPassword"
          type="password"
          show-password
          autocomplete="new-password"
          :placeholder="$t('common.confirmNewPasswordPlaceholder')"
          @keyup.enter="submitPasswordChange"
        />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="passwordDialogVisible = false">{{ $t('common.cancel') }}</ElButton>
      <ElButton type="primary" :loading="passwordSubmitting" @click="submitPasswordChange">
        {{ $t('common.confirm') }}
      </ElButton>
    </template>
  </ElDialog>
</template>

<style scoped></style>
