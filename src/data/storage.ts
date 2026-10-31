import { create } from 'zustand'

/** Whether IndexedDB opened and the demo data is in place. Set once at startup by main.tsx. */
export const useStorageStatus = create<{ status: 'loading' | 'ready' | 'error' }>(() => ({
  status: 'loading',
}))
