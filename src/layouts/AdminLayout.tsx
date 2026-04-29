import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useLanguage } from "../i18n/useLanguage";
import {
  useAuthStore,
  getRoleName,
  type Permission,
} from "../store/useAuthStore";
import {
  LayoutDashboard,
  Plane,
  TowerControl,
  Users,
  PlaneTakeoff,
  CloudSun,
  BarChart3,
  ShieldAlert,
  Settings,
  LogOut,
} from "lucide-react";
import "./AdminLayout.css";

interface MenuItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  children?: { path: string; label: string }[];
  permission?: Permission; // 需要的权限，不设则所有人可见
}

export function AdminLayout() {
  const location = useLocation();
  const { t } = useLanguage();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const hasPermission = useAuthStore((s) => s.hasPermission);

  const menuItems: MenuItem[] = [
    {
      path: "/",
      label: t("工作台", "Dashboard"),
      icon: <LayoutDashboard size={16} />,
    },
    {
      path: "/risk-monitoring/flights",
      label: t("航班", "Flights"),
      icon: <Plane size={16} />,
    },
    {
      path: "/airport-center/airport-list",
      label: t("机场", "Airports"),
      icon: <TowerControl size={16} />,
    },
    {
      path: "/personnel-center/personnel-list",
      label: t("人", "Personnel"),
      icon: <Users size={16} />,
    },
    {
      path: "/aircraft-topic/aircraft-list",
      label: t("机", "Aircraft"),
      icon: <PlaneTakeoff size={16} />,
    },
    {
      path: "/environment-topic/environment-detail",
      label: t("环", "Environment"),
      icon: <CloudSun size={16} />,
    },
    // 治理闭环导航已移除
    {
      path: "/statistical-analysis",
      label: t("统计分析", "Statistics"),
      icon: <BarChart3 size={16} />,
    },
    {
      path: "/knowledge-center",
      label: t("风险因子库", "Risk Factor Library"),
      icon: <ShieldAlert size={16} />,
      permission: "edit_rules",
    },
    {
      path: "/system-management",
      label: t("系统管理", "System Mgmt"),
      icon: <Settings size={16} />,
      permission: "manage_users",
    },
  ];

  const visibleMenuItems = menuItems.filter(
    (item) => !item.permission || hasPermission(item.permission),
  );

  const isMenuActive = (item: MenuItem) => {
    if (item.path === "/") return location.pathname === "/";
    if (item.children?.length) {
      return item.children.some((child) =>
        location.pathname.startsWith(child.path),
      );
    }
    return location.pathname.startsWith(item.path);
  };

  return (
    <div className="al-root">
      {/* ===== Horizontal Top Nav ===== */}
      <nav className="al-topnav">
        {/* Brand */}
        <div className="al-brand">
          <div className="al-brand-mark">M</div>
          <div className="al-brand-name">
            {t("风险智能预警与训练支持系统", "MRIWP")}
          </div>
        </div>

        {/* Menu items */}
        <div className="al-nav-menu">
          {visibleMenuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={`al-nav-item ${isMenuActive(item) ? "al-nav-active" : ""}`}
            >
              <span className="al-nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="al-spacer" />

        {/* Meta area */}
        <div className="al-nav-meta">
          <div className="al-meta-item">
            <span className="al-meta-value">2026‑03‑23 / 02:20:14</span>
          </div>
          {user && (
            <>
              <div className="al-meta-div" />
              <div className="al-meta-item al-user-info">
                <span className="al-user-name">{user.name}</span>
                <span className="al-user-role">
                  {user.roles?.map((r) => getRoleName(r, t)).join(" / ")}
                </span>
              </div>
              <button
                className="al-logout-btn"
                onClick={logout}
                title={t("退出登录", "Logout")}
              >
                <LogOut size={14} />
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Content */}
      <div className="al-content">
        <Outlet />
      </div>
    </div>
  );
}
