// Progress's ?month= search param, e.g. "2026-10". Month is 0-based in code, as in Date.

export interface YearMonth {
  year: number
  month: number
}

export const formatMonth = ({ year, month }: YearMonth) => `${year}-${String(month + 1).padStart(2, '0')}`

export const monthOf = (t: number): YearMonth => {
  const d = new Date(t)
  return { year: d.getFullYear(), month: d.getMonth() }
}

/** Parses "2026-10"; anything else falls back to `fallback`. */
export function parseMonth(param: string | null, fallback: YearMonth): YearMonth {
  const m = /^(\d{4})-(\d{2})$/.exec(param ?? '')
  const month = Number(m?.[2]) - 1
  if (!m || month < 0 || month > 11) return fallback
  return { year: Number(m[1]), month }
}

export const addMonths = ({ year, month }: YearMonth, n: number): YearMonth => {
  const d = new Date(year, month + n, 1)
  return { year: d.getFullYear(), month: d.getMonth() }
}
