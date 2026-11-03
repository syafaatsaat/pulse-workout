import { useEffect, useRef } from 'react'
import { currentStep, type PlayerState } from '../../engine/playerReducer'
import { speak, stepCue } from './voice'

/**
 * Voice cues: says the step's cue once on entering it ("Go", "Set done. Rest", "Get into
 * position") and "Set done" at the end. A hold with a lead-in also says "Go" when the hold starts
 * (or at once on "Start now"). Pausing and resuming don't repeat anything.
 */
export function useVoice(state: PlayerState, enabled: boolean): void {
  const { status, index, endsAt, stepMs } = state
  const step = currentStep(state)
  const leadIn = step?.kind === 'work' && step.needsSetup === true
  const spoken = useRef<number | null>(null)
  const saidGo = useRef<number | null>(null)

  useEffect(() => {
    if (status !== 'running' && status !== 'finished') return
    const key = status === 'finished' ? -1 : index
    if (spoken.current === key) return
    spoken.current = key
    if (enabled) speak(stepCue(status === 'finished' ? undefined : step))
  }, [enabled, status, index, step])

  useEffect(() => {
    if (!enabled || !leadIn || status !== 'running' || endsAt === null || saidGo.current === index) return
    const timeout = window.setTimeout(
      () => {
        saidGo.current = index
        speak('Go')
      },
      Math.max(0, endsAt - stepMs - Date.now()),
    )
    return () => window.clearTimeout(timeout)
  }, [enabled, leadIn, status, endsAt, stepMs, index])
}
