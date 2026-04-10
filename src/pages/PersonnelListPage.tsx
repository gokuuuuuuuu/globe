// @ts-nocheck
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "../i18n/useLanguage";
import "./PersonnelListPage.css";

// ---------- Mock Data ----------

type RiskLevel = "High" | "Medium" | "Low";

interface Personnel {
  id: string;
  employeeId: string;
  name: string;
  operatingUnit: string;
  riskLevel: RiskLevel;
  humanFactorTags: string;
  relatedHighRiskFlights: number;
}

const UNITS = ["东航总部", "上海分公司", "江苏分公司", "浙江分公司"];
const AIRCRAFT_TYPES = ["B737", "B777", "A320", "A350"];
const BRIGADES = ["一大队", "二大队", "三大队", "四大队"];
const SQUADRONS = ["一中队", "二中队", "三中队", "四中队"];
const TECH_LEVELS = ["机长", "副驾驶", "教员", "检查员"];

const NAMES = [
  "A. Brown",
  "James Smith",
  "J*** S**",
  "Jamie Smith",
  "R. Chen",
  "M*** L**",
  "David Wang",
  "K. Johnson",
  "L*** Z**",
  "Sarah Lee",
  "T. Wilson",
  "P*** K**",
  "Michael Zhang",
  "H. Garcia",
  "W*** T**",
  "Robert Liu",
  "E. Martinez",
  "N*** W**",
  "Jessica Huang",
  "C. Taylor",
  "F*** R**",
  "Daniel Park",
  "G. Anderson",
  "B*** M**",
  "Emily Zhou",
  "S. Thomas",
  "Q*** Y**",
  "Andrew Kim",
  "I. Jackson",
  "V*** H**",
  "Nathan Xu",
  "O. White",
  "Z*** D**",
  "Christopher Li",
  "U. Harris",
  "X*** B**",
  "Jennifer Wu",
  "Y. Clark",
  "A*** N**",
  "Kevin Zhao",
  "P. Lewis",
  "D*** F**",
  "Michelle Sun",
  "J. Robinson",
  "L*** G**",
  "Ryan Ma",
  "T. Walker",
  "C*** E**",
  "Amanda Qian",
  "B. Young",
];

const MOCK_UNITS = [
  "North Division - SQ101",
  "North Division - SQ102",
  "South Division - SQ203",
  "East Division - SQ305",
  "West Division - SQ101",
  "Central Division - SQ102",
];

const RISK_LEVELS: RiskLevel[] = ["High", "Medium", "Low"];
const TAGS = [
  "Fatigue, Stress, Task Overload",
  "Communication, Procedure Deviations",
  "None",
];

function generateMockData(): Personnel[] {
  const data: Personnel[] = [];
  for (let i = 0; i < 50; i++) {
    const riskIdx = i < 15 ? 0 : i < 35 ? 1 : 2;
    data.push({
      id: `p-${i}`,
      employeeId: `EMP0${421 + i}`,
      name: NAMES[i % NAMES.length],
      operatingUnit: MOCK_UNITS[i % MOCK_UNITS.length],
      riskLevel: RISK_LEVELS[riskIdx],
      humanFactorTags: riskIdx === 3 ? "None" : TAGS[i % 3],
      relatedHighRiskFlights:
        riskIdx === 3 ? 0 : Math.min(4, Math.floor(Math.random() * 5)),
    });
  }
  return data;
}

const MOCK_PERSONNEL = generateMockData();

// ---------- Component ----------

