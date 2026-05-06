import type { BrushTool } from '../App'

type BrushToolbarProps = {
  activeTool: BrushTool
  brushSize: number
  robotRadius: number
  onBrushSizeChange: (size: number) => void
  onRobotRadiusChange: (radius: number) => void
  onToolChange: (tool: BrushTool) => void
}

const tools: Array<{ id: BrushTool; label: string; hint: string }> = [
  { id: 'depth-leveler', label: 'Depth Leveler', hint: 'Paints fixed near depth' },
  { id: 'normal-snap-x', label: 'Normal Snap X', hint: 'Paints red X-axis normals' },
  { id: 'normal-snap-y', label: 'Normal Snap Y', hint: 'Paints green Y-axis normals' },
  { id: 'normal-snap-z', label: 'Normal Snap Z', hint: 'Paints blue Z-axis normals' },
  { id: 'buffer-expander', label: 'Buffer Expander', hint: 'Paints red action risk' },
]

const BrushToolbar = ({
  activeTool,
  brushSize,
  robotRadius,
  onBrushSizeChange,
  onRobotRadiusChange,
  onToolChange,
}: BrushToolbarProps) => (
  <section className="panel">
    <div className="panel-header">
      <span>Smart Brushes</span>
      <small>Correction by exception</small>
    </div>

    <div className="tool-grid">
      {tools.map((tool) => (
        <button
          key={tool.id}
          className={`tool-button ${activeTool === tool.id ? 'active' : ''}`}
          onClick={() => onToolChange(tool.id)}
          type="button"
        >
          <span>{tool.label}</span>
          <small>{tool.hint}</small>
        </button>
      ))}
    </div>

    <label className="field">
      <span>Brush Size: {brushSize}px</span>
      <input
        max="96"
        min="8"
        onChange={(event) => onBrushSizeChange(Number(event.target.value))}
        step="4"
        type="range"
        value={brushSize}
      />
    </label>

    <label className="field">
      <span>Robot Radius: {robotRadius}px</span>
      <input
        max="120"
        min="12"
        onChange={(event) => onRobotRadiusChange(Number(event.target.value))}
        step="6"
        type="range"
        value={robotRadius}
      />
    </label>
  </section>
)

export default BrushToolbar
