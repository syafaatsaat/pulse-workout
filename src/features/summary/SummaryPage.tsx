import { useState } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { Rings } from '../../components/Rings'
import { db } from '../../data/db'
import { useLiveQuery } from '../../data/useLiveQuery'
import { compile } from '../../engine/compile'
import { activeMs, sessionBests, type Best } from '../../engine/stats'
import { elapsed, timer } from '../player/format'
import { formatMonth, monthOf } from '../progress/month'
import styles from './SummaryPage.module.css'

const SHOWN_MOVES = 4

const dateFmt = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

/** 12 reps → "12", a 40 s hold → "00:40". */
const value = (b: Best) => (b.measure === 'reps' ? String(b.value) : timer(b.value * 1000))
/** "+2" or "+00:15". */
const gain = (b: Best, previous: Best) =>
  `+${b.measure === 'reps' ? b.value - previous.value : timer((b.value - previous.value) * 1000)}`

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
  return { session, workout, ids, names, results: sessionBests(history, session) }
}

function Check({ size, strokeWidth }: { size: number; strokeWidth: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="5 12.5 10 17.5 19 7" />
    </svg>
  )
}

/** Session complete (G-Summary): check badge, stats, new-best card, moves, Done. */
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

  const { session, workout, ids, names, results } = data
  const reps = session.sets.reduce((sum, x) => sum + (x.reps ?? 0), 0)
  const newBest = results.find((r) => r.isNew)
  const byId = new Map(results.map((r) => [r.exerciseId, r]))
  const moves = ids.map((exerciseId) => ({
    exerciseId,
    name: names.get(exerciseId) ?? exerciseId,
    result: byId.get(exerciseId),
  }))
  const shown = allMoves ? moves : moves.slice(0, SHOWN_MOVES)
  const hidden = moves.length - shown.length

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.badge}>
          <Rings
            radii={[58, 86, 116, 150, 188, 230]}
            startOpacity={0.35}
            step={0.055}
            color="var(--accent)"
            size={600}
            className={styles.badgeRings}
          />
          <span className={styles.check}>
            <Check size={34} strokeWidth={2.4} />
          </span>
        </div>
        <h1 className={styles.title}>Session complete</h1>
        <p className={styles.sub}>
          {workout.name} ·{' '}
          <time dateTime={new Date(session.startedAt).toISOString()}>
            {dateFmt.format(session.startedAt)}
          </time>
        </p>

        <dl className={styles.stats}>
          <div>
            <dt>Time</dt>
            <dd>{elapsed(activeMs(session))}</dd>
          </div>
          <div>
            <dt>Sets</dt>
            <dd>{session.sets.length}</dd>
          </div>
          <div>
            <dt>Reps</dt>
            <dd>{reps}</dd>
          </div>
        </dl>

        {newBest?.previous && (
          <div className={styles.best}>
            <Rings
              radii={[30, 55, 80, 105]}
              startOpacity={0.5}
              step={0.14}
              color="var(--accent)"
              size={220}
              className={styles.bestRings}
            />
            <span className={styles.bestText}>
              <span className={styles.bestLabel}>New personal best</span>
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
                <span className={styles.moveValue}>
                  {m.result ? (
                    <>
                      <span aria-hidden="true">
                        {m.result.sets} × {value(m.result.best)}
                      </span>
                      <span className="visually-hidden">
                        {m.result.sets} {m.result.sets === 1 ? 'set' : 'sets'}, best {value(m.result.best)}
                        {m.result.best.measure === 'reps' && ' reps'}
                      </span>
                    </>
                  ) : (
                    <>
                      <span aria-hidden="true">–</span>
                      <span className="visually-hidden">Not done</span>
                    </>
                  )}
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
        {justFinished ? (
          <Link className={styles.done} to="/">
            Done
          </Link>
        ) : (
          <Link className={styles.done} to={`/progress?month=${formatMonth(monthOf(session.startedAt))}`}>
            Back to Progress
          </Link>
        )}
      </div>
    </div>
  )
}
