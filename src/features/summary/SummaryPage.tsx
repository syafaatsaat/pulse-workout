import { useState } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { SessionBar } from '../../components/SessionBar'
import { db } from '../../data/db'
import { useLiveQuery } from '../../data/useLiveQuery'
import { compile } from '../../engine/compile'
import { activeMs, sessionBests, type Best } from '../../engine/stats'
import { formatMonth, monthOf } from '../log/month'
import { clock, elapsed } from '../player/format'
import styles from './SummaryPage.module.css'

const SHOWN_MOVES = 4

const dateFmt = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })

/** 12 reps → "12", a 45 s hold → "0:45". */
const value = (b: Best) => (b.measure === 'reps' ? String(b.value) : clock(b.value * 1000))
/** "+2" or "+0:15". */
const gain = (b: Best, previous: Best) =>
  `+${b.measure === 'reps' ? b.value - previous.value : clock((b.value - previous.value) * 1000)}`

async function load(id: string) {
  const session = await db.sessions.get(id)
  if (!session) return null
  const workout = await db.workouts.get(session.workoutId)
  if (!workout) return null
  const history = await db.sessions.where('startedAt').belowOrEqual(session.startedAt).toArray()
  const steps = compile(workout)
  const ids = [...new Set(steps.map((s) => s.exerciseId))]
  const found = await db.exercises.bulkGet(ids)
  const names = new Map(found.flatMap((e) => (e ? [[e.id, e.name] as const] : [])))
  return { session, workout, steps, ids, names, results: sessionBests(history, session) }
}

export function SummaryPage() {
  const { id = '' } = useParams()
  const justFinished = (useLocation().state as { justFinished?: boolean } | null)?.justFinished === true
  const data = useLiveQuery(() => load(id), [id])
  const [allMoves, setAllMoves] = useState(false)

  if (data === undefined) return <div className={styles.page} />
  if (data === null || data.session.endedAt === undefined) {
    return (
      <div className={styles.page}>
        <div className={styles.message}>
          <h1 className={styles.title}>{data ? 'Session not finished' : 'Session not found'}</h1>
          {data ? <Link to={`/session/${id}`}>Resume it</Link> : <Link to="/">Back to Today</Link>}
        </div>
      </div>
    )
  }

  const { session, workout, steps, ids, names, results } = data
  const workSteps = steps.filter((s) => s.kind === 'work')
  const done = session.sets.length
  // The step after the last logged set: everything before it renders done.
  const doneUpTo = done >= workSteps.length ? steps.length : steps.indexOf(workSteps[done]!)
  const reps = session.sets.reduce((sum, x) => sum + (x.reps ?? 0), 0)
  const newBest = results.find((r) => r.isNew)
  const byId = new Map(results.map((r) => [r.exerciseId, r]))
  const moves = ids.map((exerciseId) => ({
    exerciseId,
    name: names.get(exerciseId) ?? exerciseId,
    planned: workSteps.filter((s) => s.exerciseId === exerciseId).length,
    result: byId.get(exerciseId),
  }))
  const shown = allMoves ? moves : moves.slice(0, SHOWN_MOVES)
  const hidden = moves.length - shown.length

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <span className={styles.check} aria-hidden="true">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="5 12.5 10 17.5 19 7" />
            </svg>
          </span>
          <span className={styles.complete}>Session complete</span>
          <time className={styles.date} dateTime={new Date(session.startedAt).toISOString()}>
            {dateFmt.format(session.startedAt)}
          </time>
        </div>
        <h1 className={styles.title}>{workout.name}</h1>
        <div className={styles.bar}>
          <SessionBar
            steps={steps}
            current={doneUpTo}
            variant="summary"
            label={
              done >= workSteps.length ? 'Every block finished' : `${done} of ${workSteps.length} sets done`
            }
          />
        </div>

        <dl className={styles.stats}>
          <div>
            <dt>Time</dt>
            <dd>{elapsed(activeMs(session))}</dd>
          </div>
          <div>
            <dt>Sets</dt>
            <dd>
              {done}/{workSteps.length}
            </dd>
          </div>
          <div>
            <dt>Reps</dt>
            <dd>{reps}</dd>
          </div>
        </dl>

        {newBest?.previous && (
          <div className={styles.best}>
            <span className={styles.bestIcon} aria-hidden="true">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z" />
              </svg>
            </span>
            <span className={styles.bestText}>
              <span className={styles.bestEyebrow}>New personal best</span>
              <span className={styles.bestValue}>
                {names.get(newBest.exerciseId) ?? newBest.exerciseId} · {value(newBest.best)}
                {newBest.best.measure === 'reps' && ' reps'}
              </span>
            </span>
            <span className={styles.bestGain}>
              <span className="visually-hidden">Up </span>
              {gain(newBest.best, newBest.previous)}
            </span>
          </div>
        )}

        <div className={styles.movesCard}>
          <ul className={styles.moves} id="summary-moves">
            {shown.map((m) => (
              <li key={m.exerciseId} className={styles.move}>
                <span className={styles.moveName}>{m.name}</span>
                <span className={styles.moveSets}>
                  <span className="visually-hidden">Sets </span>
                  {m.result?.sets ?? 0}/{m.planned}
                </span>
                <span className={styles.moveBest} data-pb={m.result?.isNew || undefined}>
                  <span className="visually-hidden">Best </span>
                  {m.result ? value(m.result.best) : '–'}
                  {m.result?.isNew && ' PB'}
                </span>
              </li>
            ))}
          </ul>
          {hidden > 0 && (
            <button
              type="button"
              className={styles.more}
              aria-expanded={false}
              aria-controls="summary-moves"
              onClick={() => setAllMoves(true)}
            >
              +{hidden} more {hidden === 1 ? 'move' : 'moves'}
            </button>
          )}
        </div>

        <div className={styles.spacer} />
        <Link className={styles.save} to={`/log?month=${formatMonth(monthOf(session.startedAt))}`}>
          {justFinished ? 'Save to log' : 'Back to log'}
        </Link>
      </div>
    </div>
  )
}
