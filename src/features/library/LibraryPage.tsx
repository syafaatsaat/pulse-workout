import { useDeferredValue, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { PageHeader } from '../../app/PageHeader'
import { ExercisePhoto } from '../../components/ExercisePhoto'
import { db } from '../../data/db'
import type { Equipment } from '../../data/exerciseTypes'
import { useLiveQuery } from '../../data/useLiveQuery'
import {
  EQUIPMENT,
  filterExercises,
  isMuscleGroup,
  levelBadge,
  MUSCLE_GROUPS,
  muscleLine,
  parseEquipment,
  type MuscleGroup,
} from './filter'
import styles from './LibraryPage.module.css'

const GROUPS = Object.keys(MUSCLE_GROUPS) as MuscleGroup[]
const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1)

export function LibraryPage() {
  // Filters live in the URL (?q=&muscle=&eq=) so Back from a detail page restores them.
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const muscle = params.get('muscle')
  const group = isMuscleGroup(muscle) ? muscle : undefined
  const equipment = parseEquipment(params.get('eq'))
  const [showEquipment, setShowEquipment] = useState(false)
  const exercises = useLiveQuery(() => db.exercises.toArray())
  const deferredQuery = useDeferredValue(query)

  const update = (key: string, value: string | undefined) =>
    setParams(
      (p) => {
        if (value) p.set(key, value)
        else p.delete(key)
        return p
      },
      { replace: true },
    )
  const toggleEquipment = (e: Equipment) => {
    const next = equipment.includes(e) ? equipment.filter((x) => x !== e) : [...equipment, e]
    update('eq', next.length === EQUIPMENT.length ? undefined : next.join(','))
  }

  const results = exercises ? filterExercises(exercises, { query: deferredQuery, group, equipment }) : []
  const equipmentText = equipment.length === 0 ? 'All equipment' : equipment.map(cap).join(', ')

  return (
    <>
      <PageHeader eyebrow="free-exercise-db" title="Library" />

      <div className={styles.searchRow}>
        <label className={styles.search}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="20" y1="20" x2="16" y2="16" />
          </svg>
          <span className="visually-hidden">Search exercises</span>
          <input
            type="search"
            value={query}
            placeholder={`Search ${exercises?.length ?? ''} exercises`}
            onChange={(e) => update('q', e.target.value)}
          />
        </label>
        <button
          type="button"
          className={styles.filterButton}
          data-active={equipment.length > 0 || undefined}
          aria-label={`Equipment filter: ${equipmentText}`}
          aria-expanded={showEquipment}
          aria-controls="library-equipment"
          onClick={() => setShowEquipment((v) => !v)}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M4 6h16M7 12h10M10 18h4" />
          </svg>
        </button>
      </div>

      {showEquipment && (
        <fieldset className={styles.equipment} id="library-equipment">
          <legend className="eyebrow">Equipment</legend>
          <div className={styles.chips}>
            {EQUIPMENT.map((e) => (
              <button
                key={e}
                type="button"
                className={styles.chip}
                aria-pressed={equipment.includes(e)}
                onClick={() => toggleEquipment(e)}
              >
                {cap(e)}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <div className={styles.muscles} role="group" aria-label="Muscle group">
        {[undefined, ...GROUPS].map((g) => (
          <button
            key={g ?? 'all'}
            type="button"
            className={styles.chip}
            aria-pressed={group === g}
            onClick={() => update('muscle', g)}
          >
            {g ?? 'All'}
          </button>
        ))}
      </div>

      <div className={styles.resultsHead}>
        <h2 className="eyebrow" aria-live="polite">
          {group ?? 'All muscles'} · {equipmentText} · {results.length}
        </h2>
        <span className={styles.sorted}>Sorted A–Z</span>
      </div>

      {exercises && results.length === 0 ? (
        <div className={styles.empty}>
          <p>No exercises match.</p>
          <button type="button" className={styles.clear} onClick={() => setParams({}, { replace: true })}>
            Clear search and filters
          </button>
        </div>
      ) : (
        <ul className={styles.results}>
          {results.map((e) => (
            <li key={e.id}>
              <Link to={`/library/${e.id}`} className={styles.row}>
                <ExercisePhoto
                  path={e.images[0]}
                  className={styles.thumb}
                  alt=""
                  width={52}
                  height={52}
                  loading="lazy"
                  decoding="async"
                />
                <span className={styles.text}>
                  <span className={styles.name}>{e.name}</span>
                  <span className={styles.meta}>{muscleLine(e)}</span>
                </span>
                <span className={styles.level} title={cap(e.level)}>
                  <span aria-hidden="true">{levelBadge(e.level)}</span>
                  <span className="visually-hidden">{e.level}</span>
                </span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  className={styles.chevron}
                  aria-hidden="true"
                >
                  <polyline points="9 6 15 12 9 18" />
                </svg>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
