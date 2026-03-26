import { Suspense, forwardRef, useImperativeHandle, useRef, useEffect, useState, useMemo, Component } from 'react'
import type { ReactNode, ErrorInfo, ForwardedRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, Sphere, Html, Plane, OrthographicCamera, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import EquirectangularGrid from './EquirectangularGrid'

export type ViewMode = 'spherical' | 'equirectangular' | 'rectilinear-front' | 'rectilinear-back' | 'rectilinear-left' | 'rectilinear-right' | 'dual'

class ErrorBoundary extends Component<{ children: ReactNode, fallback: ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }

    return this.props.children
  }
}

interface ViewerProps {
  mediaUrl: string | null
  mediaType: 'image' | 'video'
  showGrid: boolean
  viewMode: ViewMode
  showSinusoidalGrid: boolean
  gridRotation: number
  gridDensity: number
  sectorOpacity: number
  sectorColors: {
    front: string
    right: string
    back: string
    left: string
  }
  polarColors: {
    top: string
    bottom: string
  }
  showCenterGuide?: boolean
}

export interface ViewerRef {
  getCameraState: () => { position: THREE.Vector3; target: THREE.Vector3; fov: number }
  setCameraState: (state: { position: THREE.Vector3; target: THREE.Vector3; fov: number }) => void
  getCenterCoordinate: () => { lat: number; lon: number } | null
  adjustSphericalZoom: (deltaFov: number) => void
  togglePlay: () => void
  setVideoTime: (time: number) => void
  getVideoState: () => { isPlaying: boolean; currentTime: number; duration: number }
}

const GRID_RADIUS = 490
const LONGITUDE_ANGLES = [-180, -90, 0, 90, 180]
const LATITUDE_ANGLES = [-90, -45, 0, 45, 90]
const LONGITUDE_BOUNDARIES = [-135, -45, 45, 135]
const LONGITUDE_REFERENCE_OFFSET_DEG = -90
const FACE_SECTORS = [
  { key: 'front', start: -45, end: 45, center: 0 },
  { key: 'right', start: 45, end: 135, center: 45 },
  { key: 'back', start: 135, end: 225, center: 180 },
  { key: 'left', start: -135, end: -45, center: -45 },
] as const
type SectorKey = (typeof FACE_SECTORS)[number]['key']

const normalizeLongitudeDeg = (deg: number) => {
  let value = ((deg + 180) % 360 + 360) % 360 - 180
  if (value === -180) value = 180
  return value
}

const offsetLongitudeRef = (deg: number) => normalizeLongitudeDeg(deg + LONGITUDE_REFERENCE_OFFSET_DEG)

const lonLatToVector = (lonDeg: number, latDeg: number, radius: number) => {
  const lon = (lonDeg * Math.PI) / 180
  const lat = (latDeg * Math.PI) / 180
  const cosLat = Math.cos(lat)
  return new THREE.Vector3(
    Math.sin(lon) * cosLat * radius,
    Math.sin(lat) * radius,
    -Math.cos(lon) * cosLat * radius
  )
}

type HoveredCoordinate = {
  lat: number
  lon: number
  planeUv?: { x: number; y: number }
  spherePoint?: [number, number, number]
}

const logicalLonLatToSphereVector = (lonDeg: number, latDeg: number, radius: number) =>
  lonLatToVector(offsetLongitudeRef(lonDeg), latDeg, radius)

const CoordinateMarker3D = ({ coords }: { coords: HoveredCoordinate | null }) => {
  if (!coords) return null
  const position = coords.spherePoint
    ? new THREE.Vector3(...coords.spherePoint).normalize().multiplyScalar(495)
    : logicalLonLatToSphereVector(coords.lon, coords.lat, 495)
  return (
    <mesh position={position}>
      <sphereGeometry args={[8, 16, 16]} />
      <meshBasicMaterial color="red" depthTest={false} transparent opacity={0.8} />
    </mesh>
  )
}

