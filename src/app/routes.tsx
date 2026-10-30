import type { RouteObject } from 'react-router'
import { DebugPage } from '../features/debug/DebugPage'
import { ExerciseDetailPage } from '../features/library/ExerciseDetailPage'
import { LibraryPage } from '../features/library/LibraryPage'
import { LogPage } from '../features/log/LogPage'
import { PlayerPage } from '../features/player/PlayerPage'
import { SettingsPage } from '../features/settings/SettingsPage'
import { SummaryPage } from '../features/summary/SummaryPage'
import { TodayPage } from '../features/today/TodayPage'
import { FullScreen, Layout } from './Layout'
import { NotFound } from './NotFound'

export const routes: RouteObject[] = [
  {
    element: <Layout />,
    children: [
      { index: true, element: <TodayPage /> },
      { path: 'library', element: <LibraryPage /> },
      { path: 'log', element: <LogPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'debug', element: <DebugPage /> }, // temporary (Day 1)
      { path: '*', element: <NotFound /> },
    ],
  },
  {
    // Pushed screens: no tab bar on phone, sidebar stays on desktop.
    element: <Layout tabBar={false} />,
    children: [{ path: 'library/:exerciseId', element: <ExerciseDetailPage /> }],
  },
  {
    element: <FullScreen />,
    children: [
      { path: 'session/:id', element: <PlayerPage /> },
      { path: 'session/:id/summary', element: <SummaryPage /> },
    ],
  },
]
