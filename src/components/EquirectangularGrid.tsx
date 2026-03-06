import { useEffect, useMemo } from 'react'
import * as THREE from 'three'

interface EquirectangularGridProps {
  visible: boolean
  rotationOffset: number
  lineDensity?: number
  fov?: number
  color?: string
  sectorOpacity?: number
  sectorColors?: {
    front: string
    right: string
    back: string
    left: string
  }
  polarColors?: {
    top: string
    bottom: string
  }
}

const EquirectangularGrid = ({
  visible,
  rotationOffset = 0,
  lineDensity = 8,
  fov = 90,
  color = '#00ff88',
  sectorOpacity = 0.22,
  sectorColors = {
    front: '#2ecc71',
    right: '#f39c12',
    back: '#e74c3c',
    left: '#3498db',
  },
  polarColors = {
    top: '#8b5cf6',
    bottom: '#0ea5e9',
  },
}: EquirectangularGridProps) => {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 2048
    canvas.height = 1024
    return new THREE.CanvasTexture(canvas)
  }, [])

  useEffect(() => {
    if (!visible) return

    const canvas = texture.image as HTMLCanvasElement
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height

    ctx.clearRect(0, 0, W, H)
    const wrap01 = (value: number) => ((value % 1) + 1) % 1
    const wrapPi = (angle: number) => {
      let v = (angle + Math.PI) % (2 * Math.PI)
      if (v < 0) v += 2 * Math.PI
      return v - Math.PI
    }
    const angularDiff = (a: number, b: number) => wrapPi(a - b)
    const longitudeToX = (lambda: number) => wrap01((lambda + Math.PI) / (2 * Math.PI)) * W
    const latitudeToY = (phi: number) => (0.5 - phi / Math.PI) * H
    const yAxis = new THREE.Vector3(0, 1, 0)
    const hexToRgba = (hex: string, alpha: number) => {
      const h = hex.replace('#', '')
      if (!(h.length === 3 || h.length === 6)) return `rgba(255,255,255,${alpha})`
      const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
      const r = parseInt(full.slice(0, 2), 16)
      const g = parseInt(full.slice(2, 4), 16)
      const b = parseInt(full.slice(4, 6), 16)
      return `rgba(${r},${g},${b},${alpha})`
    }

    const faceDefs = [
      { name: 'BACK', key: 'back' as const, center: Math.PI },
      { name: 'LEFT', key: 'left' as const, center: -Math.PI / 2 },
      { name: 'FRONT', key: 'front' as const, center: 0 },
      { name: 'RIGHT', key: 'right' as const, center: Math.PI / 2 },
    ] as const

    const drawWrappedText = (text: string, x: number, y: number) => {
      ctx.strokeText(text, x, y)
      ctx.fillText(text, x, y)
      if (x < 180) {
        ctx.strokeText(text, x + W, y)
        ctx.fillText(text, x + W, y)
      }
      if (x > W - 180) {
        ctx.strokeText(text, x - W, y)
        ctx.fillText(text, x - W, y)
      }
    }

    // Base tint to increase definition over any loaded image/video.
    ctx.fillStyle = 'rgba(7, 70, 57, 0.22)'
    ctx.fillRect(0, 0, W, H)

    // Draw 4 principal equirectangular sectors (90° each) with wrap-safe fill.
    const faceWidthPx = W / 4
    faceDefs.forEach((face) => {
      const center = wrapPi(face.center + rotationOffset)
      const start = center - Math.PI / 4
      const startX = longitudeToX(start)
      ctx.fillStyle = hexToRgba(sectorColors[face.key], sectorOpacity)
      if (startX + faceWidthPx <= W) {
        ctx.fillRect(startX, 0, faceWidthPx, H)
      } else {
        const rightPart = W - startX
        ctx.fillRect(startX, 0, rightPart, H)
        ctx.fillRect(0, 0, faceWidthPx - rightPart, H)
      }
    })

    const fovRad = (fov * Math.PI) / 180
    const halfCount = Math.max(Math.floor(lineDensity / 2), 2)
    const betaMax = fovRad / 2
    const gammaMax = Math.PI / 2 - 0.045

    // Build curved top/bottom boundaries from the outermost grid curves.
    const topBoundary = new Float32Array(W)
    const bottomBoundary = new Float32Array(W)
    topBoundary.fill(Number.POSITIVE_INFINITY)
    bottomBoundary.fill(Number.NEGATIVE_INFINITY)

    faceDefs.forEach((face) => {
      const center = wrapPi(face.center + rotationOffset)

      // Top boundary: outer positive-elevation curve.
      for (let s = -220; s <= 220; s++) {
        const beta = (s / 220) * betaMax
        const u = Math.tan(beta)
        const vTop = Math.tan(betaMax)
        const dirTop = new THREE.Vector3(u, vTop, 1).normalize()
        dirTop.applyAxisAngle(yAxis, center)
        const lambdaTop = Math.atan2(dirTop.x, dirTop.z)
        if (Math.abs(angularDiff(lambdaTop, center)) > Math.PI / 4 + 0.01) continue
        const phiTop = Math.asin(Math.max(-1, Math.min(1, dirTop.y)))
        const xTop = Math.floor(longitudeToX(lambdaTop))
        const yTop = latitudeToY(phiTop)
        if (xTop >= 0 && xTop < W && yTop < topBoundary[xTop]) topBoundary[xTop] = yTop
      }

      // Bottom boundary: outer negative-elevation curve.
      for (let s = -220; s <= 220; s++) {
        const beta = (s / 220) * betaMax
        const u = Math.tan(beta)
        const vBottom = Math.tan(-betaMax)
        const dirBottom = new THREE.Vector3(u, vBottom, 1).normalize()
        dirBottom.applyAxisAngle(yAxis, center)
        const lambdaBottom = Math.atan2(dirBottom.x, dirBottom.z)
        if (Math.abs(angularDiff(lambdaBottom, center)) > Math.PI / 4 + 0.01) continue
        const phiBottom = Math.asin(Math.max(-1, Math.min(1, dirBottom.y)))
        const xBottom = Math.floor(longitudeToX(lambdaBottom))
        const yBottom = latitudeToY(phiBottom)
        if (xBottom >= 0 && xBottom < W && yBottom > bottomBoundary[xBottom]) bottomBoundary[xBottom] = yBottom
      }
    })

    // Fill sparse samples by propagating nearest known values.
    for (let x = 1; x < W; x++) {
      if (!Number.isFinite(topBoundary[x])) topBoundary[x] = topBoundary[x - 1]
      if (!Number.isFinite(bottomBoundary[x])) bottomBoundary[x] = bottomBoundary[x - 1]
    }
    for (let x = W - 2; x >= 0; x--) {
      if (!Number.isFinite(topBoundary[x])) topBoundary[x] = topBoundary[x + 1]
      if (!Number.isFinite(bottomBoundary[x])) bottomBoundary[x] = bottomBoundary[x + 1]
    }
    for (let x = 0; x < W; x++) {
      if (!Number.isFinite(topBoundary[x])) topBoundary[x] = H * 0.2
      if (!Number.isFinite(bottomBoundary[x])) bottomBoundary[x] = H * 0.8
    }

    // Draw TOP and BOTTOM sectors following curved limits instead of straight lines.
    ctx.fillStyle = hexToRgba(polarColors.top, Math.min(sectorOpacity + 0.04, 0.75))
    ctx.beginPath()
    ctx.moveTo(0, 0)
    for (let x = 0; x < W; x++) ctx.lineTo(x, topBoundary[x])
    ctx.lineTo(W, 0)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = hexToRgba(polarColors.bottom, Math.min(sectorOpacity + 0.04, 0.75))
    ctx.beginPath()
    ctx.moveTo(0, H)
    for (let x = 0; x < W; x++) ctx.lineTo(x, bottomBoundary[x])
    ctx.lineTo(W, H)
    ctx.closePath()
    ctx.fill()

    // Face-local projected curves (horizontal and vertical) clipped to each 90° face.
    ctx.strokeStyle = color
    ctx.lineWidth = 1.15
    ctx.lineCap = 'round'
    ctx.globalAlpha = 0.88

    faceDefs.forEach((face) => {
      const center = wrapPi(face.center + rotationOffset)

      // Horizontal family (constant gamma, sweeping beta).
      for (let i = -halfCount; i <= halfCount; i++) {
        const gamma = (i / halfCount) * betaMax
        ctx.beginPath()
        let open = false
        let prevX = 0
        for (let s = -130; s <= 130; s++) {
          const beta = (s / 130) * betaMax
          const u = Math.tan(beta)
          const v = Math.tan(gamma)
          const dir = new THREE.Vector3(u, v, 1).normalize()
          dir.applyAxisAngle(yAxis, center)

          const lambda = Math.atan2(dir.x, dir.z)
          if (Math.abs(angularDiff(lambda, center)) > Math.PI / 4 + 0.01) {
            open = false
            continue
          }

          const phi = Math.asin(Math.max(-1, Math.min(1, dir.y)))
          const x = longitudeToX(lambda)
          const y = latitudeToY(phi)
          if (!open) {
            ctx.moveTo(x, y)
            open = true
          } else if (Math.abs(x - prevX) > W / 2) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
          prevX = x
        }
        ctx.stroke()
      }

      // Vertical family (constant beta, sweeping gamma toward poles).
      for (let i = -halfCount; i <= halfCount; i++) {
        const beta = (i / halfCount) * betaMax
        const u = Math.tan(beta)
        ctx.beginPath()
        let open = false
        let prevX = 0
        for (let s = -150; s <= 150; s++) {
          const gamma = (s / 150) * gammaMax
          const v = Math.tan(gamma)
          const dir = new THREE.Vector3(u, v, 1).normalize()
          dir.applyAxisAngle(yAxis, center)

          const lambda = Math.atan2(dir.x, dir.z)
          if (Math.abs(angularDiff(lambda, center)) > Math.PI / 4 + 0.01) {
            open = false
            continue
          }

          const phi = Math.asin(Math.max(-1, Math.min(1, dir.y)))
          const x = longitudeToX(lambda)
          const y = latitudeToY(phi)
          if (!open) {
            ctx.moveTo(x, y)
            open = true
          } else if (Math.abs(x - prevX) > W / 2) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
          prevX = x
        }
        ctx.stroke()
      }
    })
    ctx.globalAlpha = 1

    // TOP curves (full family), clipped strictly to TOP sector.
    const topCurveCount = 3
    const snapLongitudesDeg = [-180, -135, -90, -45, 0, 45, 90, 135, 180]
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(0, 0)
    for (let x = 0; x < W; x++) ctx.lineTo(x, topBoundary[x])
    ctx.lineTo(W, 0)
    ctx.closePath()
    ctx.clip()

    ctx.strokeStyle = color
    for (let i = 1; i <= topCurveCount; i++) {
      const t = i / (topCurveCount + 1)
      const topAlpha = betaMax + t * (gammaMax - betaMax)
      const sampleByX = new Map<number, number>()
      for (let x = 0; x <= W; x += 2) {
        const lambda = (x / W) * 2 * Math.PI - Math.PI
        sampleByX.set(x, lambda)
      }
      snapLongitudesDeg.forEach((lonDeg) => {
        const lambda = (lonDeg * Math.PI) / 180 + rotationOffset
        const x = Math.round(longitudeToX(lambda))
        sampleByX.set(Math.min(Math.max(x, 0), W), lambda)
      })
      const sortedXs = Array.from(sampleByX.keys()).sort((a, b) => a - b)

      ctx.lineWidth = i === 1 ? 1.55 : 1.15
      ctx.globalAlpha = i === 1 ? 0.9 : 0.72
      ctx.beginPath()
      let firstTopPoint = true
      for (const x of sortedXs) {
        const lambda = sampleByX.get(x)!
        const phi = Math.atan(Math.tan(topAlpha) * Math.cos(lambda - rotationOffset))
        const y = latitudeToY(phi)
        if (firstTopPoint) {
          ctx.moveTo(x, y)
          firstTopPoint = false
        } else {
          ctx.lineTo(x, y)
        }
      }
      ctx.stroke()
    }
    ctx.restore()

    // BOTTOM curves (mirror family), clipped strictly to BOTTOM sector.
    const bottomCurveCount = 3
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(0, H)
    for (let x = 0; x < W; x++) ctx.lineTo(x, bottomBoundary[x])
    ctx.lineTo(W, H)
    ctx.closePath()
    ctx.clip()

    ctx.strokeStyle = color
    for (let i = 1; i <= bottomCurveCount; i++) {
      const t = i / (bottomCurveCount + 1)
      const bottomAlpha = -(betaMax + t * (gammaMax - betaMax))
      const sampleByX = new Map<number, number>()
      for (let x = 0; x <= W; x += 2) {
        const lambda = (x / W) * 2 * Math.PI - Math.PI
        sampleByX.set(x, lambda)
      }
      snapLongitudesDeg.forEach((lonDeg) => {
        const lambda = (lonDeg * Math.PI) / 180 + rotationOffset
        const x = Math.round(longitudeToX(lambda))
        sampleByX.set(Math.min(Math.max(x, 0), W), lambda)
      })
      const sortedXs = Array.from(sampleByX.keys()).sort((a, b) => a - b)

      ctx.lineWidth = i === 1 ? 1.55 : 1.15
      ctx.globalAlpha = i === 1 ? 0.9 : 0.72
      ctx.beginPath()
      let firstBottomPoint = true
      for (const x of sortedXs) {
        const lambda = sampleByX.get(x)!
        const phi = Math.atan(Math.tan(bottomAlpha) * Math.cos(lambda - rotationOffset))
        const y = latitudeToY(phi)
        if (firstBottomPoint) {
          ctx.moveTo(x, y)
          firstBottomPoint = false
        } else {
          ctx.lineTo(x, y)
        }
      }
      ctx.stroke()
    }
    ctx.restore()

    // Master longitude/latitude references.
    const longitudeRefs = [-180, -135, -90, -45, 0, 45, 90, 135, 180]
    const latitudeRefs = [-90, -45, 0, 45, 90]

    ctx.save()
    ctx.strokeStyle = 'rgba(15, 25, 22, 0.72)'
    ctx.lineWidth = 2.2
    longitudeRefs.forEach((lonDeg) => {
      const x = longitudeToX((lonDeg * Math.PI) / 180 + rotationOffset)
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, H)
      ctx.stroke()
    })
    latitudeRefs.forEach((latDeg) => {
      const y = ((90 - latDeg) / 180) * H
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(W, y)
      ctx.stroke()
    })
    ctx.restore()

    // Face labels centered in each principal sector.
    ctx.save()
    ctx.font = 'italic 800 70px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.86)'
    ctx.fillStyle = 'rgba(0, 0, 0, 0.68)'
    ctx.lineWidth = 3
    faceDefs.forEach((face) => {
      const x = longitudeToX(face.center + rotationOffset)
      drawWrappedText(face.name, x, H * 0.5)
    })
    ctx.font = 'italic 800 64px sans-serif'
    drawWrappedText('TOP', longitudeToX(rotationOffset), H * 0.08)
    drawWrappedText('BOTTOM', longitudeToX(rotationOffset), H * 0.92)
    ctx.restore()

    // Axis captions and angular ticks.
    ctx.save()
    ctx.fillStyle = 'rgba(0, 0, 0, 0.86)'
    ctx.textAlign = 'center'
    ctx.font = 'italic 600 30px sans-serif'
    ctx.fillText('Longitude', W / 2, H - 20)
    ctx.save()
    ctx.translate(30, H / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText('Latitude', 0, 0)
    ctx.restore()
    ctx.font = 'italic 700 28px sans-serif'
    longitudeRefs.forEach((lon) => {
      const x = longitudeToX((lon * Math.PI) / 180 + rotationOffset)
      drawWrappedText(`${lon}°`, x, H - 56)
    })
    latitudeRefs.forEach((latDeg) => {
      const y = ((90 - latDeg) / 180) * H
      ctx.fillText(`${latDeg}°`, 80, y - 6)
    })
    ctx.restore()

    // Outer frame.
    ctx.save()
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)'
    ctx.lineWidth = 3
    ctx.strokeRect(1.5, 1.5, W - 3, H - 3)
    ctx.restore()

    texture.needsUpdate = true
  }, [visible, rotationOffset, lineDensity, fov, color, texture, sectorOpacity, sectorColors, polarColors])

  if (!visible) return null

  return (
    <mesh position={[0, 0, 0.01]}>
       <planeGeometry args={[2, 1]} />
       <meshBasicMaterial map={texture} transparent opacity={0.8} />
    </mesh>
  )
}

export default EquirectangularGrid
