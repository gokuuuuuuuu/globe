import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "../i18n/useLanguage";
import { getFlightDetail, type FlightDetailData } from "../api/flight";
import "./FlightDetailPage.css";

// ===== Helpers =====

function getDotClass(color: string) {
  if (color === "red") return "fd-dot-red";
  if (color === "yellow") return "fd-dot-yellow";
  return "fd-dot-green";
}

function formatTime(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

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

function statusLabel(status: string, t: (zh: string, en: string) => string) {
  if (status === "SCHEDULED") return t("未起飞", "Scheduled");
  if (status === "CRUISING") return t("巡航中", "Cruising");
  if (status === "LANDED") return t("已落地", "Landed");
  return status || "—";
}

function govStatusLabel(status: string, t: (zh: string, en: string) => string) {
  if (status === "PENDING") return t("待处理", "Pending");
  if (status === "IN_PROGRESS") return t("处理中", "In Progress");
  if (status === "RESOLVED") return t("已处理", "Resolved");
  if (status === "CLOSED") return t("已关闭", "Closed");
  return status || "—";
}

// ===== Component =====

export function FlightDetailPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const flightId = searchParams.get("id");

  const [flight, setFlight] = useState<FlightDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!flightId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getFlightDetail(Number(flightId))
      .then((res) => {
        setFlight(res);
      })
      .catch((err) => {
        console.error("Failed to load flight detail:", err);
      })
      .finally(() => setLoading(false));
  }, [flightId]);

  if (loading) {
    return (
      <div className="fd-root">
        <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
          {t("加载中...", "Loading...")}
        </div>
      </div>
    );
  }

  if (!flight) {
    return (
      <div className="fd-root">
        <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
          {t("未找到航班信息", "Flight not found")}
        </div>
      </div>
    );
  }

  return (
    <div className="fd-root">
      {/* Breadcrumb */}
      <div className="fd-breadcrumb">
        <span style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
          {t("工作台", "Dashboard")}
        </span>
        <span className="fd-breadcrumb-sep">&gt;</span>
        <span
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/risk-monitoring/flights")}
        >
          {t("航班", "Flights")}
        </span>
        <span className="fd-breadcrumb-sep">&gt;</span>
        <span className="fd-breadcrumb-active">
          {t("航班详情", "Flight Detail")}
        </span>
      </div>

      {/* Page Header */}
      <div className="fd-page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button className="fd-btn" onClick={() => navigate(-1)}>
            {t("返回", "Back")}
          </button>
          <h1 className="fd-page-title">
            {t("航班信息", "Flight Info")} - {flight.flightNo}
          </h1>
        </div>
        <div className="fd-header-actions">
          <button
            className="fd-btn"
            onClick={() =>
              navigate(`/risk-monitoring/flight-report?id=${flight.id}`)
            }
          >
            {t("查看报告", "View Report")}
          </button>
        </div>
      </div>

      {/* Flight Info Bar */}
      <div className="fd-info-bar">
        <div className="fd-info-item-narrow">
          <div className="fd-info-label">{t("航班号", "FLT")}</div>
          <div className="fd-info-value">{flight.flightNo}</div>
        </div>
        <div className="fd-info-item-narrow">
          <div className="fd-info-label">{t("机号", "REG")}</div>
          <div className="fd-info-value">
            <span
              style={{ cursor: "pointer", color: "#60a5fa" }}
              onClick={() =>
                navigate(
                  `/aircraft-topic/aircraft-detail?tail=${flight.plane?.registration || ""}`,
                )
              }
            >
              {flight.plane?.registration || "—"}
            </span>
          </div>
        </div>
        <div className="fd-info-item-narrow">
          <div className="fd-info-label">{t("机型", "TYPE")}</div>
          <div className="fd-info-value">{flight.plane?.model || "—"}</div>
        </div>
        <div className="fd-info-item-narrow">
          <div className="fd-info-label">PF</div>
          <div className="fd-info-value">
            {flight.pf ? (
              <span
                style={{ cursor: "pointer", color: "#60a5fa" }}
                onClick={() =>
                  navigate(
                    `/personnel-center/personnel-detail?id=${flight.pf!.empNo}`,
                  )
                }
              >
                {flight.pf.name}
              </span>
            ) : (
              "—"
            )}
          </div>
        </div>
        <div className="fd-info-item-narrow">
          <div className="fd-info-label">PM</div>
          <div className="fd-info-value">
            {flight.pm ? (
              <span
                style={{ cursor: "pointer", color: "#60a5fa" }}
                onClick={() =>
                  navigate(
                    `/personnel-center/personnel-detail?id=${flight.pm!.empNo}`,
                  )
                }
              >
                {flight.pm.name}
              </span>
            ) : (
              "—"
            )}
          </div>
        </div>
        <div className="fd-info-item">
          <div className="fd-info-label">
            {t("出发机场", "Departure Airport")}
          </div>
          <div className="fd-info-value">
            {flight.departureAirport ? (
              <span
                style={{ cursor: "pointer", color: "#60a5fa" }}
                onClick={() =>
                  navigate(
                    `/airport-center/airport-detail?code=${flight.departureAirport!.code}`,
                  )
                }
              >
                {flight.departureAirport.code} ({flight.departureAirport.name})
              </span>
            ) : (
              "—"
            )}
          </div>
        </div>
        <div className="fd-info-item">
          <div className="fd-info-label">
            {t("到达机场", "Arrival Airport")}
          </div>
          <div className="fd-info-value">
            {flight.arrivalAirport ? (
              <span
                style={{ cursor: "pointer", color: "#60a5fa" }}
                onClick={() =>
                  navigate(
                    `/airport-center/airport-detail?code=${flight.arrivalAirport!.code}`,
                  )
                }
              >
                {flight.arrivalAirport.code} ({flight.arrivalAirport.name})
              </span>
            ) : (
              "—"
            )}
          </div>
        </div>
        <div className="fd-info-item">
          <div className="fd-info-label">{t("起飞时间", "Departure Time")}</div>
          <div className="fd-info-value">
            {formatTime(flight.departureTime)}
          </div>
        </div>
        <div className="fd-info-item">
          <div className="fd-info-label">{t("降落时间", "Arrival Time")}</div>
          <div className="fd-info-value">{formatTime(flight.arrivalTime)}</div>
        </div>
        <div className="fd-info-item-narrow">
          <div className="fd-info-label">{t("状态", "STS")}</div>
          <div className="fd-info-value">{statusLabel(flight.status, t)}</div>
        </div>
        <div className="fd-info-item">
          <div className="fd-info-label">
            {t("综合风险等级", "Composite Risk Level")}
          </div>
          <div className="fd-info-value fd-info-value-high">
            <span
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: riskLevelColor(flight.riskLevel),
                  display: "inline-block",
                }}
              />
              {riskLevelLabel(flight.riskLevel, t)}
            </span>
          </div>
        </div>
        <div className="fd-info-item">
          <div className="fd-info-label">
            {t("人为/飞机/环境评分", "H / A / E Score")}
          </div>
          <div className="fd-info-value">
            {flight.humanFactorScore} / {flight.aircraftFactorScore} /{" "}
            {flight.environmentFactorScore}
          </div>
        </div>
        <div className="fd-info-item">
          <div className="fd-info-label">
            {t("治理状态", "Governance Status")}
          </div>
          <div className="fd-info-value">
            <span className="fd-gov-status">
              <span
                className="fd-gov-dot"
                style={{
                  background:
                    flight.governanceStatus === "RESOLVED" ||
                    flight.governanceStatus === "CLOSED"
                      ? "#22c55e"
                      : "#eab308",
                }}
              />
              {govStatusLabel(flight.governanceStatus, t)}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="fd-content">
        {/* Flight Phases Cards */}
        <div className="fd-phases">
          {(flight.phaseRisks || []).map((phase) => (
            <div className="fd-phase-card" key={phase.name}>
              <div className="fd-phase-header">
                <div className="fd-phase-name">
                  {{
                    Takeoff: t("起飞", "Takeoff"),
                    Cruise: t("巡航", "Cruise"),
                    Landing: t("着陆", "Landing"),
                    Climb: t("爬升", "Climb"),
                    Descent: t("下降", "Descent"),
                    Approach: t("进近", "Approach"),
                    Taxi: t("滑行", "Taxi"),
                  }[phase.name] || phase.name}
                </div>
                <div className="fd-phase-scores">
                  <div className="fd-phase-score-item">
                    <div className="fd-phase-score-label">
                      {t("风险评分", "Risk Score")}
                    </div>
                    <div className="fd-phase-score-value">
                      {phase.riskScore}
                    </div>
                  </div>
                  <div className="fd-phase-score-item">
                    <div className="fd-phase-score-label">
                      {t("权重", "Weight")}
                    </div>
                    <div className="fd-phase-score-value">{phase.weight}</div>
                  </div>
                </div>
              </div>
              <div className="fd-phase-chart">
                {phase.bars.map((h, i) => (
                  <div
                    key={i}
                    className="fd-phase-bar"
                    style={{
                      height: `${h}%`,
                      background: phase.barColors[i] || "#3b82f6",
                    }}
                  />
                ))}
              </div>
              <div className="fd-phase-tags">
                <span className="fd-phase-tags-label">
                  {t("风险标签", "Risk Tags")}
                </span>
                {phase.tags.map((tag, i) => (
                  <span key={i} className="fd-phase-tag">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Top-Factor Contribution Area */}
        {flight.factorContributions && (
          <>
            <h2 className="fd-section-title">
              {t("首要因素贡献区域", "Top-Factor Contribution Area")}
            </h2>
            <div className="fd-factors">
              {(["human", "aircraft", "environment", "composite"] as const).map(
                (dim) => {
                  const items = flight.factorContributions?.[dim] || [];
                  const labels: Record<string, string> = {
                    human: t("人为因素", "Human"),
                    aircraft: t("飞机因素", "Aircraft"),
                    environment: t("环境因素", "Environment"),
                    composite: t("综合因素", "Composite"),
                  };
                  return (
                    <div className="fd-factor-card" key={dim}>
                      <div className="fd-factor-title">{labels[dim]}</div>
                      {items.map((item, i) => (
                        <div className="fd-factor-row" key={i}>
                          <div className="fd-factor-left">
                            <span
                              className={`fd-factor-dot ${getDotClass(item.color)}`}
                            />
                            <span className="fd-factor-name">{item.name}</span>
                          </div>
                          <div className="fd-factor-right">
                            <span
                              className={`fd-factor-score-dot ${getDotClass(item.color)}`}
                            />
                            <span className="fd-factor-score">
                              {item.score.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                },
              )}
            </div>
          </>
        )}

        {/* Major Risk Event Section */}
        {flight.riskEvents.length > 0 && (
          <>
            <div className="fd-risk-section-header">
              <h2 className="fd-section-title" style={{ margin: 0 }}>
                {t("重大风险事件", "Major Risk Events")}
              </h2>
            </div>
            <table className="fd-risk-table">
              <thead>
                <tr>
                  <th>{t("风险名称", "Risk")}</th>
                  <th>{t("优先级", "Priority")}</th>
                  <th>{t("原因摘要", "Cause")}</th>
                  <th>{t("建议措施", "Action")}</th>
                </tr>
              </thead>
              <tbody>
                {flight.riskEvents.map((evt) => (
                  <tr key={evt.id}>
                    <td>{evt.risk}</td>
                    <td>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: evt.priorityColor,
                          }}
                        />
                        {evt.priority}
                      </span>
                    </td>
                    <td>{evt.cause}</td>
                    <td>{evt.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}
