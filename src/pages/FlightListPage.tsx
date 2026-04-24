// @ts-nocheck
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "../i18n/useLanguage";
import { useAuthStore, isFullDataAccess } from "../store/useAuthStore";
import {
  getFlightList,
  getFlightFilterOptions,
  exportFlights,
} from "../api/flight";
import "./FlightListPage.css";

const PAGE_SIZE = 25;

// 主要风险类型
const RISK_TYPE_OPTIONS = [
  "冲/偏出跑道",
  "可控飞行撞地",
  "擦机尾/擦翼尖/擦发动机",
  "空中失控",
  "空中冲突",
  "空中损伤",
  "地面损伤",
  "跑道入侵",
  "鸟击",
  "重着陆",
  "不稳定进近",
  "重要系统故障",
];

const RISK_LEVELS = [
  { value: "LOW", labelZh: "低风险", labelEn: "Low Risk" },
  { value: "MEDIUM", labelZh: "中风险", labelEn: "Medium Risk" },
  { value: "HIGH", labelZh: "高风险", labelEn: "High Risk" },
];

const FLIGHT_STATUSES = [
  { value: "SCHEDULED", labelZh: "未起飞", labelEn: "Scheduled" },
  { value: "CRUISING", labelZh: "巡航中", labelEn: "Cruising" },
  { value: "LANDED", labelZh: "已落地", labelEn: "Landed" },
];

const GOVERNANCE_STATUSES = [
  { value: "PENDING", labelZh: "未处置", labelEn: "Pending" },
  { value: "IN_PROGRESS", labelZh: "处置中", labelEn: "In Progress" },
  { value: "RESOLVED", labelZh: "已解决", labelEn: "Resolved" },
  { value: "CLOSED", labelZh: "已关闭", labelEn: "Closed" },
];

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function riskLabelClass(level: string): string {
  if (level === "HIGH") return "fl-risk-high";
  if (level === "MEDIUM") return "fl-risk-medium";
  return "fl-risk-low";
}

function riskLevelDisplay(
  level: string,
  t: (zh: string, en: string) => string,
): string {
  if (level === "HIGH") return t("高风险", "High Risk");
  if (level === "MEDIUM") return t("中风险", "Medium Risk");
  return t("低风险", "Low Risk");
}

function statusBadgeClass(status: string): string {
  if (status === "LANDED") return "fl-status-landed";
  if (status === "CRUISING") return "fl-status-cruise";
  return "fl-status-pending";
}

function statusDisplay(
  status: string,
  t: (zh: string, en: string) => string,
): string {
  if (status === "LANDED") return t("已落地", "Landed");
  if (status === "CRUISING") return t("巡航中", "Cruising");
  return t("未起飞", "Scheduled");
}

function scoreColorClass(score: number): string {
  if (score >= 70) return "fl-score-red";
  if (score >= 40) return "fl-score-yellow";
  return "fl-score-green";
}

