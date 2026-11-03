import { useState } from 'react'
import { Link } from 'react-router'
import { useMediaQuery } from '../../app/useMediaQuery'
import { Ring } from '../../components/Ring'
import { Rings } from '../../components/Rings'
import { SessionBar } from '../../components/SessionBar'
import { db, DEFAULT_SETTINGS } from '../../data/db'
import { useLiveQuery } from '../../data/useLiveQuery'
import type { Exercise, Workout } from '../../data/types'
import { compile, estimateMs, moveCount } from '../../engine/compile'
import { personalBests, weekProgress } from '../../engine/stats'
import { timer } from '../player/format'
import { useStartWorkout } from '../player/useStartWorkout'
import { equipmentLabel, moveDoses, upNextWorkout, weekDays } from './today'
import styles from './TodayPage.module.css'

const SHOWN_QUICK = 2
const SHOWN_MOVES = 5
const SHOWN_BESTS = 3

const dayFmt = new Intl.DateTimeFormat('en-GB', { weekday: 'long' })
const monthFmt = new Intl.DateTimeFormat('en-GB', { month: 'long' })
/** "Monday, 2 November" */
const dateLine = (d: Date) => `${dayFmt.format(d)}, ${d.getDate()} ${monthFmt.format(d)}`
const greeting = (d: Date) =>
  d.getHours() < 12 ? 'Good morning' : d.getHours() < 18 ? 'Good afternoon' : 'Good evening'
const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const DOW_LONG = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Lead-ins only count for moves flagged needsSetup, so the estimate needs the exercises.
const minutes = (w: Workout, exercises: Map<string, Exercise>) =>
  Math.max(1, Math.round(estimateMs(compile(w, exercises)) / 60_000))

async function load() {
  const [workouts, sessions, settings, exercises] = await Promise.all([
    db.workouts.toArray(),
    db.sessions.toArray(),
    db.settings.get('settings'),
    db.exercises.toArray(),
  ])
  return {
    workouts,
    sessions,
    goal: (settings ?? DEFAULT_SETTINGS).weeklyGoal,
    exercises: new Map(exercises.map((e) => [e.id, e])),
  }
}

