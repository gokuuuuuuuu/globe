import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  getAirportDetailAggregate,
  getAirportFlights,
  type AirportDetailAggregate,
  type AirportFlightItem,
} from "../api/airport";
import { useLanguage } from "../i18n/useLanguage";
import "./AirportDetailPage.css";

// ===== Constants =====

const GRID_STROKE = "rgba(148, 163, 184, 0.1)";
const AXIS_TICK = { fontSize: 10, fill: "#94a3b8" };
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

// ===== Helpers =====

// Semi-circle gauge SVG
function GaugeArc({
  value,
  max,
  label,
  unit,
  color,
}: {
  value: number;
  max: number;
  label: string;
  unit: string;
  color: string;
}) {
  const pct = Math.max(0, Math.min(value / max, 1));
  const r = 36;
  const cx = 50;
  const cy = 46;
  // 半圆弧长
  const halfCircumference = Math.PI * r;
  const dashLen = pct * halfCircumference;
  const gapLen = halfCircumference - dashLen;

  return (
    <div className="ad-gauge-item">
      <svg width="100" height="58" viewBox="0 0 100 58">
        {/* Background arc */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="rgba(148,163,184,0.15)"
          strokeWidth="7"
          strokeLinecap="round"
        />
        {/* Value arc — 用 dasharray 控制长度 */}
        {pct > 0 && (
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke={color}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`${dashLen} ${gapLen}`}
          />
        )}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          fill="#f8fafc"
          fontSize="13"
          fontWeight="700"
        >
          {typeof value === "number"
            ? value % 1 === 0
              ? value
              : value.toFixed(1)
            : value}
          <tspan fontSize="9" fill="#94a3b8">
            {unit}
          </tspan>
        </text>
      </svg>
      <span className="ad-gauge-label">{label}</span>
    </div>
  );
}

// ===== Component =====

