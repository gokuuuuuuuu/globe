import { useState, useMemo } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useLanguage } from "../i18n/useLanguage";
import { useAppStore } from "../store/useAppStore";
import "./WorkOrderListPage.css";

// ===== Types =====

type RiskLevel = "high" | "medium" | "low" | "negligible";
type WOStatus = "open" | "in-progress" | "closed";
type ObjectType = "physical-asset" | "process" | "system";
type Department = "it-security" | "operations" | "compliance";

interface WorkOrder {
  id: string;
  objectName: string;
  objectId: string;
  riskTitle: string;
  riskLevel: RiskLevel;
  riskDesc: string;
  status: WOStatus;
  department: Department;
  updatedTime: string;
  objectType: ObjectType;
}

// ===== Mock Data =====

const WORK_ORDERS: WorkOrder[] = [
  {
    id: "ARV-WO-2023-001",
    objectName: "Main Server Room",
    objectId: "ARV-SR-01",
    riskTitle: "Unauthorized Access Vulnerability",
    riskLevel: "high",
    riskDesc: "Short description for unrestricted audience access...",
    status: "in-progress",
    department: "it-security",
    updatedTime: "2023-08-28 09:15",
    objectType: "physical-asset",
  },
  {
    id: "ARV-WO-2023-002",
    objectName: "Main Server Room",
    objectId: "ARV-SR-01",
    riskTitle: "Unauthorized Access Vulnerability",
    riskLevel: "medium",
    riskDesc: "Short description is with asorce emir an...",
    status: "open",
    department: "it-security",
    updatedTime: "2023-08-28 09:15",
    objectType: "physical-asset",
  },
  {
    id: "ARV-WO-2023-003",
    objectName: "Main Server Room",
    objectId: "ARV-SR-01",
    riskTitle: "Channel Desemation",
    riskLevel: "medium",
    riskDesc: "Short description is with asorage to eac...",
    status: "open",
    department: "it-security",
    updatedTime: "2023-08-28 09:15",
    objectType: "process",
  },
  {
    id: "ARV-WO-2023-004",
    objectName: "Main Server Room",
    objectId: "ARV-SR-01",
    riskTitle: "Unauthorized Access Vulnerability",
    riskLevel: "low",
    riskDesc: "The arrorware contists such enterprise ane...",
    status: "open",
    department: "it-security",
    updatedTime: "2023-08-28 09:15",
    objectType: "physical-asset",
  },
  {
    id: "ARV-WO-2023-005",
    objectName: "Main Server Room",
    objectId: "ARV-SR-01",
    riskTitle: "Unauthorized Access Vulnerability",
    riskLevel: "low",
    riskDesc: "The arrorware poved to ruob rescription; on...",
    status: "closed",
    department: "it-security",
    updatedTime: "2023-08-28 09:15",
    objectType: "physical-asset",
  },
  {
    id: "ARV-WO-2023-006",
    objectName: "Main Server Room",
    objectId: "ARV-SR-01",
    riskTitle: "Channel Desemation",
    riskLevel: "low",
    riskDesc: "The arrorware coetlets vaoh rescription doe...",
    status: "closed",
    department: "it-security",
    updatedTime: "2023-08-28 09:15",
    objectType: "system",
  },
  {
    id: "ARV-WO-2023-007",
    objectName: "Main Server Room",
    objectId: "ARV-SR-01",
    riskTitle: "Unauthorized Access",
    riskLevel: "negligible",
    riskDesc: "",
    status: "closed",
    department: "it-security",
    updatedTime: "2023-08-28 09:15",
    objectType: "physical-asset",
  },
  {
    id: "ARV-WO-2023-008",
    objectName: "Main Server Room",
    objectId: "ARV-SR-01",
    riskTitle: "Unauthorized Access Process",
    riskLevel: "high",
    riskDesc: "1 Unauthorized access vulnerability most...",
    status: "closed",
    department: "it-security",
    updatedTime: "2023-08-28 09:15",
    objectType: "process",
  },
  {
    id: "ARV-WO-2023-009",
    objectName: "Main Server Room",
    objectId: "ARV-SR-01",
    riskTitle: "Processmity",
    riskLevel: "medium",
    riskDesc: "",
    status: "closed",
    department: "it-security",
    updatedTime: "2023-08-28 09:15",
    objectType: "process",
  },
  {
    id: "ARV-WO-2023-010",
    objectName: "Main Server Room",
    objectId: "ARV-SR-01",
    riskTitle: "Unauthorized Access Vulnerability",
    riskLevel: "negligible",
    riskDesc: "Unauthorized access vulnerability ...",
    status: "closed",
    department: "it-security",
    updatedTime: "2023-08-28 09:15",
    objectType: "system",
  },
];

const PAGE_SIZE = 10;

// ===== Component =====

