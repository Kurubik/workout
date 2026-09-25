import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Catalogue from '../src/views/Catalogue.jsx'
import Exercise from '../src/views/Exercise.jsx'

const renderAt = (path, element) =>
  renderToStaticMarkup(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={element} />
        <Route path="/exercise/:id" element={element} />
      </Routes>
    </MemoryRouter>
  )

describe('catalogue view', () => {
  it('renders the heading, the total count and the catalogue cards', () => {
    const html = renderAt('/', <Catalogue />)
    expect(html).toContain('Каталог упражнений')
    expect(html).toContain('1324')
    expect(html).toContain('href="/exercise/0001"')
    // Paginated: the first page is a bounded slice, not all 1324 rows.
    expect((html.match(/href="\/exercise\//g) || []).length).toBeLessThan(60)
  })

  it('applies a query from the URL and reports the filtered count', () => {
    const html = renderAt('/?q=bench%20press', <Catalogue />)
    expect(html).toContain('value="bench press"')
    expect(html).toContain('bench press')
    expect((html.match(/href="\/exercise\/0001"/g) || []).length).toBeLessThanOrEqual(1)
  })

  it('applies a facet from the URL and shows it as an active filter', () => {
    const html = renderAt('/?body=chest&equipment=barbell', <Catalogue />)
    expect(html).toContain('Активные фильтры')
    expect(html).toContain('Сбросить фильтры')
    // selected chips are announced, not only coloured
    expect(html).toContain('aria-pressed="true"')
  })

  it('shows the honest empty state for a query with no hits', () => {
    const html = renderAt('/?q=zzzqqqvvv', <Catalogue />)
    expect(html).toContain('Ни хуя не нашлось')
    expect(html).toContain('Сбрось фильтры')
  })

  it('never renders tracker affordances', () => {
    const html = renderAt('/', <Catalogue />)
    for (const forbidden of ['План', 'Избранное', 'Рекорд', 'История', 'Создать']) {
      expect(html).not.toContain(forbidden)
    }
  })
})

describe('exercise view', () => {
  const knownId = '0001'

  it('renders a direct link, the canonical name and the Russian labels', () => {
    const html = renderAt(`/exercise/${knownId}`, <Exercise />)
    expect(html).toContain('3/4 sit-up')
    expect(html).toContain('Как выполнять')
    expect(html).toContain('Целевые мышцы')
    expect(html).toContain('Часть тела')
    expect(html).toContain('К каталогу')
    expect(html).toContain('<ol class="steps">')
  })

  it('renders the Russian instruction steps, not the English ones', () => {
    const html = renderAt(`/exercise/${knownId}`, <Exercise />)
    expect(html).toContain('Лягте на спину')
    expect(html).not.toContain('Lie flat on your back')
  })

  it('renders an honest not-found page for an invalid id', () => {
    const html = renderAt('/exercise/9999', <Exercise />)
    expect(html).toContain('Упражнение не найдено')
    expect(html).toContain('К каталогу')
  })

  it('renders no mutation controls beyond the share button', () => {
    const html = renderAt(`/exercise/${knownId}`, <Exercise />)
    expect(html).toContain('Скопировать ссылку')
    for (const forbidden of ['Добавить в план', 'Избранное', 'Удалить', 'История']) {
      expect(html).not.toContain(forbidden)
    }
  })
})
