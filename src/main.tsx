import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/fonts'
import './styles/tokens.css'
import './styles/base.css'
import { App } from './app/App'
import { ensureSeeded } from './data/seed'

// Seed demo data on first visit; screens read Dexie live, so they fill in when it lands.
ensureSeeded().catch(console.error)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
