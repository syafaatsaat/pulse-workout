import { useDeferredValue, useEffect, useRef, useState, type Ref } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { PageHeader } from '../../app/PageHeader'
import { ExercisePhoto } from '../../components/ExercisePhoto'
import { db } from '../../data/db'
import type { Equipment } from '../../data/exerciseTypes'
import type { Exercise } from '../../data/types'
import { useLiveQuery } from '../../data/useLiveQuery'
import { ExerciseDetailPane } from './ExerciseDetailPage'
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

/** Filters live in the URL (?q=&muscle=&eq=) so Back from a detail page restores them. */
function useLibrary() {
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const muscle = params.get('muscle')
  const group = isMuscleGroup(muscle) ? muscle : undefined
  const equipment = parseEquipment(params.get('eq'))
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

  return {
    params,
    query,
    group,
    equipment,
    exercises,
    results: exercises ? filterExercises(exercises, { query: deferredQuery, group, equipment }) : [],
    equipmentText: equipment.length === 0 ? 'All equipment' : equipment.map(cap).join(', '),
    update,
    toggleEquipment,
    clear: () => setParams({}, { replace: true }),
  }
}

type Library = ReturnType<typeof useLibrary>

function SearchField({
  lib,
  inputRef,
  hint,
}: {
  lib: Library
  inputRef?: Ref<HTMLInputElement>
  hint?: boolean
}) {
  return (
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
        ref={inputRef}
        type="search"
        value={lib.query}
        placeholder={`Search ${lib.exercises?.length ?? ''} exercises`}
        aria-keyshortcuts={hint ? '/' : undefined}
        onChange={(e) => lib.update('q', e.target.value)}
      />
      {hint && (
        <kbd className={styles.kbd} aria-hidden="true">
          /
        </kbd>
      )}
    </label>
  )
}

function MuscleChips({ lib, className }: { lib: Library; className?: string }) {
  return (
    <div className={className} role="group" aria-label="Muscle group">
      {[undefined, ...GROUPS].map((g) => (
        <button
          key={g ?? 'all'}
          type="button"
          className={styles.chip}
          aria-pressed={lib.group === g}
          onClick={() => lib.update('muscle', g)}
        >
          {g ?? 'All'}
        </button>
      ))}
    </div>
  )
}

function EquipmentChips({ lib }: { lib: Library }) {
  return (
    <div className={styles.chips}>
      {EQUIPMENT.map((e) => (
        <button
          key={e}
          type="button"
          className={styles.chip}
          aria-pressed={lib.equipment.includes(e)}
          onClick={() => lib.toggleEquipment(e)}
        >
          {cap(e)}
        </button>
      ))}
    </div>
  )
}

function Empty({ lib }: { lib: Library }) {
  return (
    <div className={styles.empty}>
      <p>No exercises match.</p>
      <button type="button" className={styles.clear} onClick={lib.clear}>
        Clear search and filters
      </button>
    </div>
  )
}

function RowContent({ e, chevron }: { e: Exercise; chevron: boolean }) {
  return (
    <>
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
      {chevron && (
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
      )}
    </>
  )
}

/** F-Library: search + filter button, scrolling muscle chips, results pushing to the detail page. */
export function LibraryPage() {
  const lib = useLibrary()
  const [showEquipment, setShowEquipment] = useState(false)
  const { equipment, equipmentText, exercises, results, group } = lib

  return (
    <>
      <PageHeader eyebrow="free-exercise-db" title="Library" />

      <div className={styles.searchRow}>
        <SearchField lib={lib} />
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
          <EquipmentChips lib={lib} />
        </fieldset>
      )}

      <MuscleChips lib={lib} className={styles.muscles} />

      <div className={styles.resultsHead}>
        <h2 className="eyebrow" aria-live="polite">
          {group ?? 'All muscles'} · {equipmentText} · {results.length}
        </h2>
        <span className={styles.sorted}>Sorted A–Z</span>
      </div>

      {exercises && results.length === 0 ? (
        <Empty lib={lib} />
      ) : (
        <ul className={styles.results}>
          {results.map((e) => (
            <li key={e.id}>
              <Link to={`/library/${e.id}`} className={styles.row}>
                <RowContent e={e} chevron />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

/**
 * DT-Library: list pane | detail pane. The selection lives in the URL (/library/:exerciseId),
 * with the filters carried along; /library alone shows the first result. "/" focuses search.
 */
export function LibraryTwoPane() {
  const lib = useLibrary()
  const { exerciseId } = useParams()
  const search = useRef<HTMLInputElement>(null)
  const { exercises, results, group, equipmentText, params } = lib
  const selected = exerciseId ?? results[0]?.id
  const qs = params.toString()

  // Keep the selected row in view, e.g. after opening /library/:id directly or using Back.
  const list = useRef<HTMLUListElement>(null)
  useEffect(() => {
    list.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: 'nearest' })
  }, [selected, results.length])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea, select, [contenteditable]'))
        return
      e.preventDefault()
      search.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className={styles.twoPane}>
      <section className={styles.listPane} aria-label="Exercise list">
        <PageHeader eyebrow="free-exercise-db" title="Library" />
        <div className={styles.paneSearch}>
          <SearchField lib={lib} inputRef={search} hint />
        </div>
        <fieldset className={styles.paneFilters}>
          <legend className="visually-hidden">Equipment</legend>
          <EquipmentChips lib={lib} />
        </fieldset>
        <MuscleChips lib={lib} className={styles.paneMuscles} />
        <h2 className="visually-hidden" aria-live="polite">
          {group ?? 'All muscles'} · {equipmentText} · {results.length} exercises
        </h2>
        {exercises && results.length === 0 ? (
          <Empty lib={lib} />
        ) : (
          <ul className={styles.paneResults} ref={list}>
            {results.map((e) => (
              <li key={e.id}>
                <Link
                  to={`/library/${e.id}${qs ? `?${qs}` : ''}`}
                  className={styles.paneRow}
                  aria-current={e.id === selected ? 'page' : undefined}
                >
                  <RowContent e={e} chevron={false} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <div className={styles.detailPane}>{selected && <ExerciseDetailPane exerciseId={selected} />}</div>
    </div>
  )
}
