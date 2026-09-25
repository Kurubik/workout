import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  MEDIA_BASE, imageUrl, animationUrl, hasMedia,
  initialMediaState, mediaReducer, isAnimationVisible, isMediaDead
} from '../src/lib/media.js'
import Media from '../src/components/Media.jsx'
import Thumb from '../src/components/Thumb.jsx'

const withMedia = { id: '0001', n: '3/4 sit-up', img: '0001-x.jpg', gif: '0001-x.gif' }
const stillOnly = { id: '0002', n: 'no animation', img: '0002-y.jpg', gif: '' }
const noMedia = { id: '9999', n: 'custom', img: '', gif: '' }

describe('media urls', () => {
  it('pins the CDN commit the source project uses', () => {
    expect(MEDIA_BASE).toMatch(/exercises-dataset@7455efae41b330c265e7cd4b78dfa848e7ce5ebd$/)
  })

  it('builds image and animation urls from the pinned base', () => {
    expect(imageUrl(withMedia)).toBe(`${MEDIA_BASE}/images/0001-x.jpg`)
    expect(animationUrl(withMedia)).toBe(`${MEDIA_BASE}/videos/0001-x.gif`)
    expect(animationUrl(noMedia)).toBeNull()
    expect(hasMedia(noMedia)).toBe(false)
    expect(hasMedia(withMedia)).toBe(true)
  })
})

describe('media state machine', () => {
  it('shows the animation first', () => {
    const s = initialMediaState()
    expect(isAnimationVisible(withMedia, s)).toBe(true)
    expect(isMediaDead(s)).toBe(false)
  })

  it('demotes a failed animation to the still', () => {
    const s = mediaReducer(initialMediaState(), { type: 'error' })
    expect(s).toEqual({ mode: 'still', failed: 'animation' })
    expect(isAnimationVisible(withMedia, s)).toBe(false)
    expect(isMediaDead(s)).toBe(false)
  })

  it('demotes a failed still to the neutral tile', () => {
    let s = mediaReducer(initialMediaState(), { type: 'error' })
    s = mediaReducer(s, { type: 'error' })
    expect(s.failed).toBe('still')
    expect(isMediaDead(s)).toBe(true)
  })

  it('never loops: repeated errors stay failed instead of retrying', () => {
    let s = initialMediaState()
    for (let i = 0; i < 5; i++) s = mediaReducer(s, { type: 'error' })
    expect(isMediaDead(s)).toBe(true)
    expect(s).toEqual({ mode: 'still', failed: 'still' })
  })

  it('recovers only on a deliberate retry', () => {
    let s = mediaReducer(mediaReducer(initialMediaState(), { type: 'error' }), { type: 'error' })
    s = mediaReducer(s, { type: 'retry' })
    expect(s).toEqual({ mode: 'still', failed: null })
    s = mediaReducer(s, { type: 'show-animation' })
    expect(s).toEqual({ mode: 'animation', failed: null })
  })

  it('does not claim an animation an exercise does not have', () => {
    expect(isAnimationVisible(stillOnly, initialMediaState())).toBe(false)
  })
})

describe('media rendering', () => {
  it('renders the still/animation toggle for an exercise with media', () => {
    const html = renderToStaticMarkup(<Media ex={withMedia} />)
    expect(html).toContain('Анимация')
    expect(html).toContain('Кадр')
    expect(html).toContain(`${MEDIA_BASE}/videos/0001-x.gif`)
  })

  it('disables the animation control when there is no animation', () => {
    const html = renderToStaticMarkup(<Media ex={stillOnly} />)
    expect(html).toContain('disabled')
    expect(html).toContain(`${MEDIA_BASE}/images/0002-y.jpg`)
  })

  it('states plainly when an exercise has no media at all', () => {
    const html = renderToStaticMarkup(<Media ex={noMedia} />)
    expect(html).toContain('Для этого упражнения нет анимации.')
  })

  it('renders a fallback tile instead of a broken-image glyph when the dataset has no image', () => {
    const html = renderToStaticMarkup(<Thumb ex={noMedia} />)
    expect(html).not.toContain('<img')
    expect(html).toContain('thumb-x')
  })

  it('renders a lazy thumbnail for an exercise with an image', () => {
    const html = renderToStaticMarkup(<Thumb ex={withMedia} />)
    expect(html).toContain('loading="lazy"')
    expect(html).toContain(`${MEDIA_BASE}/images/0001-x.jpg`)
  })
})
