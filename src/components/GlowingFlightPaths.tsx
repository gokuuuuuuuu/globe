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

// 顶点着色器
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// 片元着色器 - 点线效果
const fragmentShader = `
  uniform float uTime;
  uniform vec3 uColor;
  varying vec2 vUv;

  void main() {
    // 点线效果
    // vUv.x 沿着管体路径 (0.0 -> 1.0)
    // vUv.y 沿着管体圆周 (0.0 -> 1.0)
    
    float dotSpacing = 0.05; // 点之间的间距
    float dotSize = 0.03; // 点的大小（增大以便更清晰可见）
    
    // 计算当前点在点线模式中的位置
    float pos = mod(vUv.x, dotSpacing);
    
    // 计算距离中心的距离（用于绘制圆形点）
    float centerY = 0.5;
    float distFromCenter = abs(vUv.y - centerY);
    float distFromDotCenter = length(vec2(pos - dotSpacing * 0.5, distFromCenter * 2.0));
    
    // 如果距离小于点的大小，显示点；否则透明
    // 使用 smoothstep 让点边缘更柔和
    float alpha = (1.0 - smoothstep(dotSize * 0.7, dotSize, distFromDotCenter)) * 0.9;
    
    // 颜色
    vec3 finalColor = uColor;

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
  useFrame((state, delta) => {
    if (!groupRef.current || !camera) return

    // 缓慢增加进度（模拟飞机飞行速度）- 降低速度
    const speed = 0.05 // 飞行速度，越小越慢（从0.1降低到0.05）
    progressRef.current += delta * speed
    
    // 循环飞行（到达终点后重新开始）
    if (progressRef.current >= 1) {
      progressRef.current = 0
    }

    // 获取当前飞机位置
    const t = progressRef.current
    const position = curve.getPoint(t)
    groupRef.current.position.copy(position)

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
      {/* 飞机图标 - 使用 Text 组件显示飞机 emoji */}
      <Text
        position={[0, 0, 0]}
        fontSize={0.02}
        color={color}
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
    
    // 越远的航线，拱起越高
    const heightOffset = radius * 0.5 + dist * 0.5 
    vMid.normalize().multiplyScalar(midLen + heightOffset)
    
    // 重新调整控制点高度逻辑
    const controlPoint = vMid.clone().normalize().multiplyScalar(radius * 1.5)
    
    return new QuadraticBezierCurve3(vStart, controlPoint, vEnd)
  }, [start, end, radius])

  // 颜色 uniform
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new Color(color) },
  }), [color])

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
        <tubeGeometry args={[curve, 64, 0.008, 8, false]} />
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
  return (
    <group>
      {routes.map((route) => (
        <GlowingFlightPath
          key={route.id}
          start={route.from}
          end={route.to}
          radius={radius}
          color={route.color}
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
      ))}
    </group>
  )
}

