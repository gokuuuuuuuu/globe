// @ts-nocheck
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../i18n/useLanguage";
import { getPlaneList } from "../api/plane";
import "./AircraftListPage.css";

function riskBadgeClass(level: string) {
  if (level === "HIGH" || level === "高") return "acl-risk-high";
  if (level === "MEDIUM" || level === "中") return "acl-risk-medium";
  return "acl-risk-low";
}

function riskLevelLabel(level: string, t: Function) {
  if (level === "HIGH") return t("高", "High");
  if (level === "MEDIUM") return t("中", "Medium");
  return t("低", "Low");
}

const PAGE_SIZE = 15;

export function AircraftListPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  const searchTimerRef = useRef<number | null>(null);

  const fetchData = useCallback(
    async (currentPage: number, keyword: string) => {
      setLoading(true);
      try {
        const res = await getPlaneList({
          page: currentPage,
          pageSize: PAGE_SIZE,
          keyword: keyword.trim() || undefined,
        });
        setItems(res.items || []);
        setTotal(res.total || 0);
      } catch (err) {
        console.error("Failed to fetch plane list:", err);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchData(page, search);
  }, [page, fetchData]);

  // 搜索防抖
  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    searchTimerRef.current = window.setTimeout(() => {
      setPage(1);
      fetchData(1, value);
    }, 400);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

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
          {total} {t("架", "aircraft")}
        </span>
      </div>

      <div className="acl-filters">
        <input
          className="acl-search"
          placeholder={t("搜索机号或机型...", "Search tail number or type...")}
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      <div className="acl-table-wrapper">
        {loading ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 0",
              color: "#8899aa",
            }}
          >
            {t("加载中...", "Loading...")}
          </div>
        ) : (
          <table className="acl-table">
            <thead>
              <tr>
                <th>{t("机号", "Tail Number")}</th>
                <th>{t("机型", "Type")}</th>
                <th>{t("运营单位", "Operating Unit")}</th>
                <th>{t("机龄", "Age")}</th>
                <th>{t("总飞行小时", "Flight Hours")}</th>
                <th>{t("适航状态", "Airworthiness")}</th>
                <th>{t("风险等级", "Risk Level")}</th>
                <th>{t("风险评分", "Risk Score")}</th>
                <th>{t("高风险航班", "High Risk Flights")}</th>
                <th>{t("操作", "Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((ac) => (
                <tr
                  key={ac.id}
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    navigate(
                      `/aircraft-topic/aircraft-detail?tail=${ac.registration}`,
                    )
                  }
                >
                  <td className="acl-td-tail">{ac.registration}</td>
                  <td>{ac.model}</td>
                  <td>{ac.operatingUnit || "—"}</td>
                  <td>{ac.ageYears != null ? `${ac.ageYears}y` : "—"}</td>
                  <td>
                    {ac.totalFlightHours != null
                      ? ac.totalFlightHours.toLocaleString()
                      : "—"}
                  </td>
                  <td>{ac.airworthinessStatus || "—"}</td>
                  <td>
                    <span
                      className={`acl-risk-badge ${riskBadgeClass(ac.riskLevel)}`}
                    >
                      {riskLevelLabel(ac.riskLevel, t)}
                    </span>
                  </td>
                  <td>{ac.riskScore}</td>
                  <td>{ac.highRiskFlightCount ?? 0}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <button
                      className="acl-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(
                          `/risk-monitoring/flights?aircraft=${ac.registration}`,
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
        )}
      </div>

      <div className="acl-pagination">
        <span>
          {total} {t("条结果", "results")} | {t("第", "Page")} {page} /{" "}
          {totalPages}
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
