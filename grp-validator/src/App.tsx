import { useMemo, useState } from 'react'
import BrushToolbar from './components/BrushToolbar'
import EquirectangularViewer from './components/EquirectangularViewer'
import LayerControls from './components/LayerControls'
import { createMockSession, type MapLayer } from './lib/mockMaps'
import type { PixelPoint, SphericalPoint } from './lib/equirectangular'

export type BrushTool =
  | 'depth-leveler'
  | 'normal-snap-x'
  | 'normal-snap-y'
  | 'normal-snap-z'
  | 'buffer-expander'

export type BrushStroke = {
  id: string
  layer: Exclude<MapLayer, 'source'>
  pixel: PixelPoint
  radius: number
  spherical: SphericalPoint
  timestamp: string
  tool: BrushTool
}

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

const App = () => {
  const session = useMemo(() => createMockSession(), [])
  const [activeLayer, setActiveLayer] = useState<MapLayer>('depth')
  const [activeTool, setActiveTool] = useState<BrushTool>('depth-leveler')
  const [brushSize, setBrushSize] = useState(36)
  const [robotRadius, setRobotRadius] = useState(48)
  const [opacity, setOpacity] = useState(0.58)
  const [strokes, setStrokes] = useState<BrushStroke[]>([])

  const exportActivePng = () => {
    const canvas = session[activeLayer]
    canvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, `grp-${activeLayer}-map.png`)
    }, 'image/png')
  }

  const exportMetadata = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      session: {
        height: session.height,
        width: session.width,
      },
      strokes,
    }

    downloadBlob(
      new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }),
      'grp-validator-metadata.json',
    )
  }

  return (
    <main className="app-layout">
      <aside className="sidebar">
        <div className="brand">
          <span className="eyebrow">GRP Validator</span>
          <h1>Generative Robotic Perception</h1>
          <p>Audit and correct AI-generated 360 technical maps with mock data.</p>
        </div>

        <LayerControls
          activeLayer={activeLayer}
          onLayerChange={setActiveLayer}
          onOpacityChange={setOpacity}
          opacity={opacity}
        />

        <BrushToolbar
          activeTool={activeTool}
          brushSize={brushSize}
          onBrushSizeChange={setBrushSize}
          onRobotRadiusChange={setRobotRadius}
          onToolChange={setActiveTool}
          robotRadius={robotRadius}
        />

        <section className="panel">
          <div className="panel-header">
            <span>Export</span>
            <small>{strokes.length} corrections</small>
          </div>
          <button className="primary-action" onClick={exportActivePng} type="button">
            Export Active PNG
          </button>
          <button className="secondary-action" onClick={exportMetadata} type="button">
            Export JSON Metadata
          </button>
        </section>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <span className="eyebrow">Pixel-perfect ERP stream</span>
            <h2>Multi-Layer Overlay Viewer</h2>
          </div>
          <div className="status-card">
            <span>Active Layer</span>
            <strong>{activeLayer}</strong>
          </div>
          <div className="status-card">
            <span>Brush</span>
            <strong>{activeTool}</strong>
          </div>
        </header>

        <EquirectangularViewer
          activeLayer={activeLayer}
          activeTool={activeTool}
          brushSize={brushSize}
          onStroke={(stroke) => setStrokes((current) => [...current, stroke])}
          opacity={opacity}
          robotRadius={robotRadius}
          session={session}
        />
      </section>
    </main>
  )
}

export default App
