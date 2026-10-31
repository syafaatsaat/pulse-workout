import type { RouteObject } from 'react-router'
import { LibraryRoute } from '../features/library/LibraryRoute'
import { LogPage } from '../features/log/LogPage'
import { PlayerPage } from '../features/player/PlayerPage'
import { SettingsPage } from '../features/settings/SettingsPage'
import { SummaryPage } from '../features/summary/SummaryPage'
import { TodayPage } from '../features/today/TodayPage'
import { RouteError } from './ErrorScreen'
import { FullScreen, Layout } from './Layout'
import { NotFound } from './NotFound'

export const routes: RouteObject[] = [
  {
    element: <Layout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <TodayPage /> },
      { path: 'library/:exerciseId?', element: <LibraryRoute /> },
      { path: 'log', element: <LogPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <NotFound /> },
    ],
  },
  {
    element: <FullScreen />,
    errorElement: <RouteError />,
    children: [
      { path: 'session/:id', element: <PlayerPage /> },
      { path: 'session/:id/summary', element: <SummaryPage /> },
    ],
  },
]
