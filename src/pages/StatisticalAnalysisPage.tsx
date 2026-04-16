import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  AreaChart,
  Area,
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
import { downloadCSV } from "../utils/exportUtils";
import "./StatisticalAnalysisPage.css";

// ===== Shared Styles =====

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

// ===== Airport Statistics Data =====

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

const OTP_COLORS = [
  "#3b82f6",
  "#ef4444",
  "#22c55e",
  "#a855f7",
  "#f97316",
  "#64748b",
];
const OTP_KEYS = ["JKF", "LAX", "ACR", "NDY", "ABR", "ALL"];

// ===== Flight Statistics Data =====

const flightMonthlyData = [
  { month: "Jan", total: 2180, highRisk: 85, mediumRisk: 210, lowRisk: 1885 },
  { month: "Feb", total: 1960, highRisk: 72, mediumRisk: 195, lowRisk: 1693 },
  { month: "Mar", total: 2340, highRisk: 98, mediumRisk: 240, lowRisk: 2002 },
  { month: "Apr", total: 2520, highRisk: 105, mediumRisk: 260, lowRisk: 2155 },
  { month: "May", total: 2680, highRisk: 112, mediumRisk: 275, lowRisk: 2293 },
  { month: "Jun", total: 2450, highRisk: 95, mediumRisk: 250, lowRisk: 2105 },
];

const flightRiskDistData = [
  { name: "High", value: 567, color: "#ef4444" },
  { name: "Medium", value: 1430, color: "#eab308" },
  { name: "Low", value: 12133, color: "#22c55e" },
];

const flightStatusData = [
  { name: "Landed", value: 8920, color: "#22c55e" },
  { name: "Cruising", value: 3210, color: "#3b82f6" },
  { name: "Not Departed", value: 2000, color: "#64748b" },
];

const flightRiskTypeTop5 = [
  { name: "Severe Weather", count: 186 },
  { name: "Pilot Fatigue", count: 142 },
  { name: "Engine Fault", count: 98 },
  { name: "Communication Error", count: 76 },
  { name: "Mechanical Issue", count: 65 },
];

// ===== Personnel Statistics Data =====

const personnelMonthlyRisk = [
  { month: "Jan", highRisk: 12, mediumRisk: 35, total: 480 },
  { month: "Feb", highRisk: 15, mediumRisk: 38, total: 485 },
  { month: "Mar", highRisk: 10, mediumRisk: 32, total: 490 },
  { month: "Apr", highRisk: 18, mediumRisk: 42, total: 492 },
  { month: "May", highRisk: 14, mediumRisk: 36, total: 495 },
  { month: "Jun", highRisk: 16, mediumRisk: 40, total: 498 },
];

const personnelRiskDistData = [
  { name: "High", value: 15, color: "#ef4444" },
  { name: "Medium", value: 35, color: "#eab308" },
  { name: "Low", value: 448, color: "#22c55e" },
];

const personnelUnitRisk = [
  { unit: "East Division", high: 5, medium: 12 },
  { unit: "North Division", high: 4, medium: 8 },
  { unit: "South Division", high: 3, medium: 9 },
  { unit: "West Division", high: 2, medium: 5 },
  { unit: "Central Division", high: 1, medium: 1 },
];

const humanFactorTop5 = [
  { name: "Fatigue", count: 28 },
  { name: "Communication", count: 22 },
  { name: "Task Overload", count: 18 },
  { name: "Procedure Deviation", count: 14 },
  { name: "Stress", count: 11 },
];

// ===== Aircraft Statistics Data =====

const aircraftMonthlyRisk = [
  { month: "Jan", highRisk: 8, mediumRisk: 22, normal: 170 },
  { month: "Feb", highRisk: 6, mediumRisk: 20, normal: 174 },
  { month: "Mar", highRisk: 10, mediumRisk: 25, normal: 165 },
  { month: "Apr", highRisk: 7, mediumRisk: 18, normal: 175 },
  { month: "May", highRisk: 9, mediumRisk: 24, normal: 167 },
  { month: "Jun", highRisk: 11, mediumRisk: 26, normal: 163 },
];

