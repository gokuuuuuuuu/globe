//@ts-nocheck
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ReactFlow,
  type Node,
  type Edge,
  type NodeProps,
  Position,
  Handle,
  Background,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useLanguage } from "../i18n/useLanguage";
import "./MajorRiskDetailPage.css";

// ===== Mock Data =====

const riskInfo = {
  title: "Major Risk Detail - Runway Excursion during Adverse Weather",
  titleZh: "重大风险详情 - 恶劣天气跑道偏出",
  riskId: "P7",
  dateIdentified: "2023-11-15",
  lastUpdated: "2024-05-10",
  status: "Active Investigation",
  statusZh: "调查中",
  riskLevel: "HIGH",
  riskLevelZh: "高",
  priority: "IMMEDIATE",
  priorityZh: "紧急",
};

const flightPhasesEn = [
  "Take-off",
  "Climb",
  "Cruise",
  "Descent",
  "Approach",
  "LANDING",
  "Taxi",
];

const flightPhasesZh = ["起飞", "爬升", "巡航", "下降", "进近", "着陆", "滑行"];

const suggestedActions = [
  {
    action: "Update Pilot Training on Wet Runways",
    actionZh: "更新湿跑道飞行员培训",
    department: "Flight Ops",
    departmentZh: "飞行运营",
    priority: "HIGH" as const,
    dueDate: "2024-06-30",
    status: "Active" as const,
    statusZh: "进行中" as const,
  },
  {
    action: "Inspect Runway Drainage and Friction",
    actionZh: "检查跑道排水和摩擦",
    department: "Maintenance/ATC",
    departmentZh: "维护/空管",
    priority: "MED" as const,
    dueDate: "2024-07-15",
    status: "Green" as const,
    statusZh: "Green" as const,
  },
  {
    action: "Review Aircraft Anti-Skid System Maintenance",
    actionZh: "审查飞机防滑系统维护",
    department: "Aircraft Engineering",
    departmentZh: "飞机工程",
    priority: "HIGH" as const,
    dueDate: "2024-06-01",
    status: "Green" as const,
    statusZh: "Green" as const,
  },
];

const historicalCases = [
  {
    id: "Case 01",
    summary: "Update Pilot Training on Wet Runways on Update Pilot Runways",
    date: "2024-06-15",
    outcome: "Event",
    outcomeZh: "事件",
  },
  {
    id: "Case 02",
    summary: "Inspect Runway Anti-Skid System Maintenance ancreal System",
    date: "2024-06-15",
    outcome: "Near Miss",
    outcomeZh: "接近事故",
  },
  {
    id: "Case 03",
    summary: "Inspect Runway Drainage and Friction",
    date: "2024-06-15",
    outcome: "Event",
    outcomeZh: "事件",
  },
];

// ===== Flow chart nodes & edges =====

// Category label nodes (left column)
const categoryNodesEn: Node[] = [
  {
    id: "cat-human",
    type: "category",
    position: { x: 0, y: 20 },
    data: { label: "HUMAN\nFACTORS" },
    draggable: false,
  },
  {
    id: "cat-aircraft",
    type: "category",
    position: { x: 0, y: 130 },
    data: { label: "AIRCRAFT\nSYSTEMS" },
    draggable: false,
  },
  {
    id: "cat-env",
    type: "category",
    position: { x: 0, y: 250 },
    data: { label: "ENVIRON-\nMENTAL\nCONDITIONS" },
    draggable: false,
  },
];

const categoryNodesZh: Node[] = [
  {
    id: "cat-human",
    type: "category",
    position: { x: 0, y: 20 },
    data: { label: "人为\n因素" },
    draggable: false,
  },
  {
    id: "cat-aircraft",
    type: "category",
    position: { x: 0, y: 130 },
    data: { label: "飞机\n系统" },
    draggable: false,
  },
  {
    id: "cat-env",
    type: "category",
    position: { x: 0, y: 250 },
    data: { label: "环境\n条件" },
    draggable: false,
  },
];

