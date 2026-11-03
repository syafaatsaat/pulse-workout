import type { Session, SessionSet } from '../data/types'

// Derived stats: computed from sessions, never stored. Only finished sessions count.

export interface SetValue {
  reps?: number
  seconds?: number
}

export type Measure = 'reps' | 'seconds'

export interface Best {
  measure: Measure
  value: number
}

const isFinished = (s: Session) => s.endedAt !== undefined

/** Time spent working out: the stored active time, else end minus start. */
export function activeMs(session: Session): number {
  return session.activeMs ?? Math.max(0, (session.endedAt ?? session.startedAt) - session.startedAt)
}

/** Local midnight of the Monday of the week containing `date`. */
export function startOfWeek(date: Date | number): Date {
  const t = new Date(date)
  const d = new Date(t.getFullYear(), t.getMonth(), t.getDate())
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d
}

/** Best single set: most reps if the sets are counted in reps, else the longest hold. */
export function bestOf(sets: SessionSet[]): Best | undefined {
  if (sets.length === 0) return undefined
  const reps = Math.max(...sets.map((x) => x.reps ?? 0))
  if (reps > 0) return { measure: 'reps', value: reps }
  return { measure: 'seconds', value: Math.max(...sets.map((x) => x.seconds ?? 0)) }
}

/** Best of `exerciseId` across finished sessions that started before `before`. */
function bestBefore(sessions: Session[], exerciseId: string, before: number, skipId: string) {
  const sets = sessions
    .filter((s) => isFinished(s) && s.id !== skipId && s.startedAt < before)
    .flatMap((s) => s.sets.filter((x) => x.exerciseId === exerciseId))
  return bestOf(sets)
}

const beats = (a: Best, b: Best | undefined) =>
  b !== undefined && a.measure === b.measure && a.value > b.value

/**
 * The player's "New best" moment: `set` beats the move's best from earlier sessions (`previous`) and
 * every earlier set of the move this session, so it fires once per improvement. A first attempt
 * (no previous best) is not a new best.
 */
export function isNewBest(previous: Best | undefined, earlier: SessionSet[], set: SessionSet): boolean {
  const value = bestOf([set])!
  if (!beats(value, previous)) return false
  const thisSession = bestOf(earlier.filter((x) => x.exerciseId === set.exerciseId))
  return thisSession === undefined || thisSession.measure !== value.measure || value.value > thisSession.value
}

export interface MoveResult {
  exerciseId: string
  sets: number
  best: Best
  /** Best before this session; absent the first time a move is done. */
  previous?: Best
  /** Beat a previous best. A first attempt is not a new best. */
  isNew: boolean
}

/** Per move of `session`, in the order done: its best set and whether that beat the earlier best. */
export function sessionBests(sessions: Session[], session: Session): MoveResult[] {
  const ids = [...new Set(session.sets.map((x) => x.exerciseId))]
  return ids.map((exerciseId) => {
    const sets = session.sets.filter((x) => x.exerciseId === exerciseId)
    const best = bestOf(sets)!
    const previous = bestBefore(sessions, exerciseId, session.startedAt, session.id)
    return {
      exerciseId,
      sets: sets.length,
      best,
      ...(previous ? { previous } : {}),
      isNew: beats(best, previous),
    }
  })
}

export interface PersonalBest {
  exerciseId: string
  best: Best
  /** The best it beat; absent if it has stood since the first attempt. */
  previous?: Best
  sessionId: string
  /** Start of the session that set it. */
  setAt: number
}

/** Current best per move, newest first. A tie doesn't move the date. */
export function personalBests(sessions: Session[]): PersonalBest[] {
  const bests = new Map<string, PersonalBest>()
  const ordered = sessions.filter(isFinished).sort((a, b) => a.startedAt - b.startedAt)
  for (const s of ordered) {
    for (const exerciseId of new Set(s.sets.map((x) => x.exerciseId))) {
      const best = bestOf(s.sets.filter((x) => x.exerciseId === exerciseId))!
      const current = bests.get(exerciseId)
      if (current && !beats(best, current.best)) continue
      bests.set(exerciseId, {
        exerciseId,
        best,
        ...(current ? { previous: current.best } : {}),
        sessionId: s.id,
        setAt: s.startedAt,
      })
    }
  }
  return [...bests.values()].sort((a, b) => b.setAt - a.setAt)
}

