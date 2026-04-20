import { useState } from "react";
import { useLanguage } from "../i18n/useLanguage";
import "./RiskFactorLibraryPage.css";

// ===== Types =====

type Importance = "high" | "medium" | "low";
type RuleSource = "model" | "manual";

interface FactorRule {
  condition: string;
  result: string;
}

interface Factor {
  id: string;
  name: string;
  riskType: string;
  importance: Importance;
  rulesCount: number;
  ruleSource: RuleSource;
  lastUpdate: string;
  score: number;
  rules: FactorRule[];
}

// ===== Risk Types =====

const RISK_TYPES = [
  { key: "cfit", zh: "可控飞行撞地(CFIT)", en: "CFIT" },
  { key: "loc", zh: "飞行中失控(LOC-I)", en: "LOC-I" },
  { key: "re", zh: "跑道偏/冲出(RE)", en: "Runway Excursion" },
  { key: "mac", zh: "空中相撞(MAC)", en: "Mid-air Collision" },
  { key: "gcol", zh: "地面碰撞(GCOL)", en: "Ground Collision" },
  { key: "bird", zh: "鸟击", en: "Bird Strike" },
  { key: "turbulence", zh: "颠簸", en: "Turbulence" },
];

// ===== Mock Data =====

const FACTORS: Factor[] = [
  {
    id: "100001",
    name: "进近稳定性",
    riskType: "cfit",
    importance: "high",
    rulesCount: 3,
    ruleSource: "model",
    lastUpdate: "2024-06-27 01:09:30",
    score: 85,
    rules: [
      { condition: "进近高度偏差 > 航路均值 + 3 SD", result: "触发" },
      { condition: "下滑道偏差 > 1.5 dot", result: "触发" },
      { condition: "进近速度偏差 > 15 kt", result: "触发" },
    ],
  },
  {
    id: "100002",
    name: "姿态异常",
    riskType: "loc",
    importance: "high",
    rulesCount: 2,
    ruleSource: "model",
    lastUpdate: "2024-08-27 09:09:40",
    score: 78,
    rules: [
      { condition: "俯仰角 > 25° 或 < -10°", result: "触发" },
      { condition: "坡度角 > 45°", result: "触发" },
    ],
  },
  {
    id: "100003",
    name: "跑道对正偏差",
    riskType: "re",
    importance: "medium",
    rulesCount: 2,
    ruleSource: "model",
    lastUpdate: "2024-08-27 03:00:30",
    score: 62,
    rules: [
      { condition: "跑道对正偏差 > 航路均值 + 3 SD", result: "触发" },
      { condition: "接地点偏差 > 跑道长度 30%", result: "触发" },
    ],
  },
  {
    id: "100004",
    name: "间隔保持",
    riskType: "mac",
    importance: "medium",
    rulesCount: 2,
    ruleSource: "manual",
    lastUpdate: "2024-08-23 03:00:30",
    score: 55,
    rules: [
      { condition: "水平间隔 < 最低标准", result: "触发" },
      { condition: "垂直间隔 < 300m", result: "触发" },
    ],
  },
  {
    id: "100005",
    name: "地面滑行速度",
    riskType: "gcol",
    importance: "low",
    rulesCount: 1,
    ruleSource: "model",
    lastUpdate: "2024-08-23 00:09:30",
    score: 45,
    rules: [{ condition: "滑行速度 > 限制速度", result: "触发" }],
  },
  {
    id: "100006",
    name: "鸟群密度",
    riskType: "bird",
    importance: "medium",
    rulesCount: 2,
    ruleSource: "model",
    lastUpdate: "2024-08-23 03:00:30",
    score: 70,
    rules: [
      { condition: "鸟群密度 > 区域均值 + 2 SD", result: "触发" },
      { condition: "鸟击高度 < 1000ft", result: "触发" },
    ],
  },
  {
    id: "100007",
    name: "颠簸强度",
    riskType: "turbulence",
    importance: "high",
    rulesCount: 3,
    ruleSource: "model",
    lastUpdate: "2024-08-20 01:00:30",
    score: 82,
    rules: [
      { condition: "实际持续时间 > 航路均值 + 3 SD", result: "触发" },
      { condition: "垂直加速度 > 0.5g", result: "触发" },
      { condition: "EDR > 0.4", result: "触发" },
    ],
  },
  {
    id: "100008",
    name: "低高度大坡度",
    riskType: "cfit",
    importance: "medium",
    rulesCount: 2,
    ruleSource: "manual",
    lastUpdate: "2024-07-23 01:39:40",
    score: 68,
    rules: [
      { condition: "高度 < 500ft 且 坡度 > 30°", result: "触发" },
      { condition: "地形接近率 > 阈值", result: "触发" },
    ],
  },
];

