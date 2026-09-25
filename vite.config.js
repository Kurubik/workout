import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Static, backend-free SPA served from the site root. No proxy, no API, no analytics: the
// build has no environment-dependent branches beyond the pinned media base below.
const MEDIA_BASE = process.env.VITE_MEDIA_BASE ||
  'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@7455efae41b330c265e7cd4b78dfa848e7ce5ebd'

export default defineConfig({
  base: '/',
  define: { __MEDIA_BASE__: JSON.stringify(MEDIA_BASE) },
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // One deliberate chunk. The Russian instruction pack (~1 MB raw) ships in the initial
    // bundle on purpose: the detail route must render the steps without a loading state, and
    // search covers instruction text too, so splitting it out would either delay the detail
    // render or silently narrow the search. The whole shell is ~236 kB gzip and is cached by
    // the service worker after the first visit, so the limit is raised rather than pretended
    // away — this is a decision, not an unnoticed warning.
    chunkSizeWarningLimit: 1800
  },
  test: {
    environment: 'happy-dom',
    include: ['tests/**/*.test.js', 'tests/**/*.test.jsx'],
    globals: false
  }
})
