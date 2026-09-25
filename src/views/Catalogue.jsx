import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  BODYPARTS, CATALOGUE, equipmentOf, musclesOf, searchExercises, searchRanked
} from '../lib/catalogue.js'
import { bodyPartName, equipmentName, muscleName } from '../lib/muscles.js'
import { parseFilters, buildSearch, applyFilters, activeFilterCount, EQUIPMENT_VALUES } from '../lib/filters.js'
import { t, exercisesWord } from '../lib/i18n.js'
import { useMeta } from '../lib/meta.js'
import { readSession, writeSession } from '../lib/session.js'
import Thumb from '../components/Thumb.jsx'

const PAGE = 36
const shownKey = search => `wi:shown:${search}`

// One chip row. Buttons with aria-pressed and a visible `on` state: keyboard reachable, and the
// selected value is announced, not only coloured.
function ChipRow({ label, options, value, onChange, allLabel, idPrefix }) {
  return (
    <div className="facet" role="group" aria-label={label}>
      <div className="facet-label mono">{label}</div>
      <div className="chips">
        <button
          type="button" id={`${idPrefix}-all`}
          className={'chip' + (value ? '' : ' on')}
          aria-pressed={!value}
          onClick={() => onChange('')}
        >{allLabel}</button>
        {options.map(opt => (
          <button
            key={opt.value} type="button" id={`${idPrefix}-${opt.value}`}
            className={'chip' + (value === opt.value ? ' on' : '')}
            aria-pressed={value === opt.value}
            onClick={() => onChange(value === opt.value ? '' : opt.value)}
          >{opt.label}</button>
        ))}
      </div>
    </div>
  )
}

