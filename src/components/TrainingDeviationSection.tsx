import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type {
  TrainingDeviationItem,
  TrainingDeviationAnalysis,
  TrainingDeviationChart,
} from "../api/flightPerson";

const MECHANISM_LABELS: Record<
  string,
  { zh: string; en: string; color: string }
> = {
  cog: { zh: "注意认知", en: "Cognitive Attention", color: "#8b5cf6" },
  act: { zh: "操纵输入", en: "Control Input", color: "#3b82f6" },
  trans: {
    zh: "轨迹状态变化",
    en: "Trajectory State Change",
    color: "#f97316",
  },
};

const GRID_STROKE = "rgba(148,163,184,0.1)";
const AXIS_TICK = { fontSize: 10, fill: "#94a3b8" };

/** 渲染柱状图（recharts） */
function DeviationBarChart({
  chart,
  color,
}: {
  chart: TrainingDeviationChart;
  color: string;
}) {
  const data = chart.bars.map((b) => ({
    name: b.label,
    value: b.value,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={data}
        margin={{ top: 8, right: 12, bottom: 40, left: 12 }}
        barSize={28}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={GRID_STROKE}
          vertical={false}
        />
        <XAxis
          dataKey="name"
          tick={{ ...AXIS_TICK, fontSize: 9 }}
          axisLine={{ stroke: GRID_STROKE }}
          tickLine={false}
          angle={-30}
          textAnchor="end"
          interval={0}
          height={50}
        />
        <YAxis
          tick={AXIS_TICK}
          axisLine={{ stroke: GRID_STROKE }}
          tickLine={false}
          unit={chart.unit === "%" ? "%" : ""}
        />
        <Tooltip
          contentStyle={{
            background: "#1e293b",
            border: "1px solid rgba(148,163,184,0.2)",
            borderRadius: 6,
            color: "#e2e8f0",
            fontSize: 12,
          }}
          itemStyle={{ color: "#e2e8f0" }}
          labelStyle={{ color: "#94a3b8", marginBottom: 2 }}
          formatter={(v) => [`${Number(v).toFixed(1)}${chart.unit}`]}
          separator=""
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={color} opacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TrainingDeviationSection({
  data,
  loading,
  t,
}: {
  data: TrainingDeviationAnalysis | null | undefined;
  loading?: boolean;
  t: (zh: string, en: string) => string;
}) {
  const [selectedItem, setSelectedItem] =
    useState<TrainingDeviationItem | null>(null);
  const [expandedCharts, setExpandedCharts] = useState<Record<string, boolean>>(
    {},
  );

  if (loading) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
          color: "#64748b",
          fontSize: 13,
        }}
      >
        {t("加载中...", "Loading...")}
      </div>
    );
  }

  if (!data || data.total === 0) {
    return (
      <div>
        <h3
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "#e2e8f0",
            marginBottom: 16,
          }}
        >
          {t("训练偏差分析", "Training Deviation Analysis")}
        </h3>
        <div
          style={{
            color: "#64748b",
            fontSize: 13,
            textAlign: "center",
            padding: 40,
          }}
        >
          {t("暂无偏差训练数据", "No deviation training data")}
        </div>
      </div>
    );
  }

  // List view
  if (!selectedItem) {
    return (
      <div>
        <h3
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "#e2e8f0",
            marginBottom: 16,
          }}
        >
          {t("训练偏差分析", "Training Deviation Analysis")}
          <span
            style={{
              fontSize: 12,
              fontWeight: 400,
              color: "#94a3b8",
              marginLeft: 8,
            }}
          >
            ({data.total})
          </span>
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {data.items.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                setSelectedItem(item);
                setExpandedCharts({});
              }}
              style={{
                background: "rgba(15,23,42,0.5)",
                border: "1px solid rgba(148,163,184,0.1)",
                borderRadius: 8,
                padding: "12px 16px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 16,
                transition: "border-color 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = "rgba(96,165,250,0.4)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = "rgba(148,163,184,0.1)")
              }
            >
              <div style={{ flex: "0 0 auto", display: "flex", gap: 6 }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#60a5fa",
                    background: "rgba(96,165,250,0.1)",
                    padding: "2px 8px",
                    borderRadius: 4,
                  }}
                >
                  {t("试次", "Trial")} {item.trialNo}
                </span>
                {item.isDeviated && (
                  <span
                    style={{
                      fontSize: 11,
                      padding: "2px 6px",
                      borderRadius: 4,
                      background: "rgba(239,68,68,0.1)",
                      color: "#ef4444",
                    }}
                  >
                    {t("偏差", "Dev")}
                  </span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 600 }}
                >
                  {item.trainingDate} · {item.seatCn || item.seat}
                </div>
                {item.overallDescription && (
                  <div
                    style={{
                      fontSize: 11,
                      color: "#94a3b8",
                      marginTop: 4,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.overallDescription}
                  </div>
                )}
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#64748b"
                strokeWidth="2"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Detail view
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <button
          onClick={() => {
            setSelectedItem(null);
            setExpandedCharts({});
          }}
          style={{
            background: "rgba(71,85,105,0.5)",
            border: "1px solid rgba(148,163,184,0.2)",
            color: "#e2e8f0",
            borderRadius: 6,
            padding: "4px 12px",
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          {t("返回列表", "Back")}
        </button>
        <h3
          style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", margin: 0 }}
        >
          {selectedItem.title}
        </h3>
      </div>

      {/* Metadata badges */}
      <div
        style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}
      >
        {selectedItem.rank && (
          <span
            style={{
              fontSize: 11,
              padding: "2px 8px",
              borderRadius: 4,
              background: "rgba(96,165,250,0.1)",
              color: "#60a5fa",
            }}
          >
            {selectedItem.rank}
          </span>
        )}
        {selectedItem.seatCn && (
          <span
            style={{
              fontSize: 11,
              padding: "2px 8px",
              borderRadius: 4,
              background: "rgba(139,92,246,0.1)",
              color: "#8b5cf6",
            }}
          >
            {selectedItem.seatCn}
          </span>
        )}
        {selectedItem.isDeviated && (
          <span
            style={{
              fontSize: 11,
              padding: "2px 8px",
              borderRadius: 4,
              background: "rgba(239,68,68,0.1)",
              color: "#ef4444",
            }}
          >
            {t("偏差轨迹", "Deviated")}
          </span>
        )}
      </div>

      {/* Overall description */}
      {selectedItem.overallDescription && (
        <div
          style={{
            background: "rgba(96,165,250,0.06)",
            border: "1px solid rgba(96,165,250,0.15)",
            borderRadius: 8,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#60a5fa",
              marginBottom: 6,
            }}
          >
            {t("总体结论", "Overall Conclusion")}
          </div>
          <div style={{ fontSize: 13, color: "#e2e8f0", lineHeight: 1.7 }}>
            {selectedItem.overallDescription}
          </div>
        </div>
      )}

      {/* Overall chart */}
      {selectedItem.charts?.overall && (
        <div
          style={{
            background: "rgba(15,23,42,0.5)",
            border: "1px solid rgba(148,163,184,0.08)",
            borderRadius: 8,
            padding: 14,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#e2e8f0",
              marginBottom: 4,
            }}
          >
            {selectedItem.charts.overall.title}
          </div>
          <DeviationBarChart
            chart={selectedItem.charts.overall}
            color="#60a5fa"
          />
        </div>
      )}

      {/* Sub-charts (collapsible) */}
      {(["cog", "act", "trans"] as const).map((key) => {
        const chart = selectedItem.charts?.[key];
        if (!chart) return null;
        const meta = MECHANISM_LABELS[key];
        const isOpen = expandedCharts[key];
        return (
          <div key={key} style={{ marginBottom: 8 }}>
            <button
              onClick={() =>
                setExpandedCharts((prev) => ({ ...prev, [key]: !prev[key] }))
              }
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "rgba(15,23,42,0.5)",
                border: "1px solid rgba(148,163,184,0.1)",
                borderRadius: 8,
                padding: "10px 14px",
                cursor: "pointer",
                color: "#e2e8f0",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <span>
                <span
                  style={{
                    display: "inline-block",
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: meta.color,
                    marginRight: 8,
                  }}
                />
                {chart.title}
              </span>
              <span style={{ color: "#64748b", fontSize: 16 }}>
                {isOpen ? "−" : "+"}
              </span>
            </button>
            {isOpen && (
              <div style={{ padding: "4px 14px 12px" }}>
                <DeviationBarChart chart={chart} color={meta.color} />
              </div>
            )}
          </div>
        );
      })}

      {/* Mechanism text entries */}
      {selectedItem.mechanisms && (
        <div style={{ marginTop: 16 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#e2e8f0",
              marginBottom: 12,
            }}
          >
            {t("机制分析结果", "Mechanism Analysis")}
          </div>
          {(["cog", "act", "trans"] as const).map((key) => {
            const mech = selectedItem.mechanisms[key];
            if (!mech) return null;
            const meta = MECHANISM_LABELS[key];
            return (
              <div
                key={key}
                style={{
                  background: "rgba(15,23,42,0.5)",
                  border: "1px solid rgba(148,163,184,0.08)",
                  borderRadius: 8,
                  padding: 14,
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: meta.color,
                      display: "inline-block",
                    }}
                  />
                  <span
                    style={{ fontSize: 13, fontWeight: 600, color: meta.color }}
                  >
                    {mech.label || t(meta.zh, meta.en)}
                  </span>
                </div>
                <div
                  style={{ fontSize: 12, color: "#cbd5e1", lineHeight: 1.6 }}
                >
                  {mech.description}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
