export type MapLayer = 'source' | 'depth' | 'normals' | 'action'

export type MockSession = {
  width: number
  height: number
  source: HTMLCanvasElement
  depth: HTMLCanvasElement
  normals: HTMLCanvasElement
  action: HTMLCanvasElement
}

const createCanvas = (width: number, height: number) => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

const drawSource = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const sky = ctx.createLinearGradient(0, 0, 0, height)
  sky.addColorStop(0, '#172554')
  sky.addColorStop(0.45, '#2563eb')
  sky.addColorStop(0.46, '#334155')
  sky.addColorStop(1, '#020617')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, width, height)

  ctx.fillStyle = 'rgba(255,255,255,0.12)'
  for (let x = 0; x < width; x += 80) {
    ctx.fillRect(x, 0, 2, height)
  }
  for (let y = 0; y < height; y += 60) {
    ctx.fillRect(0, y, width, 2)
  }

  ctx.fillStyle = '#94a3b8'
  ctx.fillRect(width * 0.08, height * 0.35, width * 0.18, height * 0.32)
  ctx.fillStyle = '#64748b'
  ctx.fillRect(width * 0.7, height * 0.28, width * 0.2, height * 0.4)
  ctx.fillStyle = 'rgba(125, 211, 252, 0.7)'
  ctx.fillRect(width * 0.42, height * 0.25, width * 0.16, height * 0.28)
  ctx.fillStyle = '#f8fafc'
  ctx.font = '32px system-ui'
  ctx.fillText('Mock 360 Source', 36, 54)
}

const drawDepth = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const gradient = ctx.createRadialGradient(width * 0.5, height * 0.55, 40, width * 0.5, height * 0.55, width * 0.65)
  gradient.addColorStop(0, '#ffffff')
  gradient.addColorStop(0.45, '#777777')
  gradient.addColorStop(1, '#050505')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = '#e5e5e5'
  ctx.fillRect(width * 0.42, height * 0.25, width * 0.16, height * 0.28)
}

const drawNormals = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  ctx.fillStyle = '#0000ff'
  ctx.fillRect(0, height * 0.52, width, height * 0.48)
  ctx.fillStyle = '#00ff00'
  ctx.fillRect(0, 0, width, height * 0.52)
  ctx.fillStyle = '#ff0000'
  ctx.fillRect(0, height * 0.24, width * 0.28, height * 0.34)
  ctx.fillStyle = '#ff8800'
  ctx.fillRect(width * 0.68, height * 0.22, width * 0.25, height * 0.4)
}

const drawAction = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  ctx.fillStyle = '#00ff00'
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = '#ff0000'
  ctx.fillRect(width * 0.07, height * 0.34, width * 0.22, height * 0.36)
  ctx.fillRect(width * 0.39, height * 0.2, width * 0.22, height * 0.4)
  ctx.fillRect(width * 0.68, height * 0.26, width * 0.24, height * 0.45)
}

export const createMockSession = (width = 1024, height = 512): MockSession => {
  const source = createCanvas(width, height)
  const depth = createCanvas(width, height)
  const normals = createCanvas(width, height)
  const action = createCanvas(width, height)

  drawSource(source.getContext('2d')!, width, height)
  drawDepth(depth.getContext('2d')!, width, height)
  drawNormals(normals.getContext('2d')!, width, height)
  drawAction(action.getContext('2d')!, width, height)

  return {
    width,
    height,
    source,
    depth,
    normals,
    action,
  }
}
