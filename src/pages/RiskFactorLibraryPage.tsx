import { useState } from "react";
import { useLanguage } from "../i18n/useLanguage";
import "./RiskFactorLibraryPage.css";

// ===== Types =====

type RiskLevel = "critical" | "high" | "medium" | "low";

interface Factor {
  id: string;
  name: string;
  category: string;
  riskLevel: RiskLevel;
  rulesCount: number;
  traceableSource: string;
  lastUpdate: string;
  explainScore: number;
}

// ===== Mock Data =====

const FACTORS: Factor[] = [
  {
    id: "100001",
    name: "Risk Factor",
    category: "Category",
    riskLevel: "critical",
    rulesCount: 5,
    traceableSource: "-",
    lastUpdate: "2024-06-27 1:09:30",
    explainScore: 50,
  },
  {
    id: "100002",
    name: "Reality Responsive",
    category: "Category",
    riskLevel: "high",
    rulesCount: 7,
    traceableSource: "Risk Factor",
    lastUpdate: "2024-08-27 9:09:40",
    explainScore: 40,
  },
  {
    id: "100003",
    name: "Risk Factor",
    category: "Category",
    riskLevel: "medium",
    rulesCount: 1,
    traceableSource: "Risk Factor",
    lastUpdate: "2024-08-27 3:00:30",
    explainScore: 36,
  },
  {
    id: "100004",
    name: "Redorm Context",
    category: "Category",
    riskLevel: "medium",
    rulesCount: 4,
    traceableSource: "Data Source",
    lastUpdate: "2024-08-23 3:00:30",
    explainScore: 30,
  },
  {
    id: "100005",
    name: "Ressable Source",
    category: "Category",
    riskLevel: "high",
    rulesCount: 3,
    traceableSource: "Risk Factor",
    lastUpdate: "2024-08-23 0:09:30",
    explainScore: 75,
  },
  {
    id: "100007",
    name: "Enernat Budget",
    category: "Category",
    riskLevel: "medium",
    rulesCount: 1,
    traceableSource: "Risk Factor",
    lastUpdate: "2024-08-23 3:00:30",
    explainScore: 75,
  },
  {
    id: "100008",
    name: "Security Management",
    category: "Category",
    riskLevel: "low",
    rulesCount: 2,
    traceableSource: "Risk Factor",
    lastUpdate: "2024-08-20 1:00:30",
    explainScore: 62,
  },
  {
    id: "100009",
    name: "Risk Factors",
    category: "Category",
    riskLevel: "low",
    rulesCount: 2,
    traceableSource: "Risk Factor",
    lastUpdate: "2024-07-23 1:39:40",
    explainScore: 68,
  },
];

// ===== Component =====

