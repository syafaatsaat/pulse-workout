import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { PageHeader } from '../../app/PageHeader'
import { db, DEFAULT_SETTINGS } from '../../data/db'
import { useLiveQuery } from '../../data/useLiveQuery'
import { bestSeries, goalStreak, monthStats, personalBests, type Best } from '../../engine/stats'
import { timer } from '../player/format'
import { addMonths, formatMonth, monthOf, parseMonth, type YearMonth } from './month'
import styles from './ProgressPage.module.css'

const SHOWN_BESTS = 3
const WEEKS = 6
const BEST_WINDOW_MS = WEEKS * 7 * 24 * 3600 * 1000
/** Sparkline bar heights (G-Progress): 20px for the top value, never under 3px. */
const BAR_MAX = 20
const BAR_MIN = 3

const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const monthFmt = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' })
const monthNameFmt = new Intl.DateTimeFormat('en-GB', { month: 'long' })
const dayFmt = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

/** 22_800_000 → "6h 20m". */
function hoursMinutes(ms: number): string {
  const total = Math.round(ms / 60_000)
  const h = Math.floor(total / 60)
  return h > 0 ? `${h}h ${total % 60}m` : `${total}m`
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** 12 reps → "12", a 90 s hold → "01:30". */
const bestValue = (b: Best) => (b.measure === 'reps' ? String(b.value) : timer(b.value * 1000))

const before = (a: YearMonth, b: YearMonth) => a.year < b.year || (a.year === b.year && a.month < b.month)

async function load() {
  const [sessions, settings] = await Promise.all([db.sessions.toArray(), db.settings.get('settings')])
  const exercises = await db.exercises.toArray()
  return {
    sessions,
    goal: (settings ?? DEFAULT_SETTINGS).weeklyGoal,
    names: new Map(exercises.map((e) => [e.id, e.name])),
  }
}

function Chevron({ points }: { points: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points={points} />
    </svg>
  )
}

/** Six weekly bars, the last (the current best) in ember. Decorative: the number says it. */
function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(...values, 1)
  return (
    <span className={styles.spark} aria-hidden="true">
      {values.map((v, i) => (
        <span
          key={i}
          data-current={i === values.length - 1 || undefined}
          style={{ height: Math.max(BAR_MIN, Math.round((v / max) * BAR_MAX)) }}
        />
      ))}
    </span>
  )
}

/** Progress (G-Progress): month calendar, three stat cards, personal bests with sparklines. */
export function ProgressPage() {
  // Read once per visit: "today" for the calendar, the streak and the 6-week window.
  const [now] = useState(() => Date.now())
  const current = monthOf(now)
  const [params, setParams] = useSearchParams()
  const shown = parseMonth(params.get('month'), current)
  const data = useLiveQuery(load)

  if (!data) return <PageHeader kicker="…" title="Progress" />

  const { sessions, goal, names } = data
  const stats = monthStats(sessions, shown.year, shown.month, goal, now)
  const weeks = goalStreak(sessions, goal, now)
  const earliest = sessions.reduce((t, s) => Math.min(t, s.startedAt), now)
  const bests = personalBests(sessions)
    .filter((b) => b.previous && b.setAt >= now - BEST_WINDOW_MS)
    .slice(0, SHOWN_BESTS)

  const go = (n: number) => setParams({ month: formatMonth(addMonths(shown, n)) }, { replace: true })
  const first = new Date(shown.year, shown.month, 1)
  const blanks = (first.getDay() + 6) % 7
  const daysInMonth = new Date(shown.year, shown.month + 1, 0).getDate()
  const today = new Date(now)
  const isThisMonth = shown.year === current.year && shown.month === current.month
  const monthName = shown.year === current.year ? monthNameFmt.format(first) : monthFmt.format(first)

  return (
    <>
      <PageHeader
        kicker={`${plural(stats.sessions, 'session', 'sessions')} in ${monthName}`}
        title="Progress"
      />

      <div className={styles.columns}>
        <section className={styles.calendar} aria-labelledby="progress-month">
          <div className={styles.monthBar}>
            <button
              type="button"
              className={styles.monthButton}
              aria-label="Previous month"
              disabled={!before(monthOf(earliest), shown)}
              onClick={() => go(-1)}
            >
              <Chevron points="15 6 9 12 15 18" />
            </button>
            <h2 id="progress-month" className={styles.monthTitle} aria-live="polite">
              {monthFmt.format(first)}
            </h2>
            <button
              type="button"
              className={styles.monthButton}
              aria-label="Next month"
              disabled={!before(shown, current)}
              onClick={() => go(1)}
            >
              <Chevron points="9 6 15 12 9 18" />
            </button>
          </div>
          <div className={styles.grid}>
            {DOW.map((d, i) => (
              <span key={i} className={styles.dow} aria-hidden="true">
                {d}
              </span>
            ))}
            {Array.from({ length: blanks }, (_, i) => (
              <span key={`blank-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1
              const date = new Date(shown.year, shown.month, day)
              const sessionId = stats.days.get(day)
              const isToday = isThisMonth && day === today.getDate()
              const future = date.getTime() > now
              const label = `${dayFmt.format(date)}${sessionId ? ', session logged' : ''}${isToday ? ', today' : ''}`
              const props = {
                className: styles.day,
                'data-done': !!sessionId || undefined,
                'data-today': isToday || undefined,
                'data-future': future || undefined,
                'aria-label': label,
              }
              return sessionId ? (
                <Link key={day} to={`/session/${sessionId}/summary`} {...props}>
                  {day}
                </Link>
              ) : (
                <span key={day} role="img" {...props}>
                  {day}
                </span>
              )
            })}
          </div>
        </section>

        <div className={styles.side}>
          <dl className={styles.stats}>
            <div>
              <dt>
                Goal streak<span className="visually-hidden">: weeks in a row with {goal} sessions</span>
              </dt>
              <dd>{plural(weeks, 'wk', 'wks')}</dd>
            </div>
            <div>
              <dt>
                Per week<span className="visually-hidden">, average this month</span>
              </dt>
              <dd>{Number(stats.avgPerWeek.toFixed(1))}</dd>
            </div>
            <div>
              <dt>
                Time<span className="visually-hidden"> this month</span>
              </dt>
              <dd>{hoursMinutes(stats.activeMs)}</dd>
            </div>
          </dl>

          <section aria-labelledby="progress-bests">
            <div className={styles.bestsHead}>
              <h2 id="progress-bests" className={styles.bestsTitle}>
                Personal bests
              </h2>
              <span className={styles.window}>Last {WEEKS} weeks</span>
            </div>
            {bests.length > 0 ? (
              <ul className={styles.bests}>
                {bests.map((b) => (
                  <li key={b.exerciseId}>
                    <Link to={`/library/${b.exerciseId}`} className={styles.best}>
                      <span className={styles.bestName}>{names.get(b.exerciseId) ?? b.exerciseId}</span>
                      <Sparkline values={bestSeries(sessions, b.exerciseId, now, WEEKS)} />
                      <span className={styles.bestValue}>
                        {bestValue(b.best)}
                        <span className="visually-hidden">
                          {b.best.measure === 'reps' ? ' reps' : ''}, up from {bestValue(b.previous!)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.empty}>
                No new bests in the last {WEEKS} weeks. Beat a number and it shows up here.
              </p>
            )}
          </section>
        </div>
      </div>
    </>
  )
}
