declare namespace Api {
  namespace Auth {
    /** Tenant info */
    interface TenantInfo {
      id: number;
      name: string;
      code: string;
    }

    /** Login response */
    interface LoginResult {
      token: string;
      refreshToken: string;
      expiresIn: number;
      userInfo: UserInfo;
    }

    /** User info */
    interface UserInfo {
      id: number;
      phone: string;
      nickname: string;
      avatar: string;
      roles: string[];
      permissions: string[];
      tenants: TenantInfo[];
      currentTenantId: number | null;
      currentTenantName: string | null;
    }

    /** Login request */
    interface LoginRequest {
      phone: string;
      password: string;
    }

    /** Tenant switch request */
    interface TenantSwitchRequest {
      tenantId: number;
    }
  }
}
