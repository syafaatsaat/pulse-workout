import { addMonths, formatMonth, parseMonth } from './month'

const OCT = { year: 2026, month: 9 }

test('round-trips and falls back on junk', () => {
  expect(formatMonth(OCT)).toBe('2026-10')
  expect(parseMonth('2026-10', { year: 2000, month: 0 })).toEqual(OCT)
  expect(parseMonth('2026-13', OCT)).toEqual(OCT)
  expect(parseMonth(null, OCT)).toEqual(OCT)
})

test('addMonths crosses years', () => {
  expect(addMonths({ year: 2026, month: 11 }, 1)).toEqual({ year: 2027, month: 0 })
  expect(addMonths({ year: 2026, month: 0 }, -1)).toEqual({ year: 2025, month: 11 })
})
