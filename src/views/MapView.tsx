import {
  Line,
  OrthographicCamera,
  OrbitControls,
  Text,
} from "@react-three/drei";
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
  useCallback,
  useEffect,
  useState,
  createContext,
  useContext,
} from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  Color,
  DoubleSide,
  Path,
  Shape,
  Vector3,
  Group,
  MeshBasicMaterial,
} from "three";
import { useAppStore } from "../store/useAppStore";
import type { WorldData, AtlasData } from "../types";
import { deriveIsoCode, latLonToPlane } from "../utils/geo";
import {
  AIRPORTS,
  FLIGHTS,
  getAirportByCode,
  getIcaoCode,
  getRiskColor,
  calculateRiskFromEnvironmentRisk,
} from "../data/flightData";
import { MapFlightPaths } from "../components/MapFlightPaths";
import type { OrthographicCamera as OrthographicCameraImpl } from "three";

const MAP_SCALE = 6;

// ===== 共享 CSV 机场编码映射上下文（避免每个机场组件重复加载） =====
const AirportCodeMapContext = createContext<Record<string, string>>({});

function AirportCodeMapProvider({ children }: { children: React.ReactNode }) {
  const [codeMap, setCodeMap] = useState<Record<string, string>>({});

  // 从航班数据构建基础映射
  const baseMap = useMemo(() => {
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

  // 异步加载完整 CSV 映射（仅加载一次）
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
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
        if (!cancelled) setCodeMap(map);
      } catch (error) {
        console.error("加载完整机场编码映射失败:", error);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const merged = useMemo(
    () => ({ ...baseMap, ...codeMap }),
    [baseMap, codeMap],
  );

  return (
    <AirportCodeMapContext.Provider value={merged}>
      {children}
    </AirportCodeMapContext.Provider>
  );
}

interface MapViewProps {
  world: WorldData;
  atlas?: AtlasData;
}

interface PolygonLine {
  id: string;
  iso: string | null;
  points: Vector3[];
}

interface PolygonFill {
  id: string;
  iso: string | null;
  shape: Shape;
}

// 国家代码映射表
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

function normalizeCountryCode(code: string | null): string | null {
  if (!code) return null;
  const upper = code.toUpperCase().trim();
  return COUNTRY_CODE_MAP[upper] || upper;
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

// ===== 视觉配色方案 =====
const COLORS = {
  background: "#030a18", // 深海蓝背景
  oceanPlane: "#061224", // 海洋底色
  countryFill: new Color("#1a8a7d"), // 国家填充 - 青碧色
  countryBorder: new Color("#2dd4bf"), // 国家边界
  countryHover: new Color("#facc15"),
  countryHighlight: new Color("#eab308"),
  gridLine: "rgba(45,212,191,0.04)", // 经纬网
};

// 主要国家列表（提取为常量避免重复创建）
const MAJOR_COUNTRIES = [
  "CN",
  "US",
  "RU",
  "CA",
  "BR",
  "AU",
  "IN",
  "AR",
  "KZ",
  "DZ",
  "SA",
  "MX",
  "ID",
  "MN",
  "LY",
  "IR",
  "PE",
  "NG",
  "TZ",
  "EG",
  "MA",
  "ZA",
  "SD",
  "YE",
  "TH",
  "ES",
  "TR",
  "BO",
  "MM",
  "AF",
  "VE",
  "MY",
  "PH",
  "IQ",
  "SE",
  "GB",
  "FR",
  "DE",
  "JP",
  "IT",
  "KR",
  "PL",
  "VN",
  "NO",
  "NZ",
  "BD",
  "EC",
  "RO",
  "KE",
  "SY",
  "KH",
  "UY",
  "TN",
  "BG",
  "NP",
  "GR",
  "BA",
  "LK",
  "GT",
  "JO",
  "AE",
  "CZ",
  "PT",
  "HU",
  "RS",
  "IE",
  "GE",
  "CR",
  "SK",
  "HR",
  "LV",
  "LT",
  "SI",
  "ME",
  "EE",
  "DK",
  "NL",
  "CH",
  "AT",
  "BE",
  "SG",
];
const MAJOR_COUNTRIES_SET = new Set(MAJOR_COUNTRIES);

export function MapView({ world, atlas }: MapViewProps) {
  const {
    selectedCountry,
    hoveredCountry,
    hoveredAirport,
    hoveredFlightRoute,
    tooltipPosition,
    viewingAirportId,
    selectedFlightRouteId,
    setSelectedFlightRouteId,
    setSelectedAirportForAirline,
    setViewingAirportId,
    showLabels,
    riskZones,
    homeObjectTab,
    flightStatuses,
  } = useAppStore();
  const orbitControlsRef = useRef<OrbitControlsImpl | null>(null);

  // 跟踪空白区域的点击状态
  const blankAreaPointerStateRef = useRef<{
    downTime: number;
    downX: number;
    downY: number;
    moved: boolean;
  } | null>(null);

  // 设置鼠标按钮
  useEffect(() => {
    const controls = orbitControlsRef.current;
    if (!controls) return;
    controls.mouseButtons = {
      LEFT: 1,
      MIDDLE: undefined,
      RIGHT: undefined,
    };
  }, []);

  const { linePolygons, fillPolygons, labelCandidates } = useMemo<{
    linePolygons: PolygonLine[];
    fillPolygons: PolygonFill[];
    labelCandidates: LabelCandidate[];
  }>(() => {
    const lines: PolygonLine[] = [];
    const fills: PolygonFill[] = [];
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
        if (!rings.length) return;

        const planeRings = rings.map((ring) =>
          ring.map(([lon, lat]) => latLonToPlane(lat, lon, MAP_SCALE)),
        );

        planeRings.forEach((ring, ringIndex) => {
          if (ring.length < 2) return;
          const isClosed = ring[0]?.equals(
            ring[ring.length - 1] ?? new Vector3(),
          );
          const points = isClosed ? ring : [...ring, ring[0]];
          lines.push({
            id: `${featureIndex}-${polygonIndex}-${ringIndex}`,
            iso,
            points,
          });
        });

        const outerRing = planeRings[0];
        if (!outerRing || outerRing.length < 3) return;

        const shape = new Shape();
        shape.moveTo(outerRing[0].x, outerRing[0].y);
        outerRing.slice(1).forEach((point) => {
          shape.lineTo(point.x, point.y);
        });

        planeRings.slice(1).forEach((holeRing) => {
          if (holeRing.length < 3) return;
          const holePath = new Path();
          holePath.moveTo(holeRing[0].x, holeRing[0].y);
          holeRing.slice(1).forEach((point) => {
            holePath.lineTo(point.x, point.y);
          });
          holePath.lineTo(holeRing[0].x, holeRing[0].y);
          shape.holes.push(holePath);
        });

        fills.push({
          id: `fill-${featureIndex}-${polygonIndex}`,
          iso,
          shape,
        });

        const center = new Vector3();
        outerRing.forEach((point) => {
          center.add(point);
        });
        center.divideScalar(outerRing.length);

        const minX = Math.min(...outerRing.map((p) => p.x));
        const maxX = Math.max(...outerRing.map((p) => p.x));
        const minY = Math.min(...outerRing.map((p) => p.y));
        const maxY = Math.max(...outerRing.map((p) => p.y));
        const weight = (maxX - minX) * (maxY - minY);

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
            existing.weightedCenter.add(center.clone().multiplyScalar(weight));
            existing.totalWeight += weight;
          }
        };

        const labelKey =
          iso ?? featureName ?? `${featureIndex}-${polygonIndex}`;

        if (iso === "CN" && featureName) {
          updateCenter(`CN-${featureName}`, iso, featureName);
          updateCenter("CN", iso, null);
        } else {
          updateCenter(labelKey, iso, featureName);
        }
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

    const labelCandidates: LabelCandidate[] = [];
    countryCenters.forEach((data, labelKey) => {
      const finalCenter = data.weightedCenter
        .clone()
        .divideScalar(data.totalWeight);
      labelCandidates.push({
        key: labelKey,
        iso: data.iso,
        fallbackName: data.fallbackName,
        position: finalCenter,
      });
    });

    return { linePolygons: lines, fillPolygons: fills, labelCandidates };
  }, [world]);

  const countryLabels = useMemo<CountryLabel[]>(() => {
    if (!atlas) return [];
    return labelCandidates
      .map(({ key, iso, fallbackName, position }) => {
        if (key.startsWith("CN-") && fallbackName) {
          return { key, iso, position, name: fallbackName };
        }
        const country = iso ? atlas.countries[iso] : undefined;
        const name = country?.name ?? fallbackName;
        if (!name) return null;
        return { key, iso, position, name };
      })
      .filter((value): value is CountryLabel => value !== null);
  }, [atlas, labelCandidates]);

  // 机场实例
  const airportInstances = useMemo(() => {
    return AIRPORTS.filter((airport) => {
      if (homeObjectTab !== "personnel") {
        const { riskZone } = calculateRiskFromEnvironmentRisk(
          airport.environmentRisk,
        );
        if (!riskZones.includes(riskZone)) return false;
      }
      return true;
    }).map((airport) => {
      const position = latLonToPlane(airport.lat, airport.lon, MAP_SCALE);
      return { ...airport, position };
    });
  }, [riskZones, homeObjectTab]);

  // 计算航线
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

    // 情况1: 选中特定航线
    if (selectedFlightRouteId) {
      const flight = FLIGHTS.find((f) => f.id === selectedFlightRouteId);
      if (flight) {
        const fromAirport = getAirportByCode(flight.fromAirport);
        const toAirport = getAirportByCode(flight.toAirport);
        if (fromAirport && toAirport) {
          const fromAirportInstance = airportInstances.find(
            (a) => a.id === fromAirport.id,
          );
          const toAirportInstance = airportInstances.find(
            (a) => a.id === toAirport.id,
          );
          if (fromAirportInstance && toAirportInstance) {
            const fromPos = fromAirportInstance.position.clone();
            fromPos.z = 0.05;
            const toPos = toAirportInstance.position.clone();
            toPos.z = 0.05;
            const routeColor = getRiskColor(flight.environmentRisk);
            routes.push({
              id: `${fromAirport.id}-${toAirport.id}-${flight.id}`,
              from: fromPos,
              to: toPos,
              color: routeColor,
              fromIsSelected: false,
              toIsSelected: false,
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

    // 情况2: 查看某个机场
    if (viewingAirportId) {
      const viewingAirport = AIRPORTS.find((a) => a.id === viewingAirportId);
      if (!viewingAirport) return routes;

      const relevantFlights = FLIGHTS.filter((flight) => {
        const related =
          flight.fromAirport === viewingAirport.code ||
          flight.toAirport === viewingAirport.code;
        if (!related) return false;
        if (
          flightStatuses.length > 0 &&
          !flightStatuses.includes(flight.status)
        )
          return false;
        return true;
      });

      relevantFlights.forEach((flight) => {
        const fromAirport = getAirportByCode(flight.fromAirport);
        const toAirport = getAirportByCode(flight.toAirport);
        if (!fromAirport || !toAirport) return;
        const fromAirportInstance = airportInstances.find(
          (a) => a.id === fromAirport.id,
        );
        const toAirportInstance = airportInstances.find(
          (a) => a.id === toAirport.id,
        );
        if (!fromAirportInstance || !toAirportInstance) return;

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

        const fromPos = fromAirportInstance.position.clone();
        fromPos.z = 0.05;
        const toPos = toAirportInstance.position.clone();
        toPos.z = 0.05;
        const routeColor = getRiskColor(flight.environmentRisk);

        routes.push({
          id: `${fromAirport.id}-${toAirport.id}-${flight.id}`,
          from: fromPos,
          to: toPos,
          color: routeColor,
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

    // 情况3: 默认显示所有航线
    FLIGHTS.forEach((flight) => {
      if (flightStatuses.length > 0 && !flightStatuses.includes(flight.status))
        return;

      const fromAirport = getAirportByCode(flight.fromAirport);
      const toAirport = getAirportByCode(flight.toAirport);
      if (!fromAirport || !toAirport) return;
      const fromAirportInstance = airportInstances.find(
        (a) => a.id === fromAirport.id,
      );
      const toAirportInstance = airportInstances.find(
        (a) => a.id === toAirport.id,
      );
      if (!fromAirportInstance || !toAirportInstance) return;

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

      const fromPos = fromAirportInstance.position.clone();
      fromPos.z = 0.05;
      const toPos = toAirportInstance.position.clone();
      toPos.z = 0.05;

      if (homeObjectTab === "airports") return;
      if (homeObjectTab !== "personnel") {
        const { riskZone: flightRiskZone } = calculateRiskFromEnvironmentRisk(
          flight.environmentRisk,
        );
        if (!riskZones.includes(flightRiskZone)) return;
      }

      const routeColor = getRiskColor(flight.environmentRisk);

      routes.push({
        id: `${fromAirport.id}-${toAirport.id}-${flight.id}`,
        from: fromPos,
        to: toPos,
        color: routeColor,
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
    airportInstances,
    viewingAirportId,
    selectedFlightRouteId,
    riskZones,
    homeObjectTab,
    flightStatuses,
  ]);

  // 过滤后的标签列表（提前计算，避免在 JSX 中重复过滤）
  const filteredLabels = useMemo(() => {
    if (!showLabels) return [];
    return countryLabels.filter(({ key, iso }) => {
      const isSelected = iso && selectedCountry === iso;
      if (key.startsWith("CN-")) return false;
      if (key === "CN") return selectedCountry !== "CN";
      if (isSelected) return true;
      return iso ? MAJOR_COUNTRIES_SET.has(iso) : false;
    });
  }, [showLabels, countryLabels, selectedCountry]);

  // 经纬网格线数据（静态，只生成一次）
  const graticulesLines = useMemo(() => {
    const lines: Vector3[][] = [];
    // 经线（每30度）
    for (let lon = -180; lon <= 180; lon += 30) {
      const pts: Vector3[] = [];
      for (let lat = -85; lat <= 85; lat += 5) {
        pts.push(latLonToPlane(lat, lon, MAP_SCALE));
      }
      lines.push(pts);
    }
    // 纬线（每30度）
    for (let lat = -60; lat <= 80; lat += 30) {
      const pts: Vector3[] = [];
      for (let lon = -180; lon <= 180; lon += 5) {
        pts.push(latLonToPlane(lat, lon, MAP_SCALE));
      }
      lines.push(pts);
    }
    return lines;
  }, []);

  return (
    <div className="view-root">
      <Canvas orthographic camera={{ position: [0, 0, 10], zoom: 60 }}>
        <color attach="background" args={[COLORS.background]} />
        <OrthographicCamera makeDefault position={[0, 0, 10]} zoom={60} />
        <ambientLight intensity={0.8} />
        <Suspense fallback={null}>
          {/* 海洋底色 */}
          <mesh
            position={[0, 0, -1]}
            onPointerDown={(event) => {
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
              if (deltaX > 5 || deltaY > 5) {
                blankAreaPointerStateRef.current.moved = true;
              }
            }}
            onPointerUp={() => {
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
            <planeGeometry args={[MAP_SCALE * 3.8, MAP_SCALE * 1.9]} />
            <meshBasicMaterial color={COLORS.oceanPlane} />
          </mesh>

          {/* 经纬网格 */}
          {graticulesLines.map((pts, i) => (
            <Line
              key={`grid-${i}`}
              points={pts}
              color={COLORS.countryFill}
              lineWidth={0.3}
              transparent
              opacity={0.08}
            />
          ))}

          {/* 国家填充 */}
          {fillPolygons.map(({ id, iso, shape }) => {
            const isSelected = iso && selectedCountry === iso;
            const color = isSelected
              ? COLORS.countryHighlight
              : COLORS.countryFill;
            const opacity = isSelected ? 0.55 : 0.15;
            return (
              <mesh
                key={id}
                position={[0, 0, -0.01]}
                renderOrder={0}
                onPointerOver={(event) => {
                  event.stopPropagation();
                }}
                onPointerOut={(event) => {
                  event.stopPropagation();
                }}
                onPointerDown={(event) => {
                  event.stopPropagation();
                }}
              >
                <shapeGeometry args={[shape]} />
                <meshBasicMaterial
                  color={color}
                  transparent
                  opacity={opacity}
                  side={DoubleSide}
                />
              </mesh>
            );
          })}

          {/* 国家边界线 */}
          {linePolygons.map(({ id, iso, points }) => {
            const isSelected = iso && selectedCountry === iso;
            const color = isSelected
              ? COLORS.countryHighlight
              : COLORS.countryBorder;
            const lineWidth = isSelected ? 1.4 : 0.6;
            return (
              <Line
                key={id}
                points={points}
                color={color}
                lineWidth={lineWidth}
                transparent
                opacity={isSelected ? 1 : 0.5}
                onPointerOver={(event) => {
                  event.stopPropagation();
                }}
                onPointerOut={(event) => {
                  event.stopPropagation();
                }}
                onPointerDown={(event) => {
                  event.stopPropagation();
                }}
              />
            );
          })}

          {/* 机场显示 */}
          <AirportCodeMapProvider>
            {airportInstances.map((airport) => {
              const normalizedSelectedCountry = selectedCountry
                ? normalizeCountryCode(selectedCountry)
                : null;
              const normalizedAirportCountry = normalizeCountryCode(
                airport.countryCode,
              );
              const isSelected =
                normalizedSelectedCountry === normalizedAirportCountry;
              return (
                <MapAirportParticle
                  key={airport.id}
                  airport={airport}
                  isSelected={isSelected}
                />
              );
            })}
          </AirportCodeMapProvider>

          {/* 航线显示 */}
          {flightRoutes && flightRoutes.length > 0 && (
            <MapFlightPaths routes={flightRoutes} />
          )}

          {/* 国家标签 */}
          {filteredLabels.map(({ key, iso, name, position }) => (
            <MapCountryLabel
              key={key}
              iso={iso}
              name={name}
              position={position}
              isSelected={!!(iso && selectedCountry === iso)}
              isHovered={!!(iso && hoveredCountry === iso)}
              onPointerOver={() => {}}
              onPointerOut={() => {}}
              onPointerDown={() => {}}
            />
          ))}
        </Suspense>
        <MapCameraController
          selectedCountry={selectedCountry}
          countryLabels={countryLabels}
          orbitControlsRef={orbitControlsRef}
        />
        <OrbitControls
          ref={orbitControlsRef}
          enableRotate={false}
          enablePan={true}
          enableZoom={true}
          enableDamping={true}
          dampingFactor={0.08}
          panSpeed={1.2}
          zoomSpeed={1.2}
          maxZoom={300}
          minZoom={20}
        />
      </Canvas>
      {/* Tooltip */}
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
    </div>
  );
}

interface MapAirportParticleProps {
  airport: (typeof AIRPORTS)[0] & { position: Vector3 };
  isSelected: boolean;
}

function MapAirportParticle({ airport, isSelected }: MapAirportParticleProps) {
  const { gl, camera } = useThree();
  const groupRef = useRef<Group>(null);
  const labelRef = useRef<Group>(null);
  const materialRefs = useRef<{
    outer?: MeshBasicMaterial;
    inner?: MeshBasicMaterial;
  }>({});
  const { setHoveredAirport, setTooltipPosition, viewingAirportId } =
    useAppStore();
  const isViewing = viewingAirportId === airport.id;

  const basePosition = useMemo(
    () => airport.position.clone(),
    [airport.position],
  );

  // 使用共享的 CSV 映射（来自 Context，不再每个组件单独加载）
  const airportCodeMap = useContext(AirportCodeMapContext);

  const getAirportDisplayCode = useMemo(() => {
    return airport.code4 || airportCodeMap[airport.code] || airport.code;
  }, [airport.code4, airport.code, airportCodeMap]);

  // 预计算闪烁颜色（避免每帧创建新 Color）
  const pulseColors = useMemo(() => {
    const risk = airport.environmentRisk;
    if (risk >= 7) {
      return {
        speed: 4,
        intensity: 0.4,
        baseColor: new Color("#ff1744"),
        brightColor: new Color("#ff6b9d"),
      };
    } else if (risk >= 5) {
      return {
        speed: 3,
        intensity: 0.3,
        baseColor: new Color("#eab308"),
        brightColor: new Color("#facc15"),
      };
    } else if (risk >= 1) {
      return {
        speed: 2,
        intensity: 0.25,
        baseColor: new Color("#4caf50"),
        brightColor: new Color("#81c784"),
      };
    } else {
      return {
        speed: 1.5,
        intensity: 0.2,
        baseColor: new Color("#4caf50"),
        brightColor: new Color("#81c784"),
      };
    }
  }, [airport.environmentRisk]);

  // 预分配用于帧内插值的 Color 对象（避免 GC）
  const tempColor = useRef(new Color());

  // 预计算固定位置（z=0.05），避免每帧 clone
  const fixedPosition = useMemo(() => {
    const pos = basePosition.clone();
    pos.z = 0.05;
    return pos;
  }, [basePosition]);

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

  useFrame(() => {
    if (!groupRef.current) return;

    groupRef.current.position.copy(fixedPosition);

    const time = Date.now() * 0.001;
    let intensity = isSelected
      ? 1.5 + Math.sin(time * 2) * 0.3
      : 1.2 + Math.sin(time * 1.5) * 0.25;

    if (isViewing) {
      intensity = 2.0 + Math.sin(time * 3) * 0.4;
    }

    // 使用预分配的 tempColor 避免 GC
    const pulse = Math.sin(time * pulseColors.speed) * 0.5 + 0.5;
    tempColor.current.lerpColors(
      pulseColors.baseColor,
      pulseColors.brightColor,
      pulse * pulseColors.intensity,
    );

    if (materialRefs.current.outer) {
      materialRefs.current.outer.color.copy(tempColor.current);
      materialRefs.current.outer.opacity =
        (isViewing ? 0.8 : isSelected ? 0.7 : 0.6) * intensity;
    }
    if (materialRefs.current.inner) {
      materialRefs.current.inner.color.copy(tempColor.current);
      materialRefs.current.inner.opacity =
        (isViewing ? 1.0 : isSelected ? 1.0 : 1.0) * Math.min(intensity, 1.2);
    }

    if (isViewing && labelRef.current && camera) {
      labelRef.current.lookAt(camera.position);
      labelRef.current.position.set(
        fixedPosition.x,
        fixedPosition.y,
        fixedPosition.z + 0.08,
      );
    }
  });

  const size = isViewing ? 0.04 : isSelected ? 0.03 : 0.02;
  const innerSize = isViewing ? 0.005 : isSelected ? 0.02 : 0.015;
  const glowSize = size * 1.0;

  return (
    <group ref={groupRef}>
      {/* 外层大光晕 */}
      <mesh
        position={[0, 0, -0.01]}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onPointerMove={handlePointerMove}
      >
        <circleGeometry args={[glowSize, 32]} />
        <meshBasicMaterial
          color={airport.color}
          transparent
          opacity={0.2}
          side={DoubleSide}
        />
      </mesh>
      {/* 外层光晕 */}
      <mesh
        position={[0, 0, 0]}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onPointerMove={handlePointerMove}
      >
        <circleGeometry args={[size, 32]} />
        <meshBasicMaterial
          ref={(ref) => {
            if (ref) materialRefs.current.outer = ref;
          }}
          color={airport.color}
          transparent
          opacity={0.6}
          side={DoubleSide}
        />
      </mesh>
      {/* 内层实心点 */}
      <mesh position={[0, 0, 0.01]}>
        <circleGeometry args={[innerSize, 16]} />
        <meshBasicMaterial
          ref={(ref) => {
            if (ref) materialRefs.current.inner = ref;
          }}
          color={airport.color}
          transparent
          opacity={1.0}
          side={DoubleSide}
        />
      </mesh>
      {/* 中心白点 */}
      <mesh position={[0, 0, 0.02]}>
        <circleGeometry args={[innerSize * 0.5, 8]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={1.0}
          side={DoubleSide}
        />
      </mesh>
      {/* 机场名称标签 */}
      {isViewing && (
        <group ref={labelRef}>
          <Text
            color="#ffffff"
            fontSize={0.3}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.03}
            outlineColor="#000000"
            maxWidth={2.5}
            renderOrder={100}
          >
            {getAirportDisplayCode}
          </Text>
        </group>
      )}
    </group>
  );
}

interface MapCountryLabelProps {
  iso: string | null;
  name: string;
  position: Vector3;
  isSelected: boolean;
  isHovered: boolean;
  onPointerOver: () => void;
  onPointerOut: () => void;
  onPointerDown: () => void;
}

function MapCountryLabel({
  iso: _iso, // eslint-disable-line @typescript-eslint/no-unused-vars
  name,
  position,
  isSelected,
  isHovered,
  onPointerOver,
  onPointerOut,
  onPointerDown,
}: MapCountryLabelProps) {
  const { gl, camera } = useThree();
  const groupRef = useRef<Group>(null);

  useFrame(() => {
    if (!groupRef.current || !camera) return;
    groupRef.current.lookAt(camera.position);
  });

  const fontSize = isSelected ? 0.18 : isHovered ? 0.16 : 0.14;
  const outlineWidth = isSelected ? 0.025 : isHovered ? 0.02 : 0.015;
  const renderOrder = isSelected ? 20 : isHovered ? 10 : 5;
  const color = isSelected
    ? "#eab308"
    : isHovered
      ? "#facc15"
      : "rgba(229, 231, 235, 0.7)";

  return (
    <group ref={groupRef} position={[position.x, position.y, 0.1]}>
      <Text
        color={color}
        fontSize={fontSize}
        anchorX="center"
        anchorY="middle"
        outlineWidth={outlineWidth}
        outlineColor="#000000"
        maxWidth={1.5}
        renderOrder={renderOrder}
        onPointerDown={(event) => {
          event.stopPropagation();
          onPointerDown();
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          if (gl.domElement) {
            gl.domElement.style.cursor = "pointer";
          }
          onPointerOver();
        }}
        onPointerOut={(event) => {
          event.stopPropagation();
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

interface MapCameraControllerProps {
  selectedCountry: string | null;
  countryLabels: CountryLabel[];
  orbitControlsRef: React.MutableRefObject<OrbitControlsImpl | null>;
}

function MapCameraController({
  selectedCountry,
  countryLabels,
  orbitControlsRef,
}: MapCameraControllerProps) {
  const { camera } = useThree();
  const orthoCamera = camera as OrthographicCameraImpl;

  const isAnimatingRef = useRef(false);
  const animStartRef = useRef(0);
  const animDuration = 600;
  const startPosRef = useRef(new Vector3());
  const targetPosRef = useRef(new Vector3());
  const startTargetRef = useRef(new Vector3());
  const targetTargetRef = useRef(new Vector3());
  const startZoomRef = useRef<number>(orthoCamera.zoom);
  const targetZoomRef = useRef<number>(100);
  const initialZoom = 100;
  const selectedCountryZoom = 150;
  // 中国地图居中的初始位置 (lat=35, lon=105, MAP_SCALE=6)
  const initialTarget = useMemo(() => new Vector3(3.5, 1.17, 0), []);
  const initialCamPos = useMemo(() => new Vector3(3.5, 1.17, 10), []);

  const ease = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

  const findCountryPosition = useCallback(
    (iso: string | null) => {
      if (!iso) return null;
      const found = countryLabels.find((c) => c.iso === iso);
      if (found) return found.position.clone();
      const alt = countryLabels.find((c) => c.key === iso);
      return alt ? alt.position.clone() : null;
    },
    [countryLabels],
  );

  const startAnimation = useCallback(
    (toPosition: Vector3 | null, toZoom: number) => {
      isAnimatingRef.current = true;
      animStartRef.current = performance.now();
      startPosRef.current.copy(camera.position);
      startTargetRef.current.copy(
        orbitControlsRef.current?.target ?? new Vector3(0, 0, 0),
      );

      if (toPosition) {
        const camZ = camera.position.z;
        targetPosRef.current.set(toPosition.x, toPosition.y, camZ);
        targetTargetRef.current.set(toPosition.x, toPosition.y, 0);
      } else {
        // 回到中国居中视角
        targetPosRef.current.set(
          initialTarget.x,
          initialTarget.y,
          camera.position.z,
        );
        targetTargetRef.current.copy(initialTarget);
      }

      startZoomRef.current = orthoCamera.zoom;
      targetZoomRef.current = toZoom;

      if (orbitControlsRef.current) {
        orbitControlsRef.current.enabled = false;
      }
    },
    [camera, orthoCamera, orbitControlsRef],
  );

  useEffect(() => {
    const pos = findCountryPosition(selectedCountry);
    if (selectedCountry && pos) {
      startAnimation(pos, selectedCountryZoom);
    } else {
      startAnimation(null, initialZoom);
    }
  }, [selectedCountry, findCountryPosition, startAnimation]);

  useFrame(() => {
    if (!isAnimatingRef.current) return;

    const now = performance.now();
    const tRaw = (now - animStartRef.current) / animDuration;
    const t = Math.min(1, Math.max(0, tRaw));
    const tt = ease(t);

    camera.position.lerpVectors(startPosRef.current, targetPosRef.current, tt);
    if (orbitControlsRef.current) {
      const currTarget = orbitControlsRef.current.target;
      currTarget.lerpVectors(
        startTargetRef.current,
        targetTargetRef.current,
        tt,
      );
      orbitControlsRef.current.update();
    }

    orthoCamera.zoom =
      startZoomRef.current +
      (targetZoomRef.current - startZoomRef.current) * tt;
    orthoCamera.updateProjectionMatrix();

    if (t >= 1) {
      isAnimatingRef.current = false;
      if (orbitControlsRef.current) {
        orbitControlsRef.current.target.copy(targetTargetRef.current);
        orbitControlsRef.current.update();
        orbitControlsRef.current.enabled = true;
      }
    }
  });

  const initedRef = useRef(false);
  useEffect(() => {
    if (initedRef.current) return;
    // 初始化：中国居中
    camera.position.set(initialCamPos.x, initialCamPos.y, initialCamPos.z);
    orthoCamera.zoom = initialZoom;
    orthoCamera.updateProjectionMatrix();
    if (orbitControlsRef.current) {
      orbitControlsRef.current.target.copy(initialTarget);
      orbitControlsRef.current.update();
    }
    initedRef.current = true;
  }, [orthoCamera, orbitControlsRef]);

  return null;
}

export default MapView;
