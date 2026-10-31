import type { LoggedSet } from '../engine/playerReducer'
import { db } from './db'
import type { SessionSet } from './types'

/**
 * crypto.randomUUID only exists in secure contexts; a phone on the dev server's LAN address
 * (plain http) doesn't have it. getRandomValues works everywhere.
 */
function newId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join(
    '',
  )
}

/** Creates the session row the player route points at. */
export async function createSession(workoutId: string, now = Date.now()): Promise<string> {
  const id = newId()
  await db.sessions.add({ id, workoutId, startedAt: now, sets: [] })
  return id
}

const toSessionSet = ({
  exerciseId,
  blockId,
  setIndex,
  reps,
  seconds,
  completedAt,
}: LoggedSet): SessionSet => ({
  exerciseId,
  blockId,
  setIndex,
  completedAt,
  ...(reps !== undefined ? { reps } : {}),
  ...(seconds !== undefined ? { seconds } : {}),
})

/** Called after every completed set so nothing is lost if the tab dies. */
export async function saveSets(sessionId: string, sets: LoggedSet[], startedAt: number): Promise<void> {
  await db.sessions.update(sessionId, { startedAt, sets: sets.map(toSessionSet) })
}

/** Marks the session done. A session with no sets is removed instead: nothing to log. */
export async function finishSession(
  sessionId: string,
  sets: LoggedSet[],
  endedAt: number,
  activeMs: number,
): Promise<'saved' | 'discarded'> {
  if (sets.length === 0) {
    await db.sessions.delete(sessionId)
    return 'discarded'
  }
  await db.sessions.update(sessionId, { endedAt, activeMs, sets: sets.map(toSessionSet) })
  return 'saved'
}
