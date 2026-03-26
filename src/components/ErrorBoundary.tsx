import { Component } from 'react'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  errorMessage: string
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, errorMessage: '' }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[Prism 360] Uncaught error in component tree:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            width: '100%',
            height: '100vh',
            backgroundColor: '#0f172a',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 20,
            fontFamily: 'system-ui, sans-serif',
            color: '#f1f5f9',
          }}
        >
          <div
            style={{
              background: '#1e293b',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 16,
              padding: '32px 40px',
              maxWidth: 480,
              textAlign: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px 0', color: '#f87171' }}>
              Something went wrong
            </h1>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 20px 0', lineHeight: 1.6 }}>
              The 360° viewer encountered an unexpected error. This may be a WebGL issue or an invalid media source.
            </p>
            {this.state.errorMessage && (
              <code
                style={{
                  display: 'block',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: 8,
                  padding: '8px 12px',
                  fontSize: 11,
                  color: '#f87171',
                  marginBottom: 20,
                  wordBreak: 'break-word',
                  textAlign: 'left',
                }}
              >
                {this.state.errorMessage}
              </code>
            )}
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '10px 24px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reload Viewer
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