const aircraftTypeDistData = [
  { name: "B737", count: 68, color: "#3b82f6" },
  { name: "A320", count: 52, color: "#22c55e" },
  { name: "B777", count: 35, color: "#a855f7" },
  { name: "A350", count: 28, color: "#f97316" },
  { name: "Other", count: 17, color: "#64748b" },
];

const maintenanceEventData = [
  { month: "Jan", scheduled: 45, unscheduled: 12 },
  { month: "Feb", scheduled: 42, unscheduled: 15 },
  { month: "Mar", scheduled: 50, unscheduled: 18 },
  { month: "Apr", scheduled: 48, unscheduled: 10 },
  { month: "May", scheduled: 55, unscheduled: 14 },
  { month: "Jun", scheduled: 52, unscheduled: 16 },
];

const faultTop5 = [
  { name: "Hydraulic System", count: 32 },
  { name: "Engine Vibration", count: 26 },
  { name: "Avionics Anomaly", count: 19 },
  { name: "Flight Control", count: 15 },
  { name: "Fuel System", count: 11 },
];

// ===== Tabs =====

const TABS = [
  "flight-statistics",
  "personnel-statistics",
  "airport-statistics",
  "aircraft-statistics",
] as const;
type TabKey = (typeof TABS)[number];

// ===== Component =====

export function StatisticalAnalysisPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabKey>("airport-statistics");

  const tabLabels: Record<TabKey, string> = {
    "flight-statistics": t("航班统计", "Flight Statistics"),
    "personnel-statistics": t("人员统计", "Personnel Statistics"),
    "airport-statistics": t("机场统计", "Airport Statistics"),
    "aircraft-statistics": t("飞机统计", "Aircraft Statistics"),
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

  const handleExport = () => {
    if (activeTab === "flight-statistics") {
      const headers = [
        t("月份", "Month"),
        t("总航班", "Total"),
        t("高风险", "High Risk"),
        t("中风险", "Medium Risk"),
        t("低风险", "Low Risk"),
      ];
      const rows = flightMonthlyData.map((d) => [
        tMonth(d.month),
        d.total,
        d.highRisk,
        d.mediumRisk,
        d.lowRisk,
      ]);
      downloadCSV(t("航班统计", "flight_statistics"), headers, rows);
    } else if (activeTab === "personnel-statistics") {
      const headers = [
        t("月份", "Month"),
        t("高风险", "High Risk"),
        t("中风险", "Medium Risk"),
        t("总人数", "Total"),
      ];
      const rows = personnelMonthlyRisk.map((d) => [
        tMonth(d.month),
        d.highRisk,
        d.mediumRisk,
        d.total,
      ]);
      downloadCSV(t("人员统计", "personnel_statistics"), headers, rows);
    } else if (activeTab === "aircraft-statistics") {
      const headers = [
        t("月份", "Month"),
        t("高风险", "High Risk"),
        t("中风险", "Medium Risk"),
        t("正常", "Normal"),
      ];
      const rows = aircraftMonthlyRisk.map((d) => [
        tMonth(d.month),
        d.highRisk,
        d.mediumRisk,
        d.normal,
      ]);
      downloadCSV(t("飞机统计", "aircraft_statistics"), headers, rows);
    } else {
      const headers = [
        t("月份", "Month"),
        "JKF",
        "LAX",
        "ACR",
        "NDY",
        "ABR",
        "ALL",
      ];
      const rows = otpTrendData.map((d) => [
        tMonth(d.month),
        d.JKF,
        d.LAX,
        d.ACR,
        d.NDY,
        d.ABR,
        d.ALL,
      ]);
      downloadCSV(t("机场统计", "airport_statistics"), headers, rows);
    }
  };

  return (
    <div className="sta-root">
      {/* Breadcrumb */}
      <div className="sta-breadcrumb">
        <span style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
          {t("工作台", "Dashboard")}
        </span>
        <span className="sta-breadcrumb-sep">&gt;</span>
        <span
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/statistical-analysis")}
        >
          {t("统计分析", "Statistics")}
        </span>
        <span className="sta-breadcrumb-sep">&gt;</span>
        <span className="sta-breadcrumb-active">{tabLabels[activeTab]}</span>
      </div>

      {/* Header bar */}
      <div className="sta-header-bar">
        <h1 className="sta-page-title">{tabLabels[activeTab]}</h1>
        {/* <button className="sta-filter-btn">
          &#128197;&nbsp;{t("最近30天", "Last 30 Days")}&nbsp;&#9662;
        </button>
        <button className="sta-filter-btn">
          {t("更多筛选", "More Filters")}
        </button> */}
        <div className="sta-header-actions">
          <button className="sta-export-btn" onClick={handleExport}>
            &#128196;&nbsp;{t("导出", "Export")}
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
        {activeTab === "flight-statistics" && (
          <FlightStatisticsTab t={t} tMonth={tMonth} />
        )}
        {activeTab === "personnel-statistics" && (
          <PersonnelStatisticsTab t={t} tMonth={tMonth} />
        )}
        {activeTab === "airport-statistics" && (
          <AirportStatisticsTab t={t} tMonth={tMonth} tService={tService} />
        )}
        {activeTab === "aircraft-statistics" && (
          <AircraftStatisticsTab t={t} tMonth={tMonth} />
        )}
      </div>
    </div>
  );
}

