import { Line, OrbitControls, Text, Stars } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import {
  Canvas,
  useFrame,
  useThree,
  type ThreeEvent,
} from "@react-three/fiber";
import {
  Suspense,
  useMemo,
  useRef,
  useEffect,
  useCallback,
  useState,
  memo,
} from "react";
import { GlowingFlightPaths } from "../components/GlowingFlightPaths";
import { Sidebar } from "../components/Sidebar";
import { UnifiedLegend } from "../components/Legend";
import { WindLayer } from "./windLayer";
import { TemperatureLayer } from "./TemperatureLayer";
import { PrecipitationLayer } from "./PrecipitationLayer";
import { FogLayer } from "./FogLayer";
import { MoistureLayer } from "./MoistureLayer";
import { LightningLayer } from "./LightningLayer";
import { CATLayer } from "./CATLayer";
import { VisibilityLayer } from "./VisibilityLayer";
import titleImage from "../assets/title.png";

import {
  BufferGeometry,
  Color,
  DoubleSide,
  Path,
  Shape,
  ShapeGeometry,
  Vector3,
  Group,
  MeshBasicMaterial,
} from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useAppStore } from "../store/useAppStore";
import type { AtlasData, WorldData } from "../types";
import { deriveIsoCode, latLonToCartesian } from "../utils/geo";
import {
  AIRPORTS,
  FLIGHTS,
  PROVINCE_AIRPORTS,
  getAirportByCode,
  getIcaoCode,
  getRiskColor,
  calculateRiskFromEnvironmentRisk,
} from "../data/flightData";

const GLOBE_RADIUS = 1.6;

// 中国的经纬度（北京）
const CHINA_LAT = 39.9042;
const CHINA_LON = 116.4074;

interface GlobeViewProps {
  world: WorldData;
  atlas: AtlasData;
}

interface PolygonLine {
  id: string;
  iso: string | null;
  points: Vector3[];
  key?: string; // 省份的 key（如 CN-北京），用于省份级别的选中
}

interface PolygonFill {
  id: string;
  iso: string | null;
  geometry: BufferGeometry;
  key?: string; // 省份的 key（如 CN-北京），用于省份级别的选中
}

interface LabelCandidate {
  key: string;
  iso: string | null;
  fallbackName: string | null;
  position: Vector3;
}

interface CountryLabel {
  key: string;
  iso: string | null;
  name: string;
  position: Vector3;
}

// 使用统一数据源中的Airport接口
import type { Airport } from "../data/flightData";

// Airport接口已经包含了所有需要的字段，直接使用
type AirportParticle = Airport;

// 国家代码映射表：从可能的ISO代码格式映射到标准ISO_A2格式
const COUNTRY_CODE_MAP: Record<string, string> = {
  CN: "CN",
  CHN: "CN",
  CHINA: "CN",
  US: "US",
  USA: "US",
  "UNITED STATES": "US",
  GB: "GB",
  GBR: "GB",
  UK: "GB",
  "UNITED KINGDOM": "GB",
  AE: "AE",
  ARE: "AE",
  UAE: "AE",
  "UNITED ARAB EMIRATES": "AE",
  AU: "AU",
  AUS: "AU",
  AUSTRALIA: "AU",
  JP: "JP",
  JPN: "JP",
  JAPAN: "JP",
  DE: "DE",
  DEU: "DE",
  GERMANY: "DE",
  FR: "FR",
  FRA: "FR",
  FRANCE: "FR",
  SG: "SG",
  SGP: "SG",
  SINGAPORE: "SG",
  KR: "KR",
  KOR: "KR",
  "SOUTH KOREA": "KR",
  TH: "TH",
  THA: "TH",
  THAILAND: "TH",
};

// 标准化国家代码
function normalizeCountryCode(code: string | null): string | null {
  if (!code) return null;
  const upper = code.toUpperCase().trim();
  return COUNTRY_CODE_MAP[upper] || upper;
}

// 使用统一数据源
const DEMO_AIRPORTS: AirportParticle[] = AIRPORTS;

// 解析航班时间（支持完整日期时间或仅时间格式，按 GMT+8 处理）
// 如果只有时间（如 "11:55"），则使用 2024-07-25 作为日期
function parseFlightDateTime(dateTime: string): Date | null {
  if (!dateTime) return null;

  // 如果包含日期（有空格或包含 "-"），按完整日期时间解析
  if (dateTime.includes(" ") || dateTime.includes("-")) {
    const isoLike = `${dateTime.replace(" ", "T")}+08:00`;
    const d = new Date(isoLike);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  // 如果只有时间（如 "11:55"），添加 2024-07-25 作为日期
  const isoLike = `2024-07-25T${dateTime}+08:00`;
  const d = new Date(isoLike);
  return Number.isNaN(d.getTime()) ? null : d;
}

// 判断航班在给定时间点是否处于起飞与落地之间（正在飞行）
function isFlightActiveAt(
  scheduledDeparture: string,
  scheduledArrival: string,
  at: Date,
): boolean {
  const dep = parseFlightDateTime(scheduledDeparture);
  const arr = parseFlightDateTime(scheduledArrival);
  if (!dep || !arr) return false;
  const t = at.getTime();
  return t >= dep.getTime() && t <= arr.getTime();
}

function sanitizeRing(ring: number[][]): number[][] {
  if (ring.length > 1) {
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first[0] === last[0] && first[1] === last[1]) {
      return ring.slice(0, -1);
    }
  }
  return ring;
}

