import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ResponsiveContainer,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../i18n/useLanguage";
import { downloadCSV } from "../utils/exportUtils";

// ===== Mock Data =====

const riskForecastData = [
  { time: "4h", red: 25, yellow: 110, green: 200 },
  { time: "4h", red: 25, yellow: 110, green: 200 },
  { time: "6h", red: 135, yellow: 245, green: 600 },
  { time: "9h", red: 115, yellow: 305, green: 800 },
  { time: "12h", red: 215, yellow: 570, green: 1000 },
  { time: "15h", red: 135, yellow: 220, green: 1050 },
  { time: "18h", red: 215, yellow: 220, green: 1000 },
  { time: "21h", red: 101, yellow: 220, green: 900 },
  { time: "24h", red: 181, yellow: 220, green: 850 },
];

const divisionData = [
  { name: "Diti", red: 55, yellow: 15 },
  { name: "Divi", red: 38, yellow: 11 },
  { name: "Red", red: 31, yellow: 7 },
  { name: "Yellow", red: 28, yellow: 10 },
  { name: "Yellow", red: 23, yellow: 5 },
  { name: "Green", red: 18, yellow: 3 },
];

const squadronData = [
  { name: "Division", red: 35, voll: 8, risk: 5 },
  { name: "Squadron", red: 30, voll: 6, risk: 4 },
  { name: "Squadron", red: 25, voll: 5, risk: 3 },
  { name: "Yellow", red: 20, voll: 4, risk: 2 },
  { name: "Squadrmands", red: 15, voll: 3, risk: 2 },
  { name: "Relsee", red: 10, voll: 2, risk: 1 },
];

const airportData = [
  { name: "Top Airport", red: 75, voll: 10, risk: 5 },
  { name: "Severe Inirport", red: 65, voll: 8, risk: 4 },
  { name: "UK Airport", red: 55, voll: 7, risk: 3 },
  { name: "Maintenance", red: 45, voll: 6, risk: 2 },
  { name: "Eixinimont", red: 35, voll: 5, risk: 2 },
  { name: "Airport", red: 20, voll: 3, risk: 1 },
];

const aircraftTypeData = [
  { name: "RRT", value: 179 },
  { name: "NSC", value: 94 },
  { name: "BG2D", value: 50 },
  { name: "NTxN", value: 27 },
  { name: "Other", value: 7 },
];

const riskTypeData = [
  { name: "Maintenance", value: 23.2 },
  { name: "Logistics", value: 11.5 },
  { name: "Operational", value: 25.5 },
  { name: "Maintenance", value: 11.2 },
];

const PIE_COLORS = ["#3b82f6", "#60a5fa", "#ef4444", "#f97316"];

const humanFactorData = [
  { factor: "Fatigue", topN: 180, risk: 297 },
  { factor: "Training Gaps", topN: 120, risk: 108 },
  { factor: "Fitigur and Inworasement", topN: 90, risk: 73 },
  { factor: "Ritoring", topN: 70, risk: 55 },
  { factor: "Monitoring", topN: 50, risk: 38 },
  { factor: "Training Gaps", topN: 30, risk: 22 },
];

const aircraftFactorData = [
  { factor: "Specific components", topN: 15, risk: 140 },
  { factor: "Maintenance overdue", topN: 12, risk: 102 },
  { factor: "Severe Weather", topN: 10, risk: 98 },
  { factor: "Specific Componanants", topN: 8, risk: 68 },
  { factor: "Maintenance overdue", topN: 6, risk: 45 },
  { factor: "Maintenance", topN: 4, risk: 28 },
];

const envFactorData = [
  { factor: "Severe Weather", topN: 35, risk: 33 },
  { factor: "Challenging Airspace", topN: 30, risk: 27 },
  { factor: "Severe Weather", topN: 25, risk: 20 },
  { factor: "Sorage conclies Weather", topN: 22, risk: 19 },
  { factor: "Severe Weather", topN: 20, risk: 18 },
  { factor: "Logistics", topN: 10, risk: 7 },
];

