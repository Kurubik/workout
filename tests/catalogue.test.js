import { describe, expect, it } from 'vitest'
import {
  CATALOGUE, RAW, EXIDX, BODYPARTS, primariesOf, secondariesOf, instructionsFor,
  equipmentOf, musclesOf, filterByBodyPart, filterByEquipment, filterByMuscle
} from '../src/lib/catalogue.js'
import { MUSCLES, normalizeMuscle, muscleName, bodyPartName, equipmentName } from '../src/lib/muscles.js'
import OVERLAYS from '../src/data/muscle-overlays.json'
import INSTRUCTIONS from '../src/data/instructions.ru.json'

describe('catalogue composition', () => {
  it('ships the full built-in catalogue', () => {
    expect(RAW).toHaveLength(1324)
    expect(CATALOGUE).toHaveLength(1324)
  })

  it('keeps the raw dataset free of overlay fields', () => {
    // A dataset refresh must never be able to smuggle a correction in through raw data.
    const withPrimaries = RAW.filter(e => 'primaries' in e || 'secondaries' in e)
    expect(withPrimaries).toEqual([])
  })

  it('applies every muscle overlay onto the runtime catalogue', () => {
    const entries = Object.entries(OVERLAYS)
    expect(entries.length).toBeGreaterThan(200)
    for (const [id, meta] of entries) {
      const ex = EXIDX[id]
      expect(ex, `overlay target ${id} missing from catalogue`).toBeTruthy()
      for (const [key, value] of Object.entries(meta)) {
        expect(ex[key], `${id}.${key}`).toEqual(value)
      }
    }
  })

  it('lets an overlay override the derived primaries', () => {
    // 1010 carries an owner-approved compound-lift correction over the generated row.
    const ex = EXIDX['1010']
    expect(ex.primaries).toEqual(['gluteal', 'hamstring'])
    expect(primariesOf(ex)).toEqual(['gluteal', 'hamstring'])
    expect(secondariesOf(ex)).toContain('quadriceps')
  })

  it('derives primaries from the raw target when there is no overlay', () => {
    const ex = EXIDX['0001'] // 3/4 sit-up, tg: abs
    expect(ex.primaries).toBeUndefined()
    expect(primariesOf(ex)).toEqual(['abs'])
  })

  it('never repeats a primary among the secondaries', () => {
    for (const ex of CATALOGUE) {
      const primaries = primariesOf(ex)
      for (const s of secondariesOf(ex)) expect(primaries).not.toContain(s)
    }
  })

  it('resolves at least one primary muscle for every exercise', () => {
    const orphans = CATALOGUE.filter(e => primariesOf(e).length === 0)
    expect(orphans.map(e => e.id)).toEqual([])
  })

  it('has a Russian instruction list for every built-in exercise', () => {
    expect(Object.keys(INSTRUCTIONS)).toHaveLength(1324)
    for (const ex of CATALOGUE) {
      const steps = instructionsFor(ex.id)
      expect(steps.length, `no instructions for ${ex.id}`).toBeGreaterThan(0)
      for (const s of steps) expect(typeof s).toBe('string')
    }
  })

  it('returns no instructions for an unknown id', () => {
    expect(instructionsFor('9999')).toEqual([])
  })
})

describe('facets', () => {
  it('lists body parts and every one has a Russian name', () => {
    // 10 from the generated dataset plus 'full body', which only arrives through the muscle
    // overlay — and which the source locale pack does not translate at all.
    expect(BODYPARTS.length).toBe(11)
    expect(BODYPARTS).toContain('full body')
    for (const bp of BODYPARTS) {
      expect(bodyPartName(bp), `body part ${bp} has no Russian name`).not.toBe(bp)
    }
  })

  it('orders equipment by frequency within the given list', () => {
    const eq = equipmentOf(CATALOGUE)
    expect(eq[0]).toBe('body weight')
    expect(eq).toHaveLength(28)
    for (const e of eq) expect(equipmentName(e)).toBeTruthy()
  })

  it('derives equipment from the filtered list, not the whole catalogue', () => {
    const cardio = filterByBodyPart(CATALOGUE, 'cardio')
    const eq = equipmentOf(cardio)
    expect(eq.length).toBeLessThan(28)
    expect(eq).toContain('stationary bike')
  })

  it('lists present target muscles in head-to-toe order', () => {
    const arms = musclesOf(filterByBodyPart(CATALOGUE, 'upper arms'))
    const indexed = arms.map(m => MUSCLES.indexOf(m))
    expect([...indexed].sort((a, b) => a - b)).toEqual(indexed)
  })
})

describe('filters', () => {
  it('filters by body part, muscle and equipment', () => {
    const chest = filterByBodyPart(CATALOGUE, 'chest')
    expect(chest.length).toBeGreaterThan(100)
    expect(chest.every(e => e.bp === 'chest')).toBe(true)

    const dumb = filterByEquipment(chest, 'dumbbell')
    expect(dumb.every(e => e.eq === 'dumbbell')).toBe(true)

    const delts = filterByMuscle(CATALOGUE, 'deltoids')
    expect(delts.length).toBeGreaterThan(100)
    expect(delts.every(e => primariesOf(e).includes('deltoids'))).toBe(true)
  })

  it('normalizes dataset muscle spellings onto one vocabulary', () => {
    expect(normalizeMuscle('Delts')).toBe('deltoids')
    expect(normalizeMuscle('lats')).toBe('upper-back')
    expect(normalizeMuscle('quads')).toBe('quadriceps')
    expect(normalizeMuscle('hands')).toBeNull()
    expect(muscleName('upper-back')).toBe('Верх спины')
  })
})
