/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  LineChart,
  Line,
  // AreaChart,
  // Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useLanguage } from "../i18n/useLanguage";
import {
  getEnvironmentAirportDetail,
  getEnvironmentAirports,
} from "../api/environment";
import "./EnvironmentDetailPage.css";

// ===== Mock Data (phase-specific only) =====

// const anomaliesData = [
//   {
//     time: "17:00",
//     dotColor: "#eab308",
//     tag: "Unusual Wind Gusts Detected",
//     tagLevel: "yellow" as const,
//     desc: "Unusual Wind Gusts Detected at Northern Taxiway B.",
//   },
//   {
//     time: "17:00",
//     dotColor: "#eab308",
//     tag: "Sudden Drop in Pressure",
//     tagLevel: "yellow" as const,
//     desc: "Sudden drop in Pressure is near Northern Taxiway.",
//   },
//   {
//     time: "18:00",
//     dotColor: "#dc2626",
//     tag: "Lightning Strike Near Sector D",
//     tagLevel: "red" as const,
//     desc: "Lightning Strike Near Sector D Instant.",
//   },
// ];

// const visibilityTrend = [
//   { day: "7 day", val: 45 },
//   { day: "Mon", val: 55 },
//   { day: "Tue", val: 30 },
//   { day: "Wed", val: 65 },
//   { day: "Thu", val: 50 },
//   { day: "Fri", val: 72 },
//   { day: "7 day", val: 60 },
// ];

// const windPatternData = [
//   { day: "7 day", val: 12 },
//   { day: "Mon", val: 18 },
//   { day: "Tue", val: 22 },
//   { day: "Wed", val: 15 },
//   { day: "Thu", val: 25 },
//   { day: "Fri", val: 20 },
//   { day: "7 day", val: 16 },
// ];

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

// function WindTooltip({
//   active,
//   payload,
//   t,
// }: {
//   active: boolean;
//   payload: { day: string; value: number }[];
//   t: (zh: string, en: string) => string;
// }) {
//   if (active && payload && payload.length) {
//     return (
//       <div className="env-tooltip-box">
//         <div>
//           {payload[0].day}: {payload[0].value} km/h
//         </div>
//         <div style={{ marginTop: 4, color: "#94a3b8" }}>
//           {t(
//             "预测运营影响窗口 08:00-12:00: 正常",
//             "Predicts operational impact windows 08:00-12:00: Normal",
//           )}
//         </div>
//       </div>
//     );
//   }
//   return null;
// }

// ===== Main Component =====

