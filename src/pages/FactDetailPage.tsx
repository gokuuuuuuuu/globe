import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { useLanguage } from "../i18n/useLanguage";
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
    <div
      style={{
        marginBottom: 24,
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
          marginBottom: 10,
        }}
      >
        {chart.title}
      </div>
      <ResponsiveContainer width="100%" height={260}>
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
                marginTop: 12,
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

export function FactDetailPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const flightId = searchParams.get("id");
  const [data, setData] = useState<FlightFactDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!flightId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getFlightFactDetail(Number(flightId))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [flightId]);

  return (
    <div style={{ height: "100vh", overflow: "auto", color: "#e2e8f0" }}>
      {/* Header */}
      <div
        style={{
          padding: "16px 24px",
          borderBottom: "1px solid rgba(148,163,184,0.1)",
          display: "flex",
          alignItems: "center",
          gap: 16,
          position: "sticky",
          top: 0,
          background: "rgba(0,0,0,0.95)",
          backdropFilter: "blur(8px)",
          zIndex: 10,
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "rgba(71,85,105,0.5)",
            border: "1px solid rgba(148,163,184,0.2)",
            color: "#e2e8f0",
            borderRadius: 6,
            padding: "6px 16px",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          {t("返回", "Back")}
        </button>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
            {data?.title || t("航班事实报告", "Flight Fact Report")}
          </h1>
          {data?.subtitle && (
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
              {data.subtitle}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px" }}>
        {loading ? (
          <div style={{ padding: 80, textAlign: "center", color: "#64748b" }}>
            {t("加载中...", "Loading...")}
          </div>
        ) : !data ? (
          <div style={{ padding: 80, textAlign: "center", color: "#64748b" }}>
            {t("暂无报告数据", "No report data")}
          </div>
        ) : (
          <>
            {/* Sections */}
            {data.sections.map((section) => (
              <div key={section.id} style={{ marginBottom: 32 }}>
                <h2
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#f8fafc",
                    borderLeft: "3px solid #3b82f6",
                    paddingLeft: 12,
                    marginBottom: 16,
                  }}
                >
                  {section.title}
                </h2>
                {section.blocks.map((block, i) => (
                  <BlockRenderer key={i} block={block} />
                ))}
              </div>
            ))}

            {/* Standalone charts */}
            {data.charts.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <h2
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#f8fafc",
                    borderLeft: "3px solid #f97316",
                    paddingLeft: 12,
                    marginBottom: 16,
                  }}
                >
                  {t("飞行数据图表", "Flight Data Charts")}
                </h2>
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
                padding: "16px 0",
                borderTop: "1px solid rgba(148,163,184,0.08)",
              }}
            >
              {t("报告生成时间", "Generated at")}: {data.generatedAt}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
