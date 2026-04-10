import { useNavigate } from "react-router-dom";
import { useLanguage } from "../i18n/useLanguage";
import "./FlightDetailPage.css";

// Mock data for the flight detail
const flightInfo = {
  flightNumber: "FL7890",
  tailNumber: "N567UA",
  aircraftType: "Boeing 737-8MAX",
  departure: "KSFO (San Francisco)",
  arrival: "KORD (Chicago O'Hare)",
  scheduledTime: "Oct 28, 2024 08:15 AM",
  forecastWindow: "±20 min",
  compositeRiskLevel: "High",
  majorRiskAlert: "Severe Turbulence",
  governanceStatus: "In Progress",
};

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
    priority: "Critical - Red",
    priorityClass: "fd-priority-critical-red",
    cause: "Thunderstorms forecasted",
    action: "Alter altitude or route",
  },
  {
    risk: "Communication Loss",
    priority: "High",
    priorityClass: "fd-priority-high",
    cause: "Radio interference",
    action: "Use backup channel",
  },
  {
    risk: "Engine Issue",
    priority: "Critical - High",
    priorityClass: "fd-priority-critical-high",
    cause: "Thunderstorms forecasted",
    action: "Alter altitude or route roter",
  },
  {
    risk: "Communication Loss",
    priority: "Critical - Red",
    priorityClass: "fd-priority-critical-red",
    cause: "Radio commounding forecasted",
    action: "View altitudon mentions",
  },
];

function getDotClass(color: string) {
  if (color === "red") return "fd-dot-red";
  if (color === "yellow") return "fd-dot-yellow";
  return "fd-dot-green";
}

export function FlightDetailPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  // Tabs removed per requirements

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

  const tPriority = (name: string) => {
    const map: Record<string, string> = {
      "Critical - Red": "严重 - 红色",
      High: "高",
      "Critical - High": "严重 - 高",
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
            {t("航班信息", "Flight Info")} - {flightInfo.flightNumber}
          </h1>
        </div>
        <div className="fd-header-actions">
          <button
            className="fd-btn"
            onClick={() => navigate("/risk-monitoring/flight-report")}
          >
            {t("查看报告", "View Report")}
          </button>
          <button
            className="fd-btn fd-btn-danger"
            onClick={() => navigate("/governance/work-order-detail")}
          >
            {t("发起处置", "Initiate Action")}
          </button>
        </div>
      </div>

      {/* Flight Info Bar */}
      <div className="fd-info-bar">
        <div className="fd-info-item">
          <div className="fd-info-label">{t("航班号", "Flight Number")}</div>
          <div className="fd-info-value">{flightInfo.flightNumber}</div>
        </div>
        <div className="fd-info-item">
          <div className="fd-info-label">
            {t("机尾号", "Aircraft Tail Number")}
          </div>
          <div className="fd-info-value">{flightInfo.tailNumber}</div>
        </div>
        <div className="fd-info-item">
          <div className="fd-info-label">{t("机型", "Aircraft Type")}</div>
          <div className="fd-info-value">{flightInfo.aircraftType}</div>
        </div>
        <div className="fd-info-item">
          <div className="fd-info-label">
            {t("出发机场", "Departure Airport")}
          </div>
          <div className="fd-info-value">
            {t("KSFO (旧金山)", "KSFO (San Francisco)")}
          </div>
        </div>
        <div className="fd-info-item">
          <div className="fd-info-label">
            {t("到达机场", "Arrival Airport")}
          </div>
          <div className="fd-info-value">
            {t("KORD (芝加哥奥黑尔)", "KORD (Chicago O'Hare)")}
          </div>
        </div>
        <div className="fd-info-item">
          <div className="fd-info-label">{t("计划时间", "Scheduled Time")}</div>
          <div className="fd-info-value">
            {t("2024年10月28日 08:15", "Oct 28, 2024 08:15 AM")}
          </div>
        </div>
        <div className="fd-info-item">
          <div className="fd-info-label">
            {t("预测时间窗口", "Forecast Time Window")}
          </div>
          <div className="fd-info-value">{t("±20 分钟", "±20 min")}</div>
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
                  background: "#f97316",
                  display: "inline-block",
                }}
              />
              {t("高", "High")}
            </span>
          </div>
        </div>
        <div className="fd-info-item">
          <div className="fd-info-label">
            {t("重大风险告警", "Major Risk Alert")}
          </div>
          <div className="fd-info-value fd-info-value-red">
            <span
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#ef4444",
                  display: "inline-block",
                }}
              />
              {t("严重湍流", "Severe Turbulence")}
            </span>
          </div>
        </div>
        <div className="fd-info-item">
          <div className="fd-info-label">
            {t("治理状态", "Governance Status")}
          </div>
          <div className="fd-info-value">
            <span className="fd-gov-status">
              <span className="fd-gov-dot" style={{ background: "#22c55e" }} />
              {t("进行中", "In Progress")}
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
              <th></th>
            </tr>
          </thead>
          <tbody>
            {majorRiskEvents.map((evt, i) => (
              <tr key={i}>
                <td>{tRisk(evt.risk)}</td>
                <td>
                  <span className={`fd-priority ${evt.priorityClass}`}>
                    {tPriority(evt.priority)}
                  </span>
                </td>
                <td>{tCause(evt.cause)}</td>
                <td>{tAction(evt.action)}</td>
                <td>
                  <button className="fd-btn">
                    {t("查看详情", "View Detail")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Governance Section - hidden */}
      </div>
    </div>
  );
}
