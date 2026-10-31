import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { useStorageStatus } from '../data/storage'
import { StorageError } from './ErrorScreen'
import { routes } from './routes'

const router = createBrowserRouter(routes)

export function App() {
  const storage = useStorageStatus((s) => s.status)
  if (storage === 'error') return <StorageError />
  return <RouterProvider router={router} />
}