// ===== Component =====

export function RiskFactorLibraryPage() {
  const { t } = useLanguage();
  const [riskTypeFilter, setRiskTypeFilter] = useState("all");
  const [nameFilter, setNameFilter] = useState("");
  const [page] = useState(1);

  // Edit modal state
  const [editingFactor, setEditingFactor] = useState<Factor | null>(null);
  const [editRules, setEditRules] = useState<FactorRule[]>([]);

  // Delete confirm state
  const [deletingFactor, setDeletingFactor] = useState<Factor | null>(null);

  const tImportance = (level: Importance) => {
    const map: Record<Importance, [string, string]> = {
      high: ["高", "High"],
      medium: ["中", "Medium"],
      low: ["低", "Low"],
    };
    return t(map[level][0], map[level][1]);
  };

  const importanceClass = (level: Importance) => {
    const map: Record<Importance, string> = {
      high: "high",
      medium: "medium",
      low: "low",
    };
    return map[level];
  };

  const tRuleSource = (src: RuleSource) => {
    if (src === "model") return t("模型输出", "Model Output");
    return t("人工定义", "Manual");
  };

  const tRiskType = (key: string) => {
    const found = RISK_TYPES.find((r) => r.key === key);
    if (!found) return key;
    return t(found.zh, found.en);
  };

  const filtered = FACTORS.filter((f) => {
    if (riskTypeFilter !== "all" && f.riskType !== riskTypeFilter) return false;
    if (nameFilter && !f.name.includes(nameFilter)) return false;
    return true;
  });

  // Open edit modal
  const handleEdit = (factor: Factor) => {
    setEditingFactor(factor);
    setEditRules(factor.rules.map((r) => ({ ...r })));
  };

  // Save edited rules
  const handleSaveRules = () => {
    if (editingFactor) {
      // In real app, update backend. Here just update local reference.
      editingFactor.rules = editRules;
      editingFactor.ruleSource = "manual";
      const now = new Date(Date.now() + 8 * 3600 * 1000);
      editingFactor.lastUpdate = now
        .toISOString()
        .replace("T", " ")
        .slice(0, 19);
    }
    setEditingFactor(null);
  };

  // Delete
  const handleDelete = (factor: Factor) => {
    setDeletingFactor(factor);
  };

  const confirmDelete = () => {
    if (deletingFactor) {
      const idx = FACTORS.indexOf(deletingFactor);
      if (idx > -1) FACTORS.splice(idx, 1);
    }
    setDeletingFactor(null);
  };

  // Edit rule handlers
  const updateRuleCondition = (index: number, value: string) => {
    setEditRules((prev) =>
      prev.map((r, i) => (i === index ? { ...r, condition: value } : r)),
    );
  };

  const updateRuleResult = (index: number, value: string) => {
    setEditRules((prev) =>
      prev.map((r, i) => (i === index ? { ...r, result: value } : r)),
    );
  };

  const addRule = () => {
    setEditRules((prev) => [...prev, { condition: "", result: "触发" }]);
  };

  const removeRule = (index: number) => {
    setEditRules((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="rfl-root">
      {/* Page header */}
      <div className="rfl-page-header">
        <h1 className="rfl-page-title">
          {t("风险因子库", "Risk Factor Library")}
        </h1>
      </div>

      <div className="rfl-body">
        {/* Filter bar */}
        <div className="rfl-filter-bar">
          <select
            className="rfl-select"
            value={riskTypeFilter}
            onChange={(e) => setRiskTypeFilter(e.target.value)}
          >
            <option value="all">{t("全部风险类型", "All Risk Types")}</option>
            {RISK_TYPES.map((rt) => (
              <option key={rt.key} value={rt.key}>
                {t(rt.zh, rt.en)}
              </option>
            ))}
          </select>
          <input
            className="rfl-input"
            type="text"
            placeholder={t("因子名称筛选", "Filter by factor name")}
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
          />
          <span className="rfl-record-count">
            {t(`共 ${filtered.length} 条记录`, `${filtered.length} records`)}
          </span>
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
                  {t("风险类型", "Risk Type")}
                  <span className="rfl-sort-icon">⇅</span>
                </th>
                <th className="sortable">
                  {t("重要度", "Importance")}
                  <span className="rfl-sort-icon">⇅</span>
                </th>
                <th className="sortable">
                  {t("规则数", "Rules Count")}
                  <span className="rfl-sort-icon">⇅</span>
                </th>
                <th>{t("规则来源", "Rule Source")}</th>
                <th>{t("最后更新", "Last Update")}</th>
                <th>{t("得分", "Score")}</th>
                <th>{t("操作", "Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => (
                <tr key={f.id}>
                  <td />
                  <td>{f.id}</td>
                  <td>{t(f.name, f.name)}</td>
                  <td>{tRiskType(f.riskType)}</td>
                  <td>
                    <span
                      className={`rfl-risk-badge ${importanceClass(f.importance)}`}
                    >
                      <span className="rfl-risk-dot" />
                      {tImportance(f.importance)}
                    </span>
                  </td>
                  <td>{f.rulesCount}</td>
                  <td>{tRuleSource(f.ruleSource)}</td>
                  <td>{f.lastUpdate}</td>
                  <td>{f.score}</td>
                  <td>
                    <div className="rfl-actions">
                      <button
                        className="rfl-action-icon"
                        title={t("编辑", "Edit")}
                        onClick={() => handleEdit(f)}
                      >
                        &#9998;
                      </button>
                      <button
                        className="rfl-action-icon"
                        title={t("删除", "Delete")}
                        onClick={() => handleDelete(f)}
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

      {/* Edit Rule Modal */}
      {editingFactor && (
        <div
          className="rfl-modal-overlay"
          onClick={() => setEditingFactor(null)}
        >
          <div className="rfl-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rfl-modal-header">
              <h3>
                {t("因子规则编辑", "Factor Rule Editor")} —{" "}
                {t(editingFactor.name, editingFactor.name)}
              </h3>
              <button
                className="rfl-modal-close"
                onClick={() => setEditingFactor(null)}
              >
                &#10005;
              </button>
            </div>
            <div className="rfl-modal-body">
              <div className="rfl-rule-label">
                {t("应用逻辑", "Applied Logic")}
              </div>
              <div className="rfl-rules-list">
                {editRules.map((rule, idx) => (
                  <div key={idx} className="rfl-rule-row">
                    <span className="rfl-rule-keyword">IF</span>
                    <input
                      className="rfl-rule-input rfl-rule-condition"
                      value={rule.condition}
                      onChange={(e) => updateRuleCondition(idx, e.target.value)}
                    />
                    <span className="rfl-rule-keyword">THEN</span>
                    <input
                      className="rfl-rule-input rfl-rule-result"
                      value={rule.result}
                      onChange={(e) => updateRuleResult(idx, e.target.value)}
                    />
                    <button
                      className="rfl-rule-remove"
                      onClick={() => removeRule(idx)}
                      title={t("删除规则", "Remove rule")}
                    >
                      &#10005;
                    </button>
                  </div>
                ))}
              </div>
              <button className="rfl-add-rule-btn" onClick={addRule}>
                + {t("添加规则", "Add Rule")}
              </button>
            </div>
            <div className="rfl-modal-footer">
              <button
                className="rfl-modal-btn rfl-modal-cancel"
                onClick={() => setEditingFactor(null)}
              >
                {t("取消", "Cancel")}
              </button>
              <button
                className="rfl-modal-btn rfl-modal-save"
                onClick={handleSaveRules}
              >
                {t("保存", "Save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deletingFactor && (
        <div
          className="rfl-modal-overlay"
          onClick={() => setDeletingFactor(null)}
        >
          <div
            className="rfl-modal rfl-modal-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rfl-modal-header">
              <h3>{t("确认删除", "Confirm Delete")}</h3>
              <button
                className="rfl-modal-close"
                onClick={() => setDeletingFactor(null)}
              >
                &#10005;
              </button>
            </div>
            <div className="rfl-modal-body">
              <p>
                {t(
                  `确定要删除因子「${deletingFactor.name}」吗？此操作不可撤销。`,
                  `Are you sure you want to delete factor "${deletingFactor.name}"? This action cannot be undone.`,
                )}
              </p>
            </div>
            <div className="rfl-modal-footer">
              <button
                className="rfl-modal-btn rfl-modal-cancel"
                onClick={() => setDeletingFactor(null)}
              >
                {t("取消", "Cancel")}
              </button>
              <button
                className="rfl-modal-btn rfl-modal-delete"
                onClick={confirmDelete}
              >
                {t("删除", "Delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
