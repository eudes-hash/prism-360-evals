import type { MapLayer } from '../lib/mockMaps'

type LayerControlsProps = {
  activeLayer: MapLayer
  opacity: number
  onLayerChange: (layer: MapLayer) => void
  onOpacityChange: (opacity: number) => void
}

const layers: Array<{ id: MapLayer; label: string; description: string }> = [
  { id: 'source', label: 'Original Source', description: '360 RGB input' },
  { id: 'depth', label: 'Z-Map', description: '16-bit depth mock' },
  { id: 'normals', label: 'Geometry Map', description: 'XYZ normals mock' },
  { id: 'action', label: 'Action Map', description: 'Navigability mock' },
]

const LayerControls = ({
  activeLayer,
  opacity,
  onLayerChange,
  onOpacityChange,
}: LayerControlsProps) => (
  <section className="panel">
    <div className="panel-header">
      <span>Layers</span>
      <small>Pixel-aligned overlays</small>
    </div>

    <div className="layer-list">
      {layers.map((layer) => (
        <button
          key={layer.id}
          className={`layer-button ${activeLayer === layer.id ? 'active' : ''}`}
          onClick={() => onLayerChange(layer.id)}
          type="button"
        >
          <span>{layer.label}</span>
          <small>{layer.description}</small>
        </button>
      ))}
    </div>

    <label className="field">
      <span>Overlay Opacity: {Math.round(opacity * 100)}%</span>
      <input
        disabled={activeLayer === 'source'}
        max="1"
        min="0"
        onChange={(event) => onOpacityChange(Number(event.target.value))}
        step="0.05"
        type="range"
        value={opacity}
      />
    </label>
  </section>
)

export default LayerControls