const CoordinateMarker2D = ({ coords }: { coords: HoveredCoordinate | null }) => {
  if (!coords) return null
  const x = coords.planeUv ? coords.planeUv.x * 2 - 1 : coords.lon / 180
  const y = coords.planeUv ? coords.planeUv.y - 0.5 : coords.lat / 180
  
  return (
    <mesh position={[x, y, 0.02]}>
      <ringGeometry args={[0.015, 0.025, 32]} />
      <meshBasicMaterial color="red" side={THREE.DoubleSide} depthTest={false} transparent opacity={0.8} />
    </mesh>
  )
}

const Polyline = ({
  points,
  color,
  opacity = 1,
}: {
  points: THREE.Vector3[]
  color: string
  opacity?: number
}) => {
  const positions = useMemo(
    () => new Float32Array(points.flatMap((p) => [p.x, p.y, p.z])),
    [points]
  )

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color={color} transparent opacity={opacity} />
    </line>
  )
}

const MeridianLine = ({ lonDeg, color }: { lonDeg: number; color: string }) => {
  const points = useMemo(() => {
    const list: THREE.Vector3[] = []
    for (let lat = -89; lat <= 89; lat += 2) {
      list.push(lonLatToVector(lonDeg, lat, GRID_RADIUS))
    }
    return list
  }, [lonDeg])

  return <Polyline points={points} color={color} opacity={0.95} />
}

const ParallelLine = ({ latDeg, color }: { latDeg: number; color: string }) => {
  const points = useMemo(() => {
    const list: THREE.Vector3[] = []
    for (let lon = -180; lon <= 180; lon += 2) {
      list.push(lonLatToVector(lon, latDeg, GRID_RADIUS))
    }
    return list
  }, [latDeg])

  return <Polyline points={points} color={color} opacity={0.95} />
}

const SectorArc = ({
  startDeg,
  endDeg,
  color,
  latDeg = 0,
}: {
  startDeg: number
  endDeg: number
  color: string
  latDeg?: number
}) => {
  const points = useMemo(() => {
    const list: THREE.Vector3[] = []
    const step = 2
    for (let lon = startDeg; lon <= endDeg; lon += step) {
      const normalized = lon > 180 ? lon - 360 : lon
      list.push(lonLatToVector(normalized, latDeg, GRID_RADIUS - 8))
    }
    return list
  }, [startDeg, endDeg, latDeg])

  return <Polyline points={points} color={color} opacity={1} />
}

const SectorSurface = ({
  startDeg,
  endDeg,
  color,
  opacity,
}: {
  startDeg: number
  endDeg: number
  color: string
  opacity: number
}) => {
  const geometry = useMemo(() => {
    const lonStep = 8
    const latStep = 8
    const latMin = -84
    const latMax = 84
    const positions: number[] = []
    const indices: number[] = []
    const lons: number[] = []
    const lats: number[] = []

    for (let lon = startDeg; lon <= endDeg + 0.001; lon += lonStep) {
      const normalized = lon > 180 ? lon - 360 : lon
      lons.push(normalized)
    }
    for (let lat = latMin; lat <= latMax + 0.001; lat += latStep) {
      lats.push(lat)
    }

    for (let i = 0; i < lats.length; i++) {
      for (let j = 0; j < lons.length; j++) {
        const p = lonLatToVector(lons[j], lats[i], GRID_RADIUS - 6)
        positions.push(p.x, p.y, p.z)
      }
    }

    const cols = lons.length
    for (let i = 0; i < lats.length - 1; i++) {
      for (let j = 0; j < cols - 1; j++) {
        const a = i * cols + j
        const b = a + 1
        const c = (i + 1) * cols + j
        const d = c + 1
        indices.push(a, c, b)
        indices.push(b, c, d)
      }
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geo.setIndex(indices)
    geo.computeVertexNormals()
    return geo
  }, [startDeg, endDeg])

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial color={color} transparent opacity={opacity} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  )
}

