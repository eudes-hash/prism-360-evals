import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'

type AnswerChoice = '' | 'yes' | 'no'

interface TemporalEvent {
  id: string
  seconds: string
}

interface TaxonomyDraft {
  realisticScene: AnswerChoice
  realisticSceneJustification: string
  is360: AnswerChoice
  is360Justification: string
  questionValid: AnswerChoice
  questionInvalidJustification: string
  questionFixSuggestion: string
  answerValid: AnswerChoice
  answerInvalidJustification: string
  answerFixSuggestion: string
  isTemporalCounting: AnswerChoice
  temporalCountingEvents: TemporalEvent[]
}

interface TaxonomyDrawerProps {
  externalRealisticScene: 'yes' | 'no' | ''
  onExternalRealisticSceneChange: (value: 'yes' | 'no' | '') => void
  getCurrentVideoSecond: () => number
  onTogglePlayPause: () => void
  taggedEvents: Array<{
    id: string
    type: 'no_realistic' | 'general' | 'temporal_counting'
    startSeconds: number
    endSeconds: number
  }>
  featherPrompt: string
  featherAnswer: string
  featherQaMessage: string
  taskId: string
  taskIdStatusMessage: string
  taskIdCopyMessage: string
  onCopyTaskId: () => void
  onSyncFromFeather: () => void
  tourCommand?: {
    id: number
    action: 'open' | 'prefill-demo' | 'focus-section'
    section?: 'video' | 'question' | 'answer' | 'temporal'
  }
  runEvaluation: (formData: unknown, taskId: string) => Promise<void>
  evalLoading: boolean
  evalResult: { passed: boolean; summary: string; errors: Array<{ field: string; severity: string; message: string }> } | null
  evalError: string | null
  isBlocked: boolean
  clearEvalResult: () => void
  submitTaskTime?: (taskId: string, timeSeconds: number) => Promise<void>
}

const STORAGE_KEY = 'prism360.taxonomyDraft.v1'

const DEFAULT_DRAFT: TaxonomyDraft = {
  realisticScene: '',
  realisticSceneJustification: '',
  is360: '',
  is360Justification: '',
  questionValid: '',
  questionInvalidJustification: '',
  questionFixSuggestion: '',
  answerValid: '',
  answerInvalidJustification: '',
  answerFixSuggestion: '',
  isTemporalCounting: '',
  temporalCountingEvents: [{ id: crypto.randomUUID(), seconds: '' }],
}

const parseStoredDraft = (): TaxonomyDraft => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_DRAFT
    const parsed = JSON.parse(raw) as Partial<TaxonomyDraft>
    return {
      ...DEFAULT_DRAFT,
      ...parsed,
      temporalCountingEvents:
        parsed.temporalCountingEvents && parsed.temporalCountingEvents.length > 0
          ? parsed.temporalCountingEvents
          : DEFAULT_DRAFT.temporalCountingEvents,
    }
  } catch {
    return DEFAULT_DRAFT
  }
}

const isTextInputLike = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName.toLowerCase()
  return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable
}

const completionPercent = (value: number, total: number) => Math.round((value / Math.max(total, 1)) * 100)

const toggleBaseStyle: CSSProperties = {
  border: '1px solid rgba(148, 163, 184, 0.35)',
  background: 'rgba(15, 23, 42, 0.6)',
  color: '#cbd5e1',
  padding: '6px 10px',
  borderRadius: 8,
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 600,
}

const inputStyle: CSSProperties = {
  width: '100%',
  background: 'rgba(2, 6, 23, 0.55)',
  color: '#e2e8f0',
  border: '1px solid rgba(148, 163, 184, 0.3)',
  borderRadius: 8,
  fontSize: 13,
  padding: '10px 12px',
  outline: 'none',
}

const Section = ({
  title,
  isOpen,
  onToggle,
  done,
  disabled = false,
  children,
  dataTourId,
}: {
  title: string
  isOpen: boolean
  onToggle: () => void
  done: boolean
  disabled?: boolean
  children: ReactNode
  dataTourId?: string
}) => (
  <section
    data-tour={dataTourId}
    style={{
      border: '1px solid rgba(148, 163, 184, 0.25)',
      borderRadius: 12,
      overflow: 'hidden',
      background: 'rgba(15, 23, 42, 0.5)',
    }}
  >
    <button
      onClick={onToggle}
      disabled={disabled}
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(15, 23, 42, 0.55)',
        border: 'none',
        color: '#f8fafc',
        padding: '10px 12px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.65 : 1,
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700 }}>{title}</span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            borderRadius: 999,
            padding: '2px 6px',
            border: done ? '1px solid rgba(34, 197, 94, 0.35)' : '1px solid rgba(148, 163, 184, 0.35)',
            color: done ? '#4ade80' : '#94a3b8',
            background: done ? 'rgba(34, 197, 94, 0.12)' : 'rgba(148, 163, 184, 0.1)',
          }}
        >
          {done ? 'Done' : 'Pending'}
        </span>
      </span>
      <span style={{ color: '#94a3b8' }}>{isOpen ? '−' : '+'}</span>
    </button>
    {isOpen && <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>}
  </section>
)

