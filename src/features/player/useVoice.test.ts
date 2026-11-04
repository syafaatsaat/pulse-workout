import { renderHook } from '@testing-library/react'
import type { Step } from '../../engine/compile'
import { initPlayer, playerReducer, type PlayerState } from '../../engine/playerReducer'
import { useVoice } from './useVoice'
import { speak } from './voice'

vi.mock('./voice', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./voice')>()),
  speak: vi.fn(),
}))

const base = { setCount: 2, blockId: 'a', phase: 'main', moveIndex: 0 } as const
const STEPS: Step[] = [
  { ...base, kind: 'work', exerciseId: 'Pushups', setIndex: 0, target: 12, durationMs: 36_000, mode: 'reps' },
  { ...base, kind: 'rest', exerciseId: 'Pushups', setIndex: 0, target: 30, durationMs: 30_000, mode: 'time' },
]
const NOW = 1_000_000
const started = () => playerReducer(initPlayer(STEPS), { type: 'start', now: NOW })

type Props = { state: PlayerState; enabled: boolean | undefined }
const render = (initial: Props) =>
  renderHook(({ state, enabled }: Props) => useVoice(state, enabled), { initialProps: initial })

beforeEach(() => vi.mocked(speak).mockClear())

test('the first "Go" waits for settings that are still loading, instead of being lost', () => {
  // The player starts on mount; Voice cues is read from IndexedDB a moment later.
  const state = started()
  const { rerender } = render({ state, enabled: undefined })
  expect(speak).not.toHaveBeenCalled()
  rerender({ state, enabled: true })
  expect(vi.mocked(speak).mock.calls).toEqual([['Go']])
})

test('pausing and resuming do not repeat the cue; the next step gets its own', () => {
  let state = started()
  const { rerender } = render({ state, enabled: true })
  state = playerReducer(state, { type: 'pause', now: NOW + 1000 })
  rerender({ state, enabled: true })
  state = playerReducer(state, { type: 'resume', now: NOW + 2000 })
  rerender({ state, enabled: true })
  state = playerReducer(state, { type: 'setDone', now: NOW + 3000 })
  rerender({ state, enabled: true })
  expect(vi.mocked(speak).mock.calls).toEqual([['Go'], ['Set done. Rest']])
})

test('voice cues off: nothing is said', () => {
  render({ state: started(), enabled: false })
  expect(speak).not.toHaveBeenCalled()
})
