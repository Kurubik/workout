// Catalogue composition: raw dataset + owner-approved muscle overlay, facets, and the
// typo-tolerant multilingual search. No store, no profile, no user state — the whole module
// is a pure function of the two shipped JSON packs.

import EXERCISES from '../data/exercises.json'
import OVERLAYS from '../data/muscle-overlays.json'
import INSTRUCTIONS_RU from '../data/instructions.ru.json'
import FACETS from '../data/facets.ru.json'
import { MUSCLES, normalizeMuscle, muscleName, muscleNameEn, bodyPartName, equipmentName } from './muscles.js'

export const RAW = EXERCISES

// The generated dataset stays the compatibility/raw export; the runtime catalogue applies the
// owner-approved muscle metadata as a narrow overlay. Same contract as the source project, so a
// dataset refresh cannot silently erase the corrected muscle lists.
const applyOverlay = ex => {
  const meta = OVERLAYS[ex.id]
  return meta ? { ...ex, ...meta } : ex
}

export const CATALOGUE = EXERCISES.map(applyOverlay)

export const EXIDX = {}
CATALOGUE.forEach(e => { EXIDX[e.id] = e })

// Conservative catalogue additions kept from the source project so a future dataset refresh
// does not erase them. Values follow the dataset's existing alias vocabulary.
const SECONDARY_ADDITIONS = {
  '0027': ['rear deltoids'], // barbell bent over row
  '0293': ['rear deltoids'], // dumbbell bent over row
  '0499': ['rear deltoids'], // inverted row
  '0861': ['rear deltoids']  // cable seated row
}

const arrayOf = v => (Array.isArray(v) ? v : v == null || v === '' ? [] : [v])

/** Primary (target) muscles as canonical ids: overlay first, then the raw `tg` field. */
export function primariesOf(ex) {
  const explicit = arrayOf(ex?.primaries).map(normalizeMuscle).filter(Boolean)
  if (explicit.length) return [...new Set(explicit)]
  const fromTarget = normalizeMuscle(ex?.tg)
  return fromTarget ? [fromTarget] : []
}

/** Secondary muscles as canonical ids, with the conservative additions applied. */
export function secondariesOf(ex) {
  const explicit = arrayOf(ex?.secondaries)
  const base = explicit.length ? explicit : arrayOf(ex?.sm)
  const ids = base.map(normalizeMuscle).filter(Boolean)
  const extra = arrayOf(SECONDARY_ADDITIONS[ex?.id]).map(normalizeMuscle).filter(Boolean)
  return [...new Set([...ids, ...extra])].filter(m => !primariesOf(ex).includes(m))
}

/** Russian instruction steps for a built-in exercise; empty for anything unknown. */
export const instructionsFor = id => INSTRUCTIONS_RU[id] || []

// --- facets ---------------------------------------------------------------------------

export const BODYPARTS = [...new Set(CATALOGUE.map(e => e.bp))].sort()

// Body part of the *effective* catalogue (the overlay can move an exercise between parts).
export const bodyPartOf = ex => ex.bp

/** Equipment values present in a list, most common first — derived from the already-filtered
 *  list so every chip on screen has results behind it. */
export function equipmentOf(list) {
  const counts = {}
  list.forEach(e => { if (e.eq) counts[e.eq] = (counts[e.eq] || 0) + 1 })
  return Object.keys(counts).sort((a, b) => counts[b] - counts[a] || (a < b ? -1 : 1))
}

/** Target-muscle ids present in a list, in head-to-toe muscle order. */
export function musclesOf(list) {
  const present = new Set()
  list.forEach(e => primariesOf(e).forEach(m => present.add(m)))
  return MUSCLES.filter(m => present.has(m))
}

export const filterByBodyPart = (list, bp) => (bp ? list.filter(e => e.bp === bp) : list)
export const filterByEquipment = (list, eq) => (eq ? list.filter(e => e.eq === eq) : list)
export const filterByMuscle = (list, muscle) =>
  (muscle ? list.filter(e => primariesOf(e).includes(muscle)) : list)

// --- search ---------------------------------------------------------------------------
// Multi-token, accent-insensitive, typo-tolerant. Every query word must match somewhere (any
// order), so "press bench" finds "Bench Press". The haystack carries the canonical English
// name, the Russian translations of every facet, and the Russian instructions, so the same
// query works in either language ("bench press" and "жим лёжа" both land).
//
// The three parts are kept separate as well as joined: matching only needs the joined string,
// but ranking has to know whether a hit was the name, a facet or merely a word in the text.

