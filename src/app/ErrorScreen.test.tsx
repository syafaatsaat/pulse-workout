import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { RouteError } from './ErrorScreen'

function Boom(): never {
  throw new Error('render failed')
}

test('a screen that throws shows the error screen with Reload and Today', () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  const router = createMemoryRouter([{ path: '/', element: <Boom />, errorElement: <RouteError /> }])
  render(<RouterProvider router={router} />)
  expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Reload' })).toBeTruthy()
  expect(screen.getByRole('link', { name: 'Go to Today' }).getAttribute('href')).toBe('/')
})
