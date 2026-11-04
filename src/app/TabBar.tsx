import { NavLink } from 'react-router'
import { NAV_ITEMS } from './nav'
import { NavIcon } from './NavIcon'
import styles from './TabBar.module.css'

/** Floating pill tab bar (G-Today). Icon-only; each link is named by its aria-label. */
export function TabBar() {
  return (
    <nav aria-label="Main" className={styles.bar}>
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          viewTransition
          aria-label={item.label}
          className={styles.item}
        >
          <NavIcon d={item.icon} size={22} />
          <span className={styles.dot} aria-hidden="true" />
        </NavLink>
      ))}
    </nav>
  )
}
