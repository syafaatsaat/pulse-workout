import { liveQuery } from 'dexie'
import { useEffect, useState } from 'react'

/**
 * Subscribe to a Dexie query; re-renders when the underlying tables change.
 * Returns undefined until the first result. (Small stand-in for dexie-react-hooks.)
 */
export function useLiveQuery<T>(query: () => Promise<T> | T, deps: unknown[] = []): T | undefined {
  const [value, setValue] = useState<T>()
  useEffect(() => {
    const sub = liveQuery(query).subscribe({ next: setValue, error: console.error })
    return () => sub.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return value
}