// Cause factor nodes
const causeNodesEn: Node[] = [
  // Row 1: Human Factors
  {
    id: "h1",
    type: "cause",
    position: { x: 150, y: 20 },
    data: {
      label: "Pilot Fatigue",
      severity: "red",
      icon: "\u26A0",
      stats: "\u2139",
    },
    draggable: false,
  },
  {
    id: "h2",
    type: "cause",
    position: { x: 340, y: 20 },
    data: {
      label: "CRM breakdown",
      severity: "red",
      icon: "\u26A0",
      stats: "\u2161 \u2013",
    },
    draggable: false,
  },
  // Row 2: Aircraft Systems
  {
    id: "a1",
    type: "cause",
    position: { x: 150, y: 130 },
    data: {
      label: "Thrust Reverser\nMalfunction",
      severity: "red",
      stats: "\u2161 0",
    },
    draggable: false,
  },
  {
    id: "a2",
    type: "cause",
    position: { x: 340, y: 130 },
    data: {
      label: "Thrust Reverser\nMalfunction",
      severity: "yellow",
      stats: "\u2161 0",
    },
    draggable: false,
  },
  {
    id: "a3",
    type: "cause",
    position: { x: 530, y: 130 },
    data: { label: "Brake Fade", severity: "red", stats: "\u2161 \u2013" },
    draggable: false,
  },
  // Row 3: Environmental
  {
    id: "e1",
    type: "cause",
    position: { x: 150, y: 260 },
    data: {
      label: "Heavy Rain",
      severity: "green",
      icon: "\u2601",
      stats: "\u2601 0",
    },
    draggable: false,
  },
  {
    id: "e2",
    type: "cause",
    position: { x: 340, y: 260 },
    data: { label: "Wind Shear", stats: "\u2261 0" },
    draggable: false,
  },
  {
    id: "e3",
    type: "cause",
    position: { x: 530, y: 260 },
    data: {
      label: "Poor Runway\nFriction",
      severity: "green",
      stats: "\u2161 0",
    },
    draggable: false,
  },
];

const causeNodesZh: Node[] = [
  // Row 1: Human Factors
  {
    id: "h1",
    type: "cause",
    position: { x: 150, y: 20 },
    data: {
      label: "飞行员疲劳",
      severity: "red",
      icon: "\u26A0",
      stats: "\u2139",
    },
    draggable: false,
  },
  {
    id: "h2",
    type: "cause",
    position: { x: 340, y: 20 },
    data: {
      label: "CRM失效",
      severity: "red",
      icon: "\u26A0",
      stats: "\u2161 \u2013",
    },
    draggable: false,
  },
  // Row 2: Aircraft Systems
  {
    id: "a1",
    type: "cause",
    position: { x: 150, y: 130 },
    data: {
      label: "反推装置\n故障",
      severity: "red",
      stats: "\u2161 0",
    },
    draggable: false,
  },
  {
    id: "a2",
    type: "cause",
    position: { x: 340, y: 130 },
    data: {
      label: "反推装置\n故障",
      severity: "yellow",
      stats: "\u2161 0",
    },
    draggable: false,
  },
  {
    id: "a3",
    type: "cause",
    position: { x: 530, y: 130 },
    data: { label: "刹车衰退", severity: "red", stats: "\u2161 \u2013" },
    draggable: false,
  },
  // Row 3: Environmental
  {
    id: "e1",
    type: "cause",
    position: { x: 150, y: 260 },
    data: {
      label: "暴雨",
      severity: "green",
      icon: "\u2601",
      stats: "\u2601 0",
    },
    draggable: false,
  },
  {
    id: "e2",
    type: "cause",
    position: { x: 340, y: 260 },
    data: { label: "风切变", stats: "\u2261 0" },
    draggable: false,
  },
  {
    id: "e3",
    type: "cause",
    position: { x: 530, y: 260 },
    data: {
      label: "跑道摩擦\n不足",
      severity: "green",
      stats: "\u2161 0",
    },
    draggable: false,
  },
];

const causeEdges: Edge[] = [
  // Human row: h1 -> h2
  {
    id: "e-h1-h2",
    source: "h1",
    target: "h2",
    type: "smoothstep",
    animated: false,
  },
  // Aircraft row: a1 -> a2 -> a3
  { id: "e-a1-a2", source: "a1", target: "a2", type: "smoothstep" },
  { id: "e-a2-a3", source: "a2", target: "a3", type: "smoothstep" },
  // Environmental row: e1 -> e2 -> e3
  { id: "e-e1-e2", source: "e1", target: "e2", type: "smoothstep" },
  { id: "e-e2-e3", source: "e2", target: "e3", type: "smoothstep" },
  // Cross-row connections (as shown in the screenshot)
  // h1 -> a1 (Pilot Fatigue affects Thrust Reverser)
  { id: "e-h1-a1", source: "h1", target: "a1", type: "smoothstep" },
  // h2 -> a2 (CRM breakdown -> Thrust Reverser Malfunction)
  { id: "e-h2-a2", source: "h2", target: "a2", type: "smoothstep" },
  // a3 -> output (Brake Fade leads to result)
  // e1 -> e2 already covered
  // a2 -> e2 (cross connection)
  { id: "e-a1-e1", source: "a1", target: "e1", type: "smoothstep" },
];

const defaultEdgeOptions = {
  style: { stroke: "#475569", strokeWidth: 1.5 },
  markerEnd: {
    type: "arrowclosed" as const,
    color: "#475569",
    width: 16,
    height: 12,
  },
};

