import { useMemo, useState } from "react";
import causalGraphData from "../data/causalGraph.json";

interface Node {
  id: string;
  label: string;
  fill: string;
  stroke: string;
}

interface GraphData {
  nodes: Node[];
  edges: [string, string][];
}

const graph = causalGraphData as GraphData;
const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));

// 从完整因果图中随机抽取一条风险链条及其周边节点
function extractChain(seed: number): {
  nodes: Node[];
  edges: [string, string][];
  chainIds: string[];
} {
  const outEdges = new Map<string, string[]>();
  graph.edges.forEach(([from, to]) => {
    if (!outEdges.has(from)) outEdges.set(from, []);
    outEdges.get(from)!.push(to);
  });

  const startNodes = graph.nodes.filter(
    (n) => (outEdges.get(n.id)?.length ?? 0) >= 3,
  );
  let s = seed;
  s = (s * 9301 + 49297) % 233280;
  const startNode = startNodes[Math.floor((s / 233280) * startNodes.length)];

  const chain: string[] = [startNode.id];
  let current = startNode.id;
  for (let i = 0; i < 5; i++) {
    const outs = outEdges.get(current);
    if (!outs || outs.length === 0) break;
    s = (s * 9301 + 49297) % 233280;
    const next = outs[Math.floor((s / 233280) * outs.length)];
    if (chain.includes(next)) break;
    chain.push(next);
    current = next;
  }

  const nodeIds = new Set(chain);
  const chainEdges: [string, string][] = [];

  for (let i = 0; i < chain.length - 1; i++) {
    chainEdges.push([chain[i], chain[i + 1]]);
  }

  // Add a few neighbors
  chain.forEach((id) => {
    let added = 0;
    const outs = outEdges.get(id) ?? [];
    for (const to of outs) {
      if (!nodeIds.has(to) && added < 1) {
        nodeIds.add(to);
        chainEdges.push([id, to]);
        added++;
      }
    }
    graph.edges.forEach(([from, to]) => {
      if (to === id && !nodeIds.has(from) && added < 2) {
        nodeIds.add(from);
        chainEdges.push([from, to]);
        added++;
      }
    });
  });

  const nodes = Array.from(nodeIds)
    .map((id) => nodeMap.get(id))
    .filter(Boolean) as Node[];

  return { nodes, edges: chainEdges, chainIds: chain };
}

/** Shapley 致因分解卡片 */
export function ShapleyCard({
  flightId,
  t,
}: {
  flightId: number;
  t: (zh: string, en: string) => string;
}) {
  const shapleyIdx = ((flightId * 7 + 3) % 35) + 1;
  const shapleyUrl = `/shapley/accident_${shapleyIdx}_exact_shapley.png`;

  return (
    <div
      style={{
        background: "rgba(15,23,42,0.6)",
        borderRadius: 10,
        border: "1px solid rgba(148,163,184,0.12)",
        padding: 16,
        flex: "1 1 0",
        maxHeight: 420,
        overflowY: "auto",
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "#e2e8f0",
          marginBottom: 8,
        }}
      >
        {t("Shapley 致因分解", "Shapley Causal Decomposition")}
      </div>
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 12 }}>
        {t(
          "各语义因素组对风险事件的贡献度",
          "Contribution of semantic factor groups to risk events",
        )}
      </div>
      <img
        src={shapleyUrl}
        alt="Shapley Decomposition"
        style={{ width: "100%", borderRadius: 8, background: "#fff" }}
      />
    </div>
  );
}