export function PersonnelListPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [filterCollapsed, setFilterCollapsed] = useState(true);

  // Filters
  const [unit, setUnit] = useState("东航总部");
  const [aircraftType, setAircraftType] = useState("B737");
  const [brigade, setBrigade] = useState("一大队");
  const [squadron, setSquadron] = useState("一中队");
  const [techLevel, setTechLevel] = useState("机长");
  const [searchText, setSearchText] = useState("");
  const [dateFrom, setDateFrom] = useState("2024-02-15");
  const [dateTo, setDateTo] = useState("2024-05-15");

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

  const filteredData = useMemo(() => {
    let data = MOCK_PERSONNEL;
    if (searchText) {
      const q = searchText.toLowerCase();
      data = data.filter(
        (p) =>
          p.employeeId.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          p.operatingUnit.toLowerCase().includes(q),
      );
    }
    return data;
  }, [searchText]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const pageData = filteredData.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );

  const totalPersonnel = MOCK_PERSONNEL.length;
  const highRiskCount = MOCK_PERSONNEL.filter(
    (p) => p.riskLevel === "High",
  ).length;
  const avgRiskScore = 4.25;

  const handleReset = () => {
    setUnit("东航总部");
    setAircraftType("B737");
    setBrigade("一大队");
    setSquadron("一中队");
    setTechLevel("机长");
    setSearchText("");
    setPage(1);
  };

  const handleApply = () => {
    setPage(1);
  };

  function riskBadgeClass(level: RiskLevel): string {
    switch (level) {
      case "High":
        return "pl-risk-high";
      case "Medium":
        return "pl-risk-medium";
      case "Low":
        return "pl-risk-low";
    }
  }

  function riskLabel(level: RiskLevel): string {
    switch (level) {
      case "High":
        return t("高", "High");
      case "Medium":
        return t("中", "Medium");
      case "Low":
        return t("低", "Low");
    }
  }

  function translateTags(tags: string): string {
    if (tags === "Fatigue, Stress, Task Overload")
      return t("疲劳、压力、任务过载", "Fatigue, Stress, Task Overload");
    if (tags === "Communication, Procedure Deviations")
      return t("通信、程序偏差", "Communication, Procedure Deviations");
    return t("无", "None");
  }

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
                  onChange={(e) => setUnit(e.target.value)}
                >
                  {UNITS.map((u) => (
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
                  {AIRCRAFT_TYPES.map((a) => (
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
                  onChange={(e) => setBrigade(e.target.value)}
                >
                  {BRIGADES.map((b) => (
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
                  {SQUADRONS.map((s) => (
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
                  {TECH_LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
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
                <span className="pl-stat-value">{totalPersonnel}</span>
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
                  {highRiskCount}
                </span>
                <span className="pl-stat-label">
                  {t("高风险", "High-Risk")}
                </span>
              </div>
              <div className="pl-stat-box">
                <span className="pl-stat-value">{avgRiskScore}</span>
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
              "搜索员工ID、姓名、单位...",
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
          <button className="pl-export-btn">
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
        <table className="pl-table">
          <thead>
            <tr>
              <th className="pl-th-check" />
              <th>{t("员工ID", "Employee ID")}</th>
              <th>{t("姓名", "Name")}</th>
              <th>{t("单位", "Unit")}</th>
              <th>{t("综合风险等级", "Composite Risk Level")}</th>
              <th>{t("主要人为因素标签", "Main Human Factor Tags")}</th>
              <th>{t("相关高风险航班", "Related High-Risk Flights")}</th>
            </tr>
          </thead>
          <tbody>
            {pageData.map((person) => (
              <tr
                key={person.id}
                className={person.riskLevel === "High" ? "pl-row-high" : ""}
                style={{ cursor: "pointer" }}
                onClick={() =>
                  navigate(`/personnel-center/personnel-detail?id=${person.id}`)
                }
              >
                <td className="pl-td-check" />
                <td className="pl-td-empid">{person.employeeId}</td>
                <td>{person.name}</td>
                <td>{person.operatingUnit}</td>
                <td>
                  <span
                    className={`pl-risk-badge ${riskBadgeClass(person.riskLevel)}`}
                  >
                    {riskLabel(person.riskLevel)}
                  </span>
                </td>
                <td>
                  <span className="pl-tags">
                    {translateTags(person.humanFactorTags)}
                  </span>
                </td>
                <td>{person.relatedHighRiskFlights}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
