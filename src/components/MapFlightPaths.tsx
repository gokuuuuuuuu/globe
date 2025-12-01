import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { useMemo, useRef, useCallback } from 'react'
import {
  Color,
  DoubleSide,
  QuadraticBezierCurve3,
  ShaderMaterial,
  Vector3,
  Group,
} from 'three'
import { Text} from '@react-three/drei'
import { useAppStore } from '../store/useAppStore'
import { getMachineRiskColor } from '../data/flightData'

// 顶点着色器
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// 片元着色器 - 发光实线效果
const fragmentShader = `
  uniform float uTime;
  uniform vec3 uColor;
  varying vec2 vUv;

  void main() {
    // vUv.x 沿着管体路径 (0.0 -> 1.0)
    // vUv.y 沿着管体圆周 (0.0 -> 1.0)
    
    // 计算距离中心的距离（用于创建发光效果）
    float centerY = 0.5;
    float distFromCenter = abs(vUv.y - centerY);
    
    // 创建从中心到边缘的渐变效果
    // 中心最亮，边缘逐渐变暗
    float edgeFade = 1.0 - smoothstep(0.3, 0.5, distFromCenter);
    
    // 添加轻微的脉冲效果
    float pulse = 0.9 + 0.1 * sin(uTime * 2.0 + vUv.x * 10.0);
    
    // 计算最终透明度（中心不透明，边缘透明）
    float alpha = edgeFade * pulse * 0.85;
    
    // 增强中心亮度（发光效果）
    float glowIntensity = 1.0 + 0.5 * (1.0 - distFromCenter * 2.0);
    vec3 finalColor = uColor * glowIntensity;

    gl_FragColor = vec4(finalColor, alpha);
  }
`

interface FlightRouteInfo {
  flightNumber: string
  fromAirport: string
  toAirport: string
  status: string
  scheduledDeparture: string
  scheduledArrival: string
  humanRisk: number
  machineRisk: number
  environmentRisk: number
}

interface MapFlightPathProps extends FlightRouteInfo {
  start: Vector3
  end: Vector3
  color?: string
}

// 飞机组件（2D版本）
function MapFlightPlane({ 
  curve, 
  flightNumber,
  fromAirport,
  toAirport,
  status,
  scheduledDeparture,
  scheduledArrival,
  humanRisk,
  machineRisk,
  environmentRisk
}: {
  curve: QuadraticBezierCurve3
  color?: string
  flightNumber: string
  fromAirport: string
  toAirport: string
  status: string
  scheduledDeparture: string
  scheduledArrival: string
  humanRisk: number
  machineRisk: number
  environmentRisk: number
}) {
  const groupRef = useRef<Group>(null)
  const progressRef = useRef(Math.random())
  const { gl, camera } = useThree()
  const { setHoveredFlightRoute, setTooltipPosition } = useAppStore()

  useFrame((_state, delta) => {
    if (!groupRef.current || !camera) return

    const speed = 0.01 // 飞行速度，非常慢（从0.05降低到0.01）
    progressRef.current += delta * speed
    
    if (progressRef.current >= 1) {
      progressRef.current = 0
    }

    const t = progressRef.current
    const position = curve.getPoint(t)
    // 直接设置位置，确保飞机严格在航线上
    groupRef.current.position.set(position.x, position.y, position.z)

    // 计算飞机朝向（沿着曲线切线方向）
    const tangent = curve.getTangent(t).normalize()
    
    // 在2D地图上，飞机始终面向相机（从上往下看，z轴向上）
    groupRef.current.lookAt(position.clone().add(new Vector3(0, 0, 1)))
    
    // 旋转飞机使其机头指向飞行方向（在XY平面内）
    const angle = Math.atan2(tangent.y, tangent.x)
    groupRef.current.rotation.z = angle
  })

  const handlePointerOver = useCallback((event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    const nativeEvent = event.nativeEvent || (event as unknown as PointerEvent)
    setTooltipPosition({ x: nativeEvent.clientX, y: nativeEvent.clientY })
    setHoveredFlightRoute({
      flightNumber,
      fromAirport,
      toAirport,
      status,
      scheduledDeparture,
      scheduledArrival,
      humanRisk,
      machineRisk,
      environmentRisk,
    })
    if (gl.domElement) {
      gl.domElement.style.cursor = 'pointer'
    }
  }, [flightNumber, fromAirport, toAirport, status, scheduledDeparture, scheduledArrival, humanRisk, machineRisk, environmentRisk, setHoveredFlightRoute, setTooltipPosition, gl])

  const handlePointerOut = useCallback((event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    setHoveredFlightRoute(null)
    setTooltipPosition(null)
    if (gl.domElement) {
      gl.domElement.style.cursor = 'default'
    }
  }, [setHoveredFlightRoute, setTooltipPosition, gl])

  const handlePointerMove = useCallback((event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    const nativeEvent = event.nativeEvent || (event as unknown as PointerEvent)
    setTooltipPosition({ x: nativeEvent.clientX, y: nativeEvent.clientY })
  }, [setTooltipPosition])

  return (
    <group 
      ref={groupRef}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onPointerMove={handlePointerMove}
    >
      <Text
        position={[0, 0, 0]}
            fontSize={0.12}
        color={getMachineRiskColor(machineRisk)}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.01}
        outlineColor="#000000"
        renderOrder={1000}
      >
        ✈️
      </Text>
    </group>
  )
}

