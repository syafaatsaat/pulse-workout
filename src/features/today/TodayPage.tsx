import { useState } from 'react'
import { Link } from 'react-router'
import { useMediaQuery } from '../../app/useMediaQuery'
import { Ring } from '../../components/Ring'
import { SessionBar } from '../../components/SessionBar'
import { db, DEFAULT_SETTINGS } from '../../data/db'
import { useLiveQuery } from '../../data/useLiveQuery'
import type { Exercise, Workout } from '../../data/types'
import { compile, estimateMs, moveCount } from '../../engine/compile'
import { personalBests, weekProgress } from '../../engine/stats'
import { blockLabels } from '../player/blockLabels'
import { clock } from '../player/format'
import { useStartWorkout } from '../player/useStartWorkout'
import { equipmentLabel, isoWeek, moveDoses, shortBlockLabels, upNextWorkout, weekDays } from './today'
import styles from './TodayPage.module.css'

const SHOWN_QUICK = 3

const dateFmt = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })
const dayFmt = new Intl.DateTimeFormat('en-GB', { weekday: 'long' })
const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const DOW_LONG = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const SHOWN_BESTS = 3

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

export function TodayPage() {
  // Read once per visit.
  const [now] = useState(() => Date.now())
  const data = useLiveQuery(load)
  const start = useStartWorkout()
  const [allQuick, setAllQuick] = useState(false)
  // DT-Today: two columns, the week strip and quick start move into an aside, plus recent bests.
  const desktop = useMediaQuery('(min-width: 1024px)')

  const header = (done: number, goal: number) => (
    <header className={styles.header}>
      <div className={styles.titles}>
        <span className="kicker">
          {dateFmt.format(now)}
          {desktop && ` · Week ${isoWeek(new Date(now))}`}
        </span>
        <h1 className="page-title">Today</h1>
      </div>
      {/* The sidebar shows the weekly goal on desktop. */}
      {!desktop && (
        <div className={styles.goal} role="img" aria-label={`Weekly goal: ${done} of ${goal} sessions`}>
          <div className={styles.goalText}>
            <span className="kicker">Week</span>
            <span className={styles.goalValue}>
              {done} of {goal}
            </span>
          </div>
          <Ring value={done} max={goal} size={40} />
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
  const quick = allQuick ? others : others.slice(0, SHOWN_QUICK)
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
        <div key={i} className={styles.weekDay}>
          <span className={styles.dow}>{(desktop ? DOW_LONG : DOW)[i]}</span>
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
  )

  const resume = unfinished && unfinishedWorkout && (
    <section className={styles.resume} aria-labelledby="today-resume">
      <div className={styles.resumeText}>
        <span className="kicker">
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

  const nextCard = next && (
    <section className={styles.next} aria-labelledby="today-next">
      <span className="kicker">
        Up next · Session {String(done + 1).padStart(2, '0')} · {next.focus}
      </span>
      <h2 id="today-next" className={styles.nextName}>
        {next.name}
      </h2>
      <ul className={styles.pills} aria-label="About this session">
        <li>{moveCount(next)} moves</li>
        <li>{minutes(next, exercises)} min</li>
        <li>{equipmentLabel(next, exercises)}</li>
      </ul>
      <div className={styles.shape}>
        <SessionBar steps={compile(next)} current={-1} variant="preview" label="Session shape" />
        <div className={styles.blockLabels} aria-hidden="true">
          {shortBlockLabels(next).map((b, i) => (
            <span key={b.blockId} style={{ flexGrow: b.weight }}>
              {desktop ? blockLabels(next)[i]!.label : b.label}
            </span>
          ))}
        </div>
      </div>
      {desktop && (
        <ol
          className={styles.moves}
          aria-label="Moves"
          // Fill down the first column, then the second (01–04 | 05–08).
          style={{ gridTemplateRows: `repeat(${Math.ceil(moveCount(next) / 2)}, auto)` }}
        >
          {moveDoses(next).map((m, i) => (
            <li key={i}>
              <span className={styles.moveNum}>{String(i + 1).padStart(2, '0')}</span>
              <span className={styles.moveName}>{exercises.get(m.exerciseId)?.name ?? m.exerciseId}</span>
              <span className={styles.moveDose}>{m.dose}</span>
            </li>
          ))}
        </ol>
      )}
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
  )

  if (desktop) {
    const bests = personalBests(sessions).slice(0, SHOWN_BESTS)
    return (
      <>
        {header(done, goal)}
        <div className={styles.desk}>
          <div className={styles.deskMain}>
            {resume}
            {nextCard}
          </div>
          <aside className={styles.deskSide} aria-label="This week, quick start and recent bests">
            <section className={styles.sideCard} aria-labelledby="today-week">
              <h2 id="today-week" className="kicker">
                This week
              </h2>
              {week}
            </section>
            {others.length > 0 && (
              <section className={styles.listCard} aria-labelledby="today-quick">
                <h2 id="today-quick" className="kicker">
                  Quick start
                </h2>
                <ul>
                  {others.map((w) => (
                    <li key={w.id}>
                      <button
                        type="button"
                        className={styles.row}
                        aria-label={`Start ${w.name}, ${moveCount(w)} moves, ${minutes(w, exercises)} minutes`}
                        onClick={() => void start(w.id)}
                      >
                        <span className={styles.rowName}>{w.name}</span>
                        <span className={styles.rowPill}>{moveCount(w)} moves</span>
                        <Chevron />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {bests.length > 0 && (
              <section className={styles.listCard} aria-labelledby="today-bests">
                <h2 id="today-bests" className="kicker">
                  Recent bests
                </h2>
                <ul>
                  {bests.map((b) => (
                    <li key={b.exerciseId}>
                      <Link to={`/library/${b.exerciseId}`} className={styles.row}>
                        <span className={styles.rowName}>
                          {exercises.get(b.exerciseId)?.name ?? b.exerciseId}
                        </span>
                        <span className={styles.rowValue}>
                          {b.best.measure === 'reps' ? b.best.value : clock(b.best.value * 1000)}
                          <span className="visually-hidden">
                            {b.best.measure === 'reps' ? ' reps' : ' held'}
                          </span>
                        </span>
                        <Chevron />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </aside>
        </div>
      </>
    )
  }

  return (
    <>
      {header(done, goal)}
      {week}
      {resume}
      {nextCard}
      {others.length > 0 && (
        <section aria-labelledby="today-quick">
          <div className={styles.quickHead}>
            <h2 id="today-quick" className="kicker">
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
                  aria-label={`Start ${w.name}, ${moveCount(w)} moves, ${minutes(w, exercises)} minutes`}
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

function Chevron() {
  return (
    <svg
      className={styles.chevron}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <polyline points="9 6 15 12 9 18" />
    </svg>
  )
}
