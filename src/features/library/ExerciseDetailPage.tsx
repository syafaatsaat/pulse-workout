import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { ImagePlaceholder } from '../../components/ImagePlaceholder'
import { db, DEFAULT_SETTINGS } from '../../data/db'
import { tryWorkout } from '../../data/tryWorkout'
import { useLiveQuery } from '../../data/useLiveQuery'
import { personalBests } from '../../engine/stats'
import { clock } from '../player/format'
import { useStartWorkout } from '../player/useStartWorkout'
import styles from './ExerciseDetailPage.module.css'

const FRAMES = ['Start', 'End'] as const
const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1)
const list = (muscles: string[]) => muscles.map(cap).join(', ')

async function load(id: string) {
  const [exercise, sessions, settings] = await Promise.all([
    db.exercises.get(id),
    db.sessions.toArray(),
    db.settings.get('settings'),
  ])
  if (!exercise) return null
  const best = personalBests(sessions).find((b) => b.exerciseId === id)?.best
  return { exercise, best, rest: (settings ?? DEFAULT_SETTINGS).defaultRest }
}

export function ExerciseDetailPage() {
  const { exerciseId = '' } = useParams()
  const data = useLiveQuery(() => load(exerciseId), [exerciseId])
  const [frame, setFrame] = useState(0)
  const start = useStartWorkout()
  const navigate = useNavigate()
  // Opened from inside the app: Back returns there (keeping Library filters); a direct visit goes to Library.
  const hasHistory = useLocation().key !== 'default'

  const back = (
    <Link
      to="/library"
      className={styles.back}
      aria-label="Back to library"
      onClick={(e) => {
        if (!hasHistory) return
        e.preventDefault()
        void navigate(-1)
      }}
    >
      <svg
        width="18"
        height="18"
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
    </Link>
  )
  const top = (
    <div className={styles.top}>
      {back}
      <span className="eyebrow">Exercise</span>
      <span />
    </div>
  )

  if (data === undefined) return top
  if (data === null) {
    return (
      <>
        {top}
        <h1 className={styles.name}>Exercise not found</h1>
        <p className={styles.missing}>
          <Link to="/library">Browse the library</Link>
        </p>
      </>
    )
  }

  const { exercise: e, best, rest } = data
  const tags = [cap(e.level), e.force, e.mechanic, e.equipment].filter((t) => t !== undefined)
  const tryIt = async () => {
    await db.workouts.put(tryWorkout(e, rest))
    await start(`try-${e.id}`)
  }

  return (
    <div className={styles.page}>
      {top}

      <div className={styles.media}>
        {e.images.length > 0 ? (
          e.images
            .slice(0, 2)
            .map((src, i) => (
              <img
                key={src}
                className={styles.photo}
                data-shown={i === frame || undefined}
                src={`/exercises/${src}`}
                alt={i === frame ? `${e.name}, ${FRAMES[i]!.toLowerCase()} position` : ''}
                aria-hidden={i !== frame || undefined}
              />
            ))
        ) : (
          <ImagePlaceholder className={styles.photo} label={`No photo for ${e.name}`} />
        )}
        {e.images.length > 1 && (
          <div className={styles.frames} role="group" aria-label="Photo">
            {FRAMES.map((label, i) => (
              <button key={label} type="button" aria-pressed={i === frame} onClick={() => setFrame(i)}>
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <h1 className={styles.name}>{e.name}</h1>
      <ul className={styles.tags} aria-label="About this exercise">
        {best && (
          <li data-best>Best {best.measure === 'reps' ? `${best.value} reps` : clock(best.value * 1000)}</li>
        )}
        {tags.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>

      <dl className={styles.muscles}>
        <div>
          <dt>
            <span className={styles.dot} aria-hidden="true" />
            Primary
          </dt>
          <dd>{list(e.primaryMuscles)}</dd>
        </div>
        {e.secondaryMuscles.length > 0 && (
          <div>
            <dt>
              <span className={styles.ring} aria-hidden="true" />
              Also
            </dt>
            <dd>{list(e.secondaryMuscles)}</dd>
          </div>
        )}
      </dl>

      {e.instructions.length > 0 && (
        <ol className={styles.steps} aria-label="Steps">
          {e.instructions.map((step, i) => (
            <li key={i}>
              <span className={styles.stepNumber} aria-hidden="true">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      )}

      <div className={styles.bar}>
        <button type="button" className={styles.try} onClick={() => void tryIt()}>
          Try it
        </button>
      </div>
    </div>
  )
}
