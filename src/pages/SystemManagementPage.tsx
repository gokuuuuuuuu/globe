import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../i18n/useLanguage";
import {
  getUserList,
  createUser,
  deleteUser,
  updateUserStatus,
  getRolePermissions,
} from "../api/user";
import type { UserListParams, CreateUserDto } from "../api/user";
import { useToast } from "../components/Toast";
import "./SystemManagementPage.css";

// ===== Types =====

type Role = "ADMIN" | "ANALYST" | "RISK_MANAGER";
type UserStatus = "ACTIVE" | "DISABLED";

interface User {
  id: number;
  name: string;
  email: string;
  roles: Role[];
  status: UserStatus;
  lastLoginAt: string | null;
  createdAt: string;
}

const PAGE_SIZE = 10;

const PERM_MATRIX = [
  {
    role: "系统管理员",
    roleEn: "Admin",
    roleKey: "ADMIN",
    viewReports: "granted",
    editRules: "granted",
    manageUsers: "granted",
  },
  {
    role: "分析员",
    roleEn: "Analyst",
    roleKey: "ANALYST",
    viewReports: "granted",
    editRules: "denied",
    manageUsers: "denied",
  },
  {
    role: "风险管理者",
    roleEn: "Risk Manager",
    roleKey: "RISK_MANAGER",
    viewReports: "granted",
    editRules: "granted",
    manageUsers: "denied",
  },
];

// ===== Component =====

