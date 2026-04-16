// @ts-nocheck
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useLanguage } from "../i18n/useLanguage";
import "./PersonnelDetailPage.css";

// ---------- Mock Data ----------

const riskScoreTrendData = [
  { month: "1", monthZh: "第1次", composite: 15, human: 12 },
  { month: "2", monthZh: "第2次", composite: 22, human: 18 },
  { month: "3", monthZh: "第3次", composite: 28, human: 25 },
  { month: "4", monthZh: "第4次", composite: 32, human: 30 },
  { month: "5", monthZh: "第5次", composite: 35, human: 28 },
  { month: "6", monthZh: "第6次", composite: 38, human: 35 },
];

const keyRiskContributorsData = [
  { name: "Human Factors", nameZh: "人为因素", value: 42 },
  { name: "Training Gaps", nameZh: "训练不足", value: 28 },
  { name: "Schedule Anomalies", nameZh: "排班异常", value: 22 },
  { name: "Flight Performance", nameZh: "飞行表现", value: 15 },
];

const topRiskIndicators = [
  {
    label: "Elevated Fatigue Indices",
    labelZh: "疲劳指数升高",
    color: "#dc2626",
  },
  { label: "Missed CRM Training", labelZh: "缺失CRM训练", color: "#ea580c" },
  {
    label: "Above Average Deviation in Landing Patterns",
    labelZh: "着陆模式偏差高于平均",
    color: "#ea580c",
  },
  {
    label: "Flight Performance Score",
    labelZh: "飞行表现评分",
    color: "#eab308",
  },
  {
    label: "Elevated Fatigue Indices",
    labelZh: "疲劳指数升高",
    color: "#22c55e",
  },
];

