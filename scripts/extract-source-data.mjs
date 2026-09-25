#!/usr/bin/env node
// One-shot extraction of the exercise-library slice out of the source project.
//
// The source project is read-only reference material. This script never writes into it; it
// reads a small, audited set of modules and emits the deterministic JSON packs that this
// repository ships. Running it twice produces byte-identical output.
//
// Usage:
//   node scripts/extract-source-data.mjs [--source <dir>] [--out <dir>]
//
// Defaults: --source /root/.openclaw/workspace/cyber-gym/frontend/src --out src/data

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '..')

const arg = (name, fallback) => {
  const i = process.argv.indexOf(name)
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback
}

const SOURCE = resolve(arg('--source', '/root/.openclaw/workspace/cyber-gym/frontend/src'))
const OUT = resolve(repoRoot, arg('--out', 'src/data'))

const load = async rel => (await import(pathToFileURL(resolve(SOURCE, rel)).href))
const loadJson = rel => JSON.parse(readFileSync(resolve(SOURCE, rel), 'utf8'))

const writeJson = (name, value) => {
  const file = resolve(OUT, name)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, JSON.stringify(value, null, 0) + '\n')
  console.log(`wrote ${name}`)
}

// --- exercise catalogue ---------------------------------------------------------------
// EXDB is the generated dataset: id, English name, body part, equipment, target muscle,
// secondary muscles, English instruction steps, image and animation filenames. Only the
// fields this app renders or searches are kept; the English step text is dropped in favour
// of the complete Russian instruction pack.
const { EXDB } = await load('lib/exercises-data.js')

const rawFields = [...new Set(EXDB.flatMap(e => Object.keys(e)))].sort()
const EXPECTED = ['bp', 'eq', 'gif', 'id', 'img', 'mg', 'n', 'sm', 'st', 'tg']
if (JSON.stringify(rawFields) !== JSON.stringify(EXPECTED)) {
  throw new Error(`unexpected source catalogue fields: ${rawFields.join(',')}`)
}

// `st` (the English steps) is the only field dropped: this app renders the complete Russian
// instruction pack instead, so shipping a second copy of the same steps buys nothing.
const exercises = EXDB.map(({ id, n, bp, eq, tg, mg, sm, img, gif }) => ({
  id, n, bp, eq, tg, mg, sm: Array.isArray(sm) ? sm : (sm ? [sm] : []), img, gif
}))

// --- muscle overlays ------------------------------------------------------------------
// ExRx-informed corrections applied as a runtime overlay over the generated catalogue. They
// carry canonical muscle vocabulary already ('gluteal', 'lower-back', ...), so they are
// merged verbatim and only ever override primaries/secondaries/body part.
const b1 = loadJson('lib/exercise-muscle-batch-1.json')
const b2 = loadJson('lib/exercise-muscle-batch-2.json')
const ol = loadJson('lib/exercise-muscle-olympic.json')

const overlays = {}
for (const [id, meta] of [...Object.entries(b1), ...Object.entries(ol), ...Object.entries(b2)]) {
  overlays[id] = { ...(overlays[id] || {}), ...meta }
}

// --- Russian instruction pack ---------------------------------------------------------
const instructionsRu = (await load('instr/ru.js')).default

// --- Russian facet vocabulary ---------------------------------------------------------
// The source locale pack is a flat { english: russian } map. Only the strings this app
// actually shows are pulled out of it, so no unrelated vocabulary travels with the slice.
const ru = (await load('locales/ru.js')).default

// A handful of strings the app renders are not in the source locale pack at all, because the
// source only ever sees them through an overlay. Each one is listed explicitly here rather
// than silently falling back to English, and anything else missing still fails the build.
const EXTRA_FACETS = {
  bodyParts: { 'full body': 'всё тело' }
}

// Body parts from the *effective* catalogue (raw + overlay), which is what the UI filters on.
const BODY_PARTS = [...new Set(exercises.map(e => overlays[e.id]?.bp || e.bp))].sort()
const EQUIPMENT = [...new Set(exercises.map(e => e.eq))].sort()

// Canonical muscle vocabulary, mirroring the source muscle map so the same strings resolve.
const MUSCLE_IDS = [
  'trapezius', 'deltoids', 'chest', 'upper-back', 'serratus',
  'biceps', 'triceps', 'forearm',
  'abs', 'obliques', 'lower-back',
  'gluteal', 'quadriceps', 'hamstring', 'adductors', 'hip-flexors',
  'calves', 'tibialis', 'cardiovascular system'
]
const MUSCLE_EN = {
  trapezius: 'Traps', deltoids: 'Shoulders', chest: 'Chest', 'upper-back': 'Upper back',
  serratus: 'Serratus', biceps: 'Biceps', triceps: 'Triceps', forearm: 'Forearms',
  abs: 'Abs', obliques: 'Obliques', 'lower-back': 'Lower back', gluteal: 'Glutes',
  quadriceps: 'Quads', hamstring: 'Hamstrings', adductors: 'Adductors',
  'hip-flexors': 'Hip flexors', calves: 'Calves', tibialis: 'Shins',
  'cardiovascular system': 'cardiovascular system'
}

const facets = {
  bodyParts: Object.fromEntries(BODY_PARTS.map(bp => [bp, ru[bp] ?? EXTRA_FACETS.bodyParts[bp] ?? bp])),
  equipment: Object.fromEntries(EQUIPMENT.map(eq => [eq, ru[eq] ?? eq])),
  muscles: Object.fromEntries(MUSCLE_IDS.map(m => [m, { en: MUSCLE_EN[m], ru: ru[MUSCLE_EN[m]] ?? MUSCLE_EN[m] }]))
}

// Hard check: every rendered facet must have a Russian string. A silent English leak into a
// Russian-first UI is a defect, not a missing translation to fix later.
const untranslated = [
  ...BODY_PARTS.filter(bp => !ru[bp] && !EXTRA_FACETS.bodyParts[bp]),
  ...EQUIPMENT.filter(eq => !ru[eq]),
  ...MUSCLE_IDS.filter(m => !ru[MUSCLE_EN[m]])
]
if (untranslated.length) throw new Error(`facets without a Russian string: ${untranslated.join(', ')}`)

// Every built-in exercise must have a Russian instruction list — the product promises it.
const missingInstr = exercises.filter(e => !Array.isArray(instructionsRu[e.id]) || !instructionsRu[e.id].length)
if (missingInstr.length) throw new Error(`exercises without Russian instructions: ${missingInstr.map(e => e.id).join(', ')}`)

writeJson('exercises.json', exercises)
writeJson('muscle-overlays.json', overlays)
writeJson('instructions.ru.json', instructionsRu)
writeJson('facets.ru.json', facets)

console.log(`\nexercises=${exercises.length} overlays=${Object.keys(overlays).length} instructions=${Object.keys(instructionsRu).length}`)
console.log(`bodyParts=${BODY_PARTS.length} equipment=${EQUIPMENT.length} muscles=${MUSCLE_IDS.length}`)
