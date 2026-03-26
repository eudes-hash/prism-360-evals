import { useState, useEffect } from 'react'

const STORAGE_KEY = 'prism360.taskerEmail'

export interface EvalError {
  field: string
  severity: 'BLOCKER' | 'WARNING' | 'INFO'
  message: string
}

export interface EvalResult {
  passed: boolean
  summary: string
  errors: EvalError[]
  modelUsed?: string
}

export function useEvalSystem() {
  const [taskerEmail, setTaskerEmail] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<EvalResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) setTaskerEmail(stored)
  }, [])

  const saveEmail = (newEmail: string) => {
    setTaskerEmail(newEmail)
    localStorage.setItem(STORAGE_KEY, newEmail)
  }

  const clearEmail = () => {
    setTaskerEmail('')
    localStorage.removeItem(STORAGE_KEY)
  }

  const runEvaluation = async (_formData: unknown, _taskId: string): Promise<void> => {
    if (!taskerEmail.trim()) {
      setError('Please enter your Tasker email before verifying.')
      return
    }
    setLoading(true)
    setError(null)
    await new Promise((resolve) => setTimeout(resolve, 800))
    setResult({
      passed: true,
      summary: 'Offline mode: evaluation API not connected.',
      errors: [],
    })
    setLoading(false)
  }

  const clearResult = () => setResult(null)

  const submitTaskTime = async (_taskId: string, _durationSeconds: number): Promise<void> => {
    // Stubbed — no external API in web version
  }

  const isBlocked = result?.errors?.some((e) => e.severity === 'BLOCKER') ?? false

  return {
    runEvaluation,
    loading,
    result,
    error,
    clearResult,
    taskerEmail,
    saveEmail,
    clearEmail,
    isBlocked,
    submitTaskTime,
  }
}
