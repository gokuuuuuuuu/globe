// @ts-nocheck
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../i18n/useLanguage";
import "./AircraftListPage.css";

// Mock aircraft data - using real aircraftNumber values from flightData
const MOCK_AIRCRAFT = [
  {
    id: "ac-1",
    tailNumber: "B-6716",
    type: "B737-800",
    age: 8.2,
    totalHours: 24500,
    status: "适航",
    riskLevel: "高",
    riskScore: 78,
    highRiskFlights: 5,
  },
  {
    id: "ac-2",
    tailNumber: "B-6011",
    type: "A320-214",
    age: 5.1,
    totalHours: 18200,
    status: "适航",
    riskLevel: "中",
    riskScore: 52,
    highRiskFlights: 2,
  },
  {
    id: "ac-3",
    tailNumber: "B-30FF",
    type: "B777-300ER",
    age: 12.5,
    totalHours: 42100,
    status: "适航",
    riskLevel: "高",
    riskScore: 85,
    highRiskFlights: 7,
  },
  {
    id: "ac-4",
    tailNumber: "B-2291",
    type: "A350-900",
    age: 2.3,
    totalHours: 8900,
    status: "适航",
    riskLevel: "低",
    riskScore: 22,
    highRiskFlights: 0,
  },
  {
    id: "ac-5",
    tailNumber: "B-2292",
    type: "B737-800",
    age: 10.8,
    totalHours: 35600,
    status: "限制",
    riskLevel: "高",
    riskScore: 91,
    highRiskFlights: 8,
  },
  {
    id: "ac-6",
    tailNumber: "B-30FE",
    type: "A320-214",
    age: 6.4,
    totalHours: 21300,
    status: "适航",
    riskLevel: "中",
    riskScore: 48,
    highRiskFlights: 1,
  },
  {
    id: "ac-7",
    tailNumber: "B-9970",
    type: "B737-800",
    age: 9.1,
    totalHours: 30200,
    status: "适航",
    riskLevel: "中",
    riskScore: 55,
    highRiskFlights: 3,
  },
  {
    id: "ac-8",
    tailNumber: "B-1635",
    type: "A320-214",
    age: 3.7,
    totalHours: 12400,
    status: "适航",
    riskLevel: "低",
    riskScore: 18,
    highRiskFlights: 0,
  },
  {
    id: "ac-9",
    tailNumber: "B-325T",
    type: "B777-300ER",
    age: 14.2,
    totalHours: 48700,
    status: "限制",
    riskLevel: "高",
    riskScore: 88,
    highRiskFlights: 6,
  },
  {
    id: "ac-10",
    tailNumber: "B-6346",
    type: "A350-900",
    age: 1.5,
    totalHours: 5200,
    status: "适航",
    riskLevel: "低",
    riskScore: 15,
    highRiskFlights: 0,
  },
  {
    id: "ac-11",
    tailNumber: "B-30C3",
    type: "B737-800",
    age: 7.6,
    totalHours: 26800,
    status: "适航",
    riskLevel: "中",
    riskScore: 45,
    highRiskFlights: 2,
  },
  {
    id: "ac-12",
    tailNumber: "B-6472",
    type: "A320-214",
    age: 4.9,
    totalHours: 16700,
    status: "适航",
    riskLevel: "低",
    riskScore: 28,
    highRiskFlights: 1,
  },
];

function riskBadgeClass(level: string) {
  if (level === "高") return "acl-risk-high";
  if (level === "中") return "acl-risk-medium";
  return "acl-risk-low";
}

function statusClass(status: string) {
  return status === "限制" ? "acl-status-restricted" : "acl-status-ok";
}

const PAGE_SIZE = 15;

export function AircraftListPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!search.trim()) return MOCK_AIRCRAFT;
    const q = search.toLowerCase();
    return MOCK_AIRCRAFT.filter(
      (a) =>
        a.tailNumber.toLowerCase().includes(q) ||
        a.type.toLowerCase().includes(q),
    );
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="acl-root">
      <div className="acl-breadcrumb">
        <span style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
          {t("工作台", "Dashboard")}
        </span>
        <span className="acl-breadcrumb-sep">&gt;</span>
        <span
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/aircraft-topic/aircraft-list")}
        >
          {t("机", "Aircraft")}
        </span>
        <span className="acl-breadcrumb-sep">&gt;</span>
        <span className="acl-breadcrumb-active">
          {t("飞机列表", "Aircraft List")}
        </span>
      </div>

      <div className="acl-page-header">
        <h1>{t("飞机列表", "Aircraft List")}</h1>
        <span className="acl-count">
          {filtered.length} {t("架", "aircraft")}
        </span>
      </div>

      <div className="acl-filters">
        <input
          className="acl-search"
          placeholder={t("搜索机号或机型...", "Search tail number or type...")}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <div className="acl-table-wrapper">
        <table className="acl-table">
          <thead>
            <tr>
              <th>{t("机号", "Tail Number")}</th>
              <th>{t("机型", "Type")}</th>
              <th>{t("机龄(年)", "Age(yr)")}</th>
              <th>{t("总飞行小时", "Total Hours")}</th>
              <th>{t("适航状态", "Status")}</th>
              <th>{t("风险等级", "Risk Level")}</th>
              <th>{t("风险评分", "Risk Score")}</th>
              <th>{t("高风险航班数", "High-Risk Flights")}</th>
              <th>{t("操作", "Actions")}</th>
            </tr>
          </thead>
          <tbody>
            {pageData.map((ac) => (
              <tr
                key={ac.id}
                style={{ cursor: "pointer" }}
                onClick={() =>
                  navigate(
                    `/aircraft-topic/aircraft-detail?tail=${ac.tailNumber}`,
                  )
                }
              >
                <td className="acl-td-tail">{ac.tailNumber}</td>
                <td>{ac.type}</td>
                <td>{ac.age}</td>
                <td>{ac.totalHours.toLocaleString()}</td>
                <td>
                  <span className={statusClass(ac.status)}>{ac.status}</span>
                </td>
                <td>
                  <span
                    className={`acl-risk-badge ${riskBadgeClass(ac.riskLevel)}`}
                  >
                    {ac.riskLevel}
                  </span>
                </td>
                <td>{ac.riskScore}</td>
                <td>{ac.highRiskFlights}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  <button
                    className="acl-action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(
                        `/risk-monitoring/flights?aircraft=${ac.tailNumber}`,
                      );
                    }}
                  >
                    {t("查看相关航班", "View Flights")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="acl-pagination">
        <span>
          {filtered.length} {t("条结果", "results")} | {t("第", "Page")} {page}{" "}
          / {totalPages}
        </span>
        <div className="acl-page-btns">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
            &lsaquo;
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            &rsaquo;
          </button>
        </div>
      </div>
    </div>
  );
}