const compositeData = [
  {
    cause: "Combination of Pilot Fatigue and Low Visibility",
    topN: 100,
    risk: 37,
  },
  {
    cause: "Combination of Pilot Fatigue and Low Visibility",
    topN: 80,
    risk: 22,
  },
  {
    cause: "Combination of Pilot Fatigue and Low Visibility",
    topN: 60,
    risk: 16,
  },
  { cause: "Pilot Fatigue and Low Visibility", topN: 50, risk: 14 },
  { cause: "Pilot Fatigue and Low Visibility", topN: 40, risk: 10 },
  {
    cause: "Combination of Pilot Fatigue and Low Visibility",
    topN: 30,
    risk: 9,
  },
];

// Dark theme chart axis/grid styles
const AXIS_TICK = { fontSize: 11, fill: "rgba(255, 255, 255, 0.4)" };
const AXIS_TICK_SM = { fontSize: 10, fill: "rgba(255, 255, 255, 0.4)" };
const AXIS_TICK_XS = { fontSize: 9, fill: "rgba(255, 255, 255, 0.4)" };
const GRID_STROKE = "rgba(255, 255, 255, 0.06)";

const darkTooltipStyle = {
  contentStyle: {
    background: "rgba(255, 255, 255, 0.06)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: 6,
    color: "rgba(255, 255, 255, 0.96)",
    fontSize: 12,
  },
  itemStyle: { color: "rgba(255, 255, 255, 0.62)" },
};

// ===== Stat Card =====
function StatCard({
  label,
  value,
  change,
  color,
  trend,
}: {
  label: string;
  value: string;
  change?: string;
  color?: string;
  trend?: "up" | "down";
}) {
  return (
    <div
      style={{
        background: "rgba(255, 255, 255, 0.06)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: 14,
        padding: "12px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {color && (
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              backgroundColor: color,
              flexShrink: 0,
            }}
          />
        )}
        <span style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.4)" }}>
          {label}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
        <span
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: "rgba(255, 255, 255, 0.96)",
          }}
        >
          {value}
        </span>
        {change && (
          <span
            style={{
              fontSize: 11,
              color: "rgba(255, 255, 255, 0.4)",
              marginBottom: 3,
            }}
          >
            {change}
          </span>
        )}
        {trend && (
          <svg
            style={{
              width: 32,
              height: 16,
              marginBottom: 3,
              color: trend === "up" ? "#ef4444" : "#3b82f6",
            }}
            viewBox="0 0 32 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            {trend === "up" ? (
              <polyline points="2,14 8,10 14,6 20,4 26,2 30,4" />
            ) : (
              <polyline points="2,4 8,8 14,10 20,12 26,14 30,12" />
            )}
          </svg>
        )}
      </div>
    </div>
  );
}

