import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "../i18n/useLanguage";
import "./HistoricalFlightsPage.css";

type RiskLevel = "High" | "Medium" | "Low" | "Minimal";
type SortColumn = "flightNumber" | "riskLevel" | "mainRisk";
type SortDirection = "asc" | "desc";
type TimeFilter = "lastMonth" | "lastQuarter" | "lastYear" | "custom";

interface FlightRecord {
  id: number;
  flightTime: string;
  flightNumber: string;
  riskLevel: RiskLevel;
  mainRisk: string;
  conclusion: string;
}

const MOCK_DATA: FlightRecord[] = [
  {
    id: 1,
    flightTime: "2024-05-15 14:30 - 17:00",
    flightNumber: "AA123",
    riskLevel: "High",
    mainRisk: "Engine #2 Vibration",
    conclusion: "Completed - Critical issues found",
  },
  {
    id: 2,
    flightTime: "2024-05-14 09:00 - 11:30",
    flightNumber: "UA456",
    riskLevel: "Medium",
    mainRisk: "Landing Gear Issue",
    conclusion: "Under Review",
  },
  {
    id: 3,
    flightTime: "2024-05-12 18:15 - 20:45",
    flightNumber: "DL789",
    riskLevel: "Low",
    mainRisk: "Fuel System Alert",
    conclusion: "Pending Review",
  },
  {
    id: 4,
    flightTime: "2024-05-10 11:00 - 13:30",
    flightNumber: "SW234",
    riskLevel: "Minimal",
    mainRisk: "None",
    conclusion: "Completed - Routine",
  },
  {
    id: 5,
    flightTime: "2024-05-15 14:30 - 17:00",
    flightNumber: "AA123",
    riskLevel: "Medium",
    mainRisk: "Engine #2 Vibration",
    conclusion: "Completed - Routine",
  },
  {
    id: 6,
    flightTime: "2024-05-12 09:00 - 11:30",
    flightNumber: "UA456",
    riskLevel: "Medium",
    mainRisk: "Fuel System Alert",
    conclusion: "Completed - Routine",
  },
  {
    id: 7,
    flightTime: "2024-05-12 18:15 - 20:45",
    flightNumber: "DL789",
    riskLevel: "Low",
    mainRisk: "Fuel System Alert",
    conclusion: "Pending Review",
  },
  {
    id: 8,
    flightTime: "2024-05-12 09:00 - 17:00",
    flightNumber: "AA123",
    riskLevel: "Medium",
    mainRisk: "Landing Gear Issue",
    conclusion: "Completed - Routine",
  },
  {
    id: 9,
    flightTime: "2024-05-14 10:00 - 11:30",
    flightNumber: "UA456",
    riskLevel: "Medium",
    mainRisk: "Engine #2 Vibration",
    conclusion: "Pending Review",
  },
  {
    id: 10,
    flightTime: "2024-05-12 18:15 - 20:45",
    flightNumber: "DL789",
    riskLevel: "Low",
    mainRisk: "Fuel System Alert",
    conclusion: "Completed - Routine",
  },
  {
    id: 11,
    flightTime: "2024-05-10 11:00 - 13:30",
    flightNumber: "SW234",
    riskLevel: "Minimal",
    mainRisk: "Engine #2 Vibration",
    conclusion: "Completed - Routine",
  },
  {
    id: 12,
    flightTime: "2024-05-10 11:00 - 13:30",
    flightNumber: "SW234",
    riskLevel: "Minimal",
    mainRisk: "Landing Gear Issue",
    conclusion: "Completed - Critical issues found",
  },
];

const RISK_ORDER: Record<RiskLevel, number> = {
  High: 3,
  Medium: 2,
  Low: 1,
  Minimal: 0,
};
const PAGE_SIZE = 25;
const TOTAL_RECORDS = 150;