const SphericalGridOverlay = ({
  sectorOpacity,
  sectorColors,
}: {
  sectorOpacity: number
  sectorColors: Record<SectorKey, string>
}) => {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[GRID_RADIUS, 36, 18]} />
        <meshBasicMaterial wireframe color="#00c2d7" transparent opacity={0.22} side={THREE.BackSide} />
      </mesh>

      {LONGITUDE_ANGLES.map((lon) => (
        <MeridianLine
          key={`lon-${lon}`}
          lonDeg={offsetLongitudeRef(lon)}
          color={lon === 0 ? '#ffd400' : '#00e5ff'}
        />
      ))}
      {LONGITUDE_BOUNDARIES.map((lon) => (
        <MeridianLine key={`boundary-${lon}`} lonDeg={offsetLongitudeRef(lon)} color="#ff8a00" />
      ))}
      {LATITUDE_ANGLES.filter((lat) => Math.abs(lat) !== 90).map((lat) => (
        <ParallelLine key={`lat-${lat}`} latDeg={lat} color={lat === 0 ? '#ffd400' : '#7cff7c'} />
      ))}

      {/* Rectilinear-face highlighting (same angular ranges as front/right/back/left) */}
      {FACE_SECTORS.map((sector) => (
        <group key={`sector-${sector.key}`}>
          <SectorSurface
            startDeg={sector.start + LONGITUDE_REFERENCE_OFFSET_DEG}
            endDeg={sector.end + LONGITUDE_REFERENCE_OFFSET_DEG}
            color={sectorColors[sector.key]}
            opacity={sectorOpacity}
          />
          <SectorArc
            startDeg={sector.start + LONGITUDE_REFERENCE_OFFSET_DEG}
            endDeg={sector.end + LONGITUDE_REFERENCE_OFFSET_DEG}
            color={sectorColors[sector.key]}
            latDeg={0}
          />
          <SectorArc
            startDeg={sector.start + LONGITUDE_REFERENCE_OFFSET_DEG}
            endDeg={sector.end + LONGITUDE_REFERENCE_OFFSET_DEG}
            color={sectorColors[sector.key]}
            latDeg={18}
          />
          <SectorArc
            startDeg={sector.start + LONGITUDE_REFERENCE_OFFSET_DEG}
            endDeg={sector.end + LONGITUDE_REFERENCE_OFFSET_DEG}
            color={sectorColors[sector.key]}
            latDeg={-18}
          />
        </group>
      ))}

      {/* Pole markers for +/- 90 latitude */}
      <mesh position={lonLatToVector(0, 90, GRID_RADIUS)}>
        <sphereGeometry args={[6, 12, 12]} />
        <meshBasicMaterial color="#7cff7c" />
      </mesh>
      <mesh position={lonLatToVector(0, -90, GRID_RADIUS)}>
        <sphereGeometry args={[6, 12, 12]} />
        <meshBasicMaterial color="#7cff7c" />
      </mesh>

      {/* Extra labels showing rectilinear sectors directly */}
      {FACE_SECTORS.map((sector) => (
        <Html
          key={`sector-label-${sector.key}`}
          position={lonLatToVector(offsetLongitudeRef(sector.center), -20, GRID_RADIUS - 40).toArray()}
          center
        >
          <div
            style={{
              color: sectorColors[sector.key],
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 0.4,
              textShadow: '0 0 6px rgba(0,0,0,0.95)',
              textTransform: 'uppercase',
            }}
          >
            {sector.key}
          </div>
        </Html>
      ))}

      {/* Horizontal longitude references on equatorial axis */}
      {LONGITUDE_ANGLES.map((lon) => (
        <Html
          key={`lon-label-${lon}`}
          position={lonLatToVector(offsetLongitudeRef(lon), 6, GRID_RADIUS - 36).toArray()}
          center
        >
          <div
            style={{
              color: lon === 0 ? '#ffd400' : '#d7fbff',
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 0.2,
              textShadow: '0 0 6px rgba(0,0,0,0.95)',
              background: 'rgba(0,0,0,0.28)',
              padding: '2px 4px',
              borderRadius: 4,
            }}
          >
            {lon}°
          </div>
        </Html>
      ))}
    </group>
  )
}

