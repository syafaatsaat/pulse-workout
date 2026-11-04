import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { ExercisePhoto } from '../../components/ExercisePhoto'
import { Rings } from '../../components/Rings'
import { db, DEFAULT_SETTINGS } from '../../data/db'
import { tryWorkout } from '../../data/tryWorkout'
import { useLiveQuery } from '../../data/useLiveQuery'
import type { Exercise } from '../../data/types'
import { personalBests, type Best } from '../../engine/stats'
import { timer } from '../player/format'
import { useStartWorkout } from '../player/useStartWorkout'
import styles from './ExerciseDetailPage.module.css'
import { muscleSummary } from './filter'

const FRAMES = ['Start', 'End'] as const
const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1)

async function load(id: string) {
  const [exercise, sessions, settings] = await Promise.all([
    db.exercises.get(id),
    db.sessions.toArray(),
    db.settings.get('settings'),
  ])
  // On a first visit the list isn't written yet: still loading (undefined), not "not found" (null).
  if (!exercise) return (await db.exercises.count()) === 0 ? undefined : null
  const best = personalBests(sessions).find((b) => b.exerciseId === id)?.best
  return { exercise, best, rest: (settings ?? DEFAULT_SETTINGS).defaultRest }
}

const bestText = (b: Best) => (b.measure === 'reps' ? `${b.value} reps` : timer(b.value * 1000))
/** "Beginner", "Body only", "Compound" */
const tagsOf = (e: Exercise) => [e.level, e.equipment, e.mechanic].filter((t) => t !== undefined).map(cap)

/** Saves the one-move "Try it" workout and starts it. */
function useTryIt() {
  const start = useStartWorkout()
  return async (e: Exercise, rest: number) => {
    await db.workouts.put(tryWorkout(e, rest))
    await start(`try-${e.id}`)
  }
}

function Steps({ exercise: e }: { exercise: Exercise }) {
  if (e.instructions.length === 0) return null
  return (
    <ol className={styles.steps} aria-label="How to do it">
      {e.instructions.map((step, i) => (
        <li key={i}>
          <span className={styles.stepNumber} aria-hidden="true">
            {i + 1}
          </span>
          <span className={styles.stepText}>{step}</span>
        </li>
      ))}
    </ol>
  )
}

function Tags({ exercise: e, best }: { exercise: Exercise; best?: Best }) {
  return (
    <ul className={styles.tags} aria-label="About this exercise">
      {best && <li data-best>Best {bestText(best)}</li>}
      {tagsOf(e).map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  )
}

/**
 * GD-Library detail pane: Start and End photos side by side, name and muscles with Try it,
 * tags, then the steps. The name is an h2 (the pane sits under the Library h1).
 */
export function ExerciseDetailPane({ exerciseId }: { exerciseId: string }) {
  const data = useLiveQuery(() => load(exerciseId), [exerciseId])
  const tryIt = useTryIt()
  if (data === undefined) return null
  if (data === null) return <p className={styles.missing}>Exercise not found.</p>

  const { exercise: e, best, rest } = data
  return (
    <section className={styles.pane} aria-labelledby="detail-name">
      <div className={styles.paneMedia}>
        {FRAMES.map((label, i) => (
          <div key={label} className={styles.paneFrame}>
            <Rings
              radii={[56, 96, 140, 190]}
              size={420}
              startOpacity={0.2}
              step={0.055}
              color="var(--accent)"
              style={{ left: '50%', top: '50%', margin: '-210px 0 0 -210px' }}
            />
            <ExercisePhoto
              path={e.images[i]}
              className={styles.panePhoto}
              placeholderClassName={styles.placeholder}
              alt={`${e.name}, ${label.toLowerCase()} position`}
              placeholderLabel={`No photo: ${e.name}, ${label.toLowerCase()} position`}
            />
            <span className={styles.frameTag} aria-hidden="true">
              {label}
            </span>
          </div>
        ))}
      </div>
      <div className={styles.paneHead}>
        <div className={styles.paneTitle}>
          <h2 id="detail-name" className={styles.paneName}>
            {e.name}
          </h2>
          <span className={styles.summary}>{muscleSummary(e)}</span>
        </div>
        <button type="button" className={styles.paneTry} onClick={() => void tryIt(e, rest)}>
          Try it
        </button>
      </div>
      <Tags exercise={e} best={best} />
      <Steps exercise={e} />
    </section>
  )
}

/** G-Detail: back, photo card with a Start / End toggle (crossfade), name, tags, steps, Try it. */
export function ExerciseDetailPage() {
  const { exerciseId = '' } = useParams()
  const data = useLiveQuery(() => load(exerciseId), [exerciseId])
  const [frame, setFrame] = useState(0)
  const tryIt = useTryIt()
  const navigate = useNavigate()
  // Opened from inside the app: Back returns there (keeping Library filters); a direct visit goes to Library.
  const hasHistory = useLocation().key !== 'default'

  const top = (
    <div className={styles.top}>
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
          <polyline points="15 6 9 12 15 18" />
        </svg>
      </Link>
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
  const frames = e.images.slice(0, 2)

  return (
    <div className={styles.page}>
      {top}

      <div className={styles.media}>
        <Rings
          radii={[50, 80, 112, 146, 184]}
          size={400}
          startOpacity={0.22}
          step={0.04}
          color="var(--accent)"
          style={{ left: '50%', top: '50%', margin: '-200px 0 0 -200px' }}
        />
        {frames.length > 0 ? (
          frames.map((src, i) => (
            <ExercisePhoto
              key={src}
              path={src}
              className={styles.photo}
              placeholderClassName={`${styles.photo} ${styles.placeholder}`}
              data-shown={i === frame || undefined}
              alt={i === frame ? `${e.name}, ${FRAMES[i]!.toLowerCase()} position` : ''}
              placeholderLabel={
                i === frame ? `No photo: ${e.name}, ${FRAMES[i]!.toLowerCase()} position` : ''
              }
              aria-hidden={i !== frame || undefined}
            />
          ))
        ) : (
          <ExercisePhoto
            path={undefined}
            className={`${styles.photo} ${styles.placeholder}`}
            data-shown
            alt={`No photo for ${e.name}`}
          />
        )}
        {frames.length > 1 && (
          <div className={styles.frames} role="group" aria-label="Photo frame">
            {FRAMES.map((label, i) => (
              <button key={label} type="button" aria-pressed={i === frame} onClick={() => setFrame(i)}>
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <h1 className={styles.name}>{e.name}</h1>
      <span className={styles.summary}>{muscleSummary(e)}</span>
      <Tags exercise={e} best={best} />
      <Steps exercise={e} />

      <div className={styles.bar}>
        <button type="button" className={styles.try} onClick={() => void tryIt(e, rest)}>
          Try it
        </button>
      </div>
    </div>
  )
}
