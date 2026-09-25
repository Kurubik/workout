import { useReducer } from 'react'
import {
  animationUrl, imageUrl, hasMedia, initialMediaState, mediaReducer, isAnimationVisible, isMediaDead
} from '../lib/media.js'
import { t } from '../lib/i18n.js'

// Still image / animation with an explicit toggle and an honest, bounded failure path.
// The state machine lives in lib/media.js; this component only renders it.
export default function Media({ ex }) {
  const [state, dispatch] = useReducer(mediaReducer, undefined, initialMediaState)

  if (!hasMedia(ex)) {
    return (
      <figure className="media media-none">
        <div className="media-tile"><span className="mono">//</span></div>
        <figcaption className="media-note">{t('mediaNoAnimation')}</figcaption>
      </figure>
    )
  }

  if (isMediaDead(state)) {
    return (
      <figure className="media media-failed">
        <div className="media-tile media-tile-failed">
          <span className="mono">{t('mediaUnavailable')}</span>
        </div>
        <figcaption className="media-note">{t('mediaUnavailableHint')}</figcaption>
        <button type="button" className="btn ghost sm" onClick={() => dispatch({ type: 'retry' })}>
          {t('mediaRetry')}
        </button>
      </figure>
    )
  }

  const showAnimation = isAnimationVisible(ex, state)
  const src = showAnimation ? animationUrl(ex) : imageUrl(ex)

  return (
    <figure className="media">
      <div className="media-frame">
        <img
          className="media-img" src={src} alt={ex.n}
          decoding="async" draggable={false}
          onError={() => dispatch({ type: 'error' })}
        />
      </div>
      <div className="media-bar">
        <div className="media-toggle" role="group" aria-label="Медиа">
          <button
            type="button" className={'chip' + (showAnimation ? ' on' : '')}
            aria-pressed={showAnimation} disabled={!animationUrl(ex)}
            onClick={() => dispatch({ type: 'show-animation' })}
          >{t('mediaShowAnimation')}</button>
          <button
            type="button" className={'chip' + (!showAnimation ? ' on' : '')}
            aria-pressed={!showAnimation}
            onClick={() => dispatch({ type: 'show-still' })}
          >{t('mediaShowStill')}</button>
        </div>
      </div>
      {state.failed === 'animation' && (
        <figcaption className="media-note">{t('mediaUnavailable')} · {t('mediaShowStill')}</figcaption>
      )}
    </figure>
  )
}
