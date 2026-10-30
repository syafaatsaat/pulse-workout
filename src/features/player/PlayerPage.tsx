import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { db } from '../../data/db'
import { compile, moveCount } from '../../engine/compile'
import { lastTime, type SetValue } from '../../engine/stats'
import { Player } from './Player'
import styles from './Player.module.css'

async function load(sessionId: string) {
  const session = await db.sessions.get(sessionId)
  if (!session) return null
  const workout = await db.workouts.get(session.workoutId)
  if (!workout) return null
  const steps = compile(workout)
  const ids = [...new Set(steps.map((s) => s.exerciseId))]
  const found = await db.exercises.bulkGet(ids)
  const exercises = new Map(found.flatMap((e) => (e ? [[e.id, e] as const] : [])))
  const history = await db.sessions.where('startedAt').below(session.startedAt).toArray()
  const lastTimes = new Map<string, SetValue>()
  for (const id of ids) {
    const v = lastTime(history, id, sessionId)
    if (v) lastTimes.set(id, v)
  }
  // Restore time is taken here, not during render.
  return { session, workout, steps, exercises, lastTimes, openedAt: Date.now() }
}

export function PlayerPage() {
  const { id = '' } = useParams()
  // Set by the Start tap. A reload or a later visit has no flag and restores from the saved sets.
  const autoStart = (useLocation().state as { start?: boolean } | null)?.start === true
  // Loaded once, not live: from here the player owns the state and writes sets back.
  const [data, setData] = useState<{ id: string; d: Awaited<ReturnType<typeof load>> }>()
  useEffect(() => {
    let current = true
    load(id)
      .then((d) => current && setData({ id, d }))
      .catch(console.error)
    return () => {
      current = false
    }
  }, [id])

  if (!data || data.id !== id) return <div className={styles.player} data-mode="work" />
  if (!data.d || data.d.session.endedAt !== undefined) {
    return (
      <div className={styles.player} data-mode="work">
        <div className={styles.message}>
          <h1 className={styles.name}>{data.d ? 'Session finished' : 'Session not found'}</h1>
          <Link to="/">Back to Today</Link>
        </div>
      </div>
    )
  }

  const { session, workout, steps, exercises, lastTimes, openedAt } = data.d
  return (
    <Player
      key={id}
      sessionId={id}
      session={autoStart ? null : { sets: session.sets, startedAt: session.startedAt, openedAt }}
      workoutName={workout.name}
      steps={steps}
      moveCount={moveCount(workout)}
      exercises={exercises}
      lastTimes={lastTimes}
    />
  )
}
