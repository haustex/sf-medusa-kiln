"use client"

import { useEffect } from "react"

/**
 * The header collapses to its top row (logo, search, icons) while scrolling down and shows the second row (the
 * search field on phones, the category row from md) again when scrolling up, near the top, or when focus moves into
 * it. Only a data attribute changes; the row slides and fades with `transform` + `opacity` (no layout shift: the
 * header keeps its height). On phones the search icon reveals the row and focuses the search field (without JS it
 * is a link to /search). A 6px dead zone so a jittery finger never flickers it.
 */
export default function HeaderScroll({ id }: { id: string }) {
  useEffect(() => {
    const header = document.getElementById(id)
    if (!header) return
    const phone = window.matchMedia("(max-width: 767.98px)")
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)")
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
        // reduced motion: the row still tucks away (instantly, no transition), but only after a clear scroll
        const dead = motion.matches ? 24 : 6
        if (y < 120) set(false)
        else if (y > last + dead) set(true)
        else if (y < last - dead) set(false)
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