// ===== KPI Card =====

function KpiCard({
  num,
  label,
  value,
  change,
  dir,
}: {
  num: string;
  label: string;
  value: string;
  change: string;
  dir: string;
}) {
  return (
    <div className="sta-kpi-card">
      <div className="sta-kpi-info">
        <span className="sta-kpi-label">
          {num}) {label}
        </span>
        <div>
          <span className="sta-kpi-value">{value}</span>
          <span className={`sta-kpi-change ${dir}`}>{change}</span>
        </div>
      </div>
      <button className="sta-kpi-menu">&#8943;</button>
    </div>
  );
}

// ===== Flight Statistics Tab =====

type TFn = (zh: string, en: string) => string;

function FlightStatisticsTab({
  t,
  tMonth,
}: {
  t: TFn;
  tMonth: (m: string) => string;
}) {
  return (
    <>
      <div className="sta-kpi-row">
        <KpiCard
          num="1"
          label={t("总航班数", "Total Flights")}
          value="14,130"
          change="+2.8%"
          dir="up"
        />
        <KpiCard
          num="2"
          label={t("高风险航班", "High Risk Flights")}
          value="567"
          change="+1.4%"
          dir="up"
        />
        <KpiCard
          num="3"
          label={t("中风险航班", "Medium Risk Flights")}
          value="1,430"
          change="-0.8%"
          dir="down"
        />
        <KpiCard
          num="4"
          label={t("平均风险评分", "Avg Risk Score")}
          value="32.5"
          change="+3.2%"
          dir="up"
        />
      </div>

      {/* Row: Monthly trend + Risk distribution */}
      <div className="sta-row">
        <div className="sta-card">
          <div className="sta-card-header">
            <span className="sta-card-title">
              {t("月度航班量与风险趋势", "Monthly Flight Volume & Risk Trend")}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={flightMonthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis
                dataKey="month"
                tick={AXIS_TICK}
                axisLine={{ stroke: GRID_STROKE }}
                tickLine={false}
                tickFormatter={tMonth}
              />
              <YAxis
                tick={AXIS_TICK}
                axisLine={{ stroke: GRID_STROKE }}
                tickLine={false}
              />
              <Tooltip {...darkTooltipStyle} />
              <Area
                type="monotone"
                dataKey="lowRisk"
                stackId="1"
                stroke="#22c55e"
                fill="rgba(34,197,94,0.3)"
                name={t("低风险", "Low Risk")}
              />
              <Area
                type="monotone"
                dataKey="mediumRisk"
                stackId="1"
                stroke="#eab308"
                fill="rgba(234,179,8,0.3)"
                name={t("中风险", "Medium Risk")}
              />
              <Area
                type="monotone"
                dataKey="highRisk"
                stackId="1"
                stroke="#ef4444"
                fill="rgba(239,68,68,0.3)"
                name={t("高风险", "High Risk")}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="sta-card">
          <div className="sta-card-header">
            <span className="sta-card-title">
              {t("风险等级分布", "Risk Level Distribution")}
            </span>
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <ResponsiveContainer width="55%" height={200}>
              <PieChart>
                <Pie
                  data={flightRiskDistData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  stroke="none"
                >
                  {flightRiskDistData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip {...darkTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="sta-pie-legend">
              {flightRiskDistData.map((item) => (
                <span className="sta-pie-legend-item" key={item.name}>
                  <span
                    className="sta-legend-dot"
                    style={{ background: item.color }}
                  />
                  {item.name === "High"
                    ? t("高风险", "High")
                    : item.name === "Medium"
                      ? t("中风险", "Medium")
                      : t("低风险", "Low")}{" "}
                  {item.value}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row: Status distribution + Risk type TOP5 */}
      <div className="sta-row">
        <div className="sta-card">
          <div className="sta-card-header">
            <span className="sta-card-title">
              {t("航班状态分布", "Flight Status Distribution")}
            </span>
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <ResponsiveContainer width="55%" height={200}>
              <PieChart>
                <Pie
                  data={flightStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  stroke="none"
                >
                  {flightStatusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip {...darkTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="sta-pie-legend">
              {flightStatusData.map((item) => (
                <span className="sta-pie-legend-item" key={item.name}>
                  <span
                    className="sta-legend-dot"
                    style={{ background: item.color }}
                  />
                  {item.name === "Landed"
                    ? t("已落地", "Landed")
                    : item.name === "Cruising"
                      ? t("巡航中", "Cruising")
                      : t("未起飞", "Not Departed")}{" "}
                  {item.value.toLocaleString()}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="sta-card">
          <div className="sta-card-header">
            <span className="sta-card-title">
              {t("风险类型 TOP 5", "Risk Type TOP 5")}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={flightRiskTypeTop5} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis
                type="number"
                tick={AXIS_TICK}
                axisLine={{ stroke: GRID_STROKE }}
                tickLine={false}
              />
              <YAxis
                dataKey="name"
                type="category"
                width={130}
                tick={AXIS_TICK}
                axisLine={{ stroke: GRID_STROKE }}
                tickLine={false}
                tickFormatter={(v: string) => {
                  const map: Record<string, string> = {
                    "Severe Weather": "恶劣天气",
                    "Pilot Fatigue": "飞行员疲劳",
                    "Engine Fault": "发动机故障",
                    "Communication Error": "通信错误",
                    "Mechanical Issue": "机械问题",
                  };
                  return t(map[v] || v, v);
                }}
              />
              <Tooltip {...darkTooltipStyle} />
              <Bar
                dataKey="count"
                fill="#3b82f6"
                radius={[0, 4, 4, 0]}
                name={t("次数", "Count")}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}

// ===== Personnel Statistics Tab =====

function PersonnelStatisticsTab({
  t,
  tMonth,
}: {
  t: TFn;
  tMonth: (m: string) => string;
}) {
  return (
    <>
      <div className="sta-kpi-row">
        <KpiCard
          num="1"
          label={t("飞行员总数", "Total Pilots")}
          value="498"
          change="+1.2%"
          dir="up"
        />
        <KpiCard
          num="2"
          label={t("高风险人员", "High Risk Personnel")}
          value="15"
          change="+2"
          dir="up"
        />
        <KpiCard
          num="3"
          label={t("中风险人员", "Medium Risk Personnel")}
          value="35"
          change="-3"
          dir="down"
        />
        <KpiCard
          num="4"
          label={t("培训完成率", "Training Completion Rate")}
          value="92.4%"
          change="+1.5%"
          dir="up"
        />
      </div>

      {/* Row: Monthly risk trend + Risk distribution */}
      <div className="sta-row">
        <div className="sta-card">
          <div className="sta-card-header">
            <span className="sta-card-title">
              {t("月度人员风险趋势", "Monthly Personnel Risk Trend")}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={personnelMonthlyRisk}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis
                dataKey="month"
                tick={AXIS_TICK}
                axisLine={{ stroke: GRID_STROKE }}
                tickLine={false}
                tickFormatter={tMonth}
              />
              <YAxis
                tick={AXIS_TICK}
                axisLine={{ stroke: GRID_STROKE }}
                tickLine={false}
              />
              <Tooltip {...darkTooltipStyle} />
              <Line
                type="monotone"
                dataKey="highRisk"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ r: 3 }}
                name={t("高风险", "High Risk")}
              />
              <Line
                type="monotone"
                dataKey="mediumRisk"
                stroke="#eab308"
                strokeWidth={2}
                dot={{ r: 3 }}
                name={t("中风险", "Medium Risk")}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="sta-card">
          <div className="sta-card-header">
            <span className="sta-card-title">
              {t("人员风险等级分布", "Personnel Risk Level Distribution")}
            </span>
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <ResponsiveContainer width="55%" height={200}>
              <PieChart>
                <Pie
                  data={personnelRiskDistData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  stroke="none"
                >
                  {personnelRiskDistData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip {...darkTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="sta-pie-legend">
              {personnelRiskDistData.map((item) => (
                <span className="sta-pie-legend-item" key={item.name}>
                  <span
                    className="sta-legend-dot"
                    style={{ background: item.color }}
                  />
                  {item.name === "High"
                    ? t("高风险", "High")
                    : item.name === "Medium"
                      ? t("中风险", "Medium")
                      : t("低风险", "Low")}{" "}
                  {item.value}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row: Unit risk + Human Factor TOP5 */}
      <div className="sta-row">
        <div className="sta-card">
          <div className="sta-card-header">
            <span className="sta-card-title">
              {t("各单位风险人员数", "Risk Personnel by Division")}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={personnelUnitRisk}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis
                dataKey="unit"
                tick={AXIS_TICK}
                axisLine={{ stroke: GRID_STROKE }}
                tickLine={false}
                tickFormatter={(v: string) => {
                  const map: Record<string, string> = {
                    "East Division": "东航",
                    "North Division": "北航",
                    "South Division": "南航",
                    "West Division": "西航",
                    "Central Division": "中航",
                  };
                  return t(map[v] || v, v);
                }}
              />
              <YAxis
                tick={AXIS_TICK}
                axisLine={{ stroke: GRID_STROKE }}
                tickLine={false}
              />
              <Tooltip {...darkTooltipStyle} />
              <Bar
                dataKey="high"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
                name={t("高风险", "High")}
              />
              <Bar
                dataKey="medium"
                fill="#eab308"
                radius={[4, 4, 0, 0]}
                name={t("中风险", "Medium")}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="sta-card">
          <div className="sta-card-header">
            <span className="sta-card-title">
              {t("人为因素 TOP 5", "Human Factor TOP 5")}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={humanFactorTop5} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis
                type="number"
                tick={AXIS_TICK}
                axisLine={{ stroke: GRID_STROKE }}
                tickLine={false}
              />
              <YAxis
                dataKey="name"
                type="category"
                width={130}
                tick={AXIS_TICK}
                axisLine={{ stroke: GRID_STROKE }}
                tickLine={false}
                tickFormatter={(v: string) => {
                  const map: Record<string, string> = {
                    Fatigue: "疲劳",
                    Communication: "通信",
                    "Task Overload": "任务过载",
                    "Procedure Deviation": "程序偏差",
                    Stress: "压力",
                  };
                  return t(map[v] || v, v);
                }}
              />
              <Tooltip {...darkTooltipStyle} />
              <Bar
                dataKey="count"
                fill="#a855f7"
                radius={[0, 4, 4, 0]}
                name={t("次数", "Count")}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}

// ===== Airport Statistics Tab =====

function AirportStatisticsTab({
  t,
  tMonth,
  tService,
}: {
  t: TFn;
  tMonth: (m: string) => string;
  tService: (n: string) => string;
}) {
  return (
    <>
      <div className="sta-kpi-row">
        <KpiCard
          num="1"
          label={t("国内机场总数", "Total Domestic Airports")}
          value="245"
          change="+3.1%"
          dir="up"
        />
        <KpiCard
          num="2"
          label={t("航班总数", "Total Flights")}
          value="452,109"
          change="-1.2%"
          dir="down"
        />
        <KpiCard
          num="3"
          label={t("平均延误", "Average Delay")}
          value="18.5 min"
          change="+5.4%"
          dir="up"
        />
        <KpiCard
          num="4"
          label={t("准点率 (OTP)", "On-Time Performance (OTP)")}
          value="78.2%"
          change="-2.1%"
          dir="down"
        />
      </div>

      <div className="sta-row">
        <div className="sta-card">
          <div className="sta-card-header">
            <span className="sta-card-title">
              {t(
                "前5大机场月度准点率趋势",
                "Monthly OTP Trends by Top 5 Airports",
              )}
            </span>
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

      <div className="sta-row">
        <div className="sta-card">
          <div className="sta-card-header">
            <span className="sta-card-title">
              {t(
                "最高延误频率 - 风险机场 (近30天)",
                "Highest Delay Frequency - Risk Airports (Last 30 Days)",
              )}
            </span>
          </div>
          <table className="sta-table">
            <thead>
              <tr>
                <th>{t("排名", "Rank")}</th>
                <th>{t("机场代码", "Airport Code")}</th>
                <th>{t("城市", "City")}</th>
                <th>{t("延误事件数", "Delay Incident Count")}</th>
                <th>{t("平均延误时长", "Avg. Delay Duration")}</th>
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
              {t("地面服务效率分布", "Ground Services Efficiency Distribution")}
            </span>
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

      <div className="sta-row">
        <div className="sta-card">
          <div className="sta-card-header">
            <span className="sta-card-title">
              {t("特定机场表现矩阵", "Specific Airport Performance Matrix")}
            </span>
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
                <span className="sta-perf-value">ZBAA</span>
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
          </div>
          <table className="sta-table">
            <thead>
              <tr>
                <th>{t("航班号", "Flight ID")}</th>
                <th>{t("始发", "Origin")}</th>
                <th>{t("目的地", "Destination")}</th>
                <th>{t("计划时间", "Scheduled Time")}</th>
                <th>{t("实际时间", "Actual Time")}</th>
                <th>{t("延误(分)", "Delay (min)")}</th>
                <th>{t("延误原因", "Delay Reason")}</th>
                <th>{t("状态", "Status")}</th>
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
                  <td>{t("天气延误", "Weather Delay")}</td>
                  <td>{t("在线", "Online")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ===== Aircraft Statistics Tab =====

function AircraftStatisticsTab({
  t,
  tMonth,
}: {
  t: TFn;
  tMonth: (m: string) => string;
}) {
  return (
    <>
      <div className="sta-kpi-row">
        <KpiCard
          num="1"
          label={t("机队规模", "Fleet Size")}
          value="200"
          change="+2"
          dir="up"
        />
        <KpiCard
          num="2"
          label={t("高风险飞机", "High Risk Aircraft")}
          value="11"
          change="+3"
          dir="up"
        />
        <KpiCard
          num="3"
          label={t("平均机龄", "Avg Aircraft Age")}
          value="8.6 yr"
          change="+0.2"
          dir="up"
        />
        <KpiCard
          num="4"
          label={t("维护完成率", "Maintenance Completion")}
          value="96.8%"
          change="+0.5%"
          dir="up"
        />
      </div>

      {/* Row: Monthly trend + Type distribution */}
      <div className="sta-row">
        <div className="sta-card">
          <div className="sta-card-header">
            <span className="sta-card-title">
              {t("月度飞机风险趋势", "Monthly Aircraft Risk Trend")}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={aircraftMonthlyRisk}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis
                dataKey="month"
                tick={AXIS_TICK}
                axisLine={{ stroke: GRID_STROKE }}
                tickLine={false}
                tickFormatter={tMonth}
              />
              <YAxis
                tick={AXIS_TICK}
                axisLine={{ stroke: GRID_STROKE }}
                tickLine={false}
              />
              <Tooltip {...darkTooltipStyle} />
              <Area
                type="monotone"
                dataKey="normal"
                stackId="1"
                stroke="#22c55e"
                fill="rgba(34,197,94,0.2)"
                name={t("正常", "Normal")}
              />
              <Area
                type="monotone"
                dataKey="mediumRisk"
                stackId="1"
                stroke="#eab308"
                fill="rgba(234,179,8,0.3)"
                name={t("中风险", "Medium Risk")}
              />
              <Area
                type="monotone"
                dataKey="highRisk"
                stackId="1"
                stroke="#ef4444"
                fill="rgba(239,68,68,0.3)"
                name={t("高风险", "High Risk")}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="sta-card">
          <div className="sta-card-header">
            <span className="sta-card-title">
              {t("机型分布", "Aircraft Type Distribution")}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={aircraftTypeDistData}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis
                dataKey="name"
                tick={AXIS_TICK}
                axisLine={{ stroke: GRID_STROKE }}
                tickLine={false}
              />
              <YAxis
                tick={AXIS_TICK}
                axisLine={{ stroke: GRID_STROKE }}
                tickLine={false}
              />
              <Tooltip {...darkTooltipStyle} />
              <Bar
                dataKey="count"
                radius={[4, 4, 0, 0]}
                name={t("数量", "Count")}
              >
                {aircraftTypeDistData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row: Maintenance events + Fault TOP5 */}
      <div className="sta-row">
        <div className="sta-card">
          <div className="sta-card-header">
            <span className="sta-card-title">
              {t("维护事件趋势", "Maintenance Event Trend")}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={maintenanceEventData}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis
                dataKey="month"
                tick={AXIS_TICK}
                axisLine={{ stroke: GRID_STROKE }}
                tickLine={false}
                tickFormatter={tMonth}
              />
              <YAxis
                tick={AXIS_TICK}
                axisLine={{ stroke: GRID_STROKE }}
                tickLine={false}
              />
              <Tooltip {...darkTooltipStyle} />
              <Bar
                dataKey="scheduled"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                name={t("计划维护", "Scheduled")}
              />
              <Bar
                dataKey="unscheduled"
                fill="#f97316"
                radius={[4, 4, 0, 0]}
                name={t("非计划维护", "Unscheduled")}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="sta-card">
          <div className="sta-card-header">
            <span className="sta-card-title">
              {t("关键故障类型 TOP 5", "Key Fault Type TOP 5")}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={faultTop5} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis
                type="number"
                tick={AXIS_TICK}
                axisLine={{ stroke: GRID_STROKE }}
                tickLine={false}
              />
              <YAxis
                dataKey="name"
                type="category"
                width={130}
                tick={AXIS_TICK}
                axisLine={{ stroke: GRID_STROKE }}
                tickLine={false}
                tickFormatter={(v: string) => {
                  const map: Record<string, string> = {
                    "Hydraulic System": "液压系统",
                    "Engine Vibration": "发动机振动",
                    "Avionics Anomaly": "航电异常",
                    "Flight Control": "飞控系统",
                    "Fuel System": "燃油系统",
                  };
                  return t(map[v] || v, v);
                }}
              />
              <Tooltip {...darkTooltipStyle} />
              <Bar
                dataKey="count"
                fill="#ef4444"
                radius={[0, 4, 4, 0]}
                name={t("次数", "Count")}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}
