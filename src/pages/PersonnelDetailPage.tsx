// @ts-nocheck
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  getFlightPersonDetail,
  getFlightPersonOverview,
  getFlightPersonRiskProfile,
  getFlightPersonFleetComparison,
  getFlightPersonFlights,
  getFlightPersonTraining,
  type RiskRange,
} from "../api/flightPerson";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useLanguage } from "../i18n/useLanguage";
import "./PersonnelDetailPage.css";

// ---------- Mock Data ----------

const riskScoreTrendData = [
  { month: "1", monthZh: "第1次", composite: 15, human: 12 },
  { month: "2", monthZh: "第2次", composite: 22, human: 18 },
  { month: "3", monthZh: "第3次", composite: 28, human: 25 },
  { month: "4", monthZh: "第4次", composite: 32, human: 30 },
  { month: "5", monthZh: "第5次", composite: 35, human: 28 },
  { month: "6", monthZh: "第6次", composite: 38, human: 35 },
];

const keyRiskContributorsData = [
  { name: "Human Factors", nameZh: "人为因素", value: 42 },
  { name: "Training Gaps", nameZh: "训练不足", value: 28 },
  { name: "Schedule Anomalies", nameZh: "排班异常", value: 22 },
  { name: "Flight Performance", nameZh: "飞行表现", value: 15 },
];

const topRiskIndicators = [
  {
    label: "Elevated Fatigue Indices",
    labelZh: "疲劳指数升高",
    color: "#dc2626",
  },
  { label: "Missed CRM Training", labelZh: "缺失CRM训练", color: "#ea580c" },
  {
    label: "Above Average Deviation in Landing Patterns",
    labelZh: "着陆模式偏差高于平均",
    color: "#ea580c",
  },
  {
    label: "Flight Performance Score",
    labelZh: "飞行表现评分",
    color: "#eab308",
  },
  {
    label: "Elevated Fatigue Indices",
    labelZh: "疲劳指数升高",
    color: "#22c55e",
  },
];

const peerAnalysisData = [
  { month: "1", individual: 25, squadron: 20, fleet: 18 },
  { month: "2", individual: 30, squadron: 22, fleet: 19 },
  { month: "3", individual: 35, squadron: 24, fleet: 20 },
  { month: "4", individual: 32, squadron: 23, fleet: 19 },
  { month: "5", individual: 38, squadron: 25, fleet: 21 },
  { month: "6", individual: 36, squadron: 24, fleet: 20 },
];

// Chart styles
const AXIS_TICK = { fontSize: 11, fill: "#94a3b8" };
const GRID_STROKE = "rgba(148, 163, 184, 0.1)";
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

// ---------- Nav Items ----------