export function RiskFactorLibraryPage() {
  const { t } = useLanguage();
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [page] = useState(1);

  const tRiskLevel = (level: RiskLevel) => {
    const map: Record<RiskLevel, [string, string]> = {
      critical: ["严重", "Critical"],
      high: ["高", "High"],
      medium: ["中", "Medium"],
      low: ["低", "Low"],
    };
    return t(map[level][0], map[level][1]);
  };

  const tFactorName = (name: string) => {
    const map: Record<string, string> = {
      "Risk Factor": "风险因子",
      "Reality Responsive": "现实响应",
      "Redorm Context": "重塑上下文",
      "Ressable Source": "可靠来源",
      "Enernat Budget": "能源预算",
      "Security Management": "安全管理",
      "Risk Factors": "风险因子集",
    };
    return t(map[name] || name, name);
  };

  const tSource = (src: string) => {
    const map: Record<string, string> = {
      "Risk Factor": "风险因子",
      "Data Source": "数据源",
    };
    if (src === "-") return "-";
    return t(map[src] || src, src);
  };

  const filtered = FACTORS.filter((f) => {
    if (riskFilter !== "all" && f.riskLevel !== riskFilter) return false;
    return true;
  });

  return (
    <div className="rfl-root">
      {/* Page header */}
      <div className="rfl-page-header">
        <h1 className="rfl-page-title">
          {t("风险因子库", "Risk Factor Library")}
        </h1>
        {/* <button className="rfl-help-btn">
          &#9432;&nbsp;{t("帮助", "Help")}
        </button> */}
      </div>

      <div className="rfl-body">
        {/* KPI row */}
        <div className="rfl-kpi-row">
          <div className="rfl-kpi-card">
            <div className="rfl-kpi-label">
              {t("因子总数", "Total Factors")}
            </div>
            <div className="rfl-kpi-value">582</div>
          </div>
          <div className="rfl-kpi-card">
            <div className="rfl-kpi-label">
              {t("新增因子", "Newly Added Factors")}
            </div>
            <div className="rfl-kpi-value">43</div>
          </div>
          <div className="rfl-kpi-card">
            <div className="rfl-kpi-label">
              {t("已修改因子", "Modified Factors")}
            </div>
            <div className="rfl-kpi-value">27</div>
          </div>
          <div className="rfl-kpi-card">
            <div className="rfl-kpi-label">
              {t("高频使用因子", "Highly Used Factors")}
            </div>
            <div className="rfl-kpi-value">10</div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="rfl-filter-bar">
          <span className="rfl-filter-label">
            {t("因子类别", "Factor Category")}
          </span>
          <select
            className="rfl-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">{t("因子类别", "Factor Category")}</option>
          </select>
          <select
            className="rfl-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">{t("状态", "Status")}</option>
          </select>
          <select
            className="rfl-select"
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
          >
            <option value="all">{t("风险等级", "Risk Level")}</option>
            <option value="critical">{t("严重", "Critical")}</option>
            <option value="high">{t("高", "High")}</option>
            <option value="medium">{t("中", "Medium")}</option>
            <option value="low">{t("低", "Low")}</option>
          </select>

          <div className="rfl-date-range">
            <span>{t("日期范围", "Date range")}</span>
            <input
              className="rfl-date-input"
              type="text"
              defaultValue="2024-01-31- 2024-11-20"
              readOnly
            />
            <button className="rfl-clear-btn">&#10005;</button>
          </div>
        </div>

        {/* Table */}
        <div className="rfl-table-card">
          <table className="rfl-table">
            <thead>
              <tr>
                <th style={{ width: 40 }} />
                <th className="sortable">
                  {t("因子编号", "Factor ID")}
                  <span className="rfl-sort-icon">⇅</span>
                </th>
                <th className="sortable">
                  {t("因子名称", "Factor Name")}
                  <span className="rfl-sort-icon">⇅</span>
                </th>
                <th className="sortable">
                  {t("类别", "Category")}
                  <span className="rfl-sort-icon">⇅</span>
                </th>
                <th className="sortable">
                  {t("风险等级", "Risk Level")}
                  <span className="rfl-sort-icon">⇅</span>
                </th>
                <th className="sortable">
                  {t("规则数", "Rules Count")}
                  <span className="rfl-sort-icon">⇅</span>
                </th>
                <th>{t("可追溯来源", "Traceable Source")}</th>
                <th>{t("最后训练更新", "Last Trainable Update")}</th>
                <th>{t("可解释性评分", "Explainability Score")}</th>
                <th>{t("操作", "Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => (
                <tr key={f.id}>
                  <td />
                  <td>{f.id}</td>
                  <td>{tFactorName(f.name)}</td>
                  <td>{t("类别", f.category)}</td>
                  <td>
                    <span className={`rfl-risk-badge ${f.riskLevel}`}>
                      <span className="rfl-risk-dot" />
                      {tRiskLevel(f.riskLevel)}
                    </span>
                  </td>
                  <td>{f.rulesCount}</td>
                  <td>{tSource(f.traceableSource)}</td>
                  <td>{f.lastUpdate}</td>
                  <td>{f.explainScore}</td>
                  <td>
                    <div className="rfl-actions">
                      <button
                        className="rfl-action-icon"
                        title={t("查看", "View")}
                      >
                        &#128065;
                      </button>
                      <button
                        className="rfl-action-icon"
                        title={t("编辑", "Edit")}
                      >
                        &#9998;
                      </button>
                      <button
                        className="rfl-action-icon"
                        title={t("删除", "Delete")}
                      >
                        &#128465;
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="rfl-pagination">
            <button className="rfl-page-btn" disabled>
              &#171;
            </button>
            <button className="rfl-page-btn" disabled>
              &lsaquo;
            </button>
            <button className="rfl-page-btn active">{page}</button>
            <button className="rfl-page-btn">&rsaquo;</button>
            <button className="rfl-page-btn">&#187;</button>
          </div>
        </div>
      </div>

      {/* Footer */}
    </div>
  );
}