export function GlobeView({ world, atlas }: GlobeViewProps) {
  const {
    selectedCountry,
    hoveredCountry,
    hoveredAirport,
    hoveredFlightRoute,
    tooltipPosition,
    viewingAirportId,
    selectedFlightRouteId,
    setSelectedFlightRouteId,
    selectedAirportForAirline,
    setSelectedAirportForAirline,
    setViewingAirportId,
    showWindLayer,
    showTemperatureLayer,
    showPrecipitationLayer,
    showFogLayer,
    showMoistureLayer,
    showLightningLayer,
    showCATLayer,
    showVisibilityLayer,
    showLabels,
    showPreferencesMenu,
    setShowPreferencesMenu,
    airportCodeFormat,
    setAirportCodeFormat,
    riskZones,
    homeObjectTab,
    timelineCurrentTime,
    flightStatuses,
  } = useAppStore();
  const preferencesMenuRef = useRef<HTMLDivElement>(null);
  const loginStatusRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        preferencesMenuRef.current &&
        !preferencesMenuRef.current.contains(event.target as Node) &&
        loginStatusRef.current &&
        !loginStatusRef.current.contains(event.target as Node)
      ) {
        setShowPreferencesMenu(false);
      }
    };

    if (showPreferencesMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showPreferencesMenu, setShowPreferencesMenu]);
  const orbitControlsRef = useRef<OrbitControlsImpl | null>(null);
  const globeGroupRef = useRef<Group>(null);
  const isInteractingRef = useRef(false);

  // 当前时间状态
  const [currentTime, setCurrentTime] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  });

  // 定期更新时间
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      setCurrentTime(`${year}-${month}-${day} ${hours}:${minutes}`);
    };

    // 立即更新一次
    updateTime();

    // 每分钟更新一次
    const interval = setInterval(updateTime, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const controls = orbitControlsRef.current;
    if (!controls) return;
    const onStart = () => {
      isInteractingRef.current = true;
    };
    const onEnd = () => {
      isInteractingRef.current = false;
    };
    controls.addEventListener("start", onStart);
    controls.addEventListener("end", onEnd);
    return () => {
      controls.removeEventListener("start", onStart);
      controls.removeEventListener("end", onEnd);
    };
  }, []);

  // 用于区分点击和拖动的状态
  const pointerStateRef = useRef<{
    downTime: number;
    downX: number;
    downY: number;
    moved: boolean;
    targetIso: string | null;
  } | null>(null);

  // 跟踪空白区域的点击状态（用于区分点击和拖动）
  const blankAreaPointerStateRef = useRef<{
    downTime: number;
    downX: number;
    downY: number;
    moved: boolean;
  } | null>(null);

  // 创建点击/拖动处理函数
  const createPointerHandlers = useCallback(
    (iso: string | null, onSelect: () => void) => {
      return {
        onPointerDown: (event: ThreeEvent<PointerEvent>) => {
          event.stopPropagation();
          // 从原生事件中获取坐标
          const nativeEvent =
            event.nativeEvent || (event as unknown as PointerEvent);
          const clientX = nativeEvent.clientX ?? 0;
          const clientY = nativeEvent.clientY ?? 0;
          pointerStateRef.current = {
            downTime: Date.now(),
            downX: clientX,
            downY: clientY,
            moved: false,
            targetIso: iso,
          };
        },
        onPointerMove: (event: ThreeEvent<PointerEvent>) => {
          if (!pointerStateRef.current) return;
          const nativeEvent =
            event.nativeEvent || (event as unknown as PointerEvent);
          const clientX = nativeEvent.clientX ?? 0;
          const clientY = nativeEvent.clientY ?? 0;
          const deltaX = Math.abs(clientX - pointerStateRef.current.downX);
          const deltaY = Math.abs(clientY - pointerStateRef.current.downY);
          // 如果移动距离超过 5 像素，认为是拖动
          if (deltaX > 5 || deltaY > 5) {
            pointerStateRef.current.moved = true;
          }
        },
        onPointerUp: (event: ThreeEvent<PointerEvent>) => {
          if (!pointerStateRef.current) return;
          const state = pointerStateRef.current;
          const duration = Date.now() - state.downTime;
          const nativeEvent =
            event.nativeEvent || (event as unknown as PointerEvent);
          const clientX = nativeEvent.clientX ?? 0;
          const clientY = nativeEvent.clientY ?? 0;
          const deltaX = Math.abs(clientX - state.downX);
          const deltaY = Math.abs(clientY - state.downY);
          const moved = state.moved || deltaX > 5 || deltaY > 5;

          // 只有在短按（< 200ms）且没有移动的情况下才选中
          if (!moved && duration < 200 && state.targetIso === iso) {
            onSelect();
          }

          pointerStateRef.current = null;
        },
      };
    },
    [],
  );

  const { linePolygons, fillPolygons, labelCandidates } = useMemo<{
    linePolygons: PolygonLine[];
    fillPolygons: PolygonFill[];
    labelCandidates: LabelCandidate[];
  }>(() => {
    const lines: PolygonLine[] = [];
    const fills: PolygonFill[] = [];
    const labelsMap = new Map<
      string,
      {
        iso: string | null;
        fallbackName: string | null;
        position: Vector3;
      }
    >();
    // 用于计算每个国家的加权中心
    const countryCenters = new Map<
      string,
      {
        weightedCenter: Vector3;
        totalWeight: number;
        iso: string | null;
        fallbackName: string | null;
      }
    >();

    world.features.forEach((feature, featureIndex) => {
      const iso = deriveIsoCode(feature);
      const featureName =
        typeof feature.properties?.name === "string"
          ? feature.properties.name
          : null;
      const { geometry } = feature;

      const processPolygon = (rings: number[][][], polygonIndex: number) => {
        const cleanedRings = rings.map((ring) =>
          sanitizeRing(ring as number[][]),
        );
        if (!cleanedRings.length) return;

        const cartesianRings = cleanedRings.map((ring) =>
          ring.map(([lon, lat]) =>
            latLonToCartesian(lat, lon, GLOBE_RADIUS + 0.003),
          ),
        );

        // 计算省份的 key（如果是中国省份）
        const provinceKey =
          iso === "CN" && featureName ? `CN-${featureName}` : undefined;

        cartesianRings.forEach((ring, ringIndex) => {
          if (ring.length < 2) return;
          const isClosed = ring[0]?.equals(
            ring[ring.length - 1] ?? new Vector3(),
          );
          const points = isClosed ? ring : [...ring, ring[0]];
          lines.push({
            id: `${featureIndex}-${polygonIndex}-${ringIndex}`,
            iso,
            points,
            key: provinceKey,
          });
        });

        const outerOriginal = cleanedRings[0];
        if (!outerOriginal || outerOriginal.length < 3) return;

        const shape = new Shape();
        shape.moveTo(outerOriginal[0][0], outerOriginal[0][1]);
        outerOriginal.slice(1).forEach(([lon, lat]) => {
          shape.lineTo(lon, lat);
        });
        shape.closePath();

        cleanedRings.slice(1).forEach((ring) => {
          if (ring.length < 3) return;
          const hole = new Path();
          hole.moveTo(ring[0][0], ring[0][1]);
          ring.slice(1).forEach(([lon, lat]) => {
            hole.lineTo(lon, lat);
          });
          hole.closePath();
          shape.holes.push(hole);
        });

        const geometry = new ShapeGeometry(shape, 16);
        const position = geometry.getAttribute("position");
        for (let i = 0; i < position.count; i++) {
          const lon = position.getX(i);
          const lat = position.getY(i);
          const cartesian = latLonToCartesian(lat, lon, GLOBE_RADIUS - 0.2);
          position.setXYZ(i, cartesian.x, cartesian.y, cartesian.z);
        }
        position.needsUpdate = true;
        geometry.computeVertexNormals();
        geometry.computeBoundingSphere();

        // 计算这个多边形的中心点和权重（使用 boundingSphere 中心更准确）
        const sphere = geometry.boundingSphere;
        if (sphere && sphere.center) {
          const center = sphere.center.clone();

          // 使用 boundingSphere 的半径作为权重（更大的多边形有更大的半径）
          const weight = sphere.radius * sphere.radius; // 使用面积作为权重

          const updateCenter = (
            key: string,
            isoCode: string | null,
            name: string | null,
          ) => {
            const existing = countryCenters.get(key);
            if (!existing) {
              countryCenters.set(key, {
                weightedCenter: center.clone().multiplyScalar(weight),
                totalWeight: weight,
                iso: isoCode,
                fallbackName: name,
              });
            } else {
              existing.weightedCenter.add(
                center.clone().multiplyScalar(weight),
              );
              existing.totalWeight += weight;
            }
          };

          const labelKey =
            iso ?? featureName ?? `${featureIndex}-${polygonIndex}`;

          if (iso === "CN" && featureName) {
            // 1. 省份标签
            updateCenter(`CN-${featureName}`, iso, featureName);
            // 2. 国家标签 (聚合) - fallbackName 为 null，以便后续使用 atlas 中的国家名
            updateCenter("CN", iso, null);
          } else {
            updateCenter(labelKey, iso, featureName);
          }
        }

        fills.push({
          id: `fill-${featureIndex}-${polygonIndex}`,
          iso,
          geometry,
          key: provinceKey,
        });
      };

      if (geometry.type === "Polygon") {
        processPolygon(geometry.coordinates as number[][][], 0);
      } else if (geometry.type === "MultiPolygon") {
        (geometry.coordinates as number[][][][]).forEach(
          (polygon, polygonIndex) => {
            processPolygon(polygon as number[][][], polygonIndex);
          },
        );
      }
    });

    // 计算每个国家的加权中心并转换为标签位置
    countryCenters.forEach((data, labelKey) => {
      const finalCenter = data.weightedCenter
        .clone()
        .divideScalar(data.totalWeight);
      const normalizedCenter = finalCenter.clone().normalize();
      const labelPosition = normalizedCenter.multiplyScalar(
        GLOBE_RADIUS + 0.08,
      );

      labelsMap.set(labelKey, {
        iso: data.iso,
        fallbackName: data.fallbackName,
        position: labelPosition,
      });
    });

    const labelCandidates: LabelCandidate[] = Array.from(
      labelsMap.entries(),
    ).map(([key, value]) => ({
      key,
      iso: value.iso,
      fallbackName: value.fallbackName,
      position: value.position,
    }));

    return { linePolygons: lines, fillPolygons: fills, labelCandidates };
  }, [world]);

  const countryLabels = useMemo<CountryLabel[]>(() => {
    return labelCandidates
      .map(({ key, iso, fallbackName, position }) => {
        // 如果是中国的省份（key 以 CN- 开头），直接使用 fallbackName
        if (key.startsWith("CN-") && fallbackName) {
          return { key, iso, position, name: fallbackName };
        }

        const country = iso ? atlas.countries[iso] : undefined;
        const name = country?.name ?? fallbackName;
        if (!name) return null;
        return { key, iso, position, name };
      })
      .filter((value): value is CountryLabel => value !== null);
  }, [atlas.countries, labelCandidates]);

  // 共享的机场编码映射（从航班数据 + CSV 加载），避免每个 AirportParticle 独立加载
  const baseAirportCodeMap = useMemo(() => {
    const map: Record<string, string> = {};
    FLIGHTS.forEach((flight) => {
      if (flight.fromAirportCode3 && flight.fromAirportCode4) {
        map[flight.fromAirportCode3] = flight.fromAirportCode4;
      }
      if (flight.toAirportCode3 && flight.toAirportCode4) {
        map[flight.toAirportCode3] = flight.toAirportCode4;
      }
    });
    return map;
  }, []);

  const [sharedFullCodeMap, setSharedFullCodeMap] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    const loadFullCodeMap = async () => {
      try {
        const response = await fetch("/data.csv");
        const text = await response.text();
        const lines = text.split("\n");
        if (lines.length < 2) return;

        const headers = lines[0].split(",");
        const fromCode3Idx = headers.findIndex((h) =>
          h.includes("起飞机场三字码"),
        );
        const fromCode4Idx = headers.findIndex((h) =>
          h.includes("起飞机场四字码"),
        );
        const toCode3Idx = headers.findIndex((h) =>
          h.includes("降落机场三字码"),
        );
        const toCode4Idx = headers.findIndex((h) =>
          h.includes("降落机场四字码"),
        );

        if (
          fromCode3Idx === -1 ||
          fromCode4Idx === -1 ||
          toCode3Idx === -1 ||
          toCode4Idx === -1
        )
          return;

        const map: Record<string, string> = {};
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          const row: string[] = [];
          let current = "";
          let inQuotes = false;
          for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === "," && !inQuotes) {
              row.push(current);
              current = "";
            } else {
              current += char;
            }
          }
          row.push(current);

          if (
            row.length <=
            Math.max(fromCode3Idx, fromCode4Idx, toCode3Idx, toCode4Idx)
          )
            continue;

          const fromCode3 = row[fromCode3Idx]?.trim();
          const fromCode4 = row[fromCode4Idx]?.trim();
          if (
            fromCode3 &&
            fromCode4 &&
            fromCode3 !== "nan" &&
            fromCode4 !== "nan"
          ) {
            if (!map[fromCode3]) map[fromCode3] = fromCode4;
          }
          const toCode3 = row[toCode3Idx]?.trim();
          const toCode4 = row[toCode4Idx]?.trim();
          if (toCode3 && toCode4 && toCode3 !== "nan" && toCode4 !== "nan") {
            if (!map[toCode3]) map[toCode3] = toCode4;
          }
        }
        setSharedFullCodeMap(map);
      } catch (error) {
        console.error("加载完整机场编码映射失败:", error);
      }
    };
    loadFullCodeMap();
  }, []);

  const sharedAirportCodeMap = useMemo(() => {
    return { ...baseAirportCodeMap, ...sharedFullCodeMap };
  }, [baseAirportCodeMap, sharedFullCodeMap]);

  const airportInstances = useMemo(() => {
    // 如果选中了航线，需要获取该航线的起降机场ID，确保它们可见
    let requiredAirportIds: string[] = [];
    if (selectedFlightRouteId) {
      const flight = FLIGHTS.find((f) => f.id === selectedFlightRouteId);
      if (flight) {
        const fromAirport = getAirportByCode(flight.fromAirport);
        const toAirport = getAirportByCode(flight.toAirport);
        if (fromAirport) requiredAirportIds.push(fromAirport.id);
        if (toAirport) requiredAirportIds.push(toAirport.id);
      }
    }

    // 如果正在查看某个机场，需要获取与该机场相关的航线的起降机场ID，确保它们可见
    if (viewingAirportId && !selectedFlightRouteId) {
      const viewingAirport = AIRPORTS.find((a) => a.id === viewingAirportId);
      if (viewingAirport) {
        // 筛选与该机场相关的航班（起飞机场或降落机场），并根据状态筛选
        const relevantFlights = FLIGHTS.filter((flight) => {
          const related =
            flight.fromAirport === viewingAirport.code ||
            flight.toAirport === viewingAirport.code;
          if (!related) return false;

          // 应用状态过滤：如果用户选择了状态，则只显示匹配状态的航班
          if (
            flightStatuses.length > 0 &&
            !flightStatuses.includes(flight.status)
          ) {
            return false;
          }

          return true;
        });

        // 收集所有相关的机场ID
        relevantFlights.forEach((flight) => {
          const fromAirport = getAirportByCode(flight.fromAirport);
          const toAirport = getAirportByCode(flight.toAirport);
          if (fromAirport) requiredAirportIds.push(fromAirport.id);
          if (toAirport) requiredAirportIds.push(toAirport.id);
        });
        // 去重
        requiredAirportIds = [...new Set(requiredAirportIds)];
      }
    }

    return DEMO_AIRPORTS.filter((airport) => {
      // 如果选中了航线，只显示起降机场
      if (selectedFlightRouteId) {
        return requiredAirportIds.includes(airport.id);
      }

      // 如果选中了机场，显示选中的机场和航线相关的机场
      if (selectedAirportForAirline) {
        return (
          airport.id === selectedAirportForAirline ||
          requiredAirportIds.includes(airport.id)
        );
      }

      // 根据风险区间过滤机场（人员tab不受影响）
      if (homeObjectTab !== "personnel") {
        const { riskZone } = calculateRiskFromEnvironmentRisk(
          airport.environmentRisk,
        );
        if (!riskZones.includes(riskZone)) return false;
      }
      return true;
    }).map((airport) => {
      const position = latLonToCartesian(
        airport.lat,
        airport.lon,
        GLOBE_RADIUS + 0.01,
      );
      return { ...airport, position };
    });
  }, [
    riskZones,
    homeObjectTab,
    selectedAirportForAirline,
    selectedFlightRouteId,
    viewingAirportId,
    flightStatuses,
  ]);

  // O(1) 机场查找 Map
  const airportInstanceMap = useMemo(() => {
    const map = new Map<string, (typeof airportInstances)[0]>();
    for (const a of airportInstances) {
      map.set(a.id, a);
    }
    return map;
  }, [airportInstances]);

  // 计算航线：基于统一的航班数据生成航线
  const flightRoutes = useMemo(() => {
    const routes: Array<{
      id: string;
      from: Vector3;
      to: Vector3;
      color: string;
      fromIsSelected: boolean;
      toIsSelected: boolean;
      flightNumber: string;
      fromAirport: string;
      toAirport: string;
      status: string;
      scheduledDeparture: string;
      scheduledArrival: string;
      humanRisk: number;
      machineRisk: number;
      environmentRisk: number;
      riskLevel?: string;
    }> = [];

    const activeTime = timelineCurrentTime;

    // 情况1: 如果选中了特定航线，只显示该航线
    // 注意：当用户明确选中航线时，应该忽略时间过滤和风险区间过滤，确保显示该航线
    if (selectedFlightRouteId) {
      const flight = FLIGHTS.find((f) => f.id === selectedFlightRouteId);
      if (flight) {
        // 不再检查时间过滤，因为用户已经明确选择了这条航线
        // if (!isFlightActiveAt(flight.scheduledDeparture, flight.scheduledArrival, activeTime)) {
        //   return routes
        // }
        const fromAirport = getAirportByCode(flight.fromAirport);
        const toAirport = getAirportByCode(flight.toAirport);

        if (fromAirport && toAirport) {
          const fromAirportInstance = airportInstanceMap.get(fromAirport.id);
          const toAirportInstance = airportInstanceMap.get(toAirport.id);

          if (fromAirportInstance && toAirportInstance) {
            // 标准化国家代码（用于判断是否选中）
            const normalizedSelectedCountry = selectedCountry
              ? normalizeCountryCode(selectedCountry)
              : null;
            const fromIsSelected = !!(
              normalizedSelectedCountry &&
              normalizeCountryCode(fromAirport.countryCode) ===
                normalizedSelectedCountry
            );
            const toIsSelected = !!(
              normalizedSelectedCountry &&
              normalizeCountryCode(toAirport.countryCode) ===
                normalizedSelectedCountry
            );

            // 不再使用上升效果，直接使用原始位置
            const fromPos = fromAirportInstance.position.clone();
            const fromElevated = fromPos;

            const toPos = toAirportInstance.position.clone();
            const toElevated = toPos;

            // 不再根据风险区间过滤航线，因为用户已经明确选择了这条航线
            // const { riskZone: flightRiskZone } = calculateRiskFromEnvironmentRisk(flight.environmentRisk)
            // if (!riskZones.includes(flightRiskZone)) {
            //   return
            // }

            // 根据环境风险值设置航线颜色
            const routeColor = getRiskColor(flight.environmentRisk);

            routes.push({
              id: `${fromAirport.id}-${toAirport.id}-${flight.id}`,
              from: fromElevated,
              to: toElevated,
              color: routeColor, // 根据环境风险值设置颜色
              fromIsSelected,
              toIsSelected,
              flightNumber: flight.flightNumber,
              fromAirport: fromAirport.name,
              toAirport: toAirport.name,
              status: flight.status,
              scheduledDeparture: flight.scheduledDeparture,
              scheduledArrival: flight.scheduledArrival,
              humanRisk: flight.humanRisk,
              machineRisk: flight.machineRisk,
              environmentRisk: flight.environmentRisk,
              riskLevel: flight.riskLevel,
            });
          }
        }
      }
      return routes;
    }

    // 情况2: 如果正在查看某个机场，显示该机场的所有航线（根据状态筛选）
    // 注意：当用户明确选择机场时，应该应用状态过滤，但可以忽略时间过滤和风险区间过滤
    if (viewingAirportId) {
      const viewingAirport = AIRPORTS.find((a) => a.id === viewingAirportId);
      if (!viewingAirport) return routes;

      // 筛选与该机场相关的航班（起飞机场或降落机场）
      const relevantFlights = FLIGHTS.filter((flight) => {
        const related =
          flight.fromAirport === viewingAirport.code ||
          flight.toAirport === viewingAirport.code;
        if (!related) return false;

        // 应用状态过滤：如果用户选择了状态，则只显示匹配状态的航班
        if (
          flightStatuses.length > 0 &&
          !flightStatuses.includes(flight.status)
        ) {
          return false;
        }

        // 不再检查时间过滤，因为用户已经明确选择了机场和状态，应该显示所有匹配的航线
        // return isFlightActiveAt(flight.scheduledDeparture, flight.scheduledArrival, activeTime)
        return true;
      });

      relevantFlights.forEach((flight) => {
        const fromAirport = getAirportByCode(flight.fromAirport);
        const toAirport = getAirportByCode(flight.toAirport);

        if (!fromAirport || !toAirport) return;

        const fromAirportInstance = airportInstanceMap.get(fromAirport.id);
        const toAirportInstance = airportInstanceMap.get(toAirport.id);

        if (!fromAirportInstance || !toAirportInstance) return;

        const fromPos = fromAirportInstance.position.clone();
        const toPos = toAirportInstance.position.clone();

        // 如果机场在选中的国家，则升起
        const normalizedSelectedCountry = selectedCountry
          ? normalizeCountryCode(selectedCountry)
          : null;
        const fromIsSelected =
          normalizedSelectedCountry &&
          normalizeCountryCode(fromAirport.countryCode) ===
            normalizedSelectedCountry;
        const toIsSelected =
          normalizedSelectedCountry &&
          normalizeCountryCode(toAirport.countryCode) ===
            normalizedSelectedCountry;

        // 不再使用上升效果，直接使用原始位置
        const fromElevated = fromPos;
        const toElevated = toPos;

        // 不再根据风险区间过滤航线，因为用户已经明确选择了机场，应该显示所有匹配的航线
        // const { riskZone: flightRiskZone } = calculateRiskFromEnvironmentRisk(flight.environmentRisk)
        // if (!riskZones.includes(flightRiskZone)) {
        //   return
        // }

        // 根据环境风险值设置航线颜色
        const routeColor = getRiskColor(flight.environmentRisk);

        routes.push({
          id: `${fromAirport.id}-${toAirport.id}-${flight.id}`,
          from: fromElevated,
          to: toElevated,
          color: routeColor, // 根据环境风险值设置颜色
          fromIsSelected: !!fromIsSelected,
          toIsSelected: !!toIsSelected,
          flightNumber: flight.flightNumber,
          fromAirport: fromAirport.name,
          toAirport: toAirport.name,
          status: flight.status,
          scheduledDeparture: flight.scheduledDeparture,
          scheduledArrival: flight.scheduledArrival,
          humanRisk: flight.humanRisk,
          machineRisk: flight.machineRisk,
          environmentRisk: flight.environmentRisk,
          riskLevel: flight.riskLevel,
        });
      });

      return routes;
    }

    // 情况3: 如果选中了机场但没有查看机场ID，不显示任何航线
    // 当用户选中机场但没有viewingAirportId时，只显示该机场，不显示任何航线
    if (selectedAirportForAirline && !viewingAirportId) {
      return routes;
    }

    // 情况4: 默认情况
    // 根据是否选中国家/省份决定显示哪些航线：
    // - 未选中国家/省份：显示所有航线
    // - 选中国家：仅显示与该国家相关的航线（起飞或降落机场位于该国）
    // - 选中省份（如 CN-北京市）：仅显示与该省份机场相关的航线
    const allFlights = FLIGHTS;
    const normalizedSelectedCountry = selectedCountry
      ? (() => {
          // 如果是中国省份 key（例如 CN-北京市），仍然需要知道对应国家（CN）
          if (selectedCountry.startsWith("CN-")) return "CN";
          return normalizeCountryCode(selectedCountry);
        })()
      : null;

    allFlights.forEach((flight) => {
      // 仅在当前时间点处于飞行中的航班才显示
      if (
        !isFlightActiveAt(
          flight.scheduledDeparture,
          flight.scheduledArrival,
          activeTime,
        )
      ) {
        return;
      }

      // 应用状态过滤：如果用户选择了状态，则只显示匹配状态的航班
      if (
        flightStatuses.length > 0 &&
        !flightStatuses.includes(flight.status)
      ) {
        return;
      }

      const fromAirport = getAirportByCode(flight.fromAirport);
      const toAirport = getAirportByCode(flight.toAirport);

      // 如果机场不在列表中，跳过
      if (!fromAirport || !toAirport) return;

      // 如果有选中国家/省份，则只保留与该国家/省份相关的航线
      if (normalizedSelectedCountry) {
        const fromCountry = normalizeCountryCode(fromAirport.countryCode);
        const toCountry = normalizeCountryCode(toAirport.countryCode);

        // 先按国家过滤（必须至少一端在该国家）
        if (
          fromCountry !== normalizedSelectedCountry &&
          toCountry !== normalizedSelectedCountry
        ) {
          return;
        }

        // 如果选中的是具体省份（如 CN-北京市），进一步按省份下的机场过滤
        if (
          selectedCountry &&
          selectedCountry.startsWith &&
          selectedCountry.startsWith("CN-")
        ) {
          const provinceAirports = PROVINCE_AIRPORTS[selectedCountry] || [];
          const fromInProvince = provinceAirports.includes(fromAirport.code);
          const toInProvince = provinceAirports.includes(toAirport.code);

          // 起点和终点都不在该省份，则不显示这条航线
          if (!fromInProvince && !toInProvince) {
            return;
          }
        }
      }

      // 查找对应的airportInstances（包含position）
      const fromAirportInstance = airportInstances.find(
        (a) => a.id === fromAirport.id,
      );
      const toAirportInstance = airportInstances.find(
        (a) => a.id === toAirport.id,
      );

      if (!fromAirportInstance || !toAirportInstance) return;

      // 标准化国家代码（用于判断是否选中）
      const normalizedFromCountry = normalizeCountryCode(
        fromAirport.countryCode,
      );
      const normalizedToCountry = normalizeCountryCode(toAirport.countryCode);
      const fromIsSelected = !!(
        normalizedSelectedCountry &&
        normalizedFromCountry === normalizedSelectedCountry
      );
      const toIsSelected = !!(
        normalizedSelectedCountry &&
        normalizedToCountry === normalizedSelectedCountry
      );

      // 不再使用上升效果，直接使用原始位置
      const fromPos = fromAirportInstance.position.clone();
      const fromElevated = fromPos;

      const toPos = toAirportInstance.position.clone();
      const toElevated = toPos;

      // airports tab 不显示航线
      if (homeObjectTab === "airports") {
        return;
      }
      // 根据风险区间过滤航线（人员tab不受影响）
      if (homeObjectTab !== "personnel") {
        const { riskZone: flightRiskZone } = calculateRiskFromEnvironmentRisk(
          flight.environmentRisk,
        );
        if (!riskZones.includes(flightRiskZone)) {
          return;
        }
      }

      // 根据环境风险值设置航线颜色
      const routeColor = getRiskColor(flight.environmentRisk);

      routes.push({
        id: `${fromAirport.id}-${toAirport.id}-${flight.id}`, // 使用航班ID确保唯一性
        from: fromElevated,
        to: toElevated,
        color: routeColor, // 根据环境风险值设置颜色
        fromIsSelected,
        toIsSelected,
        flightNumber: flight.flightNumber,
        fromAirport: fromAirport.name,
        toAirport: toAirport.name,
        status: flight.status,
        scheduledDeparture: flight.scheduledDeparture,
        scheduledArrival: flight.scheduledArrival,
        humanRisk: flight.humanRisk,
        machineRisk: flight.machineRisk,
        environmentRisk: flight.environmentRisk,
        riskLevel: flight.riskLevel,
      });
    });

    return routes;
  }, [
    selectedCountry,
    airportInstanceMap,
    viewingAirportId,
    selectedFlightRouteId,
    selectedAirportForAirline,
    riskZones,
    homeObjectTab,
    timelineCurrentTime,
    flightStatuses,
  ]);

  // 使用 useMemo 缓存颜色对象，避免每次渲染创建新对象
  const baseColor = useMemo(() => new Color("#ffffff"), []);
  const hoverColor = useMemo(() => new Color("#facc15"), []);
  const highlightColor = useMemo(() => new Color("#eab308"), []);

  return (
    <div className="view-root">
      {/* 侧边栏 */}
      <Sidebar />
      {/* 标题覆盖层 */}
      <div className="canvas-title-overlay">
        <img
          src={titleImage}
          alt="航空预测风险可视化大屏"
          className="title-image"
        />
        <div className="title-content-wrapper">
          <div className="title-left-info">
            <div className="current-time">{currentTime}</div>
            <div className="data-update-info">
              <svg
                className="refresh-icon"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
              </svg>
              <span>数据更新</span>
            </div>
          </div>
          <div className="title-right-info" ref={loginStatusRef}>
            <div
              className="login-status-clickable"
              onClick={() => setShowPreferencesMenu(!showPreferencesMenu)}
            >
              <span style={{ color: "#C4C4C4" }}>登录状态：</span>
              <span className="login-user">admin</span>
              <span className="login-role">(高级管理)</span>
            </div>
            {/* 偏好设置菜单 */}
            {showPreferencesMenu && (
              <div
                className="preferences-menu"
                ref={preferencesMenuRef}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="preferences-menu-title">偏好设置</div>
                <div className="preferences-menu-section">
                  <div className="preferences-menu-section-title">机场编码</div>
                  <div className="preferences-menu-options">
                    <label className="preferences-menu-option">
                      <input
                        type="radio"
                        name="airportCode"
                        value="three"
                        checked={airportCodeFormat === "three"}
                        onChange={() => setAirportCodeFormat("three")}
                      />
                      <span>三字码</span>
                    </label>
                    <label className="preferences-menu-option">
                      <input
                        type="radio"
                        name="airportCode"
                        value="four"
                        checked={airportCodeFormat === "four"}
                        onChange={() => setAirportCodeFormat("four")}
                      />
                      <span>四字码</span>
                    </label>
                  </div>
                </div>
                <div className="preferences-menu-footer">
                  <span className="preferences-menu-logout">退出登录</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* 时间轴已移至 HomePage 底部条 */}
      {/* 无航线提示 */}
      {flightRoutes &&
        ((viewingAirportId && flightRoutes.length === 0) ||
          (selectedFlightRouteId && flightRoutes.length === 0)) && (
          <div className="globe-empty-routes-hint">
            <div className="empty-routes-content">
              <div className="empty-routes-icon">✈️</div>
              <div className="empty-routes-title">暂无航线数据</div>
              <div className="empty-routes-message">
                {viewingAirportId
                  ? "该机场当前没有可显示的航线"
                  : "当前选中的航线无法在地图上显示"}
              </div>
            </div>
          </div>
        )}
      {/* Tooltip 组件 */}
      {(hoveredAirport || hoveredFlightRoute) && tooltipPosition && (
        <div
          className="globe-tooltip"
          style={{
            position: "fixed",
            left: `${tooltipPosition.x + 15}px`,
            top: `${tooltipPosition.y + 15}px`,
            zIndex: 1000,
          }}
        >
          {hoveredAirport && (
            <div className="tooltip-content tooltip-glass-card">
              <div className="tooltip-glass-header">
                <span className="tooltip-selected-tag">
                  SELECTED · {hoveredAirport.airportCode}
                </span>
              </div>
              <div className="tooltip-glass-name">
                {hoveredAirport.airportName}
              </div>
              <div className="tooltip-glass-risk">
                <span
                  className="tooltip-glass-risk-val"
                  style={{
                    color:
                      hoveredAirport.environmentRisk >= 7
                        ? "#FF3957"
                        : hoveredAirport.environmentRisk >= 5
                          ? "#FFA033"
                          : "#65EB7B",
                  }}
                >
                  {hoveredAirport.environmentRisk.toFixed(1)}
                </span>
                <span className="tooltip-glass-risk-max">/ 10.0 RISK</span>
              </div>
              <div className="tooltip-glass-desc">
                {hoveredAirport.environmentRisk >= 7 ? "出港延误" : "运行正常"}{" "}
                · {hoveredAirport.flightCount} 航班受影响 ·{" "}
                {hoveredAirport.operatorCount} 执飞单位
              </div>
            </div>
          )}
          {hoveredFlightRoute &&
            (() => {
              const maxRisk = Math.max(
                hoveredFlightRoute.humanRisk,
                hoveredFlightRoute.machineRisk,
                hoveredFlightRoute.environmentRisk,
              );
              return (
                <div className="tooltip-content tooltip-glass-card">
                  <div className="tooltip-glass-header">
                    <span className="tooltip-selected-tag">
                      FLIGHT · {hoveredFlightRoute.flightNumber}
                    </span>
                  </div>
                  <div className="tooltip-glass-name">
                    {getIcaoCode(hoveredFlightRoute.fromAirport)} →{" "}
                    {getIcaoCode(hoveredFlightRoute.toAirport)}
                  </div>
                  <div className="tooltip-glass-risk">
                    <span
                      className="tooltip-glass-risk-val"
                      style={{
                        color:
                          maxRisk >= 7
                            ? "#FF3957"
                            : maxRisk >= 5
                              ? "#FFA033"
                              : "#65EB7B",
                      }}
                    >
                      {maxRisk.toFixed(1)}
                    </span>
                    <span className="tooltip-glass-risk-max">/ 10.0 RISK</span>
                  </div>
                  <div className="tooltip-glass-desc">
                    {hoveredFlightRoute.status} · 人
                    {hoveredFlightRoute.humanRisk} · 机
                    {hoveredFlightRoute.machineRisk} · 环
                    {hoveredFlightRoute.environmentRisk}
                  </div>
                </div>
              );
            })()}
        </div>
      )}
      {/* 统一图例面板 */}
      <UnifiedLegend
        activeLayers={{
          wind: showWindLayer,
          temperature: showTemperatureLayer,
          precipitation: showPrecipitationLayer,
          fog: showFogLayer,
          moisture: showMoistureLayer,
          lightning: showLightningLayer,
          cat: showCATLayer,
          visibility: showVisibilityLayer,
        }}
      />
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        performance={{ min: 0.5 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          stencil: false,
          depth: true,
        }}
      >
        <color attach="background" args={["#000000"]} />
        <Stars
          radius={300}
          depth={60}
          count={2000}
          factor={8}
          saturation={0}
          fade
          speed={0.5}
        />
        <ambientLight intensity={0.3} />
        <directionalLight position={[4, 6, 2]} intensity={0.5} />
        <StarLights />
        <Suspense fallback={null}>
          <GlobeRotator
            globeGroupRef={globeGroupRef}
            isInteractingRef={isInteractingRef}
            selectedCountry={selectedCountry}
            hoveredCountry={hoveredCountry}
          />
          <group ref={globeGroupRef}>
            <mesh
              renderOrder={-1}
              onPointerDown={(event) => {
                // 记录按下状态，用于区分点击和拖动
                const nativeEvent =
                  event.nativeEvent || (event as unknown as PointerEvent);
                const clientX = nativeEvent.clientX ?? 0;
                const clientY = nativeEvent.clientY ?? 0;
                blankAreaPointerStateRef.current = {
                  downTime: Date.now(),
                  downX: clientX,
                  downY: clientY,
                  moved: false,
                };
              }}
              onPointerMove={(event) => {
                // 检测是否拖动
                if (!blankAreaPointerStateRef.current) return;
                const nativeEvent =
                  event.nativeEvent || (event as unknown as PointerEvent);
                const clientX = nativeEvent.clientX ?? 0;
                const clientY = nativeEvent.clientY ?? 0;
                const deltaX = Math.abs(
                  clientX - blankAreaPointerStateRef.current.downX,
                );
                const deltaY = Math.abs(
                  clientY - blankAreaPointerStateRef.current.downY,
                );
                // 如果移动距离超过 5 像素，认为是拖动
                if (deltaX > 5 || deltaY > 5) {
                  blankAreaPointerStateRef.current.moved = true;
                }
              }}
              onPointerUp={() => {
                // 点击地球空白处（非拖动）取消选中航线/机场
                if (
                  blankAreaPointerStateRef.current &&
                  !blankAreaPointerStateRef.current.moved
                ) {
                  setSelectedFlightRouteId(null);
                  setSelectedAirportForAirline(null);
                  setViewingAirportId(null);
                }
                blankAreaPointerStateRef.current = null;
              }}
            >
              <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
              <meshStandardMaterial
                color="#050505"
                roughness={0.85}
                metalness={0.1}
                transparent={false}
                opacity={1}
                depthWrite={true}
              />
            </mesh>
            {/* 风粒子图层 */}
            {showWindLayer && (
              <WindLayer
                radius={GLOBE_RADIUS + 0.01}
                particleCount={20000}
                trailLength={30}
                speedScale={2.5}
              />
            )}
            {/* 温度热力图图层 */}
            {showTemperatureLayer && (
              <TemperatureLayer
                radius={GLOBE_RADIUS}
                minTemp={-40}
                maxTemp={50}
                opacity={0.75}
                showTemperatureLabels={false}
              />
            )}
            {/* 降水图层 */}
            {showPrecipitationLayer && (
              <PrecipitationLayer radius={GLOBE_RADIUS} opacity={0.75} />
            )}
            {showFogLayer && (
              <FogLayer radius={GLOBE_RADIUS + 0.01} opacity={0.75} />
            )}
            {showMoistureLayer && (
              <MoistureLayer
                radius={GLOBE_RADIUS + 0.01}
                particleCount={20000}
                trailLength={15}
                speedScale={2.5}
              />
            )}
            {showLightningLayer && (
              <LightningLayer radius={GLOBE_RADIUS + 0.01} />
            )}
            {showCATLayer && (
              <CATLayer radius={GLOBE_RADIUS + 0.01} opacity={0.75} />
            )}
            {showVisibilityLayer && (
              <VisibilityLayer radius={GLOBE_RADIUS + 0.01} opacity={0.75} />
            )}
            <group>
              {airportInstances.map((airport) => {
                // 标准化国家代码进行匹配
                const normalizedSelectedCountry = selectedCountry
                  ? normalizeCountryCode(selectedCountry)
                  : null;
                const normalizedAirportCountry = normalizeCountryCode(
                  airport.countryCode,
                );
                const isSelected =
                  normalizedSelectedCountry === normalizedAirportCountry;
                return (
                  <AirportParticle
                    key={airport.id}
                    airport={airport}
                    isSelected={isSelected}
                    airportCodeMap={sharedAirportCodeMap}
                  />
                );
              })}
            </group>
            {/* 航线 - 使用新的发光路径组件 */}
            {flightRoutes && flightRoutes.length > 0 && (
              <GlowingFlightPaths routes={flightRoutes} radius={GLOBE_RADIUS} />
            )}
            {/* 后期处理 - Bloom 泛光效果 */}
            {/* 后期处理 - Bloom 泛光效果 - 降低强度以提升性能 */}
            <EffectComposer>
              <Bloom
                luminanceThreshold={0.7}
                intensity={0.6}
                radius={0.3}
                mipmapBlur
              />
            </EffectComposer>

            {fillPolygons.map(({ id, iso, geometry, key }) => {
              // 支持省份级别的选中：如果 selectedCountry 是省份的 key，或者 selectedCountry 是 iso（非省份情况）
              const isSelected = !!(
                iso &&
                (selectedCountry === iso || (key && selectedCountry === key))
              );
              const isHovered = false; // 禁用国家 hover 效果
              const handlers = createPointerHandlers(iso, () => {
                // 禁用所有地图点击选择功能（包括国家和省份）
                return;
              });
              return (
                <ElevatedPolygon
                  key={id}
                  iso={iso}
                  geometry={geometry}
                  isSelected={isSelected}
                  isHovered={isHovered}
                  baseColor={baseColor}
                  hoverColor={hoverColor}
                  highlightColor={highlightColor}
                  onPointerOver={() => {
                    // 禁用国家 hover 效果
                    // 不执行任何操作
                  }}
                  onPointerOut={() => {
                    // 禁用国家 hover 效果
                    // 不执行任何操作
                  }}
                  onPointerDown={handlers.onPointerDown}
                  onPointerMove={handlers.onPointerMove}
                  onPointerUp={handlers.onPointerUp}
                />
              );
            })}
            {linePolygons.map(({ id, iso, points, key }) => {
              // 支持省份级别的选中：如果 selectedCountry 是省份的 key，或者 selectedCountry 是 iso（非省份情况）
              const isSelected = !!(
                iso &&
                (selectedCountry === iso || (key && selectedCountry === key))
              );
              const isHovered = false; // 禁用国家 hover 效果

              // 直接使用内联函数，createPointerHandlers 已经使用 useCallback 优化
              const handlers = createPointerHandlers(iso, () => {
                // 禁用所有地图点击选择功能（包括国家和省份）
                return;
              });
              return (
                <ElevatedLine
                  key={id}
                  iso={iso}
                  points={points}
                  isSelected={isSelected}
                  isHovered={isHovered}
                  baseColor={baseColor}
                  hoverColor={hoverColor}
                  highlightColor={highlightColor}
                  onPointerOver={() => {
                    // 禁用国家 hover 效果
                    // 不执行任何操作
                  }}
                  onPointerOut={() => {
                    // 禁用国家 hover 效果
                    // 不执行任何操作
                  }}
                  onPointerDown={handlers.onPointerDown}
                  onPointerMove={handlers.onPointerMove}
                  onPointerUp={handlers.onPointerUp}
                />
              );
            })}
            {showLabels &&
              countryLabels.map(({ key, iso, name, position }) => {
                // 过滤逻辑：
                // 1. 省份标签 (CN-xxx)：在选中中国或该省份时显示
                if (key.startsWith("CN-")) {
                  if (selectedCountry !== "CN" && selectedCountry !== key)
                    return null;
                }
                // 2. 中国国家标签 (CN)：仅在未选中中国且未选中任何省份时显示
                if (key === "CN") {
                  if (
                    selectedCountry === "CN" ||
                    (selectedCountry && selectedCountry.startsWith("CN-"))
                  )
                    return null;
                }

                // 直接使用内联函数，createPointerHandlers 已经使用 useCallback 优化
                const handlers = createPointerHandlers(iso, () => {
                  // 禁用所有地图点击选择功能（包括国家和省份）
                  return;
                });
                return (
                  <CountryLabelText
                    key={key}
                    iso={iso}
                    name={name}
                    position={position}
                    isSelected={
                      !!(
                        selectedCountry === key ||
                        (iso && selectedCountry === iso)
                      )
                    }
                    isHovered={!!(iso && hoveredCountry === iso)}
                    onPointerDown={handlers.onPointerDown}
                    onPointerMove={handlers.onPointerMove}
                    onPointerUp={handlers.onPointerUp}
                    onPointerOver={() => {
                      // 禁用国家 hover 效果
                      // 不执行任何操作
                    }}
                    onPointerOut={() => {
                      // 禁用国家 hover 效果
                      // 不执行任何操作
                    }}
                  />
                );
              })}
          </group>
        </Suspense>
        <CameraController
          selectedCountry={selectedCountry}
          countryLabels={countryLabels}
          orbitControlsRef={orbitControlsRef}
          globeGroupRef={globeGroupRef}
          airportInstances={airportInstances}
          flightRoutes={flightRoutes ?? []}
        />
        <OrbitControls
          ref={orbitControlsRef}
          enablePan={false}
          minDistance={2.5}
          maxDistance={8}
        />
      </Canvas>
    </div>
  );
}

