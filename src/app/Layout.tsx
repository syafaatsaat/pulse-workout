import { Outlet, useMatch } from 'react-router'
import { Sidebar } from './Sidebar'
import { TabBar } from './TabBar'
import styles from './Layout.module.css'

/**
 * App chrome: Sidebar at ≥1024px, bottom TabBar below. Pushed screens (exercise detail) hide the
 * tab bar on phones; on desktop they are the Library's second pane.
 */
export function Layout() {
  const tabBar = useMatch('/library/:exerciseId') === null
  return (
    <div className={styles.shell} data-tabbar={tabBar}>
      <div className={styles.sidebar}>
        <Sidebar />
      </div>
      <main className={styles.main}>
        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
      {tabBar && (
        <div className={styles.tabbar}>
          <TabBar />
        </div>
      )}
    </div>
  )
}

/** Full-screen pushes with no chrome at any width (Player, Summary). */
export function FullScreen() {
  return (
    <main className={styles.fullscreen}>
      <Outlet />
    </main>
  )
}
