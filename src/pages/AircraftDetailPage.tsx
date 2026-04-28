import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "../i18n/useLanguage";
import { getPlaneDetail, getPlaneDetailPage } from "../api/plane";
import "./AircraftDetailPage.css";

// ===== Type =====

interface PlaneDetail {
  id: number;
  registration: string;
  model: string;
  aircraftCategory: string;
  operatingUnit: string;
  riskLevel: string;
  riskScore: number;
}

// ===== Gauge Component =====

function GaugeSVG({ score }: { score: number }) {
  const cx = 120;
  const cy = 110;
  const r = 90;
  const scoreAngle = Math.PI - (score / 100) * Math.PI;

  const segments = [
    { start: 0, end: 0.25, color: "#22c55e" },
    { start: 0.25, end: 0.5, color: "#eab308" },
    { start: 0.5, end: 0.75, color: "#f97316" },
    { start: 0.75, end: 1.0, color: "#ef4444" },
  ];

  function arcPath(startFrac: number, endFrac: number, radius: number) {
    const a1 = Math.PI - startFrac * Math.PI;
    const a2 = Math.PI - endFrac * Math.PI;
    const x1 = cx + radius * Math.cos(a1);
    const y1 = cy - radius * Math.sin(a1);
    const x2 = cx + radius * Math.cos(a2);
    const y2 = cy - radius * Math.sin(a2);
    const largeArc = endFrac - startFrac > 0.5 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
  }

  const needleLen = r - 12;
  const nx = cx + needleLen * Math.cos(scoreAngle);
  const ny = cy - needleLen * Math.sin(scoreAngle);

  return (
    <svg
      className="acd-gauge-svg"
      width="240"
      height="140"
      viewBox="0 0 240 140"
    >
      <path
        d={arcPath(0, 1, r)}
        fill="none"
        stroke="rgba(148,163,184,0.1)"
        strokeWidth="14"
        strokeLinecap="round"
      />
      {segments.map((seg, i) => (
        <path
          key={i}
          d={arcPath(seg.start, seg.end, r)}
          fill="none"
          stroke={seg.color}
          strokeWidth="14"
          strokeLinecap="butt"
          opacity={0.85}
        />
      ))}
      <line
        x1={cx}
        y1={cy}
        x2={nx}
        y2={ny}
        stroke="#f8fafc"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r="5" fill="#f8fafc" />
      <text
        x={cx}
        y={cy - 20}
        className="acd-gauge-score"
        style={{ fill: scoreColor(score) }}
      >
        {score}
      </text>
      <text x={cx - r + 5} y={cy + 18} className="acd-gauge-label">
        0
      </text>
      <text x={cx + r - 12} y={cy + 18} className="acd-gauge-label">
        100
      </text>
    </svg>
  );
}

// ===== Icons =====

function AirplaneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
    </svg>
  );
}

function WrenchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

// ===== Helper =====

function scoreColor(score: number): string {
  if (score >= 80) return "#ef4444";
  if (score >= 60) return "#f97316";
  if (score >= 40) return "#eab308";
  return "#22c55e";
}

function formatRiskLevel(level: string, t: (zh: string, en: string) => string) {
  switch (level) {
    case "LOW":
      return t("低", "Low");
    case "MEDIUM":
      return t("中", "Medium");
    case "HIGH":
      return t("高", "High");
    default:
      return level;
  }
}

// ===== Main Component =====