const peerAnalysisData = [
  { month: "1", individual: 25, squadron: 20, fleet: 18 },
  { month: "2", individual: 30, squadron: 22, fleet: 19 },
  { month: "3", individual: 35, squadron: 24, fleet: 20 },
  { month: "4", individual: 32, squadron: 23, fleet: 19 },
  { month: "5", individual: 38, squadron: 25, fleet: 21 },
  { month: "6", individual: 36, squadron: 24, fleet: 20 },
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

// ---------- Nav Items ----------

interface NavItem {
  key: string;
  label: string;
  labelZh: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    key: "risk-profile",
    label: "Risk Profile",
    labelZh: "风险档案",
    icon: (
      <svg
        className="pd-nav-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    key: "personal-vs-fleet",
    label: "Personal vs Fleet",
    labelZh: "个人与机队对比",
    icon: (
      <svg
        className="pd-nav-icon"
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
    key: "historical-flights",
    label: "Historical Flights",
    labelZh: "历史航班",
    icon: (
      <svg
        className="pd-nav-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    key: "training-data",
    label: "Training Data",
    labelZh: "训练数据",
    icon: (
      <svg
        className="pd-nav-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    key: "squadron-monthly",
    label: "Squadron Monthly Report",
    labelZh: "中队月报",
    icon: (
      <svg
        className="pd-nav-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
];

// ---------- Component ----------

export function PersonnelDetailPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeNav, setActiveNav] = useState(
    searchParams.get("tab") || "risk-profile",
  );

  return (
    <div className="pd-root">
      {/* Breadcrumb */}
      <div className="pd-breadcrumb">
        <span style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
          {t("工作台", "Dashboard")}
        </span>
        <span className="pd-breadcrumb-sep">&gt;</span>
        <span
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/personnel-center/personnel-list")}
        >
          {t("人", "Personnel")}
        </span>
        <span className="pd-breadcrumb-sep">&gt;</span>
        <span className="pd-breadcrumb-active">
          {t("人员详情", "Personnel Detail")}
        </span>
      </div>

      {/* Back + Header Card */}
      <div style={{ padding: "8px 24px 0" }}>
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
      </div>
      <div className="pd-header-card">
        <div className="pd-header-top">
          <h1 className="pd-header-title">P1300456 - John M. Stevenson</h1>
          <div className="pd-header-icons">
            <button className="pd-icon-btn" title={t("信息", "Info")}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </button>
            <button className="pd-icon-btn" title={t("更多", "More")}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="5" r="1" />
                <circle cx="12" cy="12" r="1" />
                <circle cx="12" cy="19" r="1" />
              </svg>
            </button>
          </div>
        </div>
        <div className="pd-header-info">
          <div className="pd-info-item">
            <div className="pd-info-label">{t("工号", "Employee No.")}</div>
            <div className="pd-info-value">P1300456</div>
          </div>
          <div className="pd-info-item">
            <div className="pd-info-label">{t("机型", "Aircraft Type")}</div>
            <div className="pd-info-value">B737-800</div>
          </div>
          <div className="pd-info-item">
            <div className="pd-info-label">
              {t("技术等级", "Technical Level")}
            </div>
            <div className="pd-info-value">{t("机长", "Captain")}</div>
          </div>
          <div className="pd-info-item">
            <div className="pd-info-label">
              {t("部门 / 中队", "Division / Squadron")}
            </div>
            <div className="pd-info-value">
              {t("空中侦察 / 第42情报中队", "Air Recon / 42nd ISR Sq.")}
            </div>
          </div>
          <div className="pd-info-item">
            <div className="pd-info-label">
              {t("当前综合风险等级", "Current Composite Risk Level")}
            </div>
            <div className="pd-info-value">
              <span className="pd-risk-badge">
                {t("升高（3级）", "ELEVATED (LEVEL 3)")}
                <span className="pd-risk-badge-arrow">&uarr;</span>
              </span>
            </div>
          </div>
          <div className="pd-info-item">
            <div className="pd-info-label">
              {t("人为因素评分", "Human Factor Score")}
            </div>
            <div className="pd-info-value">
              <div className="pd-hf-score">
                <span className="pd-hf-score-text">78 / 100</span>
                <div className="pd-hf-bar-bg">
                  <div className="pd-hf-bar-fill" style={{ width: "78%" }} />
                </div>
              </div>
            </div>
          </div>
          <div className="pd-info-item">
            <div className="pd-info-label">
              {t("相关高风险航班数", "Number of Related High-Risk Flights")}
            </div>
            <div className="pd-info-value">
              5 {t("航班（近90天）", "Flights (Last 90 Days)")}
            </div>
          </div>
        </div>
      </div>

      {/* Two-column body */}
      <div className="pd-body">
        {/* Left Sidebar Nav */}
        <div className="pd-sidebar">
          {navItems.map((item) => (
            <button
              key={item.key}
              className={`pd-nav-item ${activeNav === item.key ? "pd-nav-item-active" : ""}`}
              onClick={() => setActiveNav(item.key)}
            >
              {item.icon}
              <span>{t(item.labelZh, item.label)}</span>
            </button>
          ))}
        </div>

        {/* Right Content Area */}
        <div className="pd-content">
          {activeNav === "risk-profile" && <RiskProfileSection />}
          {activeNav === "personal-trend" && (
            <div className="pd-card" style={{ padding: 20 }}>
              <h3 className="pd-card-title" style={{ marginBottom: 16 }}>
                {t("个人趋势", "Personal Trend")}
              </h3>
              <div className="pd-row-3">
                <div className="pd-card">
                  <div className="pd-card-header">
                    <h3 className="pd-card-title">
                      {t("风险评分趋势", "Risk Score Trend")}
                    </h3>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={riskScoreTrendData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={GRID_STROKE}
                      />
                      <XAxis
                        dataKey={(d: (typeof riskScoreTrendData)[0]) =>
                          t(d.monthZh, d.month)
                        }
                        tick={AXIS_TICK}
                        stroke={GRID_STROKE}
                      />
                      <YAxis
                        tick={AXIS_TICK}
                        stroke={GRID_STROKE}
                        domain={[0, 50]}
                      />
                      <Tooltip {...darkTooltipStyle} />
                      <Area
                        type="monotone"
                        dataKey="composite"
                        stroke="#3b82f6"
                        fill="rgba(59,130,246,0.1)"
                        strokeWidth={2}
                        name={t("综合评分", "Composite Score")}
                      />
                      <Line
                        type="monotone"
                        dataKey="human"
                        stroke="#94a3b8"
                        strokeWidth={2}
                        dot={{ fill: "#94a3b8", r: 3 }}
                        name={t("人为因素分项", "Human Factor Component")}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
          {activeNav === "personal-vs-fleet" && (
            <div className="pd-card" style={{ padding: 20 }}>
              <h3 className="pd-card-title" style={{ marginBottom: 16 }}>
                {t("个人与机队对比", "Personal vs Fleet")}
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={peerAnalysisData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                  <XAxis
                    dataKey="month"
                    tick={AXIS_TICK}
                    stroke={GRID_STROKE}
                    tickFormatter={(v: string) => t(`第${v}次`, `#${v}`)}
                  />
                  <YAxis
                    tick={AXIS_TICK}
                    stroke={GRID_STROKE}
                    domain={[0, 50]}
                  />
                  <Tooltip {...darkTooltipStyle} />
                  <Line
                    type="monotone"
                    dataKey="individual"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6", r: 4 }}
                    name={t("个人", "Individual")}
                  />
                  <Line
                    type="monotone"
                    dataKey="squadron"
                    stroke="#ea580c"
                    strokeWidth={2}
                    dot={{ fill: "#ea580c", r: 4 }}
                    name={t("中队平均", "Squadron Avg")}
                  />
                  <Line
                    type="monotone"
                    dataKey="fleet"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeDasharray="6 3"
                    dot={{ fill: "#94a3b8", r: 4 }}
                    name={t("机队平均", "Fleet Avg")}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          {activeNav === "training-data" && (
            <div className="pd-card" style={{ padding: 20 }}>
              <h3 className="pd-card-title" style={{ marginBottom: 16 }}>
                {t("训练数据", "Training Data")}
              </h3>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 200,
                  color: "#64748b",
                  fontSize: 14,
                }}
              >
                {t(
                  "训练数据展示内容待确认",
                  "Training data display content to be confirmed",
                )}
              </div>
            </div>
          )}
          {activeNav === "squadron-monthly" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: 300,
                color: "#64748b",
                fontSize: 14,
              }}
            >
              {t("此部分正在开发中...", "This section is under development...")}
            </div>
          )}
          {activeNav === "historical-flights" && (
            <div className="pd-card" style={{ padding: 20 }}>
              <h3 className="pd-card-title" style={{ marginBottom: 16 }}>
                {t("历史航班", "Historical Flights")}
              </h3>
              <div style={{ fontSize: 13, color: "#94a3b8" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr
                      style={{
                        borderBottom: "1px solid rgba(148,163,184,0.15)",
                      }}
                    >
                      <th
                        style={{
                          textAlign: "left",
                          padding: "8px 12px",
                          color: "#94a3b8",
                          fontSize: 12,
                        }}
                      >
                        {t("航班号", "Flight No.")}
                      </th>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "8px 12px",
                          color: "#94a3b8",
                          fontSize: 12,
                        }}
                      >
                        {t("日期", "Date")}
                      </th>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "8px 12px",
                          color: "#94a3b8",
                          fontSize: 12,
                        }}
                      >
                        {t("出发机场", "Departure")}
                      </th>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "8px 12px",
                          color: "#94a3b8",
                          fontSize: 12,
                        }}
                      >
                        {t("到达机场", "Arrival")}
                      </th>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "8px 12px",
                          color: "#94a3b8",
                          fontSize: 12,
                        }}
                      >
                        {t("机型", "Aircraft Type")}
                      </th>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "8px 12px",
                          color: "#94a3b8",
                          fontSize: 12,
                        }}
                      >
                        {t("风险等级", "Risk Level")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        fn: "MU5101",
                        date: "2024-03-15",
                        dep: "ZSPD",
                        arr: "ZBAA",
                        type: "B737-800",
                        risk: t("高", "High"),
                        color: "#ef4444",
                      },
                      {
                        fn: "MU5235",
                        date: "2024-03-10",
                        dep: "ZBAA",
                        arr: "ZSPD",
                        type: "B737-800",
                        risk: t("中", "Medium"),
                        color: "#eab308",
                      },
                      {
                        fn: "MU5302",
                        date: "2024-02-28",
                        dep: "ZSPD",
                        arr: "ZGGG",
                        type: "A320",
                        risk: t("高", "High"),
                        color: "#ef4444",
                      },
                      {
                        fn: "MU5418",
                        date: "2024-02-20",
                        dep: "ZGGG",
                        arr: "ZSPD",
                        type: "A320",
                        risk: t("低", "Low"),
                        color: "#22c55e",
                      },
                      {
                        fn: "MU5506",
                        date: "2024-02-15",
                        dep: "ZSPD",
                        arr: "ZSSS",
                        type: "B737-800",
                        risk: t("中", "Medium"),
                        color: "#eab308",
                      },
                      {
                        fn: "MU5612",
                        date: "2024-02-10",
                        dep: "ZSSS",
                        arr: "ZSPD",
                        type: "B777",
                        risk: t("低", "Low"),
                        color: "#22c55e",
                      },
                    ].map((f, i) => (
                      <tr
                        key={i}
                        style={{
                          borderBottom: "1px solid rgba(148,163,184,0.08)",
                          cursor: "pointer",
                        }}
                        onClick={() =>
                          navigate(`/risk-monitoring/flight-detail?fn=${f.fn}`)
                        }
                      >
                        <td
                          style={{
                            padding: "8px 12px",
                            color: "#e2e8f0",
                            fontWeight: 600,
                          }}
                        >
                          {f.fn}
                        </td>
                        <td style={{ padding: "8px 12px" }}>{f.date}</td>
                        <td style={{ padding: "8px 12px" }}>{f.dep}</td>
                        <td style={{ padding: "8px 12px" }}>{f.arr}</td>
                        <td style={{ padding: "8px 12px" }}>{f.type}</td>
                        <td style={{ padding: "8px 12px" }}>
                          <span style={{ color: f.color, fontWeight: 600 }}>
                            {f.risk}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- Risk Profile Section ----------

function RiskProfileSection() {
  const { t } = useLanguage();

  return (
    <>
      {/* Row 1: Three cards */}
      <div className="pd-row-3">
        {/* Risk Score Trend */}
        <div className="pd-card">
          <div className="pd-card-header">
            <h3 className="pd-card-title">
              {t("风险评分趋势", "Risk Score Trend")}
            </h3>
            <select className="pd-dropdown">
              <option>{t("6个月", "6 months")}</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={riskScoreTrendData}>
              <defs>
                <linearGradient
                  id="riskZoneGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.15} />
                  <stop offset="35%" stopColor="#eab308" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0.08} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis
                dataKey={(d: (typeof riskScoreTrendData)[0]) =>
                  t(d.monthZh, d.month)
                }
                tick={AXIS_TICK}
                stroke={GRID_STROKE}
              />
              <YAxis tick={AXIS_TICK} stroke={GRID_STROKE} domain={[0, 50]} />
              <Tooltip {...darkTooltipStyle} />
              <Area
                type="monotone"
                dataKey="composite"
                stroke="transparent"
                fill="url(#riskZoneGradient)"
                fillOpacity={1}
              />
              <Line
                type="monotone"
                dataKey="composite"
                stroke="#1e293b"
                strokeWidth={2}
                dot={{ fill: "#1e293b", r: 3 }}
                name={t("综合评分", "Composite Score")}
              />
              <Line
                type="monotone"
                dataKey="human"
                stroke="#94a3b8"
                strokeWidth={2}
                dot={{ fill: "#94a3b8", r: 3 }}
                name={t("人为因素分项", "Human Factor Component")}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="pd-legend">
            <div className="pd-legend-item">
              <span
                className="pd-legend-line"
                style={{ background: "#1e293b" }}
              />
              {t("综合评分", "Composite Score")}
            </div>
            <div className="pd-legend-item">
              <span
                className="pd-legend-line"
                style={{ background: "#94a3b8" }}
              />
              {t("人为因素分项", "Human Factor Component")}
            </div>
          </div>
        </div>

        {/* Key Risk Contributors */}
        <div className="pd-card">
          <div className="pd-card-header">
            <h3 className="pd-card-title">
              {t("关键风险贡献因素", "Key Risk Contributors")}
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={keyRiskContributorsData}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis
                dataKey={(d: (typeof keyRiskContributorsData)[0]) =>
                  t(d.nameZh, d.name)
                }
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                stroke={GRID_STROKE}
                interval={0}
              />
              <YAxis tick={AXIS_TICK} stroke={GRID_STROKE} domain={[0, 50]} />
              <Tooltip {...darkTooltipStyle} />
              <Bar
                dataKey="value"
                fill="#3b82f6"
                barSize={28}
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Risk Indicators */}
        <div className="pd-card">
          <div className="pd-card-header">
            <h3 className="pd-card-title">
              {t("主要风险指标", "Top Risk Indicators")}
            </h3>
          </div>
          <div className="pd-indicator-list">
            {topRiskIndicators.map((item, i) => (
              <div className="pd-indicator-item" key={i}>
                <span
                  className="pd-indicator-dot"
                  style={{ background: item.color }}
                />
                <span>{t(item.labelZh, item.label)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Two cards */}
      <div className="pd-row-2">
        {/* Comparative Peer Analysis */}
        <div className="pd-card">
          <div className="pd-card-header">
            <h3 className="pd-card-title">
              {t("同类对比分析", "Comparative Peer Analysis")}
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={peerAnalysisData}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis
                dataKey="month"
                tick={AXIS_TICK}
                stroke={GRID_STROKE}
                tickFormatter={(v: string) => t(`第${v}次`, `#${v}`)}
              />
              <YAxis tick={AXIS_TICK} stroke={GRID_STROKE} domain={[0, 50]} />
              <Tooltip {...darkTooltipStyle} />
              <Bar
                dataKey="individual"
                fill="rgba(148,163,184,0.08)"
                barSize={30}
              />
              <Line
                type="monotone"
                dataKey="individual"
                stroke="#1e293b"
                strokeWidth={2}
                dot={{ fill: "#1e293b", r: 4, stroke: "#1e293b" }}
                name={t(
                  "个人当前综合风险",
                  "Current Composite Risk as the Individual",
                )}
              />
              <Line
                type="monotone"
                dataKey="squadron"
                stroke="#ea580c"
                strokeWidth={2}
                dot={{ fill: "#ea580c", r: 4, stroke: "#ea580c" }}
                name={t(
                  "当前综合与中队平均",
                  "Current Composite and Squadron Average",
                )}
              />
              <Line
                type="monotone"
                dataKey="fleet"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="6 3"
                dot={{ fill: "#94a3b8", r: 4, stroke: "#94a3b8" }}
                name={t(
                  "当前综合与机队平均",
                  "Current Composite and Fleet Average",
                )}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="pd-legend">
            <div className="pd-legend-item">
              <span
                className="pd-legend-line"
                style={{ background: "#1e293b" }}
              />
              {t(
                "个人当前综合风险",
                "Current Composite Risk as the Individual",
              )}
            </div>
            <div className="pd-legend-item">
              <span
                className="pd-legend-line"
                style={{ background: "#ea580c" }}
              />
              {t(
                "当前综合与中队平均",
                "Current Composite and Squadron Average",
              )}
            </div>
            <div className="pd-legend-item">
              <span
                className="pd-legend-line-dashed"
                style={{ color: "#94a3b8" }}
              />
              {t("当前综合与机队平均", "Current Composite and Fleet Average")}
            </div>
          </div>
        </div>

        {/* Action Links */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="pd-action-link">
            <div className="pd-action-link-text">
              <span className="pd-action-link-title">
                {t("查看推荐训练", "View Recommended Training")}
              </span>
              <span className="pd-action-link-sub">
                {t("查看其他推荐训练", "View rest recommended training")}
              </span>
            </div>
            <svg
              className="pd-action-link-chevron"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
          <div className="pd-action-link">
            <div className="pd-action-link-text">
              <span className="pd-action-link-title">
                {t(
                  "相关高风险航班（近30天）",
                  "Related High-Risk Flights (Last 30 Days)",
                )}
              </span>
            </div>
            <svg
              className="pd-action-link-chevron"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </div>
      </div>
    </>
  );
}
