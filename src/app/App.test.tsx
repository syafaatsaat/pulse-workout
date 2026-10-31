import 'fake-indexeddb/auto'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from './routes'

function renderAt(path: string) {
  render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: [path] })} />)
}

test('tab pages render the main nav with the current page marked', () => {
  renderAt('/log')
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Log')
  // Sidebar + TabBar both render; CSS decides which one shows.
  const current = screen.getAllByRole('link', { current: 'page' })
  expect(current.map((a) => a.textContent)).toEqual(['Log', 'Log'])
})

test('library detail is a push on phones: sidebar only, no tab bar', () => {
  renderAt('/library/Pushups')
  expect(screen.getAllByRole('navigation', { name: 'Main' })).toHaveLength(1)
})

test('player is full screen with no main nav', () => {
  renderAt('/session/abc')
  expect(screen.queryByRole('navigation', { name: 'Main' })).toBeNull()
})
