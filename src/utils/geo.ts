import { Vector3 } from 'three'
import type { WorldFeature } from '../types'

const DEG2RAD = Math.PI / 180

export function latLonToCartesian(lat: number, lon: number, radius = 1): Vector3 {
  const phi = (90 - lat) * DEG2RAD
  const theta = (lon + 180) * DEG2RAD

  const x = -(radius * Math.sin(phi) * Math.cos(theta))
  const z = radius * Math.sin(phi) * Math.sin(theta)
  const y = radius * Math.cos(phi)

  return new Vector3(x, y, z)
}

export function latLonToPlane(lat: number, lon: number, scale = 1): Vector3 {
  // 简单的等距矩形投影
  const x = (lon / 180) * scale
  const y = (lat / 180) * scale
  return new Vector3(x, y, 0)
}

type FlattenedPolygon = Vector3[]

export function featurePolygonsOnSphere(feature: WorldFeature, radius = 1): FlattenedPolygon[] {
  const { geometry } = feature
  if (geometry.type === 'Polygon') {
    return (geometry.coordinates as number[][][]).map((ring) =>
      (ring as number[][]).map((coord) => {
        const [lon, lat] = coord as [number, number]
        return latLonToCartesian(lat, lon, radius)
      }),
    )
  }
  if (geometry.type === 'MultiPolygon') {
    return (geometry.coordinates as number[][][][]).flatMap((polygon) =>
      (polygon as number[][][]).map((ring) =>
        (ring as number[][]).map((coord) => {
          const [lon, lat] = coord as [number, number]
          return latLonToCartesian(lat, lon, radius)
        }),
      ),
    )
  }
  return []
}

export function featurePolygonsOnPlane(feature: WorldFeature, scale = 1): FlattenedPolygon[] {
  const { geometry } = feature
  if (geometry.type === 'Polygon') {
    return (geometry.coordinates as number[][][]).map((ring) =>
      (ring as number[][]).map((coord) => {
        const [lon, lat] = coord as [number, number]
        return latLonToPlane(lat, lon, scale)
      }),
    )
  }
  if (geometry.type === 'MultiPolygon') {
    return (geometry.coordinates as number[][][][]).flatMap((polygon) =>
      (polygon as number[][][]).map((ring) =>
        (ring as number[][]).map((coord) => {
          const [lon, lat] = coord as [number, number]
          return latLonToPlane(lat, lon, scale)
        }),
      ),
    )
  }
  return []
}

export function deriveIsoCode(feature: WorldFeature): string | null {
  const props = feature.properties ?? {}
  const candidates = [
    props.iso_a2,
    props.ISO_A2,
    props.iso,
    props.id,
    props.ADM0_A3,
    props.ADMIN,
    (feature as { id?: string }).id,
  ]
  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim().toUpperCase()
    }
  }
  return null
}

export function sanitizeRing(ring: number[][]): number[][] {
  if (ring.length > 1) {
    const first = ring[0]
    const last = ring[ring.length - 1]
    if (first[0] === last[0] && first[1] === last[1]) {
      return ring.slice(0, -1)
    }
  }
  return ring
}


