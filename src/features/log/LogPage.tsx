import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { PageHeader } from '../../app/PageHeader'
import { db, DEFAULT_SETTINGS } from '../../data/db'
import { useLiveQuery } from '../../data/useLiveQuery'
import { monthStats, personalBests, streak, type Best } from '../../engine/stats'
import { clock } from '../player/format'
import { addMonths, formatMonth, monthOf, parseMonth, type YearMonth } from './month'
import styles from './LogPage.module.css'

const SHOWN_BESTS = 3
const BEST_WINDOW_MS = 6 * 7 * 24 * 3600 * 1000

const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const monthFmt = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' })
const dayFmt = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

/** 22_800_000 → "6h 20m". */
function hoursMinutes(ms: number): string {
  const total = Math.round(ms / 60_000)
  const h = Math.floor(total / 60)
  return h > 0 ? `${h}h ${total % 60}m` : `${total}m`
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** "+2 reps" or "+0:15". */
function gain(best: Best, previous: Best): string {
  const d = best.value - previous.value
  return best.measure === 'reps' ? `+${plural(d, 'rep', 'reps')}` : `+${clock(d * 1000)}`
}

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

export function LogPage() {
  // Read once per visit: "today" for the calendar, the streak and the 6-week window.
  const [now] = useState(() => Date.now())
  const current = monthOf(now)
  const [params, setParams] = useSearchParams()
  const shown = parseMonth(params.get('month'), current)
  const data = useLiveQuery(load)

  if (!data) return <PageHeader eyebrow="…" title="Log" />

  const { sessions, goal, names } = data
  const stats = monthStats(sessions, shown.year, shown.month, goal, now)
  const weeks = streak(sessions, goal, now)
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

  return (
    <>
      <PageHeader
        eyebrow={`${plural(stats.sessions, 'session', 'sessions')} · ${hoursMinutes(stats.activeMs)}`}
        title="Log"
      />

      <div className={styles.columns}>
        <section className={styles.calendar} aria-labelledby="log-month">
          <div className={styles.monthBar}>
            <button
              type="button"
              className={styles.monthButton}
              aria-label="Previous month"
              disabled={!before(monthOf(earliest), shown)}
              onClick={() => go(-1)}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="15 6 9 12 15 18" />
              </svg>
            </button>
            <h2 id="log-month" className={styles.monthTitle} aria-live="polite">
              {monthFmt.format(first)}
            </h2>
            <button
              type="button"
              className={styles.monthButton}
              aria-label="Next month"
              disabled={!before(shown, current)}
              onClick={() => go(1)}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="9 6 15 12 9 18" />
              </svg>
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
              const circle = (
                <span
                  className={styles.day}
                  data-done={!!sessionId || undefined}
                  data-today={isToday || undefined}
                  data-future={future || undefined}
                >
                  {day}
                </span>
              )
              return sessionId ? (
                <Link
                  key={day}
                  to={`/session/${sessionId}/summary`}
                  className={styles.cell}
                  aria-label={label}
                >
                  {circle}
                </Link>
              ) : (
                <span key={day} className={styles.cell} aria-label={label} role="img">
                  {circle}
                </span>
              )
            })}
          </div>
        </section>

        <div className={styles.side}>
          <dl className={styles.stats}>
            <div>
              <dt>Streak</dt>
              <dd>{plural(weeks, 'wk', 'wks')}</dd>
            </div>
            <div>
              <dt>
                Avg / wk<span className="visually-hidden"> this month</span>
              </dt>
              <dd>{Number(stats.avgPerWeek.toFixed(1))}</dd>
            </div>
            <div>
              <dt>
                Goal wks<span className="visually-hidden"> this month, of {goal} sessions</span>
              </dt>
              <dd>
                {stats.goalWeeks}/{stats.weeks}
              </dd>
            </div>
          </dl>

          <section aria-labelledby="log-bests">
            <div className={styles.bestsHead}>
              <h2 id="log-bests" className="eyebrow">
                Personal bests · 6 weeks
              </h2>
              <Link to="/library" className={styles.all}>
                All
              </Link>
            </div>
            {bests.length > 0 ? (
              <ul className={styles.bests}>
                {bests.map((b) => (
                  <li key={b.exerciseId}>
                    <Link to={`/library/${b.exerciseId}`} className={styles.best}>
                      <span className={styles.bestName}>{names.get(b.exerciseId) ?? b.exerciseId}</span>
                      <span className={styles.bestValue}>
                        <span className={styles.bestNumber}>
                          {b.best.measure === 'reps' ? b.best.value : clock(b.best.value * 1000)}
                        </span>
                        <span className={styles.bestGain}>{gain(b.best, b.previous!)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.empty}>
                No new bests in the last 6 weeks. Beat a number and it shows up here.
              </p>
            )}
          </section>
        </div>
      </div>
    </>
  )
}
