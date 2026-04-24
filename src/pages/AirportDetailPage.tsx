import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getAirportDetail } from "../api/airport";
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

const RISK_COLORS = {
  red: "#dc2626",
  yellow: "#eab308",
  green: "#22c55e",
};

// ===== Helpers =====

function getRiskBadgeCls(zone: string): string {
  if (zone === "red") return "ad-badge-red";
  if (zone === "yellow") return "ad-badge-yellow";
  return "ad-badge-green";
}

function getRiskLabel(
  zone: string,
  t: (zh: string, en: string) => string,
): string {
  if (zone === "red") return t("高", "High");
  if (zone === "yellow") return t("中", "Medium");
  return t("低", "Low");
}

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
  const pct = Math.min(value / max, 1);
  const r = 36;
  const cx = 50;
  const cy = 46;
  // Arc from 180deg to 0deg (left to right, semicircle)
  const startAngle = Math.PI;
  const endAngle = Math.PI * (1 - pct);
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy - r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy - r * Math.sin(endAngle);
  const largeArc = pct > 0.5 ? 1 : 0;

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
        {/* Value arc */}
        {pct > 0 && (
          <path
            d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`}
            fill="none"
            stroke={color}
            strokeWidth="7"
            strokeLinecap="round"
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
          {value}
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

interface AirportDetailData {
  id: number;
  code: string;
  name: string;
  totalFlightCount: number;
  highRiskFlightRatio: string;
  topRisk: string | null;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  createdAt: string;
  updatedAt: string;
}

export function AirportDetailPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code") || "";

  const [airport, setAirport] = useState<AirportDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getAirportDetail(code)
      .then((res: any) => {
        setAirport(res);
      })
      .catch(() => {
        setAirport(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [code]);

  // Derive risk counts from API data
  const highRiskRatio = airport
    ? parseFloat(airport.highRiskFlightRatio) || 0
    : 0;
  const totalFlights = airport ? airport.totalFlightCount : 0;
  const highRiskCount = Math.round(totalFlights * highRiskRatio);
  const medRiskCount = Math.round(totalFlights * 0.15); // mock medium ratio
  const lowRiskCount = Math.max(totalFlights - highRiskCount - medRiskCount, 0);

  const riskCounts = {
    red: highRiskCount,
    yellow: medRiskCount,
    green: lowRiskCount,
  };

  // Inbound/Outbound risk data (mock split)
  const inOutData = useMemo(() => {
    const half = (v: number) => Math.round(v / 2);
    return [
      {
        name: t("进港", "Inbound"),
        red: half(riskCounts.red),
        yellow: half(riskCounts.yellow),
        green: half(riskCounts.green),
      },
      {
        name: t("出港", "Outbound"),
        red: riskCounts.red - half(riskCounts.red),
        yellow: riskCounts.yellow - half(riskCounts.yellow),
        green: riskCounts.green - half(riskCounts.green),
      },
    ];
  }, [riskCounts.red, riskCounts.yellow, riskCounts.green, t]);

  // Time period risk data (mock distribution)
  const timePeriodData = useMemo(() => {
    const periods = [
      t("24小时", "24 hrs"),
      t("6小时", "6 hr"),
      t("6小时", "6 hr"),
      t("12小时", "12 hr"),
      t("16小时", "16 hr"),
      t("24小时", "24 hr"),
    ];
    return periods.map((label, i) => {
      const seed = i + 1;
      const red = Math.round(riskCounts.red * (seed * 0.15 + 0.1));
      const yellow = Math.round((totalFlights * 0.1 * seed) / periods.length);
      const green = Math.round(
        (totalFlights * 0.2 * (periods.length - i)) / periods.length,
      );
      return { name: label, red, yellow, green };
    });
  }, [totalFlights, riskCounts.red, t]);

  // Risk type distribution data (horizontal)
  const riskTypeData = useMemo(() => {
    return [
      {
        name: t("天气", "Weather"),
        red: Math.round(riskCounts.red * 0.4),
        yellow: Math.round(riskCounts.yellow * 0.2 + 2),
        green: Math.round(riskCounts.green * 0.1),
      },
      {
        name: t("交通", "Traffic"),
        red: Math.round(riskCounts.red * 0.25),
        yellow: Math.round(riskCounts.yellow * 0.3 + 1),
        green: Math.round(riskCounts.green * 0.15),
      },
      {
        name: t("技术", "Technical"),
        red: Math.round(riskCounts.red * 0.15),
        yellow: Math.round(riskCounts.yellow * 0.25),
        green: Math.round(riskCounts.green * 0.2),
      },
      {
        name: t("安全", "Security"),
        red: Math.round(riskCounts.red * 0.1),
        yellow: Math.round(riskCounts.yellow * 0.15),
        green: Math.round(riskCounts.green * 0.25),
      },
      {
        name: t("其他", "Other"),
        red: Math.round(riskCounts.red * 0.1),
        yellow: Math.round(riskCounts.yellow * 0.1),
        green: Math.round(riskCounts.green * 0.3),
      },
    ];
  }, [riskCounts.red, riskCounts.yellow, riskCounts.green, t]);

  // Determine composite risk from API riskLevel
  const isHighRisk = airport?.riskLevel === "HIGH";
  const isMediumRisk = airport?.riskLevel === "MEDIUM";

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
                <span className="ad-stat-red">{riskCounts.red}</span>{" "}
                {t("高风险航班", "High-Risk Flights")}
              </span>
              <span>
                <span className="ad-stat-yellow">{riskCounts.yellow}</span>{" "}
                {t("中风险航班", "Medium-Risk Flights")}
              </span>
              <span className="ad-stat-ratio">
                {t("高风险占比", "High Risk Ratio")}:{" "}
                <strong className="ad-stat-red">
                  {(highRiskRatio * 100).toFixed(1)}%
                </strong>
              </span>
              <span className="ad-stat-ratio">
                {t("中风险占比", "Med Risk Ratio")}:{" "}
                <strong className="ad-stat-yellow">
                  {totalFlights > 0
                    ? ((riskCounts.yellow / totalFlights) * 100).toFixed(1)
                    : 0}
                  %
                </strong>
              </span>
            </div>

            {/* Major Risk Types */}
            <div className="ad-risk-types">
              <div className="ad-risk-types-label">
                {t("首要风险", "Top Risk")}
              </div>
              <div className="ad-risk-types-tags">
                {airport.topRisk ? (
                  <span className="ad-risk-type-tag">
                    <span className="ad-tag-icon">&#9888;</span>
                    {airport.topRisk}
                  </span>
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
              {t(
                `天气：局部雷暴活动，能见度下降至3km，云底高800m，阵风达25kt。交通：进场延误约15分钟，跑道容量下降20%。`,
                `Weather: Localized thunderstorm activity, visibility reduced to 3km, cloud ceiling 800m, gusts up to 25kt. Traffic: Approach delay ~15 min, runway capacity reduced by 20%.`,
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Four Chart Cards */}
      <div className="ad-chart-grid">
        {/* 1) Inbound/Outbound Risk Distribution */}
        <div className="ad-chart-card">
          <div className="ad-chart-card-title">
            {t("进出港风险分布", "Inbound/Outbound Risk Distribution")}
          </div>
          <div className="ad-chart-legend">
            {[
              { color: RISK_COLORS.red, label: t("高", "High") },
              { color: RISK_COLORS.yellow, label: t("中", "Medium") },
              { color: RISK_COLORS.green, label: t("低", "Low") },
            ].map((item) => (
              <span key={item.color} className="ad-chart-legend-item">
                <span
                  className="ad-chart-legend-dot"
                  style={{ background: item.color }}
                />
                {item.label}
              </span>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={inOutData} barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis dataKey="name" tick={AXIS_TICK} stroke={GRID_STROKE} />
              <YAxis tick={AXIS_TICK} stroke={GRID_STROKE} />
              <Tooltip {...darkTooltipStyle} />
              <Bar dataKey="red" fill={RISK_COLORS.red} />
              <Bar dataKey="yellow" fill={RISK_COLORS.yellow} />
              <Bar dataKey="green" fill={RISK_COLORS.green} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 2) Time-Period Risk Distribution */}
        <div className="ad-chart-card">
          <div className="ad-chart-card-title">
            {t("时间段风险分布", "Time-Period Risk Distribution")}
          </div>
          <div className="ad-chart-legend">
            {[
              { color: RISK_COLORS.red, label: t("高", "High") },
              { color: RISK_COLORS.yellow, label: t("中", "Medium") },
              { color: RISK_COLORS.green, label: t("低", "Low") },
            ].map((item) => (
              <span key={item.color} className="ad-chart-legend-item">
                <span
                  className="ad-chart-legend-dot"
                  style={{ background: item.color }}
                />
                {item.label}
              </span>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={timePeriodData} barSize={10}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis dataKey="name" tick={AXIS_TICK} stroke={GRID_STROKE} />
              <YAxis tick={AXIS_TICK} stroke={GRID_STROKE} />
              <Tooltip {...darkTooltipStyle} />
              <Bar dataKey="red" fill={RISK_COLORS.red} />
              <Bar dataKey="yellow" fill={RISK_COLORS.yellow} />
              <Bar dataKey="green" fill={RISK_COLORS.green} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 3) Major Risk Type Distribution (horizontal) */}
        <div className="ad-chart-card">
          <div className="ad-chart-card-title">
            {t("主要风险类型分布", "Major Risk Type Distribution")}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={riskTypeData} layout="vertical" barSize={12}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis type="number" tick={AXIS_TICK} stroke={GRID_STROKE} />
              <YAxis
                dataKey="name"
                type="category"
                tick={AXIS_TICK}
                width={50}
                stroke={GRID_STROKE}
              />
              <Tooltip {...darkTooltipStyle} />
              <Legend
                iconSize={8}
                wrapperStyle={{ fontSize: 10, color: "#94a3b8" }}
              />
              <Bar dataKey="red" stackId="a" fill={RISK_COLORS.red} />
              <Bar dataKey="yellow" stackId="a" fill={RISK_COLORS.yellow} />
              <Bar dataKey="green" stackId="a" fill={RISK_COLORS.green} />
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
              value={25}
              max={60}
              label={t("风速", "Wind Speed")}
              unit="kt"
              color="#60a5fa"
            />
            <GaugeArc
              value={3}
              max={10}
              label={t("能见度", "Visibility")}
              unit="km"
              color="#eab308"
            />
            <GaugeArc
              value={800}
              max={3000}
              label={t("云底高", "Cloud Ceiling")}
              unit="m"
              color="#22c55e"
            />
          </div>
          <div className="ad-env-alerts">
            <div className="ad-env-alert-item">
              <span className="ad-env-alert-icon">&#9888;</span>
              {t(
                "雷暴警告 - 局部强对流活动",
                "Thunderstorm Warning - Localized severe convective activity",
              )}
            </div>
            <div className="ad-env-alert-item">
              <span className="ad-env-alert-icon">&#9888;</span>
              {t(
                "低能见度警告 - 能见度低于5km",
                "Low Visibility Alert - Visibility below 5km",
              )}
            </div>
            <div className="ad-env-alert-item">
              <span className="ad-env-alert-icon">&#9888;</span>
              {t(
                "风切变提示 - 进近区域存在风切变",
                "Wind Shear Advisory - Wind shear in approach area",
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Related Flight List */}
      <div className="ad-table-card">
        <div className="ad-table-card-title">
          {t("相关航班列表", "Related Flight List")}
        </div>
        <table className="ad-table">
          <thead>
            <tr>
              <th>{t("航班号", "Flight No.")}</th>
              <th>{t("出发地", "Origin")}</th>
              <th>{t("目的地", "Destination")}</th>
              <th>{t("起飞时间", "Departure Time")}</th>
              <th>{t("降落时间", "Arrival Time")}</th>
              <th>{t("当前状态", "Current Status")}</th>
              <th>{t("风险等级", "Risk Level")}</th>
              <th>{t("风险原因", "Risk Reasons")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {totalFlights === 0 && (
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
      </div>
    </div>
  );
}
