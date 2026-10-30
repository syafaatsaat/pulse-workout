import type { Session } from '../data/types'

// Derived stats: computed from sessions, never stored. (Personal bests, streaks and the weekly
// goal arrive on Day 4.)

export interface SetValue {
  reps?: number
  seconds?: number
}

/**
 * "Last time" in the player: the best set of `exerciseId` in the most recent finished session
 * that started before `currentSessionId`.
 */
export function lastTime(
  sessions: Session[],
  exerciseId: string,
  currentSessionId?: string,
): SetValue | undefined {
  const current = sessions.find((s) => s.id === currentSessionId)
  const before = current?.startedAt ?? Infinity
  const previous = sessions
    .filter((s) => s.id !== currentSessionId && s.endedAt !== undefined && s.startedAt < before)
    .sort((a, b) => b.startedAt - a.startedAt)

  for (const s of previous) {
    const sets = s.sets.filter((x) => x.exerciseId === exerciseId)
    if (sets.length === 0) continue
    const reps = Math.max(...sets.map((x) => x.reps ?? 0))
    if (reps > 0) return { reps }
    return { seconds: Math.max(...sets.map((x) => x.seconds ?? 0)) }
  }
  return undefined
}
