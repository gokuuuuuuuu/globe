// @ts-nocheck
import { useNavigate } from "react-router-dom";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import { useLanguage } from "../i18n/useLanguage";
import "./PersonnelVsFleetPage.css";

// ---------- Mock Data ----------

const radarDimensions = [
  { key: "approachStability", en: "Approach Stability", zh: "进近稳定性" },
  { key: "fuelEfficiency", en: "Fuel Efficiency", zh: "燃油效率" },
  { key: "landingSmoothness", en: "Landing Smoothness", zh: "着陆平滑度" },
  { key: "engineManagement", en: "Engine Management", zh: "发动机管理" },
  { key: "autopilotUsage", en: "Autopilot Usage", zh: "自动驾驶使用" },
  { key: "crmScore", en: "CRM Score", zh: "CRM评分" },
];

const personalRadar = [85, 72, 68, 60, 55, 78];
const fleetAvgRadar = [70, 65, 60, 55, 50, 65];
const companyAvgRadar = [68, 62, 58, 52, 48, 62];

const radarData = radarDimensions.map((dim, i) => ({
  dimension: dim.key,
  en: dim.en,
  zh: dim.zh,
  personal: personalRadar[i],
  fleetAvg: fleetAvgRadar[i],
  companyAvg: companyAvgRadar[i],
}));

const barComparisonData = [
  {
    en: "Approach Speed Stability",
    zh: "进近速度稳定性",
    personal: 82.5,
    fleet: 78.1,
    delta: "+0.5%",
  },
  {
    en: "Delayed Gear Retraction",
    zh: "延迟收起落架",
    personal: 79.9,
    fleet: 78.1,
    delta: "+0.5%",
  },
  {
    en: "Go-Around Rate",
    zh: "复飞率",
    personal: 48.5,
    fleet: 38.0,
    delta: "-7.5%",
  },
  {
    en: "Co-wenting Stability",
    zh: "协调稳定性",
    personal: 13.0,
    fleet: 11.5,
    delta: "-0.8%",
  },
  {
    en: "Autopilot Usage",
    zh: "自动驾驶使用",
    personal: 23.7,
    fleet: 18.5,
    delta: "+0.5%",
  },
];

const deviationData = [
  {
    en: "Unstable Approach rate >1000ft",
    zh: "不稳定进近率 >1000ft",
    personal: 82.5,
    fleet: 78.1,
    deviation: "-29.3%",
    status: "high",
    statusEn: "High Deviation",
    statusZh: "高偏差",
  },
  {
    en: "High-speed taxi events",
    zh: "高速滑行事件",
    personal: 82.5,
    fleet: 78.2,
    deviation: "-22.0%",
    status: "medium",
    statusEn: "Medium",
    statusZh: "中",
  },
  {
    en: "Late Flap Configuration",
    zh: "延迟襟翼构型",
    personal: 78.1,
    fleet: 78.1,
    deviation: "-10.3%",
    status: "medium",
    statusEn: "Medium",
    statusZh: "中",
  },
  {
    en: "Over-torque events",
    zh: "超扭矩事件",
    personal: 82.5,
    fleet: 79.9,
    deviation: "-0.5%",
    status: "low",
    statusEn: "Low",
    statusZh: "低",
  },
  {
    en: "Excessive bank angle",
    zh: "过大坡度角",
    personal: 78.1,
    fleet: 78.1,
    deviation: "-0.2%",
    status: "low",
    statusEn: "Low",
    statusZh: "低",
  },
];

// Chart styles
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

// ---------- Custom Bar Label ----------

function BarLabel({ x, y, width, value, index, isPersonal }: any) {
  if (!isPersonal) return null;
  const item = barComparisonData[index];
  if (!item) return null;
  const isPositive = item.delta.startsWith("+");
  return (
    <text
      x={x + width / 2}
      y={y - 8}
      textAnchor="middle"
      fontSize={10}
      fill={isPositive ? "#22c55e" : "#ef4444"}
    >
      {item.delta}
    </text>
  );
}

