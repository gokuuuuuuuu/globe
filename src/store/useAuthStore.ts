import { create } from "zustand";

// 角色类型
export type UserRole = "system-admin" | "safety-manager" | "user";

// 用户数据范围
export type DataScope = "all" | "unit";

export interface AuthUser {
  employeeId: string;
  name: string;
  role: UserRole;
  unit?: string; // 飞行单位（仅 unit 级别用户有）
}

interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  login: (employeeId: string, password: string) => boolean;
  logout: () => void;
}

// 角色中文映射
export function getRoleName(
  role: UserRole,
  t: (zh: string, en: string) => string,
): string {
  const map: Record<UserRole, [string, string]> = {
    "system-admin": ["系统管理员", "System Admin"],
    "safety-manager": ["安全管理者", "Safety Manager"],
    user: ["普通用户", "User"],
  };
  return t(map[role][0], map[role][1]);
}

// 判断是否展示全量数据
export function isFullDataAccess(user: AuthUser | null): boolean {
  if (!user) return false;
  // 系统管理员、安全管理者展示全量数据
  return user.role === "system-admin" || user.role === "safety-manager";
}

// 获取用户数据范围
export function getDataScope(user: AuthUser | null): DataScope {
  return isFullDataAccess(user) ? "all" : "unit";
}

// 预置用户列表（模拟）
const MOCK_USERS: Array<AuthUser & { password: string }> = [
  {
    employeeId: "admin",
    password: "admin123",
    name: "张管理",
    role: "system-admin",
  },
  {
    employeeId: "safety01",
    password: "safety123",
    name: "李安监",
    role: "safety-manager",
  },
  {
    employeeId: "pilot01",
    password: "pilot123",
    name: "王飞行",
    role: "user",
    unit: "飞行总队",
  },
  {
    employeeId: "pilot02",
    password: "pilot123",
    name: "刘机长",
    role: "user",
    unit: "云南",
  },
  {
    employeeId: "pilot03",
    password: "pilot123",
    name: "陈副驾",
    role: "user",
    unit: "江苏",
  },
];

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,

  login: (employeeId: string, password: string) => {
    const found = MOCK_USERS.find(
      (u) => u.employeeId === employeeId && u.password === password,
    );
    if (found) {
      const { password: _, ...user } = found;
      set({ isAuthenticated: true, user });
      return true;
    }
    return false;
  },

  logout: () => {
    set({ isAuthenticated: false, user: null });
  },
}));
