import { useEffect } from 'react'
import { currentStep, type PlayerState } from '../../engine/playerReducer'
import { audioContext, scheduleCountdown } from './audio'

/**
 * 3-2-1-go beeps for the running timed step; rescheduled when endsAt moves (pause, +15s, skip,
 * start now). A set with a lead-in (needsSetup) also counts down its end, so "go" marks the start
 * of the hold.
 */
export function useCues(state: PlayerState, enabled: boolean): void {
  const { status, index, endsAt, stepMs } = state
  const step = currentStep(state)
  const leadIn = step?.kind === 'work' && step.needsSetup === true
  useEffect(() => {
    const ctx = audioContext()
    if (!enabled || !ctx || status !== 'running' || endsAt === null) return
    const now = Date.now()
    const cancels = [scheduleCountdown(ctx, endsAt, now)]
    const holdStarts = endsAt - stepMs
    if (leadIn && holdStarts > now) cancels.push(scheduleCountdown(ctx, holdStarts, now))
    return () => cancels.forEach((cancel) => cancel())
  }, [enabled, status, index, endsAt, stepMs, leadIn])
}
