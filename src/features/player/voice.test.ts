import type { Step } from '../../engine/compile'
import { stepCue } from './voice'

const step = (over: Partial<Step>): Step => ({
  kind: 'work',
  exerciseId: 'Pushups',
  setIndex: 0,
  setCount: 3,
  target: 10,
  durationMs: 30_000,
  mode: 'reps',
  blockId: 'a',
  phase: 'main',
  moveIndex: 0,
  ...over,
})

test('stepCue: Go on work, Get into position before a hold, Set done on rest and at the end', () => {
  expect(stepCue(step({}))).toBe('Go')
  expect(stepCue(step({ mode: 'time', needsSetup: true }))).toBe('Get into position')
  expect(stepCue(step({ kind: 'rest', mode: 'time' }))).toBe('Set done. Rest')
  expect(stepCue(undefined)).toBe('Set done')
})
