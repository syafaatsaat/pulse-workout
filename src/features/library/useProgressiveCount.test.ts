import { act, renderHook } from '@testing-library/react'
import { FIRST_ROWS, MORE_ROWS, useProgressiveCount } from './useProgressiveCount'

// A stand-in IntersectionObserver: `scrollNear()` tells every observer its sentinel is in range.
let observers: { cb: IntersectionObserverCallback; root: Element | null; margin: string }[] = []
beforeEach(() => {
  observers = []
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      cb: IntersectionObserverCallback
      constructor(cb: IntersectionObserverCallback, opts: IntersectionObserverInit = {}) {
        this.cb = cb
        observers.push({ cb, root: (opts.root as Element) ?? null, margin: opts.rootMargin ?? '' })
      }
      observe() {}
      disconnect() {
        observers = observers.filter((o) => o.cb !== this.cb)
      }
    },
  )
})
afterEach(() => vi.unstubAllGlobals())

const scrollNear = () =>
  act(() => {
    for (const o of [...observers]) o.cb([{ isIntersecting: true } as IntersectionObserverEntry], {} as never)
  })

function setup(total: number, min = 0, key = 'a', root: Element | null = null) {
  const sentinel = { current: document.createElement('div') }
  const rootRef = { current: root }
  return renderHook(({ k }) => useProgressiveCount(total, min, k, sentinel, rootRef), {
    initialProps: { k: key },
  })
}

test('renders a screenful, and nothing more until the user scrolls near the end', () => {
  const { result } = setup(200)
  expect(result.current).toBe(FIRST_ROWS)
  expect(observers).toHaveLength(1)
})

test('each time the end of the list comes near, another chunk renders, up to the total', () => {
  const { result } = setup(60)
  scrollNear()
  expect(result.current).toBe(FIRST_ROWS + MORE_ROWS)
  scrollNear()
  scrollNear()
  expect(result.current).toBe(60)
  expect(observers).toHaveLength(0)
})

test('never more than the total', () => {
  expect(setup(5).result.current).toBe(5)
})

test('starts again from a screenful when the filters change', () => {
  const { result, rerender } = setup(200)
  scrollNear()
  expect(result.current).toBeGreaterThan(FIRST_ROWS)
  rerender({ k: 'b' })
  expect(result.current).toBe(FIRST_ROWS)
})

test('renders at least `min` rows at once, e.g. down to the selected one', () => {
  expect(setup(378, 300).result.current).toBe(300)
})

test('watches the given scroll container, with a margin so rows are ready before they show', () => {
  const pane = document.createElement('section')
  setup(200, 0, 'a', pane)
  expect(observers[0]).toMatchObject({ root: pane })
  expect(observers[0]!.margin).toMatch(/px/)
})

test('without IntersectionObserver, renders the whole list', () => {
  vi.stubGlobal('IntersectionObserver', undefined)
  expect(setup(200).result.current).toBe(200)
})
