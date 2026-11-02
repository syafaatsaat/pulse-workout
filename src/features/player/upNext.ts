import type { Exercise } from '../../data/types'
import type { Step } from '../../engine/compile'
import { timer } from './format'

export interface UpNextRow {
  name: string
  dose: string
}

/** "12 reps" / "00:40". */
export function dose(step: Step): string {
  return step.kind === 'work' && step.mode === 'reps' ? `${step.target} reps` : timer(step.target * 1000)
}

/**
 * The desktop "Coming up" list: the next `count` steps after `index`. During a rest, rests are
 * skipped (you're in one). A later set of the same move is named "Push-up · set 3".
 */
export function upNext(
  steps: Step[],
  index: number,
  exercises: Map<string, Exercise>,
  count = 3,
): UpNextRow[] {
  const resting = steps[index]?.kind === 'rest'
  return steps
    .slice(index + 1)
    .filter((s) => !resting || s.kind === 'work')
    .slice(0, count)
    .map((s) => ({
      name:
        s.kind === 'rest'
          ? 'Rest'
          : `${exercises.get(s.exerciseId)?.name ?? s.exerciseId}${s.setIndex > 0 ? ` · set ${s.setIndex + 1}` : ''}`,
      dose: dose(s),
    }))
}
