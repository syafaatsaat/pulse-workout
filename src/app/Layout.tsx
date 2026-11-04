import { Outlet, useMatch } from 'react-router'
import { Rings } from '../components/Rings'
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
      {/* Page-corner rings: G-* (phone) and GD-* (desktop) sizes. */}
      <Rings
        className={styles.ringsPhone}
        radii={[40, 80, 120, 160, 200]}
        startOpacity={0.09}
        step={0.015}
        color="var(--ring)"
        size={420}
      />
      <Rings
        className={styles.ringsDesk}
        radii={[60, 120, 180, 240, 300]}
        startOpacity={0.08}
        step={0.014}
        color="var(--ring)"
        size={640}
      />
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
    <main className={styles.fullscreen} data-fullscreen>
      <Outlet />
    </main>
  )
}
