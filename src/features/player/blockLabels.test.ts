import { DEMO_WORKOUTS } from '../../data/demoWorkouts'
import { blockLabels } from './blockLabels'

test('Push & Core: letters for main blocks, ×N for uniform sets', () => {
  const w = DEMO_WORKOUTS.find((x) => x.id === 'push-and-core')!
  expect(blockLabels(w)).toEqual([
    { blockId: 'warm', label: 'Warm-up' },
    { blockId: 'a', label: 'A · Warm ×2' },
    { blockId: 'b', label: 'B · Main circuit ×4' },
    { blockId: 'c', label: 'C · Finisher ×3' },
    { blockId: 'cool', label: 'Cool-down' },
  ])
})

test('circuits show their rounds', () => {
  const w = DEMO_WORKOUTS.find((x) => x.id === 'full-body-20')!
  expect(blockLabels(w)).toEqual([{ blockId: 'a', label: 'A · Full body circuit ×3' }])
})
