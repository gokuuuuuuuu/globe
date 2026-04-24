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
