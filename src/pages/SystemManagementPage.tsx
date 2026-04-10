import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../i18n/useLanguage";
import "./SystemManagementPage.css";

// ===== Types =====

type Role = "admin" | "analyst" | "risk-manager";
type UserStatus = "active" | "disabled";

interface User {
  id: string;
  name: string;
  email: string;
  roles: Role[];
  status: UserStatus;
  lastLogin: string;
}

// ===== Mock Data =====

const USERS: User[] = [
  {
    id: "80001",
    name: "Jame Smith",
    email: "dennseaan@gmail.com",
    roles: ["admin"],
    status: "active",
    lastLogin: "Jun 13, 2023",
  },
  {
    id: "90002",
    name: "Manny Smith",
    email: "manzjiat@gmail.com",
    roles: ["analyst", "risk-manager"],
    status: "disabled",
    lastLogin: "Jan 25, 2023",
  },
  {
    id: "80003",
    name: "Ramclateny",
    email: "darashnoa@gmail.com",
    roles: ["analyst", "analyst"],
    status: "active",
    lastLogin: "Jun 13, 2023",
  },
  {
    id: "80004",
    name: "Jamtissov",
    email: "jamshurl@gmail.com",
    roles: ["risk-manager"],
    status: "active",
    lastLogin: "Jun 17, 2023",
  },
  {
    id: "80005",
    name: "Davin Smith",
    email: "barinsmith@gmail.com",
    roles: ["risk-manager"],
    status: "disabled",
    lastLogin: "Jun 17, 2023",
  },
  {
    id: "80006",
    name: "Marvy Thumni",
    email: "manarston@gmail.com",
    roles: ["admin"],
    status: "active",
    lastLogin: "",
  },
  {
    id: "80007",
    name: "Marc Hode",
    email: "mewhools@gmail.com",
    roles: ["analyst"],
    status: "active",
    lastLogin: "",
  },
  {
    id: "80008",
    name: "Laran Say",
    email: "larankey@gmail.com",
    roles: ["analyst"],
    status: "disabled",
    lastLogin: "",
  },
  {
    id: "800010",
    name: "Saroni Wooom",
    email: "nazsaan@gmail.com",
    roles: ["risk-manager"],
    status: "active",
    lastLogin: "",
  },
  {
    id: "800011",
    name: "Jory Deenn",
    email: "maleven@gmail.com",
    roles: ["admin"],
    status: "disabled",
    lastLogin: "",
  },
  {
    id: "800112",
    name: "Farma Manguin",
    email: "arrernan@gmail.com",
    roles: ["analyst", "risk-manager"],
    status: "active",
    lastLogin: "",
  },
  {
    id: "800113",
    name: "Nick Bang",
    email: "nicktrans@gmail.com",
    roles: ["risk-manager", "analyst"],
    status: "active",
    lastLogin: "",
  },
  {
    id: "800114",
    name: "John Emtha",
    email: "adkostas@gmail.com",
    roles: ["risk-manager"],
    status: "disabled",
    lastLogin: "",
  },
];

const PERM_MATRIX = [
  {
    role: "Admin",
    viewReports: "granted",
    editRules: "granted",
    manageUsers: "granted",
  },
  {
    role: "Analyst",
    viewReports: "granted",
    editRules: "partial",
    manageUsers: "granted",
  },
  {
    role: "Risk Manager",
    viewReports: "granted",
    editRules: "granted",
    manageUsers: "granted",
  },
];

// ===== Component =====

export function SystemManagementPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [page] = useState(1);

  const tRole = (role: Role) => {
    const map: Record<Role, [string, string]> = {
      admin: ["管理员", "Admin"],
      analyst: ["分析师", "Analyst"],
      "risk-manager": ["风险经理", "Risk Manager"],
    };
    return t(map[role][0], map[role][1]);
  };

  const tStatus = (status: UserStatus) =>
    status === "active" ? t("启用", "Active") : t("禁用", "Disabled");

  const filtered = USERS.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.id.includes(q) ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

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
                placeholder={t("搜索...", "Search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="smp-toolbar-right">
              <button className="smp-filter-btn">
                &#9776;&nbsp;{t("筛选", "Filters")}&nbsp;&#9662;
              </button>
              <button className="smp-add-btn">
                {t("添加用户", "Add User")}
              </button>
            </div>
          </div>

          <div className="smp-table-card">
            <div className="smp-table-scroll">
              <table className="smp-table">
                <thead>
                  <tr>
                    <th style={{ width: 36 }} />
                    <th className="sortable">
                      {t("用户 ID", "User ID")}
                      <span className="smp-sort-icon">↑</span>
                    </th>
                    <th>{t("姓名", "Name")}</th>
                    <th>{t("邮箱", "Email")}</th>
                    <th className="sortable">
                      {t("分配角色", "Assigned Roles")}
                      <span className="smp-sort-icon">⇅</span>
                    </th>
                    <th>{t("状态", "Status")}</th>
                    <th className="sortable">
                      {t("最后登录", "Last Login")}
                      <span className="smp-sort-icon">⇅</span>
                    </th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u.id}>
                      <td />
                      <td>{u.id}</td>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>
                        <div className="smp-role-badges">
                          {u.roles.map((r, i) => (
                            <span key={i} className={`smp-role-badge ${r}`}>
                              {tRole(r)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className="smp-status">
                          <span className={`smp-status-dot ${u.status}`} />
                          {tStatus(u.status)}
                        </span>
                      </td>
                      <td>{u.lastLogin || "—"}</td>
                      <td>
                        <button className="smp-more-btn">&#8943;</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="smp-pagination">
              <button className="smp-page-btn">&lsaquo;</button>
              <button className="smp-page-btn active">{page}</button>
              <button className="smp-page-btn">&rsaquo;</button>
            </div>
          </div>
        </div>

        {/* Right: Role-Permission Matrices */}
        <div className="smp-right">
          <div className="smp-right-card">
            <div className="smp-right-title">
              {t("角色权限矩阵", "Role-Permission Matrices")}
            </div>
            <table className="smp-perm-table">
              <thead>
                <tr>
                  <th>{t("分配角色", "Assigned Role")}</th>
                  <th colSpan={3}>{t("权限", "Permissions")}</th>
                  <th>{t("操作", "Actions")}</th>
                </tr>
                <tr>
                  <th>{t("角色", "Role")}</th>
                  <th>
                    <span className="smp-perm-header-icon">&#128196;</span>
                    {t("查看报告", "View Reports")}
                  </th>
                  <th>
                    <span className="smp-perm-header-icon">&#9998;</span>
                    {t("编辑规则", "Edit Rules")}
                  </th>
                  <th>
                    <span className="smp-perm-header-icon">&#128101;</span>
                    {t("管理用户", "Manage Users")}
                  </th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {PERM_MATRIX.map((row) => (
                  <tr key={row.role}>
                    <td>
                      {t(
                        row.role === "Admin"
                          ? "管理员"
                          : row.role === "Analyst"
                            ? "分析师"
                            : "风险经理",
                        row.role,
                      )}
                    </td>
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
                    <td />
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="smp-perm-pagination">
              <span>1 our 3</span>
              <button className="smp-perm-nav-btn">&lsaquo;</button>
              <button className="smp-perm-nav-btn">&rsaquo;</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
