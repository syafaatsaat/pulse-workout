import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/fonts'
import './styles/tokens.css'
import './styles/base.css'
import { App } from './app/App'
import { ensureSeeded } from './data/seed'
import { useStorageStatus } from './data/storage'

// Seed demo data on first visit; screens read Dexie live, so they fill in when it lands.
// If IndexedDB won't open (blocked storage, some private modes), App shows a message instead.
ensureSeeded()
  .then(() => useStorageStatus.setState({ status: 'ready' }))
  .catch((error: unknown) => {
    console.error(error)
    useStorageStatus.setState({ status: 'error' })
  })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
