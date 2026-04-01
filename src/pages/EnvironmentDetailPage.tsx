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
    level: "orange" as const,
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
    dotColor: "#f97316",
    tag: "Unusual Wind Gusts Detected",
    tagLevel: "orange" as const,
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

export function EnvironmentDetailPage() {
  const { t } = useLanguage();

  const pillClass = (level: string) =>
    level === "red"
      ? "env-pill env-pill-red"
      : level === "orange"
        ? "env-pill env-pill-orange"
        : level === "yellow"
          ? "env-pill env-pill-yellow"
          : "env-pill env-pill-green";

  const levelLabel = (level: string) =>
    level === "red"
      ? t("高", "High")
      : level === "orange"
        ? t("中高", "Medium")
        : level === "yellow"
          ? t("中", "Low-Med")
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
        {t("环境分析", "Environmental Analysis")}
        <span className="env-breadcrumb-sep">/</span>
        <span className="env-breadcrumb-active">
          {t("详情", "Detail")}
        </span>
      </div>

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
                <span className="env-risk-badge env-risk-badge-orange">
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
                    <div className="env-kf-label">{t("湿度", "Humidity")}</div>
                    <div className="env-kf-value">{keyFactors.humidity}%</div>
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
                    <span className="env-weather-stat-value">15 km/h, W</span>
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
                        color:
                          a.level === "red"
                            ? "#dc2626"
                            : a.level === "orange"
                              ? "#ea580c"
                              : "#eab308",
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
                        {a.tagLevel === "orange"
                          ? t("橙色", "Orange")
                          : a.tagLevel === "yellow"
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

      {/* Bottom Action Buttons */}
      <div className="env-actions">
        <button className="env-btn env-btn-primary">
          {t("查看消息", "View Messages")}
        </button>
        <button className="env-btn env-btn-outline">
          {t("查看通知", "View Notices")}
        </button>
        <button className="env-btn env-btn-outline-red">
          {t("查看相关航班", "View Related Flights")}
        </button>
      </div>

      {/* Footer */}
      <div className="env-footer">
        {t(
          "全球页脚 · 小型团队与未公布的网络机队运营。保留所有权利。",
          "Global footer · Minor teams and unannounced web fleet continues. All rights reserved.",
        )}
        <a href="#">{t("帮助", "Help")}</a>
      </div>
    </div>
  );
}
