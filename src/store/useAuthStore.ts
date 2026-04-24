import { create } from "zustand";
import { login as loginApi, type LoginResult } from "../api/auth";
import { getUserMe, getUserPermissions } from "../api/user";

// 角色类型（后端角色）
export type UserRole = "ADMIN" | "ANALYST" | "RISK_MANAGER";

// 权限类型
export type Permission = "view_reports" | "edit_rules" | "manage_users";

// 用户数据范围
export type DataScope = "all" | "unit";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  roles: UserRole[];
  status: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  token: string | null;
  permissions: Permission[];
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  fetchPermissions: () => Promise<void>;
  restoreSession: () => Promise<void>;
  hasPermission: (perm: Permission) => boolean;
  hasRole: (role: UserRole) => boolean;
}

// 角色中文映射
export function getRoleName(
  role: UserRole,
  t: (zh: string, en: string) => string,
): string {
  const map: Record<UserRole, [string, string]> = {
    ADMIN: ["系统管理员", "Admin"],
    ANALYST: ["分析员", "Analyst"],
    RISK_MANAGER: ["风险管理者", "Risk Manager"],
  };
  return t(map[role]?.[0] || role, map[role]?.[1] || role);
}

// 判断是否展示全量数据
export function isFullDataAccess(user: AuthUser | null): boolean {
  if (!user) return false;
  return user.roles.includes("ADMIN") || user.roles.includes("RISK_MANAGER");
}

// 获取用户数据范围
export function getDataScope(user: AuthUser | null): DataScope {
  return isFullDataAccess(user) ? "all" : "unit";
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: !!localStorage.getItem("token"),
  user: null,
  token: localStorage.getItem("token"),
  permissions: [],

  login: async (email: string, password: string) => {
    const result: LoginResult = await loginApi({ email, password });
    const token = result.accessToken;
    localStorage.setItem("token", token);
    set({
      isAuthenticated: true,
      token,
      user: result.user as AuthUser,
    });
    // 登录后立即获取权限
    await get().fetchPermissions();
    return true;
  },

  logout: () => {
    localStorage.removeItem("token");
    set({ isAuthenticated: false, user: null, token: null, permissions: [] });
  },

  fetchUser: async () => {
    try {
      const user = await getUserMe();
      set({ user: user as AuthUser });
    } catch {
      localStorage.removeItem("token");
      set({ isAuthenticated: false, user: null, token: null, permissions: [] });
    }
  },

  fetchPermissions: async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = (await getUserPermissions()) as Record<string, any>;
      set({ permissions: (data.permissions || []) as Permission[] });
    } catch {
      // 权限获取失败不影响登录
    }
  },

  restoreSession: async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const user = await getUserMe();
      set({ isAuthenticated: true, token, user: user as AuthUser });
      await get().fetchPermissions();
    } catch {
      localStorage.removeItem("token");
      set({ isAuthenticated: false, user: null, token: null, permissions: [] });
    }
  },

  hasPermission: (perm: Permission) => {
    return get().permissions.includes(perm);
  },

  hasRole: (role: UserRole) => {
    return get().user?.roles.includes(role) ?? false;
  },
}));
