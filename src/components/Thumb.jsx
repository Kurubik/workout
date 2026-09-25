import { useState } from 'react'
import { imageUrl } from '../lib/media.js'

/** Lazy catalogue thumbnail with an honest fallback tile — never a broken-image glyph. */
export default function Thumb({ ex }) {
  const [failed, setFailed] = useState(false)
  const src = imageUrl(ex)
  if (!src || failed) {
    return <div className="thumb thumb-x" aria-hidden="true"><span className="thumb-x-mark mono">//</span></div>
  }
  return (
    <img
      className="thumb" src={src} alt="" loading="lazy" decoding="async"
      draggable={false} onError={() => setFailed(true)}
    />
  )
}