export function SystemManagementPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<UserStatus | "">("");
  const [roleFilter, setRoleFilter] = useState<Role | "">("");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [permMatrix, setPermMatrix] = useState<any[]>(PERM_MATRIX);

  useEffect(() => {
    getRolePermissions()
      .then((data: any) => {
        const arr = Array.isArray(data) ? data : data?.permissions;
        if (Array.isArray(arr)) setPermMatrix(arr);
      })
      .catch(console.error);
  }, []);

  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "ANALYST" as Role,
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: UserListParams = { page, pageSize: PAGE_SIZE };
      if (search.trim()) params.keyword = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (roleFilter) params.role = roleFilter;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = (await getUserList(params)) as Record<string, any>;
      setUsers(res.items ?? []);
      setTotal(res.total ?? 0);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      setAddError(t("请填写所有必填项", "Please fill in all required fields"));
      return;
    }
    setAddLoading(true);
    setAddError("");
    try {
      const dto: CreateUserDto = {
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        roles: [newUser.role],
      };
      await createUser(dto);
      toast(t("用户创建成功", "User created successfully"), "success");
      setNewUser({ name: "", email: "", password: "", role: "ANALYST" });
      setShowAddModal(false);
      setPage(1);
      fetchUsers();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      toast(msg || t("创建失败", "Failed to create user"), "error");
      setAddError(msg || t("创建失败", "Failed to create user"));
    } finally {
      setAddLoading(false);
    }
  };

  const tRole = (role: Role) => {
    const map: Record<Role, [string, string]> = {
      ADMIN: ["管理员", "Admin"],
      ANALYST: ["分析员", "Analyst"],
      RISK_MANAGER: ["风险管理者", "Risk Manager"],
    };
    return t(map[role]?.[0] || role, map[role]?.[1] || role);
  };

  const tStatus = (status: UserStatus) =>
    status === "ACTIVE" ? t("启用", "Active") : t("禁用", "Disabled");

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("zh-CN");
  };

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    try {
      await updateUserStatus(user.id, newStatus);
      toast(t("状态更新成功", "Status updated"), "success");
      fetchUsers();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : t("操作失败", "Operation failed");
      toast(msg, "error");
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (
      !window.confirm(
        t(`确定删除用户 ${user.name}？`, `Delete user ${user.name}?`),
      )
    )
      return;
    try {
      await deleteUser(user.id);
      toast(t("删除成功", "User deleted"), "success");
      fetchUsers();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : t("删除失败", "Delete failed");
      toast(msg, "error");
    }
  };

  return (
    <div className="smp-root">
      {/* Breadcrumb */}
      <div className="smp-breadcrumb">
        <span style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
          {t("工作台", "Dashboard")}
        </span>
        <span className="smp-breadcrumb-sep">&gt;</span>
        <span
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/system-management")}
        >
          {t("系统管理", "System Mgmt")}
        </span>
        <span className="smp-breadcrumb-sep">&gt;</span>
        <span className="smp-breadcrumb-active">
          {t("用户与角色", "Users and Roles")}
        </span>
      </div>

      <div className="smp-body">
        {/* Left: User table */}
        <div className="smp-left">
          <div className="smp-toolbar">
            <div className="smp-search-wrapper">
              <span className="smp-search-icon">&#128269;</span>
              <input
                className="smp-search"
                type="text"
                placeholder={t("搜索姓名/邮箱...", "Search name/email...")}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="smp-toolbar-right">
              <select
                className="smp-filter-select"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as UserStatus | "");
                  setPage(1);
                }}
              >
                <option value="">{t("全部状态", "All Status")}</option>
                <option value="ACTIVE">{t("启用", "Active")}</option>
                <option value="DISABLED">{t("禁用", "Disabled")}</option>
              </select>
              <select
                className="smp-filter-select"
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value as Role | "");
                  setPage(1);
                }}
              >
                <option value="">{t("全部角色", "All Roles")}</option>
                <option value="ADMIN">{t("管理员", "Admin")}</option>
                <option value="ANALYST">{t("分析员", "Analyst")}</option>
                <option value="RISK_MANAGER">
                  {t("风险管理者", "Risk Manager")}
                </option>
              </select>
              <button
                className="smp-add-btn"
                onClick={() => setShowAddModal(true)}
              >
                + {t("添加用户", "Add User")}
              </button>
            </div>
          </div>

          <div className="smp-table-card">
            <div className="smp-table-scroll">
              <table className="smp-table">
                <thead>
                  <tr>
                    <th style={{ width: 36 }} />
                    <th>ID</th>
                    <th>{t("姓名", "Name")}</th>
                    <th>{t("邮箱", "Email")}</th>
                    <th>{t("分配角色", "Assigned Roles")}</th>
                    <th>{t("状态", "Status")}</th>
                    <th>{t("最后登录", "Last Login")}</th>
                    <th>{t("操作", "Actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={8}
                        style={{
                          textAlign: "center",
                          padding: 32,
                          color: "#64748b",
                        }}
                      >
                        {t("加载中...", "Loading...")}
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        style={{
                          textAlign: "center",
                          padding: 32,
                          color: "#64748b",
                        }}
                      >
                        {t("暂无数据", "No data")}
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id}>
                        <td />
                        <td>{u.id}</td>
                        <td>{u.name}</td>
                        <td>{u.email}</td>
                        <td>
                          <div className="smp-role-badges">
                            {u.roles.map((r, i) => (
                              <span
                                key={i}
                                className={`smp-role-badge ${r.toLowerCase()}`}
                              >
                                {tRole(r)}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <span className="smp-status">
                            <span
                              className={`smp-status-dot ${u.status.toLowerCase()}`}
                            />
                            {tStatus(u.status)}
                          </span>
                        </td>
                        <td>{formatDate(u.lastLoginAt)}</td>
                        <td>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button
                              className="smp-action-btn"
                              onClick={() => handleToggleStatus(u)}
                              style={{
                                background: "none",
                                border: "1px solid rgba(148,163,184,0.2)",
                                color:
                                  u.status === "ACTIVE" ? "#eab308" : "#22c55e",
                                borderRadius: 4,
                                padding: "2px 8px",
                                cursor: "pointer",
                                fontSize: 11,
                              }}
                            >
                              {u.status === "ACTIVE"
                                ? t("禁用", "Disable")
                                : t("启用", "Enable")}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u)}
                              style={{
                                background: "none",
                                border: "1px solid rgba(239,68,68,0.3)",
                                color: "#ef4444",
                                borderRadius: 4,
                                padding: "2px 8px",
                                cursor: "pointer",
                                fontSize: 11,
                              }}
                            >
                              {t("删除", "Delete")}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="smp-pagination">
              <span style={{ color: "#64748b", fontSize: 12, marginRight: 12 }}>
                {total} {t("条记录", "records")}
              </span>
              <button
                className="smp-page-btn"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                &lsaquo;
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                const p = start + i;
                if (p > totalPages) return null;
                return (
                  <button
                    key={p}
                    className={`smp-page-btn ${p === page ? "active" : ""}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                className="smp-page-btn"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                &rsaquo;
              </button>
            </div>
          </div>
        </div>

        {/* Right: Role-Permission Matrix */}
        <div className="smp-right">
          <div className="smp-right-card">
            <div className="smp-right-title">
              {t("角色权限矩阵", "Role-Permission Matrix")}
            </div>
            {(() => {
              // API 格式: [{role, label, permissions: {key: {label, enabled}}}]
              // 本地格式: [{roleKey, role, roleEn, viewReports, editRules, manageUsers}]
              const isApiFormat =
                permMatrix[0]?.permissions &&
                typeof permMatrix[0].permissions === "object";

              if (isApiFormat) {
                // 动态提取所有权限key
                const permKeys = Object.keys(permMatrix[0]?.permissions ?? {});
                return (
                  <table className="smp-perm-table">
                    <thead>
                      <tr>
                        <th>{t("角色", "Role")}</th>
                        {permKeys.map((key) => (
                          <th key={key}>
                            {(permMatrix[0]?.permissions as any)?.[key]
                              ?.label ?? key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {permMatrix.map((row: any) => (
                        <tr key={row.role}>
                          <td>{row.label ?? row.role}</td>
                          {permKeys.map((key) => {
                            const enabled = (row.permissions as any)?.[key]
                              ?.enabled;
                            return (
                              <td key={key}>
                                <span
                                  className={`smp-perm-icon ${enabled ? "granted" : "denied"}`}
                                >
                                  {enabled ? "✅" : "⚪"}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              }

              // 本地 fallback 格式
              return (
                <table className="smp-perm-table">
                  <thead>
                    <tr>
                      <th>{t("角色", "Role")}</th>
                      <th>{t("查看报告", "View Reports")}</th>
                      <th>{t("编辑规则", "Edit Rules")}</th>
                      <th>{t("管理用户", "Manage Users")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {permMatrix.map((row: any) => (
                      <tr key={row.roleKey}>
                        <td>{t(row.role, row.roleEn)}</td>
                        <td>
                          <span className={`smp-perm-icon ${row.viewReports}`}>
                            {row.viewReports === "granted" ? "✅" : "⚪"}
                          </span>
                        </td>
                        <td>
                          <span className={`smp-perm-icon ${row.editRules}`}>
                            {row.editRules === "granted" ? "✅" : "⚪"}
                          </span>
                        </td>
                        <td>
                          <span className={`smp-perm-icon ${row.manageUsers}`}>
                            {row.manageUsers === "granted" ? "✅" : "⚪"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div
          className="smp-modal-overlay"
          onClick={() => setShowAddModal(false)}
        >
          <div className="smp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="smp-modal-header">
              <h3>{t("添加用户", "Add User")}</h3>
              <button
                className="smp-modal-close"
                onClick={() => setShowAddModal(false)}
              >
                &#10005;
              </button>
            </div>
            <div className="smp-modal-body">
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      color: "#94a3b8",
                      marginBottom: 4,
                    }}
                  >
                    {t("姓名", "Name")} *
                  </label>
                  <input
                    className="smp-modal-input"
                    value={newUser.name}
                    onChange={(e) =>
                      setNewUser({ ...newUser, name: e.target.value })
                    }
                    placeholder={t("输入姓名", "Enter name")}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      color: "#94a3b8",
                      marginBottom: 4,
                    }}
                  >
                    {t("邮箱", "Email")} *
                  </label>
                  <input
                    className="smp-modal-input"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser({ ...newUser, email: e.target.value })
                    }
                    placeholder={t("输入邮箱", "Enter email")}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      color: "#94a3b8",
                      marginBottom: 4,
                    }}
                  >
                    {t("密码", "Password")} *
                  </label>
                  <input
                    className="smp-modal-input"
                    type="password"
                    value={newUser.password}
                    onChange={(e) =>
                      setNewUser({ ...newUser, password: e.target.value })
                    }
                    placeholder={t(
                      "8-64位，含字母和数字",
                      "8-64 chars, letters & numbers",
                    )}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      color: "#94a3b8",
                      marginBottom: 4,
                    }}
                  >
                    {t("角色", "Role")}
                  </label>
                  <select
                    className="smp-modal-input"
                    value={newUser.role}
                    onChange={(e) =>
                      setNewUser({ ...newUser, role: e.target.value as Role })
                    }
                  >
                    <option value="ADMIN">{t("管理员", "Admin")}</option>
                    <option value="ANALYST">{t("分析员", "Analyst")}</option>
                    <option value="RISK_MANAGER">
                      {t("风险管理者", "Risk Manager")}
                    </option>
                  </select>
                </div>
                {addError && (
                  <div style={{ color: "#f87171", fontSize: 12 }}>
                    {addError}
                  </div>
                )}
              </div>
            </div>
            <div className="smp-modal-footer">
              <button
                className="smp-modal-btn smp-modal-cancel"
                onClick={() => setShowAddModal(false)}
              >
                {t("取消", "Cancel")}
              </button>
              <button
                className="smp-modal-btn smp-modal-save"
                onClick={handleAddUser}
                disabled={addLoading}
              >
                {addLoading ? t("添加中...", "Adding...") : t("添加", "Add")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
