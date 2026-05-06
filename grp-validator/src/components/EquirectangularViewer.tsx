import { useEffect, useRef, useState } from 'react'
import {
  pixelToSpherical,
  screenToPixel,
  type PixelPoint,
  type ViewTransform,
} from '../lib/equirectangular'
import type { MapLayer, MockSession } from '../lib/mockMaps'
import type { BrushStroke, BrushTool } from '../App'

type EquirectangularViewerProps = {
  activeLayer: MapLayer
  activeTool: BrushTool
  brushSize: number
  opacity: number
  robotRadius: number
  session: MockSession
  onStroke: (stroke: BrushStroke) => void
}

const getBrushColor = (tool: BrushTool) => {
  switch (tool) {
    case 'depth-leveler':
      return '#f8fafc'
    case 'normal-snap-x':
      return '#ff0000'
    case 'normal-snap-y':
      return '#00ff00'
    case 'normal-snap-z':
      return '#0000ff'
    case 'buffer-expander':
      return '#ff0000'
  }
}

const paintCircle = (
  canvas: HTMLCanvasElement,
  point: PixelPoint,
  radius: number,
  color: string,
) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const drawAt = (x: number) => {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x, point.y, radius, 0, Math.PI * 2)
    ctx.fill()
  }

  drawAt(point.x)
  if (point.x - radius < 0) drawAt(point.x + canvas.width)
  if (point.x + radius > canvas.width) drawAt(point.x - canvas.width)
}

const EquirectangularViewer = ({
  activeLayer,
  activeTool,
  brushSize,
  opacity,
  robotRadius,
  session,
  onStroke,
}: EquirectangularViewerProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isPainting, setIsPainting] = useState(false)
  const [cursorPixel, setCursorPixel] = useState<PixelPoint | null>(null)
  const [transform, setTransform] = useState<ViewTransform>({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  })

  const draw = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.translate(transform.offsetX, transform.offsetY)
    ctx.scale(transform.scale, transform.scale)
    ctx.drawImage(session.source, 0, 0)

    if (activeLayer !== 'source') {
      ctx.globalAlpha = opacity
      ctx.drawImage(session[activeLayer], 0, 0)
      ctx.globalAlpha = 1
    }

    if (cursorPixel) {
      ctx.strokeStyle = '#f8fafc'
      ctx.lineWidth = 2 / transform.scale
      ctx.beginPath()
      ctx.arc(cursorPixel.x, cursorPixel.y, brushSize / 2, 0, Math.PI * 2)
      ctx.stroke()
    }

    ctx.restore()
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const fitScale = Math.min(canvas.width / session.width, canvas.height / session.height)
    setTransform({
      scale: fitScale,
      offsetX: (canvas.width - session.width * fitScale) / 2,
      offsetY: (canvas.height - session.height * fitScale) / 2,
    })
  }, [session.height, session.width])

  useEffect(() => {
    draw()
  })

  const getPixelFromEvent = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    return screenToPixel(event.clientX, event.clientY, canvas.getBoundingClientRect(), session.width, session.height, transform)
  }

  const applyBrush = (point: PixelPoint) => {
    if (activeLayer === 'source') return
    const radius = activeTool === 'buffer-expander' ? robotRadius : brushSize / 2
    paintCircle(session[activeLayer], point, radius, getBrushColor(activeTool))
    onStroke({
      id: crypto.randomUUID(),
      layer: activeLayer,
      pixel: point,
      radius,
      spherical: pixelToSpherical(point, session.width, session.height),
      timestamp: new Date().toISOString(),
      tool: activeTool,
    })
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const point = getPixelFromEvent(event)
    if (!point) return
    event.currentTarget.setPointerCapture(event.pointerId)
    setIsPainting(true)
    setCursorPixel(point)
    applyBrush(point)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const point = getPixelFromEvent(event)
    if (!point) return
    setCursorPixel(point)
    if (isPainting) applyBrush(point)
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.releasePointerCapture(event.pointerId)
    setIsPainting(false)
  }

  const handleWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault()
    const factor = event.deltaY > 0 ? 0.9 : 1.1
    setTransform((current) => ({
      ...current,
      scale: Math.min(4, Math.max(0.35, current.scale * factor)),
    }))
  }

  const spherical = cursorPixel ? pixelToSpherical(cursorPixel, session.width, session.height) : null

  return (
    <div className="viewer-shell">
      <canvas
        ref={canvasRef}
        className="erp-canvas"
        height={720}
        onPointerDown={handlePointerDown}
        onPointerLeave={() => setCursorPixel(null)}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        width={1280}
      />
      <div className="coordinate-readout">
        {spherical ? (
          <>
            <span>x {Math.round(cursorPixel!.x)}</span>
            <span>y {Math.round(cursorPixel!.y)}</span>
            <span>lon {spherical.lonDeg.toFixed(2)}</span>
            <span>lat {spherical.latDeg.toFixed(2)}</span>
          </>
        ) : (
          <span>Hover the ERP canvas to inspect coordinates</span>
        )}
      </div>
    </div>
  )
}

export default EquirectangularViewer
