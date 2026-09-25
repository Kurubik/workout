// Exercise media URLs and the media display state machine.
//
// Media is NOT part of this repository and never will be: the images and animations are
// third-party content with unresolved upstream rights (see NOTICE.md). They are loaded at
// runtime from the same pinned CDN commit the source project uses, so nothing here
// redistributes them, and the container image stays small and free of them.

/* global __MEDIA_BASE__ */
const FALLBACK_BASE =
  'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@7455efae41b330c265e7cd4b78dfa848e7ce5ebd'

export const MEDIA_BASE = typeof __MEDIA_BASE__ === 'string' ? __MEDIA_BASE__ : FALLBACK_BASE

/** Still image URL for an exercise, or null when the dataset has none. */
export const imageUrl = ex => (ex && ex.img ? `${MEDIA_BASE}/images/${ex.img}` : null)

/** Animation URL for an exercise, or null when the dataset has none. */
export const animationUrl = ex => (ex && ex.gif ? `${MEDIA_BASE}/videos/${ex.gif}` : null)

export const hasMedia = ex => Boolean(ex && ex.img)

// The display state machine, kept pure so its fallback behaviour is testable without a browser.
// `mode` is the user's intent; `failed` records what the network actually delivered.
//
//   'animation' + error -> 'still'   (the still stands in for the animation)
//   'still'     + error -> failed    (the neutral tile stands in for both)
//
// No automatic retry: `retry` (the "Повторить" button) clears the failure once, deliberately.
export const initialMediaState = () => ({ mode: 'animation', failed: null })

export function mediaReducer(state, action) {
  switch (action.type) {
    case 'show-animation': return { mode: 'animation', failed: null }
    case 'show-still': return { mode: 'still', failed: null }
    case 'retry': return { mode: 'still', failed: null }
    case 'error':
      return state.mode === 'animation' && state.failed !== 'animation'
        ? { mode: 'still', failed: 'animation' }
        : { mode: 'still', failed: 'still' }
    default: return state
  }
}

/** Is the animation the thing currently on screen? */
export const isAnimationVisible = (ex, state) =>
  Boolean(ex && ex.gif) && state.mode === 'animation' && state.failed !== 'animation'

/** Has every image source failed? */
export const isMediaDead = state => state.failed === 'still'
