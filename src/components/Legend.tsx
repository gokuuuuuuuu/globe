// @ts-nocheck
import { useState } from "react";
import "./Legend.css";

// ===== 图例数据定义 =====

interface LegendItem {
  label: string;
  color: string;
  desc?: string;
}

interface LegendGroup {
  key: string;
  icon: string;
  title: string;
  unit?: string;
  items: LegendItem[];
}

const WIND_LEGEND: LegendGroup = {
  key: "wind",
  icon: "💨",
  title: "风速",
  unit: "m/s",
  items: [
    { label: "< 2", color: "rgb(38, 128, 204)", desc: "微风" },
    { label: "2-6", color: "rgb(89, 179, 153)", desc: "轻风" },
    { label: "6-12", color: "rgb(230, 204, 77)", desc: "中风" },
    { label: "> 12", color: "rgb(230, 89, 51)", desc: "强风" },
  ],
};

const TEMPERATURE_LEGEND: LegendGroup = {
  key: "temperature",
  icon: "🌡️",
  title: "温度",
  unit: "°C",
  items: [
    { label: "< -30", color: "rgb(0, 0, 64)" },
    { label: "-30~-10", color: "rgb(38, 89, 166)" },
    { label: "-10~0", color: "rgb(51, 128, 179)" },
    { label: "0~15", color: "rgb(51, 166, 115)" },
    { label: "15~25", color: "rgb(153, 191, 64)" },
    { label: "25~35", color: "rgb(204, 128, 38)" },
    { label: "> 35", color: "rgb(191, 89, 51)" },
  ],
};

const PRECIPITATION_LEGEND: LegendGroup = {
  key: "precipitation",
  icon: "🌧️",
  title: "降水",
  items: [
    { label: "雨", color: "rgb(31, 97, 217)" },
    { label: "雪", color: "rgb(235, 242, 255)" },
    { label: "冻雨", color: "rgb(191, 115, 230)" },
  ],
};

const FOG_LEGEND: LegendGroup = {
  key: "fog",
  icon: "🌫️",
  title: "雾",
  items: [
    { label: "浓雾", color: "rgba(242, 242, 247, 0.95)", desc: "≤0.5°C" },
    { label: "薄雾", color: "rgba(242, 242, 247, 0.6)", desc: "0.5~2°C" },
    { label: "无雾", color: "transparent", desc: ">2°C" },
  ],
};

const MOISTURE_LEGEND: LegendGroup = {
  key: "moisture",
  icon: "💧",
  title: "水汽",
  items: [
    { label: "低", color: "rgb(26, 77, 153)" },
    { label: "中", color: "rgb(51, 128, 204)" },
    { label: "高", color: "rgb(77, 179, 230)" },
    { label: "极高", color: "rgb(128, 230, 255)" },
  ],
};

const LIGHTNING_LEGEND: LegendGroup = {
  key: "lightning",
  icon: "⚡",
  title: "雷电",
  items: [
    { label: "低", color: "rgb(255, 230, 77)" },
    { label: "中", color: "rgb(255, 243, 128)" },
    { label: "高", color: "rgb(255, 255, 179)" },
    { label: "极高", color: "rgb(255, 255, 255)" },
  ],
};

const CAT_LEGEND: LegendGroup = {
  key: "cat",
  icon: "🌪️",
  title: "颠簸",
  items: [
    { label: "无", color: "rgb(0, 153, 51)" },
    { label: "轻微", color: "rgb(77, 179, 77)" },
    { label: "轻度", color: "rgb(153, 204, 51)" },
    { label: "中度", color: "rgb(230, 204, 26)" },
    { label: "强", color: "rgb(230, 77, 26)" },
    { label: "极强", color: "rgb(204, 26, 26)" },
  ],
};

const VISIBILITY_LEGEND: LegendGroup = {
  key: "visibility",
  icon: "👁️",
  title: "能见度",
  items: [
    { label: "良好", color: "rgb(51, 153, 153)" },
    { label: "一般", color: "rgb(128, 191, 191)" },
    { label: "较差", color: "rgb(179, 217, 217)" },
    { label: "差", color: "rgb(217, 230, 230)" },
    { label: "很差", color: "rgb(230, 230, 230)" },
  ],
};

