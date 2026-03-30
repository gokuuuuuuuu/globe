// @ts-nocheck
import { useMemo, useState } from "react";
import { useLanguage } from "../i18n/useLanguage";
import "./PersonnelListPage.css";

// ---------- Mock Data ----------

type RiskLevel = "High" | "Medium-High" | "Medium" | "Low";

interface Personnel {
  id: string;
  employeeId: string;
  name: string;
  operatingUnit: string;
  riskLevel: RiskLevel;
  humanFactorTags: string;
  relatedHighRiskFlights: number;
}

const DIVISIONS = ["Commercial", "Cargo", "Training"];
const SQUADRONS = ["SQ-101", "SQ-102", "SQ-203", "SQ-305"];
const ROLES = ["Pilot", "First Officer", "Flight Engineer", "Dispatcher"];
const FLEETS = ["B737", "B777", "A320", "A350"];

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

const UNITS = [
  "North Division - SQ101",
  "North Division - SQ102",
  "South Division - SQ203",
  "East Division - SQ305",
  "West Division - SQ101",
  "Central Division - SQ102",
];

const RISK_LEVELS: RiskLevel[] = ["High", "Medium-High", "Medium", "Low"];
const TAGS = [
  "Fatigue, Stress, Task Overload",
  "Communication, Procedure Deviations",
  "None",
];

function generateMockData(): Personnel[] {
  const data: Personnel[] = [];
  for (let i = 0; i < 50; i++) {
    const riskIdx = i < 12 ? 0 : i < 22 ? 1 : i < 35 ? 2 : 3;
    data.push({
      id: `p-${i}`,
      employeeId: `EMP0${421 + i}`,
      name: NAMES[i % NAMES.length],
      operatingUnit: UNITS[i % UNITS.length],
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

  // Filters
  const [division, setDivision] = useState("Commercial");
  const [squadron, setSquadron] = useState("SQ-101");
  const [role, setRole] = useState("Pilot");
  const [fleet, setFleet] = useState("B737");
  const [searchText, setSearchText] = useState("");
  const [dateFrom, setDateFrom] = useState("2024-02-15");
  const [dateTo, setDateTo] = useState("2024-05-15");

  // Pagination
  const [page, setPage] = useState(1);
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
    setDivision("Commercial");
    setSquadron("SQ-101");
    setRole("Pilot");
    setFleet("B737");
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
      case "Medium-High":
        return "pl-risk-medium-high";
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
      case "Medium-High":
        return t("中高", "Medium-High");
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
        <span>MRIWP</span>
        <span className="pl-breadcrumb-sep">&gt;</span>
        <span>{t("人员中心", "Personnel Center")}</span>
        <span className="pl-breadcrumb-sep">&gt;</span>
        <span className="pl-breadcrumb-active">
          {t("人员列表", "Personnel List")}
        </span>
      </div>

      {/* Page Header */}
      <div className="pl-page-header">
        <div className="pl-page-title">
          <h1>{t("人员列表（高风险）", "Personnel List (High-Risk)")}</h1>
        </div>
      </div>

      {/* Filter Card */}
      <div className="pl-filter-card">
        <div className="pl-filter-top">
          <div className="pl-filter-dropdowns">
            <div className="pl-filter-item">
              <label>{t("部门", "Division")}</label>
              <select
                className="pl-select"
                value={division}
                onChange={(e) => setDivision(e.target.value)}
              >
                {DIVISIONS.map((d) => (
                  <option key={d} value={d}>
                    {d === "Commercial"
                      ? t("商业", "Commercial")
                      : d === "Cargo"
                        ? t("货运", "Cargo")
                        : d === "Training"
                          ? t("培训", "Training")
                          : d}
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
              <label>{t("角色", "Role")}</label>
              <select
                className="pl-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r === "Pilot"
                      ? t("飞行员", "Pilot")
                      : r === "First Officer"
                        ? t("副驾驶", "First Officer")
                        : r === "Flight Engineer"
                          ? t("飞行工程师", "Flight Engineer")
                          : r === "Dispatcher"
                            ? t("调度员", "Dispatcher")
                            : r}
                  </option>
                ))}
              </select>
            </div>
            <div className="pl-filter-item">
              <label>{t("机队", "Fleet")}</label>
              <select
                className="pl-select"
                value={fleet}
                onChange={(e) => setFleet(e.target.value)}
              >
                {FLEETS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <div className="pl-filter-item">
              <label>{t("时间窗口", "Time Window")}</label>
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
              <span className="pl-stat-label">{t("高风险", "High-Risk")}</span>
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
              "搜索员工ID、姓名、运营单位...",
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
          <button className="pl-export-btn">
            {t("导出", "Export")}
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="pl-table-wrapper">
        <table className="pl-table">
          <thead>
            <tr>
              <th className="pl-th-check">
                <input type="checkbox" />
              </th>
              <th>{t("员工ID", "Employee ID")}</th>
              <th>{t("姓名", "Name")}</th>
              <th>{t("运营单位", "Operating Unit")}</th>
              <th>{t("综合风险等级", "Composite Risk Level")}</th>
              <th>{t("主要人为因素标签", "Main Human Factor Tags")}</th>
              <th>{t("相关高风险航班", "Related High-Risk Flights")}</th>
              <th>{t("操作", "Actions")}</th>
            </tr>
          </thead>
          <tbody>
            {pageData.map((person) => (
              <tr
                key={person.id}
                className={person.riskLevel === "High" ? "pl-row-high" : ""}
              >
                <td className="pl-td-check">
                  <input type="checkbox" />
                </td>
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
                <td>
                  <div className="pl-actions-cell">
                    <button className="pl-action-link">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      {t("查看人员", "View Person")}
                    </button>
                    <button className="pl-action-link">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
                      </svg>
                      {t("查看相关航班", "View Related Flights")}
                    </button>
                  </div>
                </td>
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
