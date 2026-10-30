/**
 * Imports free-exercise-db (Unlicense) into src/data/exercises.json + public/exercises/<id>/<n>.webp.
 *
 *   npm run import:exercises            # full import
 *   npm run import:exercises -- --list  # print the kept ids/names only, no images
 *
 * Downloads are cached in .cache/free-exercise-db so re-runs are fast.
 */
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import type { Category, Equipment, Exercise, Force, Level, Mechanic } from '../src/data/exerciseTypes.ts'
import overrides from './exercise-overrides.json' with { type: 'json' }

// Pinned so the import is reproducible. Bump deliberately.
const COMMIT = 'f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5'
const RAW = `https://raw.githubusercontent.com/yuhonas/free-exercise-db/${COMMIT}`

const ROOT = path.resolve(import.meta.dirname, '..')
const CACHE = path.join(ROOT, '.cache/free-exercise-db', COMMIT)
const OUT_JSON = path.join(ROOT, 'src/data/exercises.json')
const OUT_IMAGES = path.join(ROOT, 'public/exercises')

const IMAGE_WIDTH = 600
const WEBP_QUALITY = 72
const CONCURRENCY = 8

interface SourceExercise {
  id: string
  name: string
  force: string | null
  level: string
  mechanic: string | null
  equipment: string | null
  primaryMuscles: string[]
  secondaryMuscles: string[]
  instructions: string[]
  category: string
  images: string[]
}

const HOME_EQUIPMENT = new Set<string>(['body only', 'bands', 'dumbbell', 'kettlebells'])
const HOME_CATEGORIES = new Set<string>(['strength', 'stretching', 'plyometrics', 'cardio'])
// Moves that need gear a home gym rarely has, even when tagged "body only" / missing.
const NEEDS_GEAR =
  /pull-?up|chin|muscle.?up|hang|parallel.?bar|rings?\b|suspend|sled|box|smith|machine|cable|plate|chain|barbell|rope|harness|smr|dips_-_|glute.ham|gironda|handstand|preacher|exercise_ball/i

const include = new Set(overrides.include)
const exclude = new Set(overrides.exclude)
const rename: Record<string, string> = overrides.rename
const equipmentOverride: Record<string, Equipment> = overrides.equipment as Record<string, Equipment>

function keep(ex: SourceExercise): boolean {
  if (exclude.has(ex.id)) return false
  if (include.has(ex.id)) return true
  if (!HOME_CATEGORIES.has(ex.category)) return false
  if (NEEDS_GEAR.test(ex.id)) return false
  return ex.equipment === null || HOME_EQUIPMENT.has(ex.equipment)
}

function clean(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

function normalise(ex: SourceExercise): Exercise {
  // Missing or "other" equipment on a kept move means no equipment (floor, wall, chair).
  const equipment =
    equipmentOverride[ex.id] ??
    (ex.equipment && HOME_EQUIPMENT.has(ex.equipment) ? (ex.equipment as Equipment) : 'body only')
  return {
    id: ex.id,
    name: rename[ex.id] ?? clean(ex.name),
    level: ex.level as Level,
    ...(ex.force ? { force: ex.force as Force } : {}),
    ...(ex.mechanic ? { mechanic: ex.mechanic as Mechanic } : {}),
    equipment,
    category: ex.category as Category,
    primaryMuscles: ex.primaryMuscles ?? [],
    secondaryMuscles: ex.secondaryMuscles ?? [],
    instructions: (ex.instructions ?? []).map(clean).filter(Boolean),
    images: (ex.images ?? []).map((p) => p.replace(/\.(jpe?g|png)$/i, '.webp')),
  }
}

async function cached(rel: string): Promise<Buffer> {
  const file = path.join(CACHE, rel)
  try {
    return await readFile(file)
  } catch {
    const res = await fetch(`${RAW}/${rel}`)
    if (!res.ok) throw new Error(`GET ${rel}: ${res.status}`)
    const buf = Buffer.from(await res.arrayBuffer())
    await mkdir(path.dirname(file), { recursive: true })
    await writeFile(file, buf)
    return buf
  }
}

async function pool<T>(items: T[], n: number, fn: (item: T) => Promise<void>) {
  let next = 0
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (next < items.length) await fn(items[next++]!)
    }),
  )
}

async function main() {
  const listOnly = process.argv.includes('--list')
  const source = JSON.parse((await cached('dist/exercises.json')).toString('utf8')) as SourceExercise[]
  const kept = source.filter(keep).map(normalise)
  kept.sort((a, b) => a.name.localeCompare(b.name))

  const missing = overrides.include.filter((id) => !source.some((ex) => ex.id === id))
  if (missing.length) console.warn(`Unknown ids in overrides.include: ${missing.join(', ')}`)

  if (listOnly) {
    for (const ex of kept) console.log(`${ex.equipment.padEnd(12)} ${ex.category.padEnd(12)} ${ex.id}`)
    console.log(`\n${kept.length} of ${source.length} exercises kept`)
    return
  }

  await rm(OUT_IMAGES, { recursive: true, force: true })
  const jobs = kept.flatMap((ex) => ex.images.map((webp) => ({ webp, jpg: webp.replace(/\.webp$/, '.jpg') })))
  let bytes = 0
  let done = 0
  await pool(jobs, CONCURRENCY, async ({ webp, jpg }) => {
    const input = await cached(`exercises/${jpg}`)
    const out = path.join(OUT_IMAGES, webp)
    await mkdir(path.dirname(out), { recursive: true })
    await sharp(input)
      .resize({ width: IMAGE_WIDTH, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toFile(out)
    bytes += (await stat(out)).size
    if (++done % 100 === 0) console.log(`  ${done}/${jobs.length} images`)
  })

  await writeFile(OUT_JSON, JSON.stringify(kept, null, 2) + '\n')
  const jsonBytes = (await stat(OUT_JSON)).size
  console.log(`${kept.length} of ${source.length} exercises kept`)
  console.log(`${jobs.length} images, ${(bytes / 1024 / 1024).toFixed(1)} MB WebP`)
  console.log(`exercises.json ${(jsonBytes / 1024).toFixed(0)} KB`)
}

main().catch((err: unknown) => {
  console.error(err)
  process.exit(1)
})
