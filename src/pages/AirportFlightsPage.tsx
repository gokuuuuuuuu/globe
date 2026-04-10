// @ts-nocheck
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AIRPORTS,
  FLIGHTS,
  calculateRiskFromEnvironmentRisk,
} from "../data/flightData";
import type { Flight } from "../data/flightData";
import { useLanguage } from "../i18n/useLanguage";
import "./AirportFlightsPage.css";

const PAGE_SIZE = 20;

// Use the first airport from AIRPORTS data
const SELECTED_AIRPORT = AIRPORTS[0];

// Compute composite risk level from flight scores
function getCompositeRiskLevel(flight: Flight): {
  label: string;
  labelEn: string;
  cls: string;
} {
  const composite =
    flight.humanRisk + flight.machineRisk + flight.environmentRisk;
  if (composite >= 18)
    return { label: "严重", labelEn: "Critical", cls: "af-risk-critical" };
  if (composite >= 12)
    return { label: "高", labelEn: "High", cls: "af-risk-high" };
  if (composite >= 6)
    return { label: "中等", labelEn: "Moderate", cls: "af-risk-moderate" };
  return { label: "低", labelEn: "Green/Low", cls: "af-risk-low" };
}

// Generate governance status from composite risk
function getGovernanceStatus(flight: Flight): {
  label: string;
  labelEn: string;
  cls: string;
} {
  const composite =
    flight.humanRisk + flight.machineRisk + flight.environmentRisk;
  if (composite >= 18)
    return { label: "已升级", labelEn: "Escalated", cls: "af-gov-escalated" };
  if (composite >= 12)
    return {
      label: "待处理",
      labelEn: "Action Pending",
      cls: "af-gov-pending",
    };
  if (composite >= 6)
    return { label: "审核中", labelEn: "Under Review", cls: "af-gov-review" };
  return { label: "已关闭", labelEn: "Closed", cls: "af-gov-closed" };
}

// Generate risk tags from flight data
function getRiskTags(
  flight: Flight,
  t: (zh: string, en: string) => string,
): string[] {
  const tags: string[] = [];
  if (flight.humanRisk >= 5) tags.push(t("飞行员疲劳", "Pilot Fatigue"));
  if (flight.machineRisk >= 5) tags.push(t("机械故障", "Mechanical Issue"));
  if (flight.environmentRisk >= 7) tags.push(t("恶劣天气", "Bad Weather"));
  if (flight.predictedRisks && flight.predictedRisks.length > 0) {
    tags.push(t("通信故障", "Communication Error"));
  }
  return tags.length ? tags : ["\u2014"];
}

// Generate a deterministic aircraft tail number from flight id
function getTailNumber(flight: Flight): string {
  return flight.aircraftNumber || `B-${flight.id.replace("FL", "")}`;
}

// Score bar color based on score (out of 100)
function getScoreBarColor(score: number): string {
  if (score >= 70) return "#dc2626";
  if (score >= 40) return "#ea580c";
  return "#22c55e";
}

// Normalize risk score (0-10) to a 0-100 scale
function normalizeScore(risk: number): number {
  return Math.min(100, Math.round((risk / 10) * 100));
}

// Inline SVG bar chart component
function ScoreBar({ score }: { score: number }) {
  const color = getScoreBarColor(score);
  const width = Math.max(2, (score / 100) * 60);
  return (
    <div className="af-score-cell">
      <span className="af-score-text">{score}/100</span>
      <svg width="60" height="8" style={{ flexShrink: 0 }}>
        <rect
          x="0"
          y="0"
          width="60"
          height="8"
          rx="2"
          fill="rgba(148,163,184,0.15)"
        />
        <rect x="0" y="0" width={width} height="8" rx="2" fill={color} />
      </svg>
    </div>
  );
}