const ChoiceField = ({
  label,
  value,
  onChange,
  id,
}: {
  label: string
  value: AnswerChoice
  onChange: (value: AnswerChoice) => void
  id: string
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <label htmlFor={id} style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 600 }}>
      {label}
    </label>
    <div id={id} role="group" aria-label={label} style={{ display: 'flex', gap: 8 }}>
      {(['yes', 'no'] as const).map((option) => {
        const selected = value === option
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            aria-pressed={selected}
            style={{
              ...toggleBaseStyle,
              background: selected ? 'rgba(59, 130, 246, 0.25)' : toggleBaseStyle.background,
              border: selected ? '1px solid rgba(96, 165, 250, 0.65)' : toggleBaseStyle.border,
              color: selected ? '#bfdbfe' : '#cbd5e1',
            }}
          >
            {option.toUpperCase()}
          </button>
        )
      })}
    </div>
  </div>
)

export default function TaxonomyDrawer({
  externalRealisticScene: _externalRealisticScene,
  onExternalRealisticSceneChange,
  getCurrentVideoSecond: _getCurrentVideoSecond,
  onTogglePlayPause,
  taggedEvents,
  featherPrompt,
  featherAnswer,
  featherQaMessage,
  taskId,
  taskIdStatusMessage,
  taskIdCopyMessage,
  onCopyTaskId,
  onSyncFromFeather,
  tourCommand,
  runEvaluation,
  evalLoading,
  evalResult,
  evalError,
  isBlocked,
  clearEvalResult,
  submitTaskTime,
}: TaxonomyDrawerProps) {
  const [draft, setDraft] = useState<TaxonomyDraft>(parseStoredDraft)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [copiedEventId, setCopiedEventId] = useState<string | null>(null)
  const [copiedAllEvents, setCopiedAllEvents] = useState(false)
  const [submitFeedback, setSubmitFeedback] = useState('')
  const [compactLayout, setCompactLayout] = useState(window.innerWidth < 960)
  const [sectionOpen, setSectionOpen] = useState({
    video: true,
    question: false,
    answer: false,
    temporal: false,
  })

  const prevTaskIdRef = useRef('')

  useEffect(() => {
    if (taskId && taskId !== prevTaskIdRef.current) {
      prevTaskIdRef.current = taskId
      setDraft(parseStoredDraft())
      clearEvalResult()
      setTimerSeconds(0)
    }
  }, [taskId, clearEvalResult])

  useEffect(() => {
    if (!taskId) return
    const interval = window.setInterval(() => {
      setTimerSeconds((prev) => prev + 1)
    }, 1000)
    return () => window.clearInterval(interval)
  }, [taskId])

  const formatTimer = (s: number) => {
    const hrs = Math.floor(s / 3600).toString().padStart(2, '0')
    const mins = Math.floor((s % 3600) / 60).toString().padStart(2, '0')
    const secs = (s % 60).toString().padStart(2, '0')
    return `${hrs}:${mins}:${secs}`
  }

  const timerColor = timerSeconds < 600 ? '#22c55e' : timerSeconds < 900 ? '#eab308' : '#ef4444'
  const isVibrating = timerSeconds >= 900

  useEffect(() => {
    onExternalRealisticSceneChange(draft.realisticScene)
  }, [draft.realisticScene, onExternalRealisticSceneChange])

  const promptHasTemporalTag = useMemo(
    () => /\(temporal counting question\)\s*$/i.test(featherPrompt.trim()),
    [featherPrompt]
  )

  const panelRef = useRef<HTMLDivElement | null>(null)
  const openButtonRef = useRef<HTMLButtonElement | null>(null)
  const firstInputRef = useRef<HTMLTextAreaElement | null>(null)

  const sectionCompletion = useMemo(() => {
    const fixSuggestionHasTemporalTag = /\(temporal counting question\)\s*$/i.test(
      draft.questionFixSuggestion.trim()
    )
    const temporalFixLintOk = !promptHasTemporalTag || fixSuggestionHasTemporalTag
    const singleQuestionLintOk = !/\band\b/i.test(draft.questionFixSuggestion.trim())
    const temporalFixHasMinEvents = !fixSuggestionHasTemporalTag || draft.temporalCountingEvents.length >= 2
    const temporalPromptRequiresYes = !promptHasTemporalTag || draft.isTemporalCounting === 'yes'
    const invalidQaRequiresTaggedEvent = !(draft.questionValid === 'no' || draft.answerValid === 'no') || taggedEvents.length > 0
    const realisticNoNeedsJustification = draft.realisticScene !== 'no' || draft.realisticSceneJustification.trim().length > 0
    const realisticNoRequiresTaggedEvent = draft.realisticScene !== 'no' || taggedEvents.length > 0
    const realismStopsWorkflow = draft.realisticScene === 'no'
    const questionNoRequiresAnswerNo = draft.questionValid !== 'no' || draft.answerValid === 'no'
    const is360JustificationLength = draft.is360Justification.length
    const is360JustificationLengthOk =
      draft.is360 !== 'no' || (is360JustificationLength >= 230 && is360JustificationLength <= 600)

    const videoDone =
      draft.realisticScene !== '' &&
      realisticNoNeedsJustification &&
      realisticNoRequiresTaggedEvent &&
      (draft.realisticScene === 'no' ||
        (draft.is360 !== '' &&
          (draft.is360 !== 'no' ||
            (draft.is360Justification !== undefined && is360JustificationLengthOk))))

    const questionDone =
      realismStopsWorkflow ||
      (draft.questionValid !== '' &&
        (draft.questionValid !== 'no' ||
          (draft.questionInvalidJustification.trim().length > 0 &&
            draft.questionFixSuggestion.trim().length > 0 &&
            temporalFixLintOk &&
            singleQuestionLintOk &&
            temporalFixHasMinEvents)) &&
        invalidQaRequiresTaggedEvent)

    const answerDone =
      realismStopsWorkflow ||
      (draft.answerValid !== '' &&
        (draft.answerValid !== 'no' ||
          (draft.answerInvalidJustification.trim().length > 0 && draft.answerFixSuggestion.trim().length > 0)) &&
        questionNoRequiresAnswerNo &&
        invalidQaRequiresTaggedEvent)

    const temporalDone =
      realismStopsWorkflow ||
      (draft.isTemporalCounting !== '' &&
        (draft.isTemporalCounting !== 'yes' ||
          (draft.temporalCountingEvents.every((event) => event.seconds.trim().length > 0) &&
            temporalFixHasMinEvents)) &&
        temporalPromptRequiresYes)

    const doneCount = [videoDone, questionDone, answerDone, temporalDone].filter(Boolean).length
    return {
      videoDone,
      questionDone,
      answerDone,
      temporalDone,
      doneCount,
      promptHasTemporalTag,
      temporalFixLintOk,
      singleQuestionLintOk,
      temporalFixHasMinEvents,
      temporalPromptRequiresYes,
      invalidQaRequiresTaggedEvent,
      realisticNoRequiresTaggedEvent,
      realisticNoNeedsJustification,
      realismStopsWorkflow,
      questionNoRequiresAnswerNo,
      is360JustificationLength,
      is360JustificationLengthOk,
    }
  }, [draft, promptHasTemporalTag, taggedEvents.length])

  useEffect(() => {
    if (!taskId || taskId === prevTaskIdRef.current) return
    prevTaskIdRef.current = taskId
    localStorage.removeItem(STORAGE_KEY)
    setDraft({ ...DEFAULT_DRAFT, temporalCountingEvents: [{ id: crypto.randomUUID(), seconds: '' }] })
    setSectionOpen({ video: true, question: false, answer: false, temporal: false })
    setSubmitFeedback('')
  }, [taskId])

  useEffect(() => {
    setDraft((prev) => ({
      ...prev,
      isTemporalCounting: promptHasTemporalTag ? 'yes' : 'no',
    }))
    if (promptHasTemporalTag) {
      setSectionOpen((prev) => ({ ...prev, temporal: true }))
    }
  }, [promptHasTemporalTag])

  useEffect(() => {
    if (draft.realisticScene === 'no') {
      setSectionOpen((prev) => ({
        ...prev,
        video: true,
        question: false,
        answer: false,
        temporal: false,
      }))
    }
  }, [draft.realisticScene])

  useEffect(() => {
    const mapped = taggedEvents
      .filter((event) => Number.isFinite(event.startSeconds))
      .sort((a, b) => a.startSeconds - b.startSeconds)
      .map((event) => ({
        id: event.id,
        seconds: event.startSeconds.toFixed(3),
      }))

    setDraft((prev) => {
      const sameLength = prev.temporalCountingEvents.length === mapped.length
      const sameValues =
        sameLength &&
        prev.temporalCountingEvents.every(
          (item, index) => item.id === mapped[index]?.id && item.seconds === mapped[index]?.seconds
        )
      if (sameValues) return prev
      return { ...prev, temporalCountingEvents: mapped }
    })
  }, [taggedEvents])

  useEffect(() => {
    const timeout = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
    }, 2200)
    return () => clearTimeout(timeout)
  }, [draft])

  useEffect(() => {
    const resizeListener = () => setCompactLayout(window.innerWidth < 960)
    window.addEventListener('resize', resizeListener)
    return () => window.removeEventListener('resize', resizeListener)
  }, [])

  useEffect(() => {
    const keyListener = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'f' && !isTextInputLike(event.target)) {
        event.preventDefault()
        setIsOpen(true)
      }
      if (event.code === 'Space' && !isTextInputLike(event.target)) {
        event.preventDefault()
        onTogglePlayPause()
      }
    }
    window.addEventListener('keydown', keyListener)
    return () => window.removeEventListener('keydown', keyListener)
  }, [onTogglePlayPause])

  useEffect(() => {
    if (!tourCommand) return

    if (tourCommand.action === 'open') {
      setIsOpen(true)
      return
    }

    if (tourCommand.action === 'focus-section' && tourCommand.section) {
      setIsOpen(true)
      setSectionOpen({
        video: tourCommand.section === 'video',
        question: tourCommand.section === 'question',
        answer: tourCommand.section === 'answer',
        temporal: tourCommand.section === 'temporal',
      })
      return
    }

    if (tourCommand.action === 'prefill-demo') {
      setIsOpen(true)
      setSectionOpen({ video: true, question: true, answer: true, temporal: true })
      setDraft({
        realisticScene: 'yes',
        realisticSceneJustification: '',
        is360: 'yes',
        is360Justification: '',
        questionValid: 'no',
        questionInvalidJustification:
          'The original question references an event that is not clearly observable in the video timeline.',
        questionFixSuggestion:
          'How many times does the person place the cup on the table? (temporal counting question)',
        answerValid: 'no',
        answerInvalidJustification:
          'The original answer does not reflect all visible repetitions of the action.',
        answerFixSuggestion: 'The cup is placed on the table two times.',
        isTemporalCounting: 'yes',
        temporalCountingEvents: [
          { id: crypto.randomUUID(), seconds: '0.900' },
          { id: crypto.randomUUID(), seconds: '2.450' },
        ],
      })
    }
  }, [tourCommand])

  useEffect(() => {
    if (!isOpen || !panelRef.current) return
    firstInputRef.current?.focus()
    const node = panelRef.current

    const trapTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const focusable = node.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement

      if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    node.addEventListener('keydown', trapTab)
    return () => node.removeEventListener('keydown', trapTab)
  }, [isOpen])

  const copyEventTimestamp = async (eventId: string, seconds: string) => {
    if (!seconds.trim()) return
    try {
      await navigator.clipboard.writeText(seconds.trim())
      setCopiedEventId(eventId)
      window.setTimeout(() => {
        setCopiedEventId((current) => (current === eventId ? null : current))
      }, 1200)
    } catch {
      // Clipboard may be blocked in some browser contexts.
    }
  }

  const copyAllTimestamps = async () => {
    const values = draft.temporalCountingEvents
      .map((entry) => entry.seconds.trim())
      .filter((entry) => entry.length > 0)
    if (values.length === 0) return
    try {
      await navigator.clipboard.writeText(values.join(', '))
      setCopiedAllEvents(true)
      window.setTimeout(() => setCopiedAllEvents(false), 1200)
    } catch {
      // Clipboard may be blocked in some browser contexts.
    }
  }

  const totalSections = 4
  const progress = completionPercent(sectionCompletion.doneCount, totalSections)
  const forcedTemporalChoice: AnswerChoice = promptHasTemporalTag ? 'yes' : 'no'
  const allChecksPassed = sectionCompletion.doneCount === totalSections && !isBlocked

  useEffect(() => {
    if (!allChecksPassed && submitFeedback) {
      setSubmitFeedback('')
    }
  }, [allChecksPassed, submitFeedback])

  const handleSubmitChecks = async () => {
    if (!allChecksPassed) {
      setSubmitFeedback('Task is not ready yet. Complete all checks first.')
      return
    }

    if (submitTaskTime) {
      setSubmitFeedback('Saving Task Time...')
      await submitTaskTime(taskId, timerSeconds)
    }

    setSubmitFeedback('Success: task passed all checks.')
  }

  const panelStyle: CSSProperties = compactLayout
    ? {
        position: 'absolute',
        left: 16,
        right: 16,
        top: 16,
        bottom: 16,
        borderRadius: 14,
        maxHeight: 'calc(100% - 32px)',
      }
    : {
        position: 'absolute',
        top: 16,
        right: 16,
        bottom: 16,
        width: 'min(35vw, 420px)',
        minWidth: 320,
        borderRadius: 14,
        maxHeight: 'calc(100% - 32px)',
      }

  const FieldErrors = ({ fieldName }: { fieldName: string }) => {
    if (!evalResult || !evalResult.errors) return null
    const errors = evalResult.errors.filter((e) => e.field === fieldName)
    if (errors.length === 0) return null
    return (
      <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {errors.map((error, idx) => (
          <div
            key={idx}
            style={{
              fontSize: 11,
              color: error.severity === 'BLOCKER' ? '#fca5a5' : '#fcd34d',
              background: error.severity === 'BLOCKER' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(251, 191, 36, 0.15)',
              border: `1px solid ${error.severity === 'BLOCKER' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(251, 191, 36, 0.3)'}`,
              padding: '6px 8px',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 6,
            }}
          >
            <span
              style={{
                fontWeight: 700,
                fontSize: 9,
                padding: '2px 4px',
                borderRadius: 4,
                background: error.severity === 'BLOCKER' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(251, 191, 36, 0.3)',
                textTransform: 'uppercase',
                flexShrink: 0,
              }}
            >
              {error.severity}
            </span>
            <span style={{ lineHeight: 1.4 }}>{error.message}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2147483000 }}>
      <button
        ref={openButtonRef}
        type="button"
        onClick={() => setIsOpen(true)}
        data-tour="taxonomy-open"
        aria-expanded={isOpen}
        aria-controls="taxonomy-drawer-panel"
        aria-label="Open taxonomy form"
        style={{
          position: 'absolute',
          right: 18,
          top: 16,
          pointerEvents: 'auto',
          border: '1px solid rgba(148, 163, 184, 0.4)',
          background: 'rgba(2, 6, 23, 0.75)',
          color: '#e2e8f0',
          borderRadius: 999,
          padding: '8px 12px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
          backdropFilter: 'blur(6px)',
          boxShadow: '0 10px 30px rgba(2, 6, 23, 0.25)',
        }}
      >
        <span>Form</span>
        <span
          style={{
            padding: '1px 6px',
            borderRadius: 999,
            fontSize: 11,
            border: '1px solid rgba(56, 189, 248, 0.4)',
            color: '#7dd3fc',
          }}
        >
          {progress}%
        </span>
      </button>

      <div
        id="taxonomy-drawer-panel"
        ref={panelRef}
        role="dialog"
        aria-modal="false"
        aria-label="Taxonomy form panel"
        style={{
          ...panelStyle,
          pointerEvents: isOpen ? 'auto' : 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          padding: 12,
          background: 'rgba(2, 6, 23, 0.72)',
          border: '1px solid rgba(148, 163, 184, 0.25)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 18px 34px rgba(2, 6, 23, 0.4)',
          transform: isOpen
            ? 'translateX(0)'
            : compactLayout
              ? 'translateY(calc(100% + 12px))'
              : 'translateX(calc(100% + 24px))',
          opacity: isOpen ? 1 : 0,
          transition: 'transform 220ms ease, opacity 220ms ease',
          overflowX: 'hidden',
          overflowY: 'auto',
          minHeight: 0,
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'thin',
        }}
      >
        <style>
          {`
            @keyframes vibrate {
              0% { transform: translate(0); }
              20% { transform: translate(-2px, 2px); }
              40% { transform: translate(-2px, -2px); }
              60% { transform: translate(2px, 2px); }
              80% { transform: translate(2px, -2px); }
              100% { transform: translate(0); }
            }
            .vibrate-fast {
              animation: vibrate 0.3s linear infinite;
            }
            @keyframes heartbeat {
              0%, 100% { transform: scale(1); }
              15% { transform: scale(1.15); }
              30% { transform: scale(1); }
              45% { transform: scale(1.15); }
              70% { transform: scale(1); }
            }
            .mascot-pulse {
              animation: heartbeat 2s infinite ease-in-out;
            }
          `}
        </style>
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            top: -12,
            zIndex: 10,
            background: 'rgba(2, 6, 23, 0.95)',
            backdropFilter: 'blur(12px)',
            margin: '-12px -12px 12px -12px',
            padding: '12px',
            borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
          }}
        >
          <div>
            <div style={{ color: '#f8fafc', fontSize: 14, fontWeight: 800 }}>Video QA Taxonomy</div>
            <div style={{ color: '#94a3b8', fontSize: 11 }}>
              {sectionCompletion.doneCount}/{totalSections} sections complete
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {taskId && (
              <div
                className={isVibrating ? 'vibrate-fast' : ''}
                style={{
                  color: timerColor,
                  fontWeight: 800,
                  fontSize: 14,
                  background: 'rgba(15,23,42,0.8)',
                  padding: '4px 10px',
                  borderRadius: 8,
                  border: `1px solid ${timerColor}`,
                  boxShadow: `0 0 8px ${timerColor}40`,
                }}
              >
                ⏱ {formatTimer(timerSeconds)}
              </div>
            )}
            <button type="button" onClick={() => setIsOpen(false)} style={{ ...toggleBaseStyle, padding: '5px 9px' }}>
              Close
            </button>
          </div>
        </header>

        <section
          style={{
            border: '1px solid rgba(148, 163, 184, 0.25)',
            borderRadius: 12,
            background: 'rgba(15, 23, 42, 0.45)',
            padding: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <span style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 700 }}>Feather prompt/answer</span>
            <button
              type="button"
              data-tour="taxonomy-task-sync"
              onClick={onSyncFromFeather}
              style={{ ...toggleBaseStyle, padding: '5px 9px' }}
            >
              Sync
            </button>
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>Task ID</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div
              style={{
                ...inputStyle,
                minHeight: 38,
                display: 'flex',
                alignItems: 'center',
                flex: 1,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={taskId || 'No task ID synced yet.'}
            >
              {taskId || 'No task ID synced yet.'}
            </div>
            <button type="button" onClick={onCopyTaskId} style={{ ...toggleBaseStyle, padding: '8px 10px' }}>
              Copy
            </button>
          </div>
          {taskIdCopyMessage && <div style={{ fontSize: 11, color: '#86efac' }}>{taskIdCopyMessage}</div>}
          {taskIdStatusMessage && <div style={{ fontSize: 11, color: '#93c5fd' }}>{taskIdStatusMessage}</div>}
          <div style={{ fontSize: 11, color: '#94a3b8' }}>Prompt</div>
          <div
            style={{
              ...inputStyle,
              minHeight: 42,
              lineHeight: 1.45,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {featherPrompt || 'No prompt synced yet.'}
          </div>
          {promptHasTemporalTag && (
            <div
              style={{
                border: '1px solid rgba(34, 197, 94, 0.4)',
                background: 'rgba(34, 197, 94, 0.12)',
                color: '#86efac',
                borderRadius: 8,
                padding: '8px 10px',
                fontSize: 12,
                lineHeight: 1.4,
                fontWeight: 700,
              }}
            >
              Temporal counting question detected from prompt. Temporal section is auto-enabled.
            </div>
          )}
          <div style={{ fontSize: 11, color: '#94a3b8' }}>Answer</div>
          <div
            style={{
              ...inputStyle,
              minHeight: 42,
              lineHeight: 1.45,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {featherAnswer || 'No answer synced yet.'}
          </div>
          {featherQaMessage && <div style={{ fontSize: 11, color: '#93c5fd' }}>{featherQaMessage}</div>}
        </section>

        <div
          aria-hidden="true"
          style={{ height: 6, borderRadius: 999, background: 'rgba(51, 65, 85, 0.65)', overflow: 'hidden' }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #38bdf8, #22d3ee)',
              transition: 'width 220ms ease',
            }}
          />
        </div>
        {allChecksPassed && (
          <div
            style={{
              border: '1px solid rgba(34, 197, 94, 0.4)',
              background: 'rgba(34, 197, 94, 0.12)',
              color: '#86efac',
              borderRadius: 8,
              padding: '8px 10px',
              fontSize: 12,
              lineHeight: 1.45,
              fontWeight: 700,
            }}
          >
            Positive linter: all validation checks passed.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 2, paddingBottom: 40 }}>
          <Section
            title="Video validity"
            done={sectionCompletion.videoDone}
            isOpen={sectionOpen.video}
            onToggle={() => setSectionOpen((prev) => ({ ...prev, video: !prev.video }))}
            dataTourId="taxonomy-video-validity"
          >
            <ChoiceField
              id="field-realistic-scene"
              label="Does this video show a scene that could realistically happen in the real world?"
              value={draft.realisticScene}
              onChange={(value) => setDraft((prev) => ({ ...prev, realisticScene: value }))}
            />
            <FieldErrors fieldName="realisticScene" />
            {draft.realisticScene === 'no' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 600 }}>
                  If no: Please explain why this scene is not realistic.
                </label>
                <textarea
                  style={{ ...inputStyle, minHeight: 96, resize: 'vertical' }}
                  placeholder="Add your explanation..."
                  value={draft.realisticSceneJustification}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, realisticSceneJustification: event.target.value }))
                  }
                />
                <FieldErrors fieldName="realisticSceneJustification" />
                {!sectionCompletion.realisticNoRequiresTaggedEvent && (
                  <div
                    style={{
                      border: '1px solid rgba(251, 191, 36, 0.4)',
                      background: 'rgba(251, 191, 36, 0.12)',
                      color: '#fde68a',
                      borderRadius: 8,
                      padding: '8px 10px',
                      fontSize: 12,
                      lineHeight: 1.45,
                    }}
                  >
                    Linter warning: for <strong>non-realistic</strong> videos, add issue evidence in{' '}
                    <strong>Event Tagger</strong>.
                  </div>
                )}
                <div
                  style={{
                    border: '1px solid rgba(96, 165, 250, 0.35)',
                    background: 'rgba(59, 130, 246, 0.12)',
                    color: '#bfdbfe',
                    borderRadius: 8,
                    padding: '8px 10px',
                    fontSize: 12,
                    lineHeight: 1.45,
                  }}
                >
                  Early-stop rule: once video is marked <strong>non-realistic</strong>, complete justification + event
                  tags and the task ends here (other sections are locked).
                </div>
              </div>
            )}
            {draft.realisticScene !== 'no' && (
              <>
                <ChoiceField
                  id="field-is-360"
                  label="Is the generated video 360°?"
                  value={draft.is360}
                  onChange={(value) => setDraft((prev) => ({ ...prev, is360: value }))}
                />
                <FieldErrors fieldName="is360" />
              </>
            )}
            {draft.realisticScene !== 'no' && draft.is360 === 'no' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 600 }}>
                  If no: Please explain why the video is not 360°.
                </label>
                <textarea
                  ref={firstInputRef}
                  style={{ ...inputStyle, minHeight: 96, resize: 'vertical' }}
                  placeholder='Example: "It is not a 360° video because there is a break in spatial continuity..."'
                  value={draft.is360Justification}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, is360Justification: event.target.value }))
                  }
                />
                <FieldErrors fieldName="is360Justification" />
                <div style={{ fontSize: 11, color: '#94a3b8' }}>
                  Length: {sectionCompletion.is360JustificationLength} / 230-600 characters (including spaces).
                </div>
                {!sectionCompletion.is360JustificationLengthOk && (
                  <div
                    style={{
                      border: '1px solid rgba(251, 191, 36, 0.4)',
                      background: 'rgba(251, 191, 36, 0.12)',
                      color: '#fde68a',
                      borderRadius: 8,
                      padding: '8px 10px',
                      fontSize: 12,
                      lineHeight: 1.45,
                    }}
                  >
                    Linter warning: this justification must be between <strong>230</strong> and <strong>600</strong>{' '}
                    characters (including spaces).
                  </div>
                )}
              </div>
            )}
          </Section>

          <Section
            title="Question validity"
            done={sectionCompletion.questionDone}
            isOpen={sectionOpen.question}
            onToggle={() => setSectionOpen((prev) => ({ ...prev, question: !prev.question }))}
            disabled={sectionCompletion.realismStopsWorkflow}
            dataTourId="taxonomy-question-validity"
          >
            <ChoiceField
              id="field-question-valid"
              label="Is the question valid (i.e., can a human reasonably answer it from the video)?"
              value={draft.questionValid}
              onChange={(value) => setDraft((prev) => ({ ...prev, questionValid: value }))}
            />
            <FieldErrors fieldName="questionValid" />
            {draft.questionValid === 'no' && (
              <>
                <label style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 600 }}>
                  If no: Please explain why the question is not answerable.
                </label>
                <textarea
                  style={{ ...inputStyle, minHeight: 96, resize: 'vertical' }}
                  placeholder="Add your explanation..."
                  value={draft.questionInvalidJustification}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, questionInvalidJustification: event.target.value }))
                  }
                />
                <FieldErrors fieldName="questionInvalidJustification" />
                <label style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 600 }}>
                  If no: please fix the question so that it is valid.
                </label>
                <textarea
                  style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }}
                  placeholder="Write a valid replacement question..."
                  value={draft.questionFixSuggestion}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, questionFixSuggestion: event.target.value }))
                  }
                />
                {sectionCompletion.promptHasTemporalTag && !sectionCompletion.temporalFixLintOk && (
                  <div
                    style={{
                      border: '1px solid rgba(251, 191, 36, 0.4)',
                      background: 'rgba(251, 191, 36, 0.12)',
                      color: '#fde68a',
                      borderRadius: 8,
                      padding: '8px 10px',
                      fontSize: 12,
                      lineHeight: 1.45,
                    }}
                  >
                    Linter warning: because the original prompt ends with <strong>(temporal counting question)</strong>,
                    this fix suggestion must also end with <strong>(temporal counting question)</strong>.
                  </div>
                )}
                {!sectionCompletion.singleQuestionLintOk && (
                  <div
                    style={{
                      border: '1px solid rgba(251, 191, 36, 0.4)',
                      background: 'rgba(251, 191, 36, 0.12)',
                      color: '#fde68a',
                      borderRadius: 8,
                      padding: '8px 10px',
                      fontSize: 12,
                      lineHeight: 1.45,
                    }}
                  >
                    Linter warning: the fix suggestion must ask only <strong>one</strong> question, so it should not
                    contain the word <strong>and</strong>.
                  </div>
                )}
                {!sectionCompletion.temporalFixHasMinEvents && (
                  <div
                    style={{
                      border: '1px solid rgba(251, 191, 36, 0.4)',
                      background: 'rgba(251, 191, 36, 0.12)',
                      color: '#fde68a',
                      borderRadius: 8,
                      padding: '8px 10px',
                      fontSize: 12,
                      lineHeight: 1.45,
                    }}
                  >
                    Linter warning: if the fix suggestion is a <strong>temporal counting question</strong>, add at
                    least <strong>2 events</strong> in the temporal section.
                  </div>
                )}
              </>
            )}
            {!sectionCompletion.invalidQaRequiresTaggedEvent && (
              <div
                style={{
                  border: '1px solid rgba(251, 191, 36, 0.4)',
                  background: 'rgba(251, 191, 36, 0.12)',
                  color: '#fde68a',
                  borderRadius: 8,
                  padding: '8px 10px',
                  fontSize: 12,
                  lineHeight: 1.45,
                }}
              >
                Linter warning: if question or answer is <strong>NOT valid</strong>, add evidence tags in{' '}
                <strong>Event Tagger</strong>.
              </div>
            )}
          </Section>

          <Section
            title="Answer validity"
            done={sectionCompletion.answerDone}
            isOpen={sectionOpen.answer}
            onToggle={() => setSectionOpen((prev) => ({ ...prev, answer: !prev.answer }))}
            disabled={sectionCompletion.realismStopsWorkflow}
            dataTourId="taxonomy-answer-validity"
          >
            <ChoiceField
              id="field-answer-valid"
              label="Is the answer valid (i.e., does it correctly match the video)?"
              value={draft.answerValid}
              onChange={(value) => setDraft((prev) => ({ ...prev, answerValid: value }))}
            />
            {!sectionCompletion.questionNoRequiresAnswerNo && (
              <div
                style={{
                  border: '1px solid rgba(251, 191, 36, 0.4)',
                  background: 'rgba(251, 191, 36, 0.12)',
                  color: '#fde68a',
                  borderRadius: 8,
                  padding: '8px 10px',
                  fontSize: 12,
                  lineHeight: 1.45,
                }}
              >
                Linter warning: if <strong>question valid</strong> is <strong>NO</strong>, then{' '}
                <strong>answer valid</strong> must also be <strong>NO</strong>.
              </div>
            )}
            {draft.answerValid === 'no' && (
              <>
                <label style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 600 }}>
                  If no: Please explain what is incorrect.
                </label>
                <textarea
                  style={{ ...inputStyle, minHeight: 96, resize: 'vertical' }}
                  placeholder="Add your explanation..."
                  value={draft.answerInvalidJustification}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, answerInvalidJustification: event.target.value }))
                  }
                />
                <FieldErrors fieldName="answerInvalidJustification" />
                <label style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 600 }}>
                  If no: please fix the answer so that it is valid.
                </label>
                <textarea
                  style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }}
                  placeholder="Write the corrected answer..."
                  value={draft.answerFixSuggestion}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, answerFixSuggestion: event.target.value }))
                  }
                />
              </>
            )}
          </Section>

          <Section
            title="Temporal counting"
            done={sectionCompletion.temporalDone}
            isOpen={sectionOpen.temporal}
            onToggle={() => setSectionOpen((prev) => ({ ...prev, temporal: !prev.temporal }))}
            disabled={sectionCompletion.realismStopsWorkflow}
            dataTourId="taxonomy-temporal-counting"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label htmlFor="field-temporal-counting" style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 600 }}>
                Is this a temporal counting question?
              </label>
              <div id="field-temporal-counting" role="group" aria-label="Is this a temporal counting question?" style={{ display: 'flex', gap: 8 }}>
                {(['yes', 'no'] as const).map((option) => {
                  const selected = draft.isTemporalCounting === option
                  const disabled = option !== forcedTemporalChoice
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        if (disabled) return
                        setDraft((prev) => ({ ...prev, isTemporalCounting: option }))
                      }}
                      disabled={disabled}
                      aria-pressed={selected}
                      style={{
                        ...toggleBaseStyle,
                        background: selected ? 'rgba(59, 130, 246, 0.25)' : toggleBaseStyle.background,
                        border: selected ? '1px solid rgba(96, 165, 250, 0.65)' : toggleBaseStyle.border,
                        color: selected ? '#bfdbfe' : '#cbd5e1',
                        opacity: disabled ? 0.45 : 1,
                        cursor: disabled ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {option.toUpperCase()}
                    </button>
                  )
                })}
              </div>
              <FieldErrors fieldName="isTemporalCounting" />
            </div>
            {!sectionCompletion.temporalPromptRequiresYes && (
              <div
                style={{
                  border: '1px solid rgba(251, 191, 36, 0.4)',
                  background: 'rgba(251, 191, 36, 0.12)',
                  color: '#fde68a',
                  borderRadius: 8,
                  padding: '8px 10px',
                  fontSize: 12,
                  lineHeight: 1.45,
                }}
              >
                Linter warning: the prompt ends with <strong>(temporal counting question)</strong>, so this field
                must be <strong>YES</strong>.
              </div>
            )}
            {draft.isTemporalCounting === 'yes' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>
                    Events (seconds from Event Tagger start time)
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" onClick={copyAllTimestamps} style={toggleBaseStyle}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
                          <rect x="4" y="4" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
                        </svg>
                        {copiedAllEvents ? 'Copied' : 'Copy all'}
                      </span>
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>
                  Manual input is disabled. Add events in <strong>Event Tagger</strong>; each temporal event uses the
                  tag <strong>start time</strong>.
                </div>
                {draft.temporalCountingEvents.length === 0 && (
                  <div
                    style={{
                      border: '1px solid rgba(251, 191, 36, 0.4)',
                      background: 'rgba(251, 191, 36, 0.12)',
                      color: '#fde68a',
                      borderRadius: 8,
                      padding: '8px 10px',
                      fontSize: 12,
                      lineHeight: 1.45,
                    }}
                  >
                    No tag events found yet. Create events in <strong>Event Tagger</strong> to populate this list.
                  </div>
                )}
                {draft.temporalCountingEvents.map((event, index) => (
                  <div
                    key={event.id}
                    style={{ display: 'grid', gridTemplateColumns: '1fr 120px auto', gap: 8, alignItems: 'center' }}
                  >
                    <label style={{ fontSize: 12, color: '#cbd5e1' }}>Event {index + 1}</label>
                    <div
                      style={{
                        ...inputStyle,
                        padding: '8px 10px',
                        minHeight: 38,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {event.seconds}
                    </div>
                    <button
                      type="button"
                      onClick={() => copyEventTimestamp(event.id, event.seconds)}
                      disabled={!event.seconds.trim()}
                      style={{
                        ...toggleBaseStyle,
                        padding: '8px 10px',
                        opacity: !event.seconds.trim() ? 0.5 : 1,
                        cursor: !event.seconds.trim() ? 'not-allowed' : 'pointer',
                      }}
                      title="Copy timestamp"
                      aria-label={`Copy timestamp for event ${index + 1}`}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
                          <rect x="4" y="4" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
                        </svg>
                        {copiedEventId === event.id ? 'Copied' : 'Copy'}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            padding: '16px',
            background: 'rgba(15, 23, 42, 0.45)',
            borderRadius: 12,
            border: `1px solid ${allChecksPassed ? 'rgba(56, 189, 248, 0.4)' : 'rgba(148, 163, 184, 0.2)'}`,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'right' }}>
            <span style={{ color: allChecksPassed ? '#e0f2fe' : '#94a3b8', fontSize: 14, fontWeight: 700 }}>
              {evalLoading ? 'Verifying with Prismy...' : 'Check your work with Prismy'} ✨
            </span>
            {!allChecksPassed && (
              <span style={{ color: '#64748b', fontSize: 11 }}>All taxonomy sections must be completed first</span>
            )}
            {evalError && (
              <span style={{ color: '#f87171', fontSize: 11 }}>Error: {evalError}</span>
            )}
            {evalResult && (
              <span style={{ color: evalResult.passed ? '#4ade80' : '#fbbf24', fontSize: 12, fontWeight: 600 }}>
                {evalResult.passed ? '✅' : '⚠️'} {evalResult.summary}
              </span>
            )}
          </div>
          <button
            type="button"
            className={(allChecksPassed && !isBlocked && !evalLoading) ? 'mascot-pulse' : ''}
            onClick={() => runEvaluation(draft, taskId)}
            disabled={!allChecksPassed || isBlocked || evalLoading}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: (!allChecksPassed || isBlocked || evalLoading) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
            title={!allChecksPassed ? 'Complete all sections before checking.' : 'Check with AI'}
          >
            <img
              src="/Prismy.png"
              alt="Prismy Mascot"
              style={{ width: 112, height: 112, filter: 'drop-shadow(0px 0px 8px rgba(56, 189, 248, 0.5))' }}
            />
          </button>
        </div>

        <section
          style={{
            border: '1px solid rgba(148, 163, 184, 0.25)',
            borderRadius: 12,
            background: 'rgba(15, 23, 42, 0.45)',
            padding: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => { void handleSubmitChecks() }}
              disabled={!allChecksPassed}
              style={{
                ...toggleBaseStyle,
                padding: '8px 12px',
                borderColor: allChecksPassed ? 'rgba(34, 197, 94, 0.45)' : 'rgba(148, 163, 184, 0.3)',
                color: allChecksPassed ? '#86efac' : '#94a3b8',
                opacity: allChecksPassed ? 1 : 0.65,
                cursor: allChecksPassed ? 'pointer' : 'not-allowed',
              }}
            >
              Submit
            </button>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>
              Enabled only when all checks are completed.
            </span>
          </div>
          {submitFeedback && (
            <div
              style={{
                border: submitFeedback.startsWith('Success')
                  ? '1px solid rgba(34, 197, 94, 0.4)'
                  : '1px solid rgba(251, 191, 36, 0.4)',
                background: submitFeedback.startsWith('Success')
                  ? 'rgba(34, 197, 94, 0.12)'
                  : 'rgba(251, 191, 36, 0.12)',
                color: submitFeedback.startsWith('Success') ? '#86efac' : '#fde68a',
                borderRadius: 8,
                padding: '8px 10px',
                fontSize: 12,
                lineHeight: 1.45,
              }}
            >
              {submitFeedback}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
