import { Outlet } from 'react-router'
import { Sidebar } from './Sidebar'
import { TabBar } from './TabBar'
import styles from './Layout.module.css'

interface LayoutProps {
  /** Tab pages show the phone tab bar; pushed screens (e.g. exercise detail) don't. */
  tabBar?: boolean
}

/** App chrome: Sidebar at ≥1024px, bottom TabBar below. */
export function Layout({ tabBar = true }: LayoutProps) {
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