// ---------- Component ----------

export function PersonnelVsFleetPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="pv-root">
      {/* Breadcrumb */}
      <div className="pv-breadcrumb">
        <span style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
          {t("工作台", "Dashboard")}
        </span>
        <span className="pv-breadcrumb-sep">&gt;</span>
        <span
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/personnel-center/personnel-list")}
        >
          {t("人", "Personnel")}
        </span>
        <span className="pv-breadcrumb-sep">&gt;</span>
        <span className="pv-breadcrumb-active">
          {t("个人 VS 机队", "Personal vs Fleet")}
        </span>
      </div>

      {/* Page Title */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          margin: "12px 0",
        }}
      >
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
        <h1 className="pv-page-title" style={{ margin: 0 }}>
          {t("个人 VS 机队", "Personal vs Fleet")}
        </h1>
      </div>

      {/* Filter Row */}
      <div className="pv-filter-row">
        <div className="pv-filter-group">
          <span className="pv-filter-label">
            {t("时间范围：", "Time Range:")}
          </span>
          <select className="pv-dropdown">
            <option>{t("近90天", "Last 90 Days")}</option>
          </select>
        </div>
        <div className="pv-filter-group">
          <span className="pv-filter-label">
            {t("机型：", "Aircraft Type:")}
          </span>
          <select className="pv-dropdown">
            <option>B737-800</option>
          </select>
        </div>
        <div className="pv-filter-group">
          <span className="pv-filter-label">
            {t("操作类型：", "Operation Type:")}
          </span>
          <select className="pv-dropdown">
            <option>{t("所有航班", "All Flights")}</option>
          </select>
        </div>
        <div className="pv-filter-spacer" />
        <button className="pv-btn-outline">
          {t("查看训练数据", "View Training Data")}
        </button>
        <button className="pv-btn-primary">
          {t("查看相关航班", "View Related Flights")}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="pv-summary-row">
        {/* Personal Value */}
        <div className="pv-summary-card">
          <div className="pv-summary-label">
            {t("个人值", "Personal Value")}
          </div>
          <div className="pv-summary-sublabel">
            {t("综合安全评分", "Overall Safety Score")}
          </div>
          <div className="pv-summary-value-row">
            <span className="pv-summary-value">82.5</span>
            <span className="pv-badge-green">{t("风险", "Risk")}</span>
          </div>
          <div className="pv-delta-green">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="18 15 12 9 6 15" />
            </svg>
            +0.5%
          </div>
        </div>

        {/* Fleet Average */}
        <div className="pv-summary-card">
          <div className="pv-summary-label">
            {t("机队平均", "Fleet Average")}
          </div>
          <div className="pv-summary-sublabel">{t("分数", "Score")}</div>
          <div className="pv-summary-value-row">
            <span className="pv-summary-value">78.1</span>
            <span className="pv-dot-blue" />
          </div>
        </div>

        {/* Company Average */}
        <div className="pv-summary-card">
          <div className="pv-summary-label">
            {t("公司平均", "Company Average")}
          </div>
          <div className="pv-summary-sublabel">{t("分数", "Score")}</div>
          <div className="pv-summary-value-row">
            <span className="pv-summary-value">79.9</span>
            <span className="pv-dot-green" />
          </div>
        </div>

        {/* Percentile Position */}
        <div className="pv-summary-card">
          <div className="pv-summary-label">
            {t("百分位排名", "Percentile Position")}
          </div>
          <div className="pv-summary-sublabel">
            {t("综合评分", "Overall Score")}
          </div>
          <div className="pv-percentile-small">85th %ile</div>
          <div className="pv-percentile-large">
            {t("前15百分位", "Top 15th Percentile")}
          </div>
        </div>
      </div>

      {/* Chart Row */}
      <div className="pv-chart-row">
        {/* Performance Radar */}
        <div className="pv-card">
          <div className="pv-card-header">
            <h3 className="pv-card-title">
              {t("性能雷达", "Performance Radar")}
            </h3>
          </div>
          <div className="pv-legend" style={{ marginBottom: 8, marginTop: 0 }}>
            <div className="pv-legend-item">
              <span
                className="pv-legend-line"
                style={{ background: "#22c55e" }}
              />
              {t("个人", "Personal")}
            </div>
            <div className="pv-legend-item">
              <span
                className="pv-legend-line-dashed"
                style={{ color: "#94a3b8" }}
              />
              {t("机队平均", "Fleet Avg")}
            </div>
            <div className="pv-legend-item">
              <span
                className="pv-legend-line-dashed"
                style={{ color: "#64748b" }}
              />
              {t("公司平均", "Company Avg")}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="rgba(148, 163, 184, 0.15)" />
              <PolarAngleAxis
                dataKey={(d: (typeof radarData)[0]) => t(d.zh, d.en)}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: "#64748b" }}
                stroke="rgba(148, 163, 184, 0.1)"
              />
              <Radar
                name={t("个人", "Personal")}
                dataKey="personal"
                stroke="#22c55e"
                fill="#22c55e"
                fillOpacity={0.15}
                strokeWidth={2}
              />
              <Radar
                name={t("机队平均", "Fleet Avg")}
                dataKey="fleetAvg"
                stroke="#94a3b8"
                fill="transparent"
                strokeDasharray="6 3"
                strokeWidth={1.5}
              />
              <Radar
                name={t("公司平均", "Company Avg")}
                dataKey="companyAvg"
                stroke="#64748b"
                fill="transparent"
                strokeDasharray="4 4"
                strokeWidth={1.5}
              />
              <Tooltip {...darkTooltipStyle} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart Comparison */}
        <div className="pv-card">
          <div className="pv-card-header">
            <h3 className="pv-card-title">
              {t("柱状图对比", "Bar Chart Comparison")}
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart
              data={barComparisonData}
              margin={{ top: 20, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis
                dataKey={(d: (typeof barComparisonData)[0]) => t(d.zh, d.en)}
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                stroke={GRID_STROKE}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={60}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                stroke={GRID_STROKE}
                domain={[0, 100]}
                tickFormatter={(v: number) => `${v}%`}
              />
              <Tooltip {...darkTooltipStyle} />
              <Bar
                dataKey="personal"
                name={t("个人", "Personal")}
                fill="#22c55e"
                barSize={20}
                radius={[3, 3, 0, 0]}
                label={(props: any) => (
                  <BarLabel {...props} isPersonal={true} />
                )}
              />
              <Bar
                dataKey="fleet"
                name={t("机队平均", "Fleet Avg")}
                fill="#64748b"
                barSize={20}
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
          <div className="pv-legend">
            <div className="pv-legend-item">
              <span
                className="pv-legend-line"
                style={{ background: "#22c55e" }}
              />
              {t("个人", "Personal")}
            </div>
            <div className="pv-legend-item">
              <span
                className="pv-legend-line"
                style={{ background: "#64748b" }}
              />
              {t("机队平均", "Fleet Avg")}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Table */}
      <div className="pv-table-card">
        <h3 className="pv-card-title">
          {t(
            "前5项显著偏差（与机队平均对比）",
            "Top 5 Significant Deviations (vs Fleet Avg)",
          )}
        </h3>
        <table className="pv-table">
          <thead>
            <tr>
              <th>{t("指标名称", "Metric Name")}</th>
              <th>{t("个人值", "Personal Value")}</th>
              <th>{t("机队平均", "Fleet Avg")}</th>
              <th>{t("偏差 (%)", "Deviation (%)")}</th>
              <th>{t("风险状态", "Risk Status")}</th>
            </tr>
          </thead>
          <tbody>
            {deviationData.map((row, i) => (
              <tr key={i}>
                <td>{t(row.zh, row.en)}</td>
                <td>{row.personal}</td>
                <td>{row.fleet}</td>
                <td>{row.deviation}</td>
                <td>
                  <span className={`pv-status-badge pv-status-${row.status}`}>
                    {t(row.statusZh, row.statusEn)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
