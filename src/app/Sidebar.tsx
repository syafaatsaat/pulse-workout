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
        {/* Ring logo (GD-Today): ember dot inside two fading rings. */}
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
      <div className={styles.spacer} />
      <div className={styles.goal} role="img" aria-label={`Weekly goal: ${done} of ${goal} sessions`}>
        <Ring value={done} max={goal} size={40} stroke={3} />
        <span className={styles.goalValue}>
          {done} of {goal} this week
        </span>
      </div>
    </nav>
  )
}
