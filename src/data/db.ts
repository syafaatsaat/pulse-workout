import Dexie, { type EntityTable } from 'dexie'
import type { Exercise, Session, Settings, Workout } from './types'

export const db = new Dexie('field-manual') as Dexie & {
  exercises: EntityTable<Exercise, 'id'>
  workouts: EntityTable<Workout, 'id'>
  sessions: EntityTable<Session, 'id'>
  settings: EntityTable<Settings, 'id'>
}

// Only indexed fields are listed; everything else is stored as-is.
db.version(1).stores({
  exercises: 'id, name, equipment, level, *primaryMuscles',
  workouts: 'id, name',
  sessions: 'id, workoutId, startedAt',
  settings: 'id',
})

export const DEFAULT_SETTINGS: Settings = {
  id: 'settings',
  defaultRest: 30,
  weeklyGoal: 4,
  beeps: true,
  wakeLock: true,
}
