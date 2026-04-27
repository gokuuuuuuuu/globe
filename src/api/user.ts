import request from "./request";

export interface UserListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: "ACTIVE" | "DISABLED";
  role?: "ADMIN" | "ANALYST" | "RISK_MANAGER";
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  roles?: ("ADMIN" | "ANALYST" | "RISK_MANAGER")[];
  status?: "ACTIVE" | "DISABLED";
}

export function getUserMe() {
  return request.get("/api/v1/user/me");
}

export function getUserPermissions() {
  return request.get("/api/v1/user/me/permissions");
}

export function getUserList(params?: UserListParams) {
  return request.get("/api/v1/user", { params });
}

export function getUserById(id: number) {
  return request.get(`/api/v1/user/${id}`);
}

export function createUser(data: CreateUserDto) {
  return request.post("/api/v1/user", data);
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  password?: string;
  status?: "ACTIVE" | "DISABLED";
  roles?: ("ADMIN" | "ANALYST" | "RISK_MANAGER")[];
}

/** 更新用户基础信息 / 状态 / 角色 */
export function updateUser(id: number, data: UpdateUserDto) {
  return request.patch(`/api/v1/user/${id}`, data);
}

/** 删除用户 */
export function deleteUser(id: number) {
  return request.delete(`/api/v1/user/${id}`);
}

/** 完整替换用户角色 */
export function updateUserRoles(
  id: number,
  roles: ("ADMIN" | "ANALYST" | "RISK_MANAGER")[],
) {
  return request.put(`/api/v1/user/${id}/roles`, { roles });
}

/** 切换用户启用/禁用状态 */
export function updateUserStatus(id: number, status: "ACTIVE" | "DISABLED") {
  return request.patch(`/api/v1/user/${id}/status`, { status });
}

/** 角色权限矩阵 */
export function getRolePermissions() {
  return request.get("/api/v1/user/role-permissions");
}
