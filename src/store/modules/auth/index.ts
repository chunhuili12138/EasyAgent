import { computed, reactive, ref } from 'vue';
import { defineStore } from 'pinia';
import { useLoading } from '@sa/hooks';
import { fetchClearTenant, fetchGetUserInfo, fetchLogin, fetchSwitchTenant } from '@/service/api';
import { useRouterPush } from '@/hooks/common/router';
import { localStg } from '@/utils/storage';
import { SetupStoreId } from '@/enum';
import { $t } from '@/locales';
import { useRouteStore } from '../route';
import { useTabStore } from '../tab';
import { clearAuthStorage, getToken } from './shared';

export const useAuthStore = defineStore(SetupStoreId.Auth, () => {
  const routeStore = useRouteStore();
  const tabStore = useTabStore();
  const { toLogin, redirectFromLogin } = useRouterPush(false);
  const { loading: loginLoading, startLoading, endLoading } = useLoading();

  const token = ref(getToken());

  const userInfo: Api.Auth.UserInfo = reactive({
    id: 0,
    phone: '',
    nickname: '',
    avatar: '',
    roles: [],
    permissions: [],
    tenants: [],
    currentTenantId: null,
    currentTenantName: null
  });

  const needsTenantSelection = ref(false);

  /** is super role in static route */
  const isStaticSuper = computed(() => {
    const { VITE_AUTH_ROUTE_MODE, VITE_STATIC_SUPER_ROLE } = import.meta.env;
    return VITE_AUTH_ROUTE_MODE === 'static' && userInfo.roles.includes(VITE_STATIC_SUPER_ROLE);
  });

  const isSysAdmin = computed(() => userInfo.roles.includes('SYS_ADMIN'));

  /** Is login */
  const isLogin = computed(() => Boolean(token.value));

  /** Reset auth store */
  async function resetStore() {
    recordUserId();
    clearAuthStorage();
    localStg.remove('globalTabs');

    token.value = '';
    Object.assign(userInfo, {
      id: 0,
      phone: '',
      nickname: '',
      avatar: '',
      roles: [],
      permissions: [],
      tenants: [],
      currentTenantId: null,
      currentTenantName: null
    });

    needsTenantSelection.value = false;

    await tabStore.clearAllTabs(false);
    await routeStore.resetStore();
    await toLogin(undefined, '/');
  }

  /** Record the user ID of the previous login session */
  function recordUserId() {
    if (!userInfo.id) {
      return;
    }
    localStg.set('lastLoginUserId', String(userInfo.id));
  }

  /**
   * Check if current login user is different from previous login user
   */
  function checkTabClear(): boolean {
    if (!userInfo.id) {
      return false;
    }

    const lastLoginUserId = localStg.get('lastLoginUserId');

    if (lastLoginUserId !== String(userInfo.id)) {
      localStg.remove('globalTabs');
      tabStore.clearTabs();
      return true;
    }

    return false;
  }

  function setLoginState(loginResult: Api.Auth.LoginResult) {
    localStg.set('token', loginResult.token);
    localStg.set('refreshToken', loginResult.refreshToken);
    if (loginResult.userInfo) {
      Object.assign(userInfo, loginResult.userInfo);
      token.value = loginResult.token;
    }
  }

  /**
   * Login
   */
  async function login(phone: string, password: string, redirect = true) {
    startLoading();

    const { data: loginResult, error } = await fetchLogin(phone, password);

    if (!error && loginResult) {
      setLoginState(loginResult);

      if (isSysAdmin.value) {
        const isClear = checkTabClear();
        const needRedirect = isClear ? false : redirect;
        await redirectFromLogin(needRedirect);

        window.$notification?.success({
          title: $t('page.login.common.loginSuccess'),
          message: $t('page.login.common.welcomeBack', { userName: userInfo.nickname }),
          duration: 4500
        });
      } else if (userInfo.tenants.length === 0) {
        window.$message?.error('账号未关联任何租户，请联系管理员');
        resetStore();
      } else if (userInfo.tenants.length === 1) {
        const tenantId = userInfo.tenants[0].id;
        const { data: switchResult, error: switchError } = await fetchSwitchTenant(tenantId);
        if (!switchError && switchResult) {
      setLoginState(switchResult);
        }
        await routeStore.reloadAuthRoutes();
        const isClear = checkTabClear();
        if (!isClear && redirect) await redirectFromLogin(true);

        window.$notification?.success({
          title: $t('page.login.common.loginSuccess'),
          message: $t('page.login.common.welcomeBack', { userName: userInfo.nickname }),
          duration: 4500
        });
      } else {
        needsTenantSelection.value = true;
      }
    } else {
      resetStore();
    }

    endLoading();
  }

  async function selectTenant(tenantId: number) {
    const { data: loginResult, error } = await fetchSwitchTenant(tenantId);

    if (!error && loginResult) {
      setLoginState(loginResult);
      needsTenantSelection.value = false;

      await routeStore.reloadAuthRoutes();
      const isClear = checkTabClear();
      if (!isClear) await redirectFromLogin(true);

      window.$notification?.success({
        title: $t('page.login.common.loginSuccess'),
        message: $t('page.login.common.welcomeBack', { userName: userInfo.nickname }),
        duration: 4500
      });
      return true;
    }

    return false;
  }

  async function switchCurrentTenant(tenantId: number) {
    const { data: loginResult, error } = await fetchSwitchTenant(tenantId);

    if (!error && loginResult) {
      setLoginState(loginResult);

      await routeStore.reloadAuthRoutes();

      window.$notification?.success({
        title: '租户切换成功',
        message: `已切换到: ${userInfo.currentTenantName}`,
        duration: 3000
      });
      return true;
    }

    return false;
  }

  async function clearCurrentTenant() {
    const { data: loginResult, error } = await fetchClearTenant();

    if (!error && loginResult) {
      setLoginState(loginResult);

      await routeStore.reloadAuthRoutes();

      window.$notification?.success({
        title: '已切换到全局模式',
        duration: 3000
      });
      return true;
    }

    return false;
  }

  async function getUserInfo() {
    const { data: info, error } = await fetchGetUserInfo();

    if (!error && info) {
      Object.assign(userInfo, info);
      return true;
    }

    return false;
  }

  async function initUserInfo() {
    const hasToken = getToken();

    if (hasToken) {
      const pass = await getUserInfo();

      if (!pass) {
        resetStore();
      }
    }
  }

  return {
    token,
    userInfo,
    isStaticSuper,
    isSysAdmin,
    isLogin,
    loginLoading,
    needsTenantSelection,
    resetStore,
    login,
    selectTenant,
    switchCurrentTenant,
    clearCurrentTenant,
    initUserInfo
  };
});
