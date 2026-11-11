"use client"

import { useEffect } from "react"

/**
 * Phones only (< md): the fixed header collapses to its top row (wordmark + search icon + cart) while scrolling
 * down and shows the search + category rows again when scrolling up, near the top, or when focus moves into them.
 * Only a data attribute changes; the rows slide with `transform` (no layout shift: the spacer keeps its height).
 * The search icon reveals the rows and focuses the search field (without JS it is a link to /search).
 */
export default function HeaderScroll({ id }: { id: string }) {
  useEffect(() => {
    const header = document.getElementById(id)
    if (!header) return
    const phone = window.matchMedia("(max-width: 767.98px)")
    let last = window.scrollY
    let ticking = false
    const set = (collapsed: boolean) => {
      if (collapsed) header.setAttribute("data-collapsed", "")
      else header.removeAttribute("data-collapsed")
    }
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        ticking = false
        const y = window.scrollY
        if (!phone.matches || y < 120) set(false)
        else if (y > last + 6) set(true)
        else if (y < last - 6) set(false)
        last = y
      })
    }
    const onFocus = () => set(false)
    const onClick = (e: MouseEvent) => {
      const toggle = (e.target as Element | null)?.closest("[data-search-toggle]")
      if (!toggle || !phone.matches) return
      const input = header.querySelector<HTMLInputElement>("[data-header-secondary] input[name=q]")
      if (!input) return
      e.preventDefault()
      set(false)
      input.focus({ preventScroll: true })
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    header.addEventListener("focusin", onFocus)
    header.addEventListener("click", onClick)
    return () => {
      window.removeEventListener("scroll", onScroll)
      header.removeEventListener("focusin", onFocus)
      header.removeEventListener("click", onClick)
    }
  }, [id])
  return null
}
