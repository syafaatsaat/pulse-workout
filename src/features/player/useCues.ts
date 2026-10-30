import { useEffect } from 'react'
import type { PlayerState } from '../../engine/playerReducer'
import { audioContext, scheduleCountdown } from './audio'

/** 3-2-1-go beeps for the running timed step; rescheduled when endsAt moves (pause, +15s, skip). */
export function useCues(state: PlayerState, enabled: boolean): void {
  const { status, index, endsAt } = state
  useEffect(() => {
    const ctx = audioContext()
    if (!enabled || !ctx || status !== 'running' || endsAt === null) return
    return scheduleCountdown(ctx, endsAt, Date.now())
  }, [enabled, status, index, endsAt])
}