const ALL_LEGENDS: LegendGroup[] = [
  WIND_LEGEND,
  TEMPERATURE_LEGEND,
  PRECIPITATION_LEGEND,
  FOG_LEGEND,
  MOISTURE_LEGEND,
  LIGHTNING_LEGEND,
  CAT_LEGEND,
  VISIBILITY_LEGEND,
];

// ===== 统一图例面板 =====

interface UnifiedLegendProps {
  activeLayers: Record<string, boolean>;
}

export function UnifiedLegend({ activeLayers }: UnifiedLegendProps) {
  const [expanded, setExpanded] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const activeGroups = ALL_LEGENDS.filter((g) => activeLayers[g.key]);

  if (activeGroups.length === 0) return null;

  return (
    <div className={`legend-panel ${expanded ? "legend-panel-open" : ""}`}>
      {/* 收起状态：紧凑图标条 */}
      <button
        className="legend-toggle"
        onClick={() => setExpanded(!expanded)}
        title={expanded ? "收起图例" : "展开图例"}
      >
        <span className="legend-toggle-icons">
          {activeGroups.map((g) => (
            <span key={g.key} className="legend-toggle-icon">
              {g.icon}
            </span>
          ))}
        </span>
        <span className="legend-toggle-label">
          {expanded ? "收起" : "图例"}
        </span>
        <span className={`legend-toggle-arrow ${expanded ? "open" : ""}`}>
          ›
        </span>
      </button>

      {/* 展开状态：紧凑色块列表 */}
      {expanded && (
        <div className="legend-groups">
          {activeGroups.map((group) => {
            const isOpen = expandedGroup === group.key;
            return (
              <div key={group.key} className="legend-group">
                <button
                  className="legend-group-header"
                  onClick={() => setExpandedGroup(isOpen ? null : group.key)}
                >
                  <span className="legend-group-icon">{group.icon}</span>
                  <span className="legend-group-title">{group.title}</span>
                  {group.unit && (
                    <span className="legend-group-unit">({group.unit})</span>
                  )}
                  {/* 内联色条预览 */}
                  <span className="legend-group-preview">
                    {group.items.map((item, i) => (
                      <span
                        key={i}
                        className="legend-preview-dot"
                        style={{
                          backgroundColor: item.color,
                          border:
                            item.color === "transparent"
                              ? "1px solid rgba(200,200,200,0.5)"
                              : "none",
                        }}
                      />
                    ))}
                  </span>
                  <span
                    className={`legend-group-arrow ${isOpen ? "open" : ""}`}
                  >
                    ›
                  </span>
                </button>
                {isOpen && (
                  <div className="legend-group-body">
                    {group.items.map((item, i) => (
                      <div key={i} className="legend-row">
                        <span
                          className="legend-row-color"
                          style={{
                            backgroundColor: item.color,
                            border:
                              item.color === "transparent"
                                ? "1px solid rgba(200,200,200,0.5)"
                                : "none",
                          }}
                        />
                        <span className="legend-row-label">{item.label}</span>
                        {item.desc && (
                          <span className="legend-row-desc">{item.desc}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ===== 旧接口保持兼容（不再使用但避免导入报错） =====
export function WindLegend({ visible: _v }: { visible: boolean }) {
  return null;
}
export function TemperatureLegend({
  visible: _v,
}: {
  visible: boolean;
  minTemp?: number;
  maxTemp?: number;
}) {
  return null;
}
export function PrecipitationLegend({ visible: _v }: { visible: boolean }) {
  return null;
}
export function FogLegend({ visible: _v }: { visible: boolean }) {
  return null;
}
export function MoistureLegend({ visible: _v }: { visible: boolean }) {
  return null;
}
export function LightningLegend({ visible: _v }: { visible: boolean }) {
  return null;
}
export function CATLegend({ visible: _v }: { visible: boolean }) {
  return null;
}
export function VisibilityLegend({ visible: _v }: { visible: boolean }) {
  return null;
}
