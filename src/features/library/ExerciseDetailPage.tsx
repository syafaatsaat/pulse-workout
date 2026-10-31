import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { ExercisePhoto } from '../../components/ExercisePhoto'
import { ImagePlaceholder } from '../../components/ImagePlaceholder'
import { db, DEFAULT_SETTINGS } from '../../data/db'
import { tryWorkout } from '../../data/tryWorkout'
import { useLiveQuery } from '../../data/useLiveQuery'
import type { Exercise } from '../../data/types'
import { lastTime, personalBests, type SetValue } from '../../engine/stats'
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
  const lastSession = sessions
    .filter((s) => s.endedAt !== undefined && s.sets.some((x) => x.exerciseId === id))
    .sort((a, b) => b.startedAt - a.startedAt)[0]
  const last = lastSession && lastTime(sessions, id)
  return {
    exercise,
    best,
    last: last && lastSession ? { value: last, date: lastSession.startedAt } : undefined,
    rest: (settings ?? DEFAULT_SETTINGS).defaultRest,
  }
}

const dayFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' })
const valueText = (v: SetValue) => (v.reps !== undefined ? `${v.reps} reps` : clock((v.seconds ?? 0) * 1000))
const tagsOf = (e: Exercise) =>
  [cap(e.level), e.force, e.mechanic, e.equipment].filter((t) => t !== undefined)

/** Saves the one-move "Try it" workout and starts it. */
function useTryIt() {
  const start = useStartWorkout()
  return async (e: Exercise, rest: number) => {
    await db.workouts.put(tryWorkout(e, rest))
    await start(`try-${e.id}`)
  }
}

function Muscles({ exercise: e, className }: { exercise: Exercise; className?: string }) {
  return (
    <dl className={className}>
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
  )
}

function Steps({ exercise: e }: { exercise: Exercise }) {
  if (e.instructions.length === 0) return null
  return (
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
  )
}

function Tags({ exercise: e, best }: { exercise: Exercise; best?: { measure: string; value: number } }) {
  return (
    <ul className={styles.tags} aria-label="About this exercise">
      {best && (
        <li data-best>Best {best.measure === 'reps' ? `${best.value} reps` : clock(best.value * 1000)}</li>
      )}
      {tagsOf(e).map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  )
}

/**
 * DT-Library detail pane: START and END photos side by side, name, Try it now, then steps |
 * muscles with your best and last session. The name is an h2 (the pane sits under the Library h1).
 */
export function ExerciseDetailPane({ exerciseId }: { exerciseId: string }) {
  const data = useLiveQuery(() => load(exerciseId), [exerciseId])
  const tryIt = useTryIt()
  if (data === undefined) return null
  if (data === null) return <p className={styles.missing}>Exercise not found.</p>

  const { exercise: e, best, last, rest } = data
  return (
    <section className={styles.pane} aria-labelledby="detail-name">
      <div className={styles.paneMedia}>
        {FRAMES.map((label, i) => (
          <div key={label} className={styles.paneFrame}>
            <ExercisePhoto
              path={e.images[i]}
              className={styles.panePhoto}
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
          <Tags exercise={e} best={best} />
        </div>
        <button type="button" className={styles.tryNow} onClick={() => void tryIt(e, rest)}>
          Try it now
        </button>
      </div>
      <div className={styles.paneBody}>
        <Steps exercise={e} />
        <div className={styles.muscleCard}>
          <div>
            <h3 className="eyebrow">Muscles</h3>
            <Muscles exercise={e} className={styles.muscleList} />
          </div>
          <div className={styles.yours}>
            <h3 className="eyebrow">Your best</h3>
            <p className={styles.yourBest}>
              {best ? (best.measure === 'reps' ? `${best.value} reps` : clock(best.value * 1000)) : '—'}
            </p>
            <p className={styles.lastSession}>
              {last
                ? `Last session: ${valueText(last.value)} on ${dayFmt.format(last.date)}`
                : 'Not done yet'}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export function ExerciseDetailPage() {
  const { exerciseId = '' } = useParams()
  const data = useLiveQuery(() => load(exerciseId), [exerciseId])
  const [frame, setFrame] = useState(0)
  const tryIt = useTryIt()
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

  return (
    <div className={styles.page}>
      {top}

      <div className={styles.media}>
        {e.images.length > 0 ? (
          e.images
            .slice(0, 2)
            .map((src, i) => (
              <ExercisePhoto
                key={src}
                path={src}
                className={styles.photo}
                data-shown={i === frame || undefined}
                alt={i === frame ? `${e.name}, ${FRAMES[i]!.toLowerCase()} position` : ''}
                placeholderLabel={
                  i === frame ? `No photo: ${e.name}, ${FRAMES[i]!.toLowerCase()} position` : ''
                }
                aria-hidden={i !== frame || undefined}
              />
            ))
        ) : (
          <ImagePlaceholder className={styles.photo} data-shown label={`No photo for ${e.name}`} />
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
      <Tags exercise={e} best={best} />
      <Muscles exercise={e} className={styles.muscles} />
      <Steps exercise={e} />

      <div className={styles.bar}>
        <button type="button" className={styles.try} onClick={() => void tryIt(e, rest)}>
          Try it
        </button>
      </div>
    </div>
  )
}
