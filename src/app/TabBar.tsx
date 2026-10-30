import { NavLink } from 'react-router'
import { NAV_ITEMS } from './nav'
import { NavIcon } from './NavIcon'
import styles from './TabBar.module.css'

export function TabBar() {
  return (
    <nav aria-label="Main" className={styles.bar}>
      {NAV_ITEMS.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.to === '/'} className={styles.item}>
          <span className={styles.pill}>
            <NavIcon d={item.icon} />
          </span>
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
