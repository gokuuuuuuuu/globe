// @ts-nocheck
import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import { useLanguage } from "../i18n/useLanguage";
import "./PersonnelTrendPage.css";

// ---------- Mock Data ----------

function generateTrendData() {
  const data = [];
  const baseValues = [
    32, 28, 35, 42, 55, 48, 38, 30, 25, 33, 45, 52, 72, 65, 50, 42, 38, 35, 40,
    55, 68, 85, 70, 58, 45, 40, 48, 62, 78, 55,
  ];
  for (let i = 0; i < 30; i++) {
    const date = new Date(2023, 9, i + 1);
    const dayLabel = `${date.getMonth() + 1}/${date.getDate()}`;
    const value = baseValues[i];
    const isAnomaly = value > 70;
    data.push({
      day: dayLabel,
      score: value,
      anomaly: isAnomaly ? value : null,
    });
  }
  return data;
}

const trendData = generateTrendData();

const anomalySummary = [
  {
    aggregate: "Abnormal Peak Markers",
    aggregateZh: "异常峰值标记",
    riskFactor: 100,
    riskScore: "+5%",
    duration: "+5%",
    relatedRisk: "Safety Incident (Minor)",
    relatedRiskZh: "安全事件（轻微）",
    riskLevel: "orange",
    actionLevel: "green",
  },
];

const historicalFlights = [
  {
    id: "AR101",
    date: "2023-10-26",
    route: "EGLL-KJFK",
    duration: "7h 30m",
    relatedRisk: "Safety Incident (Minor)",
    relatedRiskZh: "安全事件（轻微）",
    riskLevel: "green",
  },
  {
    id: "AR102",
    date: "2023-10-26",
    route: "EGLL-KJFK",
    duration: "7h 30m",
    relatedRisk: "Safety Incident (Minor)",
    relatedRiskZh: "安全事件（轻微）",
    riskLevel: "yellow",
  },
  {
    id: "AR103",
    date: "2023-10-26",
    route: "EGLL-KJFK",
    duration: "7h 30m",
    relatedRisk: "Safety Incident (Minor)",
    relatedRiskZh: "安全事件（轻微）",
    riskLevel: "orange",
  },
  {
    id: "AR104",
    date: "2023-10-25",
    route: "LFPG-KLAX",
    duration: "11h 15m",
    relatedRisk: "Safety Incident (Minor)",
    relatedRiskZh: "安全事件（轻微）",
    riskLevel: "green",
  },
  {
    id: "AR105",
    date: "2023-10-24",
    route: "EDDF-WSSS",
    duration: "12h 45m",
    relatedRisk: "Safety Incident (Minor)",
    relatedRiskZh: "安全事件（轻微）",
    riskLevel: "yellow",
  },
];

// Chart styles
const AXIS_TICK = { fontSize: 11, fill: "#94a3b8" };
const GRID_STROKE = "rgba(148, 163, 184, 0.1)";
const darkTooltipStyle = {
  contentStyle: {
    background: "#1e293b",
    border: "1px solid rgba(148,163,184,0.2)",
    borderRadius: 6,
    color: "#e2e8f0",
    fontSize: 12,
  },
  itemStyle: { color: "#cbd5e1" },
};

// ---------- Custom Dot for anomalies ----------

function AnomalyDot(props: any) {
  const { cx, cy, payload } = props;
  if (payload.anomaly == null) return null;
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={6}
        fill="#ef4444"
        stroke="#ef4444"
        strokeWidth={2}
      />
      <text
        x={cx}
        y={cy - 12}
        textAnchor="middle"
        fill="#ef4444"
        fontSize={12}
        fontWeight={700}
      >
        !
      </text>
    </g>
  );
}

// ---------- Component ----------

