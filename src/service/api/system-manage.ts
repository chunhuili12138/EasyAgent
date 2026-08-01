import { request } from '../request';

/** get role-aware statistics for the global scope or active tenant */
export function fetchGetDashboardStatistics() {
  return request<Api.SystemManage.DashboardStatistics>({
    url: '/system/dashboard/statistics',
    method: 'get'
  });
}

/** get user page list */
export function fetchGetUserList(params?: Api.SystemManage.UserSearchParams) {
  return request<Api.SystemManage.UserList>({
    url: '/system/user/page',
    method: 'get',
    params
  });
}

/** create user */
export function fetchCreateUser(data?: Api.SystemManage.UserCreateRequest) {
  return request({ url: '/system/user', method: 'post', data });
}

/** update user */
export function fetchUpdateUser(id: number, data?: Api.SystemManage.UserUpdateRequest) {
  return request({ url: `/system/user/${id}`, method: 'put', data });
}

/** delete user */
export function fetchDeleteUser(id: number) {
  return request({ url: `/system/user/${id}`, method: 'delete' });
}

/** reset user password */
export function fetchResetPassword(id: number, newPassword: string) {
  return request({ url: `/system/user/${id}/reset-password`, method: 'put', data: { newPassword } });
}

/** get role page list */
export function fetchGetRoleList(params?: Api.SystemManage.RoleSearchParams) {
  return request<Api.SystemManage.RoleList>({
    url: '/system/role/page',
    method: 'get',
    params
  });
}

/** get all roles */
export function fetchGetAllRoles() {
  return request<Api.SystemManage.AllRole[]>({
    url: '/system/role/list',
    method: 'get'
  });
}

/** create role */
export function fetchCreateRole(data?: Api.SystemManage.RoleInfo) {
  return request({ url: '/system/role', method: 'post', data });
}

/** update role */
export function fetchUpdateRole(id: number, data?: Api.SystemManage.RoleInfo) {
  return request({ url: `/system/role/${id}`, method: 'put', data });
}

/** delete role */
export function fetchDeleteRole(id: number) {
  return request({ url: `/system/role/${id}`, method: 'delete' });
}

/** get role menus */
export function fetchGetRoleMenus(roleId: number) {
  return request<number[]>({ url: `/system/role/${roleId}/menus`, method: 'get' });
}

/** assign role menus */
export function fetchAssignRoleMenus(roleId: number, menuIds: number[]) {
  return request({ url: `/system/role/${roleId}/menus`, method: 'put', data: { menuIds } });
}

/** get menu tree */
export function fetchGetMenuTree() {
  return request<Api.SystemManage.MenuTree[]>({
    url: '/system/menu/tree',
    method: 'get'
  });
}

/** create menu */
export function fetchCreateMenu(data?: Api.SystemManage.MenuInfo) {
  return request({ url: '/system/menu', method: 'post', data });
}

/** update menu */
export function fetchUpdateMenu(id: number, data?: Api.SystemManage.MenuInfo) {
  return request({ url: `/system/menu/${id}`, method: 'put', data });
}

/** delete menu */
export function fetchDeleteMenu(id: number) {
  return request({ url: `/system/menu/${id}`, method: 'delete' });
}

/** get tenant page list */
export function fetchGetTenantList(params?: Api.SystemManage.TenantSearchParams) {
  return request<Api.SystemManage.TenantList>({
    url: '/system/tenant/page',
    method: 'get',
    params
  });
}

/** get department tree */
export function fetchGetDepartmentTree() {
  return request<Api.SystemManage.DepartmentTree[]>({
    url: '/system/department/tree',
    method: 'get'
  });
}

/** get post page list */
export function fetchGetPostList(params?: Api.SystemManage.PostSearchParams) {
  return request<Api.SystemManage.PostList>({
    url: '/system/post/page',
    method: 'get',
    params
  });
}

/** get posts in current tenant, optionally filtered by department */
export function fetchGetAllPosts(departmentId?: number) {
  return request<Api.SystemManage.Post[]>({
    url: '/system/post/list',
    method: 'get',
    params: departmentId == null ? undefined : { departmentId }
  });
}

/** get dict type page list */
export function fetchGetDictTypeList(params?: Api.SystemManage.DictSearchParams) {
  return request<Api.SystemManage.DictTypeList>({
    url: '/system/dict/type/page',
    method: 'get',
    params
  });
}

/** get dict data page list */
export function fetchGetDictDataList(params?: Api.SystemManage.DictDataSearchParams) {
  return request<Api.SystemManage.DictDataList>({
    url: '/system/dict/data/page',
    method: 'get',
    params
  });
}

/** get log page list */
export function fetchGetLogList(params?: Api.SystemManage.LogSearchParams) {
  return request<Api.SystemManage.LogList>({
    url: '/system/log/page',
    method: 'get',
    params
  });
}