const ImageSphere = ({ 
  texture, 
  viewMode, 
  onHover 
}: { 
  texture: THREE.Texture, 
  viewMode: ViewMode, 
  onHover?: (coords: HoveredCoordinate | null) => void 
}) => {

  const handlePointerMove = (e: any) => {
    if (!onHover) return
    const uv = e.uv
    if (!uv) return
    const lon = (uv.x - 0.5) * 360
    const lat = (uv.y - 0.5) * 180
    const payload: HoveredCoordinate = { lat, lon }

    if (viewMode === 'equirectangular') {
      payload.planeUv = { x: uv.x, y: uv.y }
    } else if (e.point) {
      payload.spherePoint = [e.point.x, e.point.y, e.point.z]
    }

    onHover(payload)
  }

  const handlePointerOut = () => {
    if (onHover) onHover(null)
  }

  if (viewMode === 'equirectangular') {
    return (
      <Plane 
        args={[2, 1]} 
        scale={[1, 1, 1]}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
      >
        <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
      </Plane>
    )
  }

  return (
    <Sphere 
      args={[500, 60, 40]} 
      scale={[-1, 1, 1]}
      onPointerMove={handlePointerMove}
      onPointerOut={handlePointerOut}
    >
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </Sphere>
  )
}

const Loader = () => (
  <Html center>
    <div style={{ color: '#fff', fontSize: 20 }}>Loading...</div>
  </Html>
)

const CameraController = forwardRef<ViewerRef, { viewMode: ViewMode, videoRef: React.MutableRefObject<HTMLVideoElement | null> }>((props, ref) => {
  const { camera } = useThree()
  const controlsRef = useRef<OrbitControlsImpl>(null)

  useEffect(() => {
    if (props.viewMode === 'equirectangular') {
      camera.position.set(0, 0, 10)
      camera.lookAt(0, 0, 0)
      if (camera instanceof THREE.OrthographicCamera) {
        camera.zoom = 1
        camera.updateProjectionMatrix()
      }
      if (controlsRef.current) {
        controlsRef.current.enableRotate = false
        controlsRef.current.enableZoom = false
        controlsRef.current.enablePan = false
        controlsRef.current.reset()
      }
    } else if (props.viewMode === 'spherical') {
      camera.position.set(0, 0, 0.1)
      const frontLon = offsetLongitudeRef(0)
      const frontTarget = lonLatToVector(frontLon, 0, 1)
      camera.lookAt(frontTarget)
      if (controlsRef.current) {
        controlsRef.current.enableRotate = true
        controlsRef.current.enableZoom = true
        controlsRef.current.target.copy(frontTarget)
        controlsRef.current.update()
      }
    } else {
      // Rectilinear views
      camera.position.set(0, 0, 0.1)
      let target = new THREE.Vector3(0, 0, 0)
      
      switch (props.viewMode) {
        case 'rectilinear-front':
          target.set(0, 0, -1)
          break
        case 'rectilinear-back':
          target.set(0, 0, 1)
          break
        case 'rectilinear-left':
          target.set(-1, 0, 0)
          break
        case 'rectilinear-right':
          target.set(1, 0, 0)
          break
      }
      
      camera.lookAt(target)
      if (controlsRef.current) {
        controlsRef.current.target.copy(target)
        controlsRef.current.update()
        // Lock rotation for fixed views? Or allow looking around?
        // Usually "Rectilinear View" implies a fixed perspective, but allowing slight movement is good.
        // Let's reset to the target view.
      }
    }
  }, [props.viewMode, camera])

  useImperativeHandle(ref, () => ({
    getCameraState: () => {
      if (controlsRef.current) {
        return {
          position: camera.position.clone(),
          target: controlsRef.current.target.clone(),
          fov: (camera as THREE.PerspectiveCamera).fov
        }
      }
      return {
        position: camera.position.clone(),
        target: new THREE.Vector3(0, 0, 0),
        fov: 75
      }
    },
    setCameraState: (state) => {
      camera.position.copy(state.position)
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.fov = state.fov
        camera.updateProjectionMatrix()
      }
      if (controlsRef.current) {
        controlsRef.current.target.copy(state.target)
        controlsRef.current.update()
      }
    },
    getCenterCoordinate: () => {
      const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
      const normalized = dir.clone().normalize()
      const lat = THREE.MathUtils.radToDeg(Math.asin(THREE.MathUtils.clamp(normalized.y, -1, 1)))
      const sceneLon = THREE.MathUtils.radToDeg(Math.atan2(normalized.x, -normalized.z))
      const lon = normalizeLongitudeDeg(sceneLon - LONGITUDE_REFERENCE_OFFSET_DEG)
      return { lat, lon }
    },
    adjustSphericalZoom: (deltaFov) => {
      if (props.viewMode !== 'spherical') return
      if (!(camera instanceof THREE.PerspectiveCamera)) return
      const nextFov = THREE.MathUtils.clamp(camera.fov + deltaFov, 30, 110)
      camera.fov = nextFov
      camera.updateProjectionMatrix()
      if (controlsRef.current) controlsRef.current.update()
    },
    togglePlay: () => {
      if (props.videoRef.current) {
        if (props.videoRef.current.paused) {
          props.videoRef.current.play().catch((e) => console.error("Play failed:", e))
        } else {
          props.videoRef.current.pause()
        }
      }
    },
    setVideoTime: (time) => {
      if (props.videoRef.current) {
        props.videoRef.current.currentTime = time
      }
    },
    getVideoState: () => {
      if (props.videoRef.current) {
        return {
          isPlaying: !props.videoRef.current.paused,
          currentTime: props.videoRef.current.currentTime,
          duration: props.videoRef.current.duration || 0
        }
      }
      return { isPlaying: false, currentTime: 0, duration: 0 }
    }
  }))

  return (
    <OrbitControls 
      ref={controlsRef}
      enableZoom={props.viewMode !== 'equirectangular'} 
      enablePan={false} 
      enableDamping={true} 
      dampingFactor={0.05} 
      rotateSpeed={-0.5} 
    />
  )
})

