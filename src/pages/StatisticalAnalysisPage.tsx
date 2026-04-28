/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getFlightAnalytics,
  getPersonnelAnalytics,
  getPlaneAnalytics,
  getAirportAnalytics,
} from "../api/analytics";
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
import { useLanguage } from "../i18n/useLanguage";
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

const NO_DATA_STYLE = {
  textAlign: "center" as const,
  padding: 40,
  color: "#64748b",
};

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
  const [analyticsData, setAnalyticsData] = useState<any>({});
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  useEffect(() => {
    setAnalyticsLoading(true);
    Promise.all([
      getAirportAnalytics().catch(() => null),
      getFlightAnalytics().catch(() => null),
      getPersonnelAnalytics().catch(() => null),
      getPlaneAnalytics().catch(() => null),
    ])
      .then(([airportsRes, flightsRes, personnelRes, planesRes]) => {
        setAnalyticsData({
          airports: airportsRes ?? null,
          flights: flightsRes ?? null,
          personnel: personnelRes ?? null,
          planes: planesRes ?? null,
        });
      })
      .finally(() => setAnalyticsLoading(false));
  }, []);

  const tabLabels: Record<TabKey, string> = {
    "flight-statistics": t("航班统计", "Flight Statistics"),
    "personnel-statistics": t("人员统计", "Personnel Statistics"),
    "airport-statistics": t("机场统计", "Airport Information"),
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
        {analyticsLoading && (
          <div
            style={{
              textAlign: "center",
              padding: "40px 0",
              color: "#94a3b8",
              fontSize: 14,
            }}
          >
            {t("数据加载中...", "Loading data...")}
          </div>
        )}
        {!analyticsLoading && activeTab === "flight-statistics" && (
          <FlightStatisticsTab
            t={t}
            tMonth={tMonth}
            apiData={analyticsData.flights}
          />
        )}
        {!analyticsLoading && activeTab === "personnel-statistics" && (
          <PersonnelStatisticsTab
            t={t}
            tMonth={tMonth}
            apiData={analyticsData.personnel}
          />
        )}
        {!analyticsLoading && activeTab === "airport-statistics" && (
          <AirportStatisticsTab
            t={t}
            tMonth={tMonth}
            tService={tService}
            apiData={analyticsData.airports}
          />
        )}
        {!analyticsLoading && activeTab === "aircraft-statistics" && (
          <AircraftStatisticsTab
            t={t}
            tMonth={tMonth}
            apiData={analyticsData.planes}
          />
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
      {/* <button className="sta-kpi-menu">&#8943;</button> */}
    </div>
  );
}

// ===== Flight Statistics Tab =====

type TFn = (zh: string, en: string) => string;

function FlightStatisticsTab({
  t,
  tMonth,
  apiData,
}: {
  t: TFn;
  tMonth: (m: string) => string;
  apiData?: any;
}) {
  if (!apiData)
    return (
      <div style={NO_DATA_STYLE}>{t("暂无数据", "No data available")}</div>
    );

  const kpi = apiData.kpis ?? {};
  const monthlyData = (apiData.monthlyTrend ?? []).map((d: any) => ({
    month: d.label,
    total: d.total ?? 0,
    highRisk: d.high ?? 0,
  }));
  const rawRiskDist = apiData.riskDistribution ?? {};
  const riskDistData = [
    { name: "高", value: rawRiskDist.high ?? 0, color: "#ef4444" },
    { name: "中", value: rawRiskDist.medium ?? 0, color: "#eab308" },
    { name: "低", value: rawRiskDist.low ?? 0, color: "#22c55e" },
  ];
  const rawStatus = apiData.statusDistribution ?? {};
  const STATUS_COLORS: Record<string, string> = {
    已落地: "#22c55e",
    巡航中: "#3b82f6",
    未起飞: "#64748b",
  };
  const statusData = Object.entries(rawStatus).map(
    ([name, value]: [string, any]) => ({
      name,
      value,
      color: STATUS_COLORS[name] ?? "#64748b",
    }),
  );
  const riskTypeTop5 = apiData.topRiskTypes ?? [];

  return (
    <>
      <div className="sta-kpi-row">
        <KpiCard
          num="1"
          label={t("总航班数", "Total Flights")}
          value={kpi.totalFlights?.toString() ?? "—"}
          change={kpi.totalFlightsChange ?? ""}
          dir={kpi.totalFlightsDir ?? ""}
        />
        <KpiCard
          num="2"
          label={t("高风险航班", "High Risk Flights")}
          value={kpi.highRiskFlights?.toString() ?? "—"}
          change={kpi.highRiskFlightsChange ?? ""}
          dir={kpi.highRiskFlightsDir ?? ""}
        />
        <KpiCard
          num="3"
          label={t("中风险航班", "Medium Risk Flights")}
          value={kpi.mediumRiskFlights?.toString() ?? "—"}
          change={kpi.mediumRiskFlightsChange ?? ""}
          dir={kpi.mediumRiskFlightsDir ?? ""}
        />
        <KpiCard
          num="4"
          label={t("平均风险评分", "Avg Risk Score")}
          value={kpi.avgRiskScore?.toString() ?? "—"}
          change={kpi.avgRiskScoreChange ?? ""}
          dir={kpi.avgRiskScoreDir ?? ""}
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
            <AreaChart data={monthlyData}>
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
                dataKey="total"
                stroke="#3b82f6"
                fill="rgba(59,130,246,0.2)"
                name={t("总航班", "Total")}
              />
              <Area
                type="monotone"
                dataKey="highRisk"
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
                  data={riskDistData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  stroke="none"
                >
                  {riskDistData.map((entry: any, i: number) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip {...darkTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="sta-pie-legend">
              {riskDistData.map((item: any) => (
                <span className="sta-pie-legend-item" key={item.name}>
                  <span
                    className="sta-legend-dot"
                    style={{ background: item.color }}
                  />
                  {item.name === "高"
                    ? t("高风险", "High")
                    : item.name === "中"
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
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  stroke="none"
                >
                  {statusData.map((entry: any, i: number) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip {...darkTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="sta-pie-legend">
              {statusData.map((item: any) => (
                <span className="sta-pie-legend-item" key={item.name}>
                  <span
                    className="sta-legend-dot"
                    style={{ background: item.color }}
                  />
                  {item.name} {item.value.toLocaleString()}
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
            <BarChart data={riskTypeTop5} layout="vertical">
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
  apiData,
}: {
  t: TFn;
  tMonth: (m: string) => string;
  apiData?: any;
}) {
  if (!apiData)
    return (
      <div style={NO_DATA_STYLE}>{t("暂无数据", "No data available")}</div>
    );

  const kpi = apiData.kpis ?? apiData.kpi ?? {};
  const monthlyRisk = (apiData.monthlyTrend ?? []).map((d: any) => ({
    month: d.label,
    total: (d.high ?? 0) + (d.medium ?? 0) + (d.low ?? 0),
    highRisk: d.high ?? 0,
  }));
  const rawRiskDist = apiData.riskDistribution ?? {};
  const riskDistData = [
    { name: "高", value: rawRiskDist.high ?? 0, color: "#ef4444" },
    { name: "中", value: rawRiskDist.medium ?? 0, color: "#eab308" },
    { name: "低", value: rawRiskDist.low ?? 0, color: "#22c55e" },
  ];
  const unitRisk = apiData.byUnit ?? [];
  const factorTop5 = apiData.topHumanFactors ?? [];

  return (
    <>
      <div className="sta-kpi-row">
        <KpiCard
          num="1"
          label={t("飞行员总数", "Total Pilots")}
          value={kpi.totalPilots?.toString() ?? "—"}
          change={kpi.totalPilotsChange ?? ""}
          dir={kpi.totalPilotsDir ?? ""}
        />
        <KpiCard
          num="2"
          label={t("高风险人员", "High Risk Personnel")}
          value={kpi.highRiskPersonnel?.toString() ?? "—"}
          change={kpi.highRiskPersonnelChange ?? ""}
          dir={kpi.highRiskPersonnelDir ?? ""}
        />
        <KpiCard
          num="3"
          label={t("中风险人员", "Medium Risk Personnel")}
          value={kpi.mediumRiskPersonnel?.toString() ?? "—"}
          change={kpi.mediumRiskPersonnelChange ?? ""}
          dir={kpi.mediumRiskPersonnelDir ?? ""}
        />
        <KpiCard
          num="4"
          label={t("培训完成率", "Training Completion Rate")}
          value={
            kpi.trainingCompletionRatePct != null
              ? `${kpi.trainingCompletionRatePct}%`
              : "—"
          }
          change=""
          dir=""
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
            <LineChart data={monthlyRisk}>
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
                dataKey="total"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3 }}
                name={t("总人数", "Total")}
              />
              <Line
                type="monotone"
                dataKey="highRisk"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ r: 3 }}
                name={t("高风险", "High Risk")}
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
                  data={riskDistData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  stroke="none"
                >
                  {riskDistData.map((entry: any, i: number) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip {...darkTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="sta-pie-legend">
              {riskDistData.map((item: any) => (
                <span className="sta-pie-legend-item" key={item.name}>
                  <span
                    className="sta-legend-dot"
                    style={{ background: item.color }}
                  />
                  {item.name === "高"
                    ? t("高风险", "High")
                    : item.name === "中"
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
            <BarChart data={unitRisk}>
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
                dataKey="highRiskCount"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
                name={t("高风险人数", "High Risk Count")}
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
            <BarChart data={factorTop5} layout="vertical">
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
  apiData,
}: {
  t: TFn;
  tMonth: (m: string) => string;
  tService: (n: string) => string;
  apiData?: any;
}) {
  if (!apiData)
    return (
      <div style={NO_DATA_STYLE}>{t("暂无数据", "No data available")}</div>
    );

  const kpi = apiData.kpis ?? apiData.kpi ?? {};
  // 准点率趋势 - punctualityTrend: [{month, rate}]
  // 准点率趋势：取第一个机场的series作为主趋势
  const otpTrendRaw = apiData.topAirportsOnTimeTrend ?? [];
  const otpData =
    otpTrendRaw.length > 0
      ? otpTrendRaw[0].series.map((d: any) => ({
          month: d.label,
          rate: d.value ?? 0,
        }))
      : [];
  const passengerData = (apiData.passengerThroughput ?? []).map((d: any) => ({
    airport: d.airport,
    value: d.valueMillion ?? 0,
  }));
  const delayData = (apiData.delayRanking ?? []).map((d: any) => ({
    rank: d.rank,
    airport: d.code,
    city: d.city,
    delayCount: d.delayCount ?? 0,
    delayMinutes: d.avgDelayMin ?? 0,
  }));
  const GROUND_COLORS = [
    "#3b82f6",
    "#ef4444",
    "#22c55e",
    "#a855f7",
    "#f97316",
    "#eab308",
    "#64748b",
  ];
  const groundData = (apiData.groundServiceEfficiency ?? []).map(
    (d: any, i: number) => ({
      name: d.name,
      value: d.pct ?? 0,
      color: GROUND_COLORS[i % GROUND_COLORS.length],
    }),
  );

  return (
    <>
      <div className="sta-kpi-row">
        <KpiCard
          num="1"
          label={t("国内机场总数", "Total Domestic Airports")}
          value={(kpi.airportTotal ?? kpi.totalAirports)?.toString() ?? "—"}
          change=""
          dir=""
        />
        <KpiCard
          num="2"
          label={t("航班总数", "Total Flights")}
          value={kpi.totalFlights?.toString() ?? "—"}
          change=""
          dir=""
        />
        <KpiCard
          num="3"
          label={t("平均延误", "Average Delay")}
          value={
            kpi.avgDelayMin != null
              ? `${kpi.avgDelayMin}${t("分钟", "min")}`
              : "—"
          }
          change=""
          dir=""
        />
        <KpiCard
          num="4"
          label={t("准点率 (OTP)", "On-Time Performance (OTP)")}
          value={kpi.onTimeRatePct != null ? `${kpi.onTimeRatePct}%` : "—"}
          change=""
          dir=""
        />
      </div>

      <div className="sta-row">
        <div className="sta-card">
          <div className="sta-card-header">
            <span className="sta-card-title">
              {t("月度准点率趋势", "Monthly Punctuality Trend")}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={otpData}>
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
              <Line
                type="monotone"
                dataKey="rate"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3 }}
                name={t("准点率", "Punctuality Rate")}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="sta-card">
          <div className="sta-card-header">
            <span className="sta-card-title">
              {t(
                "旅客吞吐量 - 主要机场",
                "Passenger Traffic Volume - Leading Airports",
              )}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={passengerData}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis
                dataKey="airport"
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
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
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
                <th>{t("延误时长(分钟)", "Delay (min)")}</th>
              </tr>
            </thead>
            <tbody>
              {delayData.map((a: any) => (
                <tr key={a.rank}>
                  <td>{a.rank}</td>
                  <td>{a.airport}</td>
                  <td>{a.delayMinutes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="sta-card">
          <div className="sta-card-header">
            <span className="sta-card-title">
              {t("服务效率分布", "Service Efficiency Distribution")}
            </span>
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <ResponsiveContainer width="55%" height={200}>
              <PieChart>
                <Pie
                  data={groundData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  stroke="none"
                >
                  {groundData.map((entry: any, i: number) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip {...darkTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="sta-pie-legend">
              {groundData.map((item: any) => (
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
    </>
  );
}

// ===== Aircraft Statistics Tab =====

function AircraftStatisticsTab({
  t,
  tMonth,
  apiData,
}: {
  t: TFn;
  tMonth: (m: string) => string;
  apiData?: any;
}) {
  if (!apiData)
    return (
      <div style={NO_DATA_STYLE}>{t("暂无数据", "No data available")}</div>
    );

  const kpi = apiData.kpis ?? {};
  const monthlyRisk = (apiData.monthlyTrend ?? []).map((d: any) => ({
    month: d.label,
    total: (d.high ?? 0) + (d.medium ?? 0) + (d.low ?? 0),
    abnormal: d.high ?? 0,
  }));
  const TYPE_COLORS = [
    "#3b82f6",
    "#22c55e",
    "#a855f7",
    "#f97316",
    "#64748b",
    "#eab308",
    "#ef4444",
  ];
  const rawTypeDist = apiData.modelDistribution ?? [];
  const typeDistData = rawTypeDist.map((d: any, i: number) => ({
    name: d.model,
    value: d.count ?? 0,
    color: TYPE_COLORS[i % TYPE_COLORS.length],
  }));
  const maintData = (apiData.maintenanceTrend ?? []).map((d: any) => ({
    month: d.label,
    scheduled: d.scheduled ?? 0,
    unplanned: d.unplanned ?? 0,
    value: (d.scheduled ?? 0) + (d.unplanned ?? 0),
  }));
  const faultData = apiData.topFailureTypes ?? [];

  return (
    <>
      <div className="sta-kpi-row">
        <KpiCard
          num="1"
          label={t("机队规模", "Fleet Size")}
          value={kpi.fleetSize?.toString() ?? "—"}
          change={kpi.fleetSizeChange ?? ""}
          dir={kpi.fleetSizeDir ?? ""}
        />
        <KpiCard
          num="2"
          label={t("高风险飞机", "High Risk Aircraft")}
          value={
            (kpi.highRiskPlanes ?? kpi.highRiskAircraft)?.toString() ?? "—"
          }
          change=""
          dir=""
        />
        <KpiCard
          num="3"
          label={t("平均机龄", "Avg Aircraft Age")}
          value={
            kpi.avgAgeYears != null ? `${kpi.avgAgeYears}${t("年", "y")}` : "—"
          }
          change=""
          dir=""
        />
        <KpiCard
          num="4"
          label={t("维护完成率", "Maintenance Completion")}
          value={
            kpi.maintenanceCompletionRatePct != null
              ? `${kpi.maintenanceCompletionRatePct}%`
              : "—"
          }
          change=""
          dir=""
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
            <AreaChart data={monthlyRisk}>
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
                dataKey="total"
                stroke="#3b82f6"
                fill="rgba(59,130,246,0.2)"
                name={t("总数", "Total")}
              />
              <Area
                type="monotone"
                dataKey="abnormal"
                stroke="#ef4444"
                fill="rgba(239,68,68,0.3)"
                name={t("异常", "Abnormal")}
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
            <BarChart data={typeDistData}>
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
                dataKey="value"
                radius={[4, 4, 0, 0]}
                name={t("数量", "Count")}
              >
                {typeDistData.map((entry: any, i: number) => (
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
            <BarChart data={maintData}>
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
                dataKey="value"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                name={t("维护事件", "Maintenance Events")}
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
            <BarChart data={faultData} layout="vertical">
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
