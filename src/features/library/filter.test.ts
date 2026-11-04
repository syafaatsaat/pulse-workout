import type { Exercise } from '../../data/exerciseTypes'
import { filterExercises, muscleLine, muscleSummary, parseEquipment } from './filter'

const ex = (id: string, extra: Partial<Exercise>): Exercise => ({
  id,
  name: id.replace(/_/g, ' '),
  level: 'beginner',
  equipment: 'body only',
  category: 'strength',
  primaryMuscles: ['chest'],
  secondaryMuscles: [],
  instructions: [],
  images: [],
  ...extra,
})

const ALL = [
  ex('Pushups', { secondaryMuscles: ['shoulders', 'triceps'] }),
  ex('Incline_Push-Up', {}),
  ex('Dumbbell_Bench_Press', { equipment: 'dumbbell' }),
  ex('Plank', { primaryMuscles: ['abdominals'] }),
  ex('Bodyweight_Squat', { primaryMuscles: ['quadriceps'] }),
  ex('Band_Pull_Apart', { primaryMuscles: ['shoulders'], equipment: 'bands' }),
  ex('Good_Morning', { primaryMuscles: ['hamstrings'], secondaryMuscles: ['lower back'] }),
]
const names = (list: Exercise[]) => list.map((e) => e.id)
const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1)

describe('filterExercises', () => {
  test('no filters: everything, A–Z', () => {
    expect(names(filterExercises(ALL, {}))).toEqual([
      'Band_Pull_Apart',
      'Bodyweight_Squat',
      'Dumbbell_Bench_Press',
      'Good_Morning',
      'Incline_Push-Up',
      'Plank',
      'Pushups',
    ])
  })

  test('muscle group matches primary muscles only', () => {
    expect(names(filterExercises(ALL, { group: 'Legs' }))).toEqual(['Bodyweight_Squat', 'Good_Morning'])
    expect(names(filterExercises(ALL, { group: 'Back' }))).toEqual([])
  })

  test('equipment', () => {
    expect(names(filterExercises(ALL, { equipment: ['dumbbell', 'bands'] }))).toEqual([
      'Band_Pull_Apart',
      'Dumbbell_Bench_Press',
    ])
  })

  test('search: every word must appear in the name, muscles or equipment; hyphens and case ignored', () => {
    expect(names(filterExercises(ALL, { query: 'push-up' }))).toEqual(['Incline_Push-Up', 'Pushups'])
    expect(names(filterExercises(ALL, { query: 'incline push' }))).toEqual(['Incline_Push-Up'])
    expect(names(filterExercises(ALL, { query: 'PUSH' }))).toEqual(['Incline_Push-Up', 'Pushups'])
    expect(names(filterExercises(ALL, { query: 'triceps' }))).toEqual(['Pushups'])
    expect(names(filterExercises(ALL, { query: 'chest dumbbell' }))).toEqual(['Dumbbell_Bench_Press'])
  })

  test('filters combine', () => {
    expect(names(filterExercises(ALL, { group: 'Chest', equipment: ['body only'], query: 'push' }))).toEqual([
      'Incline_Push-Up',
      'Pushups',
    ])
  })
})

test('muscleLine: first primary, first secondary and the level, sentence case', () => {
  expect(muscleLine(ALL[0]!)).toBe(`Chest, shoulders · ${cap(ALL[0]!.level)}`)
  expect(muscleLine(ALL[1]!)).toBe(`Chest · ${cap(ALL[1]!.level)}`)
  expect(muscleLine(ALL[6]!)).toBe(`Hamstrings, lower back · ${cap(ALL[6]!.level)}`)
})

test('muscleSummary: primary, then "also" the secondaries joined with "and"', () => {
  expect(
    muscleSummary({ ...ALL[0]!, primaryMuscles: ['chest'], secondaryMuscles: ['shoulders', 'triceps'] }),
  ).toBe('Chest · also shoulders and triceps')
  expect(muscleSummary({ ...ALL[0]!, primaryMuscles: ['chest'], secondaryMuscles: [] })).toBe('Chest')
})

test('parseEquipment drops unknown values; empty means all', () => {
  expect(parseEquipment('dumbbell,bands,anvil')).toEqual(['dumbbell', 'bands'])
  expect(parseEquipment(null)).toEqual([])
})
