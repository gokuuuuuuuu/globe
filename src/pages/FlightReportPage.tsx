//@ts-nocheck
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../i18n/useLanguage";
import "./FlightReportPage.css";

const NAV_SECTIONS = [
  {
    id: "composite-risk",
    labelZh: "综合风险结论",
    labelEn: "Composite Risk Conclusion",
    icon: "chart",
  },
  {
    id: "flight-phase",
    labelZh: "飞行阶段风险分析",
    labelEn: "Flight Phase Risk Analysis",
    icon: "phase",
  },
  {
    id: "human-factor",
    labelZh: "人为因素分析",
    labelEn: "Human Factor Analysis",
    icon: "human",
  },
  {
    id: "aircraft-factor",
    labelZh: "飞机因素分析",
    labelEn: "Aircraft Factor Analysis",
    icon: "aircraft",
  },
  {
    id: "env-factor",
    labelZh: "环境因素分析",
    labelEn: "Environmental Factor Analysis",
    icon: "env",
  },
  {
    id: "major-risk",
    labelZh: "重大风险事件说明",
    labelEn: "Major Risk Event Explanation",
    icon: "alert",
  },
  {
    id: "evidence",
    labelZh: "证据附录",
    labelEn: "Evidence Appendix",
    icon: "evidence",
  },
  {
    id: "governance",
    labelZh: "治理记录",
    labelEn: "Governance Records",
    icon: "gov",
  },
  {
    id: "flight-facts",
    labelZh: "航班事实",
    labelEn: "Flight Facts",
    icon: "doc",
  },
  {
    id: "factor-explanation",
    labelZh: "因子解释",
    labelEn: "Factor Explanation",
    icon: "doc",
  },
  {
    id: "evidence-chain",
    labelZh: "证据链",
    labelEn: "Evidence Chain",
    icon: "evidence",
  },
  {
    id: "major-risk-detail",
    labelZh: "重大风险详情",
    labelEn: "Major Risk Detail",
    icon: "alert",
  },
];

const flightInfo = {
  flightId: "737-AR123",
  date: "Oct 26, 2023",
  aircraft: "Boeing 737-800",
  pilot: "Joren Conman",
  route: "KORD-KJFK",
  status: "Complete",
  summary: "Summary are critical analysis...",
};

