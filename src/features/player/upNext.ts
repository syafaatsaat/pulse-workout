import type { Step } from '../../engine/compile'
import { timer } from './format'

/** A step's target as the player writes it: "12 reps" / "00:40". */
export function dose(step: Step): string {
  return step.kind === 'work' && step.mode === 'reps' ? `${step.target} reps` : timer(step.target * 1000)
}
