// Service-worker registration.
//
// The worker itself is generated at build time from the real output (scripts/build-sw.mjs), so
// it is only present in a production build. In development the request would 404 and log noise,
// so registration is guarded by the build flag as well as by feature detection.

export function registerServiceWorker() {
  if (!import.meta.env.PROD) return
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
  if (!window.isSecureContext && location.hostname !== 'localhost') return
  // Registered as the module runs, not on `load`: a cold first visit that immediately loses the
  // network must still have the shell cached.
  navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
    // A failed registration never breaks the app — the page simply runs online-only.
  })
}
