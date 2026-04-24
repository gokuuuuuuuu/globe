import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "../i18n/useLanguage";
import { getFlightDetail } from "../api/flight";
import "./FlightDetailPage.css";

// ===== Types =====

interface FlightDetail {
  id: number;
  flightNo: string;
  departureTime: string;
  arrivalTime: string;
  status: "SCHEDULED" | "CRUISING" | "LANDED";
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  humanFactorScore: number;
  aircraftFactorScore: number;
  environmentFactorScore: number;
  riskTags: string | null;
  governanceStatus: string;
  operatingUnit: string;
  plane: { registration: string; model: string } | null;
  pf: { empNo: string; name: string } | null;
  pm: { empNo: string; name: string } | null;
  departureAirport: { code: string; name: string } | null;
  arrivalAirport: { code: string; name: string } | null;
}

// ===== Mock data (API 暂不提供) =====

const phases = [
  {
    name: "Takeoff",
    riskScore: 72,
    weight: "20%",
    bars: [45, 60, 72, 55, 38, 50, 65],
    barColors: [
      "#3b82f6",
      "#60a5fa",
      "#3b82f6",
      "#93c5fd",
      "#60a5fa",
      "#3b82f6",
      "#93c5fd",
    ],
    tags: ["Engine Performance", "Human"],
  },
  {
    name: "Cruise",
    riskScore: 85,
    weight: "50%",
    bars: [50, 70, 85, 60, 45, 75, 65],
    barColors: [
      "#3b82f6",
      "#60a5fa",
      "#3b82f6",
      "#93c5fd",
      "#60a5fa",
      "#3b82f6",
      "#93c5fd",
    ],
    tags: ["Crosswinds", "Crosswinds"],
  },
  {
    name: "Landing",
    riskScore: 60,
    weight: "30%",
    bars: [40, 55, 60, 35, 50, 45, 30],
    barColors: [
      "#3b82f6",
      "#60a5fa",
      "#3b82f6",
      "#93c5fd",
      "#60a5fa",
      "#3b82f6",
      "#93c5fd",
    ],
    tags: ["Braking Action"],
  },
];

const factorData = {
  human: [
    { name: "Crew Fatigue", score: 3.0, color: "red" },
    { name: "Communication Lag", score: 2.0, color: "red" },
    { name: "Crew Fatigue", score: 2.0, color: "yellow" },
    { name: "Communication", score: 1.8, color: "yellow" },
    { name: "Communication Lag", score: 1.0, color: "green" },
  ],
  aircraft: [
    { name: "Engine Issue", score: 3.0, color: "red" },
    { name: "Communication Lag", score: 2.0, color: "red" },
    { name: "Communication Lag", score: 2.0, color: "yellow" },
    { name: "Engine Issue", score: 1.9, color: "yellow" },
    { name: "Engine Issue", score: 1.0, color: "green" },
  ],
  environment: [
    { name: "Thunderstorms", score: 3.0, color: "red" },
    { name: "Thunderstorms", score: 2.5, color: "red" },
    { name: "Engine Issue", score: 2.0, color: "yellow" },
    { name: "High Traffic", score: 1.9, color: "yellow" },
    { name: "Communication Lag", score: 1.0, color: "green" },
  ],
  composite: [
    { name: "High Traffic", score: 3.0, color: "red" },
    { name: "High Traffic", score: 2.5, color: "red" },
    { name: "Thunderstorms", score: 2.0, color: "yellow" },
    { name: "High Traffic", score: 1.9, color: "yellow" },
    { name: "Braking Action", score: 1.0, color: "green" },
  ],
};

const majorRiskEvents = [
  {
    risk: "Severe Turbulence",
    priorityColor: "#ef4444",
    cause: "Thunderstorms forecasted",
    action: "Alter altitude or route",
  },
  {
    risk: "Communication Loss",
    priorityColor: "#eab308",
    cause: "Radio interference",
    action: "Use backup channel",
  },
  {
    risk: "Engine Issue",
    priorityColor: "#ef4444",
    cause: "Thunderstorms forecasted",
    action: "Alter altitude or route roter",
  },
  {
    risk: "Communication Loss",
    priorityColor: "#eab308",
    cause: "Radio commounding forecasted",
    action: "View altitudon mentions",
  },
];

// ===== Helpers =====

function getDotClass(color: string) {
  if (color === "red") return "fd-dot-red";
  if (color === "yellow") return "fd-dot-yellow";
  return "fd-dot-green";
}

