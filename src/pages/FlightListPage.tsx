// @ts-nocheck
import { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FLIGHTS, calculateRiskFromEnvironmentRisk } from "../data/flightData";
import type { Flight } from "../data/flightData";
import { useLanguage } from "../i18n/useLanguage";
import "./FlightListPage.css";

const PAGE_SIZE = 15;

// Extract unique values from flight data for filter dropdowns
function getUniqueValues(key: keyof Flight): string[] {
  const set = new Set<string>();
  FLIGHTS.forEach((f) => {
    const v = f[key];
    if (v && typeof v === "string") set.add(v);
  });
  return Array.from(set).sort();
}

const ALL_DEPARTURE_AIRPORTS = getUniqueValues("fromAirport");
const ALL_ARRIVAL_AIRPORTS = getUniqueValues("toAirport");
const ALL_OPERATING_UNITS = getUniqueValues("operatingUnit");
const ALL_AIRCRAFT_TYPES = getUniqueValues("aircraftType");

const RISK_LEVELS = ["High Risk", "Medium Risk", "Low Risk"];
const FLIGHT_STATUSES = ["未起飞", "巡航中", "已落地"];

// Map Chinese risk level to English display
function riskLevelToEn(riskLevel: string): string {
  if (riskLevel === "高风险") return "High Risk";
  if (riskLevel === "中风险") return "Medium Risk";
  return "Low Risk";
}

// Get risk tags from flight data
function getRiskTags(flight: Flight): string[] {
  const tags: string[] = [];
  if (flight.predictedRisks && flight.predictedRisks.length > 0) {
    flight.predictedRisks.forEach((r) => {
      if (!tags.includes(r.type)) tags.push(r.type);
    });
  }
  if (flight.environmentRisk >= 7) tags.push("Severe Weather");
  if (flight.machineRisk >= 5) tags.push("Engine Fault");
  if (flight.humanRisk >= 5) tags.push("Pilot Fatigue");
  // deduplicate
  return [...new Set(tags)].length ? [...new Set(tags)] : ["—"];
}

// Get all unique risk tag types
const ALL_RISK_TYPES = (() => {
  const set = new Set<string>();
  FLIGHTS.forEach((f) => {
    getRiskTags(f).forEach((t) => {
      if (t !== "—") set.add(t);
    });
  });
  return Array.from(set).sort();
})();

// Governance status derived from composite risk
function getGovernanceStatus(flight: Flight): string {
  const composite =
    flight.humanRisk + flight.machineRisk + flight.environmentRisk;
  if (composite > 180) return "Not Addressed";
  if (composite > 100) return "In Progress";
  return "Closed";
}

const GOVERNANCE_STATUSES = ["Not Addressed", "In Progress", "Closed"];

function getCompositeRiskLabel(flight: Flight): string {
  return riskLevelToEn(flight.riskLevel);
}

function riskLabelClass(label: string): string {
  if (label === "High Risk") return "fl-risk-high";
  if (label === "Medium Risk") return "fl-risk-medium";
  return "fl-risk-low";
}

function govStatusClass(status: string): string {
  if (status === "Not Addressed") return "fl-gov-not";
  if (status === "In Progress") return "fl-gov-progress";
  return "fl-gov-closed";
}

function scoreColorClass(score: number): string {
  if (score >= 70) return "fl-score-red";
  if (score >= 40) return "fl-score-orange";
  return "fl-score-green";
}

// Add airline code prefix to flight number for display
const AIRLINE_CODES = [
  "MU",
  "FM",
  "KN",
  "MU",
  "MU",
  "FM",
  "MU",
  "KN",
  "FM",
  "MU",
];
function getDisplayFlightNumber(flight: Flight): string {
  // Use a deterministic index based on flight id hash
  const hash = flight.id ? flight.id.charCodeAt(flight.id.length - 1) : 0;
  const code = AIRLINE_CODES[hash % AIRLINE_CODES.length];
  // If flightNumber already starts with letters, return as-is
  if (/^[A-Z]{2}/.test(flight.flightNumber)) return flight.flightNumber;
  return `${code}${flight.flightNumber}`;
}

