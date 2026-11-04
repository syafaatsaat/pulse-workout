import { act, renderHook } from '@testing-library/react'
import { FIRST_ROWS, MORE_ROWS, useProgressiveCount } from './useProgressiveCount'

// jsdom has no requestIdleCallback, so the hook falls back to setTimeout.
beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

const flush = () => act(() => vi.runOnlyPendingTimers())

test('renders the first screenful, then grows a chunk at a time up to the total', () => {
  const { result } = renderHook(() => useProgressiveCount(200, 0, 'a'))
  expect(result.current).toBe(FIRST_ROWS)
  flush()
  expect(result.current).toBe(FIRST_ROWS + MORE_ROWS)
  for (let i = 0; i < 10; i++) flush()
  expect(result.current).toBe(200)
})

test('never more than the total', () => {
  expect(renderHook(() => useProgressiveCount(5, 0, 'a')).result.current).toBe(5)
})

test('starts again from the first screenful when the filters change', () => {
  const { result, rerender } = renderHook(({ k }) => useProgressiveCount(200, 0, k), {
    initialProps: { k: 'a' },
  })
  flush()
  flush()
  expect(result.current).toBeGreaterThan(FIRST_ROWS)
  rerender({ k: 'b' })
  expect(result.current).toBe(FIRST_ROWS)
})

test('renders at least `min` rows at once, e.g. down to the selected one', () => {
  const { result } = renderHook(() => useProgressiveCount(378, 300, 'a'))
  expect(result.current).toBe(300)
  flush()
  expect(result.current).toBe(300 + MORE_ROWS)
})
