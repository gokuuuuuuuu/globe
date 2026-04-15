import { useNavigate, useSearchParams } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useLanguage } from "../i18n/useLanguage";
import "./AircraftDetailPage.css";

// ===== Mock Data =====

const aircraftInfo = {
  tailNumber: "N12345",
  aircraftType: "Boeing 737-800",
  aircraftAge: 12.5,
};

const factorScore = {
  score: 78,
  riskLevel: "High" as const,
  factors: [
    { name: "Hydraulic Pressure", range: "45-57%", color: "#f97316" },
    { name: "Flight Control Inputs", range: "30-33%", color: "#eab308" },
    { name: "Fuel System Efficiency", range: "5-15%", color: "#22c55e" },
    { name: "Avionics Anomalies", range: "10-40%", color: "#ef4444" },
  ],
};

const topFactors = [
  { name: "Engine Vibrations", pct: 50, color: "#ef4444" },
  { name: "Hydraulic Pressure", pct: 42, color: "#f97316" },
  { name: "Flight Control Inputs", pct: 27, color: "#eab308" },
  { name: "Fuel System Efficiency", pct: 13, color: "#22c55e" },
  { name: "Avionics Anomalies", pct: 10, color: "#22c55e" },
];

const relatedFlights = {
  total: 12,
  high: 2,
  medium: 5,
  low: 5,
};

const trendData = [
  { month: "Jan", high: 1, medium: 3, low: 2 },
  { month: "Nov", high: 2, medium: 4, low: 3 },
  { month: "Feb", high: 1, medium: 2, low: 4 },
  { month: "May", high: 3, medium: 5, low: 5 },
  { month: "Jun", high: 2, medium: 5, low: 5 },
];

const abnormalSummary = {
  counts: [
    { label: "High", color: "#ef4444", count: 2 },
    { label: "Medium", color: "#f97316", count: 5 },
    { label: "Medium", color: "#eab308", count: 5 },
    { label: "Low", color: "#22c55e", count: 5 },
  ],
  items: [
    {
      text: "Repeated Hydraulic System C warnings (5 instances)",
      count: 5,
      status: "critical",
    },
    {
      text: "Frequent Engine Exhaust Temperature spikes (3 flights)",
      count: 3,
      status: "elevated",
    },
    {
      text: "Flight control sensor deviations (2 reports)",
      count: 2,
      status: "warning",
    },
    {
      text: "Repeated Hydraulic system C warnings stem Engine Exhaust Temperature w spikes",
      count: 1,
      status: "occurred",
    },
  ],
};

// ===== Gauge Component =====

function GaugeSVG({ score }: { score: number }) {
  const cx = 120;
  const cy = 110;
  const r = 90;
  const scoreAngle = Math.PI - (score / 100) * Math.PI;

  // Build arc segments: green -> yellow -> red
  const segments = [
    { start: 0, end: 0.25, color: "#22c55e" },
    { start: 0.25, end: 0.5, color: "#eab308" },
    { start: 0.5, end: 0.75, color: "#f97316" },
    { start: 0.75, end: 1.0, color: "#ef4444" },
  ];

  function arcPath(startFrac: number, endFrac: number, radius: number) {
    const a1 = Math.PI - startFrac * Math.PI;
    const a2 = Math.PI - endFrac * Math.PI;
    const x1 = cx + radius * Math.cos(a1);
    const y1 = cy - radius * Math.sin(a1);
    const x2 = cx + radius * Math.cos(a2);
    const y2 = cy - radius * Math.sin(a2);
    const largeArc = endFrac - startFrac > 0.5 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
  }

  // Needle
  const needleLen = r - 12;
  const nx = cx + needleLen * Math.cos(scoreAngle);
  const ny = cy - needleLen * Math.sin(scoreAngle);

  return (
    <svg
      className="acd-gauge-svg"
      width="240"
      height="140"
      viewBox="0 0 240 140"
    >
      {/* Background track */}
      <path
        d={arcPath(0, 1, r)}
        fill="none"
        stroke="rgba(148,163,184,0.1)"
        strokeWidth="14"
        strokeLinecap="round"
      />
      {/* Colored segments */}
      {segments.map((seg, i) => (
        <path
          key={i}
          d={arcPath(seg.start, seg.end, r)}
          fill="none"
          stroke={seg.color}
          strokeWidth="14"
          strokeLinecap="butt"
          opacity={0.85}
        />
      ))}
      {/* Needle */}
      <line
        x1={cx}
        y1={cy}
        x2={nx}
        y2={ny}
        stroke="#f8fafc"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r="5" fill="#f8fafc" />
      {/* Score text */}
      <text x={cx} y={cy - 20} className="acd-gauge-score">
        {score}
      </text>
      {/* Labels */}
      <text x={cx - r + 5} y={cy + 18} className="acd-gauge-label">
        0
      </text>
      <text x={cx + r - 12} y={cy + 18} className="acd-gauge-label">
        100
      </text>
    </svg>
  );
}