/** get message page list */
export function fetchGetMessageList(params?: Api.SystemManage.MessageSearchParams) {
  return request<Api.SystemManage.MessageList>({
    url: '/system/message/page',
    method: 'get',
    params
  });
}

/** create tenant */
export function fetchCreateTenant(data?: any) {
  return request({ url: '/system/tenant', method: 'post', data });
}

/** update tenant */
export function fetchUpdateTenant(id: number, data?: any) {
  return request({ url: `/system/tenant/${id}`, method: 'put', data });
}

/** delete tenant */
export function fetchDeleteTenant(id: number) {
  return request({ url: `/system/tenant/${id}`, method: 'delete' });
}

/** create department */
export function fetchCreateDepartment(data?: any) {
  return request({ url: '/system/department', method: 'post', data });
}

/** update department */
export function fetchUpdateDepartment(id: number, data?: any) {
  return request({ url: `/system/department/${id}`, method: 'put', data });
}

/** delete department */
export function fetchDeleteDepartment(id: number) {
  return request({ url: `/system/department/${id}`, method: 'delete' });
}

/** create post */
export function fetchCreatePost(data?: any) {
  return request({ url: '/system/post', method: 'post', data });
}

/** update post */
export function fetchUpdatePost(id: number, data?: any) {
  return request({ url: `/system/post/${id}`, method: 'put', data });
}

/** delete post */
export function fetchDeletePost(id: number) {
  return request({ url: `/system/post/${id}`, method: 'delete' });
}

/** create dict type */
export function fetchCreateDictType(data?: any) {
  return request({ url: '/system/dict/type', method: 'post', data });
}

/** update dict type */
export function fetchUpdateDictType(id: number, data?: any) {
  return request({ url: `/system/dict/type/${id}`, method: 'put', data });
}

/** delete dict type */
export function fetchDeleteDictType(id: number) {
  return request({ url: `/system/dict/type/${id}`, method: 'delete' });
}

/** create dict data */
export function fetchCreateDictData(data?: any) {
  return request({ url: '/system/dict/data', method: 'post', data });
}

/** update dict data */
export function fetchUpdateDictData(id: number, data?: any) {
  return request({ url: `/system/dict/data/${id}`, method: 'put', data });
}

/** delete dict data */
export function fetchDeleteDictData(id: number) {
  return request({ url: `/system/dict/data/${id}`, method: 'delete' });
}

/** read message */
export function fetchReadMessage(id: number) {
  return request({ url: `/system/message/${id}/read`, method: 'put' });
}

/** read all messages */
export function fetchReadAllMessages() {
  return request({ url: '/system/message/read-all', method: 'put' });
}

/** get all tenants */
export function fetchGetAllTenants() {
  return request<any[]>({ url: '/system/tenant/list', method: 'get' });
}

/** get all tenant usage and quota summaries (SYS_ADMIN only) */
export function fetchGetTenantUsageList() {
  return request<Api.SystemManage.TenantUsage[]>({ url: '/system/tenant-usage', method: 'get' });
}

/** update tenant quota (SYS_ADMIN only) */
export function fetchUpdateTenantQuota(tenantId: number, data: Api.SystemManage.TenantQuotaUpdate) {
  return request({ url: `/system/tenant-usage/${tenantId}/quota`, method: 'put', data });
}

/** get tenant token usage trend (SYS_ADMIN only) */
export function fetchGetTenantUsageTrend(tenantId: number, days = 30) {
  return request<Api.SystemManage.TenantUsageTrend[]>({
    url: `/system/tenant-usage/${tenantId}/trend`,
    method: 'get',
    params: { days }
  });
}

/** get user assigned role ids */
export function fetchGetUserRoles(userId: number) {
  return request<number[]>({ url: `/system/user/${userId}/roles`, method: 'get' });
}

/** assign roles to user */
export function fetchAssignUserRoles(userId: number, roleIds: number[]) {
  return request({ url: `/system/user/${userId}/roles`, method: 'put', data: { roleIds } });
}

/** get user assigned tenant ids */
export function fetchGetUserTenants(userId: number) {
  return request<number[]>({ url: `/system/user/${userId}/tenants`, method: 'get' });
}

/** assign tenants to user */
export function fetchAssignUserTenants(userId: number, tenantIds: number[]) {
  return request({ url: `/system/user/${userId}/tenants`, method: 'put', data: { tenantIds } });
}

/** get user organization in current tenant */
export function fetchGetUserOrganization(userId: number) {
  return request<Api.SystemManage.UserOrganization>({ url: `/system/user/${userId}/organization`, method: 'get' });
}

/** assign user department and posts in current tenant */
export function fetchAssignUserOrganization(userId: number, data: Api.SystemManage.UserOrganization) {
  return request({ url: `/system/user/${userId}/organization`, method: 'put', data });
}