// ===== Factor Table =====
function FactorTable({
  title,
  data,
  nameKey,
  barMax,
}: {
  title: string;
  data: { [key: string]: string | number }[];
  nameKey: string;
  barMax: number;
}) {
  return (
    <div
      style={{
        background: "rgba(255, 255, 255, 0.06)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: 14,
        padding: 16,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <h3
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "rgba(255, 255, 255, 0.96)",
          marginBottom: 12,
        }}
      >
        {title}
      </h3>
      <table
        style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}
      >
        <thead>
          <tr>
            <th
              style={{
                textAlign: "left",
                padding: "6px 0",
                fontWeight: 500,
                color: "rgba(255, 255, 255, 0.4)",
                fontSize: 11,
                borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
              }}
            >
              {nameKey === "cause" ? "Cause" : "Factor"}
            </th>
            <th
              style={{
                textAlign: "left",
                padding: "6px 0",
                fontWeight: 500,
                color: "rgba(255, 255, 255, 0.4)",
                fontSize: 11,
                borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
              }}
            >
              Top N
            </th>
            <th
              style={{
                textAlign: "right",
                padding: "6px 0",
                fontWeight: 500,
                color: "rgba(255, 255, 255, 0.4)",
                fontSize: 11,
                borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
              }}
            >
              % Risk
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, i) => (
            <tr key={i}>
              <td
                style={{
                  padding: "6px 0",
                  color: "rgba(255, 255, 255, 0.62)",
                  maxWidth: 120,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                }}
              >
                {String(item[nameKey])}
              </td>
              <td
                style={{
                  padding: "6px 0",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div
                    style={{
                      height: 10,
                      background: "#3b82f6",
                      borderRadius: 2,
                      width: `${(Number(item.topN) / barMax) * 100}%`,
                      minWidth: 4,
                    }}
                  />
                </div>
              </td>
              <td
                style={{
                  padding: "6px 0",
                  textAlign: "right",
                  color: "rgba(255, 255, 255, 0.96)",
                  fontWeight: 600,
                  borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                }}
              >
                {String(item.risk)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ===== Chart Card wrapper =====
function ChartCard({
  title,
  children,
  extra,
}: {
  title: string;
  children: React.ReactNode;
  extra?: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "rgba(255, 255, 255, 0.06)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: 14,
        padding: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <h3
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "rgba(255, 255, 255, 0.96)",
            margin: 0,
          }}
        >
          {title}
        </h3>
        {extra}
      </div>
      {children}
    </div>
  );
}

// ===== Main Page =====
export function AnalysisPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const trendData = [
    { day: t("日", "Sun"), value: 20 },
    { day: t("一", "Mon"), value: 56 },
    { day: t("二", "Tue"), value: 34 },
    { day: t("三", "Wed"), value: 33 },
    { day: t("四", "Thu"), value: 77 },
    { day: t("五", "Fri"), value: 78 },
    { day: t("六", "Sat"), value: 53 },
    { day: t("日", "Sun"), value: 32 },
  ];

  const headerButtons: { label: string; onClick?: () => void }[] = [
    {
      label: t("查看高风险航班", "View High-Risk Flights"),
      onClick: () => navigate("/risk-monitoring/flights?risk=high"),
    },
    {
      label: t("查看高风险机场", "View High-Risk Airports"),
      onClick: () => navigate("/airport-center/airport-list?risk=high"),
    },
    {
      label: t("查看高风险人员", "View High-Risk Personnel"),
      onClick: () => navigate("/personnel-center/personnel-list?risk=high"),
    },
    // { label: t("更多分析", "More Analysis") },
    {
      label: t("导出综合报告", "Export Summary Report"),
      onClick: () => {
        const headers = [
          t("时间", "Time"),
          t("红色风险", "Red"),
          t("黄色风险", "Yellow"),
          t("绿色风险", "Green"),
        ];
        const rows = riskForecastData.map((d) => [
          d.time,
          d.red,
          d.yellow,
          d.green,
        ]);
        downloadCSV(t("综合分析报告", "analysis_report"), headers, rows);
      },
    },
  ];

  return (
    <div
      style={{
        height: "100%",
        overflowY: "auto",
        background: "#000",
        color: "rgba(255, 255, 255, 0.96)",
      }}
    >
      {/* Breadcrumb */}
      <div
        style={{
          padding: "10px 24px",
          fontSize: 12,
          color: "rgba(255, 255, 255, 0.4)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
        }}
      >
        <span>{t("工作台", "Dashboard")}</span>
        <span style={{ margin: "0 8px", color: "rgba(255, 255, 255, 0.4)" }}>
          &gt;
        </span>
        <span style={{ color: "rgba(255, 255, 255, 0.96)" }}>
          {t("综合分析", "Summary Analysis")}
        </span>
      </div>

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 24px",
        }}
      >
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "rgba(255, 255, 255, 0.96)",
            margin: 0,
          }}
        >
          {t("综合分析", "Summary Analysis")}
        </h1>
        <div style={{ display: "flex", gap: 8 }}>
          {headerButtons.map((btn) => (
            <button
              key={btn.label}
              onClick={btn.onClick}
              style={{
                padding: "6px 14px",
                fontSize: 12,
                fontWeight: 500,
                color: "rgba(255, 255, 255, 0.62)",
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: 4,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.14)";
                e.currentTarget.style.color = "rgba(255, 255, 255, 0.96)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                e.currentTarget.style.color = "rgba(255, 255, 255, 0.62)";
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          padding: "0 24px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Stat Cards Row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 12,
          }}
        >
          <StatCard
            label={t("总航班数", "Total Flights")}
            value="14,872"
            trend="up"
          />
          <StatCard
            label={t("红色风险", "Red risk")}
            value="215"
            change="(1.4%)"
            color="#ef4444"
            trend="up"
          />
          <StatCard
            label={t("黄色风险", "Yellow risk")}
            value="137"
            change="(1.4%)"
            color="#eab308"
            trend="down"
          />

          <StatCard
            label={t("绿色风险", "Green risk")}
            value="148"
            change="(1.2%)"
            color="#22c55e"
            trend="up"
          />
          <StatCard
            label={t("高风险机场", "High-Risk Airports")}
            value="28"
            trend="up"
          />
          <StatCard
            label={t("高风险人员", "High-Risk Personnel")}
            value="112"
          />
        </div>

        {/* Row 2: Risk Forecast + Distribution by Division + Distribution by Squadron */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "6fr 3fr 3fr",
            gap: 12,
          }}
        >
          <ChartCard
            title={t(
              "风险预测变化 (4h, 10h, 18h, 24h)",
              "Risk Forecast Changes (4h, 10h, 18h, 24h)",
            )}
            extra={
              <select
                style={{
                  fontSize: 11,
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: 4,
                  padding: "4px 8px",
                  background: "rgba(255, 255, 255, 0.08)",
                  color: "rgba(255, 255, 255, 0.86)",
                  outline: "none",
                }}
              >
                <option>
                  {t(
                    "当前快照（近24小时）",
                    "Current Snapshot (Last 24 Hours)",
                  )}
                </option>
              </select>
            }
          >
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={riskForecastData}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                <XAxis dataKey="time" tick={AXIS_TICK} stroke={GRID_STROKE} />
                <YAxis tick={AXIS_TICK} stroke={GRID_STROKE} />
                <Tooltip {...darkTooltipStyle} />
                <Legend
                  iconSize={10}
                  wrapperStyle={{
                    fontSize: 11,
                    color: "rgba(255, 255, 255, 0.4)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="green"
                  stackId="1"
                  stroke="#22c55e"
                  fill="rgba(34,197,94,0.3)"
                />
                <Area
                  type="monotone"
                  dataKey="yellow"
                  stackId="1"
                  stroke="#eab308"
                  fill="rgba(234,179,8,0.3)"
                />
                <Area
                  type="monotone"
                  dataKey="red"
                  stackId="1"
                  stroke="#ef4444"
                  fill="rgba(239,68,68,0.3)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title={t("按部门分布", "Distribution by Division")}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={divisionData} layout="vertical" barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                <XAxis type="number" tick={AXIS_TICK_SM} stroke={GRID_STROKE} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={AXIS_TICK_SM}
                  width={55}
                  stroke={GRID_STROKE}
                />
                <Tooltip {...darkTooltipStyle} />
                <Legend
                  iconSize={10}
                  wrapperStyle={{
                    fontSize: 10,
                    color: "rgba(255, 255, 255, 0.4)",
                  }}
                />
                <Bar dataKey="red" fill="#ef4444" />
                <Bar dataKey="yellow" fill="#eab308" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title={t("按中队分布", "Distribution by Squadron")}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={squadronData} layout="horizontal" barSize={12}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                <XAxis
                  dataKey="name"
                  tick={AXIS_TICK_XS}
                  stroke={GRID_STROKE}
                />
                <YAxis tick={AXIS_TICK_SM} stroke={GRID_STROKE} />
                <Tooltip {...darkTooltipStyle} />
                <Legend
                  iconSize={10}
                  wrapperStyle={{
                    fontSize: 10,
                    color: "rgba(255, 255, 255, 0.4)",
                  }}
                />
                <Bar dataKey="red" fill="#ef4444" />
                <Bar dataKey="voll" fill="#f97316" />
                <Bar dataKey="risk" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Row 3: Trend + Airport + Aircraft Type + Risk Type */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
          }}
        >
          <ChartCard
            title={t(
              "新增高风险趋势（近7天）",
              "New High-Risk Trends (Last 7 Days)",
            )}
          >
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                <XAxis dataKey="day" tick={AXIS_TICK} stroke={GRID_STROKE} />
                <YAxis tick={AXIS_TICK} stroke={GRID_STROKE} />
                <Tooltip {...darkTooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#60a5fa"
                  strokeWidth={2}
                  dot={{ fill: "#60a5fa", r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title={t("按机场分布", "Distribution by Airport")}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={airportData} layout="vertical" barSize={10}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                <XAxis type="number" tick={AXIS_TICK_SM} stroke={GRID_STROKE} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={AXIS_TICK_XS}
                  width={80}
                  stroke={GRID_STROKE}
                />
                <Tooltip {...darkTooltipStyle} />
                <Legend
                  iconSize={10}
                  wrapperStyle={{
                    fontSize: 10,
                    color: "rgba(255, 255, 255, 0.4)",
                  }}
                />
                <Bar dataKey="red" stackId="a" fill="#3b82f6" />
                <Bar dataKey="voll" stackId="a" fill="#ef4444" />
                <Bar dataKey="risk" stackId="a" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title={t("按机型分布", "Distribution by Aircraft Type")}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={aircraftTypeData} barSize={30}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                <XAxis
                  dataKey="name"
                  tick={AXIS_TICK_SM}
                  stroke={GRID_STROKE}
                />
                <YAxis tick={AXIS_TICK_SM} stroke={GRID_STROKE} />
                <Tooltip {...darkTooltipStyle} />
                <Bar dataKey="value" fill="#3b82f6">
                  {aircraftTypeData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={index % 2 === 0 ? "#3b82f6" : "#60a5fa"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title={t("按风险类型分布", "Distribution by Risk Type")}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={riskTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  dataKey="value"
                  label={({ name, value }) => `${name} ${value}%`}
                  labelLine={true}
                >
                  {riskTypeData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip {...darkTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Row 4: Factor Tables */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
          }}
        >
          <FactorTable
            title={t("人为因素 Top N", "Human Factor Top N")}
            data={humanFactorData}
            nameKey="factor"
            barMax={200}
          />
          <FactorTable
            title={t("飞机因素 Top N", "Aircraft Factor Top N")}
            data={aircraftFactorData}
            nameKey="factor"
            barMax={20}
          />
          <FactorTable
            title={t("环境因素 Top N", "Environmental Factor Top N")}
            data={envFactorData}
            nameKey="factor"
            barMax={40}
          />
          <FactorTable
            title={t("综合原因 Top N", "Composite Cause Top N")}
            data={compositeData}
            nameKey="cause"
            barMax={120}
          />
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 11,
            color: "rgba(255, 255, 255, 0.4)",
            padding: "0 8px 8px",
          }}
        >
          <span>System ID: 192.168.10.904</span>
          <div style={{ display: "flex", gap: 16 }}>
            <span>Laster it:Sendioin</span>
            <span>RYSV</span>
            <span>1920x1080</span>
          </div>
        </div>
      </div>
    </div>
  );
}
