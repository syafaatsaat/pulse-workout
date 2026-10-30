import { clock, elapsed } from './format'

test('countdown clock rounds up', () => {
  expect(clock(24_000)).toBe('0:24')
  expect(clock(23_001)).toBe('0:24')
  expect(clock(0)).toBe('0:00')
  expect(clock(240_000)).toBe('4:00')
})

test('elapsed rounds down and grows hours', () => {
  expect(elapsed(702_900)).toBe('11:42')
  expect(elapsed(3_723_000)).toBe('1:02:03')
})
