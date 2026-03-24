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

// ===== Mock Data =====

const riskForecastData = [
  { time: "4h", red: 25, orange: 2, yellow: 108, green: 200 },
  { time: "4h", red: 25, orange: 2, yellow: 108, green: 200 },
  { time: "6h", red: 135, orange: 30, yellow: 215, green: 600 },
  { time: "9h", red: 115, orange: 90, yellow: 215, green: 800 },
  { time: "12h", red: 215, orange: 95, yellow: 475, green: 1000 },
  { time: "15h", red: 135, orange: 5, yellow: 215, green: 1050 },
  { time: "18h", red: 215, orange: 5, yellow: 215, green: 1000 },
  { time: "21h", red: 101, orange: 5, yellow: 215, green: 900 },
  { time: "24h", red: 181, orange: 5, yellow: 215, green: 850 },
];

const trendData = [
  { day: "Sun", value: 20 },
  { day: "Mon", value: 56 },
  { day: "Tue", value: 34 },
  { day: "Wed", value: 33 },
  { day: "Thu", value: 77 },
  { day: "Fri", value: 78 },
  { day: "Sat", value: 53 },
  { day: "Sun", value: 32 },
];

const divisionData = [
  { name: "Diti", red: 55, orange: 10, yellow: 5 },
  { name: "Divi", red: 38, orange: 8, yellow: 3 },
  { name: "Red", red: 31, orange: 5, yellow: 2 },
  { name: "Yellow", red: 28, orange: 4, yellow: 6 },
  { name: "Yellow", red: 23, orange: 3, yellow: 2 },
  { name: "Green", red: 18, orange: 2, yellow: 1 },
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

const PIE_COLORS = ["#1e3a5f", "#2d5a87", "#c0392b", "#e67e22"];

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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3 flex flex-col gap-1">
      <div className="flex items-center gap-2">
        {color && (
          <span
            className="w-2.5 h-2.5 rounded-sm"
            style={{ backgroundColor: color }}
          />
        )}
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        {change && <span className="text-xs text-gray-400 mb-1">{change}</span>}
        {trend && (
          <svg
            className={`w-8 h-4 mb-1 ${trend === "up" ? "text-red-500" : "text-blue-500"}`}
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">{title}</h3>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-gray-500 border-b border-gray-100">
            <th className="text-left py-1.5 font-medium">
              {nameKey === "cause" ? "Cause" : "Factor"}
            </th>
            <th className="text-left py-1.5 font-medium">Top N</th>
            <th className="text-right py-1.5 font-medium">% Risk</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, i) => (
            <tr key={i} className="border-b border-gray-50">
              <td className="py-1.5 text-gray-700 max-w-[120px] truncate">
                {String(item[nameKey])}
              </td>
              <td className="py-1.5">
                <div className="flex items-center gap-1">
                  <div
                    className="h-2.5 bg-blue-600 rounded-sm"
                    style={{
                      width: `${(Number(item.topN) / barMax) * 100}%`,
                      minWidth: 4,
                    }}
                  />
                </div>
              </td>
              <td className="py-1.5 text-right text-gray-700 font-medium">
                {String(item.risk)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ===== Main Page =====
export function AnalysisPage() {
  return (
    <div className="h-full overflow-auto bg-gray-100 text-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">
          ARVIS P1 Summary Analysis
        </h1>
        <div className="flex gap-2">
          {[
            "View High-Risk Flights",
            "View High-Risk Airports",
            "View High-Risk Personnel",
            "More Analysis",
            "Export Summary Report",
          ].map((btn) => (
            <button
              key={btn}
              className="px-3 py-1.5 text-xs font-medium text-white bg-[#1a3a5c] rounded hover:bg-[#244d73] transition-colors"
            >
              {btn}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Stat Cards Row */}
        <div className="grid grid-cols-7 gap-3">
          <StatCard label="Total Flights" value="14,872" trend="up" />
          <StatCard
            label="Red risk"
            value="215"
            change="(1.4%)"
            color="#dc2626"
            trend="up"
          />
          <StatCard
            label="Orange risk"
            value="137"
            change="(1.4%)"
            color="#f97316"
            trend="down"
          />
          <StatCard
            label="Yellow risk"
            value="130"
            change="(1.6%)"
            color="#eab308"
            trend="down"
          />
          <StatCard
            label="Green risk"
            value="148"
            change="(1.2%)"
            color="#22c55e"
            trend="up"
          />
          <StatCard label="High-Risk Airports" value="28" trend="up" />
          <StatCard label="High-Risk Personnel" value="112" />
        </div>

        {/* Row 2: Risk Forecast + Distribution by Division + Distribution by Squadron */}
        <div className="grid grid-cols-12 gap-3">
          {/* Risk Forecast Changes */}
          <div className="col-span-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800">
                Risk Forecast Changes (4h, 10h, 18h, 24h)
              </h3>
              <select className="text-xs border border-gray-300 rounded px-2 py-1 text-gray-600">
                <option>Current Snapshot (Last 24 Hours)</option>
              </select>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={riskForecastData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                <Area
                  type="monotone"
                  dataKey="green"
                  stackId="1"
                  stroke="#22c55e"
                  fill="#bbf7d0"
                />
                <Area
                  type="monotone"
                  dataKey="yellow"
                  stackId="1"
                  stroke="#eab308"
                  fill="#fef08a"
                />
                <Area
                  type="monotone"
                  dataKey="orange"
                  stackId="1"
                  stroke="#f97316"
                  fill="#fed7aa"
                />
                <Area
                  type="monotone"
                  dataKey="red"
                  stackId="1"
                  stroke="#dc2626"
                  fill="#fecaca"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Distribution by Division */}
          <div className="col-span-3 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">
              Distribution by Division
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={divisionData} layout="vertical" barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 10 }}
                  width={55}
                />
                <Tooltip />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="red" fill="#dc2626" />
                <Bar dataKey="orange" fill="#f97316" />
                <Bar dataKey="yellow" fill="#eab308" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Distribution by Squadron */}
          <div className="col-span-3 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">
              Distribution by Squadron
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={squadronData} layout="horizontal" barSize={12}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="red" fill="#dc2626" />
                <Bar dataKey="voll" fill="#f97316" />
                <Bar dataKey="risk" fill="#1e3a5f" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Row 3: Trend + Airport + Aircraft Type + Risk Type */}
        <div className="grid grid-cols-12 gap-3">
          {/* New High-Risk Trends */}
          <div className="col-span-3 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">
              New High-Risk Trends (Last 7 Days)
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#1e3a5f"
                  strokeWidth={2}
                  dot={{ fill: "#1e3a5f", r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Distribution by Airport */}
          <div className="col-span-3 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">
              Distribution by Airport
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={airportData} layout="vertical" barSize={10}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 9 }}
                  width={80}
                />
                <Tooltip />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="red" stackId="a" fill="#1e3a5f" />
                <Bar dataKey="voll" stackId="a" fill="#dc2626" />
                <Bar dataKey="risk" stackId="a" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Distribution by Aircraft Type */}
          <div className="col-span-3 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">
              Distribution by Aircraft Type
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={aircraftTypeData} barSize={30}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#1e3a5f">
                  {aircraftTypeData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={index % 2 === 0 ? "#1e3a5f" : "#2d5a87"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Distribution by Risk Type (Pie) */}
          <div className="col-span-3 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">
              Distribution by Risk Type
            </h3>
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
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Row 4: Factor Tables */}
        <div className="grid grid-cols-4 gap-3">
          <FactorTable
            title="Human Factor Top N"
            data={humanFactorData}
            nameKey="factor"
            barMax={200}
          />
          <FactorTable
            title="Aircraft Factor Top N"
            data={aircraftFactorData}
            nameKey="factor"
            barMax={20}
          />
          <FactorTable
            title="Environmental Factor Top N"
            data={envFactorData}
            nameKey="factor"
            barMax={40}
          />
          <FactorTable
            title="Composite Cause Top N"
            data={compositeData}
            nameKey="cause"
            barMax={120}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-400 px-2 pb-2">
          <span>System ID: 192.168.10.904</span>
          <div className="flex gap-4">
            <span>Laster it:Sendioin</span>
            <span>RYSV</span>
            <span>1920x1080</span>
          </div>
        </div>
      </div>
    </div>
  );
}
