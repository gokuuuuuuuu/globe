import { useState } from "react";
import {
  ComposedChart,
  Scatter,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  LineChart,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { useLanguage } from "../i18n/useLanguage";
import "./TrainingDataPage.css";

// ===== Mock Data =====

// Landing Load Performance Analysis
const landingLoadData = Array.from({ length: 20 }, (_, i) => {
  const session = i + 1;
  const base = 1.5 + (Math.random() - 0.5) * 0.8;
  const isOutlier = [4, 9, 15].includes(session);
  const isBorderline = [7, 12, 18].includes(session);
  const value = isOutlier
    ? 2.3 + Math.random() * 0.5
    : isBorderline
      ? 1.95 + Math.random() * 0.15
      : base;
  return {
    session,
    value: parseFloat(value.toFixed(2)),
    mean: 1.5,
    upper: 2.0,
    lower: 1.0,
    bandUpper: 2.0,
    bandLower: 1.0,
    color: isOutlier ? "#ef4444" : isBorderline ? "#eab308" : "#3b82f6",
  };
});

// Training Subject Distribution
const trainingSubjectDataBase = [
  {
    nameZh: "ILS CAT I",
    nameEn: "ILS CAT I",
    takeoff: 12,
    landing: 18,
    emergency: 8,
    systems: 15,
    systemsB: 10,
    approach: 6,
  },
  {
    nameZh: "ILS CAT II",
    nameEn: "ILS CAT II",
    takeoff: 8,
    landing: 22,
    emergency: 5,
    systems: 12,
    systemsB: 7,
    approach: 10,
  },
  {
    nameZh: "VOR/DME",
    nameEn: "VOR/DME",
    takeoff: 15,
    landing: 10,
    emergency: 12,
    systems: 8,
    systemsB: 5,
    approach: 14,
  },
  {
    nameZh: "RNAV",
    nameEn: "RNAV",
    takeoff: 10,
    landing: 14,
    emergency: 6,
    systems: 20,
    systemsB: 12,
    approach: 8,
  },
  {
    nameZh: "目视",
    nameEn: "Visual",
    takeoff: 18,
    landing: 8,
    emergency: 10,
    systems: 6,
    systemsB: 15,
    approach: 5,
  },
  {
    nameZh: "盘旋",
    nameEn: "Circling",
    takeoff: 6,
    landing: 20,
    emergency: 15,
    systems: 10,
    systemsB: 8,
    approach: 12,
  },
  {
    nameZh: "风切变",
    nameEn: "Windshear",
    takeoff: 14,
    landing: 12,
    emergency: 20,
    systems: 5,
    systemsB: 6,
    approach: 10,
  },
  {
    nameZh: "GPWS",
    nameEn: "GPWS",
    takeoff: 5,
    landing: 16,
    emergency: 18,
    systems: 8,
    systemsB: 14,
    approach: 4,
  },
  {
    nameZh: "TCAS",
    nameEn: "TCAS",
    takeoff: 10,
    landing: 6,
    emergency: 22,
    systems: 12,
    systemsB: 8,
    approach: 7,
  },
];

// Training Result Trends
const trainingTrendDataEn = [
  { month: "Jan", score: 82 },
  { month: "Mar", score: 78 },
  { month: "May", score: 85 },
  { month: "Jul", score: 80 },
  { month: "Sep", score: 88 },
  { month: "Nov", score: 86 },
];

const trainingTrendDataZh = [
  { month: "1月", score: 82 },
  { month: "3月", score: 78 },
  { month: "5月", score: 85 },
  { month: "7月", score: 80 },
  { month: "9月", score: 88 },
  { month: "11月", score: 86 },
];

// Abnormal Training Items (Bubble chart)
const bubbleData = [
  {
    id: 1,
    label: "Late Flare",
    cx: 150,
    cy: 100,
    r: 55,
    color: "#ef4444",
    level: "high",
  },
  {
    id: 2,
    label: "Tailstrike Risk",
    cx: 320,
    cy: 140,
    r: 38,
    color: "#eab308",
    level: "medium",
  },
  {
    id: 3,
    label: "Unstable Approach",
    cx: 480,
    cy: 90,
    r: 52,
    color: "#f97316",
    level: "high",
  },
  {
    id: 4,
    label: "High Speed",
    cx: 620,
    cy: 130,
    r: 35,
    color: "#22c55e",
    level: "low",
  },
];

// Simulator Training Records
const simRecords = [
  {
    date: "2026-03-15",
    sessionId: "SIM-2026-0315-A",
    pilot: "Zhang Wei",
    simType: "A320 FFS",
    subjects: "ILS CAT II, Windshear",
    score: 92,
    remarks: "Excellent performance",
    risk: "Low",
  },
  {
    date: "2026-03-12",
    sessionId: "SIM-2026-0312-B",
    pilot: "Li Ming",
    simType: "B737 FFS",
    subjects: "GPWS, TCAS RA",
    score: 74,
    remarks: "Late flare on landing",
    risk: "High",
  },
  {
    date: "2026-03-10",
    sessionId: "SIM-2026-0310-C",
    pilot: "Wang Jun",
    simType: "A320 FFS",
    subjects: "Engine Failure, Circling",
    score: 85,
    remarks: "Good CRM skills",
    risk: "Low",
  },
  {
    date: "2026-03-08",
    sessionId: "SIM-2026-0308-D",
    pilot: "Chen Fei",
    simType: "B737 FFS",
    subjects: "Visual Approach, VOR/DME",
    score: 68,
    remarks: "Unstable approach noted",
    risk: "High",
  },
  {
    date: "2026-03-05",
    sessionId: "SIM-2026-0305-E",
    pilot: "Liu Yang",
    simType: "A330 FFS",
    subjects: "RNAV, ILS CAT I",
    score: 88,
    remarks: "Standard performance",
    risk: "Low",
  },
];

// Line Training Records
const lineRecords = [
  {
    date: "2026-03-20",
    flightId: "CA1234",
    pilot: "Zhang Wei",
    acType: "A320",
    route: "ZBAA-ZSSS",
    instructor: "Captain Li",
    comments: "Smooth landing",
    risk: "Low",
  },
  {
    date: "2026-03-18",
    flightId: "MU5678",
    pilot: "Li Ming",
    acType: "B737",
    route: "ZSPD-ZGGG",
    instructor: "Captain Wang",
    comments: "Approach was high and fast",
    risk: "High",
  },
  {
    date: "2026-03-16",
    flightId: "CZ9012",
    pilot: "Wang Jun",
    acType: "A330",
    route: "ZGGG-ZBAA",
    instructor: "Captain Zhao",
    comments: "Good situational awareness",
    risk: "Low",
  },
  {
    date: "2026-03-14",
    flightId: "HU3456",
    pilot: "Chen Fei",
    acType: "B737",
    route: "ZSSS-ZUUU",
    instructor: "Captain Sun",
    comments: "Late configuration",
    risk: "High",
  },
  {
    date: "2026-03-12",
    flightId: "CA7890",
    pilot: "Liu Yang",
    acType: "A320",
    route: "ZUUU-ZGSZ",
    instructor: "Captain Zhou",
    comments: "Normal operations",
    risk: "Low",
  },
];

// Explanation sidebar data
const explanationSections = [
  {
    id: "landing-flare",
    items: [
      {
        id: "e1",
        iconColor: "red" as const,
        descriptionZh:
          "飞行员持续在拉平操纵时晚于最佳时机，导致接地载荷高于正常水平。在最近8次着陆训练中有5次观察到此模式。",
        descriptionEn:
          "Pilot consistently initiates flare maneuver later than optimal, resulting in higher than normal touchdown loads. This pattern has been observed in 5 of the last 8 landing sessions.",
      },
    ],
  },
  {
    id: "liner-signals",
    items: [
      {
        id: "e2",
        iconColor: "yellow" as const,
        descriptionZh:
          "进近参数在500英尺AGL内超出稳定进近标准。近期航班中发现速度偏差和下滑道偏差。",
        descriptionEn:
          "Approach parameters exceeded stabilized approach criteria within 500ft AGL. Speed deviation and glideslope deviation noted in recent flights.",
      },
      {
        id: "e3",
        iconColor: "red" as const,
        descriptionZh:
          "飞行员在航线运行中持续在拉平操纵时晚于最佳时机，与模拟机训练中的模式相关。",
        descriptionEn:
          "Pilot consistently initiates flare maneuver later than optimal during line operations, correlating with simulator training patterns.",
      },
      {
        id: "e4",
        iconColor: "yellow" as const,
        descriptionZh:
          "多次进近未能在决断门限满足稳定进近标准。影响因素包括构型建立偏晚和高能量状态。",
        descriptionEn:
          "Multiple instances of approach not meeting stabilized criteria at the gate. Contributing factors include late configuration and high energy states.",
      },
    ],
  },
  {
    id: "response-latency",
    items: [],
  },
];

// Custom dot for scatter
const CustomScatterDot = (props: {
  cx?: number;
  cy?: number;
  payload?: { color: string };
}) => {
  const { cx, cy, payload } = props;
  if (!cx || !cy || !payload) return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill={payload.color}
      stroke={payload.color}
      strokeWidth={1}
      opacity={0.85}
    />
  );
};

