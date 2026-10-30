import { Link, useNavigate } from 'react-router'
import { PageHeader } from '../../app/PageHeader'
import { createSession } from '../../data/sessions'
import { db } from '../../data/db'
import { useLiveQuery } from '../../data/useLiveQuery'
import styles from './DebugPage.module.css'

// Temporary (Day 1): proves the import and the seed. Remove once Library and Log are real.

const dateFmt = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })

export function DebugPage() {
  const exercises = useLiveQuery(() => db.exercises.orderBy('name').toArray())
  const workouts = useLiveQuery(() => db.workouts.toArray())
  const sessions = useLiveQuery(() => db.sessions.orderBy('startedAt').reverse().toArray())
  const navigate = useNavigate()
  const start = async (workoutId: string) =>
    navigate(`/session/${await createSession(workoutId)}`, { state: { start: true } })
  const workoutName = new Map(workouts?.map((w) => [w.id, w.name]))

  return (
    <>
      <PageHeader eyebrow="Temporary" title="Debug" />

      <section className={styles.section}>
        <h2 className="eyebrow">Sessions · {sessions?.length ?? '…'}</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Workout</th>
              <th>Min</th>
              <th>Sets</th>
              <th>Reps</th>
            </tr>
          </thead>
          <tbody>
            {sessions?.map((s) => (
              <tr key={s.id}>
                <td>{dateFmt.format(s.startedAt)}</td>
                <td>
                  {workoutName.get(s.workoutId) ?? s.workoutId}
                  {s.endedAt === undefined && (
                    <>
                      {' · '}
                      <Link to={`/session/${s.id}`}>Resume</Link>
                    </>
                  )}
                </td>
                <td>{s.endedAt ? Math.round((s.endedAt - s.startedAt) / 60000) : '–'}</td>
                <td>{s.sets.length}</td>
                <td>{s.sets.reduce((sum, x) => sum + (x.reps ?? 0), 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className={styles.section}>
        <h2 className="eyebrow">Workouts · {workouts?.length ?? '…'}</h2>
        <ul className={styles.workouts}>
          {workouts?.map((w) => (
            <li key={w.id}>
              <button type="button" className={styles.start} onClick={() => void start(w.id)}>
                Start
              </button>{' '}
              <strong>{w.name}</strong> — {w.blocks.map((b) => `${b.name} (${b.items.length})`).join(' · ')}
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className="eyebrow">Exercises · {exercises?.length ?? '…'}</h2>
        <ul className={styles.grid}>
          {exercises?.map((ex) => (
            <li key={ex.id} className={styles.card}>
              {ex.images[0] ? (
                <img
                  className={styles.thumb}
                  src={`/exercises/${ex.images[0]}`}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  width={600}
                  height={400}
                />
              ) : (
                <div className={styles.thumb} aria-hidden="true" />
              )}
              <span className={styles.name}>{ex.name}</span>
              <span className={styles.meta}>
                {ex.equipment} · {ex.level} · {ex.primaryMuscles.join(', ')}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