const stripDiacritics = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
const norm = s => stripDiacritics(String(s || '')).toLowerCase()

const partsOf = ex => {
  const sm = arrayOf(ex.sm)
  const name = norm(ex.n)
  const facets = norm([
    ex.bp, bodyPartName(ex.bp),
    ex.eq, equipmentName(ex.eq),
    ex.tg, ex.mg,
    ...sm,
    ...(OVERLAYS[ex.id]?.primaries || []), ...(OVERLAYS[ex.id]?.secondaries || [])
  ].join(' '))
  const instructions = norm((INSTRUCTIONS_RU[ex.id] || []).join(' '))
  return { name, facets, instructions, s: `${name} ${facets} ${instructions}`, nameWords: name.split(/\s+/).filter(Boolean) }
}

// Built once, lazily: NFD-normalising ~1300 instruction texts on module load would delay the
// first paint on a phone, and the catalogue renders before anyone types.
let corpus = null
function corpusOf() {
  if (!corpus) {
    corpus = new Map()
    for (const ex of CATALOGUE) corpus.set(ex.id, partsOf(ex))
  }
  return corpus
}

const queryTokens = q => norm(q).split(/\s+/).filter(Boolean)

// Allow one missing, extra or substituted character, or an adjacent transposition, in long
// query tokens. Short tokens stay exact/substring-only: words such as "row" and "curl" are too
// common for fuzzy matching to be useful.
//
// Only the exercise's own name words are ever compared this way. Facet words are shared by a
// whole slice of the catalogue, so one accidental neighbour ("wrist" ~ "waist") would list
// hundreds of unrelated exercises ahead of the real hits.
export function nearWord(a, b) {
  if (a.length < 5 || Math.abs(a.length - b.length) > 1) return false
  let i = 0
  while (i < a.length && a[i] === b[i]) i++
  if (i === a.length) return b.length - i <= 1
  if (a.length === b.length) {
    return a.slice(i + 1) === b.slice(i + 1) ||
      (a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2))
  }
  return a.length > b.length ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1)
}

const matchTokens = (entry, tokens, fuzzy) =>
  tokens.every(tok => entry.s.includes(tok) || (fuzzy.has(tok) && entry.nameWords.some(w => nearWord(tok, w))))

/** Single-exercise check — every token may fall back to typo tolerance. */
export function matchExercise(ex, query) {
  const tokens = queryTokens(query)
  if (!tokens.length) return true
  const entry = ex?.id ? corpusOf().get(ex.id) : partsOf(ex)
  if (!entry) return false
  return matchTokens(entry, tokens, new Set(tokens))
}

// A token that appears literally somewhere in the list is taken at its word for the whole list;
// only a token with no exact hit anywhere ("bnech", "dumbell") is allowed the typo tolerance.
// Otherwise a correctly spelled query would also drag in its neighbours.
function fuzzyTokens(list, tokens, c) {
  return new Set(tokens.filter(tok => !list.some(e => c.get(e.id)?.s.includes(tok))))
}

/** Boolean filter over a list, catalogue order preserved. */
export function searchExercises(list, query) {
  const tokens = queryTokens(query)
  if (!tokens.length) return list
  const c = corpusOf()
  const fuzzy = fuzzyTokens(list, tokens, c)
  return list.filter(e => matchTokens(c.get(e.id), tokens, fuzzy))
}

/** Search the full catalogue, ranked: the English name outranks a facet, which outranks a hit
 *  that only appears in the instruction text. */
export function searchRanked(list, query) {
  const tokens = queryTokens(query)
  if (!tokens.length) return list
  const c = corpusOf()
  const fuzzy = fuzzyTokens(list, tokens, c)
  const scored = []
  for (const e of list) {
    const entry = c.get(e.id)
    if (!matchTokens(entry, tokens, fuzzy)) continue
    let score = 0
    for (const tok of tokens) {
      const at = entry.name.indexOf(tok)
      if (at === 0) score += 1000
      else if (at > 0) score += 700 - Math.min(at, 200)
      else if (entry.nameWords.some(w => nearWord(tok, w))) score += 500
      else if (entry.facets.includes(tok)) score += 100
      else score += 10
    }
    scored.push({ ex: e, score })
  }
  return scored.sort((a, b) => b.score - a.score).map(s => s.ex)
}
