#!/usr/bin/env node
// Real-browser verification of the built application.
//
// Runs against a served production build (default http://127.0.0.1:4173, i.e. the vite preview
// of `dist/`) or any deployed origin via BASE_URL. Every check reads something the browser
// actually painted: HTTP status, layout geometry, computed styles, CDP platform-font reports
// and a real service-worker offline reload.
//
// Playwright is intentionally NOT a repository dependency — the app itself must install and
// build without it. Point PLAYWRIGHT_MODULE at an existing install:
//   PLAYWRIGHT_MODULE=/path/to/node_modules/playwright node scripts/verify-browser.mjs
//
// Exit code is 0 only when every check passed.

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SHOTS = resolve(repoRoot, 'assets/screenshots')
const BASE = process.env.BASE_URL || 'http://127.0.0.1:4173'

let chromium
try {
  ;({ chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright'))
} catch (err) {
  console.error('verify-browser: playwright not resolvable. Set PLAYWRIGHT_MODULE.')
  console.error(String(err.message || err))
  process.exit(2)
}

mkdirSync(SHOTS, { recursive: true })

const results = []
const check = (name, ok, detail = '') => {
  results.push({ name, ok: Boolean(ok), detail })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
}

const browser = await chromium.launch()

const contextAt = (viewport, options = {}) => browser.newContext({ viewport, ...options })

// ---------------------------------------------------------------------------------------
// 1. Catalogue at mobile and desktop
// ---------------------------------------------------------------------------------------
for (const [label, viewport] of [['mobile', { width: 390, height: 844 }], ['desktop', { width: 1440, height: 900 }]]) {
  const context = await contextAt(viewport)
  const page = await context.newPage()
  const res = await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  check(`catalogue ${label}: HTTP 200`, res.status() === 200, `status=${res.status()}`)
  await page.waitForSelector('.card')
  const cards = await page.locator('.card').count()
  check(`catalogue ${label}: renders a paginated first page`, cards > 20 && cards < 60, `cards=${cards}`)
  const total = await page.locator('.count-num').first().innerText()
  check(`catalogue ${label}: shows 1324 exercises`, total.trim() === '1324', `count=${total}`)
  const lazy = await page.locator('.thumb').first().getAttribute('loading')
  check(`catalogue ${label}: thumbnails are lazy`, lazy === 'lazy', `loading=${lazy}`)
  await page.screenshot({ path: resolve(SHOTS, `catalogue-${label}.png`), fullPage: false })
  await context.close()
}

// ---------------------------------------------------------------------------------------
// 2. Detail route at both viewports + hard refresh + direct deep link
// ---------------------------------------------------------------------------------------
for (const [label, viewport] of [['mobile', { width: 390, height: 844 }], ['desktop', { width: 1440, height: 900 }]]) {
  const context = await contextAt(viewport)
  const page = await context.newPage()
  const res = await page.goto(`${BASE}/exercise/0001`, { waitUntil: 'networkidle' })
  check(`detail ${label}: direct deep link HTTP 200`, res.status() === 200, `status=${res.status()}`)
  const title = await page.title()
  check(`detail ${label}: document title names the exercise`, /3\/4 sit-up/.test(title), title)
  const name = await page.locator('.detail-name').innerText()
  check(`detail ${label}: canonical English name`, name.trim() === '3/4 sit-up', name)
  const steps = await page.locator('.steps li').count()
  check(`detail ${label}: Russian steps rendered`, steps >= 4, `steps=${steps}`)
  const firstStep = await page.locator('.steps li').first().innerText()
  check(`detail ${label}: step text is Russian`, /Лягте/.test(firstStep), firstStep.slice(0, 40))
  const facts = (await page.locator('.fact dt').allInnerTexts()).map(s => s.trim().toLowerCase())
  check(`detail ${label}: labelled body part and equipment`, facts.includes('часть тела') && facts.includes('инвентарь'), facts.join('/'))
  await page.reload({ waitUntil: 'networkidle' })
  check(`detail ${label}: hard refresh keeps the route`, (await page.locator('.detail-name').innerText()).trim() === '3/4 sit-up')
  await page.screenshot({ path: resolve(SHOTS, `detail-${label}.png`), fullPage: false })
  await context.close()
}

// ---------------------------------------------------------------------------------------
// 3. 320 px overflow
// ---------------------------------------------------------------------------------------
{
  const context = await contextAt({ width: 320, height: 720 })
  const page = await context.newPage()
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  await page.waitForSelector('.card')
  const over = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    inner: window.innerWidth
  }))
  check('320px: no horizontal overflow', over.scroll <= over.inner, `scrollWidth=${over.scroll} innerWidth=${over.inner}`)
  await page.screenshot({ path: resolve(SHOTS, 'catalogue-320.png') })
  await page.goto(`${BASE}/exercise/0001`, { waitUntil: 'networkidle' })
  const over2 = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, inner: window.innerWidth }))
  check('320px detail: no horizontal overflow', over2.scroll <= over2.inner, `scrollWidth=${over2.scroll}`)
  await context.close()
}