export function AirportDetailPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code") || "";

  const [data, setData] = useState<AirportDetailAggregate | null>(null);
  const [loading, setLoading] = useState(true);
  const [flights, setFlights] = useState<AirportFlightItem[]>([]);
  const [flightsTotal, setFlightsTotal] = useState(0);
  const [flightsPage, setFlightsPage] = useState(1);
  const FLIGHTS_PAGE_SIZE = 10;

  useEffect(() => {
    if (!code) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getAirportDetailAggregate(code)
      .then((res) => {
        setData(res);
      })
      .catch(() => {
        setData(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [code]);

  // 加载相关航班
  useEffect(() => {
    if (!code) return;
    getAirportFlights(code, { page: flightsPage, pageSize: FLIGHTS_PAGE_SIZE })
      .then((res) => {
        setFlights(res.items ?? []);
        setFlightsTotal(res.total ?? 0);
      })
      .catch(() => {
        setFlights([]);
        setFlightsTotal(0);
      });
  }, [code, flightsPage]);

  const airport = data?.airport ?? null;
  const summary = data?.summary;
  const totalFlights = summary?.totalFlightCount ?? 0;
  const highRiskCount = summary?.highRiskCount ?? 0;
  const highRiskRatio = summary?.highRiskRatio ?? 0;

  // Inbound/Outbound — byDirection → bar chart data
  const inOutData = useMemo(() => {
    const bd = data?.byDirection;
    if (!bd) return [];
    return [
      { name: "出港高", value: bd.departure.high },
      { name: "出港中", value: bd.departure.medium },
      { name: "出港低", value: bd.departure.low },
      { name: "进港高", value: bd.arrival.high },
      { name: "进港中", value: bd.arrival.medium },
      { name: "进港低", value: bd.arrival.low },
    ];
  }, [data?.byDirection]);

  // Time bucket trend data
  const hourlyTrendData = useMemo(() => {
    return (data?.byTimeBucket ?? []).map((item) => ({
      name: item.label,
      high: item.high,
      medium: item.medium,
      low: item.low,
    }));
  }, [data?.byTimeBucket]);

  // Risk type distribution
  const riskTypeData = useMemo(() => {
    return (data?.byRiskType ?? []).map((item) => ({
      name: item.type,
      red: item.red,
      yellow: item.yellow,
      green: item.green,
    }));
  }, [data?.byRiskType]);

  const env = data?.environment;

  // Determine composite risk
  const riskLevel = summary?.riskLevel || "";
  const isHighRisk = riskLevel === "高";
  const isMediumRisk = riskLevel === "中";

  if (loading) {
    return (
      <div
        className="ad-root"
        style={{ padding: 48, textAlign: "center", color: "#94a3b8" }}
      >
        {t("加载中...", "Loading...")}
      </div>
    );
  }

  if (!airport) {
    return (
      <div
        className="ad-root"
        style={{ padding: 48, textAlign: "center", color: "#94a3b8" }}
      >
        {t("未找到机场信息", "Airport not found")}
        <div style={{ marginTop: 16 }}>
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
      </div>
    );
  }

  return (
    <div className="ad-root">
      {/* Breadcrumb */}
      <div className="ad-breadcrumb">
        <span style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
          {t("工作台", "Dashboard")}
        </span>
        <span className="ad-breadcrumb-sep">&gt;</span>
        <span
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/airport-center/airport-list")}
        >
          {t("机场", "Airports")}
        </span>
        <span className="ad-breadcrumb-sep">&gt;</span>
        <span className="ad-breadcrumb-active">
          {t("机场详情", "Airport Detail")}
        </span>
      </div>

      {/* Back Button */}
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

      {/* Header Card */}
      <div className="ad-header-card">
        <div className="ad-header-left">
          <h1 className="ad-header-title">
            {t("机场详情", "Airport Detail")}: {airport.name} ({airport.code})
          </h1>
          <div className="ad-header-row">
            {/* Composite Risk Level */}
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: "#94a3b8",
                  marginBottom: 4,
                  fontWeight: 500,
                }}
              >
                {t("综合风险等级", "Composite Risk Level")}
              </div>
              <div
                className={`ad-risk-level-box ${isHighRisk ? "ad-risk-high" : isMediumRisk ? "ad-risk-medium" : "ad-risk-low"}`}
              >
                {isHighRisk
                  ? t("高风险", "HIGH RISK")
                  : isMediumRisk
                    ? t("中风险", "MEDIUM RISK")
                    : t("低风险", "LOW RISK")}
              </div>
            </div>

            {/* Stats */}
            <div className="ad-header-stats">
              <span>
                {t("总航班", "Total Flights")}: <strong>{totalFlights}</strong>
              </span>
              <span>
                <span className="ad-stat-red">{highRiskCount}</span>{" "}
                {t("高风险航班", "High-Risk Flights")}
              </span>
              <span className="ad-stat-ratio">
                {t("高风险占比", "High Risk Ratio")}:{" "}
                <strong className="ad-stat-red">
                  {(highRiskRatio * 100).toFixed(1)}%
                </strong>
              </span>
              <span>
                {t("中风险航班", "Medium-Risk")}:{" "}
                <strong>{summary?.mediumRiskCount ?? 0}</strong>
              </span>
            </div>

            {/* Major Risk Types */}
            <div className="ad-risk-types">
              <div className="ad-risk-types-label">
                {t("主要风险类型", "Major Risk Types")}
              </div>
              <div className="ad-risk-types-tags">
                {summary?.majorRiskTypes?.length ? (
                  summary.majorRiskTypes.map((rt, i) => (
                    <span className="ad-risk-type-tag" key={i}>
                      <span className="ad-tag-icon">&#9888;</span>
                      {rt.name} ({rt.count})
                    </span>
                  ))
                ) : (
                  <span style={{ color: "#94a3b8", fontSize: 12 }}>
                    {t("暂无", "None")}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Current Environmental Summary */}
          <div className="ad-env-summary">
            <div className="ad-env-summary-label">
              {t("当前环境摘要", "Current Environmental Summary")}
            </div>
            <div className="ad-env-summary-text">
              {summary?.environmentSummary ||
                t("暂无环境数据", "No environment data")}
            </div>
            {env?.alerts && env.alerts.length > 0 && (
              <div
                style={{
                  marginTop: 6,
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                {env.alerts.map((a, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: 11,
                      padding: "2px 8px",
                      borderRadius: 4,
                      background:
                        a.level === "warn"
                          ? "rgba(234,179,8,0.15)"
                          : "rgba(239,68,68,0.15)",
                      color: a.level === "warn" ? "#eab308" : "#ef4444",
                    }}
                  >
                    {a.text}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Four Chart Cards */}
      <div className="ad-chart-grid">
        {/* 1) Inbound/Outbound Distribution */}
        <div className="ad-chart-card">
          <div className="ad-chart-card-title">
            {t("进出港分布", "Inbound/Outbound Distribution")}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={inOutData} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis dataKey="name" tick={AXIS_TICK} stroke={GRID_STROKE} />
              <YAxis tick={AXIS_TICK} stroke={GRID_STROKE} />
              <Tooltip {...darkTooltipStyle} />
              <Bar dataKey="value" fill="#60a5fa" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 2) Time Bucket Trend */}
        <div className="ad-chart-card">
          <div className="ad-chart-card-title">
            {t("时段风险趋势", "Time Bucket Risk Trend")}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={hourlyTrendData} barSize={12}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis dataKey="name" tick={AXIS_TICK} stroke={GRID_STROKE} />
              <YAxis tick={AXIS_TICK} stroke={GRID_STROKE} />
              <Tooltip {...darkTooltipStyle} />
              <Bar
                dataKey="high"
                stackId="a"
                fill="#ef4444"
                name={t("高", "High")}
              />
              <Bar
                dataKey="medium"
                stackId="a"
                fill="#eab308"
                name={t("中", "Medium")}
              />
              <Bar
                dataKey="low"
                stackId="a"
                fill="#22c55e"
                name={t("低", "Low")}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 3) Risk Type Distribution (horizontal) */}
        <div className="ad-chart-card">
          <div className="ad-chart-card-title">
            {t("风险类型分布", "Risk Type Distribution")}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={riskTypeData} layout="vertical" barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis type="number" tick={AXIS_TICK} stroke={GRID_STROKE} />
              <YAxis
                dataKey="name"
                type="category"
                tick={AXIS_TICK}
                width={60}
                stroke={GRID_STROKE}
              />
              <Tooltip {...darkTooltipStyle} />
              <Bar
                dataKey="red"
                stackId="a"
                fill="#ef4444"
                name={t("高", "High")}
              />
              <Bar
                dataKey="yellow"
                stackId="a"
                fill="#eab308"
                name={t("中", "Medium")}
              />
              <Bar
                dataKey="green"
                stackId="a"
                fill="#22c55e"
                name={t("低", "Low")}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 4) Environmental Risk Summary */}
        <div className="ad-chart-card">
          <div className="ad-chart-card-title">
            {t("环境风险摘要", "Environmental Risk Summary")}
          </div>
          <div className="ad-gauge-row">
            <GaugeArc
              value={env?.windSpeedKt ?? 0}
              max={60}
              label={t("风速", "Wind Speed")}
              unit="kt"
              color="#60a5fa"
            />
            <GaugeArc
              value={env?.visibilityKm ?? 0}
              max={10}
              label={t("能见度", "Visibility")}
              unit="km"
              color="#eab308"
            />
          </div>
          <div className="ad-env-alerts">
            {env?.alerts?.map((a, i) => (
              <div className="ad-env-alert-item" key={i}>
                <span className="ad-env-alert-icon">&#9888;</span>
                {a.text}
              </div>
            ))}
            {env && (
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                {t("云底高", "Cloud Base")}: {env.cloudBaseM}m
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related Flight List */}
      <div className="ad-table-card">
        <div className="ad-table-card-title">
          {t("相关航班列表", "Related Flight List")} ({flightsTotal})
        </div>
        <table className="ad-table">
          <thead>
            <tr>
              <th>{t("航班号", "Flight No.")}</th>
              <th>{t("出发机场", "Origin")}</th>
              <th>{t("到达机场", "Destination")}</th>
              <th>{t("起飞时间", "Departure Time")}</th>
              <th>{t("降落时间", "Arrival Time")}</th>
              <th>{t("延误", "Delay")}</th>
              <th>{t("状态", "Status")}</th>
              <th>{t("风险等级", "Risk Level")}</th>
              <th>{t("风险标签", "Risk Tags")}</th>
            </tr>
          </thead>
          <tbody>
            {flights.map((f) => (
              <tr
                key={f.id}
                style={{ cursor: "pointer" }}
                onClick={() =>
                  navigate(`/risk-monitoring/flight-detail?id=${f.id}`)
                }
              >
                <td style={{ fontWeight: 600 }}>{f.flightNo}</td>
                <td>
                  <span
                    style={{ color: "#60a5fa", cursor: "pointer" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(
                        `/airport-center/airport-detail?code=${f.departureAirport?.code || ""}`,
                      );
                    }}
                  >
                    {f.departureAirport?.code || "—"}
                  </span>
                </td>
                <td>
                  <span
                    style={{ color: "#60a5fa", cursor: "pointer" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(
                        `/airport-center/airport-detail?code=${f.arrivalAirport?.code || ""}`,
                      );
                    }}
                  >
                    {f.arrivalAirport?.code || "—"}
                  </span>
                </td>
                <td>
                  {f.departureTime
                    ? new Date(f.departureTime).toLocaleString("zh-CN", {
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </td>
                <td>
                  {f.arrivalTime
                    ? new Date(f.arrivalTime).toLocaleString("zh-CN", {
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </td>
                <td>{f.delayMinutes ? `${f.delayMinutes}min` : "—"}</td>
                <td>{f.status || "—"}</td>
                <td>
                  <span
                    style={{
                      color:
                        f.riskLevel === "高"
                          ? "#ef4444"
                          : f.riskLevel === "中"
                            ? "#eab308"
                            : "#22c55e",
                    }}
                  >
                    {f.riskLevel || "—"}
                  </span>
                </td>
                <td>{f.riskTags || "—"}</td>
              </tr>
            ))}
            {flights.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  style={{ textAlign: "center", color: "#94a3b8", padding: 24 }}
                >
                  {t("暂无航班数据", "No flight data available")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {flightsTotal > FLIGHTS_PAGE_SIZE && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 8,
              padding: "12px 0",
            }}
          >
            <button
              disabled={flightsPage <= 1}
              onClick={() => setFlightsPage((p) => p - 1)}
              style={{
                background: "rgba(71,85,105,0.5)",
                border: "1px solid rgba(148,163,184,0.2)",
                color: "#e2e8f0",
                borderRadius: 4,
                padding: "2px 10px",
                cursor: "pointer",
              }}
            >
              &lsaquo;
            </button>
            <span
              style={{ color: "#94a3b8", fontSize: 12, lineHeight: "28px" }}
            >
              {flightsPage} / {Math.ceil(flightsTotal / FLIGHTS_PAGE_SIZE)}
            </span>
            <button
              disabled={
                flightsPage >= Math.ceil(flightsTotal / FLIGHTS_PAGE_SIZE)
              }
              onClick={() => setFlightsPage((p) => p + 1)}
              style={{
                background: "rgba(71,85,105,0.5)",
                border: "1px solid rgba(148,163,184,0.2)",
                color: "#e2e8f0",
                borderRadius: 4,
                padding: "2px 10px",
                cursor: "pointer",
              }}
            >
              &rsaquo;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
