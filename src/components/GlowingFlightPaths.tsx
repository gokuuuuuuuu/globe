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
import { Text } from '@react-three/drei'
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

interface GlowingFlightPathProps extends FlightRouteInfo {
  start: Vector3
  end: Vector3
  radius: number
  color?: string
}

// 飞机组件
function FlightPlane({ 
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
  // 为每条航线设置随机初始位置，避免所有飞机同时出现
  const progressRef = useRef(Math.random())
  const { gl, camera } = useThree()
  const { setHoveredFlightRoute, setTooltipPosition } = useAppStore()

  // 缓慢飞行动画
  useFrame((_state, delta) => {
    if (!groupRef.current || !camera) return

    // 缓慢增加进度（模拟飞机飞行速度）- 非常慢的速度
    const speed = 0.01 // 飞行速度，非常慢（从0.05降低到0.01）
    progressRef.current += delta * speed
    
    // 循环飞行（到达终点后重新开始）
    if (progressRef.current >= 1) {
      progressRef.current = 0
    }

    // 获取当前飞机位置 - 确保严格在航线上
    const t = progressRef.current
    const position = curve.getPoint(t)
    // 直接设置位置，确保飞机严格在航线上
    groupRef.current.position.set(position.x, position.y-0.01, position.z)

    // 计算飞机朝向（沿着曲线切线方向）
    const tangent = curve.getTangent(t).normalize()
    
    // 让飞机始终面向相机（billboard效果），确保图标始终可见
    const cameraDirection = new Vector3()
      .subVectors(camera.position, position)
      .normalize()
    
    // 先让飞机面向相机
    groupRef.current.lookAt(position.clone().add(cameraDirection))
    
    // 计算切线在相机视角平面上的投影
    const tangentInPlane = tangent.clone()
    const dot = tangent.dot(cameraDirection)
    tangentInPlane.sub(cameraDirection.clone().multiplyScalar(dot))
    
    // 如果切线在平面上的投影足够大，旋转飞机使其机头指向飞行方向
    if (tangentInPlane.length() > 0.01) {
      tangentInPlane.normalize()
      
      // 获取当前面向相机时的前方向（在相机视角平面内）
      // 面向相机时，前方向是 (0, 0, -1) 在相机视角平面上的投影
      const forward = new Vector3(0, 0, -1)
      forward.applyQuaternion(groupRef.current.quaternion)
      const forwardInPlane = forward.clone()
      forwardInPlane.sub(cameraDirection.clone().multiplyScalar(forward.dot(cameraDirection)))
      
      if (forwardInPlane.length() > 0.01) {
        forwardInPlane.normalize()
        
        // 计算右方向
        const right = new Vector3().crossVectors(cameraDirection, forwardInPlane).normalize()
        
        // 计算旋转角度
        const angle = Math.atan2(
          tangentInPlane.dot(right),
          tangentInPlane.dot(forwardInPlane)
        )
        
        // 绕相机方向轴旋转
        groupRef.current.rotateOnWorldAxis(cameraDirection, angle)
      }
    }
  })

  // 交互事件处理
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
      {/* 飞机图标 - 使用 Text 组件显示飞机 emoji，颜色根据机的风险值 */}
      <Text
        position={[0, 0, 0]}
        fontSize={0.02}
        color={getMachineRiskColor(machineRisk)}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.002}
        outlineColor="#000000"
        renderOrder={1000}
      >
        ✈️
      </Text>
    </group>
  )
}

function GlowingFlightPath({ 
  start, 
  end, 
  radius, 
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
}: GlowingFlightPathProps) {
  const materialRef = useRef<ShaderMaterial>(null)
  const { gl } = useThree()
  const { setHoveredFlightRoute, setTooltipPosition } = useAppStore()
  
  // 创建曲线几何
  const curve = useMemo(() => {
    // 1. 起点和终点
    const vStart = start.clone()
    const vEnd = end.clone()
    
    // 2. 计算控制点 (中点并向外挤出)
    // 中点
    const vMid = new Vector3().addVectors(vStart, vEnd).multiplyScalar(0.5)
    // 归一化并延伸到更高的高度
    const dist = vStart.distanceTo(vEnd)
    const midLen = vMid.length()
    
    // 越远的航线，拱起越高 - 降低外凸高度
    const heightOffset = radius * 0.5 + dist * 0.5 
    vMid.normalize().multiplyScalar(midLen + heightOffset)
    
    // 重新调整控制点高度逻辑 - 降低倍数以减少外凸
    const controlPoint = vMid.clone().normalize().multiplyScalar(radius * 1.13)
    
    return new QuadraticBezierCurve3(vStart, controlPoint, vEnd)
  }, [start, end, radius])

  // 颜色 uniform
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

  // 交互事件处理
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
      {/* 虚线航线 */}
      <mesh
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onPointerMove={handlePointerMove}
      >
        <tubeGeometry args={[curve, 64, 0.002, 16, false]} />
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
      <FlightPlane
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

interface GlowingFlightPathsProps {
  routes: FlightRouteData[]
  radius: number
}

export function GlowingFlightPaths({ routes, radius }: GlowingFlightPathsProps) {
  const { viewingFlightRouteId } = useAppStore()
  
  return (
    <group>
      {routes.map((route) => {
        const isViewing = viewingFlightRouteId === route.id
        // 如果正在查看，使用更亮的颜色和更大的半径
        const routeColor = isViewing ? '#60a5fa' : route.color
        const routeRadius = isViewing ? radius * 1.2 : radius
        
        return (
          <GlowingFlightPath
            key={route.id}
            start={route.from}
            end={route.to}
            radius={routeRadius}
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

