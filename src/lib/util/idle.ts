/**
 * Runs `cb` once the browser is idle (requestIdleCallback, or a timer where it is missing: Safari), at the latest
 * after `timeout` ms. Returns the cancel function, made for a useEffect cleanup.
 */
export function onIdle(cb: () => void, timeout = 2500): () => void {
  const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void }
  if (w.requestIdleCallback) {
    const id = w.requestIdleCallback(cb, { timeout })
    return () => w.cancelIdleCallback?.(id)
  }
  const id = window.setTimeout(cb, timeout)
  return () => window.clearTimeout(id)
}

const INPUT_EVENTS = ["pointerdown", "keydown", "touchstart"] as const

/**
 * Runs `cb` once, on the visitor's first input (pointer, key or touch, anywhere on the page). For warming up code
 * that a tap may need next: unlike an idle callback it costs nothing while the page is merely loading and being
 * read, so it leaves the loading metrics (TBT, TTI) alone. Returns the cancel function.
 */
export function onFirstInput(cb: () => void): () => void {
  const off = () => INPUT_EVENTS.forEach((e) => window.removeEventListener(e, fire, true))
  const fire = () => {
    off()
    cb()
  }
  INPUT_EVENTS.forEach((e) => window.addEventListener(e, fire, { capture: true, passive: true }))
  return off
}
