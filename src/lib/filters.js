// URL search-parameter contract for the catalogue.
//
// One stable, documented scheme: /?q=&body=&muscle=&equipment=. The pure functions here are
// the single source of truth for parsing and serialising; the React hook and the router only
// pass strings through them. Unknown or stale values are dropped rather than kept, so a
// hand-edited or out-of-date link always lands on a valid filtered view.

import { BODYPARTS, CATALOGUE, primariesOf } from './catalogue.js'
import { MUSCLES, TARGET_MUSCLE_IDS, normalizeMuscle } from './muscles.js'

export const EQUIPMENT_VALUES = [...new Set(CATALOGUE.map(e => e.eq))].sort()

export const FILTER_KEYS = ['q', 'body', 'muscle', 'equipment']

/** Parse a URLSearchParams (or plain object) into a validated filter set. */
export function parseFilters(params) {
  const get = key => (params && typeof params.get === 'function' ? params.get(key) : params?.[key]) || ''
  const q = String(get('q')).trim()
  const body = BODYPARTS.includes(get('body')) ? get('body') : ''
  const muscle = TARGET_MUSCLE_IDS.includes(get('muscle')) ? get('muscle') : ''
  const equipment = EQUIPMENT_VALUES.includes(get('equipment')) ? get('equipment') : ''
  return { q, body, muscle, equipment }
}

/** Serialise a filter set to a query string with only the keys that are set. */
export function buildSearch(filters = {}) {
  const p = new URLSearchParams()
  for (const key of FILTER_KEYS) {
    const value = filters[key]
    if (value) p.set(key, value)
  }
  return p.toString()
}

export const activeFilterCount = filters =>
  FILTER_KEYS.filter(k => k !== 'q').filter(k => !!filters[k]).length

/** Apply a filter set to the catalogue. Order is: body part, muscle, equipment, then search. */
export function applyFilters(list, filters, searchFn = (l, q) => l) {
  let out = list
  if (filters.body) out = out.filter(e => e.bp === filters.body)
  if (filters.muscle) {
    const m = normalizeMuscle(filters.muscle)
    out = out.filter(e => primariesOf(e).includes(m))
  }
  if (filters.equipment) out = out.filter(e => e.eq === filters.equipment)
  if (filters.q) out = searchFn(out, filters.q)
  return out
}

export { MUSCLES }
