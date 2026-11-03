import type { ReactNode } from 'react'
import { useRouteError } from 'react-router'
import styles from './ErrorScreen.module.css'

/** Full-page message for when the app can't carry on: storage blocked, or a screen crashed. */
export function ErrorScreen({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className={styles.screen}>
      <div className={styles.inner}>
        <span className="kicker">Field Manual</span>
        <h1 className="page-title">{title}</h1>
        {children}
        <div className={styles.actions}>
          <button type="button" className={styles.primary} onClick={() => window.location.reload()}>
            Reload
          </button>
          {/* A plain link: the router may be the thing that failed. */}
          <a href="/" className={styles.secondary}>
            Go to Today
          </a>
        </div>
      </div>
    </main>
  )
}

/** Router errorElement: a screen threw while rendering or loading. */
export function RouteError() {
  console.error(useRouteError())
  return (
    <ErrorScreen title="Something went wrong">
      <p className={styles.body}>
        This screen hit an error. Your logged sets are saved on this device, so reloading is safe.
      </p>
    </ErrorScreen>
  )
}

/** IndexedDB couldn't open, so nothing can be read or saved. */
export function StorageError() {
  return (
    <ErrorScreen title="Storage is blocked">
      <p className={styles.body}>
        Field Manual keeps workouts and your log on this device, in the browser's storage, and this browser
        won't open it. Private or incognito windows in some browsers do this, as does blocking site data in
        settings.
      </p>
      <p className={styles.body}>Try a normal window, or allow site data for this page, then reload.</p>
    </ErrorScreen>
  )
}
