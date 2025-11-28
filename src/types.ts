export type ViewMode = 'globe' | 'map' | 'stacks' | 'airport-stacks'

export interface WorldFeature {
  type: 'Feature'
  properties: Record<string, any>
  geometry: {
    type: 'Polygon' | 'MultiPolygon'
    coordinates: number[][][] | number[][][][]
  }
}

export interface WorldData {
  type: 'FeatureCollection'
  features: WorldFeature[]
}

export interface AtlasCountry {
  id?: number
  name: string
  iso?: string
  lat?: number
  lon?: number
  exports?: number
  products?: Record<string, number>
  area?: number
  [key: string]: any
}

export interface AtlasProduct {
  name: string
  color?: string
  [key: string]: any
}

export interface AtlasCategory {
  id: number
  name?: string
  color?: string
  active?: boolean
  [key: string]: any
}

export interface AtlasData {
  countries: Record<string, AtlasCountry>
  products: Record<string, AtlasProduct>
  categories: Record<string, AtlasCategory>
  trade: Record<string, any>
}


