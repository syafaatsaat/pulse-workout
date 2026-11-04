import { create } from 'zustand'

export type ThemePref = 'light' | 'dark' | 'auto'

// Lives in localStorage, not the Dexie settings row: index.html must read it synchronously
// before first paint to avoid a theme flash, and IndexedDB is async.
// Keeps its Field Manual name: renaming it would reset existing visitors' theme choice.
export const THEME_KEY = 'fm-theme'

function readPref(): ThemePref {
  try {
    const v = localStorage.getItem(THEME_KEY)
    return v === 'light' || v === 'dark' ? v : 'auto'
  } catch {
    return 'auto'
  }
}

// 'auto' removes the attribute so tokens.css follows prefers-color-scheme.
export function applyTheme(pref: ThemePref) {
  const root = document.documentElement
  if (pref === 'auto') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', pref)
}

interface ThemeState {
  theme: ThemePref
  setTheme: (theme: ThemePref) => void
}

export const useTheme = create<ThemeState>((set) => ({
  theme: readPref(),
  setTheme: (theme) => {
    try {
      if (theme === 'auto') localStorage.removeItem(THEME_KEY)
      else localStorage.setItem(THEME_KEY, theme)
    } catch {
      // storage unavailable (private mode): theme still applies for this visit
    }
    applyTheme(theme)
    set({ theme })
  },
}))
