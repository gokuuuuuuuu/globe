import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useLanguage } from "../i18n/useLanguage";
import "./FactorExplanationPage.css";

// ===== Mock Data =====

const factorInfo = {
  factor: "Flight Duration Anomaly",
  id: "P5-FL-DUR-01",
  dimension: "Operational Reliability",
  contributionValue: 7.8,
  maxValue: 10,
  level: "High" as const,
  description:
    "Identifies flights whose duration significantly exceeds historical norms for the given route, aircraft type, and day.",
  lastAnalysisTime: "Aug 27, 8:35 PM",
  analysisMethod: "AI Engine",
  flightNumber: "QR789",
};

const appliedRules = [
  {
    condition: "Actual Duration > Route Avg + 3 SD",
    result: "Triggered",
  },
  {
    condition: "Actual Duration > Route Avg + 3 SD",
    result: "Triggered",
  },
  {
    condition: "Actual Duration > Route Avg + 3 SD",
    result: "Triggered",
  },
];

const modelFeatures = [
  {
    name: "Recorded Duration",
    description: "Recorded Duration from route duration",
    currentValue: "670m",
    threshold: "> 580m is high",
  },
  {
    name: "Route Historical Avg",
    description: "Route Historical Avg records historical avg",
    currentValue: "530m",
    threshold: "> 580m is high",
  },
  {
    name: "Aircraft Type",
    description: "Route Historical Avg, precisinal duration",
    currentValue: "Ax/s",
    threshold: "> 500m",
  },
  {
    name: "Aircraft Type",
    description: "Aircraft type and Aircraft type",
    currentValue: "DIA",
    threshold: "> 580m is high",
  },
];

const trendData = [
  { day: "Day 0", value: 0.2 },
  { day: "Day 4", value: 0.35 },
  { day: "Day 8", value: 0.55 },
  { day: "Day 12", value: 0.45 },
  { day: "Day 17", value: 0.5 },
  { day: "Day 21", value: 0.6 },
  { day: "Day 26", value: 0.85, label: "High" },
  { day: "Day 30", value: 0.9, label: "High" },
];

const peerData = [
  { name: "1", value: 20, peer: true },
  { name: "2", value: 35, peer: true },
  { name: "3", value: 50, peer: true },
  { name: "4", value: 45, peer: true },
  { name: "5", value: 80, peer: true },
  { name: "6", value: 65, peer: true },
  { name: "7", value: 55, peer: true },
  { name: "8", value: 70, peer: true },
  { name: "9", value: 90, peer: true },
  { name: "10", value: 110, peer: true },
  { name: "11", value: 130, peer: true },
  { name: "12", value: 160, peer: true },
  { name: "13", value: 200, peer: true },
  { name: "14", value: 250, peer: true },
  { name: "15", value: 300, highlight: true },
  { name: "16", value: 350, peer: true },
  { name: "17", value: 400, peer: true },
];

const relatedFlights = [
  {
    id: "QR789",
    date: "12/10.2023",
    route: "QR7 → DVA",
    score: 7.8,
    status: "High",
  },
  {
    id: "QR789-2",
    date: "12/13.2023",
    route: "DR8 → HAL",
    score: 7.8,
    status: "High",
  },
  {
    id: "QR789-8",
    date: "12/10.2023",
    route: "GR2 → PNR",
    score: null,
    status: "Similar",
  },
];

const relatedObjects = [
  {
    id: "QR7220004",
    type: "Aircraft Tail Number",
    association: "previous flight with delay",
  },
  {
    id: "QR7220002",
    type: "Crew ID",
    association: "previous flight with delay",
  },
  {
    id: "QR722003",
    type: "Crew ID",
    association: "previous flight with delay",
  },
];

const relatedRules = [
  "System policy",
  "System policies nanos EMM referencing this factor",
  "System policies nanos EMM referencing this factor",
  "System policies nanos EMM referencing this factor",
];

const GRID_STROKE = "rgba(148,163,184,0.1)";
const AXIS_TICK = { fill: "#64748b", fontSize: 11 };

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

// ===== Component =====