/** Finished sessions per week, keyed by the week's Monday (ms). */
function perWeek(sessions: Session[]): Map<number, number> {
  const counts = new Map<number, number>()
  for (const s of sessions.filter(isFinished)) {
    const week = startOfWeek(s.startedAt).getTime()
    counts.set(week, (counts.get(week) ?? 0) + 1)
  }
  return counts
}

/** Finished sessions so far in the week containing `now`. */
export function weekProgress(sessions: Session[], now: number): number {
  return perWeek(sessions).get(startOfWeek(now).getTime()) ?? 0
}

/**
 * Weeks in a row meeting the weekly goal, counting back from `now`. The current week counts once
 * it meets the goal; until then it doesn't break the streak.
 */
export function goalStreak(sessions: Session[], goal: number, now: number): number {
  const counts = perWeek(sessions)
  const week = startOfWeek(now)
  let weeks = 0
  if ((counts.get(week.getTime()) ?? 0) >= goal) weeks++
  for (;;) {
    week.setDate(week.getDate() - 7)
    if ((counts.get(week.getTime()) ?? 0) < goal) return weeks
    weeks++
  }
}

/**
 * Progress sparkline: the move's best as it stood at the end of each of the last `weeks` weeks
 * (Monday to Sunday, oldest first, the current week last), so the last value is the current best.
 * 0 before the move was first done.
 */
export function bestSeries(sessions: Session[], exerciseId: string, now: number, weeks = 6): number[] {
  const done = sessions.filter(isFinished)
  const end = startOfWeek(now)
  end.setDate(end.getDate() - 7 * (weeks - 1))
  return Array.from({ length: weeks }, () => {
    end.setDate(end.getDate() + 7)
    const before = end.getTime()
    const sets = done
      .filter((s) => s.startedAt < before)
      .flatMap((s) => s.sets.filter((x) => x.exerciseId === exerciseId))
    return bestOf(sets)?.value ?? 0
  })
}

export interface MonthStats {
  /** Finished sessions dated in the month. */
  sessions: number
  activeMs: number
  /** Weeks that start in the month and have started by `now`. */
  weeks: number
  /** Of those, weeks meeting the goal. */
  goalWeeks: number
  /** Sessions per week over those weeks (whole Monday–Sunday weeks). */
  avgPerWeek: number
  /** Day of month → latest finished session that day. */
  days: Map<number, string>
}

/** Log figures for `month` (0-based, as in Date) of `year`. */
export function monthStats(
  sessions: Session[],
  year: number,
  month: number,
  goal: number,
  now: number,
): MonthStats {
  const inMonth = sessions
    .filter((s) => {
      const d = new Date(s.startedAt)
      return isFinished(s) && d.getFullYear() === year && d.getMonth() === month
    })
    .sort((a, b) => a.startedAt - b.startedAt)
  const days = new Map(inMonth.map((s) => [new Date(s.startedAt).getDate(), s.id]))

  const counts = perWeek(sessions)
  const weekCounts: number[] = []
  const monday = startOfWeek(new Date(year, month, 7)) // the first Monday of the month
  while (monday.getMonth() === month && monday.getTime() <= now) {
    weekCounts.push(counts.get(monday.getTime()) ?? 0)
    monday.setDate(monday.getDate() + 7)
  }
  const total = weekCounts.reduce((sum, n) => sum + n, 0)

  return {
    sessions: inMonth.length,
    activeMs: inMonth.reduce((sum, s) => sum + activeMs(s), 0),
    weeks: weekCounts.length,
    goalWeeks: weekCounts.filter((n) => n >= goal).length,
    avgPerWeek: weekCounts.length ? total / weekCounts.length : 0,
    days,
  }
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
    .filter((s) => s.id !== currentSessionId && isFinished(s) && s.startedAt < before)
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
