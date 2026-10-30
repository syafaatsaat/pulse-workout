import { NavLink } from 'react-router'
import { Ring } from '../components/Ring'
import { NAV_ITEMS } from './nav'
import { NavIcon } from './NavIcon'
import styles from './Sidebar.module.css'

// Placeholder until engine/stats.ts (Day 4) derives it from sessions.
const WEEKLY_GOAL = { done: 2, goal: 4 }

export function Sidebar() {
  const { done, goal } = WEEKLY_GOAL
  return (
    <nav aria-label="Main" className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.mark} aria-hidden="true">
          FM
        </span>
        <span className={styles.wordmark}>Field Manual</span>
      </div>
      {NAV_ITEMS.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.to === '/'} className={styles.item}>
          <NavIcon d={item.icon} />
          {item.label}
        </NavLink>
      ))}
      <div className={styles.spacer} />
      <div className={styles.goal} role="img" aria-label={`Weekly goal: ${done} of ${goal} sessions`}>
        <Ring value={done} max={goal} size={44} />
        <div className={styles.goalText}>
          <span className={styles.goalLabel}>Weekly goal</span>
          <span className={styles.goalValue}>
            {done} of {goal} sessions
          </span>
        </div>
      </div>
    </nav>
  )
}
