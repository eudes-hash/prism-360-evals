import type * as THREE from 'three'

export type EventType = 'no_realistic' | 'general' | 'temporal_counting'

export interface TaggedEvent {
  id: string
  type: EventType
  startSeconds: number
  endSeconds: number
  cameraState: {
    position: THREE.Vector3
    target: THREE.Vector3
    fov: number
  }
  createdAt: number
}

interface EventTaggerPanelProps {
  isOpen: boolean
  onToggle: () => void
  tourActive?: boolean
  showCenterGuide: boolean
  onToggleCenterGuide: () => void
  eventType: EventType
  onEventTypeChange: (type: EventType) => void
  realisticScene: 'yes' | 'no' | ''
  draftStart: number | null
  draftEnd: number | null
  validationMessage: string
  onCaptureStart: () => void
  onCaptureEnd: () => void
  onSaveEvent: () => void
  onClearDraft: () => void
  events: TaggedEvent[]
  onJumpToEvent: (id: string) => void
  onDeleteEvent: (id: string) => void
}

const panelButtonStyle: React.CSSProperties = {
  border: '1px solid rgba(148, 163, 184, 0.35)',
  background: 'rgba(15, 23, 42, 0.78)',
  color: '#e2e8f0',
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
}

const formatTime = (seconds: number | null) => {
  if (seconds === null || Number.isNaN(seconds)) return '--'
  return `${seconds.toFixed(3)}s`
}

export default function EventTaggerPanel({
  isOpen,
  onToggle,
  tourActive = false,
  showCenterGuide,
  onToggleCenterGuide,
  eventType,
  onEventTypeChange,
  realisticScene,
  draftStart,
  draftEnd,
  validationMessage,
  onCaptureStart,
  onCaptureEnd,
  onSaveEvent,
  onClearDraft,
  events,
  onJumpToEvent,
  onDeleteEvent,
}: EventTaggerPanelProps) {
  return (
    <div
      style={{
        position: 'absolute',
        left: 20,
        bottom: 92,
        zIndex: tourActive ? 40 : 2147483001,
        pointerEvents: 'auto',
      }}
    >
      <button
        data-tour="event-launcher"
        type="button"
        onClick={onToggle}
        style={{
          ...panelButtonStyle,
          padding: '8px 12px',
          borderRadius: 999,
          marginBottom: 8,
        }}
      >
        {isOpen ? 'Hide Events Tool' : 'Events Tool'}
      </button>

      {isOpen && (
        <div
          style={{
            width: 360,
            maxHeight: '58vh',
            overflowY: 'auto',
            border: '1px solid rgba(148, 163, 184, 0.3)',
            background: 'rgba(2, 6, 23, 0.85)',
            backdropFilter: 'blur(8px)',
            borderRadius: 12,
            padding: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: '#f8fafc', fontWeight: 800, fontSize: 14 }}>Event Tagger</div>
            <button
              type="button"
              onClick={onToggleCenterGuide}
              style={{ ...panelButtonStyle, padding: '5px 8px' }}
            >
              {showCenterGuide ? 'Center Guide: ON' : 'Center Guide: OFF'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Event Type</label>
            <select
              value={events.length > 0 ? events[0].type : eventType}
              disabled={events.length > 0}
              onChange={(e) => onEventTypeChange(e.target.value as EventType)}
              style={{
                width: '100%',
                borderRadius: 8,
                border: '1px solid rgba(148, 163, 184, 0.35)',
                background: 'rgba(15, 23, 42, 0.6)',
                color: '#e2e8f0',
                padding: '8px 10px',
                fontSize: 12,
                outline: 'none',
                opacity: events.length > 0 ? 0.6 : 1,
                cursor: events.length > 0 ? 'not-allowed' : 'pointer'
              }}
            >
              <option value="general">General (Max 10)</option>
              <option value="temporal_counting">Temporal Counting (Multiple)</option>
              <option value="no_realistic" disabled={realisticScene !== 'no'}>
                No Realistic {realisticScene !== 'no' ? '(Requires "No" in form)' : '(Multiple)'}
              </option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button
              data-tour="event-set-start"
              type="button"
              onClick={onCaptureStart}
              style={{ ...panelButtonStyle, padding: '8px 10px' }}
            >
              Set Start ({formatTime(draftStart)})
            </button>
            <button
              data-tour="event-set-end"
              type="button"
              onClick={onCaptureEnd}
              style={{ ...panelButtonStyle, padding: '8px 10px' }}
            >
              Set End ({formatTime(draftEnd)})
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button
              data-tour="event-save"
              type="button"
              onClick={onSaveEvent}
              style={{
                ...panelButtonStyle,
                padding: '8px 10px',
                borderColor: 'rgba(34, 197, 94, 0.45)',
                color: '#86efac',
              }}
            >
              Save Event
            </button>
            <button type="button" onClick={onClearDraft} style={{ ...panelButtonStyle, padding: '8px 10px' }}>
              Clear Draft
            </button>
          </div>

          {validationMessage && (
            <div
              style={{
                border: '1px solid rgba(251, 191, 36, 0.45)',
                background: 'rgba(251, 191, 36, 0.12)',
                color: '#fde68a',
                borderRadius: 8,
                padding: '8px 10px',
                fontSize: 12,
              }}
            >
              {validationMessage}
            </div>
          )}

          <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700 }}>Saved events ({events.length})</div>
          <div data-tour="event-list" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {events.length === 0 && (
              <div style={{ color: '#64748b', fontSize: 12 }}>No events yet.</div>
            )}
            {events.map((event) => (
              <div
                key={event.id}
                style={{
                  border: '1px solid rgba(148, 163, 184, 0.25)',
                  borderRadius: 10,
                  padding: 8,
                  background: 'rgba(15, 23, 42, 0.45)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>
                  {event.type.replace('_', ' ')} Event
                </div>
                <div style={{ color: '#94a3b8', fontSize: 12 }}>
                  {event.startSeconds.toFixed(3)}s - {event.endSeconds.toFixed(3)}s
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => onJumpToEvent(event.id)}
                    style={{ ...panelButtonStyle, padding: '7px 10px' }}
                  >
                    Go to event
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteEvent(event.id)}
                    style={{
                      ...panelButtonStyle,
                      padding: '7px 10px',
                      borderColor: 'rgba(248, 113, 113, 0.4)',
                      color: '#fca5a5',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