const ErrorFallback = () => (
  <Html center>
    <div style={{ color: '#ff6b6b', fontSize: 20, background: 'rgba(0,0,0,0.8)', padding: 12, borderRadius: 8 }}>
      Error loading image. Please try another file.
    </div>
  </Html>
)

const EquirectangularCamera = () => {
  const { size } = useThree()
  const aspect = Math.max(size.width / Math.max(size.height, 1), 0.0001)
  const fitMargin = 1.2

  let halfWidth = 1
  let halfHeight = 0.5

  if (aspect >= 2) {
    halfHeight = 0.5
    halfWidth = halfHeight * aspect
  } else {
    halfWidth = 1
    halfHeight = halfWidth / aspect
  }

  halfWidth *= fitMargin
  halfHeight *= fitMargin

  return (
    <OrthographicCamera
      makeDefault
      left={-halfWidth}
      right={halfWidth}
      top={halfHeight}
      bottom={-halfHeight}
      near={0.1}
      far={100}
      position={[0, 0, 10]}
    />
  )
}

const SphericalScene = ({
  texture,
  showGrid,
  sectorOpacity,
  sectorColors,
  videoRef,
  viewMode,
  onHover,
  hoveredCoords,
  viewerHandleRef
}: {
  texture: THREE.Texture | null
  showGrid: boolean
  sectorOpacity: number
  sectorColors: any
  videoRef: React.MutableRefObject<HTMLVideoElement | null>
  viewMode: ViewMode
  onHover: (coords: HoveredCoordinate | null) => void
  hoveredCoords: HoveredCoordinate | null
  viewerHandleRef?: ForwardedRef<ViewerRef>
}) => {
  return (
    <>
      <PerspectiveCamera makeDefault fov={75} position={[0, 0, 0.1]} />
      <color attach="background" args={['#111']} />
      <CameraController ref={viewerHandleRef} viewMode={viewMode === 'dual' ? 'spherical' : viewMode} videoRef={videoRef} />
      {texture && <ImageSphere texture={texture} viewMode="spherical" onHover={onHover} />}
      {showGrid && (
        <SphericalGridOverlay sectorOpacity={sectorOpacity} sectorColors={sectorColors} />
      )}
      <CoordinateMarker3D coords={hoveredCoords} />
    </>
  )
}