export function FlightListPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const authUser = useAuthStore((s) => s.user);
  const fullAccess = isFullDataAccess(authUser);
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const setPage = (pageOrFn: number | ((prev: number) => number)) => {
    const newPage = typeof pageOrFn === "function" ? pageOrFn(page) : pageOrFn;
    const sp = new URLSearchParams(searchParams);
    if (newPage <= 1) {
      sp.delete("page");
    } else {
      sp.set("page", String(newPage));
    }
    setSearchParams(sp, { replace: true });
  };

  // Filter options from API
  const [filterOptions, setFilterOptions] = useState<{
    airports: { id: number; code: string; name: string }[];
    aircraftModels: string[];
    operatingUnits: string[];
  }>({ airports: [], aircraftModels: [], operatingUnits: [] });

  // Filters
  const [flightNumberFilter, setFlightNumberFilter] = useState("");
  const [aircraftNumberFilter, setAircraftNumberFilter] = useState("");
  const [departureFilter, setDepartureFilter] = useState("");
  const [arrivalFilter, setArrivalFilter] = useState("");
  const [operatingUnitFilter, setOperatingUnitFilter] = useState("");
  const [aircraftTypeFilter, setAircraftTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [riskLevelFilter, setRiskLevelFilter] = useState("");
  const [riskTypeFilter, setRiskTypeFilter] = useState("");
  const [governanceStatusFilter, setGovernanceStatusFilter] = useState("");

  // Data state
  const [flights, setFlights] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [airportPopover, setAirportPopover] = useState<{
    code: string;
    x: number;
    y: number;
  } | null>(null);

  // Read URL params to pre-fill filters
  useEffect(() => {
    const risk = searchParams.get("risk");
    if (risk === "high") setRiskLevelFilter("HIGH");
    const aircraft = searchParams.get("aircraft");
    if (aircraft) setAircraftNumberFilter(aircraft);
  }, []);

  // Load filter options on mount
  useEffect(() => {
    getFlightFilterOptions()
      .then((res) => {
        setFilterOptions(res);
      })
      .catch((err) => {
        console.error("Failed to load filter options:", err);
      });
  }, []);

  // Build query params
  const buildParams = useCallback(() => {
    const params: Record<string, any> = {
      page,
      pageSize: PAGE_SIZE,
    };
    if (flightNumberFilter) params.flightNo = flightNumberFilter;
    if (aircraftNumberFilter) params.planeRegistration = aircraftNumberFilter;
    if (departureFilter) params.departureAirportId = Number(departureFilter);
    if (arrivalFilter) params.arrivalAirportId = Number(arrivalFilter);
    if (aircraftTypeFilter) params.aircraftModel = aircraftTypeFilter;
    if (operatingUnitFilter) params.operatingUnit = operatingUnitFilter;
    if (riskLevelFilter) params.riskLevel = riskLevelFilter;
    if (statusFilter) params.status = statusFilter;
    if (riskTypeFilter) params.riskType = riskTypeFilter;
    if (governanceStatusFilter)
      params.governanceStatus = governanceStatusFilter;
    return params;
  }, [
    page,
    flightNumberFilter,
    aircraftNumberFilter,
    departureFilter,
    arrivalFilter,
    operatingUnitFilter,
    aircraftTypeFilter,
    statusFilter,
    riskLevelFilter,
    riskTypeFilter,
    governanceStatusFilter,
  ]);

  // Fetch flights
  const fetchFlights = useCallback(() => {
    setLoading(true);
    const params = buildParams();
    getFlightList(params)
      .then((res) => {
        const data = res;
        setFlights(data.items || []);
        setTotal(data.total || 0);
      })
      .catch((err) => {
        console.error("Failed to load flights:", err);
        setFlights([]);
        setTotal(0);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [buildParams]);

  // Fetch data when params change
  useEffect(() => {
    fetchFlights();
  }, [fetchFlights]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleSearch = () => setPage(1);
  const handleReset = () => {
    setFlightNumberFilter("");
    setAircraftNumberFilter("");
    setDepartureFilter("");
    setArrivalFilter("");
    setOperatingUnitFilter("");
    setAircraftTypeFilter("");
    setStatusFilter("");
    setRiskLevelFilter("");
    setRiskTypeFilter("");
    setGovernanceStatusFilter("");
    setPage(1);
  };

  const handleExport = async () => {
    try {
      const params = buildParams();
      delete params.page;
      delete params.pageSize;
      const blob = await exportFlights(params);
      const url = window.URL.createObjectURL(
        blob instanceof Blob ? blob : new Blob([blob]),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `${t("航班列表", "flight_list")}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  const closeAllDropdowns = () => {
    setAirportPopover(null);
  };

  return (
    <div className="fl-root" onClick={closeAllDropdowns}>
      {/* Breadcrumb */}
      <div className="fl-breadcrumb">
        <span style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
          {t("工作台", "Dashboard")}
        </span>
        <span className="fl-breadcrumb-sep">&gt;</span>
        <span
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/risk-monitoring/flights")}
        >
          {t("航班", "Flights")}
        </span>
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
            {total} {t("航班", "flights")}
          </span>
        </div>
        <div className="fl-page-actions">
          <button className="fl-action-btn" onClick={handleExport}>
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
              {filterOptions.airports.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} - {a.name}
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
              {filterOptions.airports.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} - {a.name}
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
              {filterOptions.aircraftModels.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div className="fl-filter-item">
            <label>{t("飞行单位", "Flight Unit")}</label>
            <select
              className="fl-select"
              value={operatingUnitFilter}
              onChange={(e) => setOperatingUnitFilter(e.target.value)}
            >
              <option value="">{t("全部", "All")}</option>
              {filterOptions.operatingUnits.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="fl-filter-row">
          {/* Risk Level */}
          <div className="fl-filter-item">
            <label>{t("风险等级", "Risk Level")}</label>
            <select
              className="fl-select"
              value={riskLevelFilter}
              onChange={(e) => setRiskLevelFilter(e.target.value)}
            >
              <option value="">{t("全部", "All")}</option>
              {RISK_LEVELS.map((r) => (
                <option key={r.value} value={r.value}>
                  {t(r.labelZh, r.labelEn)}
                </option>
              ))}
            </select>
          </div>

          {/* Flight Status */}
          <div className="fl-filter-item">
            <label>{t("航班状态", "Flight Status")}</label>
            <select
              className="fl-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">{t("全部", "All")}</option>
              {FLIGHT_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {t(s.labelZh, s.labelEn)}
                </option>
              ))}
            </select>
          </div>

          {/* Major Risk Type */}
          <div className="fl-filter-item">
            <label>{t("主要风险类型", "Major Risk Type")}</label>
            <select
              className="fl-select"
              value={riskTypeFilter}
              onChange={(e) => setRiskTypeFilter(e.target.value)}
            >
              <option value="">{t("全部", "All")}</option>
              {RISK_TYPE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Governance Status */}
          <div className="fl-filter-item">
            <label>{t("治理状态", "Governance Status")}</label>
            <select
              className="fl-select"
              value={governanceStatusFilter}
              onChange={(e) => setGovernanceStatusFilter(e.target.value)}
            >
              <option value="">{t("全部", "All")}</option>
              {GOVERNANCE_STATUSES.map((g) => (
                <option key={g.value} value={g.value}>
                  {t(g.labelZh, g.labelEn)}
                </option>
              ))}
            </select>
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
        {loading && (
          <div
            style={{
              textAlign: "center",
              padding: "40px 0",
              color: "#94a3b8",
            }}
          >
            {t("加载中...", "Loading...")}
          </div>
        )}
        <table className="fl-table" style={{ opacity: loading ? 0.5 : 1 }}>
          <thead>
            <tr>
              <th>{t("航班号", "Flight Number")}</th>
              <th>{t("机尾号 / 机型", "Aircraft Tail / Type")}</th>
              <th>PF</th>
              <th>PM</th>
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
              <th style={{ minWidth: 100 }}>{t("操作", "Actions")}</th>
            </tr>
          </thead>
          <tbody>
            {flights.map((flight) => {
              const tags = flight.riskTags
                ? Array.isArray(flight.riskTags)
                  ? flight.riskTags
                  : [flight.riskTags]
                : ["—"];
              return (
                <tr
                  key={flight.id}
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    navigate(`/risk-monitoring/flight-detail?id=${flight.id}`)
                  }
                >
                  <td className="fl-td-flight-no">{flight.flightNo}</td>
                  <td>
                    <span
                      style={{ cursor: "pointer", color: "#60a5fa" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(
                          `/aircraft-topic/aircraft-detail?tail=${flight.plane?.registration || ""}`,
                        );
                      }}
                    >
                      {flight.plane?.registration || "—"}
                    </span>
                    {" / "}
                    {flight.plane?.model || "—"}
                  </td>
                  <td>
                    <span
                      className="fl-airport-code"
                      style={{ cursor: "pointer", color: "#60a5fa" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(
                          `/personnel-center/personnel-detail?id=${flight.pf?.empNo || ""}`,
                        );
                      }}
                    >
                      {flight.pf?.name || "—"}
                    </span>
                  </td>
                  <td>
                    <span
                      className="fl-airport-code"
                      style={{ cursor: "pointer", color: "#60a5fa" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(
                          `/personnel-center/personnel-detail?id=${flight.pm?.empNo || ""}`,
                        );
                      }}
                    >
                      {flight.pm?.name || "—"}
                    </span>
                  </td>
                  <td style={{ position: "relative" }}>
                    <span
                      className="fl-airport-code"
                      style={{ cursor: "pointer", color: "#60a5fa" }}
                      data-tip={flight.departureAirport?.name}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(
                          `/environment-topic/environment-detail?code=${flight.departureAirport?.code || ""}`,
                        );
                      }}
                    >
                      {flight.departureAirport?.code || "—"}
                    </span>
                  </td>
                  <td style={{ position: "relative" }}>
                    <span
                      className="fl-airport-code"
                      style={{ cursor: "pointer", color: "#60a5fa" }}
                      data-tip={flight.arrivalAirport?.name}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(
                          `/environment-topic/environment-detail?code=${flight.arrivalAirport?.code || ""}`,
                        );
                      }}
                    >
                      {flight.arrivalAirport?.code || "—"}
                    </span>
                  </td>
                  <td>{formatDateTime(flight.departureTime)}</td>
                  <td>{formatDateTime(flight.arrivalTime)}</td>
                  <td>
                    <span
                      className={`fl-status-badge ${statusBadgeClass(flight.status)}`}
                    >
                      {statusDisplay(flight.status, t)}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`fl-risk-badge ${riskLabelClass(flight.riskLevel)}`}
                    >
                      {riskLevelDisplay(flight.riskLevel, t)}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`fl-score ${scoreColorClass(flight.humanFactorScore)}`}
                    >
                      {flight.humanFactorScore}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`fl-score ${scoreColorClass(flight.aircraftFactorScore)}`}
                    >
                      {flight.aircraftFactorScore}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`fl-score ${scoreColorClass(flight.environmentFactorScore)}`}
                    >
                      {flight.environmentFactorScore}
                    </span>
                  </td>
                  <td>
                    <div className="fl-tags">
                      {tags.map((tag, i) => (
                        <span key={i} className="fl-tag">
                          {tag || "—"}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div
                      className="fl-icon-actions"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="fl-icon-btn"
                        data-tip={t("航班报告", "Flight Report")}
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
          {total} {t("条结果", "results")} | {t("第", "Page")} {page}{" "}
          {t("页，共", "of")} {totalPages || 1}
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

      {/* Airport Popover */}
      {airportPopover && (
        <div
          className="fl-airport-popover"
          style={{ left: airportPopover.x, top: airportPopover.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="fl-airport-popover-item"
            onClick={() => {
              navigate(
                `/environment-topic/environment-detail?code=${airportPopover.code}`,
              );
              setAirportPopover(null);
            }}
          >
            {t("查看机场环境", "Airport Environment")}
          </button>
          <button
            className="fl-airport-popover-item"
            onClick={() => {
              navigate(
                `/airport-center/airport-detail?code=${airportPopover.code}`,
              );
              setAirportPopover(null);
            }}
          >
            {t("查看机场详情", "Airport Detail")}
          </button>
        </div>
      )}
    </div>
  );
}