export function FactorExplanationPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState(0);
  const [trendRange, setTrendRange] = useState("30");

  const riskLevelText =
    factorInfo.level === "High"
      ? t("高风险", "High Risk")
      : factorInfo.level === "Medium"
        ? t("中风险", "Medium Risk")
        : t("低风险", "Low Risk");

  return (
    <div className="fe-root">
      {/* Breadcrumb */}
      <div className="fe-breadcrumb">
        MRIWP
        <span className="fe-breadcrumb-sep">&gt;</span>
        {t("风险监控", "Risk Monitoring")}
        <span className="fe-breadcrumb-sep">&gt;</span>
        <span className="fe-breadcrumb-active">
          {t("因子解释", "Factor Explanation")}
        </span>
      </div>

      {/* Page Header */}
      <div className="fe-page-header">
        <div className="fe-header-left">
          <h1 className="fe-page-title">
            {t("风险因子详细解释：", "Detailed Risk Factor Explanation: ")}
            {factorInfo.factor}
          </h1>
          <p className="fe-page-subtitle">
            {t("航班", "Flight")} {factorInfo.flightNumber}
          </p>
        </div>
        <div className="fe-header-right">
          <div className="fe-meta-item">
            <div className="fe-meta-label">
              {t("最近分析时间", "Last Analysis Time")}
            </div>
            <div className="fe-meta-value">{factorInfo.lastAnalysisTime}</div>
          </div>
          <div className="fe-meta-item">
            <div className="fe-meta-label">
              {t("分析方法", "Analysis Method")}
            </div>
            <div className="fe-meta-value">{factorInfo.analysisMethod}</div>
          </div>
          <span
            className={`fe-risk-badge fe-risk-${factorInfo.level.toLowerCase()}`}
          >
            {riskLevelText}
          </span>
        </div>
      </div>

      <div className="fe-content">
        {/* Top Factor Card */}
        <div className="fe-factor-card">
          <div className="fe-factor-card-title">
            {t("首要因子卡片", "Top Factor Card")}
          </div>
          <div className="fe-factor-card-body">
            <div className="fe-factor-field">
              <div className="fe-factor-field-label">{t("因子", "Factor")}</div>
              <div className="fe-factor-field-value">{factorInfo.factor}</div>
            </div>
            <div className="fe-factor-field">
              <div className="fe-factor-field-label">{t("ID", "ID")}</div>
              <div className="fe-factor-field-value-sm">{factorInfo.id}</div>
            </div>
            <div className="fe-factor-field">
              <div className="fe-factor-field-label">
                {t("维度", "Dimension")}
              </div>
              <div className="fe-factor-field-value-sm">
                {factorInfo.dimension}
              </div>
            </div>
            <div className="fe-factor-field">
              <div className="fe-factor-field-label">
                {t("当前贡献值", "Current Contribution Value")}
              </div>
              <div className="fe-contribution-value">
                {factorInfo.contributionValue} / {factorInfo.maxValue}
                <span
                  className={`fe-contribution-badge fe-badge-${factorInfo.level.toLowerCase()}`}
                >
                  {factorInfo.level === "High"
                    ? t("高风险", "High")
                    : factorInfo.level === "Medium"
                      ? t("中风险", "Medium")
                      : t("低风险", "Low")}
                </span>
              </div>
            </div>
            <div className="fe-factor-card-actions">
              <button className="fe-btn">
                {t("查看证据", "View Evidence")}
              </button>
              <button className="fe-btn">
                {t("查看历史变化", "View Historical Changes")}
              </button>
            </div>
          </div>
          <div className="fe-factor-description">{factorInfo.description}</div>
        </div>

        {/* Two column: Decision Logic + Trends */}
        <div className="fe-two-col">
          {/* Decision Logic & Model Inputs */}
          <div className="fe-card">
            <div className="fe-card-title">
              {t("决策逻辑与模型输入", "Decision Logic & Model Inputs")}
            </div>

            <div className="fe-logic-section-title">
              {t("应用逻辑", "Applied Logic")}
            </div>
            <div className="fe-logic-rules">
              {appliedRules.map((rule, i) => (
                <div key={i} className="fe-logic-rule">
                  <span className="fe-logic-keyword">{t("如果", "IF")}</span>
                  <span className="fe-logic-condition">{rule.condition}</span>
                  <span className="fe-logic-then">{t("则", "THEN")}</span>
                  <span className="fe-logic-result fe-logic-result-triggered">
                    {t("已触发", "Triggered")}
                  </span>
                </div>
              ))}
            </div>

            <div className="fe-logic-section-title">
              {t("模型特征", "Model Features")}
            </div>
            <div className="fe-table-wrapper">
              <table className="fe-table">
                <thead>
                  <tr>
                    <th>{t("特征名称", "Feature Name")}</th>
                    <th>{t("描述", "Description")}</th>
                    <th>{t("当前值", "Current Value")}</th>
                    <th>{t("阈值/范围", "Threshold/Range")}</th>
                  </tr>
                </thead>
                <tbody>
                  {modelFeatures.map((f, i) => (
                    <tr key={i}>
                      <td>{f.name}</td>
                      <td className="fe-table-desc">{f.description}</td>
                      <td>{f.currentValue}</td>
                      <td className="fe-table-threshold">{f.threshold}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Trends & Comparative Analysis */}
          <div className="fe-card">
            <div className="fe-card-title">
              {t("趋势与对比分析", "Trends & Comparative Analysis")}
            </div>

            {/* Contribution Trend Chart */}
            <div className="fe-trend-header">
              <span className="fe-trend-title">
                {t("贡献趋势图", "Contribution Trend Chart")}
              </span>
              <select
                className="fe-trend-select"
                value={trendRange}
                onChange={(e) => setTrendRange(e.target.value)}
              >
                <option value="7">{t("近7天", "Last 7 days")}</option>
                <option value="30">{t("近30天", "Last 30 days")}</option>
                <option value="90">{t("近90天", "Last 90 days")}</option>
              </select>
            </div>
            <div className="fe-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid stroke={GRID_STROKE} />
                  <XAxis dataKey="day" tick={AXIS_TICK} axisLine={false} />
                  <YAxis
                    tick={AXIS_TICK}
                    axisLine={false}
                    domain={[0, 1]}
                    ticks={[0, 0.3, 0.6, 1.0]}
                  />
                  <Tooltip {...darkTooltipStyle} />
                  <ReferenceLine
                    y={0.7}
                    stroke="#94a3b8"
                    strokeDasharray="4 4"
                    label={{
                      value: t("阈值", "Threshold"),
                      position: "left",
                      fill: "#94a3b8",
                      fontSize: 11,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#60a5fa"
                    strokeWidth={2}
                    dot={(props: Record<string, unknown>) => {
                      const { cx, cy, payload } = props as {
                        cx: number;
                        cy: number;
                        payload: { label?: string };
                      };
                      if (payload.label === "High") {
                        return (
                          <g key={`dot-${cx}`}>
                            <circle
                              cx={cx}
                              cy={cy}
                              r={5}
                              fill="#dc2626"
                              stroke="#fff"
                              strokeWidth={1}
                            />
                            <text
                              x={cx}
                              y={cy - 12}
                              textAnchor="middle"
                              fill="#dc2626"
                              fontSize={10}
                              fontWeight={600}
                            >
                              High
                            </text>
                          </g>
                        );
                      }
                      return (
                        <circle
                          key={`dot-${cx}`}
                          cx={cx}
                          cy={cy}
                          r={3}
                          fill="#60a5fa"
                        />
                      );
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Peer Sample Comparison */}
            <div className="fe-peer-header">
              <span className="fe-peer-title">
                {t("同类样本对比", "Peer Sample Comparison")}
              </span>
              <span className="fe-peer-percentile">
                {t("第99百分位", "99th Percentile")}
              </span>
            </div>
            <div className="fe-peer-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peerData}>
                  <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                  <XAxis dataKey="name" tick={AXIS_TICK} axisLine={false} />
                  <YAxis tick={AXIS_TICK} axisLine={false} />
                  <Tooltip {...darkTooltipStyle} />
                  <Legend
                    wrapperStyle={{ fontSize: 11, color: "#94a3b8" }}
                    formatter={(value: string) => (
                      <span style={{ color: "#94a3b8", fontSize: 11 }}>
                        {value}
                      </span>
                    )}
                  />
                  <Bar dataKey="value" name="This Flight (670m)" barSize={16}>
                    {peerData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={
                          entry.highlight ? "#60a5fa" : "rgba(96,165,250,0.3)"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Related Context */}
        <div className="fe-related-section">
          <div className="fe-tabs">
            <button
              className={`fe-tab ${activeTab === 0 ? "fe-tab-active" : ""}`}
              onClick={() => setActiveTab(0)}
            >
              {t("相关上下文", "Related Context")}
            </button>
            <button
              className={`fe-tab ${activeTab === 1 ? "fe-tab-active" : ""}`}
              onClick={() => setActiveTab(1)}
            >
              {t("相关上下文", "Related Context")}
            </button>
          </div>

          <div className="fe-related-grid">
            {/* Related Flights */}
            <div>
              <div className="fe-related-block-header">
                <span className="fe-related-block-title">
                  {t("相关航班", "Related Flights")}
                </span>
              </div>
              <table className="fe-table">
                <thead>
                  <tr>
                    <th>{t("航班ID", "Flight ID")}</th>
                    <th>{t("日期", "Date")}</th>
                    <th>{t("航线", "Route")}</th>
                    <th>{t("因子分数", "Factor Score")}</th>
                    <th>{t("状态", "Status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {relatedFlights.map((f, i) => (
                    <tr key={i}>
                      <td>{f.id}</td>
                      <td>{f.date}</td>
                      <td>{f.route}</td>
                      <td className={f.score ? "fe-score-high" : ""}>
                        {f.score ?? "-"}
                      </td>
                      <td
                        className={
                          f.status === "High"
                            ? "fe-status-high"
                            : "fe-status-similar"
                        }
                      >
                        {f.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Related Objects */}
            <div>
              <div className="fe-related-block-header">
                <span className="fe-related-block-title">
                  {t("相关对象", "Related Objects")}
                </span>
                <button className="fe-btn fe-btn-sm">
                  {t("查看相关对象", "View Related Object")}
                </button>
              </div>
              <table className="fe-table">
                <thead>
                  <tr>
                    <th>{t("对象ID", "Object ID")}</th>
                    <th>{t("类型", "Type")}</th>
                    <th>{t("关联", "Association")}</th>
                  </tr>
                </thead>
                <tbody>
                  {relatedObjects.map((o, i) => (
                    <tr key={i}>
                      <td>{o.id}</td>
                      <td>{o.type}</td>
                      <td className="fe-table-desc">{o.association}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Related Rules */}
            <div>
              <div className="fe-related-block-header">
                <span className="fe-related-block-title">
                  {t("相关规则", "Related Rules")}
                </span>
              </div>
              <div className="fe-rules-list">
                {relatedRules.map((rule, i) => (
                  <div key={i} className="fe-rule-item">
                    {rule}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