interface NavItem {
  key: string;
  label: string;
  labelZh: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    key: "risk-profile",
    label: "Risk Profile",
    labelZh: "风险档案",
    icon: (
      <svg
        className="pd-nav-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    key: "personal-vs-fleet",
    label: "Personal vs Fleet",
    labelZh: "个人与机队对比",
    icon: (
      <svg
        className="pd-nav-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    key: "historical-flights",
    label: "Historical Flights",
    labelZh: "历史航班",
    icon: (
      <svg
        className="pd-nav-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    key: "training-data",
    label: "Training Data",
    labelZh: "训练数据",
    icon: (
      <svg
        className="pd-nav-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    key: "training-scenarios",
    label: "Recommended Scenarios",
    labelZh: "推荐训练场景",
    icon: (
      <svg
        className="pd-nav-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    key: "squadron-monthly",
    label: "Squadron Monthly Report",
    labelZh: "中队月报",
    icon: (
      <svg
        className="pd-nav-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
];

// ---------- Component ----------

function riskLevelLabel(level: string, t: (zh: string, en: string) => string) {
  if (level === "HIGH") return t("高", "High");
  if (level === "MEDIUM") return t("中", "Medium");
  return t("低", "Low");
}

function riskLevelColor(level: string) {
  if (level === "HIGH") return "#ef4444";
  if (level === "MEDIUM") return "#f97316";
  return "#22c55e";
}

function TabLoading({ text }: { text: string }) {
  return (
    <div
      className="pd-card"
      style={{
        padding: 40,
        textAlign: "center",
        color: "#64748b",
      }}
    >
      {text}
    </div>
  );
}

export function PersonnelDetailPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const empNo = searchParams.get("empNo") || searchParams.get("id") || "";
  const [activeNav, setActiveNav] = useState(
    searchParams.get("tab") || "risk-profile",
  );
  const [person, setPerson] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 四个 Tab 的数据 + 头部摘要
  const [overview, setOverview] = useState<any>(null);
  const [riskProfile, setRiskProfile] = useState<any>(null);
  const [fleetComparison, setFleetComparison] = useState<any>(null);
  const [historicalFlights, setHistoricalFlights] = useState<any>(null);
  const [trainingData, setTrainingData] = useState<any>(null);
  const [riskRange, setRiskRange] = useState<RiskRange>("6m");

  // Tab 3 历史航班筛选
  const [flightsRiskLevel, setFlightsRiskLevel] = useState<
    "" | "高" | "中" | "低"
  >("");
  const [flightsStartDate, setFlightsStartDate] = useState("");
  const [flightsEndDate, setFlightsEndDate] = useState("");

  // 各 Tab 的加载状态（数据未到达前显示 loading）
  const [riskProfileLoading, setRiskProfileLoading] = useState(false);
  const [fleetComparisonLoading, setFleetComparisonLoading] = useState(false);
  const [historicalFlightsLoading, setHistoricalFlightsLoading] =
    useState(false);
  const [trainingDataLoading, setTrainingDataLoading] = useState(false);

  // 基础信息 + 头部摘要（所有 Tab 共享）
  useEffect(() => {
    if (!empNo) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      getFlightPersonDetail(empNo).catch(() => null),
      getFlightPersonOverview(empNo).catch(() => null),
    ])
      .then(([detail, ov]) => {
        setPerson(detail);
        setOverview(ov);
      })
      .catch((err) => console.error("Failed to load person detail:", err))
      .finally(() => setLoading(false));
  }, [empNo]);

  // Tab 1 风险档案
  useEffect(() => {
    if (!empNo || activeNav !== "risk-profile") return;
    let cancelled = false;
    setRiskProfile(null);
    setRiskProfileLoading(true);
    getFlightPersonRiskProfile(empNo, { range: riskRange })
      .then((res) => {
        if (!cancelled) setRiskProfile(res);
      })
      .catch((err) => console.error("Failed to load risk-profile:", err))
      .finally(() => {
        if (!cancelled) setRiskProfileLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [empNo, activeNav, riskRange]);

  // Tab 2 个人与机队对比
  const [fleetError, setFleetError] = useState(false);
  useEffect(() => {
    if (!empNo || activeNav !== "personal-vs-fleet") return;
    let cancelled = false;
    setFleetComparison(null);
    setFleetError(false);
    setFleetComparisonLoading(true);
    getFlightPersonFleetComparison(empNo, { range: riskRange })
      .then((res) => {
        if (!cancelled) setFleetComparison(res);
      })
      .catch((err) => {
        console.error("Failed to load fleet-comparison:", err);
        if (!cancelled) setFleetError(true);
      })
      .finally(() => {
        if (!cancelled) setFleetComparisonLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [empNo, activeNav, riskRange]);

  // Tab 3 历史航班
  useEffect(() => {
    if (!empNo || activeNav !== "historical-flights") return;
    let cancelled = false;
    setHistoricalFlights(null);
    setHistoricalFlightsLoading(true);
    const params: any = { page: 1, pageSize: 20 };
    if (flightsRiskLevel) params.riskLevel = flightsRiskLevel;
    if (flightsStartDate) params.startDate = flightsStartDate;
    if (flightsEndDate) params.endDate = flightsEndDate;
    getFlightPersonFlights(empNo, params)
      .then((res) => {
        if (!cancelled) setHistoricalFlights(res);
      })
      .catch((err) => console.error("Failed to load historical flights:", err))
      .finally(() => {
        if (!cancelled) setHistoricalFlightsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [empNo, activeNav, flightsRiskLevel, flightsStartDate, flightsEndDate]);

  // Tab 4 训练数据
  useEffect(() => {
    if (!empNo || activeNav !== "training-data") return;
    let cancelled = false;
    setTrainingData(null);
    setTrainingDataLoading(true);
    getFlightPersonTraining(empNo)
      .then((res) => {
        if (!cancelled) setTrainingData(res);
      })
      .catch((err) => console.error("Failed to load training data:", err))
      .finally(() => {
        if (!cancelled) setTrainingDataLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [empNo, activeNav]);

  // 头部摘要：合并 detail + overview 的字段
  const personMerged = {
    ...(person || {}),
    ...(overview || {}),
    flightUnit: person?.flightUnit ?? overview?.unit,
    team: person?.team,
    riskScore: overview?.humanFactorScore ?? person?.riskScore,
    highRiskFlightCount:
      overview?.highRiskFlightCount90d ?? person?.highRiskFlightCount,
  };

  // Tab 2 折线图：fleetComparison.trend.series → [{label, individual, fleet}]
  const fleetTrendData =
    fleetComparison?.trend?.series?.map((s: any) => ({
      label: s.label,
      individual: s.self,
      fleet: s.fleetAvg,
    })) ?? null;

  // Tab 2 雷达图：fleetComparison.radar
  const fleetRadarData = fleetComparison?.radar
    ? fleetComparison.radar.axes.map((axis: string, i: number) => ({
        indicator: axis,
        individual: fleetComparison.radar.self?.[i] ?? 0,
        fleet: fleetComparison.radar.fleetAvg?.[i] ?? 0,
      }))
    : null;

  // Tab 3 历史航班
  const flightItems: any[] = historicalFlights?.items ?? [];

  // Tab 4 九维能力评估
  const competencyItems: any[] = trainingData?.competencies ?? [];
  const trainingRecommendations: any[] = trainingData?.recommendations ?? [];

  if (loading) {
    return (
      <div className="pd-root">
        <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
          {t("加载中...", "Loading...")}
        </div>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="pd-root">
        <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
          {t("未找到人员信息", "Personnel not found")}
        </div>
      </div>
    );
  }

  return (
    <div className="pd-root">
      {/* Breadcrumb */}
      <div className="pd-breadcrumb">
        <span style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
          {t("工作台", "Dashboard")}
        </span>
        <span className="pd-breadcrumb-sep">&gt;</span>
        <span
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/personnel-center/personnel-list")}
        >
          {t("人", "Personnel")}
        </span>
        <span className="pd-breadcrumb-sep">&gt;</span>
        <span className="pd-breadcrumb-active">
          {t("人员详情", "Personnel Detail")}
        </span>
      </div>

      {/* Back + Header Card */}
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
      <div className="pd-header-card">
        <div className="pd-header-top">
          <h1 className="pd-header-title">
            {personMerged.empNo} - {personMerged.name}
          </h1>
          <div className="pd-header-icons" />
        </div>
        <div className="pd-header-info">
          <div className="pd-info-item">
            <div className="pd-info-label">{t("工号", "Employee No.")}</div>
            <div className="pd-info-value">{personMerged.empNo}</div>
          </div>
          <div className="pd-info-item">
            <div className="pd-info-label">{t("飞行单位", "Flight Unit")}</div>
            <div className="pd-info-value">
              {personMerged.flightUnit || "—"}
            </div>
          </div>
          <div className="pd-info-item">
            <div className="pd-info-label">{t("机型", "Aircraft Type")}</div>
            <div className="pd-info-value">
              {personMerged.aircraftType || "—"}
            </div>
          </div>
          <div className="pd-info-item">
            <div className="pd-info-label">
              {t("技术等级", "Technical Level")}
            </div>
            <div className="pd-info-value">{personMerged.techGrade || "—"}</div>
          </div>
          <div className="pd-info-item">
            <div className="pd-info-label">
              {t("大队 / 中队", "Team / Squadron")}
            </div>
            <div className="pd-info-value">
              {[personMerged.team, personMerged.squadron]
                .filter(Boolean)
                .join(" / ") || "—"}
            </div>
          </div>
          <div className="pd-info-item">
            <div className="pd-info-label">
              {t("当前综合风险等级", "Current Composite Risk Level")}
            </div>
            <div className="pd-info-value">
              <span
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: riskLevelColor(personMerged.riskLevel),
                    display: "inline-block",
                  }}
                />
                {overview?.riskGradeLabel ||
                  riskLevelLabel(personMerged.riskLevel, t)}
              </span>
            </div>
          </div>
          <div className="pd-info-item">
            <div className="pd-info-label">{t("风险评分", "Risk Score")}</div>
            <div className="pd-info-value">
              <div className="pd-hf-score">
                <span className="pd-hf-score-text">
                  {personMerged.riskScore || 0} /{" "}
                  {overview?.humanFactorScoreMax || 100}
                </span>
                <div className="pd-hf-bar-bg">
                  <div
                    className="pd-hf-bar-fill"
                    style={{
                      width: `${
                        ((personMerged.riskScore || 0) /
                          (overview?.humanFactorScoreMax || 100)) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="pd-info-item">
            <div className="pd-info-label">
              {t("人为因素标签", "Human Factor Tags")}
            </div>
            <div className="pd-info-value">
              {personMerged.humanFactorTags || "—"}
            </div>
          </div>
          <div className="pd-info-item">
            <div className="pd-info-label">
              {t("相关高风险航班数", "High-Risk Flights")}
            </div>
            <div className="pd-info-value">
              {personMerged.highRiskFlightCount ?? 0} {t("航班", "flights")}
            </div>
          </div>
        </div>
      </div>

      {/* Two-column body */}
      <div className="pd-body">
        {/* Left Sidebar Nav */}
        <div className="pd-sidebar">
          {navItems.map((item) => (
            <button
              key={item.key}
              className={`pd-nav-item ${activeNav === item.key ? "pd-nav-item-active" : ""}`}
              onClick={() => setActiveNav(item.key)}
            >
              {item.icon}
              <span>{t(item.labelZh, item.label)}</span>
            </button>
          ))}
        </div>

        {/* Right Content Area */}
        <div className="pd-content">
          {activeNav === "risk-profile" &&
            (riskProfileLoading || !riskProfile ? (
              <TabLoading text={t("加载中...", "Loading...")} />
            ) : (
              <RiskProfileSection
                data={riskProfile}
                range={riskRange}
                onRangeChange={setRiskRange}
              />
            ))}
          {activeNav === "personal-trend" && (
            <div className="pd-card" style={{ padding: 20 }}>
              <h3 className="pd-card-title" style={{ marginBottom: 16 }}>
                {t("个人趋势", "Personal Trend")}
              </h3>
              <div className="pd-row-3">
                <div className="pd-card">
                  <div className="pd-card-header">
                    <h3 className="pd-card-title">
                      {t("风险评分趋势", "Risk Score Trend")}
                    </h3>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={riskScoreTrendData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={GRID_STROKE}
                      />
                      <XAxis
                        dataKey={(d: (typeof riskScoreTrendData)[0]) =>
                          t(d.monthZh, d.month)
                        }
                        tick={AXIS_TICK}
                        stroke={GRID_STROKE}
                      />
                      <YAxis
                        tick={AXIS_TICK}
                        stroke={GRID_STROKE}
                        domain={[0, 50]}
                      />
                      <Tooltip {...darkTooltipStyle} />
                      <Area
                        type="monotone"
                        dataKey="composite"
                        stroke="#3b82f6"
                        fill="rgba(59,130,246,0.1)"
                        strokeWidth={2}
                        name={t("综合评分", "Composite Score")}
                      />
                      <Line
                        type="monotone"
                        dataKey="human"
                        stroke="#94a3b8"
                        strokeWidth={2}
                        dot={{ fill: "#94a3b8", r: 3 }}
                        name={t("人为因素分项", "Human Factor Component")}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
          {activeNav === "personal-vs-fleet" &&
            (fleetComparisonLoading ? (
              <TabLoading text={t("加载中...", "Loading...")} />
            ) : fleetError || !fleetComparison ? (
              <TabLoading
                text={
                  fleetError
                    ? t("加载失败，请重试", "Failed to load, please retry")
                    : t("暂无数据", "No data available")
                }
              />
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                {/* 风险评分对比趋势 */}
                <div className="pd-card" style={{ padding: 20 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 16,
                    }}
                  >
                    <h3 className="pd-card-title">
                      {t("个人与机队对比", "Personal vs Fleet")}
                    </h3>
                    <select
                      className="pd-dropdown"
                      value={riskRange}
                      onChange={(e) =>
                        setRiskRange(e.target.value as RiskRange)
                      }
                    >
                      <option value="1m">{t("1个月", "1 month")}</option>
                      <option value="3m">{t("3个月", "3 months")}</option>
                      <option value="6m">{t("6个月", "6 months")}</option>
                    </select>
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={fleetTrendData ?? peerAnalysisData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={GRID_STROKE}
                      />
                      <XAxis
                        dataKey={fleetTrendData ? "label" : "month"}
                        tick={AXIS_TICK}
                        stroke={GRID_STROKE}
                      />
                      <YAxis
                        tick={AXIS_TICK}
                        stroke={GRID_STROKE}
                        domain={[0, 50]}
                      />
                      <Tooltip {...darkTooltipStyle} />
                      <Line
                        type="monotone"
                        dataKey="individual"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: "#3b82f6", r: 4 }}
                        name={t("个人", "Individual")}
                      />
                      {!fleetTrendData && (
                        <Line
                          type="monotone"
                          dataKey="squadron"
                          stroke="#ea580c"
                          strokeWidth={2}
                          dot={{ fill: "#ea580c", r: 4 }}
                          name={t("中队平均", "Squadron Avg")}
                        />
                      )}
                      <Line
                        type="monotone"
                        dataKey="fleet"
                        stroke="#94a3b8"
                        strokeWidth={2}
                        strokeDasharray="6 3"
                        dot={{ fill: "#94a3b8", r: 4 }}
                        name={t("机队平均", "Fleet Avg")}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* 风险指标雷达图对比 */}
                <div className="pd-card" style={{ padding: 20 }}>
                  <h3 className="pd-card-title" style={{ marginBottom: 16 }}>
                    {t(
                      "个人与机队风险指标对比",
                      "Individual vs Fleet Risk Indicators",
                    )}
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart
                      data={
                        fleetRadarData ?? [
                          {
                            indicator: t("不稳定进近", "Unstable Approach"),
                            individual: 7.2,
                            fleet: 4.5,
                          },
                          {
                            indicator: t("重着陆", "Hard Landing"),
                            individual: 5.8,
                            fleet: 3.8,
                          },
                          {
                            indicator: t("超限事件", "Exceedance Events"),
                            individual: 6.5,
                            fleet: 4.2,
                          },
                          {
                            indicator: t("偏航率", "Deviation Rate"),
                            individual: 4.1,
                            fleet: 3.5,
                          },
                          {
                            indicator: t("进近坡度", "Approach Slope"),
                            individual: 5.5,
                            fleet: 4.0,
                          },
                          {
                            indicator: t("着陆速度偏差", "Landing Speed Dev"),
                            individual: 6.0,
                            fleet: 3.9,
                          },
                        ]
                      }
                    >
                      <PolarGrid stroke="rgba(148,163,184,0.15)" />
                      <PolarAngleAxis
                        dataKey="indicator"
                        tick={{ fill: "#94a3b8", fontSize: 11 }}
                      />
                      <PolarRadiusAxis
                        angle={30}
                        domain={[0, fleetRadarData ? 100 : 10]}
                        tick={{ fill: "#64748b", fontSize: 10 }}
                        axisLine={false}
                      />
                      <Radar
                        name={t("个人", "Individual")}
                        dataKey="individual"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.25}
                        strokeWidth={2}
                      />
                      <Radar
                        name={t("机队平均", "Fleet Avg")}
                        dataKey="fleet"
                        stroke="#94a3b8"
                        fill="#94a3b8"
                        fillOpacity={0.1}
                        strokeWidth={2}
                        strokeDasharray="6 3"
                      />
                      <Legend
                        wrapperStyle={{ fontSize: 11, color: "#94a3b8" }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "rgba(15,23,42,0.95)",
                          border: "1px solid rgba(148,163,184,0.2)",
                          borderRadius: 6,
                          fontSize: 12,
                          color: "#e2e8f0",
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          {activeNav === "training-data" &&
            (trainingDataLoading || !trainingData ? (
              <TabLoading text={t("加载中...", "Loading...")} />
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                {/* 九维度能力评估 */}
                <div className="pd-card" style={{ padding: 20 }}>
                  <h3 className="pd-card-title" style={{ marginBottom: 16 }}>
                    {t(
                      "九维度能力评估",
                      "Nine-Dimension Competency Assessment",
                    )}
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: 12,
                    }}
                  >
                    {(() => {
                      const enLabels: Record<string, string> = {
                        KNO: "Knowledge",
                        PRO: "Procedures",
                        FPA: "Flight Path Automation",
                        FPM: "Flight Path Manual",
                        COM: "Communication",
                        LTW: "Leadership & Teamwork",
                        WLM: "Workload Management",
                        SAW: "Situation Awareness",
                        PSD: "Problem Solving & Decision",
                      };
                      const fallback = [
                        { key: "KNO", zh: "知识", en: "Knowledge", score: 4 },
                        { key: "PRO", zh: "程序", en: "Procedures", score: 5 },
                        {
                          key: "FPA",
                          zh: "飞行路径自动化",
                          en: "Flight Path Automation",
                          score: 3,
                        },
                        {
                          key: "FPM",
                          zh: "飞行路径手动",
                          en: "Flight Path Manual",
                          score: 4,
                        },
                        {
                          key: "COM",
                          zh: "沟通",
                          en: "Communication",
                          score: 5,
                        },
                        {
                          key: "LTW",
                          zh: "领导与团队协作",
                          en: "Leadership & Teamwork",
                          score: 4,
                        },
                        {
                          key: "WLM",
                          zh: "工作负荷管理",
                          en: "Workload Management",
                          score: 3,
                        },
                        {
                          key: "SAW",
                          zh: "态势感知",
                          en: "Situation Awareness",
                          score: 4,
                        },
                        {
                          key: "PSD",
                          zh: "问题解决与决策",
                          en: "Problem Solving & Decision",
                          score: 5,
                        },
                      ];
                      const items =
                        competencyItems.length > 0
                          ? competencyItems.map((c: any) => ({
                              key: c.code,
                              zh: c.name,
                              en: enLabels[c.code] || c.name,
                              score: c.score,
                            }))
                          : fallback;
                      return items;
                    })().map((dim: any) => (
                      <div
                        key={dim.key}
                        style={{
                          background: "rgba(15,23,42,0.5)",
                          borderRadius: 8,
                          padding: "12px 16px",
                          border: "1px solid rgba(148,163,184,0.1)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 8,
                          }}
                        >
                          <span style={{ color: "#94a3b8", fontSize: 12 }}>
                            {dim.key} · {t(dim.zh, dim.en)}
                          </span>
                          <span
                            style={{
                              color:
                                dim.score >= 4
                                  ? "#22c55e"
                                  : dim.score >= 3
                                    ? "#eab308"
                                    : "#ef4444",
                              fontWeight: 700,
                              fontSize: 18,
                            }}
                          >
                            {dim.score}
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: 4 }}>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <div
                              key={n}
                              style={{
                                flex: 1,
                                height: 6,
                                borderRadius: 3,
                                background:
                                  n <= dim.score
                                    ? dim.score >= 4
                                      ? "#22c55e"
                                      : dim.score >= 3
                                        ? "#eab308"
                                        : "#ef4444"
                                    : "rgba(148,163,184,0.15)",
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 训练科目推荐 */}
                <div className="pd-card" style={{ padding: 20 }}>
                  <h3 className="pd-card-title" style={{ marginBottom: 16 }}>
                    {t("训练科目推荐", "Training Subject Recommendations")}
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    {(trainingRecommendations.length > 0
                      ? trainingRecommendations.map((r: any) => {
                          const color =
                            r.priority === "高"
                              ? "#ef4444"
                              : r.priority === "中"
                                ? "#eab308"
                                : "#22c55e";
                          return {
                            subject: r.title,
                            dim: r.code,
                            reason: r.description,
                            priority: r.priority,
                            color,
                          };
                        })
                      : [
                          {
                            subject: t(
                              "飞行路径自动化管理强化训练",
                              "Flight Path Automation Management Training",
                            ),
                            dim: "FPA",
                            reason: t(
                              "当前评分偏低，需强化自动化飞行管理能力",
                              "Current score is low, need to strengthen automation management",
                            ),
                            priority: t("高", "High"),
                            color: "#ef4444",
                          },
                          {
                            subject: t(
                              "工作负荷管理场景模拟训练",
                              "Workload Management Scenario Simulation",
                            ),
                            dim: "WLM",
                            reason: t(
                              "工作负荷管理得分不足，建议增加高压场景训练",
                              "Workload management score insufficient, recommend high-pressure scenario training",
                            ),
                            priority: t("高", "High"),
                            color: "#ef4444",
                          },
                          {
                            subject: t(
                              "CRM团队协作专项训练",
                              "CRM Team Coordination Training",
                            ),
                            dim: "LTW",
                            reason: t(
                              "提升领导力与机组资源管理水平",
                              "Improve leadership and crew resource management",
                            ),
                            priority: t("中", "Medium"),
                            color: "#eab308",
                          },
                          {
                            subject: t(
                              "态势感知与威胁识别训练",
                              "Situation Awareness & Threat Recognition Training",
                            ),
                            dim: "SAW",
                            reason: t(
                              "巩固态势感知能力，预防潜在风险",
                              "Consolidate situation awareness, prevent potential risks",
                            ),
                            priority: t("低", "Low"),
                            color: "#22c55e",
                          },
                        ]
                    ).map((item: any, i: number) => (
                      <div
                        key={i}
                        style={{
                          background: "rgba(15,23,42,0.5)",
                          borderRadius: 8,
                          padding: "12px 16px",
                          border: "1px solid rgba(148,163,184,0.1)",
                          display: "flex",
                          alignItems: "center",
                          gap: 16,
                        }}
                      >
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            color: item.color,
                            background: `${item.color}20`,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.priority}
                        </span>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              color: "#e2e8f0",
                              fontSize: 13,
                              fontWeight: 600,
                            }}
                          >
                            {item.subject}
                            <span
                              style={{
                                color: "#64748b",
                                fontWeight: 400,
                                marginLeft: 8,
                                fontSize: 11,
                              }}
                            >
                              ({item.dim})
                            </span>
                          </div>
                          <div
                            style={{
                              color: "#94a3b8",
                              fontSize: 11,
                              marginTop: 2,
                            }}
                          >
                            {item.reason}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          {activeNav === "training-scenarios" && (
            <TrainingScenariosSection t={t} />
          )}
          {activeNav === "squadron-monthly" && <SquadronMonthlySection t={t} />}
          {activeNav === "historical-flights" && (
            <div className="pd-card" style={{ padding: 20 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <h3 className="pd-card-title">
                  {t("历史航班", "Historical Flights")}
                </h3>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <select
                    className="pd-dropdown"
                    value={flightsRiskLevel}
                    onChange={(e) =>
                      setFlightsRiskLevel(
                        e.target.value as "" | "高" | "中" | "低",
                      )
                    }
                  >
                    <option value="">{t("全部风险", "All Risk")}</option>
                    <option value="高">{t("高", "High")}</option>
                    <option value="中">{t("中", "Medium")}</option>
                    <option value="低">{t("低", "Low")}</option>
                  </select>
                  <input
                    type="date"
                    value={flightsStartDate}
                    onChange={(e) => setFlightsStartDate(e.target.value)}
                    style={{
                      background: "rgba(15,23,42,0.5)",
                      border: "1px solid rgba(148,163,184,0.2)",
                      borderRadius: 6,
                      padding: "4px 8px",
                      color: "#e2e8f0",
                      fontSize: 12,
                    }}
                  />
                  <span style={{ color: "#64748b" }}>—</span>
                  <input
                    type="date"
                    value={flightsEndDate}
                    onChange={(e) => setFlightsEndDate(e.target.value)}
                    style={{
                      background: "rgba(15,23,42,0.5)",
                      border: "1px solid rgba(148,163,184,0.2)",
                      borderRadius: 6,
                      padding: "4px 8px",
                      color: "#e2e8f0",
                      fontSize: 12,
                    }}
                  />
                  {(flightsRiskLevel || flightsStartDate || flightsEndDate) && (
                    <button
                      onClick={() => {
                        setFlightsRiskLevel("");
                        setFlightsStartDate("");
                        setFlightsEndDate("");
                      }}
                      style={{
                        background: "rgba(71,85,105,0.5)",
                        border: "1px solid rgba(148,163,184,0.2)",
                        borderRadius: 6,
                        padding: "4px 10px",
                        color: "#e2e8f0",
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      {t("重置", "Reset")}
                    </button>
                  )}
                </div>
              </div>
              {historicalFlightsLoading || !historicalFlights ? (
                <div
                  style={{
                    padding: 40,
                    textAlign: "center",
                    color: "#64748b",
                  }}
                >
                  {t("加载中...", "Loading...")}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: "#94a3b8" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr
                        style={{
                          borderBottom: "1px solid rgba(148,163,184,0.15)",
                        }}
                      >
                        <th
                          style={{
                            textAlign: "left",
                            padding: "8px 12px",
                            color: "#94a3b8",
                            fontSize: 12,
                          }}
                        >
                          {t("航班号", "Flight No.")}
                        </th>
                        <th
                          style={{
                            textAlign: "left",
                            padding: "8px 12px",
                            color: "#94a3b8",
                            fontSize: 12,
                          }}
                        >
                          {t("日期", "Date")}
                        </th>
                        <th
                          style={{
                            textAlign: "left",
                            padding: "8px 12px",
                            color: "#94a3b8",
                            fontSize: 12,
                          }}
                        >
                          {t("出发机场", "Departure")}
                        </th>
                        <th
                          style={{
                            textAlign: "left",
                            padding: "8px 12px",
                            color: "#94a3b8",
                            fontSize: 12,
                          }}
                        >
                          {t("到达机场", "Arrival")}
                        </th>
                        <th
                          style={{
                            textAlign: "left",
                            padding: "8px 12px",
                            color: "#94a3b8",
                            fontSize: 12,
                          }}
                        >
                          {t("机型", "Aircraft Type")}
                        </th>
                        <th
                          style={{
                            textAlign: "left",
                            padding: "8px 12px",
                            color: "#94a3b8",
                            fontSize: 12,
                          }}
                        >
                          {t("风险等级", "Risk Level")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(flightItems.length > 0
                        ? flightItems.map((f: any) => ({
                            id: f.id,
                            fn: f.flightNo,
                            date: f.departureTime
                              ? String(f.departureTime).slice(0, 10)
                              : "—",
                            dep:
                              f.departureAirport?.code ||
                              f.departureAirport?.name ||
                              "—",
                            arr:
                              f.arrivalAirport?.code ||
                              f.arrivalAirport?.name ||
                              "—",
                            type:
                              f.plane?.model || f.plane?.registration || "—",
                            risk: f.riskLevel || "—",
                            color:
                              f.riskLevel === "高"
                                ? "#ef4444"
                                : f.riskLevel === "中"
                                  ? "#eab308"
                                  : "#22c55e",
                          }))
                        : [
                            {
                              id: 0,
                              fn: "MU5101",
                              date: "2024-03-15",
                              dep: "ZSPD",
                              arr: "ZBAA",
                              type: "B737-800",
                              risk: t("高", "High"),
                              color: "#ef4444",
                            },
                            {
                              id: 0,
                              fn: "MU5235",
                              date: "2024-03-10",
                              dep: "ZBAA",
                              arr: "ZSPD",
                              type: "B737-800",
                              risk: t("中", "Medium"),
                              color: "#eab308",
                            },
                            {
                              id: 0,
                              fn: "MU5302",
                              date: "2024-02-28",
                              dep: "ZSPD",
                              arr: "ZGGG",
                              type: "A320",
                              risk: t("高", "High"),
                              color: "#ef4444",
                            },
                            {
                              id: 0,
                              fn: "MU5418",
                              date: "2024-02-20",
                              dep: "ZGGG",
                              arr: "ZSPD",
                              type: "A320",
                              risk: t("低", "Low"),
                              color: "#22c55e",
                            },
                            {
                              id: 0,
                              fn: "MU5506",
                              date: "2024-02-15",
                              dep: "ZSPD",
                              arr: "ZSSS",
                              type: "B737-800",
                              risk: t("中", "Medium"),
                              color: "#eab308",
                            },
                            {
                              id: 0,
                              fn: "MU5612",
                              date: "2024-02-10",
                              dep: "ZSSS",
                              arr: "ZSPD",
                              type: "B777",
                              risk: t("低", "Low"),
                              color: "#22c55e",
                            },
                          ]
                      ).map((f, i) => (
                        <tr
                          key={f.id || i}
                          style={{
                            borderBottom: "1px solid rgba(148,163,184,0.08)",
                            cursor: "pointer",
                          }}
                          onClick={() =>
                            navigate(
                              f.id
                                ? `/risk-monitoring/flight-detail?id=${f.id}`
                                : `/risk-monitoring/flight-detail?fn=${f.fn}`,
                            )
                          }
                        >
                          <td
                            style={{
                              padding: "8px 12px",
                              color: "#e2e8f0",
                              fontWeight: 600,
                            }}
                          >
                            {f.fn}
                          </td>
                          <td style={{ padding: "8px 12px" }}>{f.date}</td>
                          <td style={{ padding: "8px 12px" }}>{f.dep}</td>
                          <td style={{ padding: "8px 12px" }}>{f.arr}</td>
                          <td style={{ padding: "8px 12px" }}>{f.type}</td>
                          <td style={{ padding: "8px 12px" }}>
                            <span style={{ color: f.color, fontWeight: 600 }}>
                              {f.risk}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- Risk Profile Section ----------

interface RiskProfileSectionProps {
  data: any;
  range: RiskRange;
  onRangeChange: (r: RiskRange) => void;
}

function RiskProfileSection({
  data,
  range,
  onRangeChange,
}: RiskProfileSectionProps) {
  const { t } = useLanguage();

  // 优先使用接口数据，缺字段时回退 mock
  const trendData =
    data?.trend?.series?.map((s: any) => ({
      month: s.label,
      monthZh: s.label,
      composite: s.overall,
      human: s.humanFactor,
    })) ?? riskScoreTrendData;

  const contributorsData =
    data?.contributors?.map((c: any) => ({
      name: c.name,
      nameZh: c.name,
      value: c.value,
    })) ?? keyRiskContributorsData;

  const severityColor = (s: string) =>
    s === "red" ? "#dc2626" : s === "yellow" ? "#eab308" : "#22c55e";
  const indicatorList =
    data?.mainIndicators?.map((m: any) => ({
      label: m.label,
      labelZh: m.label,
      color: severityColor(m.severity),
    })) ?? topRiskIndicators;

  const peerData =
    data?.peerComparison?.series?.map((s: any) => ({
      month: s.label,
      individual: s.self,
      squadron: s.squadronAvg,
      fleet: s.fleetAvg,
    })) ?? peerAnalysisData;

  return (
    <>
      {/* Row 1: Three cards */}
      <div className="pd-row-3">
        {/* Risk Score Trend */}
        <div className="pd-card">
          <div className="pd-card-header">
            <h3 className="pd-card-title">
              {t("风险评分趋势", "Risk Score Trend")}
            </h3>
            <select
              className="pd-dropdown"
              value={range}
              onChange={(e) => onRangeChange(e.target.value as RiskRange)}
            >
              <option value="1m">{t("1个月", "1 month")}</option>
              <option value="3m">{t("3个月", "3 months")}</option>
              <option value="6m">{t("6个月", "6 months")}</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient
                  id="riskZoneGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.15} />
                  <stop offset="35%" stopColor="#eab308" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0.08} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis
                dataKey={(d: any) => t(d.monthZh, d.month)}
                tick={AXIS_TICK}
                stroke={GRID_STROKE}
              />
              <YAxis tick={AXIS_TICK} stroke={GRID_STROKE} domain={[0, 50]} />
              <Tooltip {...darkTooltipStyle} />
              <Area
                type="monotone"
                dataKey="composite"
                stroke="transparent"
                fill="url(#riskZoneGradient)"
                fillOpacity={1}
              />
              <Line
                type="monotone"
                dataKey="composite"
                stroke="#1e293b"
                strokeWidth={2}
                dot={{ fill: "#1e293b", r: 3 }}
                name={t("综合评分", "Composite Score")}
              />
              <Line
                type="monotone"
                dataKey="human"
                stroke="#94a3b8"
                strokeWidth={2}
                dot={{ fill: "#94a3b8", r: 3 }}
                name={t("人为因素分项", "Human Factor Component")}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="pd-legend">
            <div className="pd-legend-item">
              <span
                className="pd-legend-line"
                style={{ background: "#1e293b" }}
              />
              {t("综合评分", "Composite Score")}
            </div>
            <div className="pd-legend-item">
              <span
                className="pd-legend-line"
                style={{ background: "#94a3b8" }}
              />
              {t("人为因素分项", "Human Factor Component")}
            </div>
          </div>
        </div>

        {/* Key Risk Contributors */}
        <div className="pd-card">
          <div className="pd-card-header">
            <h3 className="pd-card-title">
              {t("关键风险贡献因素", "Key Risk Contributors")}
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={contributorsData}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis
                dataKey={(d: any) => t(d.nameZh, d.name)}
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                stroke={GRID_STROKE}
                interval={0}
              />
              <YAxis tick={AXIS_TICK} stroke={GRID_STROKE} domain={[0, 50]} />
              <Tooltip {...darkTooltipStyle} />
              <Bar
                dataKey="value"
                fill="#3b82f6"
                barSize={28}
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Risk Indicators */}
        <div className="pd-card">
          <div className="pd-card-header">
            <h3 className="pd-card-title">
              {t("主要风险指标", "Top Risk Indicators")}
            </h3>
          </div>
          <div className="pd-indicator-list">
            {indicatorList.map((item: any, i: number) => (
              <div className="pd-indicator-item" key={i}>
                <span
                  className="pd-indicator-dot"
                  style={{ background: item.color }}
                />
                <span>{t(item.labelZh, item.label)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Two cards */}
      <div className="pd-row-2">
        {/* Comparative Peer Analysis */}
        <div className="pd-card">
          <div className="pd-card-header">
            <h3 className="pd-card-title">
              {t("同类对比分析", "Comparative Peer Analysis")}
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={peerData}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis dataKey="month" tick={AXIS_TICK} stroke={GRID_STROKE} />
              <YAxis tick={AXIS_TICK} stroke={GRID_STROKE} domain={[0, 50]} />
              <Tooltip {...darkTooltipStyle} />
              <Bar
                dataKey="individual"
                fill="rgba(148,163,184,0.08)"
                barSize={30}
              />
              <Line
                type="monotone"
                dataKey="individual"
                stroke="#1e293b"
                strokeWidth={2}
                dot={{ fill: "#1e293b", r: 4, stroke: "#1e293b" }}
                name={t(
                  "个人当前综合风险",
                  "Current Composite Risk as the Individual",
                )}
              />
              <Line
                type="monotone"
                dataKey="squadron"
                stroke="#ea580c"
                strokeWidth={2}
                dot={{ fill: "#ea580c", r: 4, stroke: "#ea580c" }}
                name={t(
                  "当前综合与中队平均",
                  "Current Composite and Squadron Average",
                )}
              />
              <Line
                type="monotone"
                dataKey="fleet"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="6 3"
                dot={{ fill: "#94a3b8", r: 4, stroke: "#94a3b8" }}
                name={t(
                  "当前综合与机队平均",
                  "Current Composite and Fleet Average",
                )}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="pd-legend">
            <div className="pd-legend-item">
              <span
                className="pd-legend-line"
                style={{ background: "#1e293b" }}
              />
              {t(
                "个人当前综合风险",
                "Current Composite Risk as the Individual",
              )}
            </div>
            <div className="pd-legend-item">
              <span
                className="pd-legend-line"
                style={{ background: "#ea580c" }}
              />
              {t(
                "当前综合与中队平均",
                "Current Composite and Squadron Average",
              )}
            </div>
            <div className="pd-legend-item">
              <span
                className="pd-legend-line-dashed"
                style={{ color: "#94a3b8" }}
              />
              {t("当前综合与机队平均", "Current Composite and Fleet Average")}
            </div>
          </div>
        </div>

        {/* Action Links */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="pd-action-link">
            <div className="pd-action-link-text">
              <span className="pd-action-link-title">
                {t("查看推荐训练", "View Recommended Training")}
              </span>
              <span className="pd-action-link-sub">
                {t("查看其他推荐训练", "View rest recommended training")}
              </span>
            </div>
            {/* <svg
              className="pd-action-link-chevron"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg> */}
          </div>
          <div className="pd-action-link">
            <div className="pd-action-link-text">
              <span className="pd-action-link-title">
                {t(
                  "相关高风险航班（近30天）",
                  "Related High-Risk Flights (Last 30 Days)",
                )}
              </span>
            </div>
            {/* <svg
              className="pd-action-link-chevron"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg> */}
          </div>
        </div>
      </div>
    </>
  );
}

// ---------- Squadron Monthly Report Section ----------

const squadronMonthlyFlightData = [
  { month: "2024-01", high: 3, medium: 8 },
  { month: "2024-02", high: 5, medium: 12 },
  { month: "2024-03", high: 2, medium: 9 },
  { month: "2024-04", high: 4, medium: 11 },
  { month: "2024-05", high: 6, medium: 14 },
  { month: "2024-06", high: 3, medium: 10 },
];

const squadronRiskPersonnel = [
  {
    empNo: "P130012",
    name: "张伟",
    riskLevel: "HIGH",
    riskScore: 82,
    highFlights: 4,
    tags: "疲劳超标、不稳定进近",
  },
  {
    empNo: "P130045",
    name: "李强",
    riskLevel: "HIGH",
    riskScore: 76,
    highFlights: 3,
    tags: "CRM不足",
  },
  {
    empNo: "P130078",
    name: "王军",
    riskLevel: "MEDIUM",
    riskScore: 58,
    highFlights: 2,
    tags: "着陆偏差",
  },
  {
    empNo: "P130091",
    name: "刘洋",
    riskLevel: "MEDIUM",
    riskScore: 52,
    highFlights: 1,
    tags: "进近坡度偏差",
  },
  {
    empNo: "P130103",
    name: "陈鹏",
    riskLevel: "MEDIUM",
    riskScore: 48,
    highFlights: 1,
    tags: "排班异常",
  },
];

const squadronRiskScoreTrend = [
  { month: "2024-01", avg: 32, max: 78, min: 8 },
  { month: "2024-02", avg: 35, max: 82, min: 10 },
  { month: "2024-03", avg: 30, max: 71, min: 7 },
  { month: "2024-04", avg: 38, max: 85, min: 12 },
  { month: "2024-05", avg: 41, max: 88, min: 15 },
  { month: "2024-06", avg: 36, max: 76, min: 11 },
];

const squadronTopIndicators = [
  {
    label: "不稳定进近",
    labelEn: "Unstable Approach",
    count: 18,
    color: "#ef4444",
  },
  { label: "重着陆", labelEn: "Hard Landing", count: 12, color: "#ef4444" },
  {
    label: "疲劳指数超标",
    labelEn: "Fatigue Index Exceeded",
    count: 9,
    color: "#f97316",
  },
  {
    label: "进近速度偏差",
    labelEn: "Approach Speed Deviation",
    count: 7,
    color: "#eab308",
  },
  {
    label: "着陆接地点偏差",
    labelEn: "Touchdown Point Deviation",
    count: 6,
    color: "#eab308",
  },
  {
    label: "侧风着陆偏差",
    labelEn: "Crosswind Landing Deviation",
    count: 4,
    color: "#22c55e",
  },
];

function SquadronMonthlySection({
  t,
}: {
  t: (zh: string, en: string) => string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* 月度高/中风险航班趋势 */}
      <div className="pd-card" style={{ padding: 20 }}>
        <h3 className="pd-card-title" style={{ marginBottom: 16 }}>
          {t("月度高/中风险航班数", "Monthly High/Medium Risk Flights")}
        </h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={squadronMonthlyFlightData}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
            <XAxis
              dataKey="month"
              tick={AXIS_TICK}
              stroke={GRID_STROKE}
              tickFormatter={(v: string) => v.slice(5)}
            />
            <YAxis tick={AXIS_TICK} stroke={GRID_STROKE} />
            <Tooltip {...darkTooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
            <Bar
              dataKey="high"
              fill="#ef4444"
              name={t("高风险", "High Risk")}
              barSize={20}
              radius={[3, 3, 0, 0]}
            />
            <Bar
              dataKey="medium"
              fill="#f97316"
              name={t("中风险", "Medium Risk")}
              barSize={20}
              radius={[3, 3, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 高/中风险对应人员 */}
      <div className="pd-card" style={{ padding: 20 }}>
        <h3 className="pd-card-title" style={{ marginBottom: 16 }}>
          {t("高/中风险人员", "High/Medium Risk Personnel")}
        </h3>
        <table
          style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
        >
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(148,163,184,0.15)" }}>
              <th
                style={{
                  textAlign: "left",
                  padding: "8px 12px",
                  color: "#94a3b8",
                  fontSize: 12,
                }}
              >
                {t("工号", "Emp No.")}
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "8px 12px",
                  color: "#94a3b8",
                  fontSize: 12,
                }}
              >
                {t("姓名", "Name")}
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "8px 12px",
                  color: "#94a3b8",
                  fontSize: 12,
                }}
              >
                {t("风险等级", "Risk Level")}
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "8px 12px",
                  color: "#94a3b8",
                  fontSize: 12,
                }}
              >
                {t("风险评分", "Score")}
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "8px 12px",
                  color: "#94a3b8",
                  fontSize: 12,
                }}
              >
                {t("高风险航班", "High-Risk Flights")}
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "8px 12px",
                  color: "#94a3b8",
                  fontSize: 12,
                }}
              >
                {t("风险标签", "Risk Tags")}
              </th>
            </tr>
          </thead>
          <tbody>
            {squadronRiskPersonnel.map((p) => (
              <tr
                key={p.empNo}
                style={{ borderBottom: "1px solid rgba(148,163,184,0.08)" }}
              >
                <td
                  style={{
                    padding: "8px 12px",
                    color: "#e2e8f0",
                    fontWeight: 600,
                  }}
                >
                  {p.empNo}
                </td>
                <td style={{ padding: "8px 12px", color: "#e2e8f0" }}>
                  {p.name}
                </td>
                <td style={{ padding: "8px 12px" }}>
                  <span
                    style={{
                      color: p.riskLevel === "HIGH" ? "#ef4444" : "#f97316",
                      fontWeight: 600,
                    }}
                  >
                    {p.riskLevel === "HIGH"
                      ? t("高", "High")
                      : t("中", "Medium")}
                  </span>
                </td>
                <td style={{ padding: "8px 12px", color: "#e2e8f0" }}>
                  {p.riskScore}
                </td>
                <td style={{ padding: "8px 12px", color: "#e2e8f0" }}>
                  {p.highFlights}
                </td>
                <td
                  style={{
                    padding: "8px 12px",
                    color: "#94a3b8",
                    fontSize: 12,
                  }}
                >
                  {p.tags}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* 风险评分趋势 */}
        <div className="pd-card" style={{ padding: 20 }}>
          <h3 className="pd-card-title" style={{ marginBottom: 16 }}>
            {t("中队风险评分趋势", "Squadron Risk Score Trend")}
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={squadronRiskScoreTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis
                dataKey="month"
                tick={AXIS_TICK}
                stroke={GRID_STROKE}
                tickFormatter={(v: string) => v.slice(5)}
              />
              <YAxis tick={AXIS_TICK} stroke={GRID_STROKE} domain={[0, 100]} />
              <Tooltip {...darkTooltipStyle} />
              <Area
                type="monotone"
                dataKey="max"
                stroke="#ef4444"
                fill="rgba(239,68,68,0.08)"
                strokeWidth={1.5}
                name={t("最高", "Max")}
              />
              <Line
                type="monotone"
                dataKey="avg"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: "#3b82f6", r: 3 }}
                name={t("平均", "Avg")}
              />
              <Area
                type="monotone"
                dataKey="min"
                stroke="#22c55e"
                fill="rgba(34,197,94,0.08)"
                strokeWidth={1.5}
                name={t("最低", "Min")}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="pd-legend">
            <div className="pd-legend-item">
              <span
                className="pd-legend-line"
                style={{ background: "#ef4444" }}
              />
              {t("最高", "Max")}
            </div>
            <div className="pd-legend-item">
              <span
                className="pd-legend-line"
                style={{ background: "#3b82f6" }}
              />
              {t("平均", "Avg")}
            </div>
            <div className="pd-legend-item">
              <span
                className="pd-legend-line"
                style={{ background: "#22c55e" }}
              />
              {t("最低", "Min")}
            </div>
          </div>
        </div>

        {/* 主要风险指标 */}
        <div className="pd-card" style={{ padding: 20 }}>
          <h3 className="pd-card-title" style={{ marginBottom: 16 }}>
            {t("主要风险指标", "Top Risk Indicators")}
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {squadronTopIndicators.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "8px 12px",
                  background: "rgba(15,23,42,0.5)",
                  borderRadius: 6,
                  border: "1px solid rgba(148,163,184,0.08)",
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: item.color,
                    flexShrink: 0,
                  }}
                />
                <span style={{ flex: 1, color: "#e2e8f0", fontSize: 13 }}>
                  {t(item.label, item.labelEn)}
                </span>
                <span
                  style={{
                    color: "#94a3b8",
                    fontSize: 12,
                    minWidth: 50,
                    textAlign: "right",
                  }}
                >
                  {item.count} {t("次", "times")}
                </span>
                <div
                  style={{
                    width: 80,
                    height: 6,
                    borderRadius: 3,
                    background: "rgba(148,163,184,0.12)",
                  }}
                >
                  <div
                    style={{
                      width: `${(item.count / 20) * 100}%`,
                      height: "100%",
                      borderRadius: 3,
                      background: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Training Scenarios Section ----------

const trainingScenarios = [
  {
    id: 1,
    env: {
      airport: "浦东 ZSPD 35L",
      time: "黄昏",
      wind: "L20",
      visibility: "1300米",
      weather: "小雨",
      temp: "25°C",
      friction: "5",
      lights: "亮",
    },
    sop: "按侧风着陆标准程序要求进行着陆；在 1300 米低能见度环境下严格执行仪表至目视的转换程序",
    focus: `必须高度关注 L20 强侧风与 1300 米低能见度的叠加挑战，要求在 150ft 至 50ft 阶段保持极高的仪表扫描频率，严禁过早盲目抬头寻找跑道，确保在看清灯光瞬间能立即判断并修正由左侧风导致的向右侧下风区偏离的倾向；针对 20 节左侧风，修正动作需遵循"左翼下沉、右舵补偿"的侧滑逻辑，在 50ft 关键高度前必须完成精准的蟹形角转换，严禁在低高度出现大幅度、非协调的横侧摆动，确保接地瞬间机头与中心线平行，并保证合理的下滑道追踪。`,
    tags: ["侧风着陆", "低能见度", "仪表转目视"],
    difficulty: "high",
  },
  {
    id: 2,
    env: {
      airport: "浦东 ZSPD 35L",
      time: "昼",
      wind: "H10",
      visibility: "2000米",
      weather: "中雨",
      temp: "10°C",
      friction: "3",
      lights: "亮",
    },
    sop: "稳定进近标准程序要求飞行员在昼间中雨及低能见度条件下建立并保持精准的下滑剖面",
    focus: `针对昼间中雨环境带来的视界干扰，飞行员需高度警惕挡风玻璃水膜导致的"下滑道偏高"视觉幻觉，防止在 150ft 至 50ft 关键阶段因盲目下压机头修正而低于标准下滑道，应坚持以仪表下滑指引为核心参考并辅以 PAPI 灯核对，确保垂直速度平稳可控，保持合理的下滑道追踪。10 节迎风虽然有利于降低地速，但在中雨环境下仍需严密监控空速趋势，确保推力补偿，严防能量衰减导致的下沉率增大。鉴于摩擦系数仅为 3，应果断放弃追求"轻飘"接地的操作，寻求在目标接地区内实施扎实触地以有效刺破水膜，确保自动刹车和扰流板及时生效。`,
    tags: ["湿滑跑道", "视觉幻觉", "能量管理"],
    difficulty: "medium",
  },
  {
    id: 3,
    env: {
      airport: "浦东 ZSPD 35L",
      time: "黄昏",
      wind: "H20",
      visibility: "2000米",
      weather: "中雨",
      temp: "25°C",
      friction: "3",
      lights: "亮",
    },
    sop: "稳定进近标准程序要求飞行员在强迎风及中雨条件下严格监控空速与地速的关系，针对摩擦系数 3 的湿滑道面，必须执行性能受限条件下的进近与着陆程序",
    focus: `必须强化 20 节强迎风环境下的能量与剖面管控，由于迎风会导致地速较低，飞行员在 150ft 至 50ft 阶段需严密监控空速趋势并保持精准的推力补偿，严防因中雨环境下的推力调节滞后导致下降率骤增或低于下滑道；针对黄昏中雨产生的视程干扰，需高度警惕挡风玻璃水膜引发的"视景抬升"幻觉，这种错觉常诱使飞行员产生"高度偏高"的误判从而盲目下压机头，因此必须坚持"仪表主导、目视核对"的扫描模式，严格对标 ILS 指引与 PAPI 灯，并保证合理的下滑道追踪。`,
    tags: ["强迎风", "湿滑跑道", "能量管控"],
    difficulty: "high",
  },
  {
    id: 4,
    env: {
      airport: "浦东 ZSPD 35L",
      time: "夜",
      wind: "L38",
      visibility: "2000米",
      weather: "小雨",
      temp: "20°C",
      friction: "5",
      lights: "亮",
    },
    sop: `执行"减小偏流角"着陆程序，严密监控侧风极限。若在减小偏流角过程中操纵量达到极限，或无法将偏流角控制在 5度以内，必须立即复飞。`,
    focus: `针对 L38 极限侧风结合夜间小雨带来的复合压力，飞行员须保持全蟹形进近以锁定航迹安定。在拉平执行"减小偏流角"动作时，应采取"小偏流角"接地策略（不大于 5度），同时必须落实"舵杆联动"操纵逻辑，通过侧杆微调俯仰以补偿因蹬舵带来的垂直升力波动，严防下滑道（G/S）产生瞬时低偏离。严密监控侧杆横向输入角度，严防因向风侧机翼压杆过量导致 1 号发动机短舱（Pod Strike）触地的极限风险。鉴于夜间视程干扰，应坚持"仪表主导、目视校核"的高频扫描模式，严禁过早或长时间抬头盲目寻找跑道参考，确保下滑剖面在 PFD 指引下始终稳定直至接地。`,
    tags: ["极限侧风", "夜间", "减小偏流角"],
    difficulty: "critical",
  },
];

function difficultyStyle(d: string) {
  if (d === "critical")
    return { color: "#dc2626", bg: "rgba(220,38,38,0.12)", label: "极高" };
  if (d === "high")
    return { color: "#ef4444", bg: "rgba(239,68,68,0.12)", label: "高" };
  if (d === "medium")
    return { color: "#f97316", bg: "rgba(249,115,22,0.12)", label: "中" };
  return { color: "#22c55e", bg: "rgba(34,197,94,0.12)", label: "低" };
}

function TrainingScenariosSection({
  t,
}: {
  t: (zh: string, en: string) => string;
}) {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="pd-card" style={{ padding: 20 }}>
        <h3 className="pd-card-title" style={{ marginBottom: 4 }}>
          {t("推荐训练场景", "Recommended Training Scenarios")}
        </h3>
        <p style={{ color: "#64748b", fontSize: 12, margin: "0 0 16px" }}>
          {t(
            "基于飞行员风险档案和历史数据，推荐以下模拟机训练场景",
            "Based on pilot risk profile and historical data, the following simulator training scenarios are recommended",
          )}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {trainingScenarios.map((s) => {
            const diff = difficultyStyle(s.difficulty);
            const isOpen = expanded === s.id;
            return (
              <div
                key={s.id}
                style={{
                  background: "rgba(15,23,42,0.6)",
                  border: `1px solid ${isOpen ? "rgba(59,130,246,0.3)" : "rgba(148,163,184,0.1)"}`,
                  borderRadius: 10,
                  overflow: "hidden",
                  transition: "border-color 0.2s",
                }}
              >
                {/* Header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "14px 16px",
                    cursor: "pointer",
                  }}
                  onClick={() => setExpanded(isOpen ? null : s.id)}
                >
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: "rgba(59,130,246,0.15)",
                      color: "#60a5fa",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {s.id}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          color: "#e2e8f0",
                          fontSize: 14,
                          fontWeight: 600,
                        }}
                      >
                        {t("场景", "Scenario")} {s.id}
                      </span>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          color: diff.color,
                          background: diff.bg,
                        }}
                      >
                        {t(diff.label, s.difficulty.toUpperCase())}
                      </span>
                      {s.tags.map((tag, i) => (
                        <span
                          key={i}
                          style={{
                            padding: "1px 6px",
                            borderRadius: 3,
                            fontSize: 10,
                            color: "#94a3b8",
                            background: "rgba(148,163,184,0.1)",
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div
                      style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}
                    >
                      {s.env.airport} | {s.env.time} | {t("风", "Wind")}:{" "}
                      {s.env.wind} | {t("能见度", "Vis")}: {s.env.visibility} |{" "}
                      {s.env.weather}
                    </div>
                  </div>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="2"
                    style={{
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s",
                      flexShrink: 0,
                    }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>

                {/* Expanded Content */}
                {isOpen && (
                  <div
                    style={{
                      padding: "0 16px 16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 14,
                    }}
                  >
                    {/* 环境参数 */}
                    <div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "#94a3b8",
                          fontWeight: 600,
                          marginBottom: 8,
                        }}
                      >
                        {t("环境要素及参数", "Environment Parameters")}
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(4, 1fr)",
                          gap: 8,
                        }}
                      >
                        {[
                          [t("机场跑道", "Runway"), s.env.airport],
                          [t("昼夜", "Time"), s.env.time],
                          [t("风速风向", "Wind"), s.env.wind],
                          [t("能见度", "Visibility"), s.env.visibility],
                          [t("天气", "Weather"), s.env.weather],
                          [t("温度", "Temp"), s.env.temp],
                          [t("摩擦系数", "Friction"), s.env.friction],
                          [t("跑道灯光", "Lights"), s.env.lights],
                        ].map(([label, val], i) => (
                          <div
                            key={i}
                            style={{
                              background: "rgba(30,41,59,0.5)",
                              borderRadius: 6,
                              padding: "6px 10px",
                              border: "1px solid rgba(148,163,184,0.06)",
                            }}
                          >
                            <div style={{ fontSize: 10, color: "#64748b" }}>
                              {label}
                            </div>
                            <div
                              style={{
                                fontSize: 13,
                                color: "#e2e8f0",
                                fontWeight: 500,
                              }}
                            >
                              {val}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* SOP */}
                    <div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "#94a3b8",
                          fontWeight: 600,
                          marginBottom: 6,
                        }}
                      >
                        {t("手册标准", "SOP Standard")}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: "#cbd5e1",
                          lineHeight: 1.6,
                          background: "rgba(30,41,59,0.5)",
                          borderRadius: 6,
                          padding: "10px 12px",
                          border: "1px solid rgba(148,163,184,0.06)",
                        }}
                      >
                        {s.sop}
                      </div>
                    </div>

                    {/* 训练侧重点 */}
                    <div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "#f97316",
                          fontWeight: 600,
                          marginBottom: 6,
                        }}
                      >
                        {t("训练侧重点", "Training Focus")}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: "#cbd5e1",
                          lineHeight: 1.7,
                          background: "rgba(249,115,22,0.04)",
                          borderRadius: 6,
                          padding: "10px 12px",
                          border: "1px solid rgba(249,115,22,0.12)",
                        }}
                      >
                        {s.focus}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
