import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { EXIDX, instructionsFor, primariesOf, secondariesOf } from '../lib/catalogue.js'
import { bodyPartName, equipmentName, muscleName, CARDIO_MUSCLE } from '../lib/muscles.js'
import { t } from '../lib/i18n.js'
import { useMeta } from '../lib/meta.js'
import Media from '../components/Media.jsx'

function Tag({ children, kind }) {
  return <span className={'tag' + (kind ? ' tag-' + kind : '')}>{children}</span>
}

export default function Exercise() {
  const { id } = useParams()
  const navigate = useNavigate()
  const ex = EXIDX[id]
  const [shareState, setShareState] = useState(null)

  useMeta(
    ex ? `${ex.n} — техника выполнения | WORKOUT//INDEX` : `${t('notFoundTitle')} | WORKOUT//INDEX`,
    ex
      ? `${ex.n}: ${bodyPartName(ex.bp)}, ${equipmentName(ex.eq)}. Техника выполнения по шагам, целевые и вспомогательные мышцы.`
      : 'Упражнение не найдено в каталоге WORKOUT//INDEX.'
  )

  // A direct link is the primary entry point, so the back control falls back to the catalogue
  // when there is no in-app history to step back into.
  const back = useCallback(() => {
    if (window.history.length > 1) navigate(-1)
    else navigate('/')
  }, [navigate])

  const share = useCallback(async () => {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: ex ? ex.n : 'WORKOUT//INDEX', url })
        setShareState('copied')
        return
      }
      await navigator.clipboard.writeText(url)
      setShareState('copied')
    } catch {
      setShareState('failed')
    }
  }, [ex])

  if (!ex) {
    return (
      <main className="page">
        <div className="panel empty-panel">
          <h1 className="h1">{t('notFoundTitle')}</h1>
          <p className="lede">{t('notFoundHint')}</p>
          <p className="mono small dim">{t('exerciseId')}: {id}</p>
          <Link className="btn" to="/">{t('backToCatalogue')}</Link>
        </div>
      </main>
    )
  }

  const primaries = primariesOf(ex)
  const secondaries = secondariesOf(ex)
  const steps = instructionsFor(ex.id)

  return (
    <main className="page detail">
      <nav className="crumbs">
        <button type="button" className="btn ghost sm" onClick={back}>{t('backToCatalogue')}</button>
        <span className="mono small dim">{t('exerciseId')} {ex.id}</span>
      </nav>

      <article className="panel detail-panel">
        <header className="detail-head">
          <h1 className="h1 detail-name">{ex.n}</h1>
          <div className="tags">
            <Tag kind="acc">{bodyPartName(ex.bp)}</Tag>
            <Tag>{equipmentName(ex.eq)}</Tag>
            {ex.bp === 'cardio' && <Tag>{muscleName(CARDIO_MUSCLE)}</Tag>}
          </div>
        </header>

        <dl className="facts">
          <div className="fact">
            <dt className="mono">{t('bodyPartLabel')}</dt>
            <dd>{bodyPartName(ex.bp)}</dd>
          </div>
          <div className="fact">
            <dt className="mono">{t('equipmentLabel')}</dt>
            <dd>{equipmentName(ex.eq)}</dd>
          </div>
        </dl>

        <Media ex={ex} />

        <section className="detail-section">
          <h2 className="h2">{t('targetMuscles')}</h2>
          <div className="tags">
            {primaries.length
              ? primaries.map(m => <Tag key={m} kind="acc">{muscleName(m)}</Tag>)
              : <span className="dim">—</span>}
          </div>
        </section>

        {secondaries.length > 0 && (
          <section className="detail-section">
            <h2 className="h2">{t('secondaryMuscles')}</h2>
            <div className="tags">
              {secondaries.map(m => <Tag key={m}>{muscleName(m)}</Tag>)}
            </div>
          </section>
        )}

        <section className="detail-section">
          <h2 className="h2">{t('howTo')}</h2>
          {steps.length
            ? <ol className="steps">{steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
            : <p className="dim">—</p>}
        </section>

        <div className="detail-actions">
          <button type="button" className="btn" onClick={share}>{t('shareLink')}</button>
          {shareState === 'copied' && <span className="mono small ok" role="status">{t('shareCopied')}</span>}
          {shareState === 'failed' && <span className="mono small bad" role="status">{t('shareFailed')}</span>}
        </div>
      </article>
    </main>
  )
}
