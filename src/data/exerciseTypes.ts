// Shape of src/data/exercises.json, written by scripts/import-exercises.ts.

export type Equipment = 'body only' | 'bands' | 'dumbbell' | 'kettlebells'
export type Level = 'beginner' | 'intermediate' | 'expert'
export type Force = 'push' | 'pull' | 'static'
export type Mechanic = 'compound' | 'isolation'
export type Category = 'strength' | 'stretching' | 'plyometrics' | 'cardio'

export interface Exercise {
  id: string
  name: string
  level: Level
  /** Omitted when the source has no value. */
  force?: Force
  mechanic?: Mechanic
  equipment: Equipment
  category: Category
  primaryMuscles: string[]
  secondaryMuscles: string[]
  instructions: string[]
  /** Paths under /exercises/, e.g. "Pushups/0.webp" (start) and "Pushups/1.webp" (end). */
  images: string[]
  /**
   * A hold that takes a moment to set up (plank, side bridge, isometric holds): the player gives
   * it a 5 s "get into position" lead-in before the timer. Omitted = false.
   */
  needsSetup?: boolean
}