export function TrainingDataPage() {
  const { t, lang } = useLanguage();
  const trainingTrendData =
    lang === "zh" ? trainingTrendDataZh : trainingTrendDataEn;
  const trainingSubjectData = trainingSubjectDataBase.map((d) => ({
    ...d,
    name: lang === "zh" ? d.nameZh : d.nameEn,
  }));
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    "landing-flare": true,
    "liner-signals": true,
    "response-latency": false,
  });

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const sectionTitles: Record<string, [string, string]> = {
    "landing-flare": [
      "迟缓着陆拉平（高载荷）",
      "Late Landing Flare (High Load)",
    ],
    "liner-signals": ["航线着陆信号", "Liner Landing Signals"],
    "response-latency": ["飞行员响应延迟", "Pilot Response Latency"],
  };

  const itemTitles: Record<string, [string, string]> = {
    e1: ["迟缓着陆拉平（高载荷）", "Late Landing Flare (High Load)"],
    e2: ["不稳定进近", "Unstable Approach"],
    e3: ["迟缓着陆拉平（高载荷）", "Late Landing Flare (High Load)"],
    e4: ["不稳定进近", "Unstable Approach"],
  };

  return (
    <div className="trn-root">
      {/* Breadcrumb */}
      <div className="trn-breadcrumb">
        {t("人员中心", "Personnel Center")}
        <span className="trn-breadcrumb-sep">/</span>
        <span className="trn-breadcrumb-active">
          {t("训练数据", "Training Data")}
        </span>
      </div>

      {/* Summary Cards */}
      <div className="trn-summary-row">
        <div className="trn-summary-card trn-summary-card--green">
          <div className="trn-summary-label">
            {t("P17 飞行员总数", "Total Pilots in P17")}
          </div>
          <div className="trn-summary-value">128</div>
          <div className="trn-summary-sub">
            <span className="trn-summary-up">+4%</span>
            {t("较上月", "vs last month")}
          </div>
        </div>
        <div className="trn-summary-card trn-summary-card--blue">
          <div className="trn-summary-label">
            {t("平均训练得分", "Average Training Score")}
          </div>
          <div className="trn-summary-value">86%</div>
          <div className="trn-summary-sub">
            <span className="trn-summary-good">{t("良好", "Good")}</span>
          </div>
        </div>
        <div className="trn-summary-card trn-summary-card--red">
          <div className="trn-summary-label">
            {t("异常信号", "Abnormal Signals")}
          </div>
          <div className="trn-summary-value">
            <span className="trn-summary-high">18</span>
            <span style={{ fontSize: 14, color: "#94a3b8", marginLeft: 4 }}>
              {t("高", "High")}
            </span>
            <span style={{ fontSize: 14, color: "#64748b", margin: "0 6px" }}>
              /
            </span>
            <span style={{ fontSize: 20, color: "#e2e8f0" }}>42</span>
            <span style={{ fontSize: 14, color: "#94a3b8", marginLeft: 4 }}>
              {t("总计", "Total")}
            </span>
          </div>
        </div>
        <div className="trn-summary-card trn-summary-card--yellow">
          <div className="trn-summary-label">
            {t("当前 P17 风险等级", "Current P17 Risk Level")}
          </div>
          <div className="trn-summary-value">
            <span className="trn-summary-low-risk">{t("低", "Low")}</span>
          </div>
          <div className="trn-progress-bar">
            <div
              className="trn-progress-fill trn-progress-fill--green"
              style={{ width: "72%" }}
            />
          </div>
          <div className="trn-summary-sub">
            72% — {t("绿/黄", "Green/Yellow")}
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="trn-body">
        {/* Left Content */}
        <div className="trn-left">
          {/* 1. Landing Load Performance Analysis */}
          <div className="trn-card">
            <div className="trn-card-header">
              <div className="trn-card-title">
                {t("着陆载荷性能分析", "Landing Load Performance Analysis")}
              </div>
              <div className="trn-card-actions">
                <button className="trn-card-btn" title={t("缩放", "Zoom")}>
                  ⤢
                </button>
                <button className="trn-card-btn" title={t("搜索", "Search")}>
                  🔍
                </button>
                <button
                  className="trn-card-btn trn-card-btn--active"
                  title={t("时间", "Time")}
                >
                  T
                </button>
                <button className="trn-card-btn" title={t("范围", "Range")}>
                  R
                </button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart
                data={landingLoadData}
                margin={{ top: 10, right: 20, bottom: 10, left: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(148,163,184,0.1)"
                />
                <XAxis
                  dataKey="session"
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={{ stroke: "rgba(148,163,184,0.2)" }}
                  label={{
                    value: t("模拟/飞行次数", "Simulated/Flight Sessions"),
                    position: "insideBottom",
                    offset: -5,
                    fill: "#64748b",
                    fontSize: 11,
                  }}
                />
                <YAxis
                  domain={[0.5, 3.0]}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={{ stroke: "rgba(148,163,184,0.2)" }}
                  label={{
                    value: t("着陆载荷 (G)", "Landing Load (G's)"),
                    angle: -90,
                    position: "insideLeft",
                    offset: 10,
                    fill: "#64748b",
                    fontSize: 11,
                  }}
                />
                <Tooltip
                  contentStyle={{
                    background: "#1e293b",
                    border: "1px solid rgba(148,163,184,0.2)",
                    borderRadius: 6,
                    color: "#e2e8f0",
                    fontSize: 12,
                  }}
                />
                <Area
                  dataKey="bandUpper"
                  stroke="none"
                  fill="rgba(59,130,246,0.08)"
                />
                <Area dataKey="bandLower" stroke="none" fill="#0b1120" />
                <ReferenceLine
                  y={2.0}
                  stroke="#60a5fa"
                  strokeDasharray="6 4"
                  strokeWidth={1}
                />
                <ReferenceLine
                  y={1.0}
                  stroke="#60a5fa"
                  strokeDasharray="6 4"
                  strokeWidth={1}
                />
                <Line
                  dataKey="mean"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
                <Scatter dataKey="value" shape={<CustomScatterDot />} />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="trn-chart-legend">
              <span className="trn-legend-item">
                <span
                  className="trn-legend-line"
                  style={{ background: "#3b82f6" }}
                />{" "}
                {t("均值线", "Mean Line")}
              </span>
              <span className="trn-legend-item">
                <span
                  className="trn-legend-line trn-legend-line--dashed"
                  style={{ borderColor: "#60a5fa" }}
                />{" "}
                {t("上1-σ 线", "Upper 1-sigma Line")}
              </span>
              <span className="trn-legend-item">
                <span
                  className="trn-legend-line trn-legend-line--dashed"
                  style={{ borderColor: "#60a5fa" }}
                />{" "}
                {t("下1-σ 线", "Lower 1-sigma Line")}
              </span>
              <span className="trn-legend-item">
                <span
                  style={{
                    width: 16,
                    height: 8,
                    background: "rgba(59,130,246,0.15)",
                    display: "inline-block",
                    borderRadius: 2,
                  }}
                />{" "}
                {t("箱线", "Box Line")}
              </span>
              <span className="trn-legend-item">
                <span
                  className="trn-legend-dot"
                  style={{ background: "#3b82f6" }}
                />{" "}
                {t("个体样本（点）", "Individual Samples (Dots)")}
              </span>
            </div>
          </div>

          {/* 2. Training Subject Distribution */}
          <div className="trn-card">
            <div className="trn-card-header">
              <div className="trn-card-title">
                {t("训练科目分布", "Training Subject Distribution")}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={trainingSubjectData}
                margin={{ top: 10, right: 20, bottom: 10, left: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(148,163,184,0.1)"
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#64748b", fontSize: 10 }}
                  axisLine={{ stroke: "rgba(148,163,184,0.2)" }}
                />
                <YAxis
                  domain={[0, 80]}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={{ stroke: "rgba(148,163,184,0.2)" }}
                />
                <Tooltip
                  contentStyle={{
                    background: "#1e293b",
                    border: "1px solid rgba(148,163,184,0.2)",
                    borderRadius: 6,
                    color: "#e2e8f0",
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
                <Bar
                  dataKey="takeoff"
                  name={t("起飞", "Takeoff")}
                  stackId="a"
                  fill="#3b82f6"
                />
                <Bar
                  dataKey="landing"
                  name={t("着陆", "Landing")}
                  stackId="a"
                  fill="#f97316"
                />
                <Bar
                  dataKey="emergency"
                  name={t("紧急", "Emergency")}
                  stackId="a"
                  fill="#22c55e"
                />
                <Bar
                  dataKey="systems"
                  name={t("系统A", "Systems")}
                  stackId="a"
                  fill="#a855f7"
                />
                <Bar
                  dataKey="systemsB"
                  name={t("系统B", "Systems")}
                  stackId="a"
                  fill="#14b8a6"
                />
                <Bar
                  dataKey="approach"
                  name={t("进近", "Approach")}
                  stackId="a"
                  fill="#64748b"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 3. Training Result Trends */}
          <div className="trn-card">
            <div className="trn-card-header">
              <div className="trn-card-title">
                {t("训练结果趋势", "Training Result Trends")}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart
                data={trainingTrendData}
                margin={{ top: 10, right: 20, bottom: 10, left: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(148,163,184,0.1)"
                />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={{ stroke: "rgba(148,163,184,0.2)" }}
                />
                <YAxis
                  domain={[70, 90]}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={{ stroke: "rgba(148,163,184,0.2)" }}
                />
                <Tooltip
                  contentStyle={{
                    background: "#1e293b",
                    border: "1px solid rgba(148,163,184,0.2)",
                    borderRadius: 6,
                    color: "#e2e8f0",
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
                <Line
                  type="monotone"
                  dataKey="score"
                  name={t("月均分", "Average scores over months")}
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 4. Abnormal Training Items - Bubble Chart */}
          <div className="trn-card">
            <div className="trn-card-header">
              <div className="trn-card-title">
                {t("异常训练项目", "Abnormal Training Items")}
              </div>
            </div>
            <div className="trn-bubble-container">
              <svg className="trn-bubble-svg" viewBox="0 0 760 280">
                {bubbleData.map((b) => (
                  <g key={b.id}>
                    <circle
                      cx={b.cx}
                      cy={b.cy}
                      r={b.r}
                      fill={b.color}
                      opacity={0.25}
                      stroke={b.color}
                      strokeWidth={1.5}
                    />
                    <text className="trn-bubble-label" x={b.cx} y={b.cy - 4}>
                      {t(
                        b.label === "Late Flare"
                          ? "迟缓拉平"
                          : b.label === "Tailstrike Risk"
                            ? "擦机尾风险"
                            : b.label === "Unstable Approach"
                              ? "不稳定进近"
                              : "超速",
                        b.label,
                      )}
                    </text>
                    <text
                      className="trn-bubble-sublabel"
                      x={b.cx}
                      y={b.cy + 12}
                    >
                      {t("风险等级", "Risk Level")}:{" "}
                      {t(
                        b.level === "high"
                          ? "高"
                          : b.level === "medium"
                            ? "中"
                            : "低",
                        b.level === "high"
                          ? "High"
                          : b.level === "medium"
                            ? "Medium"
                            : "Low",
                      )}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
            <div className="trn-chart-legend">
              <span className="trn-legend-item">
                <span
                  className="trn-legend-dot"
                  style={{ background: "#22c55e" }}
                />{" "}
                {t("风险等级 绿", "Risk Level Green")}
              </span>
              <span className="trn-legend-item">
                <span
                  className="trn-legend-dot"
                  style={{ background: "#eab308" }}
                />{" "}
                {t("风险等级 黄", "Risk Level Yellow")}
              </span>
              <span className="trn-legend-item">
                <span
                  className="trn-legend-dot"
                  style={{ background: "#ef4444" }}
                />{" "}
                {t("风险等级 红/橙", "Red/Orange")}
              </span>
            </div>
          </div>

          {/* 5. Simulator Training Records */}
          <div className="trn-card">
            <div className="trn-card-header">
              <div className="trn-card-title">
                {t("模拟机训练记录", "Simulator Training Records")}
              </div>
            </div>
            <div className="trn-table-filters">
              <input
                className="trn-input"
                placeholder={t("搜索...", "Search...")}
                style={{ width: 160 }}
              />
              <select className="trn-select">
                <option>{t("所有飞行员", "All Pilots")}</option>
                <option>Zhang Wei</option>
                <option>Li Ming</option>
                <option>Wang Jun</option>
              </select>
              <input className="trn-input" type="date" style={{ width: 140 }} />
              <span style={{ color: "#64748b" }}>—</span>
              <input className="trn-input" type="date" style={{ width: 140 }} />
              <select className="trn-select">
                <option>{t("所有状态", "All Status")}</option>
                <option>{t("高风险", "High Risk")}</option>
                <option>{t("低风险", "Low Risk")}</option>
              </select>
              <button className="trn-btn-filter" title={t("筛选", "Filter")}>
                ⚙
              </button>
            </div>
            <div className="trn-table-wrapper">
              <table className="trn-table">
                <thead>
                  <tr>
                    <th>{t("日期", "Date")}</th>
                    <th>{t("课次编号", "Session ID")}</th>
                    <th>{t("飞行员", "Pilot")}</th>
                    <th>{t("模拟机类型", "Simulator Type")}</th>
                    <th>{t("训练科目", "Subjects Covered")}</th>
                    <th>{t("总分", "Overall Score")}</th>
                    <th>{t("备注", "Remarks")}</th>
                    <th>{t("风险等级", "Risk Level")}</th>
                    <th>{t("操作", "Actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {simRecords.map((r, i) => (
                    <tr key={i}>
                      <td>{r.date}</td>
                      <td style={{ color: "#60a5fa", fontWeight: 600 }}>
                        {r.sessionId}
                      </td>
                      <td>{r.pilot}</td>
                      <td>{r.simType}</td>
                      <td>
                        {r.subjects === "ILS CAT II, Windshear"
                          ? t("ILS CAT II, 风切变", "ILS CAT II, Windshear")
                          : r.subjects === "GPWS, TCAS RA"
                            ? "GPWS, TCAS RA"
                            : r.subjects === "Engine Failure, Circling"
                              ? t(
                                  "发动机故障, 盘旋",
                                  "Engine Failure, Circling",
                                )
                              : r.subjects === "Visual Approach, VOR/DME"
                                ? t(
                                    "目视进近, VOR/DME",
                                    "Visual Approach, VOR/DME",
                                  )
                                : r.subjects === "RNAV, ILS CAT I"
                                  ? "RNAV, ILS CAT I"
                                  : r.subjects}
                      </td>
                      <td>{r.score}</td>
                      <td style={{ color: "#94a3b8" }}>
                        {r.remarks === "Excellent performance"
                          ? t("表现优秀", "Excellent performance")
                          : r.remarks === "Late flare on landing"
                            ? t("着陆拉平偏晚", "Late flare on landing")
                            : r.remarks === "Good CRM skills"
                              ? t("良好的CRM技能", "Good CRM skills")
                              : r.remarks === "Unstable approach noted"
                                ? t("发现不稳定进近", "Unstable approach noted")
                                : r.remarks === "Standard performance"
                                  ? t("标准表现", "Standard performance")
                                  : r.remarks}
                      </td>
                      <td
                        className={
                          r.risk === "High" ? "trn-risk-high" : "trn-risk-low"
                        }
                      >
                        {t(r.risk === "High" ? "高" : "低", r.risk)}
                      </td>
                      <td>
                        <button className="trn-link">
                          {t("查看详情", "View Details")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 6. Line Training Records */}
          <div className="trn-card">
            <div className="trn-card-header">
              <div className="trn-card-title">
                {t("航线训练记录", "Line Training Records")}
              </div>
            </div>
            <div className="trn-table-top-actions">
              <button className="trn-btn">
                {t("查看关联航班", "View Related Flights")}
              </button>
              <button className="trn-btn trn-btn--primary">
                {t("查看指定航班", "View Specific Flight")}
              </button>
            </div>
            <div className="trn-table-wrapper">
              <table className="trn-table">
                <thead>
                  <tr>
                    <th style={{ width: 36, textAlign: "center" }}>
                      <input type="checkbox" className="trn-checkbox" />
                    </th>
                    <th>{t("日期", "Date")}</th>
                    <th>{t("航班号", "Flight ID")}</th>
                    <th>{t("飞行员", "Pilot")}</th>
                    <th>{t("机型", "Aircraft Type")}</th>
                    <th>{t("航线", "Route")}</th>
                    <th>{t("教员", "Instructor")}</th>
                    <th>{t("评语", "Comments")}</th>
                    <th>{t("风险等级", "Risk Level")}</th>
                    <th>{t("操作", "Actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {lineRecords.map((r, i) => (
                    <tr key={i}>
                      <td style={{ textAlign: "center" }}>
                        <input type="checkbox" className="trn-checkbox" />
                      </td>
                      <td>{r.date}</td>
                      <td style={{ color: "#60a5fa", fontWeight: 600 }}>
                        {r.flightId}
                      </td>
                      <td>{r.pilot}</td>
                      <td>{r.acType}</td>
                      <td>{r.route}</td>
                      <td>
                        {r.instructor === "Captain Li"
                          ? t("李机长", "Captain Li")
                          : r.instructor === "Captain Wang"
                            ? t("王机长", "Captain Wang")
                            : r.instructor === "Captain Zhao"
                              ? t("赵机长", "Captain Zhao")
                              : r.instructor === "Captain Sun"
                                ? t("孙机长", "Captain Sun")
                                : r.instructor === "Captain Zhou"
                                  ? t("周机长", "Captain Zhou")
                                  : r.instructor}
                      </td>
                      <td style={{ color: "#94a3b8" }}>
                        {r.comments === "Smooth landing"
                          ? t("平稳着陆", "Smooth landing")
                          : r.comments === "Approach was high and fast"
                            ? t("进近偏高偏快", "Approach was high and fast")
                            : r.comments === "Good situational awareness"
                              ? t(
                                  "良好的情景意识",
                                  "Good situational awareness",
                                )
                              : r.comments === "Late configuration"
                                ? t("构型建立偏晚", "Late configuration")
                                : r.comments === "Normal operations"
                                  ? t("正常运行", "Normal operations")
                                  : r.comments}
                      </td>
                      <td
                        className={
                          r.risk === "High" ? "trn-risk-high" : "trn-risk-low"
                        }
                      >
                        {t(r.risk === "High" ? "高" : "低", r.risk)}
                      </td>
                      <td>
                        <button className="trn-link">
                          {t("分析", "Analyze")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="trn-right">
          <div className="trn-sidebar-title">
            {t(
              "异常训练信号说明",
              "Explanations for Abnormal Training Signals",
            )}
          </div>

          {explanationSections.map((section) => (
            <div key={section.id} className="trn-explanation-section">
              <div
                className="trn-explanation-header"
                onClick={() => toggleSection(section.id)}
              >
                <span className="trn-explanation-header-text">
                  {t(...sectionTitles[section.id])}
                </span>
                <span
                  className={`trn-explanation-toggle ${expandedSections[section.id] ? "trn-explanation-toggle--open" : ""}`}
                >
                  ▾
                </span>
              </div>
              {expandedSections[section.id] && section.items.length > 0 && (
                <div className="trn-explanation-items">
                  {section.items.map((item) => (
                    <div key={item.id} className="trn-explanation-item">
                      <div className="trn-explanation-item-header">
                        <span
                          className={`trn-explanation-icon trn-explanation-icon--${item.iconColor}`}
                        />
                        <span className="trn-explanation-item-title">
                          {t(...itemTitles[item.id])}
                        </span>
                      </div>
                      <div className="trn-explanation-item-desc">
                        {t(item.descriptionZh, item.descriptionEn)}
                      </div>
                      <div className="trn-explanation-item-footer">
                        <button className="trn-explanation-more">
                          {t("更多", "More")}
                        </button>
                        <div className="trn-explanation-icons">
                          <button
                            className="trn-explanation-icon-btn"
                            title={t("复制", "Copy")}
                          >
                            📋
                          </button>
                          <button
                            className="trn-explanation-icon-btn"
                            title={t("链接", "Link")}
                          >
                            🔗
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
