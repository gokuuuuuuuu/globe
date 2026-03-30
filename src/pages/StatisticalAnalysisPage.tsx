import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip as LTooltip,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useLanguage } from "../i18n/useLanguage";
import "./StatisticalAnalysisPage.css";

// ===== Mock Data =====

const otpTrendData = [
  { month: "Jan", JKF: 82, LAX: 75, ACR: 68, NDY: 72, ABR: 65, ALL: 71 },
  { month: "Feb", JKF: 78, LAX: 70, ACR: 72, NDY: 68, ABR: 62, ALL: 68 },
  { month: "Mar", JKF: 85, LAX: 78, ACR: 74, NDY: 70, ABR: 66, ALL: 73 },
  { month: "Apr", JKF: 80, LAX: 73, ACR: 70, NDY: 75, ABR: 68, ALL: 72 },
  { month: "May", JKF: 88, LAX: 80, ACR: 76, NDY: 78, ABR: 70, ALL: 77 },
  { month: "Jun", JKF: 84, LAX: 77, ACR: 72, NDY: 74, ABR: 67, ALL: 74 },
];

const passengerVolumeData = [
  { airport: "JKF", volume: 9.2 },
  { airport: "LAX", volume: 8.1 },
  { airport: "DER", volume: 6.5 },
  { airport: "ABA", volume: 5.8 },
  { airport: "NDN", volume: 4.9 },
  { airport: "ADR", volume: 4.2 },
  { airport: "UHR", volume: 3.5 },
];

const delayAirports = [
  { rank: 1, code: "JKF", city: "Bheeman City", count: 16 },
  { rank: 2, code: "LAX", city: "Matarono City", count: 10 },
  { rank: 3, code: "DLI", city: "Caresen City", count: 8 },
  { rank: 4, code: "GUX", city: "Matatona City", count: 6 },
];

const groundServiceData = [
  { name: "Gate Turnaround", value: 39.8, color: "#3b82f6" },
  { name: "Refueling", value: 17.2, color: "#ef4444" },
  { name: "Cleaning", value: 13.8, color: "#22c55e" },
  { name: "Maintenance", value: 11.5, color: "#a855f7" },
  { name: "Dectoc", value: 8.5, color: "#f97316" },
  { name: "Other", value: 4.7, color: "#eab308" },
  { name: "Ground & Refsonance", value: 4.5, color: "#64748b" },
];

const drillDownFlights = [
  {
    id: "1773016",
    origin: "JKF",
    dest: "LAX",
    scheduled: "12:30 PM",
    actual: "12:35 PM",
    delay: 10,
  },
];

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

const TABS = [
  "flight-statistics",
  "personnel-statistics",
  "airport-statistics",
  "aircraft-statistics",
  "model-performance",
] as const;
type TabKey = (typeof TABS)[number];

const OTP_COLORS = [
  "#3b82f6",
  "#ef4444",
  "#22c55e",
  "#a855f7",
  "#f97316",
  "#64748b",
];
const OTP_KEYS = ["JKF", "LAX", "ACR", "NDY", "ABR", "ALL"];

// ===== Component =====