export default function Catalogue() {
  const [params, setParams] = useSearchParams()
  const filters = useMemo(() => parseFilters(params), [params])
  const search = useMemo(() => buildSearch(filters), [filters])
  const listRef = useRef(null)
  const restored = useRef(false)

  const [shown, setShown] = useState(() => {
    const saved = readSession(shownKey(search), null)
    return Number.isInteger(saved) && saved >= PAGE ? saved : PAGE
  })

  useMeta(
    filters.q ? `Поиск: ${filters.q} — WORKOUT//INDEX` : 'WORKOUT//INDEX — каталог упражнений',
    'Каталог упражнений: поиск, фильтры по части тела, мышце и инвентарю, техника выполнения по шагам.'
  )

  // Persist the paging depth per filter state so returning from an exercise restores the same
  // list, then restore the scroll position that was saved on the way out.
  useEffect(() => { writeSession(shownKey(search), shown) }, [search, shown])
  useEffect(() => {
    if (restored.current) return
    restored.current = true
    const y = readSession(`wi:scroll:${search}`, 0)
    if (y > 0) requestAnimationFrame(() => window.scrollTo(0, y))
  }, [search])

  const openExercise = useCallback(() => {
    writeSession(`wi:scroll:${search}`, window.scrollY)
  }, [search])

  const update = useCallback((patch, { replace = false } = {}) => {
    const next = { ...filters, ...patch }
    setParams(new URLSearchParams(buildSearch(next)), { replace })
  }, [filters, setParams])

  // Filtering is body part → muscle → equipment → search. Facet options come from the
  // partially-filtered sets (body part, then muscle) so a chip row never disappears because of
  // its own selection, and the currently selected value is always merged back in so a shared
  // link never hides the chip that explains the result.
  const byBody = useMemo(() => applyFilters(CATALOGUE, { body: filters.body }), [filters.body])
  const byBodyAndMuscle = useMemo(() => applyFilters(CATALOGUE, { body: filters.body, muscle: filters.muscle }), [filters.body, filters.muscle])
  const results = useMemo(
    () => applyFilters(CATALOGUE, filters, list => (filters.q ? searchRanked(list, filters.q) : list)),
    [filters]
  )
  const equipmentOpts = useMemo(() => {
    const opts = equipmentOf(byBodyAndMuscle)
    return filters.equipment && !opts.includes(filters.equipment) ? [filters.equipment, ...opts] : opts
  }, [byBodyAndMuscle, filters.equipment])
  const muscleOpts = useMemo(() => {
    const opts = musclesOf(byBody)
    return filters.muscle && !opts.includes(filters.muscle) ? [filters.muscle, ...opts] : opts
  }, [byBody, filters.muscle])

  const shownList = results.slice(0, shown)
  const activeCount = activeFilterCount(filters)

  const total = CATALOGUE.length

  return (
    <main className="page" ref={listRef}>
      <section className="panel intro">
        <h1 className="h1">{t('catalogueHeading')}</h1>
        <p className="lede">{t('introLede')}</p>
        <p className="count mono" aria-live="polite">
          <span className="count-num">{results.length}</span> {exercisesWord(results.length)}
          <span className="count-total"> · {t('totalCount')}: {total}</span>
        </p>
      </section>

      <section className="panel controls">
        <label className="search">
          <span className="search-label mono">{t('searchLabel')}</span>
          <input
            type="search" className="input" value={filters.q}
            placeholder={t('searchPlaceholder')}
            autoComplete="off" spellCheck="false"
            onChange={e => update({ q: e.target.value }, { replace: true })}
          />
        </label>

        <ChipRow
          idPrefix="bp" label={t('filterBodyPart')} allLabel={t('all')}
          value={filters.body} onChange={v => setParams(new URLSearchParams(buildSearch({ ...filters, body: v, muscle: '' })))}
          options={BODYPARTS.map(bp => ({ value: bp, label: bodyPartName(bp) }))}
        />
        <ChipRow
          idPrefix="muscle" label={t('filterMuscle')} allLabel={t('anyMuscle')}
          value={filters.muscle} onChange={v => update({ muscle: v })}
          options={muscleOpts.map(m => ({ value: m, label: muscleName(m) }))}
        />
        <ChipRow
          idPrefix="eq" label={t('filterEquipment')} allLabel={t('anyEquipment')}
          value={filters.equipment} onChange={v => update({ equipment: v })}
          options={equipmentOpts.map(eq => ({ value: eq, label: equipmentName(eq) }))}
        />

        {activeCount > 0 && (
          <div className="active-filters">
            <span className="mono small dim">{t('activeFilters')}:</span>
            {filters.body && <ChipTag label={bodyPartName(filters.body)} onRemove={() => update({ body: '', muscle: '' })} />}
            {filters.muscle && <ChipTag label={muscleName(filters.muscle)} onRemove={() => update({ muscle: '' })} />}
            {filters.equipment && <ChipTag label={equipmentName(filters.equipment)} onRemove={() => update({ equipment: '' })} />}
            <button type="button" className="btn ghost sm" onClick={() => setParams(new URLSearchParams(''))}>{t('clearAll')}</button>
          </div>
        )}
      </section>

      {results.length === 0 ? (
        <section className="panel empty-panel">
          <h2 className="h2">{t('emptyTitle')}</h2>
          <p className="lede">{t('emptyHint')}</p>
          {activeCount > 0 && (
            <button type="button" className="btn" onClick={() => setParams(new URLSearchParams(''))}>{t('clearAll')}</button>
          )}
        </section>
      ) : (
        <section className="grid" aria-label={t('catalogueHeading')}>
          {shownList.map(ex => (
            <Link
              key={ex.id} className="card" to={`/exercise/${ex.id}`}
              onClick={openExercise}
              aria-label={`${ex.n} — ${bodyPartName(ex.bp)}, ${equipmentName(ex.eq)}`}
            >
              <Thumb ex={ex} />
              <div className="card-body">
                <div className="card-name">{ex.n}</div>
                <div className="card-meta capitalize">
                  {bodyPartName(ex.bp)} · {equipmentName(ex.eq)}
                </div>
              </div>
              <span className="card-id mono">{ex.id}</span>
            </Link>
          ))}
        </section>
      )}

      {results.length > shown && (
        <div className="more">
          <button type="button" className="btn" onClick={() => setShown(s => s + PAGE)}>
            {t('showMore')}
            <span className="mono small dim"> {shownList.length}/{results.length}</span>
          </button>
        </div>
      )}
    </main>
  )
}

function ChipTag({ label, onRemove }) {
  return (
    <span className="chip-tag">
      {label}
      <button type="button" className="chip-tag-x" aria-label={`${t('removeFilter')}: ${label}`} onClick={onRemove}>×</button>
    </span>
  )
}
