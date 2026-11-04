import type { RouteObject } from 'react-router'
import { TodayPage } from '../features/today/TodayPage'
import { RouteError } from './ErrorScreen'
import { FullScreen, Layout } from './Layout'
import { LogRedirect } from './LogRedirect'
import { NotFound } from './NotFound'

// Code splitting: Today (the landing page) and the shell are in the main bundle; every other
// screen is its own chunk, loaded on first visit. preloadRoutes() fetches them once the browser
// is idle, so Start and the tabs open instantly anyway.
const screens = {
  library: () => import('../features/library/LibraryRoute').then((m) => ({ Component: m.LibraryRoute })),
  progress: () => import('../features/progress/ProgressPage').then((m) => ({ Component: m.ProgressPage })),
  settings: () => import('../features/settings/SettingsPage').then((m) => ({ Component: m.SettingsPage })),
  player: () => import('../features/player/PlayerPage').then((m) => ({ Component: m.PlayerPage })),
  summary: () => import('../features/summary/SummaryPage').then((m) => ({ Component: m.SummaryPage })),
}

/** Warm the lazy screens' chunks after first paint, when the browser has nothing better to do. */
export function preloadRoutes(): void {
  const load = () => Object.values(screens).forEach((screen) => void screen().catch(() => {}))
  if ('requestIdleCallback' in window) window.requestIdleCallback(load, { timeout: 3000 })
  else setTimeout(load, 1500)
}

// Shown while a lazy screen loads on a direct visit (e.g. a bookmark to /progress): the app's
// background, so nothing flashes.
const blank = <div />

export const routes: RouteObject[] = [
  {
    element: <Layout />,
    errorElement: <RouteError />,
    hydrateFallbackElement: blank,
    children: [
      { index: true, element: <TodayPage /> },
      { path: 'library/:exerciseId?', lazy: screens.library },
      { path: 'progress', lazy: screens.progress },
      { path: 'log', element: <LogRedirect /> },
      { path: 'settings', lazy: screens.settings },
      { path: '*', element: <NotFound /> },
    ],
  },
  {
    element: <FullScreen />,
    errorElement: <RouteError />,
    hydrateFallbackElement: blank,
    children: [
      { path: 'session/:id', lazy: screens.player },
      { path: 'session/:id/summary', lazy: screens.summary },
    ],
  },
]
