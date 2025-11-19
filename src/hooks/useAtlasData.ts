import { useEffect, useMemo, useState } from 'react'
import type { AtlasData, WorldData, AtlasCountry } from '../types'

interface AtlasDataState {
  atlas: AtlasData | null
  world: WorldData | null
  isLoading: boolean
  error: string | null
  countriesList: { code: string; data: AtlasCountry }[]
}

export function useAtlasData(): AtlasDataState {
  const [atlas, setAtlas] = useState<AtlasData | null>(null)
  const [world, setWorld] = useState<WorldData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setError(null)
      const baseUrl = (import.meta.env.BASE_URL ?? '/').replace(/\/+$/, '')
      const makeUrl = (path: string) => `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`

      try {
        const [atlasRes, worldRes] = await Promise.all([
          fetch(makeUrl('data/countries.json')),
          fetch(makeUrl('data/world.json')),
        ])

        if (!atlasRes.ok) {
          throw new Error(`加载 countries.json 失败 (${atlasRes.status})`)
        }
        if (!worldRes.ok) {
          throw new Error(`加载 world.json 失败 (${worldRes.status})`)
        }

        const atlasJson = (await atlasRes.json()) as AtlasData
        const worldJson = (await worldRes.json()) as WorldData

        if (!cancelled) {
          setAtlas(atlasJson)
          setWorld(worldJson)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '数据加载失败')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  const countriesList = useMemo(() => {
    if (!atlas?.countries) return []
    return Object.entries(atlas.countries)
      .map(([code, data]) => ({ code, data }))
      .sort((a, b) => a.data.name.localeCompare(b.data.name))
  }, [atlas])

  return {
    atlas,
    world,
    isLoading,
    error,
    countriesList,
  }
}