// ---------------------------------------------------------------------------------------
// 4. Search / filter / back-forward URL state
// ---------------------------------------------------------------------------------------
{
  const context = await contextAt({ width: 1280, height: 900 })
  const page = await context.newPage()
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  await page.fill('.input', 'bench press')
  await page.waitForFunction(() => window.location.search.includes('q='))
  const url1 = new URL(page.url())
  check('search: query lands in the URL', url1.searchParams.get('q') === 'bench press', page.url())
  const filtered = await page.locator('.card').count()
  check('search: narrows the result set', filtered > 0 && filtered < 40, `cards=${filtered}`)

  await page.click('#bp-chest')
  await page.waitForFunction(() => window.location.search.includes('body=chest'))
  const url2 = new URL(page.url())
  check('filter: body part lands in the URL and keeps the query', url2.searchParams.get('body') === 'chest' && url2.searchParams.get('q') === 'bench press', page.url())
  const chips = await page.locator('.chip.on').count()
  check('filter: selected chip is marked pressed', chips >= 1, `on=${chips}`)

  await page.locator('.card').first().click()
  await page.waitForSelector('.detail-name')
  const detailUrl = page.url()
  check('navigation: card opens the exercise route', /\/exercise\/[0-9]{4}$/.test(detailUrl), detailUrl)

  await page.goBack()
  await page.waitForSelector('.card')
  const url3 = new URL(page.url())
  check('back: filters restored from history', url3.searchParams.get('body') === 'chest' && url3.searchParams.get('q') === 'bench press', page.url())
  const inputValue = await page.locator('.input').inputValue()
  check('back: search input restored', inputValue === 'bench press', inputValue)

  await page.goForward()
  await page.waitForSelector('.detail-name')
  check('forward: returns to the exercise', /\/exercise\//.test(page.url()), page.url())

  // clear-all
  await page.goBack()
  await page.waitForSelector('.card')
  if (await page.locator('text=Сбросить фильтры').count()) {
    await page.locator('text=Сбросить фильтры').first().click()
    await page.waitForFunction(() => window.location.search === '')
    check('clear: removes every filter from the URL', new URL(page.url()).search === '', page.url())
  }
  await context.close()
}

// ---------------------------------------------------------------------------------------
// 5. Missing-media fallback (CDN blocked)
// ---------------------------------------------------------------------------------------
{
  const context = await contextAt({ width: 390, height: 844 })
  const page = await context.newPage()
  await page.route('**/cdn.jsdelivr.net/**', route => route.abort())
  await page.goto(`${BASE}/exercise/0001`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.media')
  const fallback = await page.locator('.media-note, .media-tile-failed').allInnerTexts()
  check('media: blocked CDN degrades to an honest fallback', fallback.join(' ').includes('Медиа недоступно'), fallback.join(' ').slice(0, 80))
  const stepsStillThere = await page.locator('.steps li').count()
  check('media: instructions survive the media failure', stepsStillThere >= 4, `steps=${stepsStillThere}`)
  const brokenImg = await page.evaluate(() =>
    [...document.images].filter(i => i.complete && i.naturalWidth === 0 && i.getAttribute('src')).length)
  check('media: no broken-image glyph left on screen', brokenImg === 0, `broken=${brokenImg}`)
  await context.close()
}

// ---------------------------------------------------------------------------------------
// 6. Keyboard path and focus visibility
// ---------------------------------------------------------------------------------------
{
  const context = await contextAt({ width: 1280, height: 900 })
  const page = await context.newPage()
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  const reached = []
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab')
    reached.push(await page.evaluate(() => {
      const el = document.activeElement
      return { tag: el?.tagName, cls: el?.className || '', type: el?.getAttribute?.('type') || '' }
    }))
  }
  check('keyboard: tab reaches the search field', reached.some(r => r.tag === 'INPUT'), JSON.stringify(reached.map(r => r.tag)))
  check('keyboard: tab reaches a filter chip', reached.some(r => r.tag === 'BUTTON' && /chip/.test(r.cls)), JSON.stringify(reached.map(r => r.cls)))
  const outline = await page.evaluate(() => {
    const el = document.querySelector('.chip')
    el.focus()
    const s = getComputedStyle(el)
    return s.outlineStyle + ' ' + s.outlineWidth
  })
  check('keyboard: focused chip has a visible outline', /solid/.test(outline) && !/0px/.test(outline), outline)
  const pressed = await page.locator('.chip[aria-pressed]').count()
  check('a11y: chips expose aria-pressed', pressed > 10, `count=${pressed}`)
  await context.close()
}

// ---------------------------------------------------------------------------------------
// 7. Reduced motion
// ---------------------------------------------------------------------------------------
{
  const context = await contextAt({ width: 1280, height: 900 }, { reducedMotion: 'reduce' })
  const page = await context.newPage()
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  const sweep = await page.evaluate(() => {
    const el = document.querySelector('.crt-sweep')
    return el ? getComputedStyle(el).display : 'absent'
  })
  check('reduced motion: monitor sweep removed', sweep === 'none', `display=${sweep}`)
  const readable = await page.locator('.card-name').first().isVisible()
  check('reduced motion: theme stays readable', readable)
  await page.screenshot({ path: resolve(SHOTS, 'catalogue-reduced-motion.png') })
  await context.close()
}

// ---------------------------------------------------------------------------------------
// 8. Fonts: prove the shipped faces paint Cyrillic, via CDP platform-font inspection
// ---------------------------------------------------------------------------------------
{
  const context = await contextAt({ width: 1280, height: 900 })
  const page = await context.newPage()
  await page.goto(`${BASE}/exercise/0001`, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)

  const cdp = await context.newCDPSession(page)
  await cdp.send('DOM.enable')
  await cdp.send('CSS.enable')
  const { root } = await cdp.send('DOM.getDocument', { depth: -1 })

  const fontsFor = async selector => {
    const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector })
    if (!nodeId) return []
    const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId })
    return fonts
  }

  const stepFonts = await fontsFor('.steps li')
  const stepCustom = stepFonts.filter(f => f.isCustomFont).map(f => f.familyName)
  check('fonts: Russian instruction text painted by the shipped custom font', stepCustom.some(n => n.startsWith('IBM Plex Sans')), JSON.stringify(stepFonts))

  const factFonts = await fontsFor('.fact dt')
  const factCustom = factFonts.filter(f => f.isCustomFont).map(f => f.familyName)
  check('fonts: mono Cyrillic label painted by JetBrains Mono', factCustom.some(n => n.startsWith('JetBrains Mono')), JSON.stringify(factFonts))

  const loaded = await page.evaluate(() => ({
    cyr: document.fonts.check('400 16px "IBM Plex Sans"', 'Техника выполнения'),
    mono: document.fonts.check('500 12px "JetBrains Mono"', 'Часть тела'),
    families: [...new Set([...document.fonts].map(f => f.family))]
  }))
  check('fonts: both families loaded and cover Cyrillic', loaded.cyr && loaded.mono, JSON.stringify(loaded.families))

  // Geometry proof that Cyrillic is not silently on a platform face: a Cyrillic and a Latin run
  // of the same length in the mono face must have equal advance width.
  const widths = await page.evaluate(() => {
    const probe = text => {
      const span = document.createElement('span')
      span.style.font = '500 16px "JetBrains Mono", monospace'
      span.style.position = 'absolute'
      span.style.whiteSpace = 'pre'
      span.textContent = text
      document.body.appendChild(span)
      const w = span.getBoundingClientRect().width
      span.remove()
      return w
    }
    return { cyrillic: probe('Мышцы'), latin: probe('Muscl') }
  })
  check('fonts: mono face measures Cyrillic and Latin identically', Math.abs(widths.cyrillic - widths.latin) < 0.5, JSON.stringify(widths))

  await context.close()
}

