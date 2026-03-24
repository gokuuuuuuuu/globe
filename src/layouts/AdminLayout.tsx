import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import "./AdminLayout.css";

interface MenuItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  children?: { path: string; label: string }[];
}

const menuItems: MenuItem[] = [
  {
    path: "/",
    label: "Dashboard",
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
    label: "Risk Monitoring",
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
    children: [{ path: "/risk-monitoring/flights", label: "Flight List (P2)" }],
  },
  {
    path: "/operational-data",
    label: "Operational Data",
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
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
    children: [],
  },
  {
    path: "/governance",
    label: "Governance",
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
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    children: [],
  },
];

const bottomItems: MenuItem[] = [
  {
    path: "/settings",
    label: "Settings",
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

export function AdminLayout() {
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(() => {
    // Auto-expand menu that matches current path
    const match = menuItems.find((item) =>
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
          <span className="al-logo-text">ARVIS</span>
        </div>

        {/* Main menu */}
        <div className="al-menu">{menuItems.map(renderMenuItem)}</div>

        {/* Bottom menu */}
        <div className="al-menu-bottom">{bottomItems.map(renderMenuItem)}</div>
      </nav>

      {/* Content */}
      <div className="al-content">
        <Outlet />
      </div>
    </div>
  );
}
