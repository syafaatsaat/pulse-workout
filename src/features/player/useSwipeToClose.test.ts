import { shouldClose } from './useSwipeToClose'

test('a long drag or a quick flick closes the sheet; a short slow drag springs back', () => {
  expect(shouldClose(200, 600)).toBe(true) // dragged well down, slowly
  expect(shouldClose(60, 80)).toBe(true) // short but fast: a flick
  expect(shouldClose(40, 400)).toBe(false) // small and slow
  expect(shouldClose(0, 10)).toBe(false)
  expect(shouldClose(-50, 10)).toBe(false) // upward
})
