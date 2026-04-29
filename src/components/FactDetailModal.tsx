import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  getFlightFactDetail,
  type FlightFactDetail,
  type FactDetailBlock,
  type FactDetailChart,
} from "../api/flight";

const GRID_STROKE = "rgba(148,163,184,0.1)";
const AXIS_TICK = { fontSize: 10, fill: "#94a3b8" };
const LINE_COLORS = [
  "#3b82f6",
  "#f97316",
  "#22c55e",
  "#eab308",
  "#8b5cf6",
  "#ef4444",
];

const FIELD_LABELS: Record<string, string> = {
  radioAltitudeFt: "无线电高度(ft)",
  iasKt: "表速(kt)",
  speedMarginKt: "速度裕度(kt)",
  descentRateFpm: "下降率(fpm)",
  pitchDeg: "俯仰角(°)",
  rollP95Deg: "滚转P95(°)",
  groundSpeedKt: "地速(kt)",
  verticalDeviationFt: "垂直偏差(ft)",
};

function FactChart({ chart }: { chart: FactDetailChart }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "#e2e8f0",
          marginBottom: 8,
        }}
      >
        {chart.title}
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart
          data={chart.points}
          margin={{ top: 8, right: 20, bottom: 8, left: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
          <XAxis
            dataKey={chart.xField}
            tick={{ ...AXIS_TICK, fontSize: 9 }}
            axisLine={{ stroke: GRID_STROKE }}
            tickLine={false}
            angle={-20}
            textAnchor="end"
            height={40}
            interval={0}
          />
          <YAxis
            tick={AXIS_TICK}
            axisLine={{ stroke: GRID_STROKE }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "#1e293b",
              border: "1px solid rgba(148,163,184,0.2)",
              borderRadius: 6,
              color: "#e2e8f0",
              fontSize: 11,
            }}
            itemStyle={{ color: "#e2e8f0" }}
            labelStyle={{ color: "#94a3b8" }}
          />
          <Legend wrapperStyle={{ fontSize: 10, color: "#94a3b8" }} />
          {chart.yFields.map((field, i) => (
            <Line
              key={field}
              type="monotone"
              dataKey={field}
              name={FIELD_LABELS[field] || field}
              stroke={LINE_COLORS[i % LINE_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function BlockRenderer({ block }: { block: FactDetailBlock }) {
  if (block.type === "paragraph") {
    return (
      <p
        style={{
          fontSize: 13,
          color: "#cbd5e1",
          lineHeight: 1.8,
          margin: "8px 0",
        }}
      >
        {block.text}
      </p>
    );
  }
  if (block.type === "table" && block.columns && block.rows) {
    return (
      <div style={{ marginBottom: 16 }}>
        {block.title && (
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#e2e8f0",
              marginBottom: 6,
            }}
          >
            {block.title}
          </div>
        )}
        <div style={{ overflowX: "auto" }}>
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}
          >
            <thead>
              <tr>
                {block.columns.map((col) => (
                  <th
                    key={col}
                    style={{
                      textAlign: "left",
                      padding: "6px 10px",
                      borderBottom: "1px solid rgba(148,163,184,0.15)",
                      color: "#94a3b8",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i}>
                  {block.columns!.map((col) => (
                    <td
                      key={col}
                      style={{
                        padding: "5px 10px",
                        borderBottom: "1px solid rgba(148,163,184,0.06)",
                        color: "#e2e8f0",
                      }}
                    >
                      {row[col] ?? "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
  if (block.type === "list" && block.items) {
    return (
      <ul
        style={{
          fontSize: 13,
          color: "#cbd5e1",
          lineHeight: 1.8,
          paddingLeft: 20,
          margin: "8px 0",
        }}
      >
        {block.items.map((item, i) => {
          const isHeader = ["符合项", "偏差项", "需持续关注项"].includes(item);
          return isHeader ? (
            <li
              key={i}
              style={{
                fontWeight: 700,
                color: "#e2e8f0",
                listStyle: "none",
                marginTop: 8,
              }}
            >
              {item}
            </li>
          ) : (
            <li key={i}>{item}</li>
          );
        })}
      </ul>
    );
  }
  if (block.type === "chart" && block.chart) {
    return <FactChart chart={block.chart} />;
  }
  return null;
}

export function FactDetailModal({
  flightId,
  onClose,
  t,
}: {
  flightId: number;
  onClose: () => void;
  t: (zh: string, en: string) => string;
}) {
  const [data, setData] = useState<FlightFactDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getFlightFactDetail(flightId)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [flightId]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#0f172a",
          border: "1px solid rgba(148,163,184,0.15)",
          borderRadius: 12,
          width: "90%",
          maxWidth: 900,
          maxHeight: "90vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 20px",
            borderBottom: "1px solid rgba(148,163,184,0.1)",
          }}
        >
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0" }}>
              {data?.title || t("航班事实报告", "Flight Fact Report")}
            </div>
            {data?.subtitle && (
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                {data.subtitle}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#94a3b8",
              fontSize: 20,
              cursor: "pointer",
              padding: "4px 8px",
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          {loading ? (
            <div style={{ padding: 60, textAlign: "center", color: "#64748b" }}>
              {t("加载中...", "Loading...")}
            </div>
          ) : !data ? (
            <div style={{ padding: 60, textAlign: "center", color: "#64748b" }}>
              {t("暂无报告数据", "No report data")}
            </div>
          ) : (
            <>
              {/* Sections */}
              {data.sections.map((section) => (
                <div key={section.id} style={{ marginBottom: 24 }}>
                  <h3
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: "#f8fafc",
                      borderLeft: "3px solid #3b82f6",
                      paddingLeft: 10,
                      marginBottom: 12,
                    }}
                  >
                    {section.title}
                  </h3>
                  {section.blocks.map((block, i) => (
                    <BlockRenderer key={i} block={block} />
                  ))}
                </div>
              ))}

              {/* Standalone charts */}
              {data.charts.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h3
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: "#f8fafc",
                      borderLeft: "3px solid #f97316",
                      paddingLeft: 10,
                      marginBottom: 12,
                    }}
                  >
                    {t("飞行数据图表", "Flight Data Charts")}
                  </h3>
                  {data.charts.map((chart) => (
                    <FactChart key={chart.id} chart={chart} />
                  ))}
                </div>
              )}

              {/* Footer */}
              <div
                style={{
                  fontSize: 11,
                  color: "#64748b",
                  textAlign: "center",
                  padding: "12px 0",
                  borderTop: "1px solid rgba(148,163,184,0.08)",
                }}
              >
                {t("报告生成时间", "Generated at")}: {data.generatedAt}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
