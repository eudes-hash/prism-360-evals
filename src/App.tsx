import { useState, useCallback, useRef } from 'react'
import Viewer from './components/Viewer'
import type { ViewerRef, ViewMode } from './components/Viewer'
import * as THREE from 'three'

interface Issue {
  id: string
  description: string
  cameraState: {
    position: THREE.Vector3
    target: THREE.Vector3
    fov: number
  }
}

function App() {
  const [mediaUrl, setMediaUrl] = useState<string | null>('/default-panorama.png')
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image')
  const [showGrid, setShowGrid] = useState(false)
  const [showSinusoidalGrid, setShowSinusoidalGrid] = useState(false)
  const [gridRotation, setGridRotation] = useState(0)
  const [gridDensity, setGridDensity] = useState(8)
  const [gridFov, setGridFov] = useState(90)
  const [sectorOpacity, setSectorOpacity] = useState(0.22)
  const [sectorColors, setSectorColors] = useState({
    front: '#2ecc71',
    right: '#f39c12',
    back: '#e74c3c',
    left: '#3498db',
  })
  const [polarColors, setPolarColors] = useState({
    top: '#8b5cf6',
    bottom: '#0ea5e9',
  })
  const [viewMode, setViewMode] = useState<ViewMode>('spherical')
  const [issues, setIssues] = useState<Issue[]>([])
  const [isLogging, setIsLogging] = useState(false)
  const [isMenuMinimized, setIsMenuMinimized] = useState(false)
  const [newIssueDesc, setNewIssueDesc] = useState('')
  
  const viewerRef = useRef<ViewerRef>(null)

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()

    console.log('File dropped')
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      console.log('File type:', file.type)
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        const url = URL.createObjectURL(file)
        console.log('Created URL:', url)
        setMediaType(file.type.startsWith('video/') ? 'video' : 'image')
        setMediaUrl((prev) => {
          if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev)
          return url
        })
      } else {
        alert('Please drop an image or video file.')
      }
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleLogIssue = () => {
    if (viewerRef.current) {
      setIsLogging(true)
    }
  }

  const saveIssue = () => {
    if (viewerRef.current && newIssueDesc) {
      const cameraState = viewerRef.current.getCameraState()
      const newIssue: Issue = {
        id: Date.now().toString(),
        description: newIssueDesc,
        cameraState
      }
      setIssues([...issues, newIssue])
      setNewIssueDesc('')
      setIsLogging(false)
    }
  }

  const restoreView = (issue: Issue) => {
    if (viewerRef.current) {
      viewerRef.current.setCameraState(issue.cameraState)
    }
  }

  const handleZoomIn = () => {
    viewerRef.current?.adjustSphericalZoom(-8)
  }

  const handleZoomOut = () => {
    viewerRef.current?.adjustSphericalZoom(8)
  }

  const exportIssues = () => {
    const data = JSON.stringify(issues, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '360-evaluation-report.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div 
      style={{ width: '100%', height: '100vh', backgroundColor: '#111', overflow: 'hidden', position: 'relative', display: 'flex' }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div style={{ flexGrow: 1, position: 'relative', height: '100%' }}>
        <Viewer 
          ref={viewerRef} 
          mediaUrl={mediaUrl}
          mediaType={mediaType}
          showGrid={showGrid} 
          viewMode={viewMode}
          showSinusoidalGrid={showSinusoidalGrid}
          gridRotation={gridRotation}
          gridDensity={gridDensity}
          gridFov={gridFov}
          sectorOpacity={sectorOpacity}
          sectorColors={sectorColors}
          polarColors={polarColors}
        />
        
        {/* Overlay UI */}
        <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 10, background: 'rgba(0,0,0,0.55)', padding: 16, borderRadius: 10, color: '#fff', width: isMenuMinimized ? 220 : 310, maxHeight: '90vh', overflowY: 'auto', transition: 'width 120ms ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMenuMinimized ? 0 : 16 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>360° Evaluator</h1>
            <button
              onClick={() => setIsMenuMinimized((prev) => !prev)}
              style={{
                background: '#374151',
                color: '#fff',
                border: '1px solid #4b5563',
                borderRadius: 8,
                fontSize: 12,
                padding: '6px 10px',
                cursor: 'pointer',
              }}
            >
              {isMenuMinimized ? 'Expandir' : 'Minimizar'}
            </button>
          </div>

          {!isMenuMinimized && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ cursor: 'pointer', background: '#2563eb', padding: '10px 12px', borderRadius: 8, fontSize: 13, textAlign: 'center', display: 'block' }}>
              Upload Image / Video
              <input 
                type="file" 
                accept="image/*,video/*" 
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0]
                    const url = URL.createObjectURL(file)
                    setMediaType(file.type.startsWith('video/') ? 'video' : 'image')
                    setMediaUrl((prev) => {
                      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev)
                      return url
                    })
                  }
                }}
              />
            </label>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, color: '#d1d5db' }}>View Mode</label>
              <select 
                value={viewMode} 
                onChange={(e) => setViewMode(e.target.value as ViewMode)}
                style={{ background: '#374151', color: '#fff', borderRadius: 6, border: '1px solid #4b5563', padding: '8px 10px', fontSize: 13 }}
              >
                <option value="spherical">Spherical (360°)</option>
                <option value="flat">Flat (2D)</option>
                <option value="equirectangular">Equirectangular (Plano)</option>
                <option value="rectilinear-front">Rectilinear Front</option>
                <option value="rectilinear-back">Rectilinear Back</option>
                <option value="rectilinear-left">Rectilinear Left</option>
                <option value="rectilinear-right">Rectilinear Right</option>
              </select>
            </div>

            <button 
              onClick={() => {
                setMediaType('image')
                setMediaUrl('/default-panorama.png')
              }}
              style={{ background: '#4b5563', color: '#fff', border: 'none', padding: '10px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}
            >
              Cargar Imagen Default
            </button>

            {viewMode === 'spherical' && (
              <>
              <button 
                onClick={() => setShowGrid(!showGrid)}
                  style={{ background: showGrid ? '#16a34a' : '#4b5563', color: '#fff', border: 'none', padding: '10px 12px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}
              >
                {showGrid ? 'Hide Grid' : 'Show Grid'}
              </button>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button
                    onClick={handleZoomOut}
                    style={{ background: '#4b5563', color: '#fff', border: 'none', padding: '10px 12px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}
                  >
                    Zoom Out
                  </button>
                  <button
                    onClick={handleZoomIn}
                    style={{ background: '#4b5563', color: '#fff', border: 'none', padding: '10px 12px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}
                  >
                    Zoom In
                  </button>
                </div>
                {showGrid && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: '#374151', padding: 10, borderRadius: 8 }}>
                    <label style={{ fontSize: 12, color: '#d1d5db' }}>
                      Transparencia sectores: {sectorOpacity.toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="0.7"
                      step="0.01"
                      value={sectorOpacity}
                      onChange={(e) => setSectorOpacity(parseFloat(e.target.value))}
                      style={{ width: '100%' }}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {(['front', 'right', 'back', 'left'] as const).map((sector) => (
                        <label
                          key={sector}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#d1d5db', textTransform: 'uppercase' }}
                        >
                          {sector}
                          <input
                            type="color"
                            value={sectorColors[sector]}
                            onChange={(e) =>
                              setSectorColors((prev) => ({ ...prev, [sector]: e.target.value }))
                            }
                            style={{ width: 28, height: 20, border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {(viewMode === 'flat' || viewMode === 'equirectangular') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button 
                  onClick={() => setShowSinusoidalGrid(!showSinusoidalGrid)}
                  style={{ background: showSinusoidalGrid ? '#16a34a' : '#4b5563', color: '#fff', border: 'none', padding: '10px 12px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}
                >
                  {showSinusoidalGrid ? 'Hide Sinusoidal Grid' : 'Show Sinusoidal Grid'}
                </button>
                
                {showSinusoidalGrid && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: '#374151', padding: 10, borderRadius: 8 }}>
                    <label style={{ fontSize: 12, color: '#d1d5db' }}>Grid Rotation (Face)</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6 }}>
                      <button onClick={() => setGridRotation(0)} style={{ background: gridRotation === 0 ? '#2563eb' : '#4b5563', color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, padding: '6px 4px', cursor: 'pointer' }}>Front</button>
                      <button onClick={() => setGridRotation(Math.PI/2)} style={{ background: gridRotation === Math.PI/2 ? '#2563eb' : '#4b5563', color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, padding: '6px 4px', cursor: 'pointer' }}>Right</button>
                      <button onClick={() => setGridRotation(Math.PI)} style={{ background: gridRotation === Math.PI ? '#2563eb' : '#4b5563', color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, padding: '6px 4px', cursor: 'pointer' }}>Back</button>
                      <button onClick={() => setGridRotation(Math.PI*1.5)} style={{ background: gridRotation === Math.PI*1.5 ? '#2563eb' : '#4b5563', color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, padding: '6px 4px', cursor: 'pointer' }}>Left</button>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max={Math.PI * 2} 
                      step="0.01" 
                      value={gridRotation} 
                      onChange={(e) => setGridRotation(parseFloat(e.target.value))}
                      style={{ width: '100%', marginTop: 4 }}
                    />
                    <label style={{ fontSize: 12, color: '#d1d5db' }}>Densidad: {gridDensity}</label>
                    <input
                      type="range"
                      min="4"
                      max="16"
                      step="1"
                      value={gridDensity}
                      onChange={(e) => setGridDensity(parseInt(e.target.value, 10))}
                      style={{ width: '100%' }}
                    />
                    <label style={{ fontSize: 12, color: '#d1d5db' }}>FOV: {gridFov}°</label>
                    <input
                      type="range"
                      min="60"
                      max="120"
                      step="1"
                      value={gridFov}
                      onChange={(e) => setGridFov(parseInt(e.target.value, 10))}
                      style={{ width: '100%' }}
                    />
                    {viewMode === 'equirectangular' && (
                      <>
                        <label style={{ fontSize: 12, color: '#d1d5db' }}>
                          Transparencia sectores: {sectorOpacity.toFixed(2)}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="0.7"
                          step="0.01"
                          value={sectorOpacity}
                          onChange={(e) => setSectorOpacity(parseFloat(e.target.value))}
                          style={{ width: '100%' }}
                        />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          {(['front', 'right', 'back', 'left'] as const).map((sector) => (
                            <label
                              key={sector}
                              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#d1d5db', textTransform: 'uppercase' }}
                            >
                              {sector}
                              <input
                                type="color"
                                value={sectorColors[sector]}
                                onChange={(e) =>
                                  setSectorColors((prev) => ({ ...prev, [sector]: e.target.value }))
                                }
                                style={{ width: 28, height: 20, border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}
                              />
                            </label>
                          ))}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          {(['top', 'bottom'] as const).map((sector) => (
                            <label
                              key={sector}
                              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#d1d5db', textTransform: 'uppercase' }}
                            >
                              {sector}
                              <input
                                type="color"
                                value={polarColors[sector]}
                                onChange={(e) =>
                                  setPolarColors((prev) => ({ ...prev, [sector]: e.target.value }))
                                }
                                style={{ width: 28, height: 20, border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}
                              />
                            </label>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            <button 
              onClick={handleLogIssue}
              style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '10px 12px', borderRadius: 8, fontSize: 13, cursor: 'pointer', opacity: mediaUrl ? 1 : 0.6 }}
              disabled={!mediaUrl}
            >
              Log Issue
            </button>

            {issues.length > 0 && (
              <button 
                onClick={exportIssues}
                style={{ background: '#7c3aed', color: '#fff', border: 'none', padding: '10px 12px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}
              >
                Export Report ({issues.length})
              </button>
            )}
          </div>
          )}
        </div>

        {/* Issue Logging Modal */}
        {isLogging && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20 }}>
            <div style={{ background: '#1f2937', padding: 20, borderRadius: 10, width: 420 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 12px 0' }}>Log Issue</h2>
              <textarea
                style={{ width: '100%', height: 130, background: '#374151', color: '#fff', padding: 10, borderRadius: 8, border: '1px solid #4b5563', marginBottom: 14 }}
                placeholder="Describe the issue..."
                value={newIssueDesc}
                onChange={(e) => setNewIssueDesc(e.target.value)}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button 
                  onClick={() => setIsLogging(false)}
                  style={{ padding: '8px 12px', color: '#d1d5db', background: 'transparent', border: 'none', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={saveIssue}
                  style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar for Issues */}
      {issues.length > 0 && (
        <div style={{ width: 320, background: '#1f2937', borderLeft: '1px solid #374151', padding: 16, overflowY: 'auto' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 0 12px 0' }}>Logged Issues</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {issues.map((issue) => (
              <div 
                key={issue.id}
                style={{ background: '#374151', padding: 10, borderRadius: 8, cursor: 'pointer' }}
                onClick={() => restoreView(issue)}
              >
                <p style={{ fontSize: 13, color: '#d1d5db', margin: 0 }}>{issue.description}</p>
                <span style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginTop: 4 }}>
                  Click to view
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
