import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useLanguage } from "../i18n/useLanguage";
import { AIRPORTS } from "../data/flightData";
import "./EnvironmentDetailPage.css";

// ===== Mock Data =====

const overallRisk = {
  score: 68,
  level: "Medium" as const,
  factors: [
    { name: "Air Quality", status: "Moderate", color: "#eab308" },
    { name: "Precipitation", status: "Low", color: "#22c55e" },
    { name: "Extreme Events", status: "None", color: "#22c55e" },
  ],
};

const keyFactors = {
  temperature: 18,
  wind: { speed: 15, direction: "W" },
  visibility: 12,
  humidity: 65,
};

const tempTrendData = [
  { time: "00h", temp: 12 },
  { time: "03h", temp: 10 },
  { time: "06h", temp: 9 },
  { time: "09h", temp: 14 },
  { time: "12h", temp: 20 },
  { time: "15h", temp: 23 },
  { time: "18h", temp: 19 },
  { time: "21h", temp: 15 },
  { time: "24h", temp: 13 },
];

const tempSparkline = [
  { v: 12 },
  { v: 10 },
  { v: 14 },
  { v: 20 },
  { v: 23 },
  { v: 19 },
  { v: 15 },
];

const visSparkline = [
  { v: 10 },
  { v: 11 },
  { v: 12 },
  { v: 11 },
  { v: 13 },
  { v: 12 },
  { v: 12 },
];

const humSparkline = [
  { v: 60 },
  { v: 62 },
  { v: 65 },
  { v: 63 },
  { v: 67 },
  { v: 65 },
  { v: 64 },
];

const hourlyForecast = [
  { time: "04 AM", icon: "🌙", temp: "18°" },
  { time: "06 AM", icon: "🌤", temp: "15°" },
  { time: "08 AM", icon: "☁️", temp: "12°" },
  { time: "10 AM", icon: "⛅", temp: "20°" },
  { time: "12 PM", icon: "🌤", temp: "23°" },
  { time: "01 PM", icon: "☀️", temp: "25°" },
  { time: "02 PM", icon: "☀️", temp: "26°" },
];

const alertsData = [
  {
    level: "yellow" as const,
    alert: "Strong Crosswinds",
    area: "RWY 09",
    timestamp: "2023-10-23 18:08:54",
  },
  {
    level: "yellow" as const,
    alert: "Foggy Conditions",
    area: "Near Northern Taxiway",
    timestamp: "2023-10-23 18:08:28",
  },
  {
    level: "red" as const,
    alert: "Hazardous Icing",
    area: "RWY 27L",
    timestamp: "2023-10-23 18:08:39",
  },
];

const anomaliesData = [
  {
    time: "17:00",
    dotColor: "#eab308",
    tag: "Unusual Wind Gusts Detected",
    tagLevel: "yellow" as const,
    desc: "Unusual Wind Gusts Detected at Northern Taxiway B.",
  },
  {
    time: "17:00",
    dotColor: "#eab308",
    tag: "Sudden Drop in Pressure",
    tagLevel: "yellow" as const,
    desc: "Sudden drop in Pressure is near Northern Taxiway.",
  },
  {
    time: "18:00",
    dotColor: "#dc2626",
    tag: "Lightning Strike Near Sector D",
    tagLevel: "red" as const,
    desc: "Lightning Strike Near Sector D Instant.",
  },
];

const visibilityTrend = [
  { day: "7 day", val: 45 },
  { day: "Mon", val: 55 },
  { day: "Tue", val: 30 },
  { day: "Wed", val: 65 },
  { day: "Thu", val: 50 },
  { day: "Fri", val: 72 },
  { day: "7 day", val: 60 },
];

const windPatternData = [
  { day: "7 day", val: 12 },
  { day: "Mon", val: 18 },
  { day: "Tue", val: 22 },
  { day: "Wed", val: 15 },
  { day: "Thu", val: 25 },
  { day: "Fri", val: 20 },
  { day: "7 day", val: 16 },
];

// ===== Gauge Component =====