// Icons for sidebar nav
function NavIcon({ type }: { type: string }) {
  const s = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (type) {
    case "doc":
      return (
        <svg {...s}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      );
    case "chart":
      return (
        <svg {...s}>
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      );
    case "phase":
      return (
        <svg {...s}>
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      );
    case "human":
      return (
        <svg {...s}>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    case "aircraft":
      return (
        <svg {...s}>
          <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
        </svg>
      );
    case "env":
      return (
        <svg {...s}>
          <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
        </svg>
      );
    case "alert":
      return (
        <svg {...s}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      );
    case "evidence":
      return (
        <svg {...s}>
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      );
    case "gov":
      return (
        <svg {...s}>
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      );
    default:
      return null;
  }
}

export function FlightReportPage() {
  const [activeSection, setActiveSection] = useState("composite-risk");
  const { t } = useLanguage();
  const navigate = useNavigate();

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="fr-root">
      {/* Breadcrumb */}
      <div className="fr-breadcrumb">
        <span style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
          {t("工作台", "Dashboard")}
        </span>
        <span className="fr-breadcrumb-sep">&gt;</span>
        <span
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/risk-monitoring/flights")}
        >
          {t("航班", "Flights")}
        </span>
        <span className="fr-breadcrumb-sep">&gt;</span>
        <span className="fr-breadcrumb-active">
          {t("航班报告", "Flight Report")}
        </span>
      </div>

      {/* Page Header */}
      <div className="fr-page-header">
        <h1 className="fr-page-title">{t("航班报告", "Flight Report")}</h1>
        <div className="fr-header-actions">
          <button className="fr-btn">{t("导出", "Export")}</button>
          <button
            className="fr-btn fr-btn-primary"
            onClick={() => navigate(-1)}
          >
            {t("返回", "Back")}
          </button>
        </div>
      </div>

      {/* Info bar removed - duplicates Flight Facts section */}

      {/* Body: nav + content */}
      <div className="fr-body">
        {/* Sidebar Nav */}
        <nav className="fr-nav">
          {NAV_SECTIONS.map((sec) => (
            <button
              key={sec.id}
              className={`fr-nav-item ${activeSection === sec.id ? "fr-nav-item-active" : ""}`}
              onClick={() => scrollToSection(sec.id)}
            >
              <span className="fr-nav-icon">
                <NavIcon type={sec.icon} />
              </span>
              {t(sec.labelZh, sec.labelEn)}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="fr-content">
          {/* 1. Composite Risk Conclusion */}
          <div id="composite-risk" className="fr-section">
            <h2 className="fr-section-title">
              {t("综合风险结论", "Composite Risk Conclusion")}
            </h2>
            <div className="fr-grid-2">
              <div className="fr-card">
                <div className="fr-overall-risk">
                  <div>
                    <div className="fr-overall-label">
                      {t("总体风险：", "OVERALL RISK:")}
                    </div>
                    <div className="fr-overall-value fr-overall-value-red">
                      HIGH (Red)
                    </div>
                  </div>
                  <div>
                    <div className="fr-overall-label">
                      {t("风险评分：", "RISK SCORE:")}
                    </div>
                    <div
                      className="fr-overall-value"
                      style={{ color: "#f8fafc" }}
                    >
                      78/100
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 20,
                    alignItems: "center",
                    marginBottom: 16,
                  }}
                >
                  <div
                    className="fr-donut"
                    style={{
                      background: `conic-gradient(#ef4444 0deg 138deg, #f97316 138deg 239deg, #eab308 239deg 349deg, #22c55e 349deg 360deg)`,
                    }}
                  >
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: "50%",
                        background: "#1e293b",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "absolute",
                      }}
                    >
                      <span className="fr-donut-center">
                        {t("严重", "Critical")}
                      </span>
                    </div>
                  </div>
                  <div className="fr-donut-legend">
                    <div className="fr-legend-item">
                      <span
                        className="fr-legend-dot"
                        style={{ background: "#ef4444" }}
                      />{" "}
                      {t("严重", "Critical")}{" "}
                      <span className="fr-legend-count">20</span>
                    </div>
                    <div className="fr-legend-item">
                      <span
                        className="fr-legend-dot"
                        style={{ background: "#f97316" }}
                      />{" "}
                      {t("高", "High")}{" "}
                      <span className="fr-legend-count">28</span>
                    </div>
                    <div className="fr-legend-item">
                      <span
                        className="fr-legend-dot"
                        style={{ background: "#eab308" }}
                      />{" "}
                      {t("中", "Medium")}{" "}
                      <span className="fr-legend-count">3</span>
                    </div>
                    <div className="fr-legend-item">
                      <span
                        className="fr-legend-dot"
                        style={{ background: "#22c55e" }}
                      />{" "}
                      {t("低", "Low")}{" "}
                      <span className="fr-legend-count">1</span>
                    </div>
                  </div>
                </div>
                <h4
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#f8fafc",
                    margin: "0 0 8px",
                  }}
                >
                  {t("简介", "Introduction")}
                </h4>
                <div className="fr-text">
                  <p>
                    The flight recent event consolidation analysis covers
                    preceding composite risk factors including high-to-runway
                    threat and maintenance contributing factors.
                  </p>
                  <ul>
                    <li>
                      <strong>Critical risk:</strong> HIGH risk, a progression
                      in composite risk with fine economic assessment.
                    </li>
                    <li>
                      <strong>High areas:</strong> In-flight cases of excessive
                      contributing factors, distribution centers in volume and
                      risk appendices.
                    </li>
                    <li>
                      <strong>Medium risk:</strong> Routine maintenance exposit
                      and environmental assessment metrics are maintained,
                      resulting in factors managing to other engine contributing
                      factors.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Flight Phase Risk Analysis - separate section */}
          <div id="flight-phase" className="fr-section">
            <h2 className="fr-section-title">
              {t("飞行阶段风险分析", "Flight Phase Risk Analysis")}
            </h2>
            <div className="fr-grid-1">
              <div className="fr-card">
                <div className="fr-card-title">
                  {t("飞行阶段风险分析", "Flight Phase Risk Analysis")}
                </div>
                <div className="fr-text" style={{ marginBottom: 12 }}>
                  The Flight phase risk analysis provides risk distribution
                  across flight phases.
                </div>
                <div className="fr-bar-chart">
                  {[
                    {
                      labelZh: "起飞前",
                      labelEn: "Pre-flight",
                      vals: [1, 2, 3, 2],
                    },
                    { labelZh: "起飞", labelEn: "Takeoff", vals: [2, 3, 4, 3] },
                    { labelZh: "爬升", labelEn: "Climb", vals: [1, 2, 2, 1] },
                    { labelZh: "巡航", labelEn: "Cruise", vals: [3, 5, 8, 2] },
                    { labelZh: "下降", labelEn: "Descent", vals: [1, 2, 3, 1] },
                    {
                      labelZh: "进近",
                      labelEn: "Approach",
                      vals: [2, 3, 4, 2],
                    },
                    { labelZh: "着陆", labelEn: "Landing", vals: [2, 4, 6, 3] },
                  ].map((phase) => {
                    const total = phase.vals.reduce((a, b) => a + b, 0);
                    const colors = ["#ef4444", "#f97316", "#3b82f6", "#22c55e"];
                    return (
                      <div className="fr-bar-group" key={phase.labelEn}>
                        <div
                          className="fr-bar-stack"
                          style={{ height: `${(total / 20) * 100}%` }}
                        >
                          {phase.vals.map((v, i) => (
                            <div
                              key={i}
                              className="fr-bar-segment"
                              style={{
                                height: `${(v / total) * 100}%`,
                                background: colors[i],
                              }}
                            />
                          ))}
                        </div>
                        <div className="fr-bar-label">
                          {t(phase.labelZh, phase.labelEn)}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="fr-chart-legend">
                  {[
                    {
                      labelZh: "严重",
                      labelEn: "Criticalce",
                      color: "#ef4444",
                    },
                    { labelZh: "高", labelEn: "High", color: "#f97316" },
                    { labelZh: "中", labelEn: "Medium", color: "#3b82f6" },
                    { labelZh: "低", labelEn: "Low", color: "#22c55e" },
                  ].map((l) => (
                    <div className="fr-chart-legend-item" key={l.labelEn}>
                      <span
                        className="fr-chart-legend-dot"
                        style={{ background: l.color }}
                      />
                      {t(l.labelZh, l.labelEn)}
                    </div>
                  ))}
                </div>
                <table className="fr-mini-table">
                  <thead>
                    <tr>
                      <th>{t("关键事件", "Critical Events")}</th>
                      <th></th>
                      <th style={{ textAlign: "right" }}>Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        phaseZh: "起飞前",
                        phaseEn: "Pre-flight",
                        detail: "Boeing 737-800",
                        risk: 2,
                      },
                      {
                        phaseZh: "起飞",
                        phaseEn: "Takeoff",
                        detail: "Boeing 737-800",
                        risk: 3,
                      },
                      {
                        phaseZh: "爬升",
                        phaseEn: "Climb",
                        detail: "Boeing 737-800",
                        risk: 3,
                      },
                      {
                        phaseZh: "巡航",
                        phaseEn: "Cruise",
                        detail: "Descent KORD-KJFK",
                        risk: 2,
                      },
                      {
                        phaseZh: "进近",
                        phaseEn: "Approach",
                        detail: "Approach KORD-KJFK",
                        risk: 1,
                      },
                    ].map((r, i) => (
                      <tr key={i}>
                        <td>{t(r.phaseZh, r.phaseEn)}</td>
                        <td>{r.detail}</td>
                        <td style={{ textAlign: "right" }}>{r.risk}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 2. Human Factor Analysis */}
          <div id="human-factor" className="fr-section">
            <h2 className="fr-section-title">
              {t("人为因素分析", "Human Factor Analysis")}
            </h2>
            <div className="fr-grid-2">
              <div className="fr-card">
                <div className="fr-card-title">Metric Cards</div>
                <div className="fr-grid-2" style={{ marginBottom: 16 }}>
                  {[
                    {
                      labelZh: "机组疲劳",
                      labelEn: "Crew Fatigue",
                      badge: "Moderate - Yellow",
                      cls: "fr-badge-moderate",
                    },
                    {
                      labelZh: "通信",
                      labelEn: "Communication",
                      badge: "Good",
                      cls: "fr-badge-good",
                    },
                    {
                      labelZh: "任务负荷",
                      labelEn: "Task Load",
                      badge: "Moderate -",
                      cls: "fr-badge-moderate",
                    },
                    {
                      labelZh: "任务负荷",
                      labelEn: "Task Load",
                      badge: "Good",
                      cls: "fr-badge-good",
                    },
                    {
                      labelZh: "通信",
                      labelEn: "Communication",
                      badge: "Moderate -",
                      cls: "fr-badge-moderate",
                    },
                    {
                      labelZh: "任务负荷",
                      labelEn: "Task Load",
                      badge: "Guessed",
                      cls: "fr-badge-guessed",
                    },
                  ].map((m, i) => (
                    <div className="fr-metric-card" key={i}>
                      <div className="fr-metric-label">
                        {t(m.labelZh, m.labelEn)}
                      </div>
                      <span className={`fr-status-badge ${m.cls}`}>
                        {m.badge}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="fr-text">
                  <p>Three cards converge in four term maintenance factors:</p>
                  <ul>
                    <li>
                      <strong>{t("机组疲劳", "Crew Fatigue")}</strong> -
                      Allimoration, crew own ensure and communication actual
                      problems.
                    </li>
                    <li>
                      <strong>{t("通信", "Communication")}</strong> - Railings
                      and small ercerset eaten aent to more load.
                    </li>
                    <li>
                      <strong>{t("任务负荷", "Task Load")}</strong> - Analytical
                      accolers cont in seeting communicate contributing factors
                      for maintenance aspects and contributing factors.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Aircraft Factor Analysis */}
          <div id="aircraft-factor" className="fr-section">
            <h2 className="fr-section-title">
              {t("飞机因素分析", "Aircraft Factor Analysis")}
            </h2>
            <div className="fr-grid-2">
              <div className="fr-card">
                <div className="fr-card-title">
                  {t("部件系统状态", "Component System Status")}
                </div>
                <div className="fr-component-grid">
                  {[
                    { nameZh: "发动机", nameEn: "Engines", color: "#ef4444" },
                    { nameZh: "航电", nameEn: "Avionics", color: "#f97316" },
                    { nameZh: "液压", nameEn: "Hydraulics", color: "#22c55e" },
                    { nameZh: "发动机", nameEn: "Engines", color: "#22c55e" },
                    { nameZh: "航电", nameEn: "Avionics", color: "#22c55e" },
                    { nameZh: "液压", nameEn: "Hydraulics", color: "#22c55e" },
                  ].map((c, i) => (
                    <div className="fr-component-item" key={i}>
                      <span className="fr-component-name">
                        {t(c.nameZh, c.nameEn)}
                      </span>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <span
                          className="fr-status-dot"
                          style={{ background: c.color }}
                        />
                        <span
                          className="fr-component-status"
                          style={{ color: c.color }}
                        >
                          {t("状态", "Status")}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 16 }}>
                  <div className="fr-status-row">
                    <span className="fr-status-label">
                      {t("维修日志", "Maintenance logs")}
                    </span>
                    <span className="fr-status-badge fr-badge-moderate">
                      {t("摘要", "Summary")}
                    </span>
                  </div>
                  <div className="fr-status-row">
                    <span className="fr-status-label">
                      {t("维修日志摘要", "Maintenance logs summary")}
                    </span>
                    <span className="fr-status-badge fr-badge-moderate">
                      {t("摘要", "Summary")}
                    </span>
                  </div>
                  <div className="fr-status-row">
                    <span className="fr-status-label">
                      {t("维修状态标签", "Maintenance status tag")}
                    </span>
                    <span className="fr-status-badge fr-badge-complete">
                      Complete
                    </span>
                  </div>
                </div>
              </div>
              <div className="fr-card">
                <div className="fr-card-title">
                  {t("风险阶段分析", "Risk Phase Analysis")}
                </div>
                <div className="fr-bar-chart" style={{ height: 120 }}>
                  {[
                    { labelZh: "起飞", labelEn: "Takeoff", vals: [3, 4, 5, 2] },
                    { labelZh: "爬升", labelEn: "Climb", vals: [2, 3, 4, 1] },
                    { labelZh: "巡航", labelEn: "Cruise", vals: [4, 5, 6, 3] },
                    { labelZh: "下降", labelEn: "Descent", vals: [2, 3, 3, 2] },
                    { labelZh: "着陆", labelEn: "Landing", vals: [3, 4, 5, 2] },
                  ].map((phase) => {
                    const total = phase.vals.reduce((a, b) => a + b, 0);
                    const colors = ["#ef4444", "#f97316", "#3b82f6", "#22c55e"];
                    return (
                      <div className="fr-bar-group" key={phase.labelEn}>
                        <div
                          className="fr-bar-stack"
                          style={{ height: `${(total / 20) * 100}%` }}
                        >
                          {phase.vals.map((v, i) => (
                            <div
                              key={i}
                              className="fr-bar-segment"
                              style={{
                                height: `${(v / total) * 100}%`,
                                background: colors[i],
                              }}
                            />
                          ))}
                        </div>
                        <div className="fr-bar-label">
                          {t(phase.labelZh, phase.labelEn)}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="fr-chart-legend">
                  {[
                    { label: "Maintenance", color: "#ef4444" },
                    { labelZh: "航电", labelEn: "Avionics", color: "#f97316" },
                    {
                      labelZh: "液压",
                      labelEn: "Hydraulics",
                      color: "#3b82f6",
                    },
                  ].map((l) => (
                    <div
                      className="fr-chart-legend-item"
                      key={"labelEn" in l ? l.labelEn : l.label}
                    >
                      <span
                        className="fr-chart-legend-dot"
                        style={{ background: l.color }}
                      />
                      {"labelZh" in l ? t(l.labelZh, l.labelEn) : l.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Environmental Factor Analysis */}
          <div id="env-factor" className="fr-section">
            <h2 className="fr-section-title">
              {t("环境因素分析", "Environmental Factor Analysis")}
            </h2>
            <div className="fr-grid-2">
              <div className="fr-card">
                <div className="fr-card-title">
                  {t("天气与环境", "Weather & Environment")}
                </div>
                <div className="fr-text" style={{ marginBottom: 12 }}>
                  Environmental factor analysis covers the main environmental
                  risk categories affecting this flight.
                </div>
                <div className="fr-text">
                  <ul>
                    <li>
                      <strong>{t("天气状况", "Weather conditions")}:</strong>{" "}
                      {t("到达附近雷暴", "Thunderstorms near arrival")}.
                    </li>
                    <li>
                      <strong>Weather density:</strong> Moderate wind and
                      crosswind from air traffic conditions.
                    </li>
                    <li>
                      <strong>
                        {t("空中交通密度", "Air traffic density")}:
                      </strong>{" "}
                      Maintenance awaiting metrics contributing to contributing
                      factor analysis.
                    </li>
                  </ul>
                </div>
                <h4
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#f8fafc",
                    margin: "12px 0 8px",
                  }}
                >
                  {t("关键分析：", "Key Analysis:")}
                </h4>
                <div className="fr-text">
                  <ul>
                    <li>
                      <strong>{t("发动机", "Engines")}:</strong> Increase manner
                      factors and flight
                    </li>
                    <li>
                      <strong>{t("通信", "Communication")}:</strong> In-flight
                      chaels and actanics convention and communication systems.
                    </li>
                  </ul>
                </div>
              </div>
              <div className="fr-card">
                <div className="fr-card-title">
                  {t("环境条件", "Environmental Conditions")}
                </div>
                <div className="fr-grid-2">
                  <div>
                    <div className="fr-env-item">
                      <div className="fr-env-label">
                        {t("天气状况", "Weather conditions")}
                      </div>
                      <div className="fr-env-value">
                        {t("到达附近雷暴", "Thunderstorms near arrival")}
                      </div>
                    </div>
                    <div className="fr-env-item">
                      <div className="fr-env-label">
                        {t("空中交通密度", "Air traffic density")}
                      </div>
                      <div className="fr-env-value">
                        {t("场地交通", "Site traffic")}
                      </div>
                    </div>
                    <div className="fr-env-item">
                      <div className="fr-env-label">{t("天气", "Weather")}</div>
                      <div className="fr-env-value">
                        {t("适中", "Moderate")}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="fr-env-item">
                      <div className="fr-env-label">Airmanity</div>
                      <div className="fr-env-value">
                        {t("正常范围", "Normal range")}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Major Risk Event Explanation */}
          <div id="major-risk" className="fr-section">
            <h2 className="fr-section-title">
              {t("重大风险事件说明", "Major Risk Event Explanation")}
            </h2>
            <div className="fr-card">
              <div className="fr-text">
                <p>
                  This section details the top risk events identified during the
                  flight analysis, including their causes, severity, and
                  recommended mitigations.
                </p>
                <ul>
                  <li>
                    <strong>Severe Turbulence (Critical - Red):</strong>{" "}
                    Thunderstorms forecasted along the flight path. Recommended
                    action: alter altitude or route to avoid convective activity
                    zones.
                  </li>
                  <li>
                    <strong>Communication Loss (High):</strong> Radio
                    interference detected in cruise phase. Backup communication
                    channels should be activated according to standard
                    procedures.
                  </li>
                  <li>
                    <strong>Engine Issue (Critical - High):</strong> Maintenance
                    indicators suggest monitoring engine performance closely.
                    Thunderstorm ingestion risk elevated.
                  </li>
                  <li>
                    <strong>Crosswind Landing (Medium):</strong> Destination
                    airport reporting strong crosswinds. Crew should prepare for
                    potential go-around scenario.
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* 6. Evidence Appendix */}
          <div id="evidence" className="fr-section">
            <h2 className="fr-section-title">
              {t("证据附录", "Evidence Appendix")}
            </h2>
            <div className="fr-grid-2">
              <div className="fr-card">
                <div className="fr-card-title">
                  {t("证据摘要", "Evidence Summary")}
                </div>
                <div className="fr-evidence-block">
                  <p>
                    The paragraphs and text blocks provide the most analysis
                    specific data. Utilization metrics and state the precods by
                    urgante analysis, metadata and multiattribs, side within
                    data converter.
                  </p>
                  <p style={{ marginTop: 8 }}>
                    Questions of metric environmental system, interspend
                    contributing factors risk analysis, following
                    semi-point-lets data also communication position.
                  </p>
                </div>
              </div>
              <div className="fr-card">
                <div className="fr-card-title">
                  {t("环境因素分析", "Environmental Factor Analysis")}
                </div>
                <div className="fr-evidence-block">
                  <p>
                    The paragraphing analysis creates contributing and tons and
                    generating environmental algorithms contrib/utility of the
                    separator charts data cuties considered by five environment
                    materials and density of environmental materials and
                    accessibility of transformation station.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 7. Governance Records */}
          <div id="governance" className="fr-section">
            <h2 className="fr-section-title">
              {t("治理记录", "Governance Records")}
            </h2>
            <div className="fr-card">
              <div className="fr-gov-row">
                <div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    {t("责任部门", "Responsible Department")}
                  </div>
                  <div
                    style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}
                  >
                    {t("飞行运营", "Flight Operations")}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    {t("责任人", "Responsible Person")}
                  </div>
                  <div
                    style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}
                  >
                    Sarah Jenkins - Senior Dispatcher
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    {t("状态", "Status")}
                  </div>
                  <span className="fr-status-badge fr-badge-complete">
                    {t("进行中", "In Progress")}
                  </span>
                </div>
              </div>
              <div className="fr-gov-row">
                <div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    {t("最新行动", "Latest Action")}
                  </div>
                  <div
                    style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}
                  >
                    {t("改航计划已审核", "Reroute planned and reviewed")}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    {t("评审日期", "Review Date")}
                  </div>
                  <div
                    style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}
                  >
                    Oct 27, 2024 16:30
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    {t("工单", "Work Order")}
                  </div>
                  <div
                    style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}
                  >
                    #WO-456{" "}
                    <span className="fr-status-badge fr-badge-guessed">
                      {t("待审批", "Pending Approval")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Flight Facts (scrolled-to section) */}
          <div id="flight-facts" className="fr-section">
            <h2 className="fr-section-title">
              {t("航班事实", "Flight Facts")}
            </h2>
            <div className="fr-card">
              <div className="fr-grid-4">
                <div>
                  <div className="fr-env-label">{t("日期", "Date")}</div>
                  <div className="fr-env-value">{flightInfo.date}</div>
                </div>
                <div>
                  <div className="fr-env-label">{t("飞机", "Aircraft")}</div>
                  <div className="fr-env-value">{flightInfo.aircraft}</div>
                </div>
                <div>
                  <div className="fr-env-label">PF</div>
                  <div className="fr-env-value">{flightInfo.pilot}</div>
                </div>
                <div>
                  <div className="fr-env-label">PM</div>
                  <div className="fr-env-value">Co-pilot</div>
                </div>
                <div>
                  <div className="fr-env-label">{t("航线", "Route")}</div>
                  <div className="fr-env-value">{flightInfo.route}</div>
                </div>
                <div>
                  <div className="fr-env-label">{t("状态", "Status")}</div>
                  <div className="fr-env-value" style={{ color: "#22c55e" }}>
                    {flightInfo.status}
                  </div>
                </div>
                <div>
                  <div className="fr-env-label">
                    {t("综合风险", "Composite Risk")}
                  </div>
                  <div className="fr-env-value" style={{ color: "#ef4444" }}>
                    HIGH (Red) - 78/100
                  </div>
                </div>
                <div>
                  <div className="fr-env-label">
                    {t("报告已生成", "Report Generated")}
                  </div>
                  <div className="fr-env-value">Oct 28, 2024 09:15 AM</div>
                </div>
              </div>
            </div>
          </div>

          {/* Factor Explanation section */}
          <div id="factor-explanation" className="fr-section">
            <h2 className="fr-section-title">
              {t("因子解释", "Factor Explanation")}
            </h2>
            <div className="fr-card">
              <div className="fr-text">
                <p>
                  {t(
                    "本节详细解释了各风险因子的含义、权重和计算方法。",
                    "This section explains the meaning, weight, and calculation methods of each risk factor.",
                  )}
                </p>
                <ul>
                  <li>
                    <strong>{t("人为因素", "Human Factors")}:</strong>{" "}
                    {t(
                      "包含机组疲劳、通信、任务负荷等维度的评估。",
                      "Assessment of crew fatigue, communication, task load, etc.",
                    )}
                  </li>
                  <li>
                    <strong>{t("飞机因素", "Aircraft Factors")}:</strong>{" "}
                    {t(
                      "包含发动机状态、液压系统、航电设备等维度的评估。",
                      "Assessment of engine status, hydraulic systems, avionics, etc.",
                    )}
                  </li>
                  <li>
                    <strong>{t("环境因素", "Environmental Factors")}:</strong>{" "}
                    {t(
                      "包含天气、空中交通、机场条件等维度的评估。",
                      "Assessment of weather, air traffic, airport conditions, etc.",
                    )}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Evidence Chain section */}
          <div id="evidence-chain" className="fr-section">
            <h2 className="fr-section-title">
              {t("证据链", "Evidence Chain")}
            </h2>
            <div className="fr-card">
              <div className="fr-text">
                <p>
                  {t(
                    "以下为支持风险评估的数据来源：",
                    "The following data sources support the risk assessment:",
                  )}
                </p>
                <ul>
                  <li>
                    <strong>{t("飞行数据", "Flight Data")}:</strong> QAR/FDR{" "}
                    {t("记录的飞行参数数据", "recorded flight parameter data")}
                  </li>
                  <li>
                    <strong>{t("训练数据", "Training Data")}:</strong>{" "}
                    {t(
                      "机组人员训练记录和考核结果",
                      "Crew training records and assessment results",
                    )}
                  </li>
                  <li>
                    <strong>{t("维修数据", "Maintenance Data")}:</strong>{" "}
                    {t(
                      "飞机维修保养记录和故障报告",
                      "Aircraft maintenance records and fault reports",
                    )}
                  </li>
                  <li>
                    <strong>{t("通告", "Notices")}:</strong> NOTAM{" "}
                    {t("和航行通告信息", "and flight advisory information")}
                  </li>
                  <li>
                    <strong>{t("报文", "Messages")}:</strong> METAR/TAF{" "}
                    {t("气象报文信息", "meteorological message information")}
                  </li>
                  <li>
                    <strong>{t("规则和手册", "Rules & Manuals")}:</strong>{" "}
                    {t(
                      "适用的法规、标准和操作手册",
                      "Applicable regulations, standards, and operating manuals",
                    )}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Major Risk Detail section */}
          <div id="major-risk-detail" className="fr-section">
            <h2 className="fr-section-title">
              {t("重大风险详情", "Major Risk Detail")}
            </h2>
            <div className="fr-card">
              <div className="fr-text">
                <p>
                  {t(
                    "本节包含重大风险事件的详细分析，包括原因链和影响评估。",
                    "This section contains detailed analysis of major risk events, including causal chains and impact assessments.",
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
