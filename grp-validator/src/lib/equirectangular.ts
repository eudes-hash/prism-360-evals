export type PixelPoint = {
  x: number
  y: number
}

export type SphericalPoint = {
  phi: number
  theta: number
  lonDeg: number
  latDeg: number
}

export type ViewTransform = {
  scale: number
  offsetX: number
  offsetY: number
}

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

export const wrapPixelX = (x: number, width: number) => {
  if (width <= 0) return 0
  return ((x % width) + width) % width
}

export const screenToPixel = (
  screenX: number,
  screenY: number,
  canvasRect: DOMRect,
  imageWidth: number,
  imageHeight: number,
  transform: ViewTransform,
): PixelPoint => {
  const localX = screenX - canvasRect.left
  const localY = screenY - canvasRect.top
  const imageX = (localX - transform.offsetX) / transform.scale
  const imageY = (localY - transform.offsetY) / transform.scale

  return {
    x: wrapPixelX(imageX, imageWidth),
    y: clamp(imageY, 0, imageHeight - 1),
  }
}

export const pixelToSpherical = (
  pixel: PixelPoint,
  width: number,
  height: number,
): SphericalPoint => {
  const phi = (pixel.x / width) * Math.PI * 2
  const theta = (pixel.y / height) * Math.PI
  const lonDeg = (phi * 180) / Math.PI - 180
  const latDeg = 90 - (theta * 180) / Math.PI

  return {
    phi,
    theta,
    lonDeg,
    latDeg,
  }
}
