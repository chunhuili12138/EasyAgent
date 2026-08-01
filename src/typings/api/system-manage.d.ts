declare namespace Api {
  namespace SystemManage {
    type PageParams = Pick<Common.PaginatingCommonParams, 'current' | 'size'>;
    type UserGender = '1' | '2';
    type MenuType = '1' | '2';
    type IconType = '1' | '2';

    type User = Common.CommonRecord<{
      phone: string;
      nickname: string;
      avatar?: string;
      email?: string;
      status: number | string;
      tenantName?: string;
      departmentId?: number | null;
      departmentName?: string;
      postId?: number | null;
      postName?: string;
      createdAt?: string;
      updatedAt?: string;
    }>;
    type UserList = Common.PaginatingQueryRecord<User>;
    type UserSearchParams = PageParams & { keyword?: string };
    type UserCreateRequest = {
      phone: string;
      nickname: string;
      password: string;
      email?: string;
      avatar?: string;
      roleIds?: number[];
      tenantIds?: number[];
      departmentId?: number | null;
      postId?: number | null;
    };
    type UserUpdateRequest = Partial<Pick<User, 'nickname' | 'email' | 'avatar'>> & {
      status?: number | string;
      roleIds?: number[];
      tenantIds?: number[];
      organization?: UserOrganization;
    };
    type UserOrganization = {
      departmentId: number | null;
      postId: number | null;
    };

    type Role = Common.CommonRecord<{
      tenantId?: number | null;
      name: string;
      code: string;
      isSystem?: number;
      status: number | string;
      tenantName?: string;
    }>;
    type RoleList = Common.PaginatingQueryRecord<Role>;
    type RoleSearchParams = PageParams & { keyword?: string; name?: string; code?: string };
    type RoleInfo = Pick<Role, 'name' | 'code' | 'status'>;
    type AllRole = Pick<Role, 'id' | 'name' | 'code' | 'tenantId'>;

    type Menu = Common.CommonRecord<{
      parentId: number;
      name: string;
      path?: string;
      component?: string;
      icon?: string;
      sort?: number;
      type?: number;
      permission?: string;
      visible?: number;
      status?: number;
      children?: Menu[];
    }>;
    type MenuInfo = Partial<Omit<Menu, 'id' | 'children'>> & { menuType?: 'dir' | 'menu' | 'button' };
    type MenuTree = Menu;

    type Tenant = Common.CommonRecord<{
      name: string;
      code: string;
      contactName?: string;
      contactPhone?: string;
      isolationLevel?: number;
      status: number | string;
      expireAt?: string;
    }>;
    type TenantList = Common.PaginatingQueryRecord<Tenant>;
    type TenantSearchParams = PageParams & { keyword?: string; name?: string; code?: string };

    type TenantUsage = {
      tenantId: number;
      tenantName: string;
      tenantCode: string;
      tenantStatus: number;
      documentUsedBytes: number;
      documentLimitBytes: number;
      todayTokens: number;
      dailyTokenLimit: number;
      monthTokens: number;
      monthlyTokenLimit: number;
      rateLimitQps: number;
      warningLevel: 'normal' | 'warning' | 'danger' | 'exceeded';
    };

    type TenantQuotaUpdate = {
      documentLimitBytes: number;
      dailyTokenLimit: number;
      monthlyTokenLimit: number;
      rateLimitQps: number;
    };

    type TenantUsageTrend = { statDate: string; tokens: number; requests: number };

    type DashboardMetric = {
      key: string;
      value: number;
      level: 'normal' | 'warning' | 'danger';
    };

    type DashboardStatistics = {
      scope: 'global' | 'tenant';
      tenantId: number | null;
      roles: string[];
      metrics: DashboardMetric[];
      resourceUsage: TenantUsage | null;
    };

    type Department = Common.CommonRecord<{
      tenantId: number;
      parentId: number;
      name: string;
      code?: string;
      leader?: string;
      phone?: string;
      sort?: number;
      status?: number | string;
      tenantName?: string;
      children?: Department[];
    }>;
    type DepartmentTree = Department;

    type Post = Common.CommonRecord<{
      tenantId: number;
      departmentId: number;
      name: string;
      code?: string;
      sort?: number;
      status?: number | string;
      tenantName?: string;
      departmentName?: string;
    }>;
    type PostList = Common.PaginatingQueryRecord<Post>;
    type PostSearchParams = PageParams & { departmentId?: number | null; keyword?: string; name?: string; code?: string };

    type DictType = Common.CommonRecord<{
      name: string;
      code: string;
      status: number | string;
      remark?: string;
    }>;
    type DictTypeList = Common.PaginatingQueryRecord<DictType>;
    type DictSearchParams = PageParams & { keyword?: string };
    type DictData = Common.CommonRecord<{
      dictTypeId: number;
      label: string;
      value: string;
      sort?: number;
      status: number | string;
      remark?: string;
    }>;
    type DictDataList = Common.PaginatingQueryRecord<DictData>;
    type DictDataSearchParams = PageParams & { dictTypeId?: number; code?: string };

    type Log = Common.CommonRecord<{
      traceId?: string;
      tenantId?: number;
      userId?: number;
      username?: string;
      operation?: string;
      module?: string;
      requestUrl?: string;
      requestMethod?: string;
      requestSummary?: string;
      responseSummary?: string;
      ip?: string;
      duration?: number;
      status?: number | string;
      tenantName?: string;
      createdAt?: string;
    }>;
    type LogList = Common.PaginatingQueryRecord<Log>;
    type LogSearchParams = PageParams & { username?: string; module?: string; status?: number | string; startTime?: string; endTime?: string };

    type Message = Common.CommonRecord<{
      tenantId: number;
      userId: number;
      title?: string;
      content?: string;
      type?: string;
      isRead: number | string;
      relatedBiz?: string;
      relatedBizId?: number;
      createdAt?: string;
    }>;
    type MessageList = Common.PaginatingQueryRecord<Message>;
    type MessageSearchParams = PageParams & { type?: string; isRead?: number | string; keyword?: string };
  }
}