function GaugeSVG({ score }: { score: number }) {
  // Layout: wider viewBox, center hub well above bottom
  const W = 240;
  const H = 150;
  const cx = W / 2;
  const cy = H - 20; // center of arc, near bottom with space for labels
  const R = 95; // main arc radius

  const scoreAngle = Math.PI - (score / 100) * Math.PI;

  // Smooth gradient: 8 segments
  const segments = [
    { start: 0, end: 0.125, color: "#22c55e" },
    { start: 0.125, end: 0.25, color: "#4ade80" },
    { start: 0.25, end: 0.375, color: "#a3e635" },
    { start: 0.375, end: 0.5, color: "#eab308" },
    { start: 0.5, end: 0.625, color: "#f59e0b" },
    { start: 0.625, end: 0.75, color: "#f97316" },
    { start: 0.75, end: 0.875, color: "#ef4444" },
    { start: 0.875, end: 1.0, color: "#dc2626" },
  ];

  function arc(startFrac: number, endFrac: number, radius: number) {
    const a1 = Math.PI - startFrac * Math.PI;
    const a2 = Math.PI - endFrac * Math.PI;
    const x1 = cx + radius * Math.cos(a1);
    const y1 = cy - radius * Math.sin(a1);
    const x2 = cx + radius * Math.cos(a2);
    const y2 = cy - radius * Math.sin(a2);
    const large = endFrac - startFrac > 0.5 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`;
  }

  // Needle tip
  const needleR = R - 18;
  const nx = cx + needleR * Math.cos(scoreAngle);
  const ny = cy - needleR * Math.sin(scoreAngle);
  // Needle base (two side points for triangle)
  const baseW = 5;
  const perp = scoreAngle + Math.PI / 2;
  const bx1 = cx + baseW * Math.cos(perp);
  const by1 = cy - baseW * Math.sin(perp);
  const bx2 = cx - baseW * Math.cos(perp);
  const by2 = cy + baseW * Math.sin(perp);

  const scoreColor =
    score <= 30
      ? "#22c55e"
      : score <= 50
        ? "#eab308"
        : score <= 70
          ? "#f97316"
          : "#ef4444";

  return (
    <svg
      className="env-gauge-svg"
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
    >
      <defs>
        <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="needleDrop">
          <feDropShadow
            dx="0"
            dy="1"
            stdDeviation="2"
            floodColor="#000"
            floodOpacity="0.4"
          />
        </filter>
      </defs>

      {/* Background track */}
      {/* <path
        d={arc(0, 1, R)}
        fill="none"
        stroke="rgba(148,163,184,0.08)"
        strokeWidth="20"
        strokeLinecap="round"
      /> */}

      {/* Colored arc with glow */}
      <g filter="url(#gaugeGlow)">
        {segments.map((s, i) => (
          <path
            key={i}
            d={arc(s.start, s.end, R)}
            fill="none"
            stroke={s.color}
            strokeWidth="18"
            strokeLinecap="butt"
            opacity={0.9}
          />
        ))}
      </g>

      {/* Thin inner arc up to current score */}
      {/* <path
        d={arc(0, score / 100, R - 16)}
        fill="none"
        stroke={scoreColor}
        strokeWidth="3"
        strokeLinecap="round"
        opacity={0.5}
      /> */}

      {/* Small tick marks */}
      {Array.from({ length: 11 }, (_, i) => {
        const frac = i / 10;
        const a = Math.PI - frac * Math.PI;
        const isMajor = i % 5 === 0;
        const r1 = R + 2;
        const r2 = R + (isMajor ? 8 : 5);
        return (
          <line
            key={i}
            x1={cx + r1 * Math.cos(a)}
            y1={cy - r1 * Math.sin(a)}
            x2={cx + r2 * Math.cos(a)}
            y2={cy - r2 * Math.sin(a)}
            stroke={
              isMajor ? "rgba(148,163,184,0.4)" : "rgba(148,163,184,0.15)"
            }
            strokeWidth={isMajor ? 1.5 : 0.8}
          />
        );
      })}

      {/* Needle triangle */}
      <g filter="url(#needleDrop)">
        <polygon
          points={`${nx},${ny} ${bx1},${by1} ${bx2},${by2}`}
          fill={scoreColor}
        />
      </g>

      {/* Center hub */}
      <circle
        cx={cx}
        cy={cy}
        r="7"
        fill="#0f172a"
        stroke={scoreColor}
        strokeWidth="2"
      />
      <circle cx={cx} cy={cy} r="2.5" fill={scoreColor} />

      {/* Score text - centered above hub */}
      <text x={cx} y={cy - 30} className="env-gauge-score">
        {score}
      </text>
      <text x={cx + 24} y={cy - 24} className="env-gauge-score-sub">
        /100
      </text>

      {/* 0 and 100 labels at ends */}
      <text x={cx - R + 4} y={cy + 16} className="env-gauge-label">
        0
      </text>
      <text x={cx + R - 12} y={cy + 16} className="env-gauge-label">
        100
      </text>
    </svg>
  );
}

// ===== Sparkline Component =====

function Sparkline({
  data,
  color,
  width = 80,
  height = 28,
}: {
  data: { v: number }[];
  color: string;
  width?: number;
  height?: number;
}) {
  if (data.length < 2) return null;
  const vals = data.map((d) => d.v);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((d.v - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      className="env-kf-sparkline"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.7}
      />
    </svg>
  );
}

// ===== Dark Tooltip Style =====

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

// ===== Custom Wind Tooltip =====

function WindTooltip({
  active,
  payload,
  t,
}: {
  active: boolean;
  payload: { day: string; value: number }[];
  t: (zh: string, en: string) => string;
}) {
  if (active && payload && payload.length) {
    return (
      <div className="env-tooltip-box">
        <div>
          {payload[0].day}: {payload[0].value} km/h
        </div>
        <div style={{ marginTop: 4, color: "#94a3b8" }}>
          {t(
            "预测运营影响窗口 08:00-12:00: 正常",
            "Predicts operational impact windows 08:00-12:00: Normal",
          )}
        </div>
      </div>
    );
  }
  return null;
}

// ===== Main Component =====

// Phase-specific environment data
const phaseEnvData = {
  takeoff: {
    location: "ZSPD (上海浦东)",
    temperature: 22,
    wind: { speed: 12, direction: "SE" },
    visibility: 8,
    humidity: 72,
    risk: { score: 45, level: "Medium" as const },
    alerts: [
      {
        level: "yellow" as const,
        alert: "侧风提醒",
        area: "RWY 16R",
        timestamp: "2024-06-15 08:30",
      },
      {
        level: "green" as const,
        alert: "能见度良好",
        area: "全场",
        timestamp: "2024-06-15 08:00",
      },
    ],
  },
  landing: {
    location: "ZBAA (北京首都)",
    temperature: 18,
    wind: { speed: 22, direction: "NW" },
    visibility: 3,
    humidity: 85,
    risk: { score: 78, level: "High" as const },
    alerts: [
      {
        level: "red" as const,
        alert: "雷暴警告",
        area: "进近区域",
        timestamp: "2024-06-15 14:15",
      },
      {
        level: "yellow" as const,
        alert: "低能见度",
        area: "RWY 01",
        timestamp: "2024-06-15 14:00",
      },
      {
        level: "yellow" as const,
        alert: "阵风提醒",
        area: "RWY 36R",
        timestamp: "2024-06-15 13:45",
      },
    ],
  },
};

export function EnvironmentDetailPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const codeParam = searchParams.get("code");
  const [selectedAirportCode, setSelectedAirportCode] = useState<string | null>(
    codeParam,
  );
  const [envPhase] = useState<"takeoff" | "landing">("takeoff");
  const [envSearch, setEnvSearch] = useState("");
  const [envRiskFilter, setEnvRiskFilter] = useState<
    "all" | "red" | "yellow" | "green"
  >("all");

  const pillClass = (level: string) =>
    level === "red"
      ? "env-pill env-pill-red"
      : level === "yellow"
        ? "env-pill env-pill-yellow"
        : "env-pill env-pill-green";

  const levelLabel = (level: string) =>
    level === "red"
      ? t("高", "High")
      : level === "yellow"
        ? t("中", "Medium")
        : t("低", "Low");

  const dayMap: Record<string, string> = {
    Mon: "周一",
    Tue: "周二",
    Wed: "周三",
    Thu: "周四",
    Fri: "周五",
    Sat: "周六",
    Sun: "周日",
    "7 day": "7天",
  };

  const translateDay = (day: string) => t(dayMap[day] || day, day);

  return (
    <div className="env-root">
      {/* Breadcrumb */}
      <div className="env-breadcrumb">
        <span style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
          {t("工作台", "Dashboard")}
        </span>
        <span className="env-breadcrumb-sep">&gt;</span>
        {selectedAirportCode ? (
          <>
            <span
              style={{ cursor: "pointer" }}
              onClick={() => {
                if (codeParam) {
                  navigate("/environment-topic/environment-detail", {
                    replace: true,
                  });
                } else {
                  setSelectedAirportCode(null);
                }
              }}
            >
              {t("环", "Environment")}
            </span>
            <span className="env-breadcrumb-sep">&gt;</span>
            <span className="env-breadcrumb-active">
              {AIRPORTS.find((a) => a.code === selectedAirportCode)?.code4 ||
                selectedAirportCode}
            </span>
          </>
        ) : (
          <span className="env-breadcrumb-active">
            {t("环", "Environment")}
          </span>
        )}
      </div>

      {/* Airport List or Detail */}
      {!selectedAirportCode ? (
        <div className="env-airport-list">
          <div className="env-airport-list-header">
            <h2 className="env-airport-list-title">
              {t("机场环境总览", "Airport Environment Overview")}
            </h2>
            <span className="env-airport-list-count">
              {AIRPORTS.length} {t("个机场", "airports")}
            </span>
          </div>
          {/* Filters */}
          <div className="env-airport-filters">
            <input
              className="env-airport-search"
              placeholder={t(
                "搜索机场名称或代码...",
                "Search airport name or code...",
              )}
              value={envSearch}
              onChange={(e) => setEnvSearch(e.target.value)}
            />
            <div className="env-airport-risk-btns">
              {(["all", "red", "yellow", "green"] as const).map((level) => (
                <button
                  key={level}
                  className={`env-airport-risk-btn ${envRiskFilter === level ? "active" : ""} ${level !== "all" ? level : ""}`}
                  onClick={() => setEnvRiskFilter(level)}
                >
                  {level === "all"
                    ? t("全部", "All")
                    : level === "red"
                      ? t("高风险", "High")
                      : level === "yellow"
                        ? t("中风险", "Medium")
                        : t("低风险", "Low")}
                </button>
              ))}
            </div>
          </div>
          <div className="env-airport-grid">
            {[...AIRPORTS]
              .filter((a) => {
                const q = envSearch.toLowerCase();
                if (
                  q &&
                  !a.nameZh.toLowerCase().includes(q) &&
                  !a.name.toLowerCase().includes(q) &&
                  !a.code.toLowerCase().includes(q) &&
                  !a.code4.toLowerCase().includes(q)
                )
                  return false;
                if (envRiskFilter === "red") return a.environmentRisk >= 7;
                if (envRiskFilter === "yellow")
                  return a.environmentRisk >= 5 && a.environmentRisk < 7;
                if (envRiskFilter === "green") return a.environmentRisk < 5;
                return true;
              })
              .sort((a, b) => b.environmentRisk - a.environmentRisk)
              .map((airport) => {
                const riskZone =
                  airport.environmentRisk >= 7
                    ? "red"
                    : airport.environmentRisk >= 5
                      ? "yellow"
                      : "green";
                const riskColor =
                  riskZone === "red"
                    ? "#ef4444"
                    : riskZone === "yellow"
                      ? "#eab308"
                      : "#22c55e";
                return (
                  <div
                    key={airport.id}
                    className="env-airport-card"
                    onClick={() => setSelectedAirportCode(airport.code)}
                  >
                    <div className="env-airport-card-top">
                      <div className="env-airport-card-code">
                        {airport.code4}
                      </div>
                      <span className={pillClass(riskZone)}>
                        {riskZone === "red"
                          ? t("高风险", "High")
                          : riskZone === "yellow"
                            ? t("中风险", "Medium")
                            : t("低风险", "Low")}
                      </span>
                    </div>
                    <div className="env-airport-card-name">
                      {airport.nameZh || airport.name}
                    </div>
                    <div className="env-airport-card-meta">
                      <span>{airport.countryCode}</span>
                      <span>
                        {airport.flightCount} {t("航班", "flights")}
                      </span>
                      <span>
                        {airport.operatorCount} {t("人员", "staff")}
                      </span>
                    </div>
                    <div className="env-airport-card-risk">
                      <div className="env-airport-card-risk-bar">
                        <div
                          className="env-airport-card-risk-fill"
                          style={{
                            width: `${airport.environmentRisk * 10}%`,
                            background: riskColor,
                          }}
                        />
                      </div>
                      <span
                        className="env-airport-card-risk-score"
                        style={{ color: riskColor }}
                      >
                        {airport.environmentRisk.toFixed(1)}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ) : (
        <>
          {/* Back button + Airport Statistics */}
          <div
            style={{
              padding: "8px 24px 0",
              display: "flex",
              gap: 12,
              alignItems: "center",
            }}
          >
            <button
              className="env-back-btn"
              onClick={() => {
                if (codeParam) {
                  navigate(-1);
                } else {
                  setSelectedAirportCode(null);
                }
              }}
            >
              {t("返回", "Back")}
            </button>
            <button
              className="env-back-btn"
              style={{
                background: "rgba(59,130,246,0.3)",
                borderColor: "rgba(59,130,246,0.4)",
              }}
              onClick={() => {
                const code = selectedAirportCode || codeParam || "";
                navigate(`/airport-center/airport-detail?code=${code}`);
              }}
            >
              {t("机场统计", "Airport Statistics")}
            </button>
          </div>
          {/* Phase Environment Card */}
          {(() => {
            const pd = phaseEnvData[envPhase];
            const riskColor =
              pd.risk.level === "High"
                ? "#ef4444"
                : pd.risk.level === "Medium"
                  ? "#eab308"
                  : "#22c55e";
            return (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  margin: "0 24px",
                  gap: 16,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    background: "rgba(15,23,42,0.6)",
                    borderRadius: 10,
                    border: "1px solid rgba(148,163,184,0.12)",
                    padding: 16,
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#f8fafc",
                      marginBottom: 12,
                    }}
                  >
                    {t("机场环境", "Airport Environment")}
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 400,
                        color: "#94a3b8",
                        marginLeft: 8,
                      }}
                    >
                      {pd.location}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr 1fr",
                      gap: 12,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 10,
                          color: "#64748b",
                          marginBottom: 4,
                        }}
                      >
                        {t("温度", "Temp")}
                      </div>
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 700,
                          color: "#f8fafc",
                        }}
                      >
                        {pd.temperature}°C
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 10,
                          color: "#64748b",
                          marginBottom: 4,
                        }}
                      >
                        {t("风速/风向", "Wind")}
                      </div>
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 700,
                          color: "#f8fafc",
                        }}
                      >
                        {pd.wind.speed}kt{" "}
                        <span style={{ fontSize: 12, color: "#94a3b8" }}>
                          {pd.wind.direction}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 10,
                          color: "#64748b",
                          marginBottom: 4,
                        }}
                      >
                        {t("能见度", "Visibility")}
                      </div>
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 700,
                          color: pd.visibility < 5 ? "#ef4444" : "#f8fafc",
                        }}
                      >
                        {pd.visibility}km
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 10,
                          color: "#64748b",
                          marginBottom: 4,
                        }}
                      >
                        {t("湿度", "Humidity")}
                      </div>
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 700,
                          color: "#f8fafc",
                        }}
                      >
                        {pd.humidity}%
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      marginTop: 12,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span style={{ fontSize: 11, color: "#64748b" }}>
                      {t("环境风险评分", "Env Risk Score")}:
                    </span>
                    <span
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: riskColor,
                      }}
                    >
                      {pd.risk.score}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        padding: "1px 8px",
                        borderRadius: 4,
                        background: `${riskColor}20`,
                        color: riskColor,
                      }}
                    >
                      {pd.risk.level === "High"
                        ? t("高", "High")
                        : pd.risk.level === "Medium"
                          ? t("中", "Medium")
                          : t("低", "Low")}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    background: "rgba(15,23,42,0.6)",
                    borderRadius: 10,
                    border: "1px solid rgba(148,163,184,0.12)",
                    padding: 16,
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#f8fafc",
                      marginBottom: 12,
                    }}
                  >
                    {t("气象告警", "Weather Alerts")}
                  </div>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    {pd.alerts.map((a, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "6px 10px",
                          borderRadius: 6,
                          background:
                            a.level === "red"
                              ? "rgba(239,68,68,0.08)"
                              : a.level === "yellow"
                                ? "rgba(234,179,8,0.08)"
                                : "rgba(34,197,94,0.08)",
                        }}
                      >
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            flexShrink: 0,
                            background:
                              a.level === "red"
                                ? "#ef4444"
                                : a.level === "yellow"
                                  ? "#eab308"
                                  : "#22c55e",
                          }}
                        />
                        <span
                          style={{
                            fontSize: 12,
                            color: "#e2e8f0",
                            fontWeight: 600,
                            flex: 1,
                          }}
                        >
                          {a.alert}
                        </span>
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>
                          {a.area}
                        </span>
                        <span style={{ fontSize: 10, color: "#64748b" }}>
                          {a.timestamp}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="env-body">
            {/* ===== Row 1: Overall Risk + Key Factors ===== */}
            <div className="env-row">
              {/* LEFT: Overall Environmental Risk */}
              <div className="env-card">
                <div className="env-card-header">
                  <div className="env-card-title">
                    {t("整体环境风险", "Overall Environmental Risk")}
                  </div>
                  <div className="env-card-actions">
                    <span className="env-card-link">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                      </svg>
                      {t("趋势", "Trend")}
                    </span>
                    <span className="env-card-menu">...</span>
                  </div>
                </div>

                <div className="env-gauge-layout">
                  <div className="env-gauge-wrapper">
                    <GaugeSVG score={overallRisk.score} />
                    <span className="env-risk-badge env-risk-badge-yellow">
                      ▲ {t("中等风险", "MEDIUM RISK")}
                    </span>
                  </div>

                  <div className="env-factor-list">
                    {overallRisk.factors.map((f, i) => (
                      <div className="env-factor-item" key={i}>
                        <span
                          className="env-factor-dot"
                          style={{ background: f.color }}
                        />
                        <span className="env-factor-name">
                          {t(
                            f.name === "Air Quality"
                              ? "空气质量"
                              : f.name === "Precipitation"
                                ? "降水"
                                : "极端事件",
                            f.name,
                          )}
                          :
                        </span>
                        <span
                          className="env-factor-value"
                          style={{ color: f.color }}
                        >
                          {t(
                            f.status === "Moderate"
                              ? "中等"
                              : f.status === "Low"
                                ? "低"
                                : "无",
                            f.status,
                          )}{" "}
                          (
                          {f.status === "Moderate"
                            ? t("黄色", "Yellow")
                            : t("绿色", "Green")}
                          )
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT: Key Factor Status */}
              <div className="env-card">
                <div className="env-card-header">
                  <div className="env-card-title">
                    {t("关键因素状态", "Key Factor Status")}
                  </div>
                  <div className="env-card-actions">
                    <span className="env-card-link">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                      </svg>
                      {t("趋势", "Trend")}
                    </span>
                    <span className="env-card-menu">...</span>
                  </div>
                </div>

                <div className="env-kf-grid">
                  {/* Temperature */}
                  <div className="env-kf-box">
                    <div className="env-kf-top">
                      <div className="env-kf-icon env-kf-icon-temp">🌡</div>
                      <div>
                        <div className="env-kf-label">
                          {t("温度", "Temperature")}
                        </div>
                        <div className="env-kf-value">
                          {keyFactors.temperature}°C
                        </div>
                      </div>
                    </div>
                    <Sparkline data={tempSparkline} color="#f97316" />
                  </div>

                  {/* Wind */}
                  <div className="env-kf-box">
                    <div className="env-kf-top">
                      <div className="env-kf-icon env-kf-icon-wind">W</div>
                      <div>
                        <div className="env-kf-label">{t("风速", "Wind")}</div>
                        <div className="env-kf-value">
                          {keyFactors.wind.speed} km/h
                          <span className="env-kf-sub">
                            , {keyFactors.wind.direction}
                          </span>
                        </div>
                      </div>
                    </div>
                    <svg width="80" height="28" viewBox="0 0 80 28">
                      <line
                        x1="10"
                        y1="14"
                        x2="70"
                        y2="14"
                        stroke="#60a5fa"
                        strokeWidth="1.5"
                        opacity="0.6"
                      />
                      <polygon
                        points="10,14 18,10 18,18"
                        fill="#60a5fa"
                        opacity="0.7"
                      />
                    </svg>
                  </div>

                  {/* Visibility */}
                  <div className="env-kf-box">
                    <div className="env-kf-top">
                      <div className="env-kf-icon env-kf-icon-vis">👁</div>
                      <div>
                        <div className="env-kf-label">
                          {t("能见度", "Visibility")}
                        </div>
                        <div className="env-kf-value">
                          {keyFactors.visibility} km
                        </div>
                      </div>
                    </div>
                    <Sparkline data={visSparkline} color="#8b5cf6" />
                  </div>

                  {/* Humidity */}
                  <div className="env-kf-box">
                    <div className="env-kf-top">
                      <div className="env-kf-icon env-kf-icon-hum">💧</div>
                      <div>
                        <div className="env-kf-label">
                          {t("湿度", "Humidity")}
                        </div>
                        <div className="env-kf-value">
                          {keyFactors.humidity}%
                        </div>
                      </div>
                    </div>
                    <Sparkline data={humSparkline} color="#22c55e" />
                  </div>
                </div>
              </div>
            </div>

            {/* ===== Row 2: Weather Summary + Alerts ===== */}
            <div className="env-row">
              {/* LEFT: Weather Summary */}
              <div className="env-card">
                <div className="env-card-header">
                  <div className="env-card-title">
                    {t("天气概况", "Weather Summary")}
                  </div>
                  <span className="env-card-menu">...</span>
                </div>

                <div className="env-weather-layout">
                  <div className="env-weather-left">
                    <div className="env-weather-title-row">
                      <span className="env-weather-icon">⛅</span>
                      <span className="env-weather-title">
                        {t("多云", "Partly Cloudy")}
                      </span>
                    </div>
                    <div className="env-weather-info">
                      {t(
                        "天气: 多云 | 降水概率: 8%",
                        "Time: Partly cloudy | Precipitation: 8%",
                      )}
                    </div>

                    <div className="env-weather-stats">
                      <div className="env-weather-stat">
                        <span className="env-weather-stat-label">
                          {t("当前温度", "Current conditions")}
                        </span>
                        <span className="env-weather-stat-value">18°C</span>
                      </div>
                      <div className="env-weather-stat">
                        <span className="env-weather-stat-label">
                          {t("降水趋势", "Precipitation trend")}
                        </span>
                        <span className="env-weather-stat-value">5</span>
                      </div>
                      <div className="env-weather-stat">
                        <span className="env-weather-stat-label">
                          {t("能见度", "Visibility")}
                        </span>
                        <span className="env-weather-stat-value">12 km</span>
                      </div>
                      <div className="env-weather-stat">
                        <span className="env-weather-stat-label">
                          {t("风速", "Wind")}
                        </span>
                        <span className="env-weather-stat-value">
                          15 km/h, W
                        </span>
                      </div>
                      <div className="env-weather-stat">
                        <span className="env-weather-stat-label">
                          {t("极端事件", "Extreme Events")}
                        </span>
                        <span className="env-weather-stat-value">
                          {t("无", "None")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="env-weather-right">
                    <div className="env-weather-chart-title">
                      {t("24小时温度趋势", "24 Hour Temperature Trend")}
                    </div>
                    <div className="env-weather-chart">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={tempTrendData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgba(148,163,184,0.08)"
                          />
                          <XAxis
                            dataKey="time"
                            tick={{ fill: "#64748b", fontSize: 10 }}
                            axisLine={{ stroke: "rgba(148,163,184,0.1)" }}
                            tickLine={false}
                          />
                          <YAxis
                            domain={[5, 30]}
                            tick={{ fill: "#64748b", fontSize: 10 }}
                            axisLine={{ stroke: "rgba(148,163,184,0.1)" }}
                            tickLine={false}
                            width={28}
                          />
                          <Tooltip {...darkTooltipStyle} />
                          <Line
                            type="monotone"
                            dataKey="temp"
                            stroke="#f97316"
                            strokeWidth={2}
                            dot={{ fill: "#f97316", r: 3, strokeWidth: 0 }}
                            activeDot={{ r: 5, fill: "#f97316" }}
                            name={t("温度", "Temperature")}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Hourly forecast strip */}
                    <div className="env-hourly-strip">
                      {hourlyForecast.map((h, i) => (
                        <div className="env-hourly-item" key={i}>
                          <span className="env-hourly-time">
                            {t(
                              h.time
                                .replace(" AM", " 上午")
                                .replace(" PM", " 下午"),
                              h.time,
                            )}
                          </span>
                          <span className="env-hourly-icon">{h.icon}</span>
                          <span className="env-hourly-temp">{h.temp}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT: Runway and Airport Environment Alerts */}
              <div className="env-card">
                <div className="env-card-header">
                  <div className="env-card-title">
                    {t(
                      "跑道与机场环境警报",
                      "Runway and Airport Environment Alerts",
                    )}
                  </div>
                  <button className="env-alerts-dropdown">
                    {t("最近警报", "Recent alerts")} ▾
                  </button>
                </div>

                <table className="env-table">
                  <thead>
                    <tr>
                      <th>{t("风险等级", "Risk Level")}</th>
                      <th>{t("警报", "Alert")}</th>
                      <th>{t("影响区域", "Affected Area")}</th>
                      <th>{t("时间戳", "Timestamp")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alertsData.map((a, i) => (
                      <tr key={i}>
                        <td>
                          <span className={pillClass(a.level)}>
                            {levelLabel(a.level)}
                          </span>
                        </td>
                        <td
                          style={{
                            color: a.level === "red" ? "#dc2626" : "#eab308",
                          }}
                        >
                          {t(
                            a.alert === "Strong Crosswinds"
                              ? "强侧风"
                              : a.alert === "Foggy Conditions"
                                ? "大雾条件"
                                : "危险结冰",
                            a.alert,
                          )}
                        </td>
                        <td>
                          {t(
                            a.area === "Near Northern Taxiway"
                              ? "北滑行道附近"
                              : a.area,
                            a.area,
                          )}
                        </td>
                        <td style={{ color: "#64748b" }}>{a.timestamp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ===== Row 3: Anomalies + Time-Window Charts ===== */}
            <div className="env-row">
              {/* LEFT: Major Environmental Anomalies */}
              <div className="env-card">
                <div className="env-card-header">
                  <div className="env-card-title">
                    {t("重大环境异常", "Major Environmental Anomalies")}
                  </div>
                  <span className="env-card-menu">...</span>
                </div>

                <div className="env-anomaly-list">
                  {anomaliesData.map((a, i) => (
                    <div className="env-anomaly-item" key={i}>
                      <span className="env-anomaly-time">{a.time}</span>
                      <span
                        className="env-anomaly-dot"
                        style={{ background: a.dotColor }}
                      />
                      <div className="env-anomaly-content">
                        <div className="env-anomaly-tag">
                          <span className={pillClass(a.tagLevel)}>
                            {t(
                              a.tag === "Unusual Wind Gusts Detected"
                                ? "异常阵风检测"
                                : a.tag === "Sudden Drop in Pressure"
                                  ? "气压骤降"
                                  : "D区附近雷击",
                              a.tag,
                            )}{" "}
                            (
                            {a.tagLevel === "yellow"
                              ? t("黄色", "Yellow")
                              : t("红色", "Red")}
                            )
                          </span>
                        </div>
                        <div className="env-anomaly-desc">
                          {t(
                            a.desc
                              .replace(
                                "Unusual Wind Gusts Detected at",
                                "异常阵风检测于",
                              )
                              .replace("Northern Taxiway B.", "北滑行道B。")
                              .replace(
                                "Sudden drop in Pressure is near Northern Taxiway",
                                "气压骤降，发生于北滑行道附近",
                              )
                              .replace(
                                "Lightning Strike Near Sector D Instant",
                                "D区附近闪电雷击",
                              ),
                            a.desc,
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT: Time-Window Changes */}
              <div className="env-card">
                <div className="env-card-header">
                  <div className="env-card-title">
                    {t("时间窗口变化", "Time-Window Changes")}
                  </div>
                  <span className="env-card-menu">...</span>
                </div>

                <div className="env-tw-grid">
                  {/* Visibility Change Trend */}
                  <div>
                    <div className="env-tw-chart-title">
                      {t("能见度变化趋势", "Visibility Change Trend")}
                    </div>
                    <div className="env-tw-chart">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={visibilityTrend}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgba(148,163,184,0.08)"
                          />
                          <XAxis
                            dataKey="day"
                            tick={{ fill: "#64748b", fontSize: 10 }}
                            axisLine={{ stroke: "rgba(148,163,184,0.1)" }}
                            tickLine={false}
                            tickFormatter={translateDay}
                          />
                          <YAxis
                            domain={[0, 100]}
                            tick={{ fill: "#64748b", fontSize: 10 }}
                            axisLine={{ stroke: "rgba(148,163,184,0.1)" }}
                            tickLine={false}
                            width={28}
                          />
                          <Tooltip {...darkTooltipStyle} />
                          <Area
                            type="monotone"
                            dataKey="val"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            fill="rgba(59,130,246,0.15)"
                            name={t("能见度", "Visibility")}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Wind Pattern Evolution */}
                  <div>
                    <div className="env-tw-chart-title">
                      {t("风型演变", "Wind Pattern Evolution")}
                    </div>
                    <div className="env-tw-chart">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={windPatternData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgba(148,163,184,0.08)"
                          />
                          <XAxis
                            dataKey="day"
                            tick={{ fill: "#64748b", fontSize: 10 }}
                            axisLine={{ stroke: "rgba(148,163,184,0.1)" }}
                            tickLine={false}
                            tickFormatter={translateDay}
                          />
                          <YAxis
                            domain={[0, 30]}
                            tick={{ fill: "#64748b", fontSize: 10 }}
                            axisLine={{ stroke: "rgba(148,163,184,0.1)" }}
                            tickLine={false}
                            width={28}
                          />
                          <Tooltip
                            content={
                              <WindTooltip
                                active={true}
                                payload={windPatternData.map((d) => ({
                                  day: d.day,
                                  value: d.val,
                                }))}
                                t={t}
                              />
                            }
                          />
                          <Line
                            type="monotone"
                            dataKey="val"
                            stroke="#ef4444"
                            strokeWidth={2}
                            dot={{ fill: "#ef4444", r: 4, strokeWidth: 0 }}
                            activeDot={{ r: 6, fill: "#ef4444" }}
                            name={t("风速", "Wind")}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="env-tw-windows">
                  <div className="env-tw-window">
                    {t("运营窗口", "Operational Window")} 08:00-12:00:{" "}
                    <span className="env-tw-normal">{t("正常", "Normal")}</span>
                  </div>
                  <div className="env-tw-window">
                    {t("运营窗口", "Operational Window")} 12:00-16:00:{" "}
                    <span className="env-tw-disruption">
                      {t("可能中断", "Disruption Likely")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Messages & Notices (merged from MessageDetailPage & NoticeDetailPage) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginTop: 20,
            }}
          >
            {/* METAR Messages */}
            <div
              style={{
                background: "rgba(15,23,42,0.6)",
                borderRadius: 10,
                border: "1px solid rgba(148,163,184,0.12)",
                padding: 20,
              }}
            >
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#f8fafc",
                  marginBottom: 12,
                }}
              >
                {t("报文信息", "Message Information")}
              </h3>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <div>
                    <span style={{ color: "#64748b" }}>
                      {t("报文ID", "Message ID")}:
                    </span>{" "}
                    <span style={{ color: "#e2e8f0" }}>MSG-123456</span>
                  </div>
                  <div>
                    <span style={{ color: "#64748b" }}>
                      {t("来源", "Source")}:
                    </span>{" "}
                    <span style={{ color: "#e2e8f0" }}>FAA NOTAM</span>
                  </div>
                  <div>
                    <span style={{ color: "#64748b" }}>
                      {t("类型", "Type")}:
                    </span>{" "}
                    <span style={{ color: "#e2e8f0" }}>
                      {t("空域限制", "Airspace Restriction")}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: "#64748b" }}>
                      {t("接收时间", "Received")}:
                    </span>{" "}
                    <span style={{ color: "#e2e8f0" }}>11/22/23, 11:39 PM</span>
                  </div>
                </div>
              </div>
              <div
                style={{
                  background: "rgba(0,0,0,0.3)",
                  borderRadius: 6,
                  padding: 12,
                  fontSize: 11,
                  fontFamily: "monospace",
                  color: "#94a3b8",
                  maxHeight: 120,
                  overflow: "auto",
                  whiteSpace: "pre-wrap",
                }}
              >
                {`METAR ZBAA 150600Z 20008G18KT 150V250
1500 R01/1000N R36R/1200D +TSRA SCT015CB
BKN030 25/18 Q1005 NOSIG TEMPO 1200
+TSRA GR GS CB`}
              </div>
            </div>

            {/* Notices */}
            <div
              style={{
                background: "rgba(15,23,42,0.6)",
                borderRadius: 10,
                border: "1px solid rgba(148,163,184,0.12)",
                padding: 20,
              }}
            >
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#f8fafc",
                  marginBottom: 12,
                }}
              >
                {t("通告信息", "Notice Information")}
              </h3>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <div>
                    <span style={{ color: "#64748b" }}>
                      {t("通告", "Notice")}:
                    </span>{" "}
                    <span style={{ color: "#e2e8f0" }}>
                      {t("ZBAA雷暴警告", "ZBAA Thunderstorm Warning")}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: "#64748b" }}>
                      {t("生效时间", "Effective")}:
                    </span>{" "}
                    <span style={{ color: "#e2e8f0" }}>
                      2024-06-15 14:00 (CST)
                    </span>
                  </div>
                  <div>
                    <span style={{ color: "#64748b" }}>
                      {t("到期时间", "Expiration")}:
                    </span>{" "}
                    <span style={{ color: "#e2e8f0" }}>
                      2024-06-15 18:00 (CST)
                    </span>
                  </div>
                  <div>
                    <span style={{ color: "#64748b" }}>
                      {t("来源", "Source")}:
                    </span>{" "}
                    <span style={{ color: "#e2e8f0" }}>
                      Aviation Weather Center
                    </span>
                  </div>
                </div>
                <div style={{ marginTop: 8 }}>
                  <div
                    style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}
                  >
                    {t("影响范围", "Impact Area")}
                  </div>
                  <div style={{ color: "#e2e8f0", fontSize: 12 }}>
                    {t(
                      "影响机场：ZBAA, ZBAD, ZBTJ · 半径约100km · 雷暴、冰雹",
                      "Affected: ZBAA, ZBAD, ZBTJ · Radius ~100km · Thunderstorm, Hail",
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
