import type { Step } from '../engine/compile'

/** Session bar segment weights from DESIGN_SYSTEM.md: work 3, rest 1, warm-up 4, cool-down 3. */
export function stepWeight(step: Step): number {
  if (step.phase === 'warmup') return 4
  if (step.phase === 'cooldown') return 3
  return step.kind === 'rest' ? 1 : 3
}
