import { useEffect } from 'react'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import Catalogue from './views/Catalogue.jsx'
import Exercise from './views/Exercise.jsx'
import { t } from './lib/i18n.js'

function NotFound() {
  return (
    <main className="page">
      <div className="panel empty-panel">
        <h1 className="h1">{t('notFoundTitle')}</h1>
        <p className="lede">{t('notFoundHint')}</p>
        <Link className="btn" to="/">{t('backToCatalogue')}</Link>
      </div>
    </main>
  )
}

function ScrollToTopOnRoute() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

export default function App() {
  return (
    <div className="app">
      <div className="crt" aria-hidden="true">
        <span className="crt-scanlines" />
        <span className="crt-sweep" />
        <span className="crt-vignette" />
      </div>
      <header className="topbar">
        <Link className="brand" to="/">
          <span className="brand-mark">WORKOUT<span className="brand-sep">//</span>INDEX</span>
          <span className="brand-sub">{t('tagline')}</span>
        </Link>
      </header>
      <ScrollToTopOnRoute />
      <Routes>
        <Route path="/" element={<Catalogue />} />
        <Route path="/exercise/:id" element={<Exercise />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <footer className="footer">
        <span>WORKOUT//INDEX</span>
        <span className="footer-dim">AGPL-3.0-or-later · {t('installedOfflineHint')}</span>
      </footer>
    </div>
  )
}
