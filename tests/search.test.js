import { describe, expect, it } from 'vitest'
import { CATALOGUE, searchExercises, searchRanked, matchExercise, nearWord } from '../src/lib/catalogue.js'

const names = list => list.map(e => e.n)

describe('search', () => {
  it('returns the whole list for an empty query', () => {
    expect(searchExercises(CATALOGUE, '')).toHaveLength(1324)
    expect(searchExercises(CATALOGUE, '   ')).toHaveLength(1324)
  })

  it('finds exercises by canonical English name', () => {
    const hits = searchExercises(CATALOGUE, 'bench press')
    expect(hits.length).toBeGreaterThan(0)
    expect(names(hits).some(n => /bench press/i.test(n))).toBe(true)
  })

  it('requires every query token to match, in any order', () => {
    const a = searchExercises(CATALOGUE, 'press bench')
    const b = searchExercises(CATALOGUE, 'bench press')
    expect(a).toHaveLength(b.length)
  })

  it('finds exercises through Russian facets', () => {
    const dumbbell = searchExercises(CATALOGUE, 'гантель')
    expect(dumbbell.filter(e => e.eq === 'dumbbell').length).toBeGreaterThan(100)
    expect(dumbbell.some(e => e.eq === 'dumbbell')).toBe(true)

    const chest = searchExercises(CATALOGUE, 'грудь')
    expect(chest.filter(e => e.bp === 'chest').length).toBeGreaterThan(100)
  })

  it('finds exercises through Russian instruction text', () => {
    const hits = searchExercises(CATALOGUE, 'лягте')
    expect(hits.length).toBeGreaterThan(50)
  })

  it('tolerates one typo in a long name token', () => {
    expect(searchExercises(CATALOGUE, 'bnech press').length).toBeGreaterThan(0)
    expect(searchExercises(CATALOGUE, 'dumbell').length).toBeGreaterThan(0)
  })

  it('does not loosen short tokens into a flood of neighbours', () => {
    // 'row' is a real word: exact behaviour, and no fuzzy drag-in of every name one edit away.
    const exact = searchExercises(CATALOGUE, 'row')
    const withFuzzy = searchExercises(CATALOGUE, 'roww')
    expect(exact.length).toBeGreaterThan(0)
    expect(withFuzzy.length).toBeLessThanOrEqual(exact.length)
  })

  it('reports an honest empty result', () => {
    expect(searchExercises(CATALOGUE, 'zzzqqqvvv')).toHaveLength(0)
  })

  it('ranks a name prefix hit above a body-text hit', () => {
    const ranked = searchRanked(CATALOGUE, 'squat')
    expect(names(ranked).slice(0, 5).some(n => /^squat/i.test(n))).toBe(true)
  })

  it('ranks equipment-name hits above instruction-only mentions', () => {
    // 'гантель' is the dumbbell facet word, but it also appears inside instructions of
    // bodyweight exercises. The dumbbell exercises must come first, not be drowned out.
    const ranked = searchRanked(CATALOGUE, 'гантель')
    expect(ranked[0].eq).toBe('dumbbell')
    const firstBodyweight = ranked.findIndex(e => e.eq !== 'dumbbell')
    const lastDumbbell = ranked.map(e => e.eq).lastIndexOf('dumbbell')
    expect(lastDumbbell).toBeLessThan(firstBodyweight)
  })

  it('matches a single exercise against the same corpus', () => {
    expect(matchExercise(CATALOGUE[0], 'sit-up')).toBe(true)
    expect(matchExercise(CATALOGUE[0], 'zzzqqq')).toBe(false)
  })
})

describe('nearWord', () => {
  it('accepts one edit for long words only', () => {
    expect(nearWord('dumbell', 'dumbbell')).toBe(true) // insertion
    expect(nearWord('row', 'ruw')).toBe(false)         // too short to fuzz
    expect(nearWord('bench', 'bnech')).toBe(true)      // transposition
    expect(nearWord('bench', 'wench')).toBe(true)      // substitution
    expect(nearWord('bench', 'benchpress')).toBe(false) // length gap too large
  })
})
