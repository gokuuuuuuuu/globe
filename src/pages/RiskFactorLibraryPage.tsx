import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "../i18n/useLanguage";
import {
  getRiskFactorList,
  getRiskFactorCategories,
  getRiskFactorDetail,
  createRiskFactor,
  deleteRiskFactor,
  replaceRiskFactorRules,
  type RiskFactorListParams,
  type RiskFactorListItem,
  type RuleItemDto,
  type CreateRiskFactorDto,
} from "../api/riskFactor";
import { useToast } from "../components/Toast";
import "./RiskFactorLibraryPage.css";

// ===== Types =====

interface FactorRule {
  id?: number;
  condition: string;
  action: string;
}

interface Factor {
  id: number;
  code: string;
  name: string;
  category: string;
  importance: string;
  source: string;
  score: number;
  ruleCount: number;
  rules: FactorRule[];
}

interface CategoryOption {
  value: string;
  label: string;
}

// ===== Component =====

export function RiskFactorLibraryPage() {
  const { t } = useLanguage();
  const { toast } = useToast();

  // Data state
  const [factors, setFactors] = useState<Factor[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // Filter state
  const [riskTypeFilter, setRiskTypeFilter] = useState("all");
  const [nameFilter, setNameFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);

  // Edit modal state
  const [editingFactor, setEditingFactor] = useState<Factor | null>(null);
  const [editRules, setEditRules] = useState<FactorRule[]>([]);
  const [editLoading, setEditLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // Delete confirm state
  const [deletingFactor, setDeletingFactor] = useState<Factor | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<{
    name: string;
    category: string;
    importance: string;
    source: string;
    score: number;
    rules: FactorRule[];
  }>({
    name: "",
    category: "",
    importance: "中",
    source: "MANUAL",
    score: 50,
    rules: [],
  });
  const [createLoading, setCreateLoading] = useState(false);

  // Fetch categories on mount
  useEffect(() => {
    getRiskFactorCategories()
      .then((res: { value: string; label: string }[]) => {
        setCategories(Array.isArray(res) ? res : []);
      })
      .catch(() => {});
  }, []);

  // Fetch factor list
  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const params: RiskFactorListParams = { page, pageSize };
      if (riskTypeFilter !== "all") params.category = riskTypeFilter;
      if (nameFilter) params.name = nameFilter;
      const res = await getRiskFactorList(params);
      const data =
        (res as { items?: RiskFactorListItem[]; total?: number }) ?? {};
      setFactors(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      console.error("Failed to fetch risk factors:", err);
      toast(
        err instanceof Error
          ? err.message
          : t("加载风险因子失败", "Failed to load risk factors"),
        "error",
      );
      setFactors([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, riskTypeFilter, nameFilter]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [riskTypeFilter, nameFilter]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const tImportance = (level: string) => {
    // API 返回中文 "高"/"中"/"低"，直接显示
    return level || "—";
  };

  const importanceClass = (level: string) => {
    if (level === "高" || level === "HIGH") return "high";
    if (level === "中" || level === "MEDIUM") return "medium";
    return "low";
  };

  const tRuleSource = (src: string) => {
    if (src === "MODEL_OUTPUT") return t("模型输出", "Model Output");
    return t("人工定义", "Manual");
  };

  const tCategory = (value: string) => {
    const found = categories.find((c) => c.value === value);
    return found ? found.label : value;
  };

  // Open edit modal — fetch full detail with rules
  const handleEdit = async (factor: Factor) => {
    setEditingFactor(factor);
    setEditRules([]);
    setEditLoading(true);
    try {
      const res = await getRiskFactorDetail(factor.id);
      const detail = res as RiskFactorListItem;
      const rules: FactorRule[] = (detail.rules ?? []).map(
        (r: RuleItemDto) => ({
          condition: r.condition ?? "",
          action: r.action ?? "",
        }),
      );
      setEditRules(rules);
    } catch {
      setEditRules([]);
    } finally {
      setEditLoading(false);
    }
  };

  // Save edited rules
  const handleSaveRules = async () => {
    if (!editingFactor) return;
    setSaveLoading(true);
    try {
      const rules: RuleItemDto[] = editRules.map((r) => ({
        condition: r.condition,
        action: r.action,
      }));
      await replaceRiskFactorRules(editingFactor.id, rules);
      toast(t("规则保存成功", "Rules saved successfully"), "success");
      setEditingFactor(null);
      fetchList();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      toast(msg || t("规则保存失败", "Failed to save rules"), "error");
    } finally {
      setSaveLoading(false);
    }
  };

  // Delete
  const handleDelete = (factor: Factor) => {
    setDeletingFactor(factor);
  };

  const confirmDelete = async () => {
    if (!deletingFactor) return;
    setDeleteLoading(true);
    try {
      await deleteRiskFactor(deletingFactor.id);
      toast(t("删除成功", "Deleted successfully"), "success");
      setDeletingFactor(null);
      fetchList();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      toast(msg || t("删除失败", "Failed to delete"), "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Edit rule handlers
  const updateRuleCondition = (index: number, value: string) => {
    setEditRules((prev) =>
      prev.map((r, i) => (i === index ? { ...r, condition: value } : r)),
    );
  };

  const updateRuleResult = (index: number, value: string) => {
    setEditRules((prev) =>
      prev.map((r, i) => (i === index ? { ...r, action: value } : r)),
    );
  };

  const addRule = () => {
    setEditRules((prev) => [...prev, { condition: "", action: "触发" }]);
  };

  const removeRule = (index: number) => {
    setEditRules((prev) => prev.filter((_, i) => i !== index));
  };

  // Create factor
  const handleCreate = async () => {
    if (!createForm.name || !createForm.category) return;
    setCreateLoading(true);
    try {
      const data: CreateRiskFactorDto = {
        name: createForm.name,
        category: createForm.category,
        importance: createForm.importance,
        source: createForm.source,
        score: createForm.score,
        rules: createForm.rules.map((r) => ({
          condition: r.condition,
          action: r.action,
        })),
      };
      await createRiskFactor(data);
      toast(t("因子创建成功", "Factor created successfully"), "success");
      setShowCreateModal(false);
      setCreateForm({
        name: "",
        category: "",
        importance: "中",
        source: "MANUAL",
        score: 50,
        rules: [],
      });
      fetchList();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      toast(msg || t("创建失败", "Failed to create"), "error");
    } finally {
      setCreateLoading(false);
    }
  };

  // Create form rule handlers
  const addCreateRule = () => {
    setCreateForm((prev) => ({
      ...prev,
      rules: [...prev.rules, { condition: "", action: "触发" }],
    }));
  };

  const removeCreateRule = (index: number) => {
    setCreateForm((prev) => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index),
    }));
  };

  const updateCreateRuleCondition = (index: number, value: string) => {
    setCreateForm((prev) => ({
      ...prev,
      rules: prev.rules.map((r, i) =>
        i === index ? { ...r, condition: value } : r,
      ),
    }));
  };

  const updateCreateRuleAction = (index: number, value: string) => {
    setCreateForm((prev) => ({
      ...prev,
      rules: prev.rules.map((r, i) =>
        i === index ? { ...r, action: value } : r,
      ),
    }));
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
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
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
            {t(`共 ${total} 条记录`, `${total} records`)}
          </span>
          <button
            className="rfl-modal-btn rfl-modal-save"
            style={{ marginLeft: "auto" }}
            onClick={() => setShowCreateModal(true)}
          >
            + {t("添加因子", "Add Factor")}
          </button>
        </div>

        {/* Table */}
        <div className="rfl-table-card">
          {loading && (
            <div
              style={{
                textAlign: "center",
                padding: "24px",
                color: "#aaa",
              }}
            >
              {t("加载中...", "Loading...")}
            </div>
          )}
          <table className="rfl-table" style={{ opacity: loading ? 0.5 : 1 }}>
            <thead>
              <tr>
                <th style={{ width: 40 }} />
                <th>{t("因子编号", "Factor ID")}</th>
                <th>{t("因子名称", "Factor Name")}</th>
                <th>{t("风险类型", "Risk Type")}</th>
                <th>{t("重要度", "Importance")}</th>
                <th>{t("规则数", "Rules Count")}</th>
                <th>{t("规则来源", "Rule Source")}</th>
                <th>{t("得分", "Score")}</th>
                <th>{t("操作", "Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {factors.map((f) => (
                <tr key={f.id}>
                  <td />
                  <td>{f.code}</td>
                  <td>{f.name}</td>
                  <td>{tCategory(f.category)}</td>
                  <td>
                    <span
                      className={`rfl-risk-badge ${importanceClass(f.importance)}`}
                    >
                      <span className="rfl-risk-dot" />
                      {tImportance(f.importance)}
                    </span>
                  </td>
                  <td>{f.ruleCount ?? 0}</td>
                  <td>{tRuleSource(f.source)}</td>
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
              {!loading && factors.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    style={{
                      textAlign: "center",
                      padding: "24px",
                      color: "#aaa",
                    }}
                  >
                    {t("暂无数据", "No data")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="rfl-pagination">
            <button
              className="rfl-page-btn"
              disabled={page <= 1}
              onClick={() => setPage(1)}
            >
              &#171;
            </button>
            <button
              className="rfl-page-btn"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              &lsaquo;
            </button>
            <span style={{ color: "#ccc", fontSize: 13, margin: "0 8px" }}>
              {page} / {totalPages}
            </span>
            <button
              className="rfl-page-btn"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              &rsaquo;
            </button>
            <button
              className="rfl-page-btn"
              disabled={page >= totalPages}
              onClick={() => setPage(totalPages)}
            >
              &#187;
            </button>
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
                {t("因子规则编辑", "Factor Rule Editor")} — {editingFactor.name}
              </h3>
              <button
                className="rfl-modal-close"
                onClick={() => setEditingFactor(null)}
              >
                &#10005;
              </button>
            </div>
            <div className="rfl-modal-body">
              {editLoading ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "24px",
                    color: "#aaa",
                  }}
                >
                  {t("加载中...", "Loading...")}
                </div>
              ) : (
                <>
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
                          onChange={(e) =>
                            updateRuleCondition(idx, e.target.value)
                          }
                        />
                        <span className="rfl-rule-keyword">THEN</span>
                        <input
                          className="rfl-rule-input rfl-rule-result"
                          value={rule.action}
                          onChange={(e) =>
                            updateRuleResult(idx, e.target.value)
                          }
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
                </>
              )}
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
                disabled={saveLoading || editLoading}
              >
                {saveLoading ? t("保存中...", "Saving...") : t("保存", "Save")}
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
                disabled={deleteLoading}
              >
                {deleteLoading
                  ? t("删除中...", "Deleting...")
                  : t("删除", "Delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Factor Modal */}
      {showCreateModal && (
        <div
          className="rfl-modal-overlay"
          onClick={() => setShowCreateModal(false)}
        >
          <div className="rfl-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rfl-modal-header">
              <h3>{t("添加风险因子", "Add Risk Factor")}</h3>
              <button
                className="rfl-modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                &#10005;
              </button>
            </div>
            <div className="rfl-modal-body">
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                <label style={{ color: "#ccc", fontSize: 13 }}>
                  {t("因子名称", "Factor Name")} *
                  <input
                    className="rfl-input"
                    style={{ width: "100%", marginTop: 4 }}
                    value={createForm.name}
                    onChange={(e) =>
                      setCreateForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder={t("请输入因子名称", "Enter factor name")}
                  />
                </label>
                <label style={{ color: "#ccc", fontSize: 13 }}>
                  {t("风险类型", "Risk Type")} *
                  <select
                    className="rfl-select"
                    style={{ width: "100%", marginTop: 4 }}
                    value={createForm.category}
                    onChange={(e) =>
                      setCreateForm((f) => ({ ...f, category: e.target.value }))
                    }
                  >
                    <option value="">{t("请选择", "Select...")}</option>
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div style={{ display: "flex", gap: 12 }}>
                  <label style={{ color: "#ccc", fontSize: 13, flex: 1 }}>
                    {t("重要度", "Importance")}
                    <select
                      className="rfl-select"
                      style={{ width: "100%", marginTop: 4 }}
                      value={createForm.importance}
                      onChange={(e) =>
                        setCreateForm((f) => ({
                          ...f,
                          importance: e.target.value as string,
                        }))
                      }
                    >
                      <option value="高">{t("高", "High")}</option>
                      <option value="中">{t("中", "Medium")}</option>
                      <option value="低">{t("低", "Low")}</option>
                    </select>
                  </label>
                  <label style={{ color: "#ccc", fontSize: 13, flex: 1 }}>
                    {t("规则来源", "Rule Source")}
                    <select
                      className="rfl-select"
                      style={{ width: "100%", marginTop: 4 }}
                      value={createForm.source}
                      onChange={(e) =>
                        setCreateForm((f) => ({
                          ...f,
                          source: e.target.value as string,
                        }))
                      }
                    >
                      <option value="MODEL_OUTPUT">
                        {t("模型输出", "Model Output")}
                      </option>
                      <option value="MANUAL">{t("人工定义", "Manual")}</option>
                    </select>
                  </label>
                  <label style={{ color: "#ccc", fontSize: 13, flex: 1 }}>
                    {t("得分", "Score")}
                    <input
                      className="rfl-input"
                      style={{ width: "100%", marginTop: 4 }}
                      type="number"
                      min={0}
                      max={100}
                      value={createForm.score}
                      onChange={(e) =>
                        setCreateForm((f) => ({
                          ...f,
                          score: Number(e.target.value),
                        }))
                      }
                    />
                  </label>
                </div>

                {/* Rules section */}
                <div className="rfl-rule-label">
                  {t("规则 (可选)", "Rules (optional)")}
                </div>
                <div className="rfl-rules-list">
                  {createForm.rules.map((rule, idx) => (
                    <div key={idx} className="rfl-rule-row">
                      <span className="rfl-rule-keyword">IF</span>
                      <input
                        className="rfl-rule-input rfl-rule-condition"
                        value={rule.condition}
                        onChange={(e) =>
                          updateCreateRuleCondition(idx, e.target.value)
                        }
                      />
                      <span className="rfl-rule-keyword">THEN</span>
                      <input
                        className="rfl-rule-input rfl-rule-result"
                        value={rule.action}
                        onChange={(e) =>
                          updateCreateRuleAction(idx, e.target.value)
                        }
                      />
                      <button
                        className="rfl-rule-remove"
                        onClick={() => removeCreateRule(idx)}
                        title={t("删除规则", "Remove rule")}
                      >
                        &#10005;
                      </button>
                    </div>
                  ))}
                </div>
                <button className="rfl-add-rule-btn" onClick={addCreateRule}>
                  + {t("添加规则", "Add Rule")}
                </button>
              </div>
            </div>
            <div className="rfl-modal-footer">
              <button
                className="rfl-modal-btn rfl-modal-cancel"
                onClick={() => setShowCreateModal(false)}
              >
                {t("取消", "Cancel")}
              </button>
              <button
                className="rfl-modal-btn rfl-modal-save"
                onClick={handleCreate}
                disabled={
                  createLoading || !createForm.name || !createForm.category
                }
              >
                {createLoading
                  ? t("创建中...", "Creating...")
                  : t("创建", "Create")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