/** G-Today on phones, GD-Today (hero | aside) at 1024px and up. */
export function TodayPage() {
  // Read once per visit.
  const [now] = useState(() => Date.now())
  const data = useLiveQuery(load)
  const start = useStartWorkout()
  const desktop = useMediaQuery('(min-width: 1024px)')
  const today = new Date(now)

  const goalLabel = (done: number, goal: number) => `Weekly goal: ${done} of ${goal} sessions`
  const header = (done: number, goal: number) => (
    <header className={styles.header}>
      <div className={styles.titles}>
        <span className={styles.date}>{dateLine(today)}</span>
        <h1 className={styles.greeting}>{greeting(today)}</h1>
      </div>
      {desktop ? (
        <div className={styles.goalPill} role="img" aria-label={goalLabel(done, goal)}>
          <Ring value={done} max={goal} size={40} stroke={3} />
          <span>
            {done} of {goal} this week
          </span>
        </div>
      ) : (
        <div className={styles.goalRing} role="img" aria-label={goalLabel(done, goal)}>
          <Ring value={done} max={goal} size={52} stroke={3} />
          <span aria-hidden="true">
            {done}/{goal}
          </span>
        </div>
      )}
    </header>
  )

  if (!data) return header(0, DEFAULT_SETTINGS.weeklyGoal)

  const { workouts, sessions, goal, exercises } = data
  const done = weekProgress(sessions, now)
  const days = weekDays(sessions, now)
  const next = upNextWorkout(workouts, sessions)
  const others = workouts.filter((w) => !w.adHoc && w.id !== next?.id)
  const unfinished = sessions
    .filter((s) => s.endedAt === undefined && s.sets.length > 0)
    .sort((a, b) => b.startedAt - a.startedAt)[0]
  const unfinishedWorkout = unfinished && workouts.find((w) => w.id === unfinished.workoutId)

  const weekLabel = days
    .filter((d) => d.done)
    .map((d) => dayFmt.format(d.date))
    .join(', ')

  const week = (
    <div
      className={styles.week}
      role="img"
      aria-label={`This week: ${weekLabel ? `${weekLabel} done` : 'nothing done yet'}; today ${dayFmt.format(now)}`}
    >
      {days.map((d, i) => (
        <div key={i} className={styles.weekDay} data-today={d.today || undefined}>
          <span className={styles.dow}>{(desktop ? DOW_LONG : DOW)[i]}</span>
          <span className={styles.dot} data-done={d.done || undefined} data-today={d.today || undefined} />
        </div>
      ))}
    </div>
  )

  // Not in the refs: an unfinished session gets a plain surface card above the hero.
  const resume = unfinished && unfinishedWorkout && (
    <section className={styles.resume} aria-labelledby="today-resume">
      <div className={styles.resumeText}>
        <span className={styles.resumeMeta}>
          Unfinished · {unfinished.sets.length} {unfinished.sets.length === 1 ? 'set' : 'sets'} done
        </span>
        <h2 id="today-resume" className={styles.resumeName}>
          {unfinishedWorkout.name}
        </h2>
      </div>
      <Link to={`/session/${unfinished.id}`} className={styles.resumeButton}>
        Resume
      </Link>
    </section>
  )

  const doses = next ? moveDoses(next) : []
  const nextCard = next && (
    <section className={styles.hero} aria-labelledby="today-next">
      <Rings
        className={styles.heroRings}
        radii={desktop ? [50, 100, 150, 200, 250, 300, 318] : [30, 60, 90, 120, 150, 178]}
        size={desktop ? 640 : 360}
        startOpacity={desktop ? 0.5 : 0.55}
        step={desktop ? 0.07 : 0.08}
        color="var(--accent)"
      />
      <span className={styles.heroLabel}>Up next</span>
      <h2 id="today-next" className={styles.heroName}>
        {next.name}
      </h2>
      <span className={styles.heroMeta}>
        {moveCount(next)} moves · {minutes(next, exercises)} min · {equipmentLabel(next, exercises)}
      </span>
      <div className={styles.shape}>
        <SessionBar steps={compile(next)} current={-1} variant="preview" label="Session shape" />
      </div>
      {desktop && (
        <ul className={styles.moves} aria-label="Moves">
          {doses.slice(0, doses.length > SHOWN_MOVES + 1 ? SHOWN_MOVES : SHOWN_MOVES + 1).map((m, i) => (
            <li key={i}>
              <span>{exercises.get(m.exerciseId)?.name ?? m.exerciseId}</span>
              <span className={styles.moveDose}>{m.dose}</span>
            </li>
          ))}
          {doses.length > SHOWN_MOVES + 1 && (
            <li>
              <span>+{doses.length - SHOWN_MOVES} more</span>
            </li>
          )}
        </ul>
      )}
      <button type="button" className={styles.start} onClick={() => void start(next.id)}>
        Start session
        <span className={styles.startArrow} aria-hidden="true">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="13 6 19 12 13 18" />
          </svg>
        </span>
      </button>
    </section>
  )

  if (desktop) {
    const bests = personalBests(sessions).slice(0, SHOWN_BESTS)
    return (
      <div className={styles.page}>
        {header(done, goal)}
        {resume}
        <div className={styles.desk}>
          {nextCard}
          <aside className={styles.aside} aria-label="This week, quick start and recent bests">
            <section className={styles.card} aria-labelledby="today-week">
              <h2 id="today-week" className={styles.cardTitle}>
                This week
              </h2>
              {week}
            </section>
            {others.length > 0 && (
              <section className={styles.listCard} aria-labelledby="today-quick">
                <h2 id="today-quick" className={styles.listTitle}>
                  Quick start
                </h2>
                <ul>
                  {others.slice(0, 3).map((w) => (
                    <li key={w.id}>
                      <button type="button" className={styles.row} onClick={() => void start(w.id)}>
                        {/* Named by its visible text (WCAG 2.5.3), with "Start" for context. */}
                        <span className={styles.rowName}>
                          <span className="visually-hidden">Start </span>
                          {w.name}
                        </span>
                        <span className={styles.timeChip}>{minutes(w, exercises)} min</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {bests.length > 0 && (
              <section className={styles.listCard} aria-labelledby="today-bests">
                <h2 id="today-bests" className={styles.listTitle}>
                  Recent bests
                </h2>
                <ul>
                  {bests.map((b) => (
                    <li key={b.exerciseId}>
                      <Link to={`/library/${b.exerciseId}`} className={styles.row} data-best>
                        <span className={styles.rowName}>
                          {exercises.get(b.exerciseId)?.name ?? b.exerciseId}
                        </span>
                        <span className={styles.rowValue}>
                          {b.best.measure === 'reps' ? `${b.best.value} reps` : timer(b.best.value * 1000)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </aside>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      {header(done, goal)}
      {week}
      {resume}
      {nextCard}
      {others.length > 0 && (
        <section aria-labelledby="today-quick">
          <div className={styles.quickHead}>
            <h2 id="today-quick" className={styles.quickTitle}>
              Quick start
            </h2>
            <Link to="/library" className={styles.seeAll}>
              See all
            </Link>
          </div>
          <ul className={styles.quick}>
            {others.slice(0, SHOWN_QUICK).map((w) => (
              <li key={w.id}>
                <button type="button" className={styles.quickCard} onClick={() => void start(w.id)}>
                  <Rings
                    className={styles.quickRings}
                    radii={[24, 40, 56]}
                    size={140}
                    startOpacity={0.07}
                    step={0.0175}
                    color="var(--ring)"
                  />
                  {/* Named by its visible text (WCAG 2.5.3): name first, the chip is moved on top in CSS. */}
                  <span className={styles.quickText}>
                    <span className={styles.quickName}>
                      <span className="visually-hidden">Start </span>
                      {w.name}
                    </span>
                    <span className={styles.quickMeta}>{moveCount(w)} moves</span>
                  </span>
                  <span className={styles.timeChip}>{minutes(w, exercises)} min</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