export function PersonnelTrendPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("30d");

  const tabs = [
    { key: "7d", label: t("近7天", "Last 7 Days") },
    { key: "30d", label: t("近30天", "Last 30 Days") },
    { key: "90d", label: t("近90天", "Last 90 Days") },
  ];

  const riskLevelBadge = (level: string) => {
    const cls = `pt-badge pt-badge-${level}`;
    const labels: Record<string, string> = {
      green: t("绿色", "Green"),
      yellow: t("黄色", "Yellow"),
      orange: t("橙色", "Orange"),
      red: t("红色", "Red"),
    };
    return <span className={cls}>{labels[level] || level}</span>;
  };

  return (
    <div className="pt-root">
      {/* Breadcrumb */}
      <div className="pt-breadcrumb">
        <span>MRIWP</span>
        <span className="pt-breadcrumb-sep">&gt;</span>
        <span>{t("人员中心", "Personnel Center")}</span>
        <span className="pt-breadcrumb-sep">&gt;</span>
        <span className="pt-breadcrumb-active">
          {t("个人趋势", "Personal Trend")}
        </span>
      </div>

      {/* Page Title */}
      <div className="pt-page-header">
        <h1 className="pt-page-title">
          {t(
            "人员风险趋势分析：John Doe (ID: JD123)",
            "Personnel Risk Trend Analysis: John Doe (ID: JD123)",
          )}
          <span className="pt-risk-badge">
            <span className="pt-risk-badge-dot" />
            {t("风险升高", "Elevated Risk")}
          </span>
        </h1>
      </div>

      {/* Search Bar */}
      <div className="pt-search-bar">
        <div className="pt-search-input-wrapper">
          <input
            className="pt-search-input"
            placeholder={t(
              "人员 / 搜索 (ID: JD123)",
              "Personnel / Search (ID: JD123)",
            )}
            defaultValue="JD123"
          />
          <button className="pt-search-clear" title="Clear">
            &times;
          </button>
          <span className="pt-search-chevron">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </div>
      </div>

      {/* Main Content: Two Columns */}
      <div className="pt-body">
        {/* LEFT COLUMN */}
        <div className="pt-col-left">
          {/* Card 1: Risk Score Trend */}
          <div className="pt-card">
            <div className="pt-card-header">
              <h3 className="pt-card-title">
                {t("风险评分趋势", "Risk Score Trend")}
              </h3>
              <div className="pt-legend">
                <div className="pt-legend-item">
                  <span
                    className="pt-legend-line"
                    style={{ background: "#3b82f6" }}
                  />
                  {t("风险评分", "Risk Score")}
                </div>
                <div className="pt-legend-item">
                  <span
                    className="pt-legend-dot"
                    style={{ background: "#ef4444" }}
                  />
                  {t("异常峰值标记", "Abnormal Peak Markers")}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="pt-tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  className={`pt-tab ${activeTab === tab.key ? "pt-tab-active" : ""}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Area Chart */}
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="ptScoreFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop
                      offset="100%"
                      stopColor="#3b82f6"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                {/* Background risk zones */}
                <ReferenceArea y1={80} y2={100} fill="rgba(239,68,68,0.08)" />
                <ReferenceArea y1={60} y2={80} fill="rgba(249,115,22,0.06)" />
                <ReferenceArea y1={40} y2={60} fill="rgba(234,179,8,0.05)" />
                <ReferenceArea y1={0} y2={40} fill="rgba(34,197,94,0.04)" />
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                <XAxis
                  dataKey="day"
                  tick={AXIS_TICK}
                  stroke={GRID_STROKE}
                  label={{
                    value: t("时间", "Time"),
                    position: "insideBottomRight",
                    offset: -5,
                    style: { fontSize: 11, fill: "#64748b" },
                  }}
                />
                <YAxis
                  tick={AXIS_TICK}
                  stroke={GRID_STROKE}
                  domain={[0, 100]}
                  label={{
                    value: t("风险评分", "Risk Score"),
                    angle: -90,
                    position: "insideLeft",
                    offset: 10,
                    style: { fontSize: 11, fill: "#64748b" },
                  }}
                />
                <Tooltip
                  {...darkTooltipStyle}
                  formatter={(value: number, name: string) => {
                    if (name === "anomaly")
                      return [value, t("异常峰值", "Anomaly Peak")];
                    return [value, t("风险评分", "Risk Score")];
                  }}
                  labelFormatter={(label) => `${t("日期", "Date")}: ${label}`}
                />
                <ReferenceLine
                  y={60}
                  stroke="rgba(249,115,22,0.3)"
                  strokeDasharray="4 4"
                />
                <ReferenceLine
                  y={80}
                  stroke="rgba(239,68,68,0.3)"
                  strokeDasharray="4 4"
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#ptScoreFill)"
                  dot={{ fill: "#3b82f6", r: 2, strokeWidth: 0 }}
                  activeDot={{ r: 4, fill: "#3b82f6" }}
                  name="score"
                />
                <Area
                  type="monotone"
                  dataKey="anomaly"
                  stroke="transparent"
                  fill="transparent"
                  dot={<AnomalyDot />}
                  activeDot={false}
                  name="anomaly"
                  connectNulls={false}
                />
              </AreaChart>
            </ResponsiveContainer>

            {/* Anomaly Summary Table */}
            <div style={{ marginTop: 16 }}>
              <table className="pt-table">
                <thead>
                  <tr>
                    <th>{t("聚合", "Aggregate")}</th>
                    <th>{t("风险因素", "Risk Factor")}</th>
                    <th>{t("风险评分", "Risk Score")}</th>
                    <th>{t("事件", "Incident")}</th>
                    <th>{t("持续时间", "Duration")}</th>
                    <th>{t("相关风险", "Related Risk")}</th>
                    <th>{t("风险等级", "Risk Level")}</th>
                    <th>{t("操作", "Actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {anomalySummary.map((row, i) => (
                    <tr key={i}>
                      <td>{t(row.aggregateZh, row.aggregate)}</td>
                      <td>{row.riskFactor}</td>
                      <td>
                        <span className="pt-change-orange">
                          {row.riskScore}
                        </span>
                      </td>
                      <td>
                        <span className="pt-change-orange">{row.duration}</span>
                      </td>
                      <td>
                        <span className="pt-change-orange">{row.duration}</span>
                      </td>
                      <td>{t(row.relatedRiskZh, row.relatedRisk)}</td>
                      <td>{riskLevelBadge(row.riskLevel)}</td>
                      <td>{riskLevelBadge(row.actionLevel)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Card 2: Related Historical Flights */}
          <div className="pt-card">
            <div className="pt-card-header">
              <h3 className="pt-card-title">
                {t("相关历史航班", "Related Historical Flights")}
              </h3>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="pt-btn pt-btn-primary">
                  {t("查看相关航班", "View Related Flight")}
                </button>
                <button className="pt-btn pt-btn-outline">
                  {t("查看更多历史", "View More History")}
                </button>
              </div>
            </div>

            <table className="pt-table">
              <thead>
                <tr>
                  <th>{t("航班ID", "Flight ID")}</th>
                  <th>{t("日期", "Date")}</th>
                  <th>{t("航线", "Route")}</th>
                  <th>{t("持续时间", "Duration")}</th>
                  <th>{t("相关风险", "Related Risk")}</th>
                  <th>{t("风险等级", "Risk Level")}</th>
                  <th>{t("操作", "Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {historicalFlights.map((flight) => (
                  <tr key={flight.id}>
                    <td style={{ color: "#3b82f6", fontWeight: 600 }}>
                      {flight.id}
                    </td>
                    <td>{flight.date}</td>
                    <td>{flight.route}</td>
                    <td>{flight.duration}</td>
                    <td>{t(flight.relatedRiskZh, flight.relatedRisk)}</td>
                    <td>{riskLevelBadge(flight.riskLevel)}</td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        {/* Eye icon */}
                        <button className="pt-action-icon" title="View">
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>
                        {/* Edit icon */}
                        <button className="pt-action-icon" title="Edit">
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        {/* Delete icon */}
                        <button className="pt-action-icon" title="Delete">
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                        {/* More icon */}
                        <button className="pt-action-icon" title="More">
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="12" cy="12" r="1" />
                            <circle cx="19" cy="12" r="1" />
                            <circle cx="5" cy="12" r="1" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="pt-col-right">
          <div className="pt-card">
            <h3 className="pt-card-title" style={{ marginBottom: 14 }}>
              {t("风险洞察与趋势摘要", "Risk Insights & Trend Summary")}
            </h3>

            {/* Section 1: Metric Changes */}
            <h4 className="pt-section-title">
              {t(
                "指标变化（与前30天对比）",
                "Metric Changes (vs Previous 30 Days)",
              )}
            </h4>
            <div className="pt-metric-list">
              <div className="pt-metric-row">
                <span className="pt-metric-label">
                  {t("总体风险", "Overall Risk")}
                </span>
                <span className="pt-metric-value pt-metric-up">
                  +12%
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <polyline points="6 18 12 6 18 18" />
                  </svg>
                </span>
              </div>
              <div className="pt-metric-row">
                <span className="pt-metric-label">
                  {t("事件频率", "Incident Frequency")}
                </span>
                <span className="pt-metric-value pt-metric-up">
                  +5%
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <polyline points="6 18 12 6 18 18" />
                  </svg>
                </span>
              </div>
              <div className="pt-metric-row">
                <span className="pt-metric-label">
                  {t("程序遵守", "Procedure Adherence")}
                </span>
                <span className="pt-metric-value pt-metric-down">
                  -3%
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <polyline points="6 6 12 18 18 6" />
                  </svg>
                </span>
              </div>
            </div>

            <div className="pt-section-divider" />

            {/* Section 2: Why Risk Increased */}
            <h4 className="pt-section-title">
              {t("风险上升原因（摘要）", "Why Risk Increased (Summary)")}
            </h4>

            <div className="pt-insight-card">
              <div className="pt-insight-icon pt-insight-icon-warning">
                <svg
                  width="16"
                  height="16"
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
              </div>
              <span className="pt-insight-text">
                {t(
                  "安全违规频率增加（上月）",
                  "Increased frequency of safety violations (Last month)",
                )}
              </span>
              <div className="pt-insight-stats">
                <span className="pt-insight-stat">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                  </svg>
                  109
                </span>
                <span className="pt-insight-stat">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  0.0
                </span>
              </div>
            </div>

            <div className="pt-insight-card">
              <div className="pt-insight-icon pt-insight-icon-wave">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <span className="pt-insight-text">
                {t(
                  "特定航线着陆阶段偏差",
                  "Deviations during landing phases on specific routes",
                )}
              </span>
              <div className="pt-insight-stats">
                <span className="pt-insight-stat">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                  </svg>
                  101
                </span>
                <span className="pt-insight-stat">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  4.5
                </span>
              </div>
            </div>

            <div className="pt-insight-card">
              <div className="pt-insight-icon pt-insight-icon-stress">
                <svg
                  width="16"
                  height="16"
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
              </div>
              <span className="pt-insight-text">
                {t(
                  "与值勤时间相关的压力指标升高",
                  "Elevated stress indicators correlated with duty hours",
                )}
              </span>
              <div className="pt-insight-stats">
                <span className="pt-insight-stat">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                  </svg>
                  143
                </span>
                <span className="pt-insight-stat">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  0.0
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