export function WorkOrderListPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const fromHome = (location.state as { from?: string })?.from === "home";

  // Close workflow (shared store + local loading)
  const { closedWorkOrderIds, closeWorkOrder } = useAppStore();
  const closedIds = closedWorkOrderIds;
  const [closingId, setClosingId] = useState<string | null>(null);
  const handleCloseWO = (id: string) => {
    setClosingId(id);
    setTimeout(() => {
      closeWorkOrder(id);
      setClosingId(null);
    }, 500);
  };

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [objectTypeFilter, setObjectTypeFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [riskToggles, setRiskToggles] = useState<Record<RiskLevel, boolean>>({
    high: true,
    medium: true,
    low: true,
    negligible: true,
  });
  const [search, setSearch] = useState("");
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
  const [sortField, setSortField] = useState<"id" | "updatedTime">(
    "updatedTime",
  );
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Translation helpers
  const tRiskLevel = (level: RiskLevel) => {
    const map: Record<RiskLevel, [string, string]> = {
      high: ["高", "High"],
      medium: ["中", "Medium"],
      low: ["低", "Low"],
      negligible: ["可忽略", "Negligible"],
    };
    return t(map[level][0], map[level][1]);
  };

  const tStatus = (status: WOStatus) => {
    const map: Record<WOStatus, [string, string]> = {
      open: ["待处理", "Open"],
      "in-progress": ["处理中", "In Progress"],
      closed: ["已关闭", "Closed"],
    };
    return t(map[status][0], map[status][1]);
  };

  const tObjectType = (type: ObjectType | "all") => {
    const map: Record<string, [string, string]> = {
      all: ["全部", "All"],
      "physical-asset": ["实体资产", "Physical Asset"],
      process: ["流程", "Process"],
      system: ["系统", "System"],
    };
    return t(map[type][0], map[type][1]);
  };

  const tDept = (dept: Department | "all") => {
    const map: Record<string, [string, string]> = {
      all: ["全部", "All"],
      "it-security": ["IT 安全", "IT Security"],
      operations: ["运营", "Operations"],
      compliance: ["合规", "Compliance"],
    };
    return t(map[dept][0], map[dept][1]);
  };

  const tRiskTitle = (title: string) => {
    const map: Record<string, string> = {
      "Unauthorized Access Vulnerability": "未授权访问漏洞",
      "Channel Desemation": "通道降级",
      "Unauthorized Access": "未授权访问",
      "Unauthorized Access Process": "未授权访问流程",
      Processmity: "流程接近性",
    };
    return t(map[title] || title, title);
  };

  // Toggle risk level filter
  const toggleRisk = (level: RiskLevel) => {
    setRiskToggles((prev) => ({ ...prev, [level]: !prev[level] }));
    setPage(1);
  };

  // Sort handler
  const handleSort = (field: "id" | "updatedTime") => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
    setPage(1);
  };

  // Filtered & sorted data
  const filtered = useMemo(() => {
    const data = WORK_ORDERS.filter((wo) => {
      if (statusFilter !== "all" && wo.status !== statusFilter) return false;
      if (objectTypeFilter !== "all" && wo.objectType !== objectTypeFilter)
        return false;
      if (deptFilter !== "all" && wo.department !== deptFilter) return false;
      if (!riskToggles[wo.riskLevel]) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !wo.id.toLowerCase().includes(q) &&
          !wo.objectName.toLowerCase().includes(q) &&
          !wo.riskTitle.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });

    data.sort((a, b) => {
      const va = sortField === "id" ? a.id : a.updatedTime;
      const vb = sortField === "id" ? b.id : b.updatedTime;
      const cmp = va.localeCompare(vb);
      return sortDir === "asc" ? cmp : -cmp;
    });

    return data;
  }, [
    statusFilter,
    objectTypeFilter,
    deptFilter,
    riskToggles,
    search,
    sortField,
    sortDir,
  ]);

  const totalCount = 250; // Mock total
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const startIdx = (page - 1) * PAGE_SIZE + 1;
  const endIdx = Math.min(page * PAGE_SIZE, filtered.length);

  return (
    <div className="wo-root">
      {/* Back button */}
      {fromHome && (
        <div style={{ padding: "8px 24px 0" }}>
          <button
            style={{
              background: "rgba(71,85,105,0.5)",
              border: "1px solid rgba(148,163,184,0.2)",
              color: "#e2e8f0",
              borderRadius: 6,
              padding: "4px 14px",
              cursor: "pointer",
              fontSize: 13,
            }}
            onClick={() => navigate(-1)}
          >
            {t("返回", "Back")}
          </button>
        </div>
      )}

      {/* Page header */}
      <div className="wo-page-header">
        <h1 className="wo-page-title">{t("工单列表", "Work Order List")}</h1>
      </div>

      {/* Filter bar */}
      <div className="wo-filter-bar">
        <div className="wo-filter-group">
          <span className="wo-filter-label">
            {t("工单状态", "Work Order Status")}
          </span>
          <select
            className="wo-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">{t("全部", "All")}</option>
            <option value="open">{t("待处理", "Open")}</option>
            <option value="in-progress">{t("处理中", "In Progress")}</option>
            <option value="closed">{t("已关闭", "Closed")}</option>
          </select>
        </div>

        <div className="wo-filter-group">
          <span className="wo-filter-label">
            {t("对象类型", "Object Type")}
          </span>
          <select
            className="wo-select"
            value={objectTypeFilter}
            onChange={(e) => {
              setObjectTypeFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">{tObjectType("all")}</option>
            <option value="physical-asset">
              {tObjectType("physical-asset")}
            </option>
            <option value="process">{tObjectType("process")}</option>
            <option value="system">{tObjectType("system")}</option>
          </select>
        </div>

        <div className="wo-filter-group">
          <span className="wo-filter-label">{t("风险等级", "Risk Level")}</span>
          <div className="wo-risk-toggles">
            {(["high", "medium", "low", "negligible"] as RiskLevel[]).map(
              (level) => (
                <button
                  key={level}
                  className={`wo-risk-toggle ${level}${riskToggles[level] ? "" : " inactive"}`}
                  onClick={() => toggleRisk(level)}
                >
                  {tRiskLevel(level)}
                </button>
              ),
            )}
          </div>
        </div>

        <div className="wo-filter-group">
          <span className="wo-filter-label">
            {t("责任部门", "Responsible Department")}
          </span>
          <select
            className="wo-select"
            value={deptFilter}
            onChange={(e) => {
              setDeptFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">{tDept("all")}</option>
            <option value="it-security">{tDept("it-security")}</option>
            <option value="operations">{tDept("operations")}</option>
            <option value="compliance">{tDept("compliance")}</option>
          </select>
        </div>

        <div className="wo-search-wrapper">
          <span className="wo-search-icon">&#128269;</span>
          <input
            className="wo-search"
            type="text"
            placeholder={t("搜索...", "Search...")}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {/* <button  className="wo-create-btn">
          {t("创建工单", "Create Work Order")}
        </button> */}
      </div>

      {/* Table */}
      <div className="wo-table-wrapper">
        <table className="wo-table">
          <thead>
            <tr>
              <th>{t("工单编号", "Work Order ID")}</th>
              <th>{t("对象", "Object")}</th>
              <th>{t("风险摘要", "Risk Summary")}</th>
              <th>{t("当前状态", "Current Status")}</th>
              <th>{t("责任部门", "Responsible Department")}</th>
              <th>{t("更新时间", "Updated Time")}</th>
              <th>{t("操作", "Actions")}</th>
            </tr>
          </thead>
          <tbody>
            {pageData.map((wo) => (
              <tr key={wo.id}>
                <td>
                  <span className="wo-id">{wo.id}</span>
                </td>
                <td>
                  <div className="wo-object">
                    {t("主服务器机房", wo.objectName)}
                  </div>
                  <div className="wo-object-id">({wo.objectId})</div>
                </td>
                <td>
                  <div className="wo-risk-summary">
                    <span className="wo-risk-title">
                      {tRiskTitle(wo.riskTitle)}
                    </span>
                    <div className="wo-risk-row">
                      <span className={`wo-risk-badge ${wo.riskLevel}`}>
                        {tRiskLevel(wo.riskLevel)}
                      </span>
                      {wo.riskDesc && (
                        <span className="wo-risk-desc">{wo.riskDesc}</span>
                      )}
                    </div>
                  </div>
                </td>
                <td>
                  {closingId === wo.id ? (
                    <span className="wo-status closing">
                      {t("关闭中...", "Closing...")}
                    </span>
                  ) : (
                    <span
                      className={`wo-status ${closedIds.has(wo.id) ? "closed" : wo.status}`}
                    >
                      {closedIds.has(wo.id)
                        ? tStatus("closed")
                        : tStatus(wo.status)}
                    </span>
                  )}
                </td>
                <td>
                  <span className="wo-dept">{tDept(wo.department)}</span>
                </td>
                <td>
                  <span className="wo-time">{wo.updatedTime}</span>
                </td>
                <td>
                  <div className="wo-actions">
                    <button
                      className="wo-action-btn view"
                      onClick={() =>
                        navigate(`/governance/work-order-detail?id=${wo.id}`)
                      }
                    >
                      &#128196;&nbsp;{t("查看工单", "View Work Order")}
                    </button>
                    {/* <button className="wo-action-btn process">
                      &#8599;&nbsp;{t("继续处理", "Continue Processing")}
                    </button> */}
                    <button
                      className="wo-action-btn close-wo"
                      disabled={closedIds.has(wo.id) || closingId === wo.id}
                      onClick={() => handleCloseWO(wo.id)}
                    >
                      {closingId === wo.id ? (
                        t("关闭中...", "Closing...")
                      ) : closedIds.has(wo.id) ? (
                        t("已关闭", "Closed")
                      ) : (
                        <>
                          {"\u2715"}&nbsp;{t("关闭", "Close")}
                        </>
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="wo-pagination">
        <span className="wo-page-info">
          {startIdx}-{endIdx} of {totalCount}
        </span>
        <button
          className="wo-page-btn"
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
        >
          &lsaquo;
        </button>
        <button
          className="wo-page-btn"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          &rsaquo;
        </button>
      </div>
    </div>
  );
}