function formatTime(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function riskLevelLabel(level: string, t: (zh: string, en: string) => string) {
  if (level === "HIGH") return t("高", "High");
  if (level === "MEDIUM") return t("中", "Medium");
  return t("低", "Low");
}

function riskLevelColor(level: string) {
  if (level === "HIGH") return "#ef4444";
  if (level === "MEDIUM") return "#f97316";
  return "#22c55e";
}

function statusLabel(status: string, t: (zh: string, en: string) => string) {
  if (status === "SCHEDULED") return t("未起飞", "Scheduled");
  if (status === "CRUISING") return t("巡航中", "Cruising");
  return t("已落地", "Landed");
}

function govStatusLabel(status: string, t: (zh: string, en: string) => string) {
  if (status === "PENDING") return t("待处理", "Pending");
  if (status === "IN_PROGRESS") return t("进行中", "In Progress");
  if (status === "RESOLVED") return t("已解决", "Resolved");
  if (status === "CLOSED") return t("已关闭", "Closed");
  return status;
}

// ===== Component =====

export function FlightDetailPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const flightId = searchParams.get("id");

  const [flight, setFlight] = useState<FlightDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!flightId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getFlightDetail(Number(flightId))
      .then((res) => {
        setFlight(res as FlightDetail);
      })
      .catch((err) => {
        console.error("Failed to load flight detail:", err);
      })
      .finally(() => setLoading(false));
  }, [flightId]);

  const tFactor = (name: string) => {
    const map: Record<string, string> = {
      "Crew Fatigue": "机组疲劳",
      "Communication Lag": "通讯延迟",
      Communication: "通讯",
      "Engine Issue": "发动机问题",
      Thunderstorms: "雷暴",
      "High Traffic": "高流量",
      "Braking Action": "刹车效能",
    };
    return map[name] ? t(map[name], name) : name;
  };

  const tRisk = (name: string) => {
    const map: Record<string, string> = {
      "Severe Turbulence": "严重湍流",
      "Communication Loss": "通讯中断",
      "Engine Issue": "发动机问题",
    };
    return map[name] ? t(map[name], name) : name;
  };

  const tCause = (name: string) => {
    const map: Record<string, string> = {
      "Thunderstorms forecasted": "预报有雷暴",
      "Radio interference": "无线电干扰",
      "Radio commounding forecasted": "预报有无线电干扰",
    };
    return map[name] ? t(map[name], name) : name;
  };

  const tAction = (name: string) => {
    const map: Record<string, string> = {
      "Alter altitude or route": "改变高度或航线",
      "Use backup channel": "使用备用信道",
      "Alter altitude or route roter": "改变高度或航线路由",
      "View altitudon mentions": "查看高度提及",
    };
    return map[name] ? t(map[name], name) : name;
  };

  if (loading) {
    return (
      <div className="fd-root">
        <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
          {t("加载中...", "Loading...")}
        </div>
      </div>
    );
  }

  if (!flight) {
    return (
      <div className="fd-root">
        <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
          {t("未找到航班信息", "Flight not found")}
        </div>
      </div>
    );
  }

  return (
    <div className="fd-root">
      {/* Breadcrumb */}
      <div className="fd-breadcrumb">
        <span style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
          {t("工作台", "Dashboard")}
        </span>
        <span className="fd-breadcrumb-sep">&gt;</span>
        <span
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/risk-monitoring/flights")}
        >
          {t("航班", "Flights")}
        </span>
        <span className="fd-breadcrumb-sep">&gt;</span>
        <span className="fd-breadcrumb-active">
          {t("航班详情", "Flight Detail")}
        </span>
      </div>

      {/* Page Header */}
      <div className="fd-page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button className="fd-btn" onClick={() => navigate(-1)}>
            {t("返回", "Back")}
          </button>
          <h1 className="fd-page-title">
            {t("航班信息", "Flight Info")} - {flight.flightNo}
          </h1>
        </div>
        <div className="fd-header-actions">
          <button
            className="fd-btn"
            onClick={() =>
              navigate(`/risk-monitoring/flight-report?id=${flight.id}`)
            }
          >
            {t("查看报告", "View Report")}
          </button>
        </div>
      </div>

      {/* Flight Info Bar */}
      <div className="fd-info-bar">
        <div className="fd-info-item">
          <div className="fd-info-label">{t("航班号", "Flight Number")}</div>
          <div className="fd-info-value">{flight.flightNo}</div>
        </div>
        <div className="fd-info-item">
          <div className="fd-info-label">{t("机号", "Registration")}</div>
          <div className="fd-info-value">
            {flight.plane?.registration || "—"}
          </div>
        </div>
        <div className="fd-info-item">
          <div className="fd-info-label">{t("机型", "Aircraft Type")}</div>
          <div className="fd-info-value">{flight.plane?.model || "—"}</div>
        </div>
        <div className="fd-info-item">
          <div className="fd-info-label">PF</div>
          <div className="fd-info-value">{flight.pf?.name || "—"}</div>
        </div>
        <div className="fd-info-item">
          <div className="fd-info-label">PM</div>
          <div className="fd-info-value">{flight.pm?.name || "—"}</div>
        </div>
        <div className="fd-info-item">
          <div className="fd-info-label">
            {t("出发机场", "Departure Airport")}
          </div>
          <div className="fd-info-value">
            {flight.departureAirport
              ? `${flight.departureAirport.code} (${flight.departureAirport.name})`
              : "—"}
          </div>
        </div>
        <div className="fd-info-item">
          <div className="fd-info-label">
            {t("到达机场", "Arrival Airport")}
          </div>
          <div className="fd-info-value">
            {flight.arrivalAirport
              ? `${flight.arrivalAirport.code} (${flight.arrivalAirport.name})`
              : "—"}
          </div>
        </div>
        <div className="fd-info-item">
          <div className="fd-info-label">{t("起飞时间", "Departure Time")}</div>
          <div className="fd-info-value">
            {formatTime(flight.departureTime)}
          </div>
        </div>
        <div className="fd-info-item">
          <div className="fd-info-label">{t("降落时间", "Arrival Time")}</div>
          <div className="fd-info-value">{formatTime(flight.arrivalTime)}</div>
        </div>
        <div className="fd-info-item">
          <div className="fd-info-label">{t("状态", "Status")}</div>
          <div className="fd-info-value">{statusLabel(flight.status, t)}</div>
        </div>
        <div className="fd-info-item">
          <div className="fd-info-label">
            {t("综合风险等级", "Composite Risk Level")}
          </div>
          <div className="fd-info-value fd-info-value-high">
            <span
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: riskLevelColor(flight.riskLevel),
                  display: "inline-block",
                }}
              />
              {riskLevelLabel(flight.riskLevel, t)}
            </span>
          </div>
        </div>
        <div className="fd-info-item">
          <div className="fd-info-label">
            {t("人为/飞机/环境评分", "H / A / E Score")}
          </div>
          <div className="fd-info-value">
            {flight.humanFactorScore} / {flight.aircraftFactorScore} /{" "}
            {flight.environmentFactorScore}
          </div>
        </div>
        <div className="fd-info-item">
          <div className="fd-info-label">
            {t("治理状态", "Governance Status")}
          </div>
          <div className="fd-info-value">
            <span className="fd-gov-status">
              <span className="fd-gov-dot" style={{ background: "#22c55e" }} />
              {govStatusLabel(flight.governanceStatus, t)}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="fd-content">
        {/* Flight Phases Cards */}
        <div className="fd-phases">
          {phases.map((phase) => (
            <div className="fd-phase-card" key={phase.name}>
              <div className="fd-phase-header">
                <div className="fd-phase-name">
                  {phase.name === "Takeoff"
                    ? t("起飞", "Takeoff")
                    : phase.name === "Cruise"
                      ? t("巡航", "Cruise")
                      : phase.name === "Landing"
                        ? t("着陆", "Landing")
                        : phase.name}
                </div>
                <div className="fd-phase-scores">
                  <div className="fd-phase-score-item">
                    <div className="fd-phase-score-label">
                      {t("风险评分", "Risk Score")}
                    </div>
                    <div className="fd-phase-score-value">
                      {phase.riskScore}
                    </div>
                  </div>
                  <div className="fd-phase-score-item">
                    <div className="fd-phase-score-label">
                      {t("权重", "Weight")}
                    </div>
                    <div className="fd-phase-score-value">{phase.weight}</div>
                  </div>
                </div>
              </div>
              <div className="fd-phase-chart">
                {phase.bars.map((h, i) => (
                  <div
                    key={i}
                    className="fd-phase-bar"
                    style={{
                      height: `${(h / 100) * 100}%`,
                      background: phase.barColors[i],
                    }}
                  />
                ))}
              </div>
              <div className="fd-phase-tags">
                <span className="fd-phase-tags-label">
                  {t("风险标签", "Risk Tags")}
                </span>
                {phase.tags.map((tag, i) => (
                  <span key={i} className="fd-phase-tag">
                    {tag === "Engine Performance"
                      ? t("发动机性能", "Engine Performance")
                      : tag === "Human"
                        ? t("人为因素", "Human")
                        : tag === "Crosswinds"
                          ? t("侧风", "Crosswinds")
                          : tag === "Braking Action"
                            ? t("刹车效能", "Braking Action")
                            : tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Top-Factor Contribution Area */}
        <h2 className="fd-section-title">
          {t("首要因素贡献区域", "Top-Factor Contribution Area")}
        </h2>
        <div className="fd-factors">
          <div className="fd-factor-card">
            <div className="fd-factor-title">
              {t("人为因素 Top 5", "Human Top 5")}
            </div>
            {factorData.human.map((item, i) => (
              <div className="fd-factor-row" key={i}>
                <div className="fd-factor-left">
                  <span
                    className={`fd-factor-dot ${getDotClass(item.color)}`}
                  />
                  <span className="fd-factor-name">{tFactor(item.name)}</span>
                </div>
                <div className="fd-factor-right">
                  <span
                    className={`fd-factor-score-dot ${getDotClass(item.color)}`}
                  />
                  <span className="fd-factor-score">
                    {item.score.toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="fd-factor-card">
            <div className="fd-factor-title">
              {t("飞机因素 Top 5", "Aircraft Top 5")}
            </div>
            {factorData.aircraft.map((item, i) => (
              <div className="fd-factor-row" key={i}>
                <div className="fd-factor-left">
                  <span
                    className={`fd-factor-dot ${getDotClass(item.color)}`}
                  />
                  <span className="fd-factor-name">{tFactor(item.name)}</span>
                </div>
                <div className="fd-factor-right">
                  <span
                    className={`fd-factor-score-dot ${getDotClass(item.color)}`}
                  />
                  <span className="fd-factor-score">
                    {item.score.toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="fd-factor-card">
            <div className="fd-factor-title">
              {t("环境因素 Top 5", "Environment Top 5")}
            </div>
            {factorData.environment.map((item, i) => (
              <div className="fd-factor-row" key={i}>
                <div className="fd-factor-left">
                  <span
                    className={`fd-factor-dot ${getDotClass(item.color)}`}
                  />
                  <span className="fd-factor-name">{tFactor(item.name)}</span>
                </div>
                <div className="fd-factor-right">
                  <span
                    className={`fd-factor-score-dot ${getDotClass(item.color)}`}
                  />
                  <span className="fd-factor-score">
                    {item.score.toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="fd-factor-card">
            <div className="fd-factor-title">
              {t("综合因素 Top 10", "Composite Top 10")}
            </div>
            {factorData.composite.map((item, i) => (
              <div className="fd-factor-row" key={i}>
                <div className="fd-factor-left">
                  <span
                    className={`fd-factor-dot ${getDotClass(item.color)}`}
                  />
                  <span className="fd-factor-name">{tFactor(item.name)}</span>
                </div>
                <div className="fd-factor-right">
                  <span
                    className={`fd-factor-score-dot ${getDotClass(item.color)}`}
                  />
                  <span className="fd-factor-score">
                    {item.score.toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Major Risk Event Section */}
        <div className="fd-risk-section-header">
          <h2 className="fd-section-title" style={{ margin: 0 }}>
            {t("重大风险事件", "Major Risk Event Section")}
          </h2>
        </div>
        <table className="fd-risk-table">
          <thead>
            <tr>
              <th>{t("重大风险", "Major Risk")}</th>
              <th>{t("优先级", "Priority")}</th>
              <th>{t("原因摘要", "Cause Summaries")}</th>
              <th>{t("建议措施", "Suggested Actions")}</th>
            </tr>
          </thead>
          <tbody>
            {majorRiskEvents.map((evt, i) => (
              <tr key={i}>
                <td>{tRisk(evt.risk)}</td>
                <td>
                  <span
                    style={{
                      display: "inline-block",
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      background: evt.priorityColor,
                    }}
                  />
                </td>
                <td>{tCause(evt.cause)}</td>
                <td>{tAction(evt.action)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
