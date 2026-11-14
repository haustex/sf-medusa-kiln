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
