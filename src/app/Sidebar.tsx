import { NavLink } from 'react-router'
import { NAV_ITEMS } from './nav'
import { NavIcon } from './NavIcon'
import styles from './Sidebar.module.css'

/**
 * Desktop sidebar (GD-Today): ring logo + Pulse wordmark, then the nav; the current page is an
 * ink pill. The weekly goal lives in Today's header, as in the mock-up.
 */
export function Sidebar() {
  return (
    <nav aria-label="Main" className={styles.sidebar}>
      <div className={styles.brand}>
        {/* Ring logo: ember dot inside two fading rings. */}
        <svg className={styles.mark} width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
          <circle cx="13" cy="13" r="4" fill="currentColor" />
          <circle cx="13" cy="13" r="8" fill="none" stroke="currentColor" strokeOpacity="0.5" />
          <circle cx="13" cy="13" r="12" fill="none" stroke="currentColor" strokeOpacity="0.25" />
        </svg>
        <span className={styles.wordmark}>Pulse</span>
      </div>
      {NAV_ITEMS.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.to === '/'} className={styles.item}>
          <NavIcon d={item.icon} />
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
