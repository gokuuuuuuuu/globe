import { useState } from "react";
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
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-[18px] h-[18px]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      ),
    },
    {
      path: "/risk-monitoring",
      label: t("风险监控", "Risk Monitoring"),
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-[18px] h-[18px]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
      children: [
        {
          path: "/risk-monitoring/flights",
          label: t("航班列表", "Flight List"),
        },
        {
          path: "/risk-monitoring/flight-detail",
          label: t("航班详情", "Flight Detail"),
        },
        {
          path: "/risk-monitoring/flight-report",
          label: t("航班报告", "Flight Report"),
        },
        {
          path: "/risk-monitoring/factor-explanation",
          label: t("因子解释", "Factor Explanation"),
        },
        {
          path: "/risk-monitoring/evidence-chain",
          label: t("证据链", "Evidence Chain"),
        },
        {
          path: "/risk-monitoring/major-risk-detail",
          label: t("重大风险详情", "Major Risk Detail"),
        },
      ],
    },
    {
      path: "/airport-center",
      label: t("机场中心", "Airport Center"),
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-[18px] h-[18px]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
        </svg>
      ),
      children: [
        {
          path: "/airport-center/airport-list",
          label: t("机场列表", "Airport List"),
        },
        {
          path: "/airport-center/airport-detail",
          label: t("机场详情", "Airport Detail"),
        },
        {
          path: "/airport-center/airport-flights",
          label: t("机场相关航班", "Airport Related Flights"),
        },
      ],
    },
    {
      path: "/personnel-center",
      label: t("人员中心", "Personnel Center"),
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-[18px] h-[18px]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      children: [
        {
          path: "/personnel-center/personnel-list",
          label: t("人员列表", "Personnel List"),
        },
        {
          path: "/personnel-center/personnel-detail",
          label: t("人员详情", "Personnel Detail"),
        },
        {
          path: "/personnel-center/personnel-trend",
          label: t("个人趋势", "Personal Trend"),
        },
        {
          path: "/personnel-center/personnel-vs-fleet",
          label: t("个人 VS 机队", "Personal vs Fleet"),
        },
        {
          path: "/personnel-center/training-data",
          label: t("训练数据", "Training Data"),
        },
        {
          path: "/personnel-center/historical-flights",
          label: t("历史航班", "Historical Flights"),
        },
      ],
    },
    {
      path: "/aircraft-topic",
      label: t("飞机专题", "Aircraft Topic"),
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-[18px] h-[18px]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 2L11 13" />
          <path d="M22 2L15 22 11 13 2 9l20-7z" />
        </svg>
      ),
      children: [
        {
          path: "/aircraft-topic/aircraft-detail",
          label: t("飞机详情", "Aircraft Detail"),
        },
        {
          path: "/aircraft-topic/maintenance-info",
          label: t("维修信息", "Maintenance Info"),
        },
      ],
    },
    {
      path: "/environment-topic",
      label: t("环境专题", "Environment Topic"),
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-[18px] h-[18px]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          <circle cx="12" cy="12" r="4" />
        </svg>
      ),
      children: [
        {
          path: "/environment-topic/environment-detail",
          label: t("环境详情", "Environment Detail"),
        },
        {
          path: "/environment-topic/message-detail",
          label: t("报文详情", "Message Detail"),
        },
        {
          path: "/environment-topic/notice-detail",
          label: t("通告详情", "Notice Detail"),
        },
      ],
    },
    {
      path: "/governance",
      label: t("治理闭环", "Governance"),
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-[18px] h-[18px]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      ),
      children: [
        {
          path: "/governance/work-order-list",
          label: t("工单列表", "Work Order List"),
        },
        {
          path: "/governance/work-order-detail",
          label: t("工单详情", "Work Order Detail"),
        },
        {
          path: "/governance/feedback-review",
          label: t("反馈复核", "Feedback Review"),
        },
      ],
    },
    {
      path: "/statistical-analysis",
      label: t("统计分析", "Statistical Analysis"),
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-[18px] h-[18px]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
    },
    {
      path: "/knowledge-center",
      label: t("规则与知识中心", "Rules & Knowledge Center"),
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-[18px] h-[18px]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      ),
    },
    {
      path: "/system-management",
      label: t("系统管理", "System Management"),
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-[18px] h-[18px]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
    },
  ];

  const bottomItems: MenuItem[] = [];

  const [expandedMenus, setExpandedMenus] = useState<string[]>(() => {
    const allItems = menuItems;
    const match = allItems.find((item) =>
      item.children?.some((child) => location.pathname.startsWith(child.path)),
    );
    return match ? [match.path] : [];
  });

  const toggleExpand = (path: string) => {
    setExpandedMenus((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path],
    );
  };

  const isMenuActive = (item: MenuItem) => {
    if (item.path === "/") return location.pathname === "/";
    if (item.children?.length) {
      return item.children.some((child) =>
        location.pathname.startsWith(child.path),
      );
    }
    return location.pathname.startsWith(item.path);
  };

  const renderMenuItem = (item: MenuItem) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus.includes(item.path);
    const active = isMenuActive(item);

    if (hasChildren) {
      return (
        <div key={item.path}>
          <button
            onClick={() => toggleExpand(item.path)}
            className={`al-menu-item ${active ? "al-menu-active" : ""}`}
          >
            <span className="al-menu-icon">{item.icon}</span>
            <span className="al-menu-label">{item.label}</span>
            <svg
              className={`al-menu-chevron ${isExpanded ? "al-chevron-open" : ""}`}
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {isExpanded && (
            <div className="al-submenu">
              {item.children!.map((child) => (
                <NavLink
                  key={child.path}
                  to={child.path}
                  className={({ isActive }) =>
                    `al-submenu-item ${isActive ? "al-submenu-active" : ""}`
                  }
                >
                  {child.label}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <NavLink
        key={item.path}
        to={item.path}
        end={item.path === "/"}
        className={({ isActive }) =>
          `al-menu-item ${isActive ? "al-menu-active" : ""}`
        }
      >
        <span className="al-menu-icon">{item.icon}</span>
        <span className="al-menu-label">{item.label}</span>
      </NavLink>
    );
  };

  return (
    <div className="al-root">
      <nav className="al-sidebar">
        {/* Logo */}
        <div className="al-logo">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="al-logo-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
          <span className="al-logo-text">MRIWP</span>
        </div>

        {/* Main menu */}
        <div className="al-menu">{menuItems.map(renderMenuItem)}</div>

        {/* Bottom: language toggle + settings */}
        <div className="al-menu-bottom">
          <button
            className="al-lang-toggle"
            onClick={() => setLang(lang === "zh" ? "en" : "zh")}
            title={t("切换为英文", "Switch to Chinese")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-[18px] h-[18px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span className="al-lang-label">
              {lang === "zh" ? "中文" : "EN"}
            </span>
          </button>
          {bottomItems.map(renderMenuItem)}
        </div>
      </nav>

      {/* Content */}
      <div className="al-content">
        <Outlet />
      </div>
    </div>
  );
}
