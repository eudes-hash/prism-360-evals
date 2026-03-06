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
  const [showGrid, setShowGrid] = useState(true)
  const [showSinusoidalGrid, setShowSinusoidalGrid] = useState(true)
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

  const SAMPLE_IMAGES = [
    { name: 'Default Panorama', url: '/default-panorama.png' },
    { name: 'Image 1', url: '/360_images/11bdd45e-5276-4f9c-9e50-e2cd5b4c59ae.png' },
    { name: 'Image 2', url: '/360_images/2512f5ec-c51f-4e1d-8c8a-be05193dc2f9.png' },
    { name: 'Image 3', url: '/360_images/3f59fb4a-df51-4104-8ce0-a87305b0334b.png' },
    { name: 'Image 4', url: '/360_images/7d64f729-3efb-4cdd-a374-684ddde7d51a.png' },
    { name: 'Image 5', url: '/360_images/98f05e48-0c4b-4a97-858e-55ba75be6336.png' },
    { name: 'Image 6', url: '/360_images/dd156928-99d4-409b-8fe6-5b5e01468487.png' },
    { name: 'Image 7', url: '/360_images/e8347f4c-10c4-4699-86ee-b0d841299174.png' },
  ]
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
      style={{ width: '100%', height: '100vh', backgroundColor: '#0f172a', overflow: 'hidden', position: 'relative', display: 'flex' }}
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
        <div style={{ 
          position: 'absolute', 
          top: 20, 
          left: 20, 
          zIndex: 10, 
          background: 'rgba(15, 23, 42, 0.75)', 
          backdropFilter: 'blur(12px)',
          padding: 20, 
          borderRadius: 16, 
          color: '#fff', 
          width: isMenuMinimized ? 240 : 340, 
          maxHeight: 'calc(100vh - 40px)', 
          overflowY: 'auto', 
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 24px -1px rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMenuMinimized ? 0 : 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <img src="/logo.png" alt="Prism Logo" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }} />
              <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: '-0.02em', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Prism 360°
              </h1>
            </div>
            <button
              onClick={() => setIsMenuMinimized((prev) => !prev)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#94a3b8',
                border: 'none',
                borderRadius: 6,
                fontSize: 12,
                padding: '6px 10px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontWeight: 500
              }}
            >
              {isMenuMinimized ? 'Show' : 'Hide'}
            </button>
          </div>

          {!isMenuMinimized && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <label style={{ 
              cursor: 'pointer', 
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', 
              padding: '12px', 
              borderRadius: 10, 
              fontSize: 13, 
              fontWeight: 600,
              textAlign: 'center', 
              display: 'block',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
              transition: 'transform 0.1s',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
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
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>View Mode</label>
              <select 
                value={viewMode} 
                onChange={(e) => setViewMode(e.target.value as ViewMode)}
                style={{ 
                  background: 'rgba(0,0,0,0.3)', 
                  color: '#f1f5f9', 
                  borderRadius: 8, 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  padding: '10px 12px', 
                  fontSize: 13,
                  outline: 'none',
                  width: '100%'
                }}
              >
                <option value="spherical">Spherical (360°)</option>
                <option value="equirectangular">Equirectangular (Plano)</option>
                <option value="rectilinear-front">Rectilinear Front</option>
                <option value="rectilinear-back">Rectilinear Back</option>
                <option value="rectilinear-left">Rectilinear Left</option>
                <option value="rectilinear-right">Rectilinear Right</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Select Image</label>
              <select 
                onChange={(e) => {
                  if (e.target.value) {
                    setMediaType('image')
                    setMediaUrl(e.target.value)
                  }
                }}
                style={{ 
                  background: 'rgba(0,0,0,0.3)', 
                  color: '#f1f5f9', 
                  borderRadius: 8, 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  padding: '10px 12px', 
                  fontSize: 13,
                  outline: 'none',
                  width: '100%'
                }}
                value={mediaUrl || ''}
              >
                <option value="" disabled>Select an image...</option>
                {SAMPLE_IMAGES.map((img) => (
                  <option key={img.url} value={img.url}>
                    {img.name}
                  </option>
                ))}
              </select>
            </div>

            <button 
              onClick={() => {
                setMediaType('image')
                setMediaUrl('/default-panorama.png')
              }}
              style={{ background: 'rgba(255,255,255,0.05)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.05)', padding: '10px', borderRadius: 8, fontSize: 12, cursor: 'pointer', transition: 'background 0.2s', display: 'none' }}
            >
              Load Default Image
            </button>

            {viewMode === 'spherical' && (
              <>
              <button 
                onClick={() => setShowGrid(!showGrid)}
                  style={{ background: showGrid ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.05)', color: showGrid ? '#4ade80' : '#cbd5e1', border: showGrid ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(255,255,255,0.05)', padding: '10px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}
              >
                {showGrid ? 'Hide Grid' : 'Show Grid'}
              </button>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <button
                    onClick={handleZoomOut}
                    style={{ background: 'rgba(255,255,255,0.05)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.05)', padding: '10px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}
                  >
                    Zoom Out
                  </button>
                  <button
                    onClick={handleZoomIn}
                    style={{ background: 'rgba(255,255,255,0.05)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.05)', padding: '10px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}
                  >
                    Zoom In
                  </button>
                </div>
                {showGrid && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Sector Opacity: {sectorOpacity.toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="0.7"
                      step="0.01"
                      value={sectorOpacity}
                      onChange={(e) => setSectorOpacity(parseFloat(e.target.value))}
                      style={{ width: '100%', accentColor: '#3b82f6' }}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {(['front', 'right', 'back', 'left'] as const).map((sector) => (
                        <label
                          key={sector}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#cbd5e1', textTransform: 'capitalize' }}
                        >
                          {sector}
                          <input
                            type="color"
                            value={sectorColors[sector]}
                            onChange={(e) =>
                              setSectorColors((prev) => ({ ...prev, [sector]: e.target.value }))
                            }
                            style={{ width: 24, height: 24, border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', borderRadius: 4 }}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {viewMode === 'equirectangular' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button 
                  onClick={() => setShowSinusoidalGrid(!showSinusoidalGrid)}
                  style={{ background: showSinusoidalGrid ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.05)', color: showSinusoidalGrid ? '#4ade80' : '#cbd5e1', border: showSinusoidalGrid ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(255,255,255,0.05)', padding: '10px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}
                >
                  {showSinusoidalGrid ? 'Hide Sinusoidal Grid' : 'Show Sinusoidal Grid'}
                </button>
                
                {showSinusoidalGrid && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Grid Rotation</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 4 }}>
                      <button onClick={() => setGridRotation(0)} style={{ background: gridRotation === 0 ? '#3b82f6' : 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 4, fontSize: 10, padding: '6px 2px', cursor: 'pointer' }}>Front</button>
                      <button onClick={() => setGridRotation(Math.PI/2)} style={{ background: gridRotation === Math.PI/2 ? '#3b82f6' : 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 4, fontSize: 10, padding: '6px 2px', cursor: 'pointer' }}>Right</button>
                      <button onClick={() => setGridRotation(Math.PI)} style={{ background: gridRotation === Math.PI ? '#3b82f6' : 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 4, fontSize: 10, padding: '6px 2px', cursor: 'pointer' }}>Back</button>
                      <button onClick={() => setGridRotation(Math.PI*1.5)} style={{ background: gridRotation === Math.PI*1.5 ? '#3b82f6' : 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 4, fontSize: 10, padding: '6px 2px', cursor: 'pointer' }}>Left</button>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max={Math.PI * 2} 
                      step="0.01" 
                      value={gridRotation} 
                      onChange={(e) => setGridRotation(parseFloat(e.target.value))}
                      style={{ width: '100%', marginTop: 4, accentColor: '#3b82f6' }}
                    />
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Density: {gridDensity}</label>
                    <input
                      type="range"
                      min="4"
                      max="16"
                      step="1"
                      value={gridDensity}
                      onChange={(e) => setGridDensity(parseInt(e.target.value, 10))}
                      style={{ width: '100%', accentColor: '#3b82f6' }}
                    />
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>FOV: {gridFov}°</label>
                    <input
                      type="range"
                      min="60"
                      max="120"
                      step="1"
                      value={gridFov}
                      onChange={(e) => setGridFov(parseInt(e.target.value, 10))}
                      style={{ width: '100%', accentColor: '#3b82f6' }}
                    />
                    {viewMode === 'equirectangular' && (
                      <>
                        <label style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Sector Opacity: {sectorOpacity.toFixed(2)}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="0.7"
                          step="0.01"
                          value={sectorOpacity}
                          onChange={(e) => setSectorOpacity(parseFloat(e.target.value))}
                          style={{ width: '100%', accentColor: '#3b82f6' }}
                        />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          {(['front', 'right', 'back', 'left'] as const).map((sector) => (
                            <label
                              key={sector}
                              style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#cbd5e1', textTransform: 'capitalize' }}
                            >
                              {sector}
                              <input
                                type="color"
                                value={sectorColors[sector]}
                                onChange={(e) =>
                                  setSectorColors((prev) => ({ ...prev, [sector]: e.target.value }))
                                }
                                style={{ width: 24, height: 24, border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', borderRadius: 4 }}
                              />
                            </label>
                          ))}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          {(['top', 'bottom'] as const).map((sector) => (
                            <label
                              key={sector}
                              style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#cbd5e1', textTransform: 'capitalize' }}
                            >
                              {sector}
                              <input
                                type="color"
                                value={polarColors[sector]}
                                onChange={(e) =>
                                  setPolarColors((prev) => ({ ...prev, [sector]: e.target.value }))
                                }
                                style={{ width: 24, height: 24, border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', borderRadius: 4 }}
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
              style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: '#fff', border: 'none', padding: '12px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: mediaUrl ? 1 : 0.6, boxShadow: '0 2px 8px rgba(220, 38, 38, 0.25)' }}
              disabled={!mediaUrl}
            >
              Log Issue
            </button>

            {issues.length > 0 && (
              <button 
                onClick={exportIssues}
                style={{ background: 'rgba(124, 58, 237, 0.2)', color: '#a78bfa', border: '1px solid rgba(124, 58, 237, 0.3)', padding: '10px 12px', borderRadius: 8, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s' }}
              >
                Export Report ({issues.length})
              </button>
            )}
            </div>
          )}
        </div>

        {/* Issue Logging Modal */}
        {isLogging && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20, backdropFilter: 'blur(4px)' }}>
            <div style={{ background: '#1e293b', padding: 24, borderRadius: 16, width: 420, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 0 16px 0' }}>Log Issue</h2>
              <textarea
                style={{ width: '100%', height: 130, background: '#0f172a', color: '#fff', padding: 12, borderRadius: 8, border: '1px solid #334155', marginBottom: 16, fontSize: 14, resize: 'none' }}
                placeholder="Describe the issue..."
                value={newIssueDesc}
                onChange={(e) => setNewIssueDesc(e.target.value)}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button 
                  onClick={() => setIsLogging(false)}
                  style={{ padding: '8px 16px', color: '#94a3b8', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}
                >
                  Cancel
                </button>
                <button 
                  onClick={saveIssue}
                  style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
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
        <div style={{ width: 320, background: '#0f172a', borderLeft: '1px solid #1e293b', padding: 20, overflowY: 'auto' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: '0 0 16px 0' }}>Logged Issues</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {issues.map((issue) => (
              <div 
                key={issue.id}
                style={{ background: '#1e293b', padding: 12, borderRadius: 10, cursor: 'pointer', border: '1px solid #334155', transition: 'border-color 0.2s' }}
                onClick={() => restoreView(issue)}
              >
                <p style={{ fontSize: 13, color: '#e2e8f0', margin: 0, lineHeight: 1.5 }}>{issue.description}</p>
                <span style={{ fontSize: 11, color: '#64748b', display: 'block', marginTop: 8, fontWeight: 500 }}>
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