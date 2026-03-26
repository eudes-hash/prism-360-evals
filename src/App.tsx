import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import Viewer from './components/Viewer'
import type { ViewerRef, ViewMode } from './components/Viewer'
import TaxonomyDrawer from './components/TaxonomyDrawer'
import EventTaggerPanel from './components/EventTaggerPanel'
import type { EventType, TaggedEvent } from './components/EventTaggerPanel'
import Sidebar from './components/Sidebar'
import TaskerAuthModal from './components/TaskerAuthModal'
import IssueLogger from './components/IssueLogger'
import type { Issue } from './components/IssueLogger'
import ErrorBoundary from './components/ErrorBoundary'
import { useEvalSystem } from './hooks/useEvalSystem'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import * as THREE from 'three'
import { getGuideTourSteps, GUIDE_TOUR_SAMPLE_VIDEO_URL } from './tour/guideTour'

interface EventDraft {
  type: EventType
  startSeconds: number | null
  endSeconds: number | null
  cameraState: { position: THREE.Vector3; target: THREE.Vector3; fov: number } | null
}

interface TimelineRenderableEvent {
  id: string; type: EventType; startSeconds: number; endSeconds: number
  startPercent: number; endPercent: number; widthPercent: number; track: number
  isActive: boolean
  cameraState: { position: THREE.Vector3; target: THREE.Vector3; fov: number }
}

type TourMode = 'interactive_prefill' | 'visual_only'

interface TaxonomyTourCommand {
  id: number
  action: 'open' | 'prefill-demo' | 'focus-section'
  section?: 'video' | 'question' | 'answer' | 'temporal'
}

const SAMPLE_IMAGES = [
  { name: 'e8347f4c...', url: '/360_images/e8347f4c-10c4-4699-86ee-b0d841299174.png' },
  { name: '11bdd45e...', url: '/360_images/11bdd45e-5276-4f9c-9e50-e2cd5b4c59ae.png' },
  { name: '98f05e48...', url: '/360_images/98f05e48-0c4b-4a97-858e-55ba75be6336.png' },
  { name: '3f59fb4a...', url: '/360_images/3f59fb4a-df51-4104-8ce0-a87305b0334b.png' },
  { name: '7d64f729...', url: '/360_images/7d64f729-3efb-4cdd-a374-684ddde7d51a.png' },
  { name: '2512f5ec...', url: '/360_images/2512f5ec-c51f-4e1d-8c8a-be05193dc2f9.png' },
  { name: 'dd156928...', url: '/360_images/dd156928-99d4-409b-8fe6-5b5e01468487.png' },
]

const SAMPLE_VIDEOS = [
  { name: 'e8347f4c...', url: '/360_videos/e8347f4c-10c4-4699-86ee-b0d841299174.mp4' },
  { name: '11bdd45e...', url: '/360_videos/11bdd45e-5276-4f9c-9e50-e2cd5b4c59ae.mp4' },
  { name: '98f05e48...', url: '/360_videos/98f05e48-0c4b-4a97-858e-55ba75be6336.mp4' },
  { name: '3f59fb4a...', url: '/360_videos/3f59fb4a-df51-4104-8ce0-a87305b0334b.mp4' },
  { name: '7d64f729...', url: '/360_videos/7d64f729-3efb-4cdd-a374-684ddde7d51a.mp4' },
  { name: '2512f5ec...', url: '/360_videos/2512f5ec-c51f-4e1d-8c8a-be05193dc2f9.mp4' },
  { name: 'dd156928...', url: '/360_videos/dd156928-99d4-409b-8fe6-5b5e01468487.mp4' },
  { name: '4f3e8ff0...', url: '/360_videos/4f3e8ff0-436e-4252-aacf-ecdc5050d1c4.mp4' },
]

function App() {
  const {
    runEvaluation, loading: evalLoading, result: evalResult, error: evalError,
    clearResult, isBlocked, taskerEmail, saveEmail, clearEmail, submitTaskTime
  } = useEvalSystem()

  const [mediaUrl, setMediaUrl] = useState<string | null>('/360_images/e8347f4c-10c4-4699-86ee-b0d841299174.png')
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image')

  const [showGrid, setShowGrid] = useState(false)
  const [showSinusoidalGrid, setShowSinusoidalGrid] = useState(false)
  const [gridRotation, setGridRotation] = useState(0)
  const [gridDensity, setGridDensity] = useState(8)
  const [sectorOpacity, setSectorOpacity] = useState(0.22)
  const [sectorColors, setSectorColors] = useState({ front: '#2ecc71', right: '#f39c12', back: '#e74c3c', left: '#3498db' })
  const [polarColors, setPolarColors] = useState({ top: '#8b5cf6', bottom: '#0ea5e9' })
  const [viewMode, setViewMode] = useState<ViewMode>('spherical')

  const [issues, setIssues] = useState<Issue[]>([])
  const [isLogging, setIsLogging] = useState(false)
  const [newIssueDesc, setNewIssueDesc] = useState('')

  const [isMenuMinimized, setIsMenuMinimized] = useState(true)

  const [isPlaying, setIsPlaying] = useState(true)
  const [videoProgress, setVideoProgress] = useState(0)
  const [videoDuration, setVideoDuration] = useState(0)

  const [isEventTaggerOpen, setIsEventTaggerOpen] = useState(false)
  const [showEventCenterGuide, setShowEventCenterGuide] = useState(false)
  const [eventDraft, setEventDraft] = useState<EventDraft>({ type: 'general', startSeconds: null, endSeconds: null, cameraState: null })
  const [realisticScene, setRealisticScene] = useState<'yes' | 'no' | ''>('')
  const [eventValidationMessage, setEventValidationMessage] = useState('')
  const [taggedEvents, setTaggedEvents] = useState<TaggedEvent[]>([])
  const [hoveredTimelineEventId, setHoveredTimelineEventId] = useState<string | null>(null)

  const [isTourRunning, setIsTourRunning] = useState(false)
  const [tourStep, setTourStep] = useState(0)
  const [tourDemoMode, setTourDemoMode] = useState<TourMode>('interactive_prefill')
  const [taxonomyTourCommand, setTaxonomyTourCommand] = useState<TaxonomyTourCommand | null>(null)

  // Feather state stubs (no external connection in web version)
  const featherPrompt = ''
  const featherAnswer = ''
  const featherQaMessage = ''
  const extractedTaskId = ''
  const taskIdCheckMessage = ''
  const taskIdCopyMessage = ''

  const viewerRef = useRef<ViewerRef>(null)
  const tourDriverRef = useRef<ReturnType<typeof driver> | null>(null)

  useEffect(() => {
    if (realisticScene !== 'no') {
      setTaggedEvents((prev) => {
        const filtered = prev.filter((e) => e.type !== 'no_realistic')
        return filtered.length !== prev.length ? filtered : prev
      })
      setEventDraft((prev) => prev.type === 'no_realistic' ? { ...prev, type: 'general' } : prev)
    }
  }, [realisticScene])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const src = params.get('src')
    if (src) { setMediaUrl(src); setMediaType('video') }
  }, [])

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined
    if (mediaType === 'video') {
      interval = setInterval(() => {
        if (viewerRef.current) {
          const state = viewerRef.current.getVideoState()
          setIsPlaying(state.isPlaying); setVideoProgress(state.currentTime); setVideoDuration(state.duration)
        }
      }, 100)
    }
    return () => clearInterval(interval)
  }, [mediaType])

  useEffect(() => { return () => { tourDriverRef.current?.destroy() } }, [])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file)
      setMediaType(file.type.startsWith('video/') ? 'video' : 'image')
      setMediaUrl((prev) => { if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev); return url })
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault() }, [])

  const handleTogglePlay = () => viewerRef.current?.togglePlay()
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    viewerRef.current?.setVideoTime(time); setVideoProgress(time)
  }
  const formatTime = (time: number) => `${Math.floor(time / 60)}:${Math.floor(time % 60).toString().padStart(2, '0')}`
  const getCurrentVideoSecond = () => viewerRef.current?.getVideoState()?.currentTime ?? 0
  const handleZoomIn = () => viewerRef.current?.adjustSphericalZoom(-8)
  const handleZoomOut = () => viewerRef.current?.adjustSphericalZoom(8)

  const saveIssue = () => {
    if (viewerRef.current && newIssueDesc) {
      setIssues((prev) => [...prev, { id: Date.now().toString(), description: newIssueDesc, cameraState: viewerRef.current!.getCameraState() }])
      setNewIssueDesc(''); setIsLogging(false)
    }
  }
  const restoreView = (issue: Issue) => viewerRef.current?.setCameraState(issue.cameraState)
  const exportIssues = () => {
    const blob = new Blob([JSON.stringify(issues, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = '360-evaluation-report.json'; a.click()
    URL.revokeObjectURL(url)
  }

  const handleToggleEventTagger = () => { const next = !isEventTaggerOpen; setIsEventTaggerOpen(next); if (next) setShowEventCenterGuide(true) }
  const handleCaptureEventStart = () => {
    if (!viewerRef.current) { setEventValidationMessage('Viewer is not ready yet.'); return }
    const currentTime = viewerRef.current.getVideoState().currentTime
    setEventDraft((prev) => ({ ...prev, startSeconds: currentTime, cameraState: viewerRef.current!.getCameraState(), endSeconds: prev.endSeconds !== null && prev.endSeconds < currentTime ? null : prev.endSeconds }))
    setEventValidationMessage('')
  }
  const handleCaptureEventEnd = () => {
    if (!viewerRef.current) { setEventValidationMessage('Viewer is not ready yet.'); return }
    setEventDraft((prev) => ({ ...prev, endSeconds: viewerRef.current!.getVideoState().currentTime }))
    setEventValidationMessage('')
  }
  const clearEventDraft = () => { setEventDraft({ type: 'general', startSeconds: null, endSeconds: null, cameraState: null }); setEventValidationMessage('') }
  const handleSaveTaggedEvent = () => {
    if (eventDraft.startSeconds === null) { setEventValidationMessage('Set Start before saving the event.'); return }
    if (eventDraft.endSeconds === null) { setEventValidationMessage('Set End before saving the event.'); return }
    if (eventDraft.endSeconds < eventDraft.startSeconds) { setEventValidationMessage('End must be greater than or equal to Start.'); return }
    if (!eventDraft.cameraState) { setEventValidationMessage('Camera snapshot is missing. Use Set Start again.'); return }
    const appliedType = taggedEvents.length > 0 ? taggedEvents[0].type : eventDraft.type
    if (appliedType === 'general' && taggedEvents.some(e => e.type === 'general')) {
      setEventValidationMessage('Only 1 General event is allowed.'); return
    }
    setTaggedEvents((prev) => [{ id: Date.now().toString(), type: appliedType, startSeconds: eventDraft.startSeconds!, endSeconds: eventDraft.endSeconds!, cameraState: eventDraft.cameraState!, createdAt: Date.now() }, ...prev])
    clearEventDraft()
  }
  const handleJumpToTaggedEvent = (eventId: string, playAfterJump = false) => {
    const event = taggedEvents.find((item) => item.id === eventId)
    if (!event || !viewerRef.current) return
    viewerRef.current.setVideoTime(event.startSeconds); viewerRef.current.setCameraState(event.cameraState)
    if (playAfterJump && !viewerRef.current.getVideoState().isPlaying) viewerRef.current.togglePlay()
    setEventValidationMessage('')
  }
  const handleDeleteTaggedEvent = (eventId: string) => setTaggedEvents((prev) => prev.filter((e) => e.id !== eventId))

  const timelineEvents = useMemo<TimelineRenderableEvent[]>(() => {
    if (mediaType !== 'video' || videoDuration <= 0 || !Number.isFinite(videoDuration)) return []
    const sorted = [...taggedEvents].filter((e) => Number.isFinite(e.startSeconds) && Number.isFinite(e.endSeconds)).sort((a, b) => a.startSeconds - b.startSeconds)
    const trackEnds = Array.from({ length: 3 }, () => -Infinity)
    return sorted.map((event) => {
      const startSeconds = Math.max(0, Math.min(event.startSeconds, videoDuration))
      const endSeconds = Math.max(startSeconds, Math.min(event.endSeconds, videoDuration))
      let track = 0
      for (let i = 0; i < 3; i++) { if (startSeconds >= trackEnds[i]) { track = i; break } if (trackEnds[i] < trackEnds[track]) track = i }
      trackEnds[track] = endSeconds
      const startPercent = (startSeconds / videoDuration) * 100
      const endPercent = (endSeconds / videoDuration) * 100
      return { id: event.id, type: event.type, startSeconds, endSeconds, startPercent, endPercent, widthPercent: Math.max(endPercent - startPercent, 0.6), track, isActive: videoProgress >= startSeconds && videoProgress <= endSeconds, cameraState: event.cameraState }
    })
  }, [mediaType, taggedEvents, videoDuration, videoProgress])
  const hoveredTimelineEvent = timelineEvents.find((e) => e.id === hoveredTimelineEventId) || null

  const setTaxonomyTourAction = (command: Omit<TaxonomyTourCommand, 'id'>) =>
    setTaxonomyTourCommand({ id: Date.now() + Math.floor(Math.random() * 1000), ...command })

  const buildDemoEvents = (cameraState: { position: THREE.Vector3; target: THREE.Vector3; fov: number }): TaggedEvent[] => [
    { id: crypto.randomUUID(), type: 'general', startSeconds: 0.6, endSeconds: 1.4, cameraState, createdAt: Date.now() },
    { id: crypto.randomUUID(), type: 'temporal_counting', startSeconds: 2.2, endSeconds: 3.2, cameraState, createdAt: Date.now() + 1 },
  ]

  const prepareTourDemo = () => {
    setTourDemoMode('interactive_prefill'); setIsMenuMinimized(false); setMediaType('video'); setMediaUrl(GUIDE_TOUR_SAMPLE_VIDEO_URL); setViewMode('spherical'); setShowGrid(true); setShowSinusoidalGrid(false); setIsEventTaggerOpen(true); setShowEventCenterGuide(true); setEventValidationMessage(''); setHoveredTimelineEventId(null)
    const cameraState = viewerRef.current?.getCameraState() ?? { position: new THREE.Vector3(0, 0, 0.1), target: new THREE.Vector3(0, 0, -1), fov: 95 }
    setTaggedEvents(buildDemoEvents(cameraState)); setTaxonomyTourAction({ action: 'prefill-demo' })
  }

  const startGuideTour = () => {
    prepareTourDemo()
    window.setTimeout(() => {
      const steps = getGuideTourSteps().filter((step) => !step.element || typeof step.element !== 'string' || Boolean(document.querySelector(step.element as string)))
      if (steps.length === 0) return
      tourDriverRef.current?.destroy()
      const instance = driver({ animate: true, smoothScroll: true, allowClose: true, overlayOpacity: 0.72, stagePadding: 8, showProgress: true, doneBtnText: 'Done', nextBtnText: 'Next', prevBtnText: 'Back', steps, onHighlighted: (_el: unknown, _step: unknown, opts: { state: { activeIndex?: number } }) => setTourStep((opts.state.activeIndex ?? 0) + 1), onDestroyed: () => { setIsTourRunning(false); setTourStep(0) } })
      tourDriverRef.current = instance; setIsTourRunning(true); instance.drive()
    }, 280)
  }

  const mediaSection = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <label
        style={{ cursor: 'pointer', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', padding: '10px', borderRadius: 8, fontSize: 12, fontWeight: 600, textAlign: 'center', display: 'block', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        Upload Image / Video
        <input
          type="file"
          accept="image/*,video/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (!file) return
            const url = URL.createObjectURL(file)
            setMediaType(file.type.startsWith('video/') ? 'video' : 'image')
            setMediaUrl((prev) => { if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev); return url })
          }}
        />
      </label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Image</label>
        <select
          onChange={(e) => { if (e.target.value) { setMediaType('image'); setMediaUrl(e.target.value) } }}
          value={mediaType === 'image' ? (mediaUrl || '') : ''}
          style={{ background: 'rgba(0,0,0,0.3)', color: '#f1f5f9', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', padding: '8px 10px', fontSize: 12, outline: 'none', width: '100%' }}
        >
          <option value="" disabled>Select image...</option>
          {SAMPLE_IMAGES.map((img) => <option key={img.url} value={img.url}>{img.name}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Video</label>
        <select
          onChange={(e) => { if (e.target.value) { setMediaType('video'); setMediaUrl(e.target.value) } }}
          value={mediaType === 'video' ? (mediaUrl || '') : ''}
          style={{ background: 'rgba(0,0,0,0.3)', color: '#f1f5f9', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', padding: '8px 10px', fontSize: 12, outline: 'none', width: '100%' }}
        >
          <option value="" disabled>Select video...</option>
          {SAMPLE_VIDEOS.map((vid) => <option key={vid.url} value={vid.url}>{vid.name}</option>)}
        </select>
      </div>
      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '4px 0' }} />
    </div>
  )

  return (
    <div
      style={{ width: '100%', height: '100vh', backgroundColor: '#0f172a', overflow: 'hidden', display: 'flex', flexDirection: 'row' }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <Sidebar
        isMenuMinimized={isMenuMinimized}
        onToggleMinimized={() => setIsMenuMinimized((prev) => !prev)}
        viewMode={viewMode} onViewModeChange={setViewMode}
        showGrid={showGrid} onToggleGrid={() => setShowGrid((v) => !v)}
        sectorOpacity={sectorOpacity} onSectorOpacityChange={setSectorOpacity}
        sectorColors={sectorColors} onSectorColorChange={(sector, color) => setSectorColors((prev) => ({ ...prev, [sector]: color }))}
        showSinusoidalGrid={showSinusoidalGrid} onToggleSinusoidalGrid={() => setShowSinusoidalGrid((v) => !v)}
        gridRotation={gridRotation} onGridRotationChange={setGridRotation}
        gridDensity={gridDensity} onGridDensityChange={setGridDensity}
        polarColors={polarColors} onPolarColorChange={(sector, color) => setPolarColors((prev) => ({ ...prev, [sector]: color }))}
        issueCount={issues.length} onExportIssues={exportIssues}
        isTourRunning={isTourRunning} tourStep={tourStep} tourDemoMode={tourDemoMode} onStartGuideTour={startGuideTour}
        taskerEmail={taskerEmail} onClearEmail={clearEmail}
        topSection={mediaSection}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden' }}>
        <div data-tour="viewer-area" style={{ flex: 1, position: 'relative' }}>
          <ErrorBoundary>
            <Viewer
              ref={viewerRef}
              mediaUrl={mediaUrl}
              mediaType={mediaType}
              showGrid={showGrid}
              viewMode={viewMode}
              showSinusoidalGrid={showSinusoidalGrid}
              gridRotation={gridRotation}
              gridDensity={gridDensity}
              sectorOpacity={sectorOpacity}
              sectorColors={sectorColors}
              polarColors={polarColors}
              showCenterGuide={showEventCenterGuide}
            />
          </ErrorBoundary>

          <EventTaggerPanel
            isOpen={isEventTaggerOpen}
            onToggle={handleToggleEventTagger}
            tourActive={isTourRunning}
            showCenterGuide={showEventCenterGuide}
            onToggleCenterGuide={() => setShowEventCenterGuide((prev) => !prev)}
            eventType={eventDraft.type}
            onEventTypeChange={(type) => setEventDraft((prev) => ({ ...prev, type }))}
            realisticScene={realisticScene}
            draftStart={eventDraft.startSeconds}
            draftEnd={eventDraft.endSeconds}
            validationMessage={eventValidationMessage}
            onCaptureStart={handleCaptureEventStart}
            onCaptureEnd={handleCaptureEventEnd}
            onSaveEvent={handleSaveTaggedEvent}
            onClearDraft={clearEventDraft}
            events={taggedEvents}
            onJumpToEvent={(eventId) => handleJumpToTaggedEvent(eventId, false)}
            onDeleteEvent={handleDeleteTaggedEvent}
          />

          <TaxonomyDrawer
            externalRealisticScene={realisticScene}
            onExternalRealisticSceneChange={setRealisticScene}
            getCurrentVideoSecond={getCurrentVideoSecond}
            onTogglePlayPause={handleTogglePlay}
            taggedEvents={taggedEvents}
            featherPrompt={featherPrompt}
            featherAnswer={featherAnswer}
            featherQaMessage={featherQaMessage}
            taskId={extractedTaskId}
            taskIdStatusMessage={taskIdCheckMessage}
            taskIdCopyMessage={taskIdCopyMessage}
            onCopyTaskId={() => {}}
            onSyncFromFeather={() => {}}
            tourCommand={taxonomyTourCommand ?? undefined}
            runEvaluation={runEvaluation}
            evalLoading={evalLoading}
            evalResult={evalResult}
            evalError={evalError}
            isBlocked={isBlocked}
            clearEvalResult={clearResult}
            submitTaskTime={submitTaskTime}
          />

          {viewMode === 'spherical' && (
            <div style={{ position: 'absolute', right: 20, bottom: 20, zIndex: 35, display: 'flex', gap: 8, pointerEvents: 'auto' }}>
              <button onClick={handleZoomOut} aria-label="Zoom out" style={{ background: 'rgba(15,23,42,0.72)', color: '#e2e8f0', border: '1px solid rgba(148,163,184,0.35)', width: 40, height: 40, borderRadius: 10, cursor: 'pointer', fontSize: 20, fontWeight: 700, backdropFilter: 'blur(6px)' }}>−</button>
              <button onClick={handleZoomIn} aria-label="Zoom in" style={{ background: 'rgba(15,23,42,0.72)', color: '#e2e8f0', border: '1px solid rgba(148,163,184,0.35)', width: 40, height: 40, borderRadius: 10, cursor: 'pointer', fontSize: 20, fontWeight: 700, backdropFilter: 'blur(6px)' }}>+</button>
            </div>
          )}

          <IssueLogger
            isLogging={isLogging}
            onClose={() => setIsLogging(false)}
            newIssueDesc={newIssueDesc}
            onDescChange={setNewIssueDesc}
            onSave={saveIssue}
            issues={issues}
            onRestoreView={restoreView}
          />

          {!taskerEmail && <TaskerAuthModal onSave={saveEmail} />}
        </div>

        {(mediaType === 'video' || viewMode === 'spherical') && (
          <div style={{ background: '#0f172a', borderTop: '1px solid rgba(255,255,255,0.1)', padding: '16px 24px', zIndex: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {mediaType === 'video' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <button onClick={handleTogglePlay} style={{ background: isPlaying ? 'rgba(255,255,255,0.2)' : '#3b82f6', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', transition: 'all 0.2s' }}>
                  {isPlaying
                    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                    : <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>}
                </button>
                <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>
                    <span>{formatTime(videoProgress)}</span><span>{formatTime(videoDuration)}</span>
                  </div>
                  <div style={{ position: 'relative', width: '100%', paddingTop: timelineEvents.length ? 18 : 0 }}>
                    {timelineEvents.length > 0 && (
                      <div data-tour="timeline-layer" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 14, pointerEvents: 'none', zIndex: 2 }}>
                        {timelineEvents.map((event) => {
                          const isHovered = hoveredTimelineEventId === event.id
                          return (
                            <button key={event.id} type="button"
                              onMouseEnter={() => setHoveredTimelineEventId(event.id)}
                              onMouseLeave={() => setHoveredTimelineEventId((prev) => (prev === event.id ? null : prev))}
                              onClick={() => handleJumpToTaggedEvent(event.id, true)}
                              style={{ position: 'absolute', left: `${event.startPercent}%`, width: `${event.widthPercent}%`, top: event.track * 4, height: 3, border: 'none', borderRadius: 999, background: event.isActive ? 'rgba(34,197,94,0.95)' : isHovered ? 'rgba(96,165,250,0.95)' : 'rgba(148,163,184,0.8)', boxShadow: isHovered ? '0 0 0 1px rgba(191,219,254,0.8)' : 'none', cursor: 'pointer', pointerEvents: 'auto', padding: 0 }}
                              aria-label={`Jump to ${event.type} event`}
                            />
                          )
                        })}
                      </div>
                    )}
                    <input type="range" min="0" max={videoDuration || 100} step="0.1" value={videoProgress} onChange={handleSeek} style={{ width: '100%', accentColor: '#3b82f6', height: 4, cursor: 'pointer', position: 'relative', zIndex: 1 }} />
                    {hoveredTimelineEvent && (
                      <div style={{ position: 'absolute', left: `${hoveredTimelineEvent.startPercent}%`, bottom: 34, transform: 'translateX(-50%)', background: 'rgba(2,6,23,0.94)', border: '1px solid rgba(148,163,184,0.35)', borderRadius: 6, padding: '3px 6px', minWidth: 90, maxWidth: 160, color: '#e2e8f0', fontSize: 10, lineHeight: 1.15, zIndex: 3, pointerEvents: 'none' }}>
                        <div style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textTransform: 'capitalize' }}>{hoveredTimelineEvent.type.replace('_', ' ')}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