// ---------------------------------------------------------------------------------------
// 9. Service worker + offline shell after a warm visit
// ---------------------------------------------------------------------------------------
{
  const context = await contextAt({ width: 390, height: 844 })
  const page = await context.newPage()
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  const reg = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return 'unsupported'
    const r = await navigator.serviceWorker.ready
    return r.active ? r.active.scriptURL : 'no-active'
  })
  check('service worker: activates on a warm visit', /\/sw\.js/.test(String(reg)), String(reg))
  const cacheNames = await page.evaluate(async () => await caches.keys())
  check('service worker: created the build-named shell cache', cacheNames.some(n => /^workout-index-/.test(n)), JSON.stringify(cacheNames))

  // Deep link offline: navigate to a route that was never visited, with the network down.
  await context.setOffline(true)
  const res = await page.goto(`${BASE}/exercise/0001`, { waitUntil: 'domcontentloaded' }).catch(() => null)
  const shellRendered = await page.locator('.detail-name').count().catch(() => 0)
  check('offline: deep link resolves to the cached shell', Boolean(res) && shellRendered > 0, `status=${res ? res.status() : 'n/a'}`)

  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' }).catch(() => null)
  const heading = await page.locator('h1').first().innerText().catch(() => '')
  check('offline: catalogue renders from the cache', /Каталог упражнений/.test(heading), heading)
  await context.setOffline(false)
  await context.close()
}

// ---------------------------------------------------------------------------------------
// 10. No tracker affordances anywhere
// ---------------------------------------------------------------------------------------
{
  const context = await contextAt({ width: 1280, height: 900 })
  const page = await context.newPage()
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  const body = await page.locator('body').innerText()
  const forbidden = ['Добавить в план', 'Избранное', 'Рекорд', 'История', 'Создать упражнение', 'Профиль', 'Войти']
  const found = forbidden.filter(f => body.includes(f))
  check('scope: no tracker/account affordances', found.length === 0, found.join(','))
  await context.close()
}

await browser.close()

const failed = results.filter(r => !r.ok)
writeFileSync(resolve(repoRoot, 'artifacts/scratch/browser-results.json'), JSON.stringify({ base: BASE, results }, null, 2))
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
if (failed.length) {
  console.error('FAILED: ' + failed.map(f => f.name).join(' | '))
  process.exit(1)
}
