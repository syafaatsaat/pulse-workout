import { useState } from 'react'
import { Link } from 'react-router'
import { Ring } from '../../components/Ring'
import { SessionBar } from '../../components/SessionBar'
import { db, DEFAULT_SETTINGS } from '../../data/db'
import { useLiveQuery } from '../../data/useLiveQuery'
import type { Workout } from '../../data/types'
import { compile, estimateMs, moveCount } from '../../engine/compile'
import { weekProgress } from '../../engine/stats'
import { useStartWorkout } from '../player/useStartWorkout'
import { equipmentLabel, shortBlockLabels, upNextWorkout, weekDays } from './today'
import styles from './TodayPage.module.css'

const SHOWN_QUICK = 3

const dateFmt = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })
const dayFmt = new Intl.DateTimeFormat('en-GB', { weekday: 'long' })
const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

const minutes = (w: Workout) => Math.max(1, Math.round(estimateMs(compile(w)) / 60_000))

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

export function TodayPage() {
  // Read once per visit.
  const [now] = useState(() => Date.now())
  const data = useLiveQuery(load)
  const start = useStartWorkout()
  const [allQuick, setAllQuick] = useState(false)

  const header = (done: number, goal: number) => (
    <header className={styles.header}>
      <div className={styles.titles}>
        <span className="eyebrow">{dateFmt.format(now)}</span>
        <h1 className="page-title">Today</h1>
      </div>
      <div className={styles.goal} role="img" aria-label={`Weekly goal: ${done} of ${goal} sessions`}>
        <div className={styles.goalText}>
          <span className="eyebrow">Week</span>
          <span className={styles.goalValue}>
            {done} of {goal}
          </span>
        </div>
        <Ring value={done} max={goal} size={40} />
      </div>
    </header>
  )

  if (!data) return header(0, DEFAULT_SETTINGS.weeklyGoal)

  const { workouts, sessions, goal, exercises } = data
  const done = weekProgress(sessions, now)
  const days = weekDays(sessions, now)
  const next = upNextWorkout(workouts, sessions)
  const others = workouts.filter((w) => !w.adHoc && w.id !== next?.id)
  const quick = allQuick ? others : others.slice(0, SHOWN_QUICK)
  const unfinished = sessions
    .filter((s) => s.endedAt === undefined && s.sets.length > 0)
    .sort((a, b) => b.startedAt - a.startedAt)[0]
  const unfinishedWorkout = unfinished && workouts.find((w) => w.id === unfinished.workoutId)

  const weekLabel = days
    .filter((d) => d.done)
    .map((d) => dayFmt.format(d.date))
    .join(', ')

  return (
    <>
      {header(done, goal)}

      <div
        className={styles.week}
        role="img"
        aria-label={`This week: ${weekLabel ? `${weekLabel} done` : 'nothing done yet'}; today ${dayFmt.format(now)}`}
      >
        {days.map((d, i) => (
          <div key={i} className={styles.weekDay}>
            <span className={styles.dow}>{DOW[i]}</span>
            <span
              className={styles.date}
              data-done={d.done || undefined}
              data-today={d.today || undefined}
              data-future={d.future || undefined}
            >
              {d.date.getDate()}
            </span>
          </div>
        ))}
      </div>

      {unfinished && unfinishedWorkout && (
        <section className={styles.resume} aria-labelledby="today-resume">
          <div className={styles.resumeText}>
            <span className="eyebrow">
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
      )}

      {next && (
        <section className={styles.next} aria-labelledby="today-next">
          <span className="eyebrow">
            Up next · Session {String(done + 1).padStart(2, '0')} · {next.focus}
          </span>
          <h2 id="today-next" className={styles.nextName}>
            {next.name}
          </h2>
          <ul className={styles.pills} aria-label="About this session">
            <li>{moveCount(next)} moves</li>
            <li>{minutes(next)} min</li>
            <li>{equipmentLabel(next, exercises)}</li>
          </ul>
          <div className={styles.shape}>
            <SessionBar steps={compile(next)} current={-1} variant="preview" label="Session shape" />
            <div className={styles.blockLabels} aria-hidden="true">
              {shortBlockLabels(next).map((b) => (
                <span key={b.blockId} style={{ flexGrow: b.weight }}>
                  {b.label}
                </span>
              ))}
            </div>
          </div>
          <button type="button" className={styles.start} onClick={() => void start(next.id)}>
            Start session
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="13 6 19 12 13 18" />
            </svg>
          </button>
        </section>
      )}

      {others.length > 0 && (
        <section aria-labelledby="today-quick">
          <div className={styles.quickHead}>
            <h2 id="today-quick" className="eyebrow">
              Quick start
            </h2>
            {others.length > SHOWN_QUICK && (
              <button
                type="button"
                className={styles.seeAll}
                aria-expanded={allQuick}
                aria-controls="today-quick-list"
                onClick={() => setAllQuick((v) => !v)}
              >
                {allQuick ? 'Show less' : 'See all'}
              </button>
            )}
          </div>
          <ul className={styles.quick} id="today-quick-list">
            {quick.map((w) => (
              <li key={w.id}>
                <button
                  type="button"
                  className={styles.quickCard}
                  aria-label={`Start ${w.name}, ${moveCount(w)} moves, ${minutes(w)} minutes`}
                  onClick={() => void start(w.id)}
                >
                  <span className={styles.quickMeta}>{moveCount(w)} moves</span>
                  <span className={styles.quickName}>{w.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
