import { clock, elapsed, timer } from './format'

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

test('player timers are always MM:SS and round up', () => {
  expect(timer(5_000)).toBe('00:05')
  expect(timer(4_001)).toBe('00:05')
  expect(timer(0)).toBe('00:00')
  expect(timer(-50)).toBe('00:00')
  expect(timer(90_000)).toBe('01:30')
  expect(timer(5_400_000)).toBe('90:00')
})
