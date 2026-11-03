import type { Block, Exercise, ItemMode, Workout } from '../data/types'

/**
 * One entry of the compiled timeline. The player, the session bar, the time estimate and the
 * summary all read this one flat array.
 */
export interface Step {
  kind: 'work' | 'rest'
  /** Work: the move. Rest: the move whose set just finished. */
  exerciseId: string
  /** 0-based set of the move (a circuit's round). Rest: the set just finished. */
  setIndex: number
  setCount: number
  /** Work: reps or seconds (see mode). Rest: seconds. */
  target: number
  /** Planned length; for reps an estimate from the tempo. */
  durationMs: number
  /** Rest is always 'time'. */
  mode: ItemMode
  blockId: string
  phase: 'warmup' | 'main' | 'cooldown'
  /** 0-based position of the move in the workout ("Move 4 of 9"). */
  moveIndex: number
  tempo?: string
  /** Timed work on a move that needs setting up (a plank): a 5 s lead-in runs before its timer. */
  needsSetup?: boolean
}

/** Per-rep estimate when an item has no tempo. */
export const REP_MS_DEFAULT = 3000

/** "2·0·1" → 3000 ms per rep. Accepts ·, -, : or spaces between phases. */
export function tempoMs(tempo: string | undefined): number {
  if (!tempo) return REP_MS_DEFAULT
  const parts = tempo.split(/[·\-:\s]+/).map(Number)
  if (parts.length === 0 || parts.some((n) => !Number.isFinite(n))) return REP_MS_DEFAULT
  const sum = parts.reduce((a, b) => a + b, 0)
  return sum > 0 ? sum * 1000 : REP_MS_DEFAULT
}

/** Number of moves (items) in the workout, warm-up and cool-down included. */
export function moveCount(workout: Workout): number {
  return workout.blocks.reduce((n, b) => n + b.items.length, 0)
}

/**
 * Turns a workout into a flat timeline. `exercises` supplies each move's needsSetup flag; without
 * it no step gets a lead-in (fine for anything that only needs the shape, like the session bar).
 * - straight block: every set of a move, then the next move.
 * - circuit block: one set of each move per round; `rounds` is the set count.
 * Each work step is followed by its item's rest (if > 0), except the very last step.
 */
export function compile(
  workout: Workout,
  exercises?: ReadonlyMap<string, Pick<Exercise, 'needsSetup'> | undefined>,
): Step[] {
  const steps: Step[] = []
  let moveBase = 0

  for (const block of workout.blocks) {
    const phase: Step['phase'] = block.phase ?? 'main'
    for (const { item, itemIndex, setIndex, setCount } of order(block)) {
      const base = { exerciseId: item.exerciseId, setIndex, setCount, blockId: block.id, phase }
      const moveIndex = moveBase + itemIndex
      steps.push({
        ...base,
        kind: 'work',
        target: item.target,
        durationMs: item.mode === 'time' ? item.target * 1000 : item.target * tempoMs(item.tempo),
        mode: item.mode,
        moveIndex,
        ...(item.tempo ? { tempo: item.tempo } : {}),
        ...(item.mode === 'time' && exercises?.get(item.exerciseId)?.needsSetup ? { needsSetup: true } : {}),
      })
      if (item.restAfter > 0) {
        steps.push({
          ...base,
          kind: 'rest',
          target: item.restAfter,
          durationMs: item.restAfter * 1000,
          mode: 'time',
          moveIndex,
        })
      }
    }
    moveBase += block.items.length
  }

  if (steps.at(-1)?.kind === 'rest') steps.pop()
  return steps
}

function* order(block: Block) {
  if (block.type === 'circuit') {
    for (let r = 0; r < block.rounds; r++) {
      for (const [itemIndex, item] of block.items.entries()) {
        yield { item, itemIndex, setIndex: r, setCount: block.rounds }
      }
    }
  } else {
    for (const [itemIndex, item] of block.items.entries()) {
      for (let s = 0; s < item.sets; s++) yield { item, itemIndex, setIndex: s, setCount: item.sets }
    }
  }
}

/** "Get into position" countdown the player runs before a timed set flagged needsSetup. */
export const LEAD_IN_MS = 5000

/** Planned total length of a timeline, including the lead-ins of the steps that have one. */
export function estimateMs(steps: Step[]): number {
  return steps.reduce((ms, s) => ms + s.durationMs + (s.needsSetup ? LEAD_IN_MS : 0), 0)
}