// ===== Custom Nodes =====

function CategoryNode({ data }: NodeProps) {
  const d = data as { label: string };
  return (
    <div className="mr-flow-category">
      {d.label.split("\n").map((line: string, i: number) => (
        <div key={i}>{line}</div>
      ))}
      <Handle
        type="source"
        position={Position.Right}
        style={{ visibility: "hidden" }}
      />
    </div>
  );
}

function CauseNodeComponent({ data }: NodeProps) {
  const d = data as { label: string; severity?: string; stats?: string };
  const severityColors: Record<string, string> = {
    red: "#dc2626",
    yellow: "#eab308",
    green: "#22c55e",
  };
  return (
    <div className="mr-flow-cause-node">
      <Handle
        type="target"
        position={Position.Left}
        style={{ visibility: "hidden" }}
      />
      {d.severity && (
        <span
          className="mr-flow-severity-dot"
          style={{ background: severityColors[d.severity] }}
        />
      )}
      <div className="mr-flow-cause-text">
        {d.label.split("\n").map((line: string, i: number) => (
          <div key={i}>{line}</div>
        ))}
      </div>
      {d.stats && <div className="mr-flow-cause-stats">{d.stats}</div>}
      <Handle
        type="source"
        position={Position.Right}
        style={{ visibility: "hidden" }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{ visibility: "hidden" }}
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{ visibility: "hidden" }}
      />
    </div>
  );
}

const nodeTypes = {
  category: CategoryNode,
  cause: CauseNodeComponent,
};

// ===== Component =====

