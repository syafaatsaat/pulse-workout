import 'fake-indexeddb/auto'
import { render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from './routes'

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(<RouterProvider router={router} />)
  return router
}

test('tab pages render the main nav with the current page marked', async () => {
  renderAt('/progress')
  // Progress is a lazy chunk: it renders once loaded.
  expect((await screen.findByRole('heading', { level: 1 })).textContent).toBe('Progress')
  // Sidebar + TabBar both render; CSS decides which one shows. The tab bar is icon-only, so
  // its links are named by aria-label.
  expect(screen.getAllByRole('link', { current: 'page' })).toHaveLength(2)
  expect(screen.getAllByRole('link', { current: 'page', name: 'Progress' })).toHaveLength(2)
})

test('the old /log URL redirects to Progress, keeping the month', async () => {
  const router = createMemoryRouter(routes, { initialEntries: ['/log?month=2026-09'] })
  render(<RouterProvider router={router} />)
  expect(await screen.findByRole('heading', { level: 1, name: 'Progress' })).toBeTruthy()
  expect(router.state.location.pathname + router.state.location.search).toBe('/progress?month=2026-09')
})

test('library detail is a push on phones: sidebar only, no tab bar', async () => {
  renderAt('/library/Pushups')
  await waitFor(() => expect(screen.getAllByRole('navigation', { name: 'Main' })).toHaveLength(1))
})

test('player is full screen with no main nav', async () => {
  const router = renderAt('/session/abc')
  // The player is a lazy chunk: wait until it has loaded and rendered.
  await waitFor(() => expect(router.state.initialized).toBe(true))
  expect(screen.queryByRole('navigation', { name: 'Main' })).toBeNull()
})
