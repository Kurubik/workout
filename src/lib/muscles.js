// Muscle vocabulary for the catalogue.
//
// The dataset names muscles as free text and is not consistent about it — "shoulders",
// "deltoids" and "delts" are the same muscle, so are "quads"/"quadriceps" and
// "lats"/"latissimus dorsi". Everything collapses onto the canonical ids below so the
// detail page and the filters agree on one vocabulary. Names that cannot be drawn or
// filtered sensibly (hands, ankles, "cardiovascular system") either map to a real muscle
// or are dropped rather than guessed at.

import FACETS from '../data/facets.ru.json'

// Head-to-toe order, mirroring the source muscle map — also the order of any list built from
// them, so two people reading the same exercise see the same muscle order.
export const MUSCLES = [
  'trapezius', 'deltoids', 'chest', 'upper-back', 'serratus',
  'biceps', 'triceps', 'forearm',
  'abs', 'obliques', 'lower-back',
  'gluteal', 'quadriceps', 'hamstring', 'adductors', 'hip-flexors',
  'calves', 'tibialis'
]

// The cardio pseudo-muscle is not drawable and never appears as a filter target, but it is a
// legitimate label on cardio exercises, so it keeps a display name.
export const CARDIO_MUSCLE = 'cardiovascular system'

const ALIAS = {
  abs: 'abs', pectorals: 'chest', biceps: 'biceps', glutes: 'gluteal', delts: 'deltoids',
  triceps: 'triceps', 'upper back': 'upper-back', lats: 'upper-back', calves: 'calves',
  quads: 'quadriceps', forearms: 'forearm', hamstrings: 'hamstring', spine: 'lower-back',
  traps: 'trapezius', adductors: 'adductors', 'serratus anterior': 'serratus',
  abductors: 'gluteal', 'levator scapulae': 'trapezius',
  'cardiovascular system': 'cardiovascular system',
  shoulders: 'deltoids', deltoids: 'deltoids', 'rear deltoids': 'deltoids',
  'rotator cuff': 'deltoids', quadriceps: 'quadriceps', core: 'abs', abdominals: 'abs',
  'lower abs': 'abs', chest: 'chest', 'upper chest': 'chest', 'hip flexors': 'hip-flexors',
  obliques: 'obliques', 'lower back': 'lower-back', rhomboids: 'upper-back',
  trapezius: 'trapezius', back: 'upper-back', 'latissimus dorsi': 'upper-back',
  brachialis: 'biceps', soleus: 'calves', shins: 'tibialis', wrists: 'forearm',
  'wrist flexors': 'forearm', 'wrist extensors': 'forearm', 'grip muscles': 'forearm',
  groin: 'adductors', 'inner thighs': 'adductors',
  ankles: null, feet: null, hands: null, 'ankle stabilizers': null,
  sternocleidomastoid: null, head: null, hair: null, neck: null, knees: null
}

/** Canonical muscle id for a dataset spelling, or null when it is not a filterable muscle. */
export function normalizeMuscle(name) {
  if (!name) return null
  const key = String(name).trim().toLowerCase()
  if (Object.prototype.hasOwnProperty.call(ALIAS, key)) return ALIAS[key]
  return MUSCLES.includes(key) ? key : null
}

/** Russian display name for a canonical muscle id (or the raw value as a last resort). */
export function muscleName(id) {
  return FACETS.muscles[id]?.ru || String(id)
}

/** English display name for a canonical muscle id. */
export function muscleNameEn(id) {
  return FACETS.muscles[id]?.en || String(id)
}

export const bodyPartName = bp => FACETS.bodyParts[bp] || bp
export const equipmentName = eq => FACETS.equipment[eq] || eq

// Canonical muscle ids that at least one exercise actually targets — the filter options.
export const TARGET_MUSCLE_IDS = MUSCLES.filter(m => Object.prototype.hasOwnProperty.call(FACETS.muscles, m))