export function StatisticalAnalysisPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabKey>("airport-statistics");

  const tabLabels: Record<TabKey, string> = {
    "flight-statistics": t("航班统计", "Flight Statistics"),
    "personnel-statistics": t("人员统计", "Personnel Statistics"),
    "airport-statistics": t("机场统计", "Airport Statistics"),
    "aircraft-statistics": t("飞机统计", "Aircraft Statistics"),
    "model-performance": t("模型表现", "Model Performance"),
  };

  const tMonth = (m: string) => {
    const map: Record<string, string> = {
      Jan: "1月",
      Feb: "2月",
      Mar: "3月",
      Apr: "4月",
      May: "5月",
      Jun: "6月",
    };
    return t(map[m] || m, m);
  };

  const tService = (name: string) => {
    const map: Record<string, string> = {
      "Gate Turnaround": "登机口周转",
      Refueling: "加油",
      Cleaning: "清洁",
      Maintenance: "维护",
      Dectoc: "检测",
      Other: "其他",
      "Ground & Refsonance": "地面与共振",
    };
    return t(map[name] || name, name);
  };

  return (
    <div className="sta-root">
      {/* Breadcrumb */}
      <div className="sta-breadcrumb">
        {t("首页", "Home")}
        <span className="sta-breadcrumb-sep">/</span>
        {t("P27 统计分析", "P27 Statistical Analysis")}
        <span className="sta-breadcrumb-sep">/</span>
        <span className="sta-breadcrumb-active">
          {t("机场统计", "Airport Statistics")}
        </span>
      </div>

      {/* Header bar */}
      <div className="sta-header-bar">
        <h1 className="sta-page-title">
          {t("机场统计概览", "Airport Statistics Overview")}
        </h1>
        <button className="sta-filter-btn">
          &#128197;&nbsp;{t("最近30天", "Last 30 Days")}&nbsp;&#9662;
        </button>
        <button className="sta-filter-btn">
          {t("机场: '所有主要枢纽'", "Airport: 'All Major Hubs'")}&nbsp;&#9662;
        </button>
        <button className="sta-filter-btn">
          {t("更多筛选", "More Filters")}
        </button>
        <div className="sta-header-actions">
          <button className="sta-export-btn">
            &#128196;&nbsp;{t("导出 Excel", "Export Excel")}
          </button>
          <button className="sta-export-btn">
            &#128196;&nbsp;{t("导出 PDF", "Export PDF")}
          </button>
          <button className="sta-export-btn primary">
            &#128231;&nbsp;{t("订阅日报", "Subscribe Daily Report")}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="sta-tabs">
        {TABS.map((key) => (
          <button
            key={key}
            className={`sta-tab${activeTab === key ? " active" : ""}`}
            onClick={() => setActiveTab(key)}
          >
            {tabLabels[key]}
          </button>
        ))}
      </div>

      <div className="sta-body">
        {/* KPI Row */}
        <div className="sta-kpi-row">
          {[
            {
              num: "1",
              label: t("国内机场总数", "Total Domestic Airports"),
              value: "245",
              change: "+3.1%",
              dir: "up",
            },
            {
              num: "2",
              label: t("航班总数", "Total Flights"),
              value: "452,109",
              change: "-1.2%",
              dir: "down",
            },
            {
              num: "3",
              label: t("平均延误", "Average Delay"),
              value: "18.5 min",
              change: "+5.4%",
              dir: "up",
            },
            {
              num: "4",
              label: t("准点率 (OTP)", "On-Time Performance (OTP)"),
              value: "78.2%",
              change: "-2.1%",
              dir: "down",
            },
          ].map((kpi) => (
            <div className="sta-kpi-card" key={kpi.num}>
              <div className="sta-kpi-info">
                <span className="sta-kpi-label">
                  {kpi.num}) {kpi.label}
                </span>
                <div>
                  <span className="sta-kpi-value">{kpi.value}</span>
                  <span className={`sta-kpi-change ${kpi.dir}`}>
                    {kpi.change}
                  </span>
                </div>
              </div>
              <button className="sta-kpi-menu">&#8943;</button>
            </div>
          ))}
        </div>

        {/* Row: OTP Trends + Passenger Volume */}
        <div className="sta-row">
          <div className="sta-card">
            <div className="sta-card-header">
              <span className="sta-card-title">
                {t(
                  "前5大机场月度准点率趋势",
                  "Monthly OTP Trends by Top 5 Airports",
                )}
              </span>
              <div className="sta-card-actions">
                <button className="sta-card-icon-btn">&#8943;</button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={otpTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                <XAxis
                  dataKey="month"
                  tick={AXIS_TICK}
                  axisLine={{ stroke: GRID_STROKE }}
                  tickLine={false}
                  tickFormatter={tMonth}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={AXIS_TICK}
                  axisLine={{ stroke: GRID_STROKE }}
                  tickLine={false}
                />
                <Tooltip {...darkTooltipStyle} />
                {OTP_KEYS.map((key, i) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={OTP_COLORS[i]}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
            <div className="sta-chart-legend">
              {OTP_KEYS.map((key, i) => (
                <span className="sta-legend-item" key={key}>
                  <span
                    className="sta-legend-line"
                    style={{ background: OTP_COLORS[i] }}
                  />
                  {key} {t("机场", "Airport")}
                </span>
              ))}
            </div>
          </div>

          <div className="sta-card">
            <div className="sta-card-header">
              <span className="sta-card-title">
                {t(
                  "旅客吞吐量 - 主要机场 (百万)",
                  "Passenger Traffic Volume - Leading Airports (M)",
                )}
              </span>
              <div className="sta-card-actions">
                <button className="sta-card-icon-btn">&#8943;</button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={passengerVolumeData}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                <XAxis
                  dataKey="airport"
                  tick={AXIS_TICK}
                  axisLine={{ stroke: GRID_STROKE }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 10]}
                  tick={AXIS_TICK}
                  axisLine={{ stroke: GRID_STROKE }}
                  tickLine={false}
                />
                <Tooltip {...darkTooltipStyle} />
                <Bar dataKey="volume" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Row: Delay Table + Ground Services Pie */}
        <div className="sta-row">
          <div className="sta-card">
            <div className="sta-card-header">
              <span className="sta-card-title">
                {t(
                  "最高延误频率 - 风险机场 (近30天)",
                  "Highest Delay Frequency - Risk Airports (Last 30 Days)",
                )}
              </span>
              <div className="sta-card-actions">
                <button className="sta-card-icon-btn">&#9881;</button>
                <button className="sta-card-icon-btn">&#8943;</button>
              </div>
            </div>
            <table className="sta-table">
              <thead>
                <tr>
                  <th>{t("排名", "Rank")}</th>
                  <th className="sortable">
                    {t("机场代码", "Airport Code")}&nbsp;⇅
                  </th>
                  <th>{t("城市", "City")}</th>
                  <th className="sortable">
                    {t("延误事件数", "Delay Incident Count")}&nbsp;⇅
                  </th>
                  <th className="sortable">
                    {t("平均延误时长", "Avg. Delay Duration")}&nbsp;⇅
                  </th>
                </tr>
              </thead>
              <tbody>
                {delayAirports.map((a) => (
                  <tr key={a.rank}>
                    <td>{a.rank}</td>
                    <td>{a.code}</td>
                    <td>{a.city}</td>
                    <td>{a.count}</td>
                    <td>
                      <span className="sta-risk-dot high" />
                      {t("高风险", "High risk")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="sta-card">
            <div className="sta-card-header">
              <span className="sta-card-title">
                {t(
                  "地面服务效率分布",
                  "Ground Services Efficiency Distribution",
                )}
              </span>
              <div className="sta-card-actions">
                <button className="sta-card-icon-btn">&#8943;</button>
              </div>
            </div>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <ResponsiveContainer width="55%" height={200}>
                <PieChart>
                  <Pie
                    data={groundServiceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    stroke="none"
                  >
                    {groundServiceData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip {...darkTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="sta-pie-legend">
                {groundServiceData.map((item) => (
                  <span className="sta-pie-legend-item" key={item.name}>
                    <span
                      className="sta-legend-dot"
                      style={{ background: item.color }}
                    />
                    {tService(item.name)} {item.value}%
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Row: Performance Matrix + Drill-down */}
        <div className="sta-row">
          <div className="sta-card">
            <div className="sta-card-header">
              <span className="sta-card-title">
                {t("特定机场表现矩阵", "Specific Airport Performance Matrix")}
              </span>
              <div className="sta-card-actions">
                <select className="sta-drill-select">
                  <option>{t("机场", "Airport Airport")}</option>
                </select>
                <button className="sta-card-icon-btn">&#8943;</button>
              </div>
            </div>
            <div className="sta-perf-content">
              <div className="sta-perf-map">
                <MapContainer
                  center={[35, 105]}
                  zoom={3}
                  style={{ width: "100%", height: "100%" }}
                  zoomControl={false}
                  attributionControl={false}
                >
                  <TileLayer
                    url="https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scl=1&style=8&x={x}&y={y}&z={z}"
                    subdomains={["1", "2", "3", "4"]}
                    className="sta-dark-tiles"
                  />
                  <CircleMarker
                    center={[40.08, 116.59]}
                    radius={6}
                    pathOptions={{
                      color: "#3b82f6",
                      fillColor: "#3b82f6",
                      fillOpacity: 0.8,
                      weight: 2,
                    }}
                  >
                    <LTooltip direction="right" className="sta-map-tooltip">
                      ZBAA
                    </LTooltip>
                  </CircleMarker>
                </MapContainer>
              </div>
              <div className="sta-perf-fields">
                <div className="sta-perf-field">
                  <span className="sta-perf-label">
                    {t("机场代码", "Airport Code")}
                  </span>
                  <span className="sta-perf-value">245</span>
                </div>
                <div className="sta-perf-field">
                  <span className="sta-perf-label">
                    {t("航班总数", "Total Flights")}
                  </span>
                  <span className="sta-perf-value">452,105</span>
                </div>
                <div className="sta-perf-field">
                  <span className="sta-perf-label">
                    {t("平均延误", "Average Delay")}
                  </span>
                  <span className="sta-perf-value">18.5 min</span>
                </div>
                <div className="sta-perf-field">
                  <span className="sta-perf-label">
                    {t("准点率", "On-Time Performance")}
                  </span>
                  <span className="sta-perf-value">78.2%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="sta-card">
            <div className="sta-card-header">
              <span className="sta-card-title">
                {t(
                  "详细航班统计 - 下钻",
                  "Detailed Flight Statistics - Drill-down Entry",
                )}
              </span>
              <div className="sta-card-actions">
                <button className="sta-card-icon-btn">&#8943;</button>
              </div>
            </div>
            <div className="sta-drill-header" style={{ marginBottom: 12 }}>
              <select className="sta-drill-select">
                <option>{t("选择机场", "Select Airport")}</option>
              </select>
              <select className="sta-drill-select">
                <option>{t("航班类型", "Flight Type")}</option>
              </select>
              <select className="sta-drill-select">
                <option>{t("日期范围", "Date Range")}</option>
              </select>
              <div className="sta-drill-nav">
                <button className="sta-drill-nav-btn">&lsaquo;</button>
                <button className="sta-drill-nav-btn">&rsaquo;</button>
              </div>
            </div>
            <table className="sta-table">
              <thead>
                <tr>
                  <th className="sortable">
                    {t("航班号", "Flight ID")}&nbsp;⇅
                  </th>
                  <th className="sortable">{t("始发", "Origin")}&nbsp;⇅</th>
                  <th className="sortable">
                    {t("目的地", "Destination")}&nbsp;⇅
                  </th>
                  <th className="sortable">
                    {t("计划时间", "Scheduled Time")}&nbsp;⇅
                  </th>
                  <th className="sortable">
                    {t("实际时间", "Actual Time")}&nbsp;⇅
                  </th>
                  <th className="sortable">
                    {t("延误(分)", "Delay (min)")}&nbsp;⇅
                  </th>
                  <th className="sortable">
                    {t("延误原因", "Delay Reason")}&nbsp;⇅
                  </th>
                  <th className="sortable">{t("状态", "Status")}&nbsp;⇅</th>
                </tr>
              </thead>
              <tbody>
                {drillDownFlights.map((f) => (
                  <tr key={f.id}>
                    <td>{f.id}</td>
                    <td>{f.origin}</td>
                    <td>{f.dest}</td>
                    <td>{f.scheduled}</td>
                    <td>{f.actual}</td>
                    <td>{f.delay}</td>
                    <td>{t("延误原因", "Delay Reason")}</td>
                    <td>{t("在线", "Online")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="sta-footer">
        <span>
          © 2024 ARVIS Systems Inc. |{" "}
          {t("保留所有权利。", "All rights reserved.")}
        </span>
        <span>v. 1.2.3 &nbsp; ● {t("在线", "Online")}</span>
      </div>
    </div>
  );
}
