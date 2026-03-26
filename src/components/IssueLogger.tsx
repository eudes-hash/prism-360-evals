import * as THREE from 'three'

interface Issue {
  id: string
  description: string
  cameraState: {
    position: THREE.Vector3
    target: THREE.Vector3
    fov: number
  }
}

interface IssueLoggerProps {
  isLogging: boolean
  onClose: () => void
  newIssueDesc: string
  onDescChange: (val: string) => void
  onSave: () => void
  issues: Issue[]
  onRestoreView: (issue: Issue) => void
}

function IssueLogger({ isLogging, onClose, newIssueDesc, onDescChange, onSave, issues, onRestoreView }: IssueLoggerProps) {
  return (
    <>
      {isLogging && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#1e293b', padding: 24, borderRadius: 16, width: 420, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 0 16px 0' }}>Log Issue</h2>
            <textarea
              style={{ width: '100%', height: 130, background: '#0f172a', color: '#fff', padding: 12, borderRadius: 8, border: '1px solid #334155', marginBottom: 16, fontSize: 14, resize: 'none', boxSizing: 'border-box' }}
              placeholder="Describe the issue..."
              value={newIssueDesc}
              onChange={(e) => onDescChange(e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={onClose} style={{ padding: '8px 16px', color: '#94a3b8', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
                Cancel
              </button>
              <button onClick={onSave} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {issues.length > 0 && (
        <div style={{ width: 320, background: '#0f172a', borderLeft: '1px solid #1e293b', padding: 20, overflowY: 'auto' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: '0 0 16px 0' }}>Logged Issues</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {issues.map((issue) => (
              <div
                key={issue.id}
                style={{ background: '#1e293b', padding: 12, borderRadius: 10, cursor: 'pointer', border: '1px solid #334155', transition: 'border-color 0.2s' }}
                onClick={() => onRestoreView(issue)}
              >
                <p style={{ fontSize: 13, color: '#e2e8f0', margin: 0, lineHeight: 1.5 }}>{issue.description}</p>
                <span style={{ fontSize: 11, color: '#64748b', display: 'block', marginTop: 8, fontWeight: 500 }}>Click to view</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

export default IssueLogger
export type { Issue }