const EquirectangularScene = ({
  texture,
  showSinusoidalGrid,
  gridRotation,
  gridDensity,
  sectorOpacity,
  sectorColors,
  polarColors,
  onHover,
  hoveredCoords
}: {
  texture: THREE.Texture | null
  showSinusoidalGrid: boolean
  gridRotation: number
  gridDensity: number
  sectorOpacity: number
  sectorColors: any
  polarColors: any
  onHover: (coords: HoveredCoordinate | null) => void
  hoveredCoords: HoveredCoordinate | null
}) => {
  return (
    <>
      <EquirectangularCamera />
      <color attach="background" args={['#111']} />
      {texture && <ImageSphere texture={texture} viewMode="equirectangular" onHover={onHover} />}
      {showSinusoidalGrid && (
        <EquirectangularGrid
          visible={true}
          rotationOffset={gridRotation}
          lineDensity={gridDensity}
          sectorOpacity={sectorOpacity}
          sectorColors={sectorColors}
          polarColors={polarColors}
        />
      )}
      <CoordinateMarker2D coords={hoveredCoords} />
    </>
  )
}

const Viewer = forwardRef<ViewerRef, ViewerProps>(({
  mediaUrl,
  mediaType,
  showGrid,
  viewMode,
  showSinusoidalGrid,
  gridRotation,
  gridDensity,
  sectorOpacity,
  sectorColors,
  polarColors,
  showCenterGuide,
}, ref) => {
  const [texture, setTexture] = useState<THREE.Texture | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [hoveredCoords, setHoveredCoords] = useState<HoveredCoordinate | null>(null)

  useEffect(() => {
    if (!mediaUrl) {
      setTexture(null)
      setLoadError(null)
      return
    }

    let isCancelled = false
    let videoEl: HTMLVideoElement | null = null

    if (mediaType === 'video') {
      const video = document.createElement('video')
      videoEl = video
      videoRef.current = video
      video.src = mediaUrl
      video.crossOrigin = 'anonymous'
      video.loop = true
      video.muted = true
      video.playsInline = true
      video.preload = 'auto'
      video.play().catch(() => {})

      const onVideoReady = () => {
        if (isCancelled) return
        const videoTexture = new THREE.VideoTexture(video)
        videoTexture.colorSpace = THREE.SRGBColorSpace
        videoTexture.needsUpdate = true
        setTexture(videoTexture)
        setLoadError(null)
      }

      const onVideoError = () => {
        if (!isCancelled) {
          setTexture(null)
          setLoadError('No se pudo cargar el video. Prueba otro MP4/WebM.')
        }
      }

      video.addEventListener('loadeddata', onVideoReady, { once: true })
      video.addEventListener('error', onVideoError, { once: true })
    } else {
      videoRef.current = null
      const loader = new THREE.TextureLoader()
      loader.setCrossOrigin('anonymous')

      loader.load(
        mediaUrl,
        (loadedTexture) => {
          if (isCancelled) {
            loadedTexture.dispose()
            return
          }
          loadedTexture.mapping = THREE.EquirectangularReflectionMapping
          loadedTexture.colorSpace = THREE.SRGBColorSpace
          loadedTexture.needsUpdate = true
          setTexture(loadedTexture)
          setLoadError(null)
        },
        undefined,
        () => {
          if (!isCancelled) {
            setTexture(null)
            setLoadError('No se pudo cargar la imagen. Prueba otro JPG/PNG.')
          }
        }
      )
    }

    return () => {
      isCancelled = true
      setTexture((prev) => {
        if (prev) prev.dispose()
        return null
      })
      if (videoEl) {
        videoEl.pause()
        videoEl.src = ''
      }
      videoRef.current = null
    }
  }, [mediaUrl, mediaType])

  const coordinatePanel = hoveredCoords ? (
    <div style={{
      position: 'absolute',
      top: 16,
      right: 16,
      background: 'rgba(0, 0, 0, 0.75)',
      color: '#fff',
      padding: '8px 12px',
      borderRadius: 8,
      fontSize: 12,
      fontFamily: 'monospace',
      zIndex: 100,
      pointerEvents: 'none',
      backdropFilter: 'blur(4px)',
      border: '1px solid rgba(255,255,255,0.1)'
    }}>
      <div>Lat: {hoveredCoords.lat.toFixed(2)}°</div>
      <div>Lon: {hoveredCoords.lon.toFixed(2)}°</div>
    </div>
  ) : null

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {viewMode === 'dual' ? (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Canvas>
              <Suspense fallback={<Loader />}>
                <ErrorBoundary fallback={<ErrorFallback />}>
                  <SphericalScene
                    texture={texture}
                    showGrid={showGrid}
                    sectorOpacity={sectorOpacity}
                    sectorColors={sectorColors}
                    videoRef={videoRef}
                    viewMode={viewMode}
                    onHover={setHoveredCoords}
                    hoveredCoords={hoveredCoords}
                    viewerHandleRef={ref}
                  />
                </ErrorBoundary>
              </Suspense>
            </Canvas>
          </div>
          <div style={{ height: 2, background: '#333' }} />
          <div style={{ flex: 1, position: 'relative' }}>
            <Canvas>
              <Suspense fallback={<Loader />}>
                <ErrorBoundary fallback={<ErrorFallback />}>
                  <EquirectangularScene
                    texture={texture}
                    showSinusoidalGrid={showSinusoidalGrid}
                    gridRotation={gridRotation}
                    gridDensity={gridDensity}
                    sectorOpacity={sectorOpacity}
                    sectorColors={sectorColors}
                    polarColors={polarColors}
                    onHover={setHoveredCoords}
                    hoveredCoords={hoveredCoords}
                  />
                </ErrorBoundary>
              </Suspense>
            </Canvas>
          </div>
        </div>
      ) : (
        <Canvas>
          <Suspense fallback={<Loader />}>
            <ErrorBoundary fallback={<ErrorFallback />}>
              {viewMode === 'equirectangular' ? (
                <EquirectangularScene
                  texture={texture}
                  showSinusoidalGrid={showSinusoidalGrid}
                  gridRotation={gridRotation}
                  gridDensity={gridDensity}
                  sectorOpacity={sectorOpacity}
                  sectorColors={sectorColors}
                  polarColors={polarColors}
                  onHover={setHoveredCoords}
                  hoveredCoords={hoveredCoords}
                />
              ) : (
                <SphericalScene
                  texture={texture}
                  showGrid={showGrid}
                  sectorOpacity={sectorOpacity}
                  sectorColors={sectorColors}
                  videoRef={videoRef}
                  viewMode={viewMode}
                  onHover={setHoveredCoords}
                  hoveredCoords={hoveredCoords}
                  viewerHandleRef={ref}
                />
              )}
            </ErrorBoundary>
          </Suspense>
        </Canvas>
      )}
      {coordinatePanel}
      {showCenterGuide && viewMode === 'spherical' && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 50,
          }}
        >
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <line x1="16" y1="2" x2="16" y2="30" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5" strokeDasharray="3 2" />
            <line x1="2" y1="16" x2="30" y2="16" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5" strokeDasharray="3 2" />
            <circle cx="16" cy="16" r="4" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" fill="none" />
          </svg>
        </div>
      )}
      {!mediaUrl && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <p style={{ color: '#b6b6b6', fontSize: 18 }}>Drag & Drop an equirectangular image/video here</p>
        </div>
      )}
      {loadError && (
        <div style={{ position: 'absolute', bottom: 18, left: 18, right: 18, background: 'rgba(185,28,28,0.85)', color: '#fff', padding: '10px 12px', borderRadius: 8, fontSize: 13 }}>
          {loadError}
        </div>
      )}
    </div>
  )
})

export default Viewer