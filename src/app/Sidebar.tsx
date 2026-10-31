import { NavLink } from 'react-router'
import { Ring } from '../components/Ring'
import { NAV_ITEMS } from './nav'
import { NavIcon } from './NavIcon'
import { db, DEFAULT_SETTINGS } from '../data/db'
import { useLiveQuery } from '../data/useLiveQuery'
import { startOfWeek, weekProgress } from '../engine/stats'
import styles from './Sidebar.module.css'

/** Finished sessions this week against the weekly goal. */
async function weeklyGoal() {
  const now = Date.now()
  const [sessions, settings] = await Promise.all([
    db.sessions.where('startedAt').aboveOrEqual(startOfWeek(now).getTime()).toArray(),
    db.settings.get('settings'),
  ])
  return { done: weekProgress(sessions, now), goal: (settings ?? DEFAULT_SETTINGS).weeklyGoal }
}

export function Sidebar() {
  const { done, goal } = useLiveQuery(weeklyGoal) ?? { done: 0, goal: DEFAULT_SETTINGS.weeklyGoal }
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
