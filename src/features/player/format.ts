/** 83_000 → "1:23". Rounds up so a countdown shows 0:01 until it really hits zero. */
export function clock(ms: number): string {
  const total = Math.ceil(Math.max(0, ms) / 1000)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

/** Elapsed time rounds down: 11:42. */
export function elapsed(ms: number): string {
  const total = Math.floor(Math.max(0, ms) / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = String(total % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`
}

/** Seconds as the player writes them: 40 → "0:40". */
export const seconds = (s: number) => clock(s * 1000)