export function AircraftDetailPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tailParam = searchParams.get("tail");

  const [planeDetail, setPlaneDetail] = useState<PlaneDetail | null>(null);
  const [detailPage, setDetailPage] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!tailParam) return;
    setLoading(true);
    setNotFound(false);
    Promise.all([
      getPlaneDetail(tailParam),
      getPlaneDetailPage(tailParam).catch(() => null),
    ])
      .then(([basic, detail]: any[]) => {
        setPlaneDetail(basic as PlaneDetail);
        if (detail) setDetailPage(detail);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [tailParam]);

  const displayTailNumber = planeDetail?.registration || tailParam || "—";

  if (loading) {
    return (
      <div
        className="acd-root"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 300,
        }}
      >
        <span style={{ color: "#94a3b8", fontSize: 16 }}>
          {t("加载中...", "Loading...")}
        </span>
      </div>
    );
  }

  if (notFound) {
    return (
      <div
        className="acd-root"
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 300,
          gap: 16,
        }}
      >
        <span style={{ color: "#ef4444", fontSize: 16 }}>
          {t("未找到该飞机信息", "Aircraft not found")}
        </span>
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
    );
  }

  const factorScores: { name: string; score: number }[] =
    detailPage?.factorScores ?? [];
  const primaryFactor: { name: string; score: number } | null =
    detailPage?.primaryFactor ?? null;
  const relatedFlights: any[] = detailPage?.relatedFlights ?? [];
  const relatedRiskFlights = detailPage?.relatedRiskFlights ?? null;
  const abnormalSummary: { count: number; latest: string } | null =
    detailPage?.abnormalSummary ?? null;
  const maintenance: { lastCheckAt: string; nextCheckAt: string } | null =
    detailPage?.maintenance ?? null;
  const recentEvents: { date: string; title: string }[] =
    detailPage?.recentEvents ?? [];

  return (
    <div className="acd-root">
      {/* Breadcrumb */}
      <div className="acd-breadcrumb">
        <span style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
          {t("工作台", "Dashboard")}
        </span>
        <span className="acd-breadcrumb-sep">&gt;</span>
        <span
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/aircraft-topic/aircraft-list")}
        >
          {t("机", "Aircraft")}
        </span>
        <span className="acd-breadcrumb-sep">&gt;</span>
        <span className="acd-breadcrumb-active">
          {t("飞机详情", "Aircraft Detail")}: {displayTailNumber}
        </span>
      </div>
      <div
        style={{
          padding: "8px 24px 0",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
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
        <button
          className="acd-action-btn"
          onClick={() =>
            navigate(`/risk-monitoring/flights?aircraft=${displayTailNumber}`)
          }
        >
          <AirplaneIcon />
          {t("查看相关航班", "View Related Flights")}
        </button>
      </div>

      {/* Aircraft Info Card */}
      <div className="acd-info-bar">
        <div className="acd-info-item">
          <div className="acd-info-icon">
            <AirplaneIcon />
          </div>
          <div>
            <div className="acd-info-label">{t("机号", "Registration")}</div>
            <div className="acd-info-value">
              {planeDetail?.registration || "—"}
            </div>
          </div>
        </div>
        <div className="acd-info-item">
          <div className="acd-info-icon">
            <WrenchIcon />
          </div>
          <div>
            <div className="acd-info-label">{t("机型", "Aircraft Type")}</div>
            <div className="acd-info-value">{planeDetail?.model || "—"}</div>
          </div>
        </div>
        <div className="acd-info-item">
          <div className="acd-info-icon">
            <AirplaneIcon />
          </div>
          <div>
            <div className="acd-info-label">
              {t("机型系列", "Aircraft Category")}
            </div>
            <div className="acd-info-value">
              {planeDetail?.aircraftCategory || "—"}
            </div>
          </div>
        </div>
        <div className="acd-info-item">
          <div className="acd-info-icon">
            <WrenchIcon />
          </div>
          <div>
            <div className="acd-info-label">
              {t("运营单位", "Operating Unit")}
            </div>
            <div className="acd-info-value">
              {planeDetail?.operatingUnit || "—"}
            </div>
          </div>
        </div>
        <div className="acd-info-item">
          <div className="acd-info-icon">
            <CalendarIcon />
          </div>
          <div>
            <div className="acd-info-label">{t("风险等级", "Risk Level")}</div>
            <div className="acd-info-value">
              {planeDetail ? formatRiskLevel(planeDetail.riskLevel, t) : "—"}
            </div>
          </div>
        </div>
        <div className="acd-info-item">
          <div className="acd-info-icon">
            <WrenchIcon />
          </div>
          <div>
            <div className="acd-info-label">{t("风险评分", "Risk Score")}</div>
            <div className="acd-info-value">
              {planeDetail?.riskScore ?? "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Row 1 - 3 Cards */}
      <div className="acd-cards-row">
        {/* Card 1: 因子得分 */}
        <div className="acd-card">
          <div className="acd-card-title">
            {t("飞机因子得分", "AIRCRAFT FACTOR SCORE")}
          </div>
          <div className="acd-gauge-wrapper">
            <GaugeSVG score={planeDetail?.riskScore ?? 0} />
            <div className="acd-risk-status">
              {t("风险评分", "Risk Score")}: {planeDetail?.riskScore ?? "—"}
            </div>
          </div>
          <div className="acd-top-factors">
            {factorScores.length > 0 ? (
              factorScores.map((f, i) => (
                <div className="acd-top-factor-item" key={i}>
                  <div className="acd-top-factor-header">
                    <span className="acd-top-factor-name">{f.name}</span>
                    <span
                      className="acd-top-factor-pct"
                      style={{ color: scoreColor(f.score) }}
                    >
                      {f.score}
                    </span>
                  </div>
                  <div className="acd-top-factor-bar-bg">
                    <div
                      className="acd-top-factor-bar-fill"
                      style={{
                        width: `${f.score}%`,
                        background: scoreColor(f.score),
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: "#64748b", fontSize: 13 }}>
                {t("暂无数据", "No data")}
              </div>
            )}
          </div>
        </div>

        {/* Card 2: 首要因子 */}
        <div className="acd-card">
          <div className="acd-card-title">
            {t("飞机首要因子", "TOP AIRCRAFT FACTORS")}
          </div>
          {primaryFactor ? (
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <span
                  style={{ color: "#e2e8f0", fontSize: 14, fontWeight: 600 }}
                >
                  {primaryFactor.name}
                </span>
                <span
                  style={{
                    color: scoreColor(primaryFactor.score),
                    fontSize: 20,
                    fontWeight: 700,
                  }}
                >
                  {primaryFactor.score}
                </span>
              </div>
              <div className="acd-top-factor-bar-bg">
                <div
                  className="acd-top-factor-bar-fill"
                  style={{
                    width: `${primaryFactor.score}%`,
                    background: scoreColor(primaryFactor.score),
                  }}
                />
              </div>
            </div>
          ) : (
            <div style={{ color: "#64748b", fontSize: 13 }}>
              {t("暂无数据", "No data")}
            </div>
          )}
          {/* 列出前几个因子 */}
          {factorScores.length > 0 && (
            <div className="acd-top-factors">
              {factorScores.slice(0, 5).map((f, i) => (
                <div className="acd-top-factor-item" key={i}>
                  <div className="acd-top-factor-header">
                    <span className="acd-top-factor-name">{f.name}</span>
                    <span
                      className="acd-top-factor-pct"
                      style={{ color: scoreColor(f.score) }}
                    >
                      {f.score}
                    </span>
                  </div>
                  <div className="acd-top-factor-bar-bg">
                    <div
                      className="acd-top-factor-bar-fill"
                      style={{
                        width: `${f.score}%`,
                        background: scoreColor(f.score),
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card 3: 相关航班 */}
        <div className="acd-card">
          <div className="acd-card-title">
            {t("相关高风险航班数量", "NUMBER OF RELATED HIGH-RISK FLIGHTS")}
          </div>
          <div className="acd-flights-header">
            <div className="acd-flights-big-number">
              {relatedRiskFlights?.total ?? relatedFlights.length}
            </div>
          </div>
          {relatedRiskFlights?.byLevel &&
            (() => {
              const { high, medium, low } = relatedRiskFlights.byLevel;
              const total = high + medium + low || 1;
              return (
                <>
                  {/* 风险等级堆叠条 */}
                  <div
                    style={{
                      display: "flex",
                      height: 8,
                      borderRadius: 4,
                      overflow: "hidden",
                      margin: "12px 0 16px",
                    }}
                  >
                    {high > 0 && (
                      <div style={{ flex: high, background: "#ef4444" }} />
                    )}
                    {medium > 0 && (
                      <div style={{ flex: medium, background: "#eab308" }} />
                    )}
                    {low > 0 && (
                      <div style={{ flex: low, background: "#22c55e" }} />
                    )}
                  </div>
                  {/* 三列数字 */}
                  <div style={{ display: "flex", gap: 0 }}>
                    {[
                      {
                        label: t("高风险", "High"),
                        value: high,
                        color: "#ef4444",
                        pct: ((high / total) * 100).toFixed(0),
                      },
                      {
                        label: t("中风险", "Medium"),
                        value: medium,
                        color: "#eab308",
                        pct: ((medium / total) * 100).toFixed(0),
                      },
                      {
                        label: t("低风险", "Low"),
                        value: low,
                        color: "#22c55e",
                        pct: ((low / total) * 100).toFixed(0),
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        style={{
                          flex: 1,
                          textAlign: "center",
                          padding: "8px 0",
                          borderRight: "1px solid rgba(148,163,184,0.08)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 22,
                            fontWeight: 700,
                            color: item.color,
                          }}
                        >
                          {item.value}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "#94a3b8",
                            marginTop: 2,
                          }}
                        >
                          {item.label}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: "#64748b",
                            marginTop: 2,
                          }}
                        >
                          {item.pct}%
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          {/* 月度趋势迷你图 */}
          {relatedRiskFlights?.monthlyTrend &&
            relatedRiskFlights.monthlyTrend.length > 0 && (
              <div
                style={{
                  marginTop: 16,
                  borderTop: "1px solid rgba(148,163,184,0.08)",
                  paddingTop: 12,
                }}
              >
                <div
                  style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}
                >
                  {t("月度趋势", "Monthly Trend")}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 4,
                    height: 48,
                  }}
                >
                  {relatedRiskFlights.monthlyTrend.map((m: any, i: number) => {
                    const total =
                      (m.high ?? 0) + (m.medium ?? 0) + (m.low ?? 0);
                    const maxH = Math.max(
                      ...relatedRiskFlights.monthlyTrend.map(
                        (x: any) =>
                          (x.high ?? 0) + (x.medium ?? 0) + (x.low ?? 0),
                      ),
                      1,
                    );
                    return (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 2,
                        }}
                      >
                        <div
                          style={{
                            width: "100%",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                          }}
                        >
                          <div
                            style={{
                              width: "80%",
                              borderRadius: 2,
                              overflow: "hidden",
                              display: "flex",
                              flexDirection: "column-reverse",
                              height: `${(total / maxH) * 36}px`,
                            }}
                          >
                            {m.low > 0 && (
                              <div
                                style={{
                                  height: `${(m.low / total) * 100}%`,
                                  background: "#22c55e",
                                }}
                              />
                            )}
                            {m.medium > 0 && (
                              <div
                                style={{
                                  height: `${(m.medium / total) * 100}%`,
                                  background: "#eab308",
                                }}
                              />
                            )}
                            {m.high > 0 && (
                              <div
                                style={{
                                  height: `${(m.high / total) * 100}%`,
                                  background: "#ef4444",
                                }}
                              />
                            )}
                          </div>
                        </div>
                        <span style={{ fontSize: 9, color: "#64748b" }}>
                          {m.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Row 2 - 异常汇总 */}
      <div className="acd-cards-row-2">
        <div className="acd-card">
          <div className="acd-card-title">
            {t("重复异常汇总", "REPEATED ABNORMAL SUMMARY")}
          </div>
          {abnormalSummary ? (
            <div style={{ fontSize: 13, color: "#94a3b8" }}>
              <div style={{ marginBottom: 12 }}>
                <span style={{ color: "#64748b", fontSize: 11 }}>
                  {t("异常次数", "Count")}:
                </span>{" "}
                <span
                  style={{ color: "#e2e8f0", fontWeight: 600, fontSize: 20 }}
                >
                  {abnormalSummary.count}
                </span>
              </div>
              <div>
                <span style={{ color: "#64748b", fontSize: 11 }}>
                  {t("最新异常", "Latest")}:
                </span>{" "}
                <span style={{ color: "#e2e8f0" }}>
                  {abnormalSummary.latest}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ color: "#64748b", fontSize: 13 }}>
              {t("暂无数据", "No data")}
            </div>
          )}
        </div>

        {/* 维修信息 */}
        <div className="acd-card">
          <div className="acd-card-title">
            {t("维修信息", "MAINTENANCE INFO")}
          </div>
          {maintenance ? (
            <div style={{ fontSize: 13, color: "#94a3b8" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <div>
                  <div
                    style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}
                  >
                    {t("上次检查", "Last Check")}
                  </div>
                  <div style={{ color: "#e2e8f0", fontWeight: 600 }}>
                    {maintenance.lastCheckAt}
                  </div>
                </div>
                <div>
                  <div
                    style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}
                  >
                    {t("下次检查", "Next Check")}
                  </div>
                  <div style={{ color: "#e2e8f0", fontWeight: 600 }}>
                    {maintenance.nextCheckAt}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ color: "#64748b", fontSize: 13 }}>
              {t("暂无数据", "No data")}
            </div>
          )}
        </div>
      </div>

      {/* Row 3 - 近期维修事件 */}
      <div className="acd-cards-row-2" style={{ marginTop: 20 }}>
        <div className="acd-card">
          <div className="acd-card-title">
            {t("近期维修事件", "RECENT MAINTENANCE EVENTS")}
          </div>
          {recentEvents.length > 0 ? (
            <div style={{ fontSize: 13, color: "#94a3b8" }}>
              {recentEvents.map((evt, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "6px 0",
                    borderBottom: "1px solid rgba(148,163,184,0.08)",
                  }}
                >
                  <span
                    style={{ fontSize: 11, color: "#64748b", minWidth: 80 }}
                  >
                    {evt.date}
                  </span>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#3b82f6",
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ color: "#e2e8f0" }}>{evt.title}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: "#64748b", fontSize: 13 }}>
              {t("暂无数据", "No data")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
