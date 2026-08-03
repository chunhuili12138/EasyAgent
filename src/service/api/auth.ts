import { request } from '../request';

/**
 * Login
 *
 * @param phone Phone number
 * @param password Password
 */
export function fetchLogin(phone: string, password: string) {
  return request<Api.Auth.LoginResult>({
    url: '/auth/login',
    method: 'post',
    data: {
      phone,
      password
    }
  });
}

/** Get user info */
export function fetchGetUserInfo() {
  return request<Api.Auth.UserInfo>({ url: '/system/user/current' });
}

/**
 * Refresh token
 *
 * @param refreshToken Refresh token
 */
export function fetchRefreshToken(refreshToken: string) {
  return request<Api.Auth.LoginResult>({
    url: '/auth/refresh',
    method: 'post',
    data: {
      refreshToken
    }
  });
}

/** Logout */
export function fetchLogout(refreshToken?: string) {
  return request({
    url: '/auth/logout',
    method: 'post',
    data: refreshToken ? { refreshToken } : undefined
  });
}

/** Change the current user's password */
export function fetchChangeCurrentPassword(currentPassword: string, newPassword: string) {
  return request({
    url: '/system/user/current/password',
    method: 'put',
    data: { currentPassword, newPassword }
  });
}

/** Switch tenant */
export function fetchSwitchTenant(tenantId: number) {
  return request<Api.Auth.LoginResult>({
    url: '/auth/select-tenant',
    method: 'post',
    data: { tenantId }
  });
}

/** Clear tenant (switch to global mode) */
export function fetchClearTenant() {
  return request<Api.Auth.LoginResult>({
    url: '/auth/clear-tenant',
    method: 'post'
  });
}
