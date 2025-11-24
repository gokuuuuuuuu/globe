import './App.css'
// import { useMemo } from 'react'
import { CountryStacksView } from './views/CountryStacksView'
import { GlobeView } from './views/GlobeView'
import { MapView } from './views/MapView'
import { useAtlasData } from './hooks/useAtlasData'
import { useAppStore } from './store/useAppStore'
import { LeftToolbar } from './components/LeftToolbar'
// import type { ViewMode } from './types'

// const VIEW_TABS: { key: ViewMode; label: string; desc: string }[] = [
//   { key: 'globe', label: 'Globe view', desc: '球面展示世界轮廓' },
//   { key: 'map', label: 'Map view', desc: '平面地图概览' },
//   { key: 'stacks', label: 'Country stacks', desc: '出口规模柱体' },
// ]

function App() {
  const { atlas, world, isLoading, error
    // , countriesList 
  } = useAtlasData()
  const {
    view,
    // setView,
    // selectedCountry,
    // setSelectedCountry,
    // setHoveredCountry,
  } = useAppStore()

  // const activeCountryName = useMemo(() => {
  //   if (!atlas || !selectedCountry) return 'All countries'
  //   return atlas.countries[selectedCountry]?.name ?? selectedCountry
  // }, [atlas, selectedCountry])

  const canRender = !!atlas && !!world

  // const handleViewChange = (next: ViewMode) => {
  //   setHoveredCountry(null)
  //   setView(next)
  // }

  // const handleCountryChange = (code: string) => {
  //   setHoveredCountry(null)
  //   setSelectedCountry(code || null)
  // }

  const renderView = () => {
    if (!atlas || !world) return null
    switch (view) {
      case 'globe':
        return <GlobeView atlas={atlas} world={world} />
      case 'map':
        return <MapView world={world} atlas={atlas} />
      case 'stacks':
        return <CountryStacksView atlas={atlas} />
      default:
        return null
    }
  }

  return (
    <div className="app-root">
      <LeftToolbar />
      {/* <header className="app-header">
        <div className="brand">
          <div className="brand-title">Atlas Globe</div>
          <div className="brand-subtitle">基于 React Three Fiber 的可视化重构</div>
        </div>
        <nav className="view-switcher">
          {VIEW_TABS.map(({ key, label, desc }) => (
            <button
              key={key}
              type="button"
              className={key === view ? 'tab active' : 'tab'}
              onClick={() => handleViewChange(key)}
            >
              <span className="tab-label">{label}</span>
              <span className="tab-desc">{desc}</span>
            </button>
          ))}
        </nav>
        <div className="country-select">
          <label htmlFor="country-select">选择国家</label>
          <select
            id="country-select"
            value={selectedCountry ?? ''}
            onChange={(event) => handleCountryChange(event.target.value)}
          >
            <option value="">全部国家</option>
            {countriesList.map(({ code, data }) => (
              <option key={code} value={code}>
                {data.name}
              </option>
            ))}
          </select>
          <span className="active-country">当前：{activeCountryName}</span>
        </div>
      </header> */}
      <main className="app-main">
        {isLoading && (
          <div className="status-card">
            <div className="spinner" />
            <p>数据加载中...</p>
          </div>
        )}
        {!isLoading && error && (
          <div className="status-card error">
            <p>加载失败：{error}</p>
          </div>
        )}
        {!isLoading && !error && canRender && renderView()}
      </main>
    </div>
  )
}

export default App
