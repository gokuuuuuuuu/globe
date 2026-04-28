import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "../i18n/useLanguage";
import { getFlightReport, type FlightReportData } from "../api/flight";
import { CausalChainView, ShapleyCard } from "../components/CausalChainView";
import "./FlightReportPage.css";

const NAV_SECTIONS = [
  {
    id: "flight-facts",
    labelZh: "航班事实",
    labelEn: "Flight Facts",
    icon: "doc",
  },
  {
    id: "composite-risk",
    labelZh: "综合风险结论",
    labelEn: "Composite Risk Conclusion",
    icon: "chart",
  },
  {
    id: "major-risk-detail",
    labelZh: "重大风险详情",
    labelEn: "Major Risk Detail",
    icon: "alert",
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
    id: "evidence",
    labelZh: "证据附录",
    labelEn: "Evidence Appendix",
    icon: "evidence",
  },
  // 治理记录导航已移除
];

function formatUTC8(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  const offset = d.getTime() + 8 * 60 * 60 * 1000;
  const utc8 = new Date(offset);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${utc8.getUTCFullYear()}-${pad(utc8.getUTCMonth() + 1)}-${pad(utc8.getUTCDate())} ${pad(utc8.getUTCHours())}:${pad(utc8.getUTCMinutes())}`;
}

const defaultFlightInfo = {
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
  const [activeSection, setActiveSection] = useState("flight-facts");
  const isClickScrolling = useRef(false);
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const flightId = searchParams.get("id");
  const [report, setReport] = useState<FlightReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!flightId) return;
    setLoading(true);
    setError(null);
    getFlightReport(Number(flightId))
      .then((data) => setReport(data))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "加载失败"),
      )
      .finally(() => setLoading(false));
  }, [flightId]);

  const flightInfo = report?.facts || defaultFlightInfo;

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    isClickScrolling.current = true;
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    // Allow observer to take over again after scroll animation
    setTimeout(() => {
      isClickScrolling.current = false;
    }, 800);
  };

  // Track which section is visible on scroll
  useEffect(() => {
    const sectionIds = NAV_SECTIONS.map((s) => s.id);
    const observer = new IntersectionObserver(
      (entries) => {
        if (isClickScrolling.current) return;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 },
    );
    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  if (loading) {
    return (
      <div
        className="fr-root"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 400,
        }}
      >
        <div style={{ color: "#94a3b8", fontSize: 16 }}>
          {t("加载中...", "Loading...")}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="fr-root"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 400,
          gap: 16,
        }}
      >
        <div style={{ color: "#ef4444", fontSize: 16 }}>
          {t("加载失败", "Failed to load")}: {error}
        </div>
        <button
          className="fr-btn"
          onClick={() => {
            if (!flightId) return;
            setLoading(true);
            setError(null);
            getFlightReport(Number(flightId))
              .then((data) => setReport(data))
              .catch((err: unknown) =>
                setError(err instanceof Error ? err.message : "加载失败"),
              )
              .finally(() => setLoading(false));
          }}
        >
          {t("重试", "Retry")}
        </button>
      </div>
    );
  }

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
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            style={{
              background: "rgba(71,85,105,0.5)",
              border: "1px solid rgba(148,163,184,0.2)",
              color: "#e2e8f0",
              borderRadius: 6,
              padding: "4px 14px",
              cursor: "pointer",
              fontSize: 13,
            }}
            onClick={() => navigate(-1)}
          >
            {t("返回", "Back")}
          </button>
          <h1 className="fr-page-title" style={{ margin: 0 }}>
            {t("航班报告", "Flight Report")}
          </h1>
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
          {/* 1. Flight Facts */}
          <div id="flight-facts" className="fr-section">
            <h2 className="fr-section-title">
              {t("航班事实", "Flight Facts")}
            </h2>
            <div className="fr-card">
              <div className="fr-grid-4">
                <div>
                  <div className="fr-env-label">{t("航班号", "Flight No")}</div>
                  <div className="fr-env-value">
                    {flightInfo?.flightNo || flightInfo?.flightId || "-"}
                  </div>
                </div>
                <div>
                  <div className="fr-env-label">
                    {t("机号", "Registration")}
                  </div>
                  <div className="fr-env-value">
                    <span
                      style={{ cursor: "pointer", color: "#60a5fa" }}
                      onClick={() =>
                        navigate(
                          `/aircraft-topic/aircraft-detail?tail=${flightInfo?.aircraft?.registration || ""}`,
                        )
                      }
                    >
                      {flightInfo?.aircraft?.registration || "-"}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="fr-env-label">
                    {t("机型", "Aircraft Type")}
                  </div>
                  <div className="fr-env-value">
                    {flightInfo?.aircraft?.model || "-"}
                  </div>
                </div>
                <div>
                  <div className="fr-env-label">PF</div>
                  <div className="fr-env-value">
                    {flightInfo?.pf ? (
                      <span
                        style={{ cursor: "pointer", color: "#60a5fa" }}
                        onClick={() =>
                          navigate(
                            `/personnel-center/personnel-detail?id=${flightInfo.pf.empNo}`,
                          )
                        }
                      >
                        {flightInfo.pf.name}
                      </span>
                    ) : (
                      "-"
                    )}
                  </div>
                </div>
                <div>
                  <div className="fr-env-label">PM</div>
                  <div className="fr-env-value">
                    {flightInfo?.pm ? (
                      <span
                        style={{ cursor: "pointer", color: "#60a5fa" }}
                        onClick={() =>
                          navigate(
                            `/personnel-center/personnel-detail?id=${flightInfo.pm.empNo}`,
                          )
                        }
                      >
                        {flightInfo.pm.name}
                      </span>
                    ) : (
                      "-"
                    )}
                  </div>
                </div>
                <div>
                  <div className="fr-env-label">
                    {t("出发机场", "Departure Airport")}
                  </div>
                  <div className="fr-env-value">
                    {flightInfo?.route?.departure ? (
                      <span
                        style={{ cursor: "pointer", color: "#60a5fa" }}
                        onClick={() =>
                          navigate(
                            `/airport-center/airport-detail?code=${flightInfo.route.departure.code}`,
                          )
                        }
                      >
                        {flightInfo.route.departure.code} (
                        {flightInfo.route.departure.name})
                      </span>
                    ) : (
                      "-"
                    )}
                  </div>
                </div>
                <div>
                  <div className="fr-env-label">
                    {t("到达机场", "Arrival Airport")}
                  </div>
                  <div className="fr-env-value">
                    {flightInfo?.route?.arrival ? (
                      <span
                        style={{ cursor: "pointer", color: "#60a5fa" }}
                        onClick={() =>
                          navigate(
                            `/airport-center/airport-detail?code=${flightInfo.route.arrival.code}`,
                          )
                        }
                      >
                        {flightInfo.route.arrival.code} (
                        {flightInfo.route.arrival.name})
                      </span>
                    ) : (
                      "-"
                    )}
                  </div>
                </div>
                <div>
                  <div className="fr-env-label">
                    {t("计划起飞", "Scheduled Departure")}
                  </div>
                  <div className="fr-env-value">
                    {formatUTC8(
                      flightInfo?.schedule?.scheduledDeparture ||
                        flightInfo?.date,
                    )}
                  </div>
                </div>
                <div>
                  <div className="fr-env-label">{t("状态", "Status")}</div>
                  <div className="fr-env-value" style={{ color: "#22c55e" }}>
                    {flightInfo?.status || "-"}
                  </div>
                </div>
                <div>
                  <div className="fr-env-label">
                    {t("综合风险", "Composite Risk")}
                  </div>
                  <div
                    className="fr-env-value"
                    style={{
                      color:
                        flightInfo?.overallRisk === "高"
                          ? "#ef4444"
                          : flightInfo?.overallRisk === "中"
                            ? "#f97316"
                            : "#22c55e",
                    }}
                  >
                    {report?.conclusion
                      ? `${report.conclusion.totalRisk} - ${report.conclusion.riskScore}/100`
                      : `${flightInfo?.overallRisk || "-"} - ${flightInfo?.overallScore || "-"}/100`}
                  </div>
                </div>
                <div>
                  <div className="fr-env-label">
                    {t("报告生成时间", "Report Generated")}
                  </div>
                  <div className="fr-env-value">
                    {formatUTC8(flightInfo?.reportGeneratedAt)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Composite Risk Conclusion (merged with Flight Phase) */}
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
                      {report?.conclusion?.totalRisk || "—"}
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
                      {report?.conclusion
                        ? `${report.conclusion.riskScore}/100`
                        : "—"}
                    </div>
                  </div>
                </div>
                {(() => {
                  const sd = report?.conclusion?.severityDistribution || {
                    critical: 0,
                    high: 0,
                    medium: 0,
                    low: 0,
                  };
                  const total = sd.critical + sd.high + sd.medium + sd.low || 1;
                  const cDeg = (sd.critical / total) * 360;
                  const hDeg = (sd.high / total) * 360;
                  const mDeg = (sd.medium / total) * 360;
                  return (
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
                          background: `conic-gradient(#ef4444 0deg ${cDeg}deg, #f97316 ${cDeg}deg ${cDeg + hDeg}deg, #eab308 ${cDeg + hDeg}deg ${cDeg + hDeg + mDeg}deg, #22c55e ${cDeg + hDeg + mDeg}deg 360deg)`,
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
                            {report?.conclusion?.totalRisk || "—"}
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
                          <span className="fr-legend-count">{sd.critical}</span>
                        </div>
                        <div className="fr-legend-item">
                          <span
                            className="fr-legend-dot"
                            style={{ background: "#f97316" }}
                          />{" "}
                          {t("高", "High")}{" "}
                          <span className="fr-legend-count">{sd.high}</span>
                        </div>
                        <div className="fr-legend-item">
                          <span
                            className="fr-legend-dot"
                            style={{ background: "#eab308" }}
                          />{" "}
                          {t("中", "Medium")}{" "}
                          <span className="fr-legend-count">{sd.medium}</span>
                        </div>
                        <div className="fr-legend-item">
                          <span
                            className="fr-legend-dot"
                            style={{ background: "#22c55e" }}
                          />{" "}
                          {t("低", "Low")}{" "}
                          <span className="fr-legend-count">{sd.low}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
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
                  {report?.conclusion?.intro ? (
                    <p>{report.conclusion.intro}</p>
                  ) : (
                    <p style={{ color: "#64748b" }}>
                      {t(
                        "暂无综合风险结论数据",
                        "No composite risk conclusion data available",
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 3. Major Risk Detail + Shapley */}
          <div id="major-risk-detail" className="fr-section">
            <h2 className="fr-section-title">
              {t("重大风险详情", "Major Risk Detail")}
            </h2>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {/* 左：重大风险列表 */}
              <div
                className="fr-card"
                style={{
                  flex: "1 1 0",
                  minWidth: 300,
                  maxHeight: 420,
                  overflowY: "auto",
                }}
              >
                <div className="fr-text">
                  {report?.majorRisks?.length ? (
                    <ul>
                      {report.majorRisks.map((risk, i) => (
                        <li key={i}>
                          <strong>{risk.name}</strong>
                          <span
                            style={{
                              color:
                                risk.severity === "高" ? "#ef4444" : "#eab308",
                              marginLeft: 6,
                            }}
                          >
                            [{risk.severity}]
                          </span>
                          <br />
                          {risk.description}
                          <br />
                          <span style={{ color: "#60a5fa" }}>
                            {t("建议", "Action")}: {risk.recommendedAction}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ color: "#64748b" }}>
                      {t("暂无重大风险数据", "No major risk data available")}
                    </p>
                  )}
                </div>
              </div>
              {/* 右：Shapley 致因分解 */}
              <ShapleyCard flightId={Number(flightId) || 1001} t={t} />
            </div>
            {/* 下方：风险因果链路（横向） */}
            <CausalChainView flightId={Number(flightId) || 1001} t={t} />
          </div>

          {/* 4. Human Factor Analysis */}
          <div id="human-factor" className="fr-section">
            <h2 className="fr-section-title">
              {t("人为因素分析", "Human Factor Analysis")} —{" "}
              {t("评分", "Score")}: {report?.humanFactorData?.score ?? "—"}
            </h2>
            <div className="fr-grid-2">
              <div className="fr-card">
                <div className="fr-card-title">
                  {t("指标卡片", "Metric Cards")}
                </div>
                <div className="fr-grid-2" style={{ marginBottom: 16 }}>
                  {(report?.humanFactorData?.subMetrics || []).map((m, i) => (
                    <div className="fr-metric-card" key={i}>
                      <div className="fr-metric-label">{m.name}</div>
                      <span
                        className={`fr-status-badge ${m.colorCode === "green" ? "fr-badge-good" : m.colorCode === "yellow" ? "fr-badge-moderate" : "fr-badge-guessed"}`}
                      >
                        {m.rating}
                      </span>
                      <div
                        style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}
                      >
                        {m.narrative}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 5. Aircraft Factor Analysis */}
          <div id="aircraft-factor" className="fr-section">
            <h2 className="fr-section-title">
              {t("飞机因素分析", "Aircraft Factor Analysis")} —{" "}
              {t("评分", "Score")}: {report?.aircraftFactorData?.score ?? "—"}
            </h2>
            <div className="fr-grid-2">
              <div className="fr-card">
                <div className="fr-card-title">
                  {t("部件系统状态", "Component System Status")}
                </div>
                <div className="fr-component-grid">
                  {(report?.aircraftFactorData?.systems || []).map((s, i) => {
                    const color =
                      s.colorCode === "green"
                        ? "#22c55e"
                        : s.colorCode === "yellow"
                          ? "#eab308"
                          : "#ef4444";
                    return (
                      <div className="fr-component-item" key={i}>
                        <span className="fr-component-name">{s.name}</span>
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <span
                            className="fr-status-dot"
                            style={{ background: color }}
                          />
                          <span
                            className="fr-component-status"
                            style={{ color }}
                          >
                            {s.status}
                          </span>
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 16 }}>
                  <div className="fr-status-row">
                    <span className="fr-status-label">
                      {t("维修日志摘要", "Maintenance Log Summary")}
                    </span>
                    <span className="fr-status-badge fr-badge-moderate">
                      {report?.aircraftFactorData?.maintenanceLogSummary || "—"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="fr-card">
                <div className="fr-card-title">
                  {t("阶段系统风险矩阵", "Phase System Risk Matrix")}
                </div>
                <table className="fr-mini-table">
                  <thead>
                    <tr>
                      <th>{t("阶段", "Phase")}</th>
                      {report?.aircraftFactorData?.systems?.map((s) => (
                        <th key={s.name}>{s.name}</th>
                      )) || null}
                    </tr>
                  </thead>
                  <tbody>
                    {(report?.aircraftFactorData?.phaseRiskMatrix || []).map(
                      (row, i) => (
                        <tr key={i}>
                          <td>{row.phase}</td>
                          {report?.aircraftFactorData?.systems?.map((s) => {
                            const val = row.systems[s.name] || "—";
                            const c =
                              val === "正常"
                                ? "#22c55e"
                                : val === "注意"
                                  ? "#eab308"
                                  : "#ef4444";
                            return (
                              <td key={s.name} style={{ color: c }}>
                                {val}
                              </td>
                            );
                          }) || null}
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 6. Environmental Factor Analysis */}
          <div id="env-factor" className="fr-section">
            <h2 className="fr-section-title">
              {t("环境因素分析", "Environmental Factor Analysis")} —{" "}
              {t("评分", "Score")}:{" "}
              {report?.environmentFactorData?.score ?? "—"}
            </h2>
            <div className="fr-grid-2">
              <div className="fr-card">
                <div className="fr-card-title">
                  {t("环境条件", "Environmental Conditions")}
                </div>
                <div className="fr-env-item">
                  <div className="fr-env-label">
                    {t("天气状况", "Weather Condition")}
                  </div>
                  <div className="fr-env-value">
                    {report?.environmentFactorData?.weatherCondition || "—"}
                  </div>
                </div>
                <div className="fr-env-item">
                  <div className="fr-env-label">
                    {t("空中交通密度", "Air Traffic Density")}
                  </div>
                  <div className="fr-env-value">
                    {report?.environmentFactorData?.airTrafficDensity || "—"}
                  </div>
                </div>
                <div className="fr-env-item">
                  <div className="fr-env-label">
                    {t("适航范围", "Airmanity Range")}
                  </div>
                  <div className="fr-env-value">
                    {report?.environmentFactorData?.airmanityRange || "—"}
                  </div>
                </div>
              </div>
              <div className="fr-card">
                <div className="fr-card-title">
                  {t("关键分析", "Key Analysis")}
                </div>
                <div className="fr-text">
                  {(report?.environmentFactorData?.keyAnalysis || []).length >
                  0 ? (
                    <ul>
                      {report!.environmentFactorData.keyAnalysis.map(
                        (ka, i) => (
                          <li key={i}>
                            <strong>{ka.system}:</strong> {ka.narrative}
                          </li>
                        ),
                      )}
                    </ul>
                  ) : (
                    <p style={{ color: "#64748b" }}>
                      {t("暂无关键分析数据", "No key analysis data")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 7. Factor Explanation */}
          <div id="factor-explanation" className="fr-section">
            <h2 className="fr-section-title">
              {t("因子解释", "Factor Explanation")}
            </h2>
            <div className="fr-card">
              <div className="fr-text">
                {report?.factorExplanations?.length ? (
                  <ul>
                    {report.factorExplanations.map((fe, i) => (
                      <li key={i}>
                        <strong>{fe.name}:</strong> {fe.desc}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: "#64748b" }}>
                    {t("暂无因子解释数据", "No factor explanation data")}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 8. Evidence Chain (evidenceSources) */}
          <div id="evidence-chain" className="fr-section">
            <h2 className="fr-section-title">
              {t("证据链", "Evidence Chain")}
            </h2>
            <div className="fr-card">
              <div className="fr-text">
                {report?.evidenceSources?.length ? (
                  <ul>
                    {report.evidenceSources.map((es, i) => (
                      <li key={i}>
                        <strong>{es.name}:</strong> {es.desc}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: "#64748b" }}>
                    {t("暂无证据来源数据", "No evidence source data")}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 9. Evidence Appendix */}
          <div id="evidence" className="fr-section">
            <h2 className="fr-section-title">
              {t("证据附录", "Evidence Appendix")}
            </h2>
            <div className="fr-card">
              <div className="fr-evidence-block">
                <p>
                  {report?.evidenceAppendix ||
                    t("暂无证据附录", "No evidence appendix available")}
                </p>
              </div>
            </div>
          </div>

          {/* 治理记录部分已移除 */}
        </div>
      </div>
    </div>
  );
}
