import type { Exercise } from './types'

/**
 * One-line form cues for the player, readable from the floor. free-exercise-db only has long
 * step-by-step instructions, so the demo workouts' moves get a hand-written cue; anything else
 * falls back to its first instruction sentence.
 */
const CUES: Record<string, string> = {
  Bench_Dips: 'Shoulders down, elbows point back',
  Bodyweight_Squat: 'Chest up, knees track over toes',
  Bodyweight_Walking_Lunge: 'Long stride, back knee just off the floor',
  Butt_Lift_Bridge: 'Drive through heels, squeeze at the top',
  Cat_Stretch: 'Move one vertebra at a time',
  Childs_Pose: 'Sink hips to heels, reach long',
  Crunches: 'Lower back stays down, chin off chest',
  Dead_Bug: 'Lower back pressed to the floor',
  Flutter_Kicks: 'Small kicks, lower back flat',
  Freehand_Jump_Squat: 'Land soft, straight into the next squat',
  Glute_Kickback: 'Hips square, squeeze at the top',
  Goblet_Squat: 'Weight at chest, elbows inside knees',
  Hamstring_Stretch: 'Hinge at the hips, back long',
  Hug_Knees_To_Chest: 'Relax the shoulders, breathe slow',
  Inchworm: 'Legs straight, walk the hands out',
  'Incline_Push-Up': 'Body in one line, chest to the edge',
  Kneeling_Hip_Flexor: 'Tuck the pelvis, lean forward gently',
  Mountain_Climbers: 'Hips level, shoulders over hands',
  Plank: 'Elbows under shoulders, body in one line',
  Pushups: 'Elbows at 45°, hips level',
  'Push-Ups_With_Feet_Elevated': 'Core tight, hips don’t sag',
  Reverse_Crunch: 'Curl the hips up, don’t swing',
  Russian_Twist: 'Rotate from the ribs, chest tall',
  Shoulder_Stretch: 'Shoulders down, away from the ears',
  Single_Leg_Glute_Bridge: 'Hips level, drive through the heel',
  Spinal_Stretch: 'Twist from the middle back, breathe out',
  Standing_Hip_Circles: 'Big slow circles, stand tall',
  'Step-up_with_Knee_Raise': 'Whole foot on the step, drive the knee',
  Superman: 'Lift chest and legs, neck long',
  Worlds_Greatest_Stretch: 'Elbow to instep, then rotate open',
}

export function formCue(exercise: Exercise | undefined): string | undefined {
  if (!exercise) return undefined
  const cue = CUES[exercise.id]
  if (cue) return cue
  const first = exercise.instructions[0]
  return first?.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? first
}
