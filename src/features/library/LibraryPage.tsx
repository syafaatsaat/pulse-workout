import { useDeferredValue, useEffect, useRef, useState, type Ref } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { PageHeader } from '../../app/PageHeader'
import { ExercisePhoto } from '../../components/ExercisePhoto'
import { Rings } from '../../components/Rings'
import { db } from '../../data/db'
import type { Equipment } from '../../data/exerciseTypes'
import type { Exercise } from '../../data/types'
import { useLiveQuery } from '../../data/useLiveQuery'
import { ExerciseDetailPane } from './ExerciseDetailPage'
import {
  EQUIPMENT,
  filterExercises,
  isMuscleGroup,
  MUSCLE_GROUPS,
  muscleLine,
  parseEquipment,
  type MuscleGroup,
} from './filter'
import styles from './LibraryPage.module.css'
import { useProgressiveCount } from './useProgressiveCount'

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
    /** Changes whenever the filters do: the list then renders from the top again. */
    listKey: `${deferredQuery}|${group ?? ''}|${equipment.join(',')}`,
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
  showEquipment,
  onToggleEquipment,
}: {
  lib: Library
  inputRef?: Ref<HTMLInputElement>
  hint?: boolean
  showEquipment: boolean
  onToggleEquipment: () => void
}) {
  return (
    <div className={styles.search}>
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <line x1="20" y1="20" x2="16" y2="16" />
      </svg>
      <input
        ref={inputRef}
        type="search"
        value={lib.query}
        aria-label="Search exercises"
        placeholder="Search exercises"
        aria-keyshortcuts={hint ? '/' : undefined}
        onChange={(e) => lib.update('q', e.target.value)}
      />
      {hint && (
        <kbd className={styles.kbd} aria-hidden="true">
          /
        </kbd>
      )}
      <button
        type="button"
        className={styles.filterButton}
        data-active={lib.equipment.length > 0 || undefined}
        aria-label={`Equipment filter: ${lib.equipmentText}`}
        aria-expanded={showEquipment}
        aria-controls="library-equipment"
        onClick={onToggleEquipment}
      >
        <svg
          width="16"
          height="16"
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
    <fieldset className={styles.equipment} id="library-equipment">
      <legend className={styles.legend}>Equipment</legend>
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
    </fieldset>
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

/** Thumbnail: the start photo, or rings + a figure when there is none. */
function Thumb({ e }: { e: Exercise }) {
  return (
    <span className={styles.thumb} aria-hidden="true">
      <Rings radii={[12, 20]} size={56} startOpacity={0.06} step={0.02} color="var(--ring)" />
      <ExercisePhoto
        path={e.images[0]}
        className={styles.thumbPhoto}
        placeholderClassName={styles.thumbPlaceholder}
        alt=""
        width={56}
        height={56}
        loading="lazy"
        decoding="async"
      />
    </span>
  )
}

function RowContent({ e }: { e: Exercise }) {
  return (
    <>
      <Thumb e={e} />
      <span className={styles.text}>
        <span className={styles.name}>{e.name}</span>
        <span className={styles.meta}>{muscleLine(e)}</span>
      </span>
    </>
  )
}

function Chevron() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className={styles.chevron}
      aria-hidden="true"
    >
      <polyline points="9 6 15 12 9 18" />
    </svg>
  )
}

const countText = (lib: Library) =>
  `${lib.group ?? 'All muscles'} · ${lib.equipmentText} · ${lib.results.length} exercises`

/** G-Library: search pill (with the equipment filter), muscle chips, row cards pushing to the detail. */
export function LibraryPage() {
  const lib = useLibrary()
  const [showEquipment, setShowEquipment] = useState(false)
  const { exercises, results } = lib
  const count = useProgressiveCount(results.length, 0, lib.listKey)

  return (
    <>
      <PageHeader kicker={`${exercises?.length ?? ''} exercises`} title="Library" />
      <SearchField
        lib={lib}
        showEquipment={showEquipment}
        onToggleEquipment={() => setShowEquipment((v) => !v)}
      />
      {showEquipment && <EquipmentChips lib={lib} />}
      <MuscleChips lib={lib} className={styles.muscles} />
      <h2 className="visually-hidden" aria-live="polite">
        {countText(lib)}
      </h2>

      {exercises && results.length === 0 ? (
        <Empty lib={lib} />
      ) : (
        <ul className={styles.results}>
          {results.slice(0, count).map((e) => (
            <li key={e.id}>
              <Link to={`/library/${e.id}`} className={styles.row}>
                <RowContent e={e} />
                <Chevron />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

/**
 * GD-Library: list pane | detail pane. The selection lives in the URL (/library/:exerciseId),
 * with the filters carried along; /library alone shows the first result. "/" focuses search.
 */
export function LibraryTwoPane() {
  const lib = useLibrary()
  const { exerciseId } = useParams()
  const search = useRef<HTMLInputElement>(null)
  const [showEquipment, setShowEquipment] = useState(false)
  const { exercises, results, params } = lib
  const selected = exerciseId ?? results[0]?.id
  const qs = params.toString()
  // Render down to the selected row at once, so it can be scrolled into view.
  const count = useProgressiveCount(
    results.length,
    results.findIndex((e) => e.id === selected) + 1,
    lib.listKey,
  )

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
        <PageHeader kicker={`${exercises?.length ?? ''} exercises`} title="Library" />
        <SearchField
          lib={lib}
          inputRef={search}
          hint
          showEquipment={showEquipment}
          onToggleEquipment={() => setShowEquipment((v) => !v)}
        />
        {showEquipment && <EquipmentChips lib={lib} />}
        <MuscleChips lib={lib} className={styles.paneMuscles} />
        <h2 className="visually-hidden" aria-live="polite">
          {countText(lib)}
        </h2>
        {exercises && results.length === 0 ? (
          <Empty lib={lib} />
        ) : (
          <ul className={styles.paneResults} ref={list}>
            {results.slice(0, count).map((e) => (
              <li key={e.id}>
                <Link
                  to={`/library/${e.id}${qs ? `?${qs}` : ''}`}
                  className={styles.paneRow}
                  aria-current={e.id === selected ? 'page' : undefined}
                >
                  <RowContent e={e} />
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