// ===== Icons =====

function AirplaneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
    </svg>
  );
}

function WrenchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

// ===== Dark Tooltip =====

const darkTooltipStyle = {
  contentStyle: {
    background: "rgba(15,23,42,0.95)",
    border: "1px solid rgba(148,163,184,0.2)",
    borderRadius: 6,
    padding: "8px 12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
  },
  labelStyle: { color: "#94a3b8", fontSize: 11 },
  itemStyle: { color: "#e2e8f0", fontSize: 12 },
};

// ===== Main Component =====

export function AircraftDetailPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tailParam = searchParams.get("tail");
  // Use URL param if available, otherwise fall back to mock data
  const displayTailNumber = tailParam || aircraftInfo.tailNumber;

  const riskLevelText =
    factorScore.riskLevel === "High"
      ? t("高风险", "High Risk")
      : factorScore.riskLevel === "Medium"
        ? t("中风险", "Medium Risk")
        : t("低风险", "Low Risk");

  const riskBadgeClass =
    factorScore.riskLevel === "High"
      ? "acd-risk-badge-high"
      : factorScore.riskLevel === "Medium"
        ? "acd-risk-badge-medium"
        : "acd-risk-badge-low";

  return (
    <div className="acd-root">
      {/* Breadcrumb */}
      <div className="acd-breadcrumb">
        <span style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
          {t("工作台", "Dashboard")}
        </span>
        <span className="acd-breadcrumb-sep">&gt;</span>
        <span
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/aircraft-topic/aircraft-list")}
        >
          {t("机", "Aircraft")}
        </span>
        <span className="acd-breadcrumb-sep">&gt;</span>
        <span className="acd-breadcrumb-active">
          {t("飞机详情", "Aircraft Detail")}: {displayTailNumber}
        </span>
      </div>
      <div
        style={{
          padding: "8px 24px 0",
          display: "flex",
          alignItems: "center",
          gap: 12,
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
        <button
          className="acd-action-btn"
          onClick={() =>
            navigate(`/risk-monitoring/flights?aircraft=${displayTailNumber}`)
          }
        >
          <AirplaneIcon />
          {t("查看相关航班", "View Related Flights")}
        </button>
      </div>

      {/* Aircraft Info Card */}
      <div className="acd-info-bar">
        <div className="acd-info-item">
          <div className="acd-info-icon">
            <AirplaneIcon />
          </div>
          <div>
            <div className="acd-info-label">
              {t("机尾号", "Aircraft Tail Number")}
            </div>
            <div className="acd-info-value">{displayTailNumber}</div>
          </div>
        </div>
        <div className="acd-info-item">
          <div className="acd-info-icon">
            <WrenchIcon />
          </div>
          <div>
            <div className="acd-info-label">{t("机型", "Aircraft Type")}</div>
            <div className="acd-info-value">{aircraftInfo.aircraftType}</div>
          </div>
        </div>
        <div className="acd-info-item">
          <div className="acd-info-icon">
            <CalendarIcon />
          </div>
          <div>
            <div className="acd-info-label">{t("机龄", "Aircraft Age")}</div>
            <div className="acd-info-value">
              {aircraftInfo.aircraftAge} {t("年", "Years")}
            </div>
          </div>
        </div>
      </div>

      {/* Row 1 - 3 Cards */}
      <div className="acd-cards-row">
        {/* Card 1: Aircraft Factor Score */}
        <div className="acd-card">
          <div className="acd-card-title">
            {t("飞机因子得分", "AIRCRAFT FACTOR SCORE")}
          </div>
          <div className="acd-gauge-wrapper">
            <GaugeSVG score={factorScore.score} />
            <span className={`acd-risk-badge ${riskBadgeClass}`}>
              {riskLevelText}
            </span>
            <div className="acd-risk-status">
              {t("风险状态", "Risk Status")}: {t("升高", "Elevated")}
            </div>
          </div>
          <div className="acd-factor-ranges">
            {factorScore.factors.map((f, i) => (
              <div className="acd-factor-range-item" key={i}>
                <div className="acd-factor-range-header">
                  <span className="acd-factor-range-name">
                    {f.name === "Hydraulic Pressure"
                      ? t("液压压力", "Hydraulic Pressure")
                      : f.name === "Flight Control Inputs"
                        ? t("飞控输入", "Flight Control Inputs")
                        : f.name === "Fuel System Efficiency"
                          ? t("燃油系统效率", "Fuel System Efficiency")
                          : f.name === "Avionics Anomalies"
                            ? t("航电异常", "Avionics Anomalies")
                            : f.name === "Engine Vibrations"
                              ? t("发动机振动", "Engine Vibrations")
                              : f.name}
                  </span>
                  <span className="acd-factor-range-value">{f.range}</span>
                </div>
                <div
                  className="acd-factor-range-bar"
                  style={{ background: f.color }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Top Aircraft Factors */}
        <div className="acd-card">
          <div className="acd-card-title">
            {t("飞机首要因子", "TOP AIRCRAFT FACTORS")}
          </div>
          <div className="acd-top-factors">
            {topFactors.map((f, i) => (
              <div className="acd-top-factor-item" key={i}>
                <div className="acd-top-factor-header">
                  <span className="acd-top-factor-name">
                    {f.name === "Hydraulic Pressure"
                      ? t("液压压力", "Hydraulic Pressure")
                      : f.name === "Flight Control Inputs"
                        ? t("飞控输入", "Flight Control Inputs")
                        : f.name === "Fuel System Efficiency"
                          ? t("燃油系统效率", "Fuel System Efficiency")
                          : f.name === "Avionics Anomalies"
                            ? t("航电异常", "Avionics Anomalies")
                            : f.name === "Engine Vibrations"
                              ? t("发动机振动", "Engine Vibrations")
                              : f.name}
                  </span>
                  <span className="acd-top-factor-pct">{f.pct}%</span>
                </div>
                <div className="acd-top-factor-bar-bg">
                  <div
                    className="acd-top-factor-bar-fill"
                    style={{ width: `${f.pct}%`, background: f.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: Number of Related High-Risk Flights */}
        <div className="acd-card">
          <div className="acd-card-title">
            {t("相关高风险航班数量", "NUMBER OF RELATED HIGH-RISK FLIGHTS")}
          </div>
          <div className="acd-flights-header">
            <div className="acd-flights-big-number">{relatedFlights.total}</div>
            <div className="acd-flights-breakdown">
              <div className="acd-flights-breakdown-item">
                <span className="acd-dot acd-dot-red" />
                <span style={{ color: "#ef4444" }}>
                  {relatedFlights.high} {t("高", "High")}
                </span>
              </div>
              <div className="acd-flights-breakdown-item">
                <span className="acd-dot acd-dot-yellow" />
                <span style={{ color: "#eab308" }}>
                  {relatedFlights.medium} {t("中", "Medium")}
                </span>
              </div>
              <div className="acd-flights-breakdown-item">
                <span className="acd-dot acd-dot-green" />
                <span style={{ color: "#22c55e" }}>
                  {relatedFlights.low} {t("低", "Low")}
                </span>
              </div>
            </div>
          </div>
          <div className="acd-flights-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid stroke="rgba(148,163,184,0.1)" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={false}
                  tickFormatter={(value: string) => {
                    const monthMap: Record<string, string> = {
                      Jan: t("1月", "Jan"),
                      Feb: t("2月", "Feb"),
                      Mar: t("3月", "Mar"),
                      Apr: t("4月", "Apr"),
                      May: t("5月", "May"),
                      Jun: t("6月", "Jun"),
                      Jul: t("7月", "Jul"),
                      Aug: t("8月", "Aug"),
                      Sep: t("9月", "Sep"),
                      Oct: t("10月", "Oct"),
                      Nov: t("11月", "Nov"),
                      Dec: t("12月", "Dec"),
                    };
                    return monthMap[value] || value;
                  }}
                />
                <YAxis
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={false}
                />
                <Tooltip {...darkTooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="high"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#ef4444" }}
                  name={t("高风险", "High")}
                />
                <Line
                  type="monotone"
                  dataKey="medium"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#f97316" }}
                  name={t("中风险", "Medium")}
                />
                <Line
                  type="monotone"
                  dataKey="low"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#22c55e" }}
                  name={t("低风险", "Low")}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="acd-flights-legend">
            <div className="acd-flights-legend-item">
              <span
                className="acd-legend-dot"
                style={{ background: "#ef4444" }}
              />
              {relatedFlights.high} {t("高", "High")}
            </div>
            <div className="acd-flights-legend-item">
              <span
                className="acd-legend-dot"
                style={{ background: "#f97316" }}
              />
              {t("中", "Medium")}
            </div>
            <div className="acd-flights-legend-item">
              <span
                className="acd-legend-dot"
                style={{ background: "#eab308" }}
              />
              {relatedFlights.low} {t("低", "Low")}
            </div>
            <div className="acd-flights-legend-item">
              <span
                className="acd-legend-dot"
                style={{ background: "#22c55e" }}
              />
              {relatedFlights.low} {t("低", "Low")}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2 - Repeated Abnormal Summary */}
      <div className="acd-cards-row-2">
        {/* Left: Summary counts */}
        <div className="acd-card">
          <div className="acd-card-title">
            {t("重复异常汇总", "REPEATED ABNORMAL SUMMARY")}
          </div>
          <div className="acd-abnormal-counts">
            {abnormalSummary.counts.map((c, i) => (
              <div className="acd-abnormal-count-item" key={i}>
                <span className="acd-dot" style={{ background: c.color }} />
                <span>
                  {c.label === "High"
                    ? t("高", "High")
                    : c.label === "Medium"
                      ? t("中", "Medium")
                      : c.label === "Low"
                        ? t("低", "Low")
                        : c.label === "Critical"
                          ? t("严重", "Critical")
                          : c.label}
                </span>
                <span className="acd-abnormal-count-value">{c.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Abnormal items list */}
        <div className="acd-card">
          <div className="acd-card-title">
            {t("异常事项列表", "ABNORMAL ITEMS")}
          </div>
          <div className="acd-abnormal-list">
            {abnormalSummary.items.map((item, i) => (
              <div className="acd-abnormal-item" key={i}>
                <span className="acd-abnormal-item-text">
                  {item.text ===
                  "Repeated Hydraulic System C warnings (5 instances)"
                    ? t(
                        "液压系统C重复警告（5次）",
                        "Repeated Hydraulic System C warnings (5 instances)",
                      )
                    : item.text ===
                        "Frequent Engine Exhaust Temperature spikes (3 flights)"
                      ? t(
                          "发动机排气温度频繁飙升（3个航班）",
                          "Frequent Engine Exhaust Temperature spikes (3 flights)",
                        )
                      : item.text ===
                          "Flight control sensor deviations (2 reports)"
                        ? t(
                            "飞控传感器偏差（2份报告）",
                            "Flight control sensor deviations (2 reports)",
                          )
                        : item.text ===
                            "Repeated Hydraulic system C warnings stem Engine Exhaust Temperature w spikes"
                          ? t(
                              "液压系统C重复警告引起发动机排气温度飙升",
                              "Repeated Hydraulic system C warnings stem Engine Exhaust Temperature w spikes",
                            )
                          : item.text}
                </span>
                <span className="acd-abnormal-item-count">{item.count}</span>
                <span className={`acd-status-badge acd-status-${item.status}`}>
                  {item.status === "critical"
                    ? t("严重", "Critical")
                    : item.status === "elevated"
                      ? t("升高", "Elevated")
                      : item.status === "warning"
                        ? t("警告", "Warning")
                        : t("已发生", "Occurred")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Maintenance Info (merged from MaintenanceInfoPage) */}
      <div className="acd-cards-row-2" style={{ marginTop: 20 }}>
        <div className="acd-card">
          <div className="acd-card-title">
            {t("维修信息", "MAINTENANCE INFO")}
          </div>
          <div style={{ fontSize: 13, color: "#94a3b8" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div>
                <div
                  style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}
                >
                  {t("飞机ID", "Aircraft ID")}
                </div>
                <div style={{ color: "#e2e8f0", fontWeight: 600 }}>N123AR</div>
              </div>
              <div>
                <div
                  style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}
                >
                  {t("机型", "Model")}
                </div>
                <div style={{ color: "#e2e8f0", fontWeight: 600 }}>
                  Challenger 350
                </div>
              </div>
              <div>
                <div
                  style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}
                >
                  {t("当前位置", "Location")}
                </div>
                <div style={{ color: "#e2e8f0", fontWeight: 600 }}>KORD</div>
              </div>
              <div>
                <div
                  style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}
                >
                  {t("总飞行小时", "Total Hours")}
                </div>
                <div style={{ color: "#e2e8f0", fontWeight: 600 }}>1,388</div>
              </div>
              <div>
                <div
                  style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}
                >
                  {t("适航状态", "Status")}
                </div>
                <div style={{ color: "#22c55e", fontWeight: 600 }}>
                  {t("适航", "Serviceable")}
                </div>
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#e2e8f0",
                  marginBottom: 8,
                }}
              >
                {t("当前限制", "Current Restrictions")}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span
                  style={{
                    padding: "2px 8px",
                    background: "rgba(239,68,68,0.15)",
                    color: "#ef4444",
                    borderRadius: 4,
                    fontSize: 11,
                  }}
                >
                  MEL 32-01: Nose Gear Steering
                </span>
                <span
                  style={{
                    padding: "2px 8px",
                    background: "rgba(234,179,8,0.15)",
                    color: "#eab308",
                    borderRadius: 4,
                    fontSize: 11,
                  }}
                >
                  DDM 21-05: Packs
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="acd-card">
          <div className="acd-card-title">
            {t("近期维修事件", "RECENT MAINTENANCE EVENTS")}
          </div>
          <div style={{ fontSize: 13, color: "#94a3b8" }}>
            {[
              {
                date: "2024-03-02",
                type: t("非计划", "Unscheduled"),
                desc: "Rudder Actuator Fault",
                color: "#ef4444",
              },
              {
                date: "2024-03-05",
                type: t("计划", "Scheduled"),
                desc: "Scheduled Check A",
                color: "#22c55e",
              },
              {
                date: "2024-03-08",
                type: t("非计划", "Unscheduled"),
                desc: "Hydraulic Pump Failure",
                color: "#ef4444",
              },
              {
                date: "2024-03-11",
                type: t("计划", "Scheduled"),
                desc: "Component Replacement",
                color: "#22c55e",
              },
              {
                date: "2024-03-14",
                type: t("非计划", "Unscheduled"),
                desc: "Avionics Fault",
                color: "#f97316",
              },
            ].map((evt, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "6px 0",
                  borderBottom: "1px solid rgba(148,163,184,0.08)",
                }}
              >
                <span style={{ fontSize: 11, color: "#64748b", minWidth: 80 }}>
                  {evt.date}
                </span>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: evt.color,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 11, color: evt.color }}>
                  {evt.type}
                </span>
                <span style={{ color: "#e2e8f0" }}>{evt.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
