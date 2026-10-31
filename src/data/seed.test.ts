import 'fake-indexeddb/auto'
import { db } from './db'
import { startOfWeek } from '../engine/stats'
import { generateDemoSessions } from './demoSessions'
import { DEMO_WORKOUTS } from './demoWorkouts'
import exercises from './exercises.json'
import { ensureSeeded, resetDemoData } from './seed'

const NOW = new Date(2026, 9, 29, 12, 0) // Thursday 29 Oct 2026, as in the mock-ups
const exerciseIds = new Set(exercises.map((e) => e.id))

afterEach(async () => {
  await db.delete()
  await db.open()
})

describe('demo workouts', () => {
  test('are the 5 ready-made workouts and only use imported exercises', () => {
    expect(DEMO_WORKOUTS.map((w) => w.name)).toEqual([
      'Push & Core',
      '10-min core',
      '20-min full body',
      'Mobility reset',
      'Legs & glutes',
    ])
    const used = DEMO_WORKOUTS.flatMap((w) => w.blocks.flatMap((b) => b.items.map((i) => i.exerciseId)))
    expect(used.filter((id) => !exerciseIds.has(id))).toEqual([])
  })
})

describe('generateDemoSessions', () => {
  const sessions = generateDemoSessions(DEMO_WORKOUTS, NOW)

  test('is deterministic', () => {
    expect(generateDemoSessions(DEMO_WORKOUTS, NOW)).toEqual(sessions)
  })

  test('covers about 6 weeks, all before today', () => {
    const today = new Date(2026, 9, 29).getTime()
    const sixWeeksAgo = startOfWeek(NOW).getTime() - 6 * 7 * 24 * 3600 * 1000
    expect(sessions.length).toBeGreaterThanOrEqual(18)
    expect(sessions.every((s) => s.startedAt >= sixWeeksAgo && s.endedAt! < today)).toBe(true)
  })

  test('this week has Monday and Wednesday done', () => {
    const days = sessions
      .filter((s) => s.startedAt >= startOfWeek(NOW).getTime())
      .map((s) => new Date(s.startedAt).getDay())
    expect(days).toEqual([1, 3])
  })

  test('sets have reps or seconds and increasing timestamps', () => {
    for (const s of sessions) {
      expect(s.sets.length).toBeGreaterThan(0)
      for (const set of s.sets) expect((set.reps ?? set.seconds ?? 0) > 0).toBe(true)
      const times = s.sets.map((x) => x.completedAt)
      expect(times).toEqual([...times].sort((a, b) => a - b))
    }
  })
})

describe('ensureSeeded', () => {
  test('fills every table once', async () => {
    await ensureSeeded(NOW)
    await ensureSeeded(NOW)
    expect(await db.exercises.count()).toBe(exercises.length)
    expect(await db.workouts.count()).toBe(5)
    expect(await db.sessions.count()).toBe(generateDemoSessions(DEMO_WORKOUTS, NOW).length)
    expect((await db.settings.get('settings'))?.weeklyGoal).toBe(4)
  })

  test('does not overwrite user data on later visits', async () => {
    await ensureSeeded(NOW)
    await db.sessions.clear()
    await ensureSeeded(NOW)
    expect(await db.sessions.count()).toBe(0)
  })

  test('resetDemoData restores the demo', async () => {
    await ensureSeeded(NOW)
    await db.sessions.clear()
    await resetDemoData(NOW)
    expect(await db.sessions.count()).toBeGreaterThan(0)
  })
})

test('demo sessions log exactly the work steps of the compiled workout', async () => {
  const { compile } = await import('../engine/compile')
  for (const s of generateDemoSessions(DEMO_WORKOUTS, NOW)) {
    const work = compile(DEMO_WORKOUTS.find((w) => w.id === s.workoutId)!).filter((x) => x.kind === 'work')
    expect(s.sets.map((x) => `${x.exerciseId}:${x.blockId}:${x.setIndex}`)).toEqual(
      work.map((x) => `${x.exerciseId}:${x.blockId}:${x.setIndex}`),
    )
  }
})
