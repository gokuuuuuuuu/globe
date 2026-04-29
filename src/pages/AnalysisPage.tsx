/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useLanguage } from "../i18n/useLanguage";
import { getDashboardAnalysis, type DashboardAnalysis } from "../api/dashboard";

const GRID = "rgba(148,163,184,0.1)";
const TICK = { fontSize: 10, fill: "#94a3b8" };
const TT = {
  contentStyle: {
    background: "#1e293b",
    border: "1px solid rgba(148,163,184,0.2)",
    borderRadius: 6,
    color: "#e2e8f0",
    fontSize: 11,
  },
  itemStyle: { color: "#e2e8f0" },
};
const PIE_COLORS = ["#ef4444", "#eab308", "#22c55e"];

export function AnalysisPage() {
  const { t } = useLanguage();
  const [data, setData] = useState<DashboardAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardAnalysis()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div style={{ padding: 60, textAlign: "center", color: "#64748b" }}>
        {t("加载中...", "Loading...")}
      </div>
    );
  if (!data)
    return (
      <div style={{ padding: 60, textAlign: "center", color: "#64748b" }}>
        {t("暂无数据", "No data")}
      </div>
    );

  const { summary, statCards, charts, tables } = data;
  const riskPie = [
    {
      name: t("高风险", "High"),
      value: summary.redRiskFlights,
      color: "#ef4444",
    },
    {
      name: t("中风险", "Medium"),
      value: summary.yellowRiskFlights,
      color: "#eab308",
    },
    {
      name: t("正常", "Normal"),
      value: summary.greenRiskFlights,
      color: "#22c55e",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Stat Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 12,
        }}
      >
        {statCards.map((c) => (
          <div
            key={c.key}
            style={{
              background: "rgba(15,23,42,0.5)",
              borderRadius: 10,
              border: "1px solid rgba(148,163,184,0.08)",
              padding: "14px 16px",
            }}
          >
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>
              {c.label}
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: c.color || "#e2e8f0",
              }}
            >
              {c.valueText}
            </div>
            {c.change && (
              <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>
                {c.change}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Row 1: Risk Pie + Forecast */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16 }}>
        <div
          style={{
            background: "rgba(15,23,42,0.5)",
            borderRadius: 10,
            border: "1px solid rgba(148,163,184,0.08)",
            padding: 16,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#e2e8f0",
              marginBottom: 8,
            }}
          >
            {t("风险等级分布", "Risk Distribution")}
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={riskPie}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={70}
                innerRadius={40}
                strokeWidth={0}
              >
                {riskPie.map((e, i) => (
                  <Cell key={i} fill={PIE_COLORS[i]} />
                ))}
              </Pie>
              <Legend wrapperStyle={{ fontSize: 10, color: "#94a3b8" }} />
              <Tooltip {...TT} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div
          style={{
            background: "rgba(15,23,42,0.5)",
            borderRadius: 10,
            border: "1px solid rgba(148,163,184,0.08)",
            padding: 16,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#e2e8f0",
              marginBottom: 8,
            }}
          >
            {t("风险趋势预测", "Risk Forecast")}
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={charts.riskForecastData}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
              <XAxis
                dataKey="time"
                tick={TICK}
                axisLine={{ stroke: GRID }}
                tickLine={false}
              />
              <YAxis tick={TICK} axisLine={{ stroke: GRID }} tickLine={false} />
              <Tooltip {...TT} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Line
                type="monotone"
                dataKey="high"
                stroke="#ef4444"
                name={t("高", "High")}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="medium"
                stroke="#eab308"
                name={t("中", "Medium")}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="low"
                stroke="#22c55e"
                name={t("低", "Low")}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Division + Squadron */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div
          style={{
            background: "rgba(15,23,42,0.5)",
            borderRadius: 10,
            border: "1px solid rgba(148,163,184,0.08)",
            padding: 16,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#e2e8f0",
              marginBottom: 8,
            }}
          >
            {t("各单位风险分布", "Division Risk")}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={charts.divisionData} barSize={14}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={GRID}
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ ...TICK, fontSize: 9 }}
                axisLine={{ stroke: GRID }}
                tickLine={false}
              />
              <YAxis tick={TICK} axisLine={{ stroke: GRID }} tickLine={false} />
              <Tooltip {...TT} />
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
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div
          style={{
            background: "rgba(15,23,42,0.5)",
            borderRadius: 10,
            border: "1px solid rgba(148,163,184,0.08)",
            padding: 16,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#e2e8f0",
              marginBottom: 8,
            }}
          >
            {t("中队风险分布", "Squadron Risk")}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={charts.squadronData} barSize={14}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={GRID}
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ ...TICK, fontSize: 9 }}
                axisLine={{ stroke: GRID }}
                tickLine={false}
              />
              <YAxis tick={TICK} axisLine={{ stroke: GRID }} tickLine={false} />
              <Tooltip {...TT} />
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
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3: High Risk Trend + Risk Type */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div
          style={{
            background: "rgba(15,23,42,0.5)",
            borderRadius: 10,
            border: "1px solid rgba(148,163,184,0.08)",
            padding: 16,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#e2e8f0",
              marginBottom: 8,
            }}
          >
            {t("高风险航班趋势", "High Risk Trend")}
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={charts.highRiskTrendData} barSize={20}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={GRID}
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tick={TICK}
                axisLine={{ stroke: GRID }}
                tickLine={false}
              />
              <YAxis tick={TICK} axisLine={{ stroke: GRID }} tickLine={false} />
              <Tooltip {...TT} />
              <Bar
                dataKey="value"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
                name={t("高风险", "High Risk")}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div
          style={{
            background: "rgba(15,23,42,0.5)",
            borderRadius: 10,
            border: "1px solid rgba(148,163,184,0.08)",
            padding: 16,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#e2e8f0",
              marginBottom: 8,
            }}
          >
            {t("风险类型 TOP", "Risk Type TOP")}
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={charts.riskTypeData} layout="vertical" barSize={14}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={GRID}
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={TICK}
                axisLine={{ stroke: GRID }}
                tickLine={false}
              />
              <YAxis
                dataKey="name"
                type="category"
                width={100}
                tick={{ ...TICK, fontSize: 9 }}
                axisLine={{ stroke: GRID }}
                tickLine={false}
              />
              <Tooltip {...TT} />
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

      {/* Row 4: Factor Tables */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {[
          {
            title: t("人为因素", "Human Factor"),
            data: tables.humanFactorData,
            key: "factor",
          },
          {
            title: t("飞机因素", "Aircraft Factor"),
            data: tables.aircraftFactorData,
            key: "factor",
          },
          {
            title: t("环境因素", "Environment Factor"),
            data: tables.envFactorData,
            key: "factor",
          },
          {
            title: t("综合致因", "Composite Cause"),
            data: tables.compositeData,
            key: "cause",
          },
        ].map((tbl) => (
          <div
            key={tbl.title}
            style={{
              background: "rgba(15,23,42,0.5)",
              borderRadius: 10,
              border: "1px solid rgba(148,163,184,0.08)",
              padding: 16,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#e2e8f0",
                marginBottom: 8,
              }}
            >
              {tbl.title}
            </div>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 11,
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "4px 8px",
                      borderBottom: "1px solid rgba(148,163,184,0.1)",
                      color: "#94a3b8",
                    }}
                  >
                    {tbl.key === "cause"
                      ? t("致因组合", "Cause")
                      : t("因素", "Factor")}
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "4px 8px",
                      borderBottom: "1px solid rgba(148,163,184,0.1)",
                      color: "#94a3b8",
                    }}
                  >
                    Top N
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "4px 8px",
                      borderBottom: "1px solid rgba(148,163,184,0.1)",
                      color: "#94a3b8",
                    }}
                  >
                    {t("风险", "Risk")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {tbl.data.map((r: any, i: number) => (
                  <tr key={i}>
                    <td
                      style={{
                        padding: "4px 8px",
                        borderBottom: "1px solid rgba(148,163,184,0.04)",
                        color: "#e2e8f0",
                      }}
                    >
                      {r[tbl.key]}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        padding: "4px 8px",
                        borderBottom: "1px solid rgba(148,163,184,0.04)",
                        color: "#94a3b8",
                      }}
                    >
                      {r.topN}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        padding: "4px 8px",
                        borderBottom: "1px solid rgba(148,163,184,0.04)",
                        color: "#94a3b8",
                      }}
                    >
                      {r.risk}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ fontSize: 10, color: "#64748b", textAlign: "center" }}>
        {t("报告生成时间", "Generated")}: {data.generatedAt} |{" "}
        {t("时间窗口", "Window")}: {data.window.hours}h
      </div>
    </div>
  );
}