export function AirportFlightsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [openActions, setOpenActions] = useState<string | null>(null);

  // Filter flights related to the selected airport
  const relatedFlights = useMemo(() => {
    const code = SELECTED_AIRPORT.code;
    return FLIGHTS.filter(
      (f) => f.fromAirport === code || f.toAirport === code,
    ).sort(
      (a, b) =>
        b.humanRisk +
        b.machineRisk +
        b.environmentRisk -
        (a.humanRisk + a.machineRisk + a.environmentRisk),
    );
  }, []);

  // Apply search filter
  const filteredFlights = useMemo(() => {
    if (!searchQuery.trim()) return relatedFlights;
    const q = searchQuery.toLowerCase();
    return relatedFlights.filter(
      (f) =>
        f.flightNumber.toLowerCase().includes(q) ||
        f.fromAirport.toLowerCase().includes(q) ||
        f.toAirport.toLowerCase().includes(q) ||
        (f.aircraftNumber && f.aircraftNumber.toLowerCase().includes(q)),
    );
  }, [relatedFlights, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredFlights.length / PAGE_SIZE));
  const startIdx = (page - 1) * PAGE_SIZE;
  const pageFlights = filteredFlights.slice(startIdx, startIdx + PAGE_SIZE);

  const handlePageInputChange = (val: string) => {
    setPageInput(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 1 && num <= totalPages) {
      setPage(num);
    }
  };

  const airportDisplayName = SELECTED_AIRPORT.nameZh || SELECTED_AIRPORT.name;

  return (
    <div className="af-root" onClick={() => setOpenActions(null)}>
      {/* Breadcrumb */}
      <div className="af-breadcrumb">
        <span style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
          {t("工作台", "Dashboard")}
        </span>
        <span className="af-breadcrumb-sep">&gt;</span>
        <span
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/airport-center/airport-list")}
        >
          {t("机场", "Airports")}
        </span>
        <span className="af-breadcrumb-sep">&gt;</span>
        <span className="af-breadcrumb-active">
          {t("机场相关航班", "Airport Related Flights")}
        </span>
      </div>

      {/* Page Header */}
      <div className="af-page-header">
        <div className="af-page-title">
          <button
            style={{
              background: "rgba(71,85,105,0.5)",
              border: "1px solid rgba(148,163,184,0.2)",
              color: "#e2e8f0",
              borderRadius: 6,
              padding: "4px 14px",
              cursor: "pointer",
              fontSize: 13,
              marginRight: 8,
            }}
            onClick={() => navigate(-1)}
          >
            {t("返回", "Back")}
          </button>
          <h1>
            {SELECTED_AIRPORT.code4 || SELECTED_AIRPORT.code}{" "}
            {airportDisplayName} - {t("相关航班", "Related Flights")}
          </h1>
        </div>
        <div className="af-page-actions">
          <button className="af-action-btn">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {t("导出", "Export")}
          </button>
          <button className="af-action-btn">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            {t("保存视图", "Save View")}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="af-filter-bar">
        <div className="af-filter-tag">
          <span>
            <strong>{t("已选机场：", "Selected Airport: ")}</strong>
            {airportDisplayName} (
            {SELECTED_AIRPORT.code4 || SELECTED_AIRPORT.code})
          </span>
          <button className="af-filter-tag-edit">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        </div>
        <div className="af-filter-tag">
          <span>
            <strong>{t("时间窗口：", "Time Window: ")}</strong>
            {t("2024年5月15日", "May 15, 2024")} (
            {t("近24小时", "Last 24 Hours")})
          </span>
          <button className="af-filter-tag-edit">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        </div>
        <div className="af-filter-tag">
          <span>
            <strong>{t("已应用筛选：", "Applied Filters: ")}</strong>(
            {t("所有风险等级，所有状态", "All Risk Levels, All Statuses")})
          </span>
          <button className="af-filter-tag-edit">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Count + Search Row */}
      <div className="af-count-search-row">
        <span className="af-count-text">
          {t("显示", "Showing")} {filteredFlights.length > 0 ? startIdx + 1 : 0}
          -{Math.min(startIdx + PAGE_SIZE, filteredFlights.length)}{" "}
          {t("共", "of")} {filteredFlights.length} {t("航班", "flights")}
        </span>
        <div className="af-search-wrapper">
          <svg
            className="af-search-icon"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="af-search-input"
            placeholder={t("搜索...", "Search...")}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
              setPageInput("1");
            }}
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="af-table-wrapper">
        <table className="af-table">
          <thead>
            <tr>
              <th className="af-th-check" />
              <th>{t("航班号", "Flight Number")}</th>
              <th>{t("机尾号", "Aircraft Tail Number")}</th>
              <th>{t("出发机场", "Departure Airport")}</th>
              <th>{t("到达机场", "Arrival Airport")}</th>
              <th>{t("综合风险等级", "Composite Risk Level")}</th>
              <th>{t("人为因素评分", "Human Factor Score")}</th>
              <th>{t("飞机因素评分", "Aircraft Factor Score")}</th>
              <th>{t("环境因素评分", "Environmental Factor Score")}</th>
              <th>{t("主要风险标签", "Major Risk Tags")}</th>
              <th>{t("治理状态", "Governance Status")}</th>
              <th>{t("操作", "Actions")}</th>
            </tr>
          </thead>
          <tbody>
            {pageFlights.map((flight) => {
              const risk = getCompositeRiskLevel(flight);
              const gov = getGovernanceStatus(flight);
              const tags = getRiskTags(flight, t);
              const humanScore = normalizeScore(flight.humanRisk);
              const machineScore = normalizeScore(flight.machineRisk);
              const envScore = normalizeScore(flight.environmentRisk);

              return (
                <tr
                  key={flight.id}
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    navigate(`/risk-monitoring/flight-detail?id=${flight.id}`)
                  }
                >
                  <td className="af-td-check" />
                  <td className="af-td-flight-no">{flight.flightNumber}</td>
                  <td>{getTailNumber(flight)}</td>
                  <td>{flight.fromAirportCode4 || flight.fromAirport}</td>
                  <td>{flight.toAirportCode4 || flight.toAirport}</td>
                  <td>
                    <span className={`af-risk-badge ${risk.cls}`}>
                      {t(risk.label, risk.labelEn)}
                    </span>
                    <span className="af-risk-subtitle">
                      {t("综合风险等级", "Composite Risk Level")}
                    </span>
                  </td>
                  <td>
                    <ScoreBar score={humanScore} />
                  </td>
                  <td>
                    <ScoreBar score={machineScore} />
                  </td>
                  <td>
                    <ScoreBar score={envScore} />
                  </td>
                  <td>
                    <div className="af-tags">
                      {tags.map((tag, i) => (
                        <span key={i} className="af-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span className={`af-gov-status ${gov.cls}`}>
                      {t(gov.label, gov.labelEn)}
                    </span>
                  </td>
                  <td>
                    <div
                      className="af-actions-cell"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button className="af-btn-view-flight">
                        {t("查看航班", "View Flight")}
                      </button>
                      <button
                        className="af-btn-more"
                        onClick={() =>
                          setOpenActions(
                            openActions === flight.id ? null : flight.id,
                          )
                        }
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>
                      {openActions === flight.id && (
                        <div className="af-actions-menu">
                          <button onClick={() => setOpenActions(null)}>
                            {t("查看报告", "View Report")}
                          </button>
                          <button onClick={() => setOpenActions(null)}>
                            {t("发起处置", "Initiate Action")}
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="af-pagination">
        <div className="af-page-info">
          <span>{t("显示", "Showing")}</span>
          <input
            className="af-page-input"
            value={pageInput}
            onChange={(e) => handlePageInputChange(e.target.value)}
          />
          <span>
            {t("共", "of")} {totalPages}
          </span>
        </div>
        <div className="af-page-nav">
          <button
            disabled={page <= 1}
            onClick={() => {
              setPage(page - 1);
              setPageInput(String(page - 1));
            }}
          >
            &lsaquo;
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => {
              setPage(page + 1);
              setPageInput(String(page + 1));
            }}
          >
            &rsaquo;
          </button>
        </div>
      </div>
    </div>
  );
}
