// Small sessionStorage helpers for list depth and scroll position. Every access is guarded:
// private-mode browsers and disabled storage must degrade to "no memory", never to a crash.

export function readSession(key, fallback) {
  try {
    const raw = window.sessionStorage.getItem(key)
    return raw == null ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function writeSession(key, value) {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable — the list simply does not remember where you were */
  }
}