// Translate risk tag at render time
function translateRiskTag(
  tag: string,
  t: (zh: string, en: string) => string,
): string {
  const map: Record<string, [string, string]> = {
    "Severe Weather": ["恶劣天气", "Severe Weather"],
    "Engine Fault": ["发动机故障", "Engine Fault"],
    "Pilot Fatigue": ["飞行员疲劳", "Pilot Fatigue"],
    "Mechanical Issue": ["机械问题", "Mechanical Issue"],
    "Communication Error": ["通信错误", "Communication Error"],
    "Bad Weather": ["恶劣天气", "Bad Weather"],
  };
  const entry = map[tag];
  if (entry) return t(entry[0], entry[1]);
  return tag;
}

// Translate risk level at render time
function translateRiskLevel(
  level: string,
  t: (zh: string, en: string) => string,
): string {
  if (level === "High Risk") return t("高风险", "High Risk");
  if (level === "Medium Risk") return t("中风险", "Medium Risk");
  return t("低风险", "Low Risk");
}

// Translate governance status at render time
function translateGovStatus(
  status: string,
  t: (zh: string, en: string) => string,
): string {
  if (status === "Not Addressed") return t("未处置", "Not Addressed");
  if (status === "In Progress") return t("处置中", "In Progress");
  return t("已关闭", "Closed");
}

// Translate flight status at render time
function translateFlightStatus(
  status: string,
  t: (zh: string, en: string) => string,
): string {
  if (status === "未起飞") return t("未起飞", "Not Departed");
  if (status === "巡航中") return t("巡航中", "Cruising");
  return t("已落地", "Landed");
}

