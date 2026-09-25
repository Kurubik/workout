import { describe, expect, it } from 'vitest'
import { parseFilters, buildSearch, activeFilterCount, applyFilters, EQUIPMENT_VALUES, FILTER_KEYS } from '../src/lib/filters.js'
import { CATALOGUE, searchExercises, primariesOf } from '../src/lib/catalogue.js'

describe('URL filter state', () => {
  it('round-trips a valid filter set through the query string', () => {
    const input = { q: 'жим лёжа', body: 'chest', muscle: 'chest', equipment: 'barbell' }
    const url = buildSearch(input)
    const out = parseFilters(new URLSearchParams(url))
    expect(out).toEqual(input)
  })

  it('omits empty values from the query string', () => {
    expect(buildSearch({ q: '', body: '', muscle: '', equipment: '' })).toBe('')
    expect(buildSearch({ q: 'squat' })).toBe('q=squat')
  })

  it('drops unknown or stale facet values instead of trusting them', () => {
    const out = parseFilters(new URLSearchParams('body=tail&muscle=tentacle&equipment=hammer&q=x'))
    expect(out.body).toBe('')
    expect(out.muscle).toBe('')
    expect(out.equipment).toBe('hammer') // a real dataset value survives
    expect(out.q).toBe('x')
  })

  it('trims the query and keeps a hand-edited link valid', () => {
    expect(parseFilters(new URLSearchParams('q=%20%20bench%20%20')).q).toBe('bench')
  })

  it('counts only facet filters, never the free-text query', () => {
    expect(activeFilterCount({ q: 'x' })).toBe(0)
    expect(activeFilterCount({ q: 'x', body: 'chest', equipment: 'barbell' })).toBe(2)
  })

  it('exposes the documented key scheme', () => {
    expect(FILTER_KEYS).toEqual(['q', 'body', 'muscle', 'equipment'])
    expect(EQUIPMENT_VALUES).toContain('body weight')
  })

  it('survives a full parse/build/parse cycle for every facet value', () => {
    for (const eq of EQUIPMENT_VALUES) {
      const out = parseFilters(new URLSearchParams(buildSearch({ equipment: eq })))
      expect(out.equipment).toBe(eq)
    }
  })
})

describe('applyFilters', () => {
  it('combines facets and search', () => {
    const filters = { q: 'press', body: 'chest', muscle: '', equipment: 'barbell' }
    const out = applyFilters(CATALOGUE, filters, searchExercises)
    expect(out.length).toBeGreaterThan(0)
    expect(out.every(e => e.bp === 'chest' && e.eq === 'barbell')).toBe(true)
    expect(out.every(e => /press/i.test(e.n))).toBe(true)
  })

  it('filters on the effective (overlay) body part', () => {
    const out = applyFilters(CATALOGUE, { body: 'upper legs' }, searchExercises)
    expect(out.some(e => e.id === '1010')).toBe(true)
  })

  it('filters on canonical target muscles', () => {
    const out = applyFilters(CATALOGUE, { muscle: 'deltoids' }, searchExercises)
    expect(out.every(e => primariesOf(e).includes('deltoids'))).toBe(true)
  })

  it('returns everything when nothing is set', () => {
    expect(applyFilters(CATALOGUE, {}, searchExercises)).toHaveLength(1324)
  })
})
