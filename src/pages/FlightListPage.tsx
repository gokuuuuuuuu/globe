// @ts-nocheck
import { useMemo, useState } from "react";
import { FLIGHTS, calculateRiskFromEnvironmentRisk } from "../data/flightData";
import type { Flight } from "../data/flightData";
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
  if (score >= 80) return "fl-score-red";
  if (score >= 50) return "fl-score-orange";
  if (score >= 30) return "fl-score-yellow";
  return "fl-score-green";
}

export function FlightListPage() {
  // Filters
  const [flightNumberFilter, setFlightNumberFilter] = useState("");
  const [departureFilter, setDepartureFilter] = useState("");
  const [arrivalFilter, setArrivalFilter] = useState("");
  const [operatingUnitFilter, setOperatingUnitFilter] = useState("");
  const [aircraftTypeFilter, setAircraftTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [riskLevelFilter, setRiskLevelFilter] = useState<string[]>([]);
  const [govStatusFilter, setGovStatusFilter] = useState<string[]>([]);
  const [riskTypeFilter, setRiskTypeFilter] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [openActions, setOpenActions] = useState<string | null>(null);

  // Dropdown toggles
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
        <span>Risk Monitoring</span>
        <span className="fl-breadcrumb-sep">&gt;</span>
        <span className="fl-breadcrumb-active">Flight List</span>
      </div>

      {/* Page Header */}
      <div className="fl-page-header">
        <div className="fl-page-title">
          <h1>Flight List</h1>
          <span className="fl-flight-count">
            {filteredFlights.length} flights
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
            Export
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
            Save Filters
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
            Column Settings
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="fl-filters">
        <div className="fl-filter-row">
          <div className="fl-filter-item">
            <label>Flight Number</label>
            <input
              className="fl-input"
              placeholder="Enter flight number..."
              value={flightNumberFilter}
              onChange={(e) => setFlightNumberFilter(e.target.value)}
            />
          </div>
          <div className="fl-filter-item">
            <label>Departure Airport</label>
            <select
              className="fl-select"
              value={departureFilter}
              onChange={(e) => setDepartureFilter(e.target.value)}
            >
              <option value="">All</option>
              {ALL_DEPARTURE_AIRPORTS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div className="fl-filter-item">
            <label>Arrival Airport</label>
            <select
              className="fl-select"
              value={arrivalFilter}
              onChange={(e) => setArrivalFilter(e.target.value)}
            >
              <option value="">All</option>
              {ALL_ARRIVAL_AIRPORTS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div className="fl-filter-item">
            <label>Aircraft Type</label>
            <select
              className="fl-select"
              value={aircraftTypeFilter}
              onChange={(e) => setAircraftTypeFilter(e.target.value)}
            >
              <option value="">All</option>
              {ALL_AIRCRAFT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="fl-filter-item">
            <label>Operating Unit</label>
            <select
              className="fl-select"
              value={operatingUnitFilter}
              onChange={(e) => setOperatingUnitFilter(e.target.value)}
            >
              <option value="">All</option>
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
            <label>Risk Level</label>
            <div
              className="fl-multi-select"
              onClick={(e) => {
                e.stopPropagation();
                closeAllDropdowns();
                setShowRiskLevelDD(!showRiskLevelDD);
              }}
            >
              <span>
                {riskLevelFilter.length ? riskLevelFilter.join(", ") : "All"}
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
                      <span>{r}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Flight Status multi-select */}
          <div className="fl-filter-item fl-filter-multi">
            <label>Flight Status</label>
            <div
              className="fl-multi-select"
              onClick={(e) => {
                e.stopPropagation();
                closeAllDropdowns();
                setShowStatusDD(!showStatusDD);
              }}
            >
              <span>
                {statusFilter.length ? statusFilter.join(", ") : "All"}
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
                      <span>{s}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Major Risk Type multi-select */}
          <div className="fl-filter-item fl-filter-multi">
            <label>Major Risk Type</label>
            <div
              className="fl-multi-select"
              onClick={(e) => {
                e.stopPropagation();
                closeAllDropdowns();
                setShowRiskTypeDD(!showRiskTypeDD);
              }}
            >
              <span>
                {riskTypeFilter.length ? riskTypeFilter.join(", ") : "All"}
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
                      <span>{r}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Governance Status multi-select */}
          <div className="fl-filter-item fl-filter-multi">
            <label>Governance Status</label>
            <div
              className="fl-multi-select"
              onClick={(e) => {
                e.stopPropagation();
                closeAllDropdowns();
                setShowGovStatusDD(!showGovStatusDD);
              }}
            >
              <span>
                {govStatusFilter.length ? govStatusFilter.join(", ") : "All"}
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
                      <span>{s}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="fl-filter-actions">
            <button className="fl-btn-search" onClick={handleSearch}>
              Search
            </button>
            <button className="fl-btn-reset" onClick={handleReset}>
              Reset
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
              <th>Flight Number</th>
              <th>Aircraft Tail / Type</th>
              <th>Departure</th>
              <th>Arrival</th>
              <th>Scheduled Time</th>
              <th>Estimated Time</th>
              <th>Status</th>
              <th>Composite Risk Level</th>
              <th>Human Factor Score</th>
              <th>Aircraft Factor Score</th>
              <th>Environmental Factor Score</th>
              <th>Major Risk Tags</th>
              <th>Governance Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageFlights.map((flight) => {
              const riskLabel = getCompositeRiskLabel(flight);
              const govStatus = getGovernanceStatus(flight);
              const tags = getRiskTags(flight);
              return (
                <tr key={flight.id}>
                  <td className="fl-td-check">
                    <input type="checkbox" />
                  </td>
                  <td className="fl-td-flight-no">{flight.flightNumber}</td>
                  <td>
                    {flight.aircraftNumber || "—"} /{" "}
                    {flight.aircraftType || "—"}
                  </td>
                  <td>
                    <div className="fl-airport-cell">
                      <span className="fl-airport-code">
                        {flight.fromAirportCode4 || flight.fromAirport}
                      </span>
                      <span className="fl-airport-name">
                        {flight.fromAirportZh}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="fl-airport-cell">
                      <span className="fl-airport-code">
                        {flight.toAirportCode4 || flight.toAirport}
                      </span>
                      <span className="fl-airport-name">
                        {flight.toAirportZh}
                      </span>
                    </div>
                  </td>
                  <td>{flight.scheduledDeparture || "—"}</td>
                  <td>{flight.estimatedDeparture || "—"}</td>
                  <td>
                    <span
                      className={`fl-status-badge fl-status-${flight.status === "已落地" ? "landed" : flight.status === "巡航中" ? "cruise" : "pending"}`}
                    >
                      {flight.status}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`fl-risk-badge ${riskLabelClass(riskLabel)}`}
                    >
                      {riskLabel}
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
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`fl-gov-badge ${govStatusClass(govStatus)}`}
                    >
                      {govStatus}
                    </span>
                  </td>
                  <td>
                    <div className="fl-actions-cell">
                      <button
                        className="fl-actions-toggle"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenActions(
                            openActions === flight.id ? null : flight.id,
                          );
                        }}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>
                      {openActions === flight.id && (
                        <div className="fl-actions-menu">
                          <button onClick={() => setOpenActions(null)}>
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <line x1="12" y1="8" x2="12" y2="12" />
                              <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            View Flight
                          </button>
                          <button onClick={() => setOpenActions(null)}>
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                            View Report
                          </button>
                          <button onClick={() => setOpenActions(null)}>
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <line x1="8" y1="6" x2="21" y2="6" />
                              <line x1="8" y1="12" x2="21" y2="12" />
                              <line x1="8" y1="18" x2="21" y2="18" />
                              <line x1="3" y1="6" x2="3.01" y2="6" />
                              <line x1="3" y1="12" x2="3.01" y2="12" />
                              <line x1="3" y1="18" x2="3.01" y2="18" />
                            </svg>
                            Initiate Action
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
      <div className="fl-pagination">
        <span className="fl-page-info">
          {filteredFlights.length} results | Page {page} of {totalPages || 1}
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