export default GlobeView;

interface ElevatedPolygonProps {
  iso: string | null;
  geometry: BufferGeometry;
  isSelected: boolean;
  isHovered: boolean;
  baseColor: Color;
  hoverColor: Color;
  highlightColor: Color;
  onPointerOver: () => void;
  onPointerOut: () => void;
  onPointerDown: (event: ThreeEvent<PointerEvent>) => void;
  onPointerMove: (event: ThreeEvent<PointerEvent>) => void;
  onPointerUp: (event: ThreeEvent<PointerEvent>) => void;
}

function ElevatedPolygon({
  iso: _iso, // eslint-disable-line @typescript-eslint/no-unused-vars
  geometry,
  isSelected,
  isHovered,
  baseColor,
  hoverColor,
  highlightColor,
  onPointerOver,
  onPointerOut,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: ElevatedPolygonProps) {
  const { camera } = useThree();
  const groupRef = useRef<Group>(null);
  const tempCameraDir = useMemo(() => new Vector3(), []);
  const tempCentroidDir = useMemo(() => new Vector3(), []);
  const isVisibleRef = useRef(true);
  const [isVisible, setIsVisible] = useState(true);

  const centroid = useMemo(() => {
    if (!geometry.boundingSphere) {
      geometry.computeBoundingSphere();
    }
    return geometry.boundingSphere?.center ?? new Vector3();
  }, [geometry]);

  // 使用计数器降低可见性检查频率（每3帧检查一次）
  const frameCountRef = useRef(0);
  useFrame(() => {
    if (!groupRef.current) return;

    frameCountRef.current++;
    // 每6帧检查一次可见性
    if (frameCountRef.current % 6 === 0) {
      const cameraDir = tempCameraDir.copy(camera.position).normalize();
      const centroidDir = tempCentroidDir.copy(centroid).normalize();
      const visible = cameraDir.dot(centroidDir) > -0.3;
      if (isVisibleRef.current !== visible) {
        isVisibleRef.current = visible;
        setIsVisible(visible);
        // 直接设置可见性，避免不必要的渲染
        groupRef.current.visible = visible;
      }
    }
  });

  const color = useMemo(
    () => (isSelected ? highlightColor : isHovered ? hoverColor : baseColor),
    [isSelected, isHovered, highlightColor, hoverColor, baseColor],
  );
  const opacity = useMemo(
    () => (isSelected ? 0.7 : isHovered ? 0.4 : 0.15),
    [isSelected, isHovered],
  );

  return (
    <group ref={groupRef}>
      <mesh
        geometry={geometry}
        renderOrder={isSelected ? 10 : 0}
        visible={isVisible}
        onPointerOver={(event) => {
          if (!isVisible) return;
          event.stopPropagation();
          onPointerOver();
        }}
        onPointerOut={(event) => {
          event.stopPropagation();
          onPointerOut();
        }}
        onPointerDown={(event) => {
          if (!isVisible) return;
          event.stopPropagation();
          onPointerDown(event);
        }}
        onPointerMove={(event) => {
          if (!isVisible) return;
          event.stopPropagation();
          onPointerMove(event);
        }}
        onPointerUp={(event) => {
          if (!isVisible) return;
          event.stopPropagation();
          onPointerUp(event);
        }}
      >
        <meshBasicMaterial
          color={color}
          transparent
          opacity={opacity}
          depthTest
          depthWrite={false}
          side={DoubleSide}
        />
      </mesh>
    </group>
  );
}

interface ElevatedLineProps {
  iso: string | null;
  points: Vector3[];
  isSelected: boolean;
  isHovered: boolean;
  baseColor: Color;
  hoverColor: Color;
  highlightColor: Color;
  onPointerOver: () => void;
  onPointerOut: () => void;
  onPointerDown: (event: ThreeEvent<PointerEvent>) => void;
  onPointerMove: (event: ThreeEvent<PointerEvent>) => void;
  onPointerUp: (event: ThreeEvent<PointerEvent>) => void;
}

function ElevatedLine({
  iso: _iso, // eslint-disable-line @typescript-eslint/no-unused-vars
  points,
  isSelected,
  isHovered,
  baseColor,
  hoverColor,
  highlightColor,
  onPointerOver,
  onPointerOut,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: ElevatedLineProps) {
  const { camera } = useThree();
  const groupRef = useRef<Group>(null);
  const tempCameraDir = useMemo(() => new Vector3(), []);
  const tempCentroidDir = useMemo(() => new Vector3(), []);
  const isVisibleRef = useRef(true);
  const [isVisible, setIsVisible] = useState(true);

  const centroid = useMemo(() => {
    const center = new Vector3();
    points.forEach((p) => center.add(p));
    return center.divideScalar(points.length);
  }, [points]);

  // 使用计数器降低可见性检查频率（每3帧检查一次）
  const frameCountRef = useRef(0);
  useFrame(() => {
    if (!groupRef.current) return;

    frameCountRef.current++;
    // 每6帧检查一次可见性
    if (frameCountRef.current % 6 === 0) {
      const cameraDir = tempCameraDir.copy(camera.position).normalize();
      const centroidDir = tempCentroidDir.copy(centroid).normalize();
      const visible = cameraDir.dot(centroidDir) > -0.3;
      if (isVisibleRef.current !== visible) {
        isVisibleRef.current = visible;
        setIsVisible(visible);
        // 直接设置可见性，避免不必要的渲染
        groupRef.current.visible = visible;
      }
    }
  });

  const color = useMemo(
    () => (isSelected ? highlightColor : isHovered ? hoverColor : baseColor),
    [isSelected, isHovered, highlightColor, hoverColor, baseColor],
  );
  const lineWidth = useMemo(
    () => (isSelected ? 1.8 : isHovered ? 1.2 : 0.7),
    [isSelected, isHovered],
  );

  return (
    <group ref={groupRef}>
      <Line
        points={points}
        color={color}
        lineWidth={lineWidth}
        transparent
        opacity={isSelected ? 1 : 0.75}
        renderOrder={isSelected ? 11 : 1}
        visible={isVisible}
        onPointerOver={(event) => {
          if (!isVisible) return;
          event.stopPropagation();
          onPointerOver();
        }}
        onPointerOut={(event) => {
          event.stopPropagation();
          onPointerOut();
        }}
        onPointerDown={(event) => {
          if (!isVisible) return;
          event.stopPropagation();
          onPointerDown(event);
        }}
        onPointerMove={(event) => {
          if (!isVisible) return;
          event.stopPropagation();
          onPointerMove(event);
        }}
        onPointerUp={(event) => {
          if (!isVisible) return;
          event.stopPropagation();
          onPointerUp(event);
        }}
      />
    </group>
  );
}

function CountryLabelText({
  position,
  name,
  iso: _iso, // eslint-disable-line @typescript-eslint/no-unused-vars
  isSelected,
  isHovered,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerOver,
  onPointerOut,
}: {
  position: Vector3;
  name: string;
  iso: string | null;
  isSelected: boolean;
  isHovered: boolean;
  onPointerDown: (event: ThreeEvent<PointerEvent>) => void;
  onPointerMove: (event: ThreeEvent<PointerEvent>) => void;
  onPointerUp: (event: ThreeEvent<PointerEvent>) => void;
  onPointerOver: () => void;
  onPointerOut: () => void;
}) {
  const { gl, camera } = useThree();
  const groupRef = useRef<Group>(null);
  const tempCameraDir = useMemo(() => new Vector3(), []);
  const tempLabelDir = useMemo(() => new Vector3(), []);
  const [isVisible, setIsVisible] = useState(true);

  const labelFrameSkip = useRef(0);
  useFrame(() => {
    if (!groupRef.current) return;
    // 每5帧检查一次可见性
    labelFrameSkip.current++;
    if (labelFrameSkip.current % 5 !== 0) {
      if (isVisible && groupRef.current.visible) {
        groupRef.current.lookAt(camera.position);
      }
      return;
    }
    const cameraDir = tempCameraDir.copy(camera.position).normalize();
    const labelDir = tempLabelDir.copy(position).normalize();
    const visible = cameraDir.dot(labelDir) > -0.3;
    if (visible !== isVisible) setIsVisible(visible);
    groupRef.current.visible = visible;

    if (visible) {
      groupRef.current.lookAt(camera.position);
      groupRef.current.position.copy(position);
    }
  });

  // 根据状态确定颜色和大小
  const color = isSelected ? "#eab308" : isHovered ? "#facc15" : "#f5f5f4";
  const fontSize = isSelected ? 0.025 : isHovered ? 0.022 : 0.02;
  const outlineWidth = isSelected ? 0.003 : isHovered ? 0.0025 : 0.002;
  const outlineColor = "#000000";
  const renderOrder = isSelected ? 20 : isHovered ? 10 : 5;

  return (
    <group ref={groupRef} position={position.toArray()}>
      <Text
        color={color}
        fontSize={fontSize}
        anchorX="center"
        anchorY="middle"
        outlineWidth={outlineWidth}
        outlineColor={outlineColor}
        maxWidth={0.2}
        renderOrder={renderOrder}
        onPointerDown={(event) => {
          if (!isVisible) return;
          event.stopPropagation();
          onPointerDown(event);
        }}
        onPointerMove={(event) => {
          if (!isVisible) return;
          event.stopPropagation();
          onPointerMove(event);
        }}
        onPointerUp={(event) => {
          if (!isVisible) return;
          event.stopPropagation();
          onPointerUp(event);
        }}
        onPointerOver={(event) => {
          if (!isVisible) return;
          event.stopPropagation();
          // 设置鼠标指针为可点击图标
          if (gl.domElement) {
            gl.domElement.style.cursor = "pointer";
          }
          onPointerOver();
        }}
        onPointerOut={(event) => {
          event.stopPropagation();
          // 恢复鼠标指针为默认
          if (gl.domElement) {
            gl.domElement.style.cursor = "default";
          }
          onPointerOut();
        }}
      >
        {name}
      </Text>
    </group>
  );
}

interface GlobeRotatorProps {
  globeGroupRef: React.MutableRefObject<Group | null>;
  isInteractingRef: React.MutableRefObject<boolean>;
  selectedCountry: string | null;
  hoveredCountry: string | null;
}

function GlobeRotator({
  globeGroupRef,
  isInteractingRef,
  selectedCountry,
  hoveredCountry,
}: GlobeRotatorProps) {
  const {
    viewingAirportId,
    viewingFlightRouteId,
    selectedFlightRouteId,
    autoRotate,
  } = useAppStore();
  useFrame((_state, delta) => {
    // 只有在 autoRotate 为 true 且没有其他条件阻止时才自转
    if (
      globeGroupRef.current &&
      autoRotate &&
      !selectedCountry &&
      !isInteractingRef.current &&
      !hoveredCountry &&
      !viewingAirportId &&
      !viewingFlightRouteId &&
      !selectedFlightRouteId
    ) {
      globeGroupRef.current.rotation.y += delta * 0.05;
    }
  });
  return null;
}

interface CameraControllerProps {
  selectedCountry: string | null;
  countryLabels: CountryLabel[];
  orbitControlsRef: React.MutableRefObject<OrbitControlsImpl | null>;
  globeGroupRef: React.MutableRefObject<Group | null>;
  airportInstances: Array<AirportParticle & { position: Vector3 }>;
  flightRoutes: Array<{
    id: string;
    from: Vector3;
    to: Vector3;
    flightNumber: string;
    fromAirport: string;
    toAirport: string;
  }>;
}

function CameraController({
  selectedCountry,
  countryLabels,
  orbitControlsRef,
  globeGroupRef,
  airportInstances,
  flightRoutes,
}: CameraControllerProps) {
  const { camera } = useThree();
  const {
    targetAirportId,
    setTargetAirportId,
    setViewingAirportId,
    targetFlightRouteId,
    setTargetFlightRouteId,
    setViewingFlightRouteId,
  } = useAppStore();
  const isInitializedRef = useRef(false);
  const targetCameraPositionRef = useRef<Vector3 | null>(null);
  const targetLookAtPointRef = useRef<Vector3 | null>(null);
  const isAnimatingRef = useRef(false);

  // 计算目标相机位置（相机应该看向目标点，并从一定距离观察）
  const calculateCameraPosition = (targetPoint: Vector3, distance: number) => {
    // 相机位置在从原点到目标点的方向上，距离原点为 distance
    const direction = targetPoint.clone().normalize();
    return direction.multiplyScalar(distance);
  };

  // 初始化：转到中国位置
  useEffect(() => {
    if (isInitializedRef.current) return;

    // 等待 OrbitControls 初始化
    const timer = setTimeout(() => {
      const chinaLocalPosition = latLonToCartesian(
        CHINA_LAT,
        CHINA_LON,
        GLOBE_RADIUS,
      );
      const chinaPosition = chinaLocalPosition.clone();

      // 转换为世界坐标
      if (globeGroupRef.current) {
        chinaPosition.applyMatrix4(globeGroupRef.current.matrixWorld);
      }

      const targetDistance = 3.5; // 初始距离，稍微放大
      const cameraPos = calculateCameraPosition(chinaPosition, targetDistance);

      // 设置初始相机位置
      camera.position.copy(cameraPos);
      if (orbitControlsRef.current) {
        orbitControlsRef.current.target.copy(chinaPosition);
        orbitControlsRef.current.update();
      }

      isInitializedRef.current = true;
    }, 100);

    return () => clearTimeout(timer);
  }, [camera, orbitControlsRef, globeGroupRef]);

  // 当选择国家改变时，转到对应国家位置
  useEffect(() => {
    if (!selectedCountry || !isInitializedRef.current) return;

    // 支持省份选中：如果是省份 key（如 CN-北京），使用 key 查找；否则使用 iso 查找
    const countryLabel = countryLabels.find(
      (label) => label.key === selectedCountry || label.iso === selectedCountry,
    );
    if (!countryLabel || !orbitControlsRef.current) return;

    // 使用标签位置归一化后乘以地球半径，得到地球表面的点
    const localPoint = countryLabel.position
      .clone()
      .normalize()
      .multiplyScalar(GLOBE_RADIUS);

    // 转换为世界坐标
    const targetPoint = localPoint.clone();
    if (globeGroupRef.current) {
      targetPoint.applyMatrix4(globeGroupRef.current.matrixWorld);
    }

    const targetDistance = 3.0; // 选择国家时的距离，更近一些
    targetCameraPositionRef.current = calculateCameraPosition(
      targetPoint,
      targetDistance,
    );
    targetLookAtPointRef.current = targetPoint.clone();
    isAnimatingRef.current = true;
  }, [selectedCountry, countryLabels, orbitControlsRef, camera, globeGroupRef]);

  // 当targetAirportId改变时，zoom到对应机场
  useEffect(() => {
    if (
      !targetAirportId ||
      !isInitializedRef.current ||
      !orbitControlsRef.current
    )
      return;

    const airport = airportInstances.find((a) => a.id === targetAirportId);
    if (!airport) return;

    // 设置正在查看的机场，用于显示高亮效果
    setViewingAirportId(targetAirportId);

    // 使用机场位置
    const localPoint = airport.position.clone();

    // 转换为世界坐标
    const targetPoint = localPoint.clone();
    if (globeGroupRef.current) {
      targetPoint.applyMatrix4(globeGroupRef.current.matrixWorld);
    }

    const targetDistance = 2.5; // zoom到机场时的距离，更近
    targetCameraPositionRef.current = calculateCameraPosition(
      targetPoint,
      targetDistance,
    );
    targetLookAtPointRef.current = targetPoint.clone();
    isAnimatingRef.current = true;

    // 清除targetAirportId，避免重复触发
    setTimeout(() => {
      setTargetAirportId(null);
    }, 100);
  }, [
    targetAirportId,
    airportInstances,
    orbitControlsRef,
    camera,
    globeGroupRef,
    setTargetAirportId,
    setViewingAirportId,
  ]);

  // 当targetFlightRouteId改变时，zoom到对应航线
  useEffect(() => {
    if (
      !targetFlightRouteId ||
      !isInitializedRef.current ||
      !orbitControlsRef.current
    )
      return;

    const route = flightRoutes.find((r) => r.id === targetFlightRouteId);
    if (!route) return;

    // 设置正在查看的航线，用于显示高亮效果
    setViewingFlightRouteId(targetFlightRouteId);

    // 计算航线的中点（在航线上方）
    const midPoint = new Vector3()
      .addVectors(route.from, route.to)
      .multiplyScalar(0.5);
    // 将中点向外延伸，使其位于航线拱形上方
    const routeDistance = route.from.distanceTo(route.to);
    const midLen = midPoint.length();
    const heightOffset = GLOBE_RADIUS * 0.3 + routeDistance * 0.3;
    const elevatedMidPoint = midPoint
      .clone()
      .normalize()
      .multiplyScalar(midLen + heightOffset);

    // 计算航线的方向向量（从起点到终点）
    const routeDirection = new Vector3()
      .subVectors(route.to, route.from)
      .normalize();

    // 计算从原点到中点的方向（径向方向）
    const radialDirection = elevatedMidPoint.clone().normalize();

    // 计算垂直于航线方向和径向方向的向量（用于确定相机的侧向位置）
    // 这个向量将帮助我们让相机正对航线
    let sideVector = new Vector3().crossVectors(
      routeDirection,
      radialDirection,
    );

    // 如果叉积结果为零（方向平行），使用另一个方向
    if (sideVector.length() < 0.01) {
      // 使用一个默认的上方向
      const upVector = new Vector3(0, 1, 0);
      sideVector = new Vector3().crossVectors(routeDirection, upVector);
      if (sideVector.length() < 0.01) {
        // 如果还是平行，使用另一个方向
        sideVector = new Vector3(1, 0, 0).cross(routeDirection);
      }
    }
    sideVector.normalize();

    // 计算相机应该位于的位置：在航线中点的侧上方，正对航线
    // 使用侧向偏移和适当的距离，使相机能够正对航线
    const sideOffset = sideVector.clone().multiplyScalar(routeDistance * 0.5); // 侧向偏移，使相机能够看到航线的侧面
    const cameraOffset = elevatedMidPoint.clone().add(sideOffset); // 相机应该看向的点（航线中点 + 侧向偏移）

    // zoom到航线时的距离，要根据航线长度调整
    const targetDistance = Math.max(2.5, Math.min(4.0, routeDistance * 1.2));

    // 计算相机位置：从原点出发，沿着相机偏移方向，距离为 targetDistance
    const cameraDirection = cameraOffset.clone().normalize();
    const cameraPosition = cameraDirection.multiplyScalar(targetDistance);

    // 转换为世界坐标
    const targetPoint = elevatedMidPoint.clone();
    if (globeGroupRef.current) {
      cameraPosition.applyMatrix4(globeGroupRef.current.matrixWorld);
      targetPoint.applyMatrix4(globeGroupRef.current.matrixWorld);
    }

    targetCameraPositionRef.current = cameraPosition;
    targetLookAtPointRef.current = targetPoint.clone();
    isAnimatingRef.current = true;

    // 清除targetFlightRouteId，避免重复触发
    setTimeout(() => {
      setTargetFlightRouteId(null);
    }, 100);
  }, [
    targetFlightRouteId,
    flightRoutes,
    orbitControlsRef,
    camera,
    globeGroupRef,
    setTargetFlightRouteId,
    setViewingFlightRouteId,
  ]);

  // 监听用户交互，如果用户在操作，停止动画并将目标点重置为原点
  useEffect(() => {
    const controls = orbitControlsRef.current;
    if (!controls) return;

    const handleStart = () => {
      if (isAnimatingRef.current) {
        targetCameraPositionRef.current = null;
        targetLookAtPointRef.current = null;
        isAnimatingRef.current = false;
        // 在动画过程中，不清除查看状态，保持选中效果
      }
      // 用户开始交互时（包括缩放），不清除查看状态
      // 只有在右侧取消时才会清除查看状态
      // 用户开始交互时，将目标点重置为原点，使相机围绕地球中心旋转
      controls.target.set(0, 0, 0);
      controls.update();
    };

    controls.addEventListener("start", handleStart);
    return () => {
      controls.removeEventListener("start", handleStart);
    };
  }, [orbitControlsRef]);

  // 平滑动画到目标位置
  useFrame(() => {
    if (!orbitControlsRef.current) return;

    if (
      targetCameraPositionRef.current !== null &&
      targetLookAtPointRef.current !== null &&
      isAnimatingRef.current
    ) {
      const currentPos = camera.position.clone();
      const targetCameraPos = targetCameraPositionRef.current;
      const targetLookAt = targetLookAtPointRef.current;
      const distance = currentPos.distanceTo(targetCameraPos);

      // 如果距离足够近，停止动画
      if (distance < 0.01) {
        camera.position.copy(targetCameraPos);
        orbitControlsRef.current.target.copy(targetLookAt);
        orbitControlsRef.current.update();
        targetCameraPositionRef.current = null;
        targetLookAtPointRef.current = null;
        isAnimatingRef.current = false;
      } else {
        // 平滑插值相机位置和目标点
        camera.position.lerp(targetCameraPos, 0.05);
        orbitControlsRef.current.target.lerp(targetLookAt, 0.05);
        orbitControlsRef.current.update();
      }
    }
  });

  return null;
}

// 星星光照组件：在地球周围添加多个点光源模拟星星的光照
function StarLights() {
  // 生成多个点光源位置，分布在地球周围的球面上
  const lightPositions = useMemo(() => {
    const positions: Vector3[] = [];
    const count = 12; // 点光源数量
    const radius = GLOBE_RADIUS * 8; // 光源距离地球的距离

    for (let i = 0; i < count; i++) {
      // 使用球面坐标生成均匀分布的点
      const theta = Math.random() * Math.PI * 2; // 方位角
      const phi = Math.acos(2 * Math.random() - 1); // 极角

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      positions.push(new Vector3(x, y, z));
    }

    return positions;
  }, []);

  return (
    <>
      {lightPositions.map((position, index) => (
        <pointLight
          key={index}
          position={position}
          intensity={0.6}
          distance={GLOBE_RADIUS * 20}
          decay={1.5}
          color="#e8f4ff"
        />
      ))}
    </>
  );
}

interface AirportParticleProps {
  airport: AirportParticle & { position: Vector3 };
  isSelected: boolean;
  airportCodeMap: Record<string, string>;
}

const AirportParticle = memo(function AirportParticle({
  airport,
  isSelected,
  airportCodeMap,
}: AirportParticleProps) {
  const { gl, camera } = useThree();
  const groupRef = useRef<Group>(null);
  const ringRef = useRef<Group>(null);
  const labelRef = useRef<Group>(null);
  const glowIntensityRef = useRef(1);
  const materialRefs = useRef<{
    outer?: MeshBasicMaterial;
    middle?: MeshBasicMaterial;
    ring?: MeshBasicMaterial;
  }>({});
  const {
    setHoveredAirport,
    setTooltipPosition,
    viewingAirportId,
    setViewingAirportId,
    setSelectedAirportForAirline,
    setSidebarTab,
  } = useAppStore();
  const isViewing = viewingAirportId === airport.id;

  // 根据用户设置获取机场显示编码
  const getAirportDisplayCode = useMemo(() => {
    // 始终显示ICAO四字码
    return airport.code4 || airportCodeMap[airport.code] || airport.code;
  }, [airport.code4, airport.code, airportCodeMap]);

  // 保存原始位置，避免被修改
  const basePosition = useMemo(
    () => airport.position.clone(),
    [airport.position],
  );

  // 根据风险值计算闪烁参数
  const getPulseParams = useMemo(() => {
    const risk = airport.environmentRisk;
    if (risk >= 7) {
      // 高风险：快速闪烁，强度大
      return {
        speed: 4,
        intensity: 0.4,
        baseColor: new Color("#ff1744"),
        brightColor: new Color("#ff6b9d"),
      };
    } else if (risk >= 5) {
      // 中风险：中等速度闪烁
      return {
        speed: 3,
        intensity: 0.3,
        baseColor: new Color("#eab308"),
        brightColor: new Color("#facc15"),
      };
    } else if (risk >= 1) {
      // 低风险：慢速闪烁
      return {
        speed: 2,
        intensity: 0.25,
        baseColor: new Color("#4caf50"),
        brightColor: new Color("#81c784"),
      };
    } else {
      // 极低风险：很慢的闪烁
      return {
        speed: 1.5,
        intensity: 0.2,
        baseColor: new Color("#4caf50"),
        brightColor: new Color("#81c784"),
      };
    }
  }, [airport.environmentRisk]);

  // 预分配复用对象，避免每帧 GC
  const tempColor = useMemo(() => new Color(), []);
  const tempNormal = useMemo(() => new Vector3(), []);
  const tempWorldPos = useMemo(() => new Vector3(), []);
  const tempLocalPos = useMemo(() => new Vector3(), []);

  // 处理鼠标事件
  const handlePointerOver = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation();
      const nativeEvent =
        event.nativeEvent || (event as unknown as PointerEvent);
      setTooltipPosition({ x: nativeEvent.clientX, y: nativeEvent.clientY });
      setHoveredAirport({
        airportId: airport.id,
        airportCode: airport.code4 || airport.code,
        airportName: airport.name,
        operatorCount: airport.operatorCount,
        flightCount: airport.flightCount,
        environmentRisk: airport.environmentRisk,
      });
      if (gl.domElement) {
        gl.domElement.style.cursor = "pointer";
      }
    },
    [airport, setHoveredAirport, setTooltipPosition, gl],
  );

  const handlePointerOut = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation();
      setHoveredAirport(null);
      setTooltipPosition(null);
      if (gl.domElement) {
        gl.domElement.style.cursor = "default";
      }
    },
    [setHoveredAirport, setTooltipPosition, gl],
  );

  const handlePointerMove = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation();
      const nativeEvent =
        event.nativeEvent || (event as unknown as PointerEvent);
      setTooltipPosition({ x: nativeEvent.clientX, y: nativeEvent.clientY });
    },
    [setTooltipPosition],
  );

  // 处理机场点击
  const handlePointerDown = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation();
      // 设置正在查看的机场，并选中对应的机场卡片
      setViewingAirportId(airport.id);
      setSelectedAirportForAirline(airport.id);
      setSidebarTab("airport"); // 切换到机场标签页
    },
    [
      airport.id,
      setViewingAirportId,
      setSelectedAirportForAirline,
      setSidebarTab,
    ],
  );

  const frameSkip = useRef(0);
  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.position.copy(basePosition);

    // 非选中/查看的机场每3帧更新一次动画
    if (!isSelected && !isViewing) {
      frameSkip.current++;
      if (frameSkip.current % 3 !== 0) return;
    }

    const time = Date.now() * 0.001;
    let intensity = isSelected
      ? 1.4 + Math.sin(time * 3) * 0.3
      : 1.0 + Math.sin(time * 2) * 0.25;

    if (isViewing) {
      intensity = 2.0 + Math.sin(time * 4) * 0.4;
    }

    glowIntensityRef.current = intensity;

    const pulse = Math.sin(time * getPulseParams.speed) * 0.5 + 0.5;
    tempColor.lerpColors(
      getPulseParams.baseColor,
      getPulseParams.brightColor,
      pulse * getPulseParams.intensity,
    );

    if (materialRefs.current.outer) {
      materialRefs.current.outer.color.copy(tempColor);
      materialRefs.current.outer.opacity =
        (isViewing ? 0.7 : isSelected ? 0.6 : 0.5) * intensity;
    }
    if (materialRefs.current.middle) {
      materialRefs.current.middle.color.copy(tempColor);
      materialRefs.current.middle.opacity =
        (isViewing ? 1.0 : isSelected ? 0.95 : 0.9) * Math.min(intensity, 1.3);
    }

    if (isViewing && ringRef.current && materialRefs.current.ring) {
      ringRef.current.lookAt(camera.position);
      const ringScale = 1.0 + Math.sin(time * 3) * 0.3;
      ringRef.current.scale.setScalar(ringScale);
      materialRefs.current.ring.color.copy(tempColor);
      materialRefs.current.ring.opacity = 0.8 + Math.sin(time * 3) * 0.3;
    }

    if (isViewing && labelRef.current && groupRef.current) {
      labelRef.current.lookAt(camera.position);
      tempNormal.copy(basePosition).normalize();
      tempWorldPos.copy(basePosition).add(tempNormal.multiplyScalar(0.05));
      tempLocalPos.copy(tempWorldPos);
      groupRef.current.worldToLocal(tempLocalPos);
      labelRef.current.position.copy(tempLocalPos);
    }
  });

  // Hexagon shape: 6 vertices
  const hexShape = useMemo(() => {
    const size = isViewing ? 0.012 : isSelected ? 0.01 : 0.007;
    const vertices = new Float32Array(6 * 3);
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6; // rotate 30deg so flat top
      vertices[i * 3] = Math.cos(angle) * size;
      vertices[i * 3 + 1] = Math.sin(angle) * size;
      vertices[i * 3 + 2] = 0;
    }
    const indices = [0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 5];
    return { vertices, indices, size };
  }, [isViewing, isSelected]);

  const hexGlowShape = useMemo(() => {
    const size = isViewing ? 0.02 : isSelected ? 0.017 : 0.013;
    const vertices = new Float32Array(6 * 3);
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      vertices[i * 3] = Math.cos(angle) * size;
      vertices[i * 3 + 1] = Math.sin(angle) * size;
      vertices[i * 3 + 2] = 0;
    }
    const indices = [0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 5];
    return { vertices, indices };
  }, [isViewing, isSelected]);

  return (
    <group ref={groupRef}>
      {/* Outer hexagonal glow */}
      <group ref={ringRef}>
        <mesh
          position={[0, 0, 0]}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerDown}
        >
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[hexGlowShape.vertices, 3]}
            />
            <bufferAttribute
              attach="index"
              args={[new Uint16Array(hexGlowShape.indices), 1]}
            />
          </bufferGeometry>
          <meshBasicMaterial
            ref={(ref) => {
              if (ref) materialRefs.current.outer = ref;
            }}
            color={airport.color}
            transparent
            opacity={0.35}
            side={DoubleSide}
          />
        </mesh>
        {/* Inner solid hexagon */}
        <mesh position={[0, 0, 0]}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[hexShape.vertices, 3]}
            />
            <bufferAttribute
              attach="index"
              args={[new Uint16Array(hexShape.indices), 1]}
            />
          </bufferGeometry>
          <meshBasicMaterial
            ref={(ref) => {
              if (ref) materialRefs.current.middle = ref;
            }}
            color={airport.color}
            transparent
            opacity={0.85}
            side={DoubleSide}
          />
        </mesh>
        {/* Hexagon border ring */}
        <mesh position={[0, 0, 0]}>
          <ringGeometry args={[hexShape.size * 0.5, hexShape.size * 0.55, 6]} />
          <meshBasicMaterial
            ref={(ref) => {
              if (ref) materialRefs.current.ring = ref;
            }}
            color={airport.color}
            transparent
            opacity={0.9}
            side={DoubleSide}
          />
        </mesh>
        {/* Center dot */}
        <mesh position={[0, 0, 0]}>
          <circleGeometry args={[hexShape.size * 0.2, 6]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.9}
            side={DoubleSide}
          />
        </mesh>
      </group>
      {/* Airport code label when selected/viewing */}
      {(isViewing || isSelected) && (
        <group ref={labelRef}>
          <Text
            color="#ffffff"
            fontSize={0.018}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.003}
            outlineColor="#000000"
            maxWidth={0.2}
            renderOrder={100}
          >
            {`${getAirportDisplayCode} · ${airport.environmentRisk.toFixed(1)}`}
          </Text>
        </group>
      )}
    </group>
  );
});
