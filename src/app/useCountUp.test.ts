import { renderHook } from '@testing-library/react'
import { useCountUp } from './useCountUp'

test('returns the target straight away when disabled', () => {
  expect(renderHook(() => useCountUp(214, 800, false)).result.current).toBe(214)
})

test('returns the target straight away without matchMedia (or under reduced motion)', () => {
  // jsdom has no matchMedia, like a browser that can't tell us motion is welcome.
  expect(renderHook(() => useCountUp(214, 800, true)).result.current).toBe(214)
})

test('counts up from 0 when motion is welcome, starting once enabled (data loaded)', () => {
  vi.stubGlobal('matchMedia', () => ({ matches: true }))
  try {
    const { result, rerender } = renderHook(({ on }) => useCountUp(214, 800, on), {
      initialProps: { on: false },
    })
    expect(result.current).toBe(214)
    rerender({ on: true })
    expect(result.current).toBe(0)
  } finally {
    vi.unstubAllGlobals()
  }
})