export function FlightListPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Filters
  const [flightNumberFilter, setFlightNumberFilter] = useState("");
  const [aircraftNumberFilter, setAircraftNumberFilter] = useState("");
  const [departureFilter, setDepartureFilter] = useState("");
  const [arrivalFilter, setArrivalFilter] = useState("");
  const [operatingUnitFilter, setOperatingUnitFilter] = useState("");
  const [aircraftTypeFilter, setAircraftTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [riskLevelFilter, setRiskLevelFilter] = useState<string[]>([]);
  const [govStatusFilter, setGovStatusFilter] = useState<string[]>([]);
  const [riskTypeFilter, setRiskTypeFilter] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  // Read URL params to pre-fill filters
  useEffect(() => {
    const aircraft = searchParams.get("aircraft");
    if (aircraft) setAircraftNumberFilter(aircraft);
  }, [searchParams]);

  // Dropdown toggles for filter multi-selects
  const [showRiskLevelDD, setShowRiskLevelDD] = useState(false);
  const [showGovStatusDD, setShowGovStatusDD] = useState(false);
  const [showRiskTypeDD, setShowRiskTypeDD] = useState(false);
  const [showStatusDD, setShowStatusDD] = useState(false);

  // Filtered data
  const filteredFlights = useMemo(() => {
    return FLIGHTS.filter((f) => {
      // Flight number filter
      if (
        flightNumberFilter &&
        !f.flightNumber.toLowerCase().includes(flightNumberFilter.toLowerCase())
      )
        return false;

      // Aircraft number filter
      if (
        aircraftNumberFilter &&
        !(f.aircraftNumber || "")
          .toLowerCase()
          .includes(aircraftNumberFilter.toLowerCase())
      )
        return false;

      // Departure airport filter
      if (departureFilter && f.fromAirport !== departureFilter) return false;

      // Arrival airport filter
      if (arrivalFilter && f.toAirport !== arrivalFilter) return false;

      // Operating unit filter
      if (operatingUnitFilter && f.operatingUnit !== operatingUnitFilter)
        return false;

      // Aircraft type filter
      if (aircraftTypeFilter && f.aircraftType !== aircraftTypeFilter)
        return false;

      // Flight status filter
      if (statusFilter.length && !statusFilter.includes(f.status)) return false;

      // Risk level filter
      if (riskLevelFilter.length) {
        const label = getCompositeRiskLabel(f);
        if (!riskLevelFilter.includes(label)) return false;
      }

      // Governance status filter
      if (govStatusFilter.length) {
        const status = getGovernanceStatus(f);
        if (!govStatusFilter.includes(status)) return false;
      }

      // Risk type filter
      if (riskTypeFilter.length) {
        const tags = getRiskTags(f);
        if (!riskTypeFilter.some((t) => tags.includes(t))) return false;
      }

      return true;
    }).sort(
      (a, b) =>
        b.humanRisk +
        b.machineRisk +
        b.environmentRisk -
        (a.humanRisk + a.machineRisk + a.environmentRisk),
    );
  }, [
    flightNumberFilter,
    aircraftNumberFilter,
    departureFilter,
    arrivalFilter,
    operatingUnitFilter,
    aircraftTypeFilter,
    statusFilter,
    riskLevelFilter,
    govStatusFilter,
    riskTypeFilter,
  ]);

  const totalPages = Math.ceil(filteredFlights.length / PAGE_SIZE);
  const pageFlights = filteredFlights.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const handleSearch = () => setPage(1);
  const handleReset = () => {
    setFlightNumberFilter("");
    setAircraftNumberFilter("");
    setDepartureFilter("");
    setArrivalFilter("");
    setOperatingUnitFilter("");
    setAircraftTypeFilter("");
    setStatusFilter([]);
    setRiskLevelFilter([]);
    setGovStatusFilter([]);
    setRiskTypeFilter([]);
    setPage(1);
  };

  const toggleMultiSelect = (
    value: string,
    current: string[],
    setter: (v: string[]) => void,
  ) => {
    setter(
      current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value],
    );
  };

  // Close dropdowns when clicking outside
  const closeAllDropdowns = () => {
    setShowRiskLevelDD(false);
    setShowGovStatusDD(false);
    setShowRiskTypeDD(false);
    setShowStatusDD(false);
  };

  return (
    <div className="fl-root" onClick={closeAllDropdowns}>
      {/* Breadcrumb */}
      <div className="fl-breadcrumb">
        <span>MRIWP</span>
        <span className="fl-breadcrumb-sep">&gt;</span>
        <span>{t("航班", "Flights")}</span>
        <span className="fl-breadcrumb-sep">&gt;</span>
        <span className="fl-breadcrumb-active">
          {t("航班列表", "Flight List")}
        </span>
      </div>

      {/* Page Header */}
      <div className="fl-page-header">
        <div className="fl-page-title">
          <h1>{t("航班列表", "Flight List")}</h1>
          <span className="fl-flight-count">
            {filteredFlights.length} {t("航班", "flights")}
          </span>
        </div>
        <div className="fl-page-actions">
          <button className="fl-action-btn">
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
          <button className="fl-action-btn">
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
            {t("保存筛选", "Save Filters")}
          </button>
          <button className="fl-action-btn">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            {t("列设置", "Column Settings")}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="fl-filters">
        <div className="fl-filter-row">
          <div className="fl-filter-item">
            <label>{t("航班号", "Flight Number")}</label>
            <input
              className="fl-input"
              placeholder={t("输入航班号...", "Enter flight number...")}
              value={flightNumberFilter}
              onChange={(e) => setFlightNumberFilter(e.target.value)}
            />
          </div>
          <div className="fl-filter-item">
            <label>{t("机号", "Aircraft Number")}</label>
            <input
              className="fl-input"
              placeholder={t("输入机号...", "Enter aircraft number...")}
              value={aircraftNumberFilter}
              onChange={(e) => setAircraftNumberFilter(e.target.value)}
            />
          </div>
          <div className="fl-filter-item">
            <label>{t("出发机场", "Departure Airport")}</label>
            <select
              className="fl-select"
              value={departureFilter}
              onChange={(e) => setDepartureFilter(e.target.value)}
            >
              <option value="">{t("全部", "All")}</option>
              {ALL_DEPARTURE_AIRPORTS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div className="fl-filter-item">
            <label>{t("到达机场", "Arrival Airport")}</label>
            <select
              className="fl-select"
              value={arrivalFilter}
              onChange={(e) => setArrivalFilter(e.target.value)}
            >
              <option value="">{t("全部", "All")}</option>
              {ALL_ARRIVAL_AIRPORTS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div className="fl-filter-item">
            <label>{t("机型", "Aircraft Type")}</label>
            <select
              className="fl-select"
              value={aircraftTypeFilter}
              onChange={(e) => setAircraftTypeFilter(e.target.value)}
            >
              <option value="">{t("全部", "All")}</option>
              {ALL_AIRCRAFT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="fl-filter-item">
            <label>{t("运营单位", "Operating Unit")}</label>
            <select
              className="fl-select"
              value={operatingUnitFilter}
              onChange={(e) => setOperatingUnitFilter(e.target.value)}
            >
              <option value="">{t("全部", "All")}</option>
              {ALL_OPERATING_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="fl-filter-row">
          {/* Risk Level multi-select */}
          <div className="fl-filter-item fl-filter-multi">
            <label>{t("风险等级", "Risk Level")}</label>
            <div
              className="fl-multi-select"
              onClick={(e) => {
                e.stopPropagation();
                closeAllDropdowns();
                setShowRiskLevelDD(!showRiskLevelDD);
              }}
            >
              <span>
                {riskLevelFilter.length
                  ? riskLevelFilter
                      .map((r) => translateRiskLevel(r, t))
                      .join(", ")
                  : t("全部", "All")}
              </span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
              {showRiskLevelDD && (
                <div
                  className="fl-dropdown"
                  onClick={(e) => e.stopPropagation()}
                >
                  {RISK_LEVELS.map((r) => (
                    <label key={r} className="fl-dropdown-item">
                      <input
                        type="checkbox"
                        checked={riskLevelFilter.includes(r)}
                        onChange={() =>
                          toggleMultiSelect(
                            r,
                            riskLevelFilter,
                            setRiskLevelFilter,
                          )
                        }
                      />
                      <span>{translateRiskLevel(r, t)}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Flight Status multi-select */}
          <div className="fl-filter-item fl-filter-multi">
            <label>{t("航班状态", "Flight Status")}</label>
            <div
              className="fl-multi-select"
              onClick={(e) => {
                e.stopPropagation();
                closeAllDropdowns();
                setShowStatusDD(!showStatusDD);
              }}
            >
              <span>
                {statusFilter.length
                  ? statusFilter
                      .map((s) => translateFlightStatus(s, t))
                      .join(", ")
                  : t("全部", "All")}
              </span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
              {showStatusDD && (
                <div
                  className="fl-dropdown"
                  onClick={(e) => e.stopPropagation()}
                >
                  {FLIGHT_STATUSES.map((s) => (
                    <label key={s} className="fl-dropdown-item">
                      <input
                        type="checkbox"
                        checked={statusFilter.includes(s)}
                        onChange={() =>
                          toggleMultiSelect(s, statusFilter, setStatusFilter)
                        }
                      />
                      <span>{translateFlightStatus(s, t)}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Major Risk Type multi-select */}
          <div className="fl-filter-item fl-filter-multi">
            <label>{t("主要风险类型", "Major Risk Type")}</label>
            <div
              className="fl-multi-select"
              onClick={(e) => {
                e.stopPropagation();
                closeAllDropdowns();
                setShowRiskTypeDD(!showRiskTypeDD);
              }}
            >
              <span>
                {riskTypeFilter.length
                  ? riskTypeFilter.map((r) => translateRiskTag(r, t)).join(", ")
                  : t("全部", "All")}
              </span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
              {showRiskTypeDD && (
                <div
                  className="fl-dropdown"
                  onClick={(e) => e.stopPropagation()}
                >
                  {ALL_RISK_TYPES.map((r) => (
                    <label key={r} className="fl-dropdown-item">
                      <input
                        type="checkbox"
                        checked={riskTypeFilter.includes(r)}
                        onChange={() =>
                          toggleMultiSelect(
                            r,
                            riskTypeFilter,
                            setRiskTypeFilter,
                          )
                        }
                      />
                      <span>{translateRiskTag(r, t)}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Governance Status multi-select */}
          <div className="fl-filter-item fl-filter-multi">
            <label>{t("治理状态", "Governance Status")}</label>
            <div
              className="fl-multi-select"
              onClick={(e) => {
                e.stopPropagation();
                closeAllDropdowns();
                setShowGovStatusDD(!showGovStatusDD);
              }}
            >
              <span>
                {govStatusFilter.length
                  ? govStatusFilter
                      .map((s) => translateGovStatus(s, t))
                      .join(", ")
                  : t("全部", "All")}
              </span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
              {showGovStatusDD && (
                <div
                  className="fl-dropdown"
                  onClick={(e) => e.stopPropagation()}
                >
                  {GOVERNANCE_STATUSES.map((s) => (
                    <label key={s} className="fl-dropdown-item">
                      <input
                        type="checkbox"
                        checked={govStatusFilter.includes(s)}
                        onChange={() =>
                          toggleMultiSelect(
                            s,
                            govStatusFilter,
                            setGovStatusFilter,
                          )
                        }
                      />
                      <span>{translateGovStatus(s, t)}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="fl-filter-actions">
            <button className="fl-btn-search" onClick={handleSearch}>
              {t("搜索", "Search")}
            </button>
            <button className="fl-btn-reset" onClick={handleReset}>
              {t("重置", "Reset")}
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="fl-table-wrapper">
        <table className="fl-table">
          <thead>
            <tr>
              <th className="fl-th-check">
                <input type="checkbox" />
              </th>
              <th>{t("航班号", "Flight Number")}</th>
              <th>{t("机尾号 / 机型", "Aircraft Tail / Type")}</th>
              <th>{t("出发", "Departure")}</th>
              <th>{t("到达", "Arrival")}</th>
              <th>{t("起飞时间", "Departure Time")}</th>
              <th>{t("降落时间", "Arrival Time")}</th>
              <th>{t("状态", "Status")}</th>
              <th>{t("综合风险等级", "Composite Risk Level")}</th>
              <th>{t("人为因素评分", "Human Factor Score")}</th>
              <th>{t("飞机因素评分", "Aircraft Factor Score")}</th>
              <th>{t("环境因素评分", "Environmental Factor Score")}</th>
              <th>{t("主要风险标签", "Major Risk Tags")}</th>
              <th>{t("治理状态", "Governance Status")}</th>
              <th style={{ minWidth: 100 }}>{t("操作", "Actions")}</th>
            </tr>
          </thead>
          <tbody>
            {pageFlights.map((flight) => {
              const riskLabel = getCompositeRiskLabel(flight);
              const govStatus = getGovernanceStatus(flight);
              const tags = getRiskTags(flight);
              return (
                <tr
                  key={flight.id}
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    navigate(`/risk-monitoring/flight-detail?id=${flight.id}`)
                  }
                >
                  <td className="fl-td-check">
                    <input type="checkbox" />
                  </td>
                  <td className="fl-td-flight-no">
                    {getDisplayFlightNumber(flight)}
                  </td>
                  <td>
                    {flight.aircraftNumber || "—"} /{" "}
                    {flight.aircraftType || "—"}
                  </td>
                  <td>
                    <span
                      className="fl-airport-code"
                      data-tip={flight.fromAirportZh || flight.fromAirport}
                    >
                      {flight.fromAirportCode4 || flight.fromAirport}
                    </span>
                  </td>
                  <td>
                    <span
                      className="fl-airport-code"
                      data-tip={flight.toAirportZh || flight.toAirport}
                    >
                      {flight.toAirportCode4 || flight.toAirport}
                    </span>
                  </td>
                  <td>
                    {flight.scheduledDeparture || flight.actualDeparture || "—"}
                  </td>
                  <td>
                    {flight.scheduledArrival || flight.actualArrival || "—"}
                  </td>
                  <td>
                    <span
                      className={`fl-status-badge fl-status-${flight.status === "已落地" ? "landed" : flight.status === "巡航中" ? "cruise" : "pending"}`}
                    >
                      {translateFlightStatus(flight.status, t)}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`fl-risk-badge ${riskLabelClass(riskLabel)}`}
                    >
                      {translateRiskLevel(riskLabel, t)}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`fl-score ${scoreColorClass(flight.humanRisk)}`}
                    >
                      {flight.humanRisk}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`fl-score ${scoreColorClass(flight.machineRisk)}`}
                    >
                      {flight.machineRisk}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`fl-score ${scoreColorClass(flight.environmentRisk)}`}
                    >
                      {flight.environmentRisk}
                    </span>
                  </td>
                  <td>
                    <div className="fl-tags">
                      {tags.map((tag, i) => (
                        <span key={i} className="fl-tag">
                          {tag === "—" ? "—" : translateRiskTag(tag, t)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`fl-gov-badge ${govStatusClass(govStatus)}`}
                    >
                      {translateGovStatus(govStatus, t)}
                    </span>
                  </td>
                  <td>
                    <div
                      className="fl-icon-actions"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="fl-icon-btn"
                        data-tip={t("查看报告", "View Report")}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(
                            `/risk-monitoring/flight-report?id=${flight.id}`,
                          );
                        }}
                      >
                        <svg
                          width="14"
                          height="14"
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
                      </button>
                      <button
                        className="fl-icon-btn"
                        data-tip={t("查看相关人员", "View Personnel")}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/personnel-center/personnel-list`);
                        }}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </button>
                      <button
                        className="fl-icon-btn"
                        data-tip={t("查看相关机场", "View Airport")}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(
                            `/airport-center/airport-detail?code=${flight.fromAirport}`,
                          );
                        }}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
                        </svg>
                      </button>
                      <button
                        className="fl-icon-btn"
                        data-tip={t("查看相关环境", "View Environment")}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/environment-topic/environment-detail`);
                        }}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="4" />
                          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                        </svg>
                      </button>
                      <button
                        className="fl-icon-btn fl-icon-btn-warn"
                        data-tip={t("发起处置", "Initiate Action")}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                          <line x1="12" y1="9" x2="12" y2="13" />
                          <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="fl-pagination">
        <span className="fl-page-info">
          {filteredFlights.length} {t("条结果", "results")} | {t("第", "Page")}{" "}
          {page} {t("页，共", "of")} {totalPages || 1}
        </span>
        <div className="fl-page-btns">
          <button disabled={page === 1} onClick={() => setPage(1)}>
            &laquo;
          </button>
          <button disabled={page === 1} onClick={() => setPage(page - 1)}>
            &lsaquo;
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const start = Math.max(1, Math.min(page - 2, totalPages - 4));
            const p = start + i;
            if (p > totalPages) return null;
            return (
              <button
                key={p}
                className={p === page ? "fl-page-active" : ""}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            );
          })}
          <button
            disabled={page === totalPages || totalPages === 0}
            onClick={() => setPage(page + 1)}
          >
            &rsaquo;
          </button>
          <button
            disabled={page === totalPages || totalPages === 0}
            onClick={() => setPage(totalPages)}
          >
            &raquo;
          </button>
        </div>
      </div>
    </div>
  );
}