export function EnvironmentDetailPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const codeParam = searchParams.get("code");
  const [selectedAirportCode, setSelectedAirportCode] = useState<string | null>(
    codeParam,
  );
  const [envSearch, setEnvSearch] = useState("");
  const [envRiskFilter, setEnvRiskFilter] = useState<
    "all" | "red" | "yellow" | "green"
  >("all");

  // ===== 机场列表 API 数据（分页 + 滚动加载） =====
  const [airportList, setAirportList] = useState<any[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listPage, setListPage] = useState(1);
  const [listTotal, setListTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const LIST_PAGE_SIZE = 30;

  const fetchAirportList = (page: number, append = false) => {
    const loading = page === 1 ? setListLoading : setLoadingMore;
    loading(true);
    getEnvironmentAirports({
      page,
      pageSize: LIST_PAGE_SIZE,
      keyword: envSearch || undefined,
      riskLevel:
        envRiskFilter === "all"
          ? undefined
          : envRiskFilter === "red"
            ? "高"
            : envRiskFilter === "yellow"
              ? "中"
              : "低",
    })
      .then((res: any) => {
        const items = res?.items ?? [];
        setAirportList((prev) => (append ? [...prev, ...items] : items));
        setListTotal(res?.total ?? 0);
        setListPage(page);
      })
      .catch(console.error)
      .finally(() => loading(false));
  };

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      fetchAirportList(1);
    }, 300);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [envSearch, envRiskFilter]);

  // 滚动自动加载更多
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !loadingMore &&
          airportList.length < listTotal
        ) {
          fetchAirportList(listPage + 1, true);
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadingMore, listPage, listTotal, airportList.length]);

  // ===== 环境详情 API 数据 =====
  const [envData, setEnvData] = useState<any>(null);
  const [envLoading, setEnvLoading] = useState(false);

  // URL 带 code 参数时自动选中
  useEffect(() => {
    const code = searchParams.get("code");
    if (code && code !== selectedAirportCode) {
      setSelectedAirportCode(code);
    }
  }, [searchParams]);

  // 选中机场时加载详情
  useEffect(() => {
    if (!selectedAirportCode) {
      setEnvData(null);
      return;
    }
    setEnvLoading(true);
    getEnvironmentAirportDetail(selectedAirportCode)
      .then((res: any) => setEnvData(res))
      .catch(console.error)
      .finally(() => setEnvLoading(false));
  }, [selectedAirportCode]);

  // API 数据映射
  const currentOverallRisk = envData?.riskSummary
    ? {
        score: envData.riskSummary.score,
        riskLevel: envData.riskSummary.riskLevel,
        airQuality: envData.riskSummary.airQuality,
        precipitation: envData.riskSummary.precipitation,
        extremeEvent: envData.riskSummary.extremeEvent,
      }
    : null;
  const currentKeyFactors = envData?.keyFactors ?? null;
  const currentWeatherSummary = envData?.weatherSummary ?? null;
  const currentAlerts = envData?.alerts ?? [];
  const currentTempTrendData = envData?.tempTrendData ?? [];
  const currentHourlyForecast = envData?.hourlyForecast ?? [];
  const currentTempSparkline = envData?.tempSparkline ?? [];
  const currentVisSparkline = envData?.visSparkline ?? [];
  const currentHumSparkline = envData?.humSparkline ?? [];

  const pillClass = (level: string) =>
    level === "red"
      ? "env-pill env-pill-red"
      : level === "yellow"
        ? "env-pill env-pill-yellow"
        : "env-pill env-pill-green";

  // const dayMap: Record<string, string> = {
  //   Mon: "周一",
  //   Tue: "周二",
  //   Wed: "周三",
  //   Thu: "周四",
  //   Fri: "周五",
  //   Sat: "周六",
  //   Sun: "周日",
  //   "7 day": "7天",
  // };

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
              {airportList.find((a) => a.code === selectedAirportCode)?.name ??
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
              {listTotal} {t("个机场", "airports")}
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
            {listLoading ? (
              <div
                style={{
                  gridColumn: "1 / -1",
                  textAlign: "center",
                  padding: "40px 0",
                  color: "#94a3b8",
                  fontSize: 13,
                }}
              >
                {t("加载机场列表中...", "Loading airport list...")}
              </div>
            ) : airportList.length === 0 ? (
              <div
                style={{
                  gridColumn: "1 / -1",
                  textAlign: "center",
                  padding: "40px 0",
                  color: "#64748b",
                  fontSize: 13,
                }}
              >
                {t("暂无机场数据", "No airport data")}
              </div>
            ) : (
              airportList.map((airport) => {
                const risk = airport.riskScore ?? 0;
                const riskLevelStr = airport.riskLevel ?? "";
                const riskZone = riskLevelStr
                  ? riskLevelStr === "高"
                    ? "red"
                    : riskLevelStr === "中"
                      ? "yellow"
                      : "green"
                  : risk >= 70
                    ? "red"
                    : risk >= 40
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
                    key={airport.id ?? airport.code}
                    className="env-airport-card"
                    onClick={() =>
                      setSelectedAirportCode(airport.code ?? airport.icaoCode)
                    }
                  >
                    <div className="env-airport-card-top">
                      <div className="env-airport-card-code">
                        {airport.code}
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
                      {airport.name ?? airport.nameZh}
                    </div>
                    <div className="env-airport-card-meta">
                      <span>{airport.city ?? airport.country ?? ""}</span>
                      {airport.keyMetrics?.windSpeedKt != null && (
                        <span>
                          {airport.keyMetrics.windDirection}{" "}
                          {airport.keyMetrics.windSpeedKt}kt
                        </span>
                      )}
                      {airport.keyMetrics?.visibilityKm != null && (
                        <span>
                          {t("能见度", "Vis")} {airport.keyMetrics.visibilityKm}
                          km
                        </span>
                      )}
                      {airport.topRisk && (
                        <span style={{ color: "#eab308" }}>
                          {airport.topRisk}
                        </span>
                      )}
                    </div>
                    <div className="env-airport-card-risk">
                      <div className="env-airport-card-risk-bar">
                        <div
                          className="env-airport-card-risk-fill"
                          style={{
                            width: `${risk}%`,
                            background: riskColor,
                          }}
                        />
                      </div>
                      <span
                        className="env-airport-card-risk-score"
                        style={{ color: riskColor }}
                      >
                        {risk}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            {!listLoading && airportList.length < listTotal && (
              <div
                ref={loadMoreRef}
                style={{
                  gridColumn: "1 / -1",
                  textAlign: "center",
                  padding: "16px 0",
                  color: "#94a3b8",
                  fontSize: 12,
                }}
              >
                {loadingMore ? t("加载中...", "Loading...") : ""}
              </div>
            )}
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
            {/* 机场信息按钮已移除（不与环关联） */}
          </div>
          {envLoading && (
            <div
              style={{
                textAlign: "center",
                padding: "12px 24px",
                color: "#94a3b8",
                fontSize: 13,
              }}
            >
              {t("加载环境数据中...", "Loading environment data...")}
            </div>
          )}

          {/* Phase Environment Card */}
          {envData &&
            (() => {
              const airport = envData.airport;
              const ws = envData.weatherSummary;
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
                        {airport?.code} ({airport?.name})
                      </span>
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr",
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
                          {t("天气", "Weather")}
                        </div>
                        <div
                          style={{
                            fontSize: 18,
                            fontWeight: 700,
                            color: "#f8fafc",
                          }}
                        >
                          {ws?.condition ?? "--"}
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
                          {t("温度", "Temp")}
                        </div>
                        <div
                          style={{
                            fontSize: 18,
                            fontWeight: 700,
                            color: "#f8fafc",
                          }}
                        >
                          {ws?.temperatureC ?? "--"}°C
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
                            color:
                              (ws?.visibilityKm ?? 99) < 5
                                ? "#ef4444"
                                : "#f8fafc",
                          }}
                        >
                          {ws?.visibilityKm ?? "--"}km
                        </div>
                      </div>
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
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      {currentAlerts.length === 0 ? (
                        <div style={{ fontSize: 12, color: "#64748b" }}>
                          {t("暂无告警", "No alerts")}
                        </div>
                      ) : (
                        currentAlerts.map((a: any, i: number) => {
                          const alertColor =
                            a.level === "高"
                              ? "#ef4444"
                              : a.level === "中"
                                ? "#eab308"
                                : "#22c55e";
                          const alertBg =
                            a.level === "高"
                              ? "rgba(239,68,68,0.08)"
                              : a.level === "中"
                                ? "rgba(234,179,8,0.08)"
                                : "rgba(34,197,94,0.08)";
                          return (
                            <div
                              key={i}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                padding: "6px 10px",
                                borderRadius: 6,
                                background: alertBg,
                              }}
                            >
                              <span
                                style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: "50%",
                                  flexShrink: 0,
                                  background: alertColor,
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
                                {a.title}
                              </span>
                              <span style={{ fontSize: 11, color: "#94a3b8" }}>
                                {a.level}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

          <div className="env-body">
            {envLoading ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "60px 0",
                  color: "#94a3b8",
                  fontSize: 14,
                }}
              >
                {t("加载环境数据中...", "Loading environment data...")}
              </div>
            ) : !envData ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "60px 0",
                  color: "#64748b",
                  fontSize: 14,
                }}
              >
                {t("暂无环境数据", "No environment data available")}
              </div>
            ) : (
              <>
                {/* ===== Row 1: Overall Risk + Key Factors ===== */}
                <div className="env-row">
                  {/* LEFT: Overall Environmental Risk */}
                  <div className="env-card">
                    <div className="env-card-header">
                      <div className="env-card-title">
                        {t("整体环境风险", "Overall Environmental Risk")}
                      </div>
                      {/* <div className="env-card-actions">
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
                  </div> */}
                    </div>

                    <div className="env-gauge-layout">
                      <div className="env-gauge-wrapper">
                        <GaugeSVG score={currentOverallRisk?.score ?? 0} />
                        <span
                          className={`env-risk-badge ${
                            currentOverallRisk?.riskLevel === "高"
                              ? "env-risk-badge-red"
                              : currentOverallRisk?.riskLevel === "中"
                                ? "env-risk-badge-yellow"
                                : "env-risk-badge-green"
                          }`}
                        >
                          ▲{" "}
                          {currentOverallRisk?.riskLevel === "高"
                            ? t("高风险", "HIGH RISK")
                            : currentOverallRisk?.riskLevel === "中"
                              ? t("中等风险", "MEDIUM RISK")
                              : t("低风险", "LOW RISK")}
                        </span>
                      </div>

                      <div className="env-factor-list">
                        {currentOverallRisk?.extremeEvent && (
                          <div className="env-factor-item">
                            <span
                              className="env-factor-dot"
                              style={{ background: "#eab308" }}
                            />
                            <span className="env-factor-name">
                              {t("首要风险", "Top Risk")}:
                            </span>
                            <span
                              className="env-factor-value"
                              style={{ color: "#eab308" }}
                            >
                              {currentOverallRisk.extremeEvent}
                            </span>
                          </div>
                        )}
                        {currentOverallRisk?.riskLevel && (
                          <div className="env-factor-item">
                            <span
                              className="env-factor-dot"
                              style={{
                                background:
                                  currentOverallRisk.riskLevel === "高"
                                    ? "#ef4444"
                                    : currentOverallRisk.riskLevel === "中"
                                      ? "#eab308"
                                      : "#22c55e",
                              }}
                            />
                            <span className="env-factor-name">
                              {t("风险等级", "Risk Level")}:
                            </span>
                            <span
                              className="env-factor-value"
                              style={{
                                color:
                                  currentOverallRisk.riskLevel === "高"
                                    ? "#ef4444"
                                    : currentOverallRisk.riskLevel === "中"
                                      ? "#eab308"
                                      : "#22c55e",
                              }}
                            >
                              {currentOverallRisk.riskLevel}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: Key Factor Status */}
                  <div className="env-card">
                    <div className="env-card-header">
                      <div className="env-card-title">
                        {t("关键因素状态", "Key Factor Status")}
                      </div>
                      {/* <div className="env-card-actions">
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
                  </div> */}
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
                              {currentKeyFactors?.temperatureC ?? "--"}°C
                            </div>
                          </div>
                        </div>
                        <Sparkline
                          data={currentTempSparkline}
                          color="#f97316"
                        />
                      </div>

                      {/* Wind */}
                      <div className="env-kf-box">
                        <div className="env-kf-top">
                          <div className="env-kf-icon env-kf-icon-wind">W</div>
                          <div>
                            <div className="env-kf-label">
                              {t("天气", "Weather")}
                            </div>
                            <div className="env-kf-value">
                              {currentWeatherSummary?.condition ?? "--"}
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
                              {currentKeyFactors?.visibilityKm ?? "--"} km
                            </div>
                          </div>
                        </div>
                        <Sparkline data={currentVisSparkline} color="#8b5cf6" />
                      </div>

                      {/* Humidity */}
                      <div className="env-kf-box">
                        <div className="env-kf-top">
                          <div className="env-kf-icon env-kf-icon-hum">💧</div>
                          <div>
                            <div className="env-kf-label">
                              {t("湿度", "Humidity")}
                            </div>
                            <div className="env-kf-value">--</div>
                          </div>
                        </div>
                        <Sparkline data={currentHumSparkline} color="#22c55e" />
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
                      {/* <span className="env-card-menu">...</span> */}
                    </div>

                    <div className="env-weather-layout">
                      <div className="env-weather-left">
                        <div className="env-weather-title-row">
                          <span className="env-weather-icon">⛅</span>
                          <span className="env-weather-title">
                            {currentWeatherSummary?.condition ?? "--"}
                          </span>
                        </div>
                        <div className="env-weather-info">
                          {t("天气", "Weather")}:{" "}
                          {currentWeatherSummary?.condition ?? "--"} |{" "}
                          {t("温度", "Temp")}:{" "}
                          {currentKeyFactors?.temperatureC ?? "--"}°C
                        </div>

                        <div className="env-weather-stats">
                          <div className="env-weather-stat">
                            <span className="env-weather-stat-label">
                              {t("当前温度", "Current conditions")}
                            </span>
                            <span className="env-weather-stat-value">
                              {currentKeyFactors?.temperatureC ?? "--"}°C
                            </span>
                          </div>
                          <div className="env-weather-stat">
                            <span className="env-weather-stat-label">
                              {t("能见度", "Visibility")}
                            </span>
                            <span className="env-weather-stat-value">
                              {currentKeyFactors?.visibilityKm ?? "--"} km
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
                            <LineChart data={currentTempTrendData}>
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
                          {currentHourlyForecast.map((h: any, i: number) => (
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
                </div>

                {/* Row 3: 重大环境异常 + 时间窗口变化 已移除 */}
              </>
            )}
          </div>

          {/* METAR/TAF & Notices */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginTop: 20,
            }}
          >
            {/* METAR / TAF from API */}
          </div>
        </>
      )}
    </div>
  );
}
