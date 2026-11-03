import { db, DEFAULT_SETTINGS } from './db'
import { generateDemoSessions } from './demoSessions'
import { DEMO_WORKOUTS } from './demoWorkouts'
import type { Exercise } from './types'

/**
 * First visit: load exercises, ready-made workouts, demo sessions and default settings.
 * Exercises are reloaded whenever the bundled list changes (e.g. after a re-import): a different
 * count, or a stored copy that predates the needsSetup flag.
 */
export async function ensureSeeded(now = new Date()): Promise<void> {
  // Dynamic import keeps the ~380 KB exercise list out of the main bundle.
  const { default: exercises } = await import('./exercises.json')

  await db.transaction('rw', [db.exercises, db.workouts, db.sessions, db.settings], async () => {
    const flagged = (exercises as Exercise[]).filter((e) => e.needsSetup).map((e) => e.id)
    const stale =
      (await db.exercises.count()) !== exercises.length ||
      (await db.exercises.bulkGet(flagged)).some((e) => !e?.needsSetup)
    if (stale) {
      await db.exercises.clear()
      await db.exercises.bulkPut(exercises as Exercise[])
    }
    if ((await db.workouts.count()) === 0) {
      await db.workouts.bulkPut(DEMO_WORKOUTS)
      await db.sessions.bulkPut(generateDemoSessions(DEMO_WORKOUTS, now))
    }
    if (!(await db.settings.get('settings'))) await db.settings.put(DEFAULT_SETTINGS)
  })
}

/** Wipe everything and seed again (Settings → Reset demo data, Day 6). */
export async function resetDemoData(now = new Date()): Promise<void> {
  await db.transaction('rw', [db.exercises, db.workouts, db.sessions, db.settings], async () => {
    await Promise.all([db.workouts.clear(), db.sessions.clear(), db.settings.clear()])
  })
  await ensureSeeded(now)
}
