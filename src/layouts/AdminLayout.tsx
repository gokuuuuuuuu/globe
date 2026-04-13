import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useLanguage } from "../i18n/useLanguage";
import "./AdminLayout.css";

interface MenuItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  children?: { path: string; label: string }[];
}

export function AdminLayout() {
  const location = useLocation();
  const { lang, setLang, t } = useLanguage();

  const menuItems: MenuItem[] = [
    {
      path: "/",
      label: t("工作台", "Dashboard"),
      icon: <span>▦</span>,
    },
    {
      path: "/risk-monitoring/flights",
      label: t("航班", "Flights"),
      icon: <span>△</span>,
    },
    {
      path: "/airport-center/airport-list",
      label: t("机场", "Airports"),
      icon: <span>→</span>,
    },
    {
      path: "/personnel-center/personnel-list",
      label: t("人", "Personnel"),
      icon: <span>◉</span>,
    },
    {
      path: "/aircraft-topic/aircraft-list",
      label: t("机", "Aircraft"),
      icon: <span>✦</span>,
    },
    {
      path: "/environment-topic/environment-detail",
      label: t("环", "Environment"),
      icon: <span>✦</span>,
    },
    {
      path: "/governance/work-order-list",
      label: t("治理闭环", "Governance"),
      icon: <span>☑</span>,
    },
    {
      path: "/statistical-analysis",
      label: t("统计分析", "Statistics"),
      icon: <span>▤</span>,
    },
    {
      path: "/knowledge-center",
      label: t("风险因子库", "Risk Factor Library"),
      icon: <span>❏</span>,
    },
    {
      path: "/system-management",
      label: t("系统管理", "System Mgmt"),
      icon: <span>⚙</span>,
    },
  ];

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
            {t("重大风险智能预警平台", "MRIWP")}
          </div>
        </div>

        {/* Menu items */}
        <div className="al-nav-menu">
          {menuItems.map((item) => (
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
            <span className="al-live">
              <span className="al-live-pulse" />
              SYNC
            </span>
          </div>
          <div className="al-meta-item">
            <span className="al-meta-label">LATENCY</span>
            <span className="al-meta-value">1.2s</span>
          </div>
          <div className="al-meta-div" />
          <div className="al-meta-item">
            <span className="al-meta-value">2026‑03‑23 / 02:20:14</span>
          </div>
          <div className="al-meta-div" />
          <button
            className="al-lang-btn"
            onClick={() => setLang(lang === "zh" ? "en" : "zh")}
            title={t("切换为英文", "Switch to Chinese")}
          >
            {lang === "zh" ? "中文" : "EN"}
          </button>
          <button className="al-icon-btn" title="Search">
            ⌕
          </button>
          <button className="al-icon-btn" title="Grid">
            ⊞
          </button>
        </div>
      </nav>

      {/* Content */}
      <div className="al-content">
        <Outlet />
      </div>
    </div>
  );
}