export function MajorRiskDetailPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const onInit = useCallback(() => {}, []);

  const categoryNodes = t(categoryNodesZh, categoryNodesEn);
  const causeNodes = t(causeNodesZh, causeNodesEn);
  const allNodes: Node[] = [...categoryNodes, ...causeNodes];
  const flightPhases = t(flightPhasesZh, flightPhasesEn);

  return (
    <div className="mr-root">
      {/* Breadcrumb */}
      <div className="mr-breadcrumb">
        <span style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
          {t("工作台", "Dashboard")}
        </span>
        <span className="mr-breadcrumb-sep">&gt;</span>
        <span
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/risk-monitoring/flights")}
        >
          {t("航班", "Flights")}
        </span>
        <span className="mr-breadcrumb-sep">&gt;</span>
        <span className="mr-breadcrumb-active">
          {t("重大风险详情", "Major Risk Detail")}
        </span>
      </div>

      {/* Page Header */}
      <div className="mr-page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
          <h1 className="mr-page-title">
            {t(`${riskInfo.titleZh}`, riskInfo.title)}
          </h1>
        </div>

        {/* Info Bar */}
        <div className="mr-info-bar">
          <div className="mr-info-field">
            <span className="mr-info-label">{t("风险等级", "Risk Level")}</span>
            <span className="mr-level-badge mr-level-high">
              {t(riskInfo.riskLevelZh, riskInfo.riskLevel)}
            </span>
          </div>
          <div className="mr-info-field">
            <span className="mr-info-label">{t("优先级", "Priority")}</span>
            <span className="mr-priority-badge mr-priority-immediate">
              {t(riskInfo.priorityZh, riskInfo.priority)}
            </span>
          </div>
          <div className="mr-info-field">
            <span className="mr-info-label">{t("风险ID", "Risk ID")}</span>
            <span className="mr-info-value">{riskInfo.riskId}</span>
          </div>
          <div className="mr-info-field">
            <span className="mr-info-label">
              {t("识别日期", "Date Identified")}
            </span>
            <span className="mr-info-value">{riskInfo.dateIdentified}</span>
          </div>
          <div className="mr-info-field">
            <span className="mr-info-label">
              {t("最后更新", "Last Updated")}
            </span>
            <span className="mr-info-value">{riskInfo.lastUpdated}</span>
          </div>
          <div className="mr-info-field" style={{ borderRight: "none" }}>
            <span className="mr-info-label">{t("状态", "Status")}</span>
            <span className="mr-info-value">
              {t(riskInfo.statusZh, riskInfo.status)}
            </span>
          </div>
          <div className="mr-info-actions">
            <button className="mr-btn-action mr-btn-blue">
              {t("查看原因解释", "View Cause Explanation")}
            </button>
            <button className="mr-btn-action mr-btn-blue">
              {t("查看证据链", "View Evidence Chain")}
            </button>
            <button className="mr-btn-action mr-btn-red">
              {t("发起专项处置", "Initiate Special Action")}
            </button>
          </div>
        </div>
      </div>

      <div className="mr-content">
        {/* Cause Chain Analysis */}
        <div className="mr-card">
          <div className="mr-card-header">
            <span className="mr-card-title">
              {t("原因链分析", "Cause Chain Analysis")}
            </span>
            <span className="mr-card-menu">&#8942;</span>
          </div>

          <div className="mr-cause-chain">
            {/* Left: ReactFlow cause chain */}
            <div className="mr-cause-left">
              <div className="mr-flow-container">
                <ReactFlow
                  nodes={allNodes}
                  edges={causeEdges}
                  nodeTypes={nodeTypes}
                  defaultEdgeOptions={defaultEdgeOptions}
                  onInit={onInit}
                  fitView
                  panOnDrag={false}
                  zoomOnScroll={false}
                  zoomOnPinch={false}
                  zoomOnDoubleClick={false}
                  preventScrolling={false}
                  nodesDraggable={false}
                  nodesConnectable={false}
                  elementsSelectable={false}
                  proOptions={{ hideAttribution: true }}
                >
                  <Background
                    variant={BackgroundVariant.Dots}
                    gap={20}
                    size={1}
                    color="rgba(148,163,184,0.08)"
                  />
                </ReactFlow>
              </div>
            </div>

            {/* Right: flight phase diagram */}
            <div className="mr-cause-right">
              <div className="mr-phase-card">
                <div className="mr-phase-title">
                  {t("相关飞行阶段：着陆", "Related Flight Phase: Landing")}
                </div>
                <div className="mr-phase-diagram">
                  <svg
                    className="mr-phase-svg"
                    viewBox="0 0 340 100"
                    preserveAspectRatio="none"
                  >
                    <polyline
                      points="10,80 50,50 100,30 170,25 230,35 270,55 300,70 330,80"
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="2"
                    />
                    <line
                      x1="300"
                      y1="70"
                      x2="340"
                      y2="75"
                      stroke="#94a3b8"
                      strokeWidth="2"
                      markerEnd="url(#arrowhead)"
                    />
                    <defs>
                      <marker
                        id="arrowhead"
                        markerWidth="8"
                        markerHeight="6"
                        refX="8"
                        refY="3"
                        orient="auto"
                      >
                        <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
                      </marker>
                    </defs>
                  </svg>
                </div>
                <div className="mr-phase-labels">
                  {flightPhases.map((phase, i) => (
                    <span
                      key={i}
                      className={`mr-phase-label ${
                        phase === "LANDING" || phase === "着陆"
                          ? "mr-phase-label-active"
                          : ""
                      }`}
                    >
                      {phase}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom two columns */}
        <div className="mr-two-col">
          {/* Suggested Actions & Mitigation */}
          <div className="mr-card">
            <div className="mr-card-header">
              <span className="mr-card-title">
                {t("建议措施与缓解", "Suggested Actions & Mitigation")}
              </span>
              <span className="mr-card-menu">&#8942;</span>
            </div>
            <table className="mr-table">
              <thead>
                <tr>
                  <th>{t("措施", "Action")}</th>
                  <th>{t("责任部门", "Responsible Department")}</th>
                  <th>{t("优先级", "Priority")}</th>
                  <th>{t("截止日期", "Due Date")}</th>
                  <th>{t("状态", "Status")}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {suggestedActions.map((a, i) => (
                  <tr key={i}>
                    <td>{t(a.actionZh, a.action)}</td>
                    <td>{t(a.departmentZh, a.department)}</td>
                    <td>
                      <span
                        className={`mr-priority-cell ${a.priority === "HIGH" ? "mr-priority-cell-high" : "mr-priority-cell-med"}`}
                      >
                        {a.priority}
                      </span>
                    </td>
                    <td>{a.dueDate}</td>
                    <td>
                      <span
                        className={
                          a.status === "Active"
                            ? "mr-status-active"
                            : "mr-status-green"
                        }
                      >
                        {t(a.statusZh, a.status)}
                      </span>
                    </td>
                    <td>
                      <span className="mr-row-menu">&#8942;</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Similar Historical Cases */}
          <div className="mr-card">
            <div className="mr-card-header">
              <span className="mr-card-title">
                {t("类似历史案例", "Similar Historical Cases")}
              </span>
              <span className="mr-card-menu">&#9776;</span>
            </div>
            <table className="mr-table">
              <thead>
                <tr>
                  <th>{t("案例ID", "Case ID")}</th>
                  <th>{t("简要摘要", "Brief Summary")}</th>
                  <th>{t("日期", "Date")}</th>
                  <th>{t("结果", "Outcome")}</th>
                </tr>
              </thead>
              <tbody>
                {historicalCases.map((c, i) => (
                  <tr key={i}>
                    <td>{c.id}</td>
                    <td>{c.summary}</td>
                    <td>{c.date}</td>
                    <td>{t(c.outcomeZh, c.outcome)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