export function HistoricalFlightsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [startDate, setStartDate] = useState("2023-01-01");
  const [endDate, setEndDate] = useState("2024-05-31");
  const [activeFilter, setActiveFilter] = useState<TimeFilter>("custom");
  const [searchText, setSearchText] = useState("");
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const setCurrentPage = (pageOrFn: number | ((prev: number) => number)) => {
    const newPage =
      typeof pageOrFn === "function" ? pageOrFn(currentPage) : pageOrFn;
    const sp = new URLSearchParams(searchParams);
    if (newPage <= 1) {
      sp.delete("page");
    } else {
      sp.set("page", String(newPage));
    }
    setSearchParams(sp, { replace: true });
  };
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const handleQuickFilter = (filter: TimeFilter) => {
    setActiveFilter(filter);
    const now = new Date("2024-05-31");
    if (filter === "lastMonth") {
      const start = new Date(now);
      start.setMonth(start.getMonth() - 1);
      setStartDate(start.toISOString().slice(0, 10));
      setEndDate(now.toISOString().slice(0, 10));
    } else if (filter === "lastQuarter") {
      const start = new Date(now);
      start.setMonth(start.getMonth() - 3);
      setStartDate(start.toISOString().slice(0, 10));
      setEndDate(now.toISOString().slice(0, 10));
    } else if (filter === "lastYear") {
      const start = new Date(now);
      start.setFullYear(start.getFullYear() - 1);
      setStartDate(start.toISOString().slice(0, 10));
      setEndDate(now.toISOString().slice(0, 10));
    }
  };

  const handleSort = (col: SortColumn) => {
    if (sortColumn === col) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(col);
      setSortDirection("asc");
    }
  };

  const filteredData = useMemo(() => {
    let data = [...MOCK_DATA];
    if (searchText.trim()) {
      const q = searchText.trim().toUpperCase();
      data = data.filter((r) => r.flightNumber.toUpperCase().includes(q));
    }
    if (sortColumn) {
      data.sort((a, b) => {
        let cmp = 0;
        if (sortColumn === "flightNumber") {
          cmp = a.flightNumber.localeCompare(b.flightNumber);
        } else if (sortColumn === "riskLevel") {
          cmp = RISK_ORDER[a.riskLevel] - RISK_ORDER[b.riskLevel];
        } else if (sortColumn === "mainRisk") {
          cmp = a.mainRisk.localeCompare(b.mainRisk);
        }
        return sortDirection === "asc" ? cmp : -cmp;
      });
    }
    return data;
  }, [searchText, sortColumn, sortDirection]);

  const totalPages = Math.ceil(TOTAL_RECORDS / PAGE_SIZE);
  const pageStart = (currentPage - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(currentPage * PAGE_SIZE, TOTAL_RECORDS);

  const renderSortIcon = (col: SortColumn) => (
    <span className="hf-sort-icon">
      <span
        className={
          sortColumn === col && sortDirection === "asc" ? "active" : ""
        }
      >
        &#9650;
      </span>
      <span
        className={
          sortColumn === col && sortDirection === "desc" ? "active" : ""
        }
      >
        &#9660;
      </span>
    </span>
  );

  const riskBadgeClass = (level: RiskLevel) => {
    const map: Record<RiskLevel, string> = {
      High: "hf-risk-high",
      Medium: "hf-risk-medium",
      Low: "hf-risk-low",
      Minimal: "hf-risk-minimal",
    };
    return `hf-risk-badge ${map[level]}`;
  };

  const riskLabel = (level: RiskLevel) => {
    const labels: Record<RiskLevel, string> = {
      High: t("高", "High"),
      Medium: t("中", "Medium"),
      Low: t("低", "Low"),
      Minimal: t("最低", "Minimal"),
    };
    return labels[level];
  };

  const conclusionText = (c: string) => {
    const map: Record<string, string> = {
      "Completed - Critical issues found": t(
        "已完成 - 发现关键问题",
        "Completed - Critical issues found",
      ),
      "Under Review": t("审核中", "Under Review"),
      "Pending Review": t("待审核", "Pending Review"),
      "Completed - Routine": t("已完成 - 例行", "Completed - Routine"),
    };
    return map[c] ?? c;
  };

  const mainRiskText = (r: string) => {
    const map: Record<string, string> = {
      "Engine #2 Vibration": t("2号发动机振动", "Engine #2 Vibration"),
      "Landing Gear Issue": t("起落架问题", "Landing Gear Issue"),
      "Fuel System Alert": t("燃油系统警报", "Fuel System Alert"),
      None: t("无", "None"),
    };
    return map[r] ?? r;
  };

  return (
    <div className="hf-page">
      {/* Header */}
      <div className="hf-header">
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
        <h1 className="hf-title">
          {t("历史航班", "Historical Flights")}: [Object ID - P18] /{" "}
          {t("机型", "Unit")}: 737-800
        </h1>
        <button className="hf-dropdown-btn">
          {t("历史航班", "Historical Flights")}
          <span className="hf-chevron">&#9662;</span>
        </button>
      </div>

      {/* Top Row: Summary + Filters */}
      <div className="hf-top-row">
        {/* Object Summary */}
        <div className="hf-summary-section">
          <h2 className="hf-section-title">
            {t("对象概要", "Object Summary")}
          </h2>
          <div className="hf-summary-boxes">
            <div className="hf-summary-box">
              <span className="hf-summary-label">
                {t("飞机型号", "Aircraft Model")}
              </span>
              <span className="hf-summary-value">Boeing 737-800</span>
            </div>
            <div className="hf-summary-box">
              <span className="hf-summary-label">
                {t("序列号", "Serial Number")}
              </span>
              <span className="hf-summary-value">SN12345</span>
            </div>
            <div className="hf-summary-box">
              <span className="hf-summary-label">
                {t("总飞行时数", "Total Flight Hours")}
              </span>
              <span className="hf-summary-value">15,400h</span>
            </div>
            <div className="hf-summary-box">
              <span className="hf-summary-label">
                {t("上次维护日期", "Last Maintenance Date")}
              </span>
              <span className="hf-summary-value">2024-03-15</span>
            </div>
            <div className="hf-summary-box">
              <span className="hf-summary-label">
                {t("整体状态", "Overall Status")}
              </span>
              <span className="hf-summary-value hf-status-operational">
                {t("运行中", "Operational")}
              </span>
            </div>
          </div>
        </div>

        {/* Time Filters */}
        <div className="hf-filter-section">
          <h2 className="hf-section-title">{t("时间筛选", "Time Filters")}</h2>
          <div className="hf-filter-row">
            <div className="hf-input-group">
              <span className="hf-input-label">
                {t("开始日期", "Start Date")}
              </span>
              <input
                type="date"
                className="hf-date-input"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setActiveFilter("custom");
                }}
              />
            </div>
            <div className="hf-input-group">
              <span className="hf-input-label">
                {t("结束日期", "End Date")}
              </span>
              <input
                type="date"
                className="hf-date-input"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setActiveFilter("custom");
                }}
              />
            </div>
            <div className="hf-quick-filters">
              <button
                className={`hf-quick-btn ${activeFilter === "lastMonth" ? "active" : ""}`}
                onClick={() => handleQuickFilter("lastMonth")}
              >
                {t("近一月", "Last Month")}
              </button>
              <button
                className={`hf-quick-btn ${activeFilter === "lastQuarter" ? "active" : ""}`}
                onClick={() => handleQuickFilter("lastQuarter")}
              >
                {t("近一季", "Last Quarter")}
              </button>
              <button
                className={`hf-quick-btn ${activeFilter === "lastYear" ? "active" : ""}`}
                onClick={() => handleQuickFilter("lastYear")}
              >
                {t("近一年", "Last Year")}
              </button>
              <button
                className={`hf-quick-btn ${activeFilter === "custom" ? "active" : ""}`}
                onClick={() => setActiveFilter("custom")}
              >
                {t("自定义", "Custom")}
              </button>
            </div>
            <button className="hf-apply-btn">
              {t("应用筛选", "Apply Filters")}
            </button>
          </div>
          <div className="hf-search-row">
            <input
              type="text"
              className="hf-search-input"
              placeholder={t("搜索航班号...", "Search Flight Number...")}
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="hf-table-wrapper">
        <div className="hf-table-scroll">
          <table className="hf-table">
            <thead>
              <tr>
                <th style={{ width: 40 }} />
                <th>{t("航班时间", "Flight Time")}</th>
                <th>{t("航班号", "Flight Number")}</th>
                <th>{t("风险等级", "Risk Level")}</th>
                <th>{t("主要重大风险", "Main Major Risk")}</th>
                <th>{t("当前结论", "Current Conclusion")}</th>
                <th>{t("操作", "Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row) => (
                <tr key={row.id}>
                  <td />
                  <td>{row.flightTime}</td>
                  <td>{row.flightNumber}</td>
                  <td>
                    <span className={riskBadgeClass(row.riskLevel)}>
                      {riskLabel(row.riskLevel)}
                    </span>
                  </td>
                  <td>{mainRiskText(row.mainRisk)}</td>
                  <td>{conclusionText(row.conclusion)}</td>
                  <td>
                    <button className="hf-view-btn">
                      {t("查看航班", "View Flight")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="hf-pagination">
        <span className="hf-page-info">
          {pageStart}-{pageEnd} {t("共", "of")} {TOTAL_RECORDS}
        </span>
        <div className="hf-page-buttons">
          <button
            className="hf-page-btn"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            &lt;
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p <= 4 || p === totalPages)
            .map((p) => (
              <button
                key={p}
                className={`hf-page-btn ${currentPage === p ? "active" : ""}`}
                onClick={() => setCurrentPage(p)}
              >
                {p}
              </button>
            ))}
          <button
            className="hf-page-btn"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            &gt;
          </button>
        </div>
      </div>
    </div>
  );
}