/** 风险因果链路图（横向） */
export function CausalChainView({
  flightId,
  t,
}: {
  flightId: number;
  t: (zh: string, en: string) => string;
}) {
  const { nodes, edges, chainIds } = useMemo(
    () => extractChain(flightId),
    [flightId],
  );

  const chainSet = new Set(chainIds);

  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    text: string;
  } | null>(null);

  const W = 800;
  const H = 160;

  // 横向布局：主链从左到右，分支节点上下偏移
  const positions = useMemo(() => {
    const pos = new Map<string, { x: number; y: number }>();
    const centerY = H / 2;

    // 主链水平排列
    const chainSpacing = (W - 100) / (chainIds.length - 1 || 1);
    chainIds.forEach((id, i) => {
      pos.set(id, { x: 50 + i * chainSpacing, y: centerY });
    });

    // 分支节点放在最近主链节点的上方或下方
    let branchIdx = 0;
    nodes.forEach((node) => {
      if (pos.has(node.id)) return;
      let parentX = W / 2;
      for (const [from, to] of edges) {
        if (to === node.id && pos.has(from)) {
          parentX = pos.get(from)!.x;
          break;
        }
        if (from === node.id && pos.has(to)) {
          parentX = pos.get(to)!.x;
          break;
        }
      }
      const offsetY = branchIdx % 2 === 0 ? -50 : 50;
      const offsetX = ((branchIdx % 3) - 1) * 20;
      pos.set(node.id, {
        x: Math.max(45, Math.min(W - 45, parentX + offsetX)),
        y: Math.max(18, Math.min(H - 18, centerY + offsetY)),
      });
      branchIdx++;
    });

    return pos;
  }, [nodes, edges, chainIds]);

  return (
    <div
      style={{
        position: "relative",
        background: "rgba(15,23,42,0.6)",
        borderRadius: 10,
        border: "1px solid rgba(148,163,184,0.12)",
        padding: 16,
        marginTop: 16,
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "#e2e8f0",
          marginBottom: 4,
        }}
      >
        {t("风险因果链路", "Risk Causal Chain")}
      </div>
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>
        {t(
          "从完整因果图中抽取的局部链路，展示风险因素间的传导关系",
          "Partial causal chain showing risk factor propagation",
        )}
      </div>
      <svg
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        style={{ background: "rgba(0,0,0,0.15)", borderRadius: 8 }}
      >
        <defs>
          <marker
            id="ch-arrow"
            markerWidth="8"
            markerHeight="6"
            refX="8"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 8 3, 0 6" fill="#64748b" />
          </marker>
          <marker
            id="ch-arrow-main"
            markerWidth="10"
            markerHeight="7"
            refX="10"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#60a5fa" />
          </marker>
        </defs>
        {/* Edges */}
        {edges.map(([from, to], i) => {
          const p1 = positions.get(from);
          const p2 = positions.get(to);
          if (!p1 || !p2) return null;
          const isMainEdge = chainSet.has(from) && chainSet.has(to);
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const offset = 35;
          return (
            <line
              key={i}
              x1={p1.x + (dx / dist) * offset}
              y1={p1.y + (dy / dist) * (isMainEdge ? 0 : offset * 0.4)}
              x2={p2.x - (dx / dist) * offset}
              y2={p2.y - (dy / dist) * (isMainEdge ? 0 : offset * 0.4)}
              stroke={isMainEdge ? "#60a5fa" : "#475569"}
              strokeWidth={isMainEdge ? 2.5 : 1.2}
              markerEnd={isMainEdge ? "url(#ch-arrow-main)" : "url(#ch-arrow)"}
              opacity={isMainEdge ? 0.9 : 0.5}
              strokeDasharray={isMainEdge ? undefined : "4 3"}
            />
          );
        })}
        {/* Nodes */}
        {nodes.map((node) => {
          const p = positions.get(node.id);
          if (!p) return null;
          const isChain = chainSet.has(node.id);
          const rw = isChain ? 42 : 35;
          const rh = isChain ? 12 : 10;
          return (
            <g
              key={node.id}
              style={{ cursor: "pointer" }}
              onMouseEnter={(e) => {
                const svg = e.currentTarget.closest("svg");
                if (!svg) return;
                const rect = svg.getBoundingClientRect();
                const scaleX = rect.width / W;
                const scaleY = rect.height / H;
                setTooltip({
                  x: p.x * scaleX,
                  y: p.y * scaleY - 20,
                  text: node.label,
                });
              }}
              onMouseLeave={() => setTooltip(null)}
            >
              <rect
                x={p.x - rw}
                y={p.y - rh}
                width={rw * 2}
                height={rh * 2}
                rx={6}
                fill={node.fill}
                stroke={isChain ? "#60a5fa" : node.stroke}
                strokeWidth={isChain ? 2 : 1}
                opacity={isChain ? 1 : 0.7}
              />
              <text
                x={p.x}
                y={p.y + 4}
                textAnchor="middle"
                fontSize={isChain ? 8 : 7}
                fill="#1f2937"
                fontWeight={isChain ? 600 : 400}
                pointerEvents="none"
              >
                {node.label.length > 6
                  ? node.label.slice(0, 6) + "…"
                  : node.label}
              </text>
            </g>
          );
        })}
      </svg>
      {tooltip && (
        <div
          style={{
            position: "absolute",
            left: tooltip.x,
            top: tooltip.y,
            transform: "translate(-50%, -100%)",
            background: "rgba(15,23,42,0.95)",
            border: "1px solid rgba(148,163,184,0.3)",
            borderRadius: 6,
            padding: "4px 10px",
            fontSize: 12,
            color: "#e2e8f0",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: 10,
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
