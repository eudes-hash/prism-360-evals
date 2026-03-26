import type { ViewMode } from './Viewer'
import type { ReactNode } from 'react'

interface SectorColors { front: string; right: string; back: string; left: string }
interface PolarColors { top: string; bottom: string }

interface SidebarProps {
  isMenuMinimized: boolean
  onToggleMinimized: () => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  showGrid: boolean
  onToggleGrid: () => void
  sectorOpacity: number
  onSectorOpacityChange: (val: number) => void
  sectorColors: SectorColors
  onSectorColorChange: (sector: keyof SectorColors, color: string) => void
  showSinusoidalGrid: boolean
  onToggleSinusoidalGrid: () => void
  gridRotation: number
  onGridRotationChange: (val: number) => void
  gridDensity: number
  onGridDensityChange: (val: number) => void
  polarColors: PolarColors
  onPolarColorChange: (sector: keyof PolarColors, color: string) => void
  issueCount: number
  onExportIssues: () => void
  isTourRunning: boolean
  tourStep: number
  tourDemoMode: string
  onStartGuideTour: () => void
  taskerEmail: string
  onClearEmail: () => void
  topSection?: ReactNode
}

function Sidebar({
  isMenuMinimized, onToggleMinimized,
  viewMode, onViewModeChange,
  showGrid, onToggleGrid,
  sectorOpacity, onSectorOpacityChange,
  sectorColors, onSectorColorChange,
  showSinusoidalGrid, onToggleSinusoidalGrid,
  gridRotation, onGridRotationChange,
  gridDensity, onGridDensityChange,
  polarColors, onPolarColorChange,
  issueCount, onExportIssues,
  isTourRunning, tourStep, tourDemoMode, onStartGuideTour,
  taskerEmail, onClearEmail,
  topSection,
}: SidebarProps) {
  return (
    <div
      style={{ width: isMenuMinimized ? 86 : 330, background: '#0f172a', borderRight: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', zIndex: 10, transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)', flexShrink: 0 }}
    >
      <div style={{ padding: isMenuMinimized ? 10 : 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: isMenuMinimized ? 'center' : 'space-between', flexDirection: isMenuMinimized ? 'column' : 'row', gap: isMenuMinimized ? 10 : 0, marginBottom: isMenuMinimized ? 0 : 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src="/logo.png" alt="Prism Logo" style={{ width: isMenuMinimized ? 28 : 32, height: isMenuMinimized ? 28 : 32, borderRadius: 8, objectFit: 'cover' }} />
            {!isMenuMinimized && (
              <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: '-0.02em', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Prism 360°</h1>
            )}
          </div>
          <button onClick={onToggleMinimized} aria-label={isMenuMinimized ? 'Expand sidebar' : 'Collapse sidebar'} style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: 'none', borderRadius: 6, fontSize: 12, padding: isMenuMinimized ? '6px 8px' : '6px 10px', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 500 }}>
            {isMenuMinimized ? '>' : 'Hide'}
          </button>
        </div>

        {!isMenuMinimized && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', maxHeight: 'calc(100vh - 100px)' }}>
            {topSection}
            <div data-tour="view-mode" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>View Mode</label>
              <select value={viewMode} onChange={(e) => onViewModeChange(e.target.value as ViewMode)} style={{ background: 'rgba(0,0,0,0.3)', color: '#f1f5f9', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', padding: '10px 12px', fontSize: 13, outline: 'none', width: '100%' }}>
                <option value="spherical">Spherical 360</option>
                <option value="equirectangular">Flat</option>
                <option value="dual">Dual View (Split)</option>
              </select>
            </div>

            {viewMode === 'spherical' && (
              <>
                <button data-tour="show-grid-button" onClick={onToggleGrid} style={{ background: showGrid ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)', color: showGrid ? '#4ade80' : '#cbd5e1', border: showGrid ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(255,255,255,0.05)', padding: '10px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
                  {showGrid ? 'Hide Grid' : 'Show Grid'}
                </button>
                <button data-tour="guide-tour-button" onClick={onStartGuideTour} title={`Tour mode: ${tourDemoMode}`} style={{ background: isTourRunning ? 'rgba(14,165,233,0.2)' : 'rgba(255,255,255,0.05)', color: isTourRunning ? '#7dd3fc' : '#cbd5e1', border: isTourRunning ? '1px solid rgba(14,165,233,0.4)' : '1px solid rgba(255,255,255,0.05)', padding: '10px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
                  {isTourRunning ? `Guide Tour Running (${tourStep})` : 'Start Guide Tour'}
                </button>

                {showGrid && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sector Opacity: {sectorOpacity.toFixed(2)}</label>
                    <input type="range" min="0" max="0.7" step="0.01" value={sectorOpacity} onChange={(e) => onSectorOpacityChange(parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#3b82f6' }} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {(['front', 'right', 'back', 'left'] as const).map((sector) => (
                        <label key={sector} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#cbd5e1', textTransform: 'capitalize' }}>
                          {sector}<input type="color" value={sectorColors[sector]} onChange={(e) => onSectorColorChange(sector, e.target.value)} style={{ width: 24, height: 24, border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', borderRadius: 4 }} />
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {viewMode === 'equirectangular' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button onClick={onToggleSinusoidalGrid} style={{ background: showSinusoidalGrid ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)', color: showSinusoidalGrid ? '#4ade80' : '#cbd5e1', border: showSinusoidalGrid ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(255,255,255,0.05)', padding: '10px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
                  {showSinusoidalGrid ? 'Hide Sinusoidal Grid' : 'Show Sinusoidal Grid'}
                </button>
                {showSinusoidalGrid && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Grid Rotation</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 4 }}>
                      {[{ label: 'Front', val: 0 }, { label: 'Right', val: Math.PI / 2 }, { label: 'Back', val: Math.PI }, { label: 'Left', val: Math.PI * 1.5 }].map(({ label, val }) => (
                        <button key={label} onClick={() => onGridRotationChange(val)} style={{ background: gridRotation === val ? '#3b82f6' : 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 4, fontSize: 10, padding: '6px 2px', cursor: 'pointer' }}>{label}</button>
                      ))}
                    </div>
                    <input type="range" min="0" max={Math.PI * 2} step="0.01" value={gridRotation} onChange={(e) => onGridRotationChange(parseFloat(e.target.value))} style={{ width: '100%', marginTop: 4, accentColor: '#3b82f6' }} />
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Density: {gridDensity}</label>
                    <input type="range" min="4" max="16" step="1" value={gridDensity} onChange={(e) => onGridDensityChange(parseInt(e.target.value, 10))} style={{ width: '100%', accentColor: '#3b82f6' }} />
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sector Opacity: {sectorOpacity.toFixed(2)}</label>
                    <input type="range" min="0" max="0.7" step="0.01" value={sectorOpacity} onChange={(e) => onSectorOpacityChange(parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#3b82f6' }} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {(['front', 'right', 'back', 'left'] as const).map((sector) => (
                        <label key={sector} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#cbd5e1', textTransform: 'capitalize' }}>
                          {sector}<input type="color" value={sectorColors[sector]} onChange={(e) => onSectorColorChange(sector, e.target.value)} style={{ width: 24, height: 24, border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', borderRadius: 4 }} />
                        </label>
                      ))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {(['top', 'bottom'] as const).map((sector) => (
                        <label key={sector} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#cbd5e1', textTransform: 'capitalize' }}>
                          {sector}<input type="color" value={polarColors[sector]} onChange={(e) => onPolarColorChange(sector, e.target.value)} style={{ width: 24, height: 24, border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', borderRadius: 4 }} />
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {issueCount > 0 && (
              <button onClick={onExportIssues} style={{ background: 'rgba(124,58,237,0.2)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.3)', padding: '10px 12px', borderRadius: 8, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s' }}>
                Export Report ({issueCount})
              </button>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Tasker</span>
                <span style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 600 }}>{taskerEmail || 'None'}</span>
              </div>
              <button
                onClick={onClearEmail}
                style={{
                  background: 'none',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#fca5a5',
                  borderRadius: 6,
                  padding: '4px 8px',
                  fontSize: 10,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'none'}
              >
                Change
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Sidebar
