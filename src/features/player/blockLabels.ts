import type { Workout } from '../../data/types'

/**
 * Labels under the desktop session bar: main blocks lettered A, B, C…, with ×N when every move in
 * the block runs N sets (a circuit: N rounds). Warm-up / cool-down keep their names.
 */
export function blockLabels(workout: Workout): { blockId: string; label: string }[] {
  let letter = 0
  return workout.blocks.map((block) => {
    if (block.phase) return { blockId: block.id, label: block.name }
    const sets = block.type === 'circuit' ? [block.rounds] : [...new Set(block.items.map((i) => i.sets))]
    const times = sets.length === 1 && sets[0]! > 1 ? ` ×${sets[0]}` : ''
    return { blockId: block.id, label: `${String.fromCharCode(65 + letter++)} · ${block.name}${times}` }
  })
}
