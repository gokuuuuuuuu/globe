// @ts-nocheck
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "../i18n/useLanguage";
import {
  getFlightPersonList,
  getFlightPersonFilterOptions,
  exportFlightPersons,
} from "../api/flightPerson";
import "./PersonnelListPage.css";

// ---------- Types ----------

type RiskLevel = "HIGH" | "MEDIUM" | "LOW";

interface Personnel {
  id: number;
  empNo: string;
  name: string;
  unit: string | null;
  flightUnit: string | null;
  aircraftType: string | null;
  team: string | null;
  squadron: string | null;
  techGrade: string | null;
  riskLevel: RiskLevel;
  humanFactorTags: string | null;
  highRiskFlightCount: number;
}

interface Summary {
  totalCount: number;
  highRiskCount: number;
  avgRiskScore: number;
}

interface FilterOptions {
  flightUnits: string[];
  aircraftTypes: string[];
  teams: string[];
  squadrons: string[];
  techGrades: string[];
}

// ---------- Component ----------

export function PersonnelListPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [filterCollapsed, setFilterCollapsed] = useState(true);
  const [loading, setLoading] = useState(false);

  // Data
  const [data, setData] = useState<Personnel[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<Summary>({
    totalCount: 0,
    highRiskCount: 0,
    avgRiskScore: 0,
  });

  // Filter options from API
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    flightUnits: [],
    aircraftTypes: [],
    teams: [],
    squadrons: [],
    techGrades: [],
  });

  // Filters
  const [unit, setUnit] = useState("");
  const [aircraftType, setAircraftType] = useState("");
  const [brigade, setBrigade] = useState("");
  const [squadron, setSquadron] = useState("");
  const [techLevel, setTechLevel] = useState("");
  const [riskLevel, setRiskLevel] = useState("");

  const [searchText, setSearchText] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Pagination
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
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Load filter options on mount
  useEffect(() => {
    getFlightPersonFilterOptions()
      .then((res) => {
        setFilterOptions(res);
      })
      .catch(() => {});
  }, []);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const riskParam = searchParams.get("risk");
      const params: Record<string, any> = {
        page,
        pageSize: rowsPerPage,
      };
      if (searchText) params.keyword = searchText;
      if (unit) params.flightUnit = unit;
      if (aircraftType) params.aircraftType = aircraftType;
      if (brigade) params.team = brigade;
      if (squadron) params.squadron = squadron;
      if (techLevel) params.techGrade = techLevel;
      if (riskLevel) params.riskLevel = riskLevel;
      if (riskParam === "high") params.riskLevel = "HIGH";
      if (dateFrom) params.startDate = dateFrom;
      if (dateTo) params.endDate = dateTo;

      const res = await getFlightPersonList(params);
      const result = res;
      setData(result.items || []);
      setTotal(result.total || 0);
      if (result.summary) {
        setSummary(result.summary);
      }
    } catch (err) {
      console.error("Failed to fetch personnel list:", err);
    } finally {
      setLoading(false);
    }
  }, [
    page,
    rowsPerPage,
    searchText,
    unit,
    aircraftType,
    brigade,
    squadron,
    techLevel,
    riskLevel,
    dateFrom,
    dateTo,
    searchParams,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalPages = Math.ceil(total / rowsPerPage);

  const handleReset = () => {
    setUnit("");
    setAircraftType("");
    setBrigade("");
    setSquadron("");
    setTechLevel("");
    setRiskLevel("");
    setSearchText("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const handleApply = () => {
    setPage(1);
  };

  function riskBadgeClass(level: RiskLevel): string {
    switch (level) {
      case "HIGH":
        return "pl-risk-high";
      case "MEDIUM":
        return "pl-risk-medium";
      case "LOW":
        return "pl-risk-low";
      default:
        return "";
    }
  }

  function riskLabel(level: RiskLevel): string {
    switch (level) {
      case "HIGH":
        return t("高", "High");
      case "MEDIUM":
        return t("中", "Medium");
      case "LOW":
        return t("低", "Low");
      default:
        return level || "";
    }
  }

  // Handle export
  const handleExport = async () => {
    try {
      const params: Record<string, any> = {};
      if (searchText) params.keyword = searchText;
      if (unit) params.flightUnit = unit;
      if (aircraftType) params.aircraftType = aircraftType;
      if (brigade) params.team = brigade;
      if (squadron) params.squadron = squadron;
      if (techLevel) params.techGrade = techLevel;
      if (riskLevel) params.riskLevel = riskLevel;
      if (dateFrom) params.startDate = dateFrom;
      if (dateTo) params.endDate = dateTo;

      const res = await exportFlightPersons(params);
      const blob = new Blob([res], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = t("人员列表.xlsx", "personnel_list.xlsx");
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  // Pagination page numbers
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="pl-root">
      {/* Breadcrumb */}
      <div className="pl-breadcrumb">
        <span style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
          {t("工作台", "Dashboard")}
        </span>
        <span className="pl-breadcrumb-sep">&gt;</span>
        <span
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/personnel-center/personnel-list")}
        >
          {t("人", "Personnel")}
        </span>
        <span className="pl-breadcrumb-sep">&gt;</span>
        <span className="pl-breadcrumb-active">
          {t("人员列表", "Personnel List")}
        </span>
      </div>

      {/* Page Header */}
      <div className="pl-page-header">
        <div className="pl-page-title">
          <h1>{t("人员列表", "Personnel List (High-Risk)")}</h1>
        </div>
      </div>

      {/* Filter Card (collapsible) */}
      <div
        className="pl-filter-toggle"
        onClick={() => setFilterCollapsed(!filterCollapsed)}
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
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
        <span>{t("筛选条件", "Filters")}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{
            transition: "transform 0.2s",
            transform: filterCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
      {!filterCollapsed && (
        <div className="pl-filter-card">
          <div className="pl-filter-top">
            <div className="pl-filter-dropdowns">
              <div className="pl-filter-item">
                <label>{t("飞行单位", "Flight Unit")}</label>
                <select
                  className="pl-select"
                  value={unit}
                  onChange={(e) => {
                    setUnit(e.target.value);
                    setBrigade("");
                    setSquadron("");
                  }}
                >
                  <option value="">{t("全部", "All")}</option>
                  {filterOptions.flightUnits.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
              <div className="pl-filter-item">
                <label>{t("机型", "Aircraft Type")}</label>
                <select
                  className="pl-select"
                  value={aircraftType}
                  onChange={(e) => setAircraftType(e.target.value)}
                >
                  <option value="">{t("全部", "All")}</option>
                  {filterOptions.aircraftTypes.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
              <div className="pl-filter-item">
                <label>{t("大队", "Brigade")}</label>
                <select
                  className="pl-select"
                  value={brigade}
                  onChange={(e) => {
                    setBrigade(e.target.value);
                    setSquadron("");
                  }}
                >
                  <option value="">{t("全部", "All")}</option>
                  {filterOptions.teams.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
              <div className="pl-filter-item">
                <label>{t("中队", "Squadron")}</label>
                <select
                  className="pl-select"
                  value={squadron}
                  onChange={(e) => setSquadron(e.target.value)}
                >
                  <option value="">{t("全部", "All")}</option>
                  {filterOptions.squadrons.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="pl-filter-item">
                <label>{t("技术等级", "Technical Level")}</label>
                <select
                  className="pl-select"
                  value={techLevel}
                  onChange={(e) => setTechLevel(e.target.value)}
                >
                  <option value="">{t("全部", "All")}</option>
                  {filterOptions.techGrades.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
              <div className="pl-filter-item">
                <label>{t("风险等级", "Risk Level")}</label>
                <select
                  className="pl-select"
                  value={riskLevel}
                  onChange={(e) => setRiskLevel(e.target.value)}
                >
                  <option value="">{t("全部", "All")}</option>
                  <option value="HIGH">{t("高", "High")}</option>
                  <option value="MEDIUM">{t("中", "Medium")}</option>
                  <option value="LOW">{t("低", "Low")}</option>
                </select>
              </div>
              <div className="pl-filter-item">
                <label>{t("时间", "Time")}</label>
                <div className="pl-time-range">
                  <input
                    type="date"
                    className="pl-date-input"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                  <span className="pl-date-sep">—</span>
                  <input
                    type="date"
                    className="pl-date-input"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="pl-stats">
              <div className="pl-stat-box">
                <span className="pl-stat-value">{summary.totalCount}</span>
                <span className="pl-stat-label">
                  {t("总人员", "Total Personnel")}
                </span>
              </div>
              <div className="pl-stat-box">
                <span className="pl-stat-value pl-stat-warning">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  {summary.highRiskCount}
                </span>
                <span className="pl-stat-label">
                  {t("高风险", "High-Risk")}
                </span>
              </div>
              <div className="pl-stat-box">
                <span className="pl-stat-value">{summary.avgRiskScore}</span>
                <span className="pl-stat-label">
                  {t("平均风险分", "Avg Risk Score")}
                </span>
              </div>
            </div>
          </div>

          <div className="pl-filter-bottom">
            <button className="pl-btn-reset" onClick={handleReset}>
              {t("重置", "Reset")}
            </button>
            <button className="pl-btn-apply" onClick={handleApply}>
              {t("应用", "Apply")}
            </button>
          </div>
        </div>
      )}

      {/* Search + Export Row */}
      <div className="pl-search-row">
        <div className="pl-search-input">
          <svg
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
            placeholder={t(
              "搜索工号、姓名、单位...",
              "Search employee ID, name, unit...",
            )}
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="pl-export-btns">
          <button className="pl-export-btn" onClick={handleExport}>
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

      {/* Table */}
      <div className="pl-table-wrapper">
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
        {!loading && (
          <table className="pl-table">
            <thead>
              <tr>
                <th className="pl-th-check" />
                <th>{t("工号", "Employee No.")}</th>
                <th>{t("姓名", "Name")}</th>
                <th>{t("飞行单位", "Flight Unit")}</th>
                <th>{t("机型", "Aircraft Type")}</th>
                <th>{t("大队", "Brigade")}</th>
                <th>{t("中队", "Squadron")}</th>
                <th>{t("技术等级", "Technical Level")}</th>
                <th>{t("综合风险等级", "Composite Risk Level")}</th>
                <th>{t("主要人为因素标签", "Main Human Factor Tags")}</th>
                <th>{t("相关高风险航班", "Related High-Risk Flights")}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((person) => (
                <tr
                  key={person.id}
                  className={person.riskLevel === "HIGH" ? "pl-row-high" : ""}
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    navigate(
                      `/personnel-center/personnel-detail?id=${person.empNo}`,
                    )
                  }
                >
                  <td className="pl-td-check" />
                  <td className="pl-td-empid">{person.empNo}</td>
                  <td>{person.name}</td>
                  <td>{person.flightUnit || "-"}</td>
                  <td>{person.aircraftType || "-"}</td>
                  <td>{person.team || "-"}</td>
                  <td>{person.squadron || "-"}</td>
                  <td>{person.techGrade || "-"}</td>
                  <td>
                    <span
                      className={`pl-risk-badge ${riskBadgeClass(person.riskLevel)}`}
                    >
                      {riskLabel(person.riskLevel)}
                    </span>
                  </td>
                  <td>
                    <span className="pl-tags">
                      {person.humanFactorTags || t("无", "None")}
                    </span>
                  </td>
                  <td>{person.highRiskFlightCount}</td>
                </tr>
              ))}
              {data.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={11}
                    style={{
                      textAlign: "center",
                      padding: "40px 0",
                      color: "#94a3b8",
                    }}
                  >
                    {t("暂无数据", "No data")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="pl-pagination">
        <div className="pl-page-btns">
          <button disabled={page === 1} onClick={() => setPage(page - 1)}>
            {t("上一页", "Previous")}
          </button>
          {getPageNumbers().map((p, i) =>
            typeof p === "string" ? (
              <span
                key={`e-${i}`}
                style={{ color: "#64748b", padding: "0 4px" }}
              >
                ...
              </span>
            ) : (
              <button
                key={p}
                className={p === page ? "pl-page-active" : ""}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ),
          )}
          <button
            disabled={page === totalPages || totalPages === 0}
            onClick={() => setPage(page + 1)}
          >
            {t("下一页", "Next")}
          </button>
        </div>
        <div className="pl-rows-per-page">
          <span>{t("每页行数：", "Rows per page:")}</span>
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setPage(1);
            }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>
    </div>
  );
}