function MapFlightPath({ 
  start, 
  end, 
  color = '#4ff0ff',
  flightNumber,
  fromAirport,
  toAirport,
  status,
  scheduledDeparture,
  scheduledArrival,
  humanRisk,
  machineRisk,
  environmentRisk
}: MapFlightPathProps) {
  const materialRef = useRef<ShaderMaterial>(null)
  const { gl } = useThree()
  const { setHoveredFlightRoute, setTooltipPosition } = useAppStore()
  
  // 创建2D曲线（使用简单的直线或轻微曲线）
  const curve = useMemo(() => {
    const vStart = start.clone()
    const vEnd = end.clone()
    
    // 在2D地图上，使用直线或非常轻微的曲线
    // 对于长距离航线，可以稍微拱起以显示方向
    const dist = vStart.distanceTo(vEnd)
    const vMid = new Vector3().addVectors(vStart, vEnd).multiplyScalar(0.5)
    
    // 只在长距离航线时稍微拱起，短距离使用直线
    if (dist > 2) {
      // 计算垂直于起点到终点方向的偏移
      const dir = new Vector3().subVectors(vEnd, vStart).normalize()
      const perp = new Vector3(-dir.y, dir.x, 0) // 垂直向量
      const offset = perp.multiplyScalar(Math.min(dist * 0.1, 0.3))
      vMid.add(offset)
      vMid.z = 0.05 // 轻微抬高
    } else {
      vMid.z = 0.02 // 短距离航线几乎直线
    }
    
    return new QuadraticBezierCurve3(vStart, vMid, vEnd)
  }, [start, end])

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new Color(color) },
  }), [color])

  // 更新时间uniform以实现动画效果
  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += 0.01
    }
  })

  const handlePointerOver = useCallback((event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    const nativeEvent = event.nativeEvent || (event as unknown as PointerEvent)
    setTooltipPosition({ x: nativeEvent.clientX, y: nativeEvent.clientY })
    setHoveredFlightRoute({
      flightNumber,
      fromAirport,
      toAirport,
      status,
      scheduledDeparture,
      scheduledArrival,
      humanRisk,
      machineRisk,
      environmentRisk,
    })
    if (gl.domElement) {
      gl.domElement.style.cursor = 'pointer'
    }
  }, [flightNumber, fromAirport, toAirport, status, scheduledDeparture, scheduledArrival, humanRisk, machineRisk, environmentRisk, setHoveredFlightRoute, setTooltipPosition, gl])

  const handlePointerOut = useCallback((event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    setHoveredFlightRoute(null)
    setTooltipPosition(null)
    if (gl.domElement) {
      gl.domElement.style.cursor = 'default'
    }
  }, [setHoveredFlightRoute, setTooltipPosition, gl])

  const handlePointerMove = useCallback((event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    const nativeEvent = event.nativeEvent || (event as unknown as PointerEvent)
    setTooltipPosition({ x: nativeEvent.clientX, y: nativeEvent.clientY })
  }, [setTooltipPosition])

  return (
    <group>
      {/* 航线（2D地图上使用更细的线条） */}
      <mesh
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onPointerMove={handlePointerMove}
      >
        <tubeGeometry args={[curve, 64, 0.025, 16, false]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent
          side={DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* 飞机 */}
      <MapFlightPlane
        curve={curve}
        color={color}
        flightNumber={flightNumber}
        fromAirport={fromAirport}
        toAirport={toAirport}
        status={status}
        scheduledDeparture={scheduledDeparture}
        scheduledArrival={scheduledArrival}
        humanRisk={humanRisk}
        machineRisk={machineRisk}
        environmentRisk={environmentRisk}
      />
    </group>
  )
}

interface FlightRouteData extends FlightRouteInfo {
  id: string
  from: Vector3
  to: Vector3
  color?: string
}

interface MapFlightPathsProps {
  routes: FlightRouteData[]
}

export function MapFlightPaths({ routes }: MapFlightPathsProps) {
  const { viewingFlightRouteId } = useAppStore()
  
  return (
    <group>
      {routes.map((route) => {
        const isViewing = viewingFlightRouteId === route.id
        const routeColor = isViewing ? '#60a5fa' : route.color
        
        return (
          <MapFlightPath
            key={route.id}
            start={route.from}
            end={route.to}
            color={routeColor}
            flightNumber={route.flightNumber}
            fromAirport={route.fromAirport}
            toAirport={route.toAirport}
            status={route.status}
            scheduledDeparture={route.scheduledDeparture}
            scheduledArrival={route.scheduledArrival}
            humanRisk={route.humanRisk}
            machineRisk={route.machineRisk}
            environmentRisk={route.environmentRisk}
          />
        )
      })}
    </group>
  )
}

