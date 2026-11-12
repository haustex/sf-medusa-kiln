"use client"

import { cn } from "@heroui/styles"
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react"
import { useEffect, useRef, useState, useSyncExternalStore } from "react"

import type { HeroSlide } from "@lib/hero"
import { fill } from "@lib/i18n/dictionaries"
import Link from "@modules/common/components/app-link"
import { ICON } from "@modules/ds/icons"
import ImagePreload from "@modules/ds/image-preload"

export type HeroLabels = { region: string; prev: string; next: string; pause: string; play: string; goTo: string; slideOf: string }

const DESKTOP = "(min-width: 768px)"
const PHONE = `not all and ${DESKTOP}`
/** Ignore the rail's own scroll events for this long after a programmatic scroll (the dots would flicker mid-way) */
const SETTLE_MS = 700

const REDUCED = "(prefers-reduced-motion: reduce)"
const noop = () => {}
const subscribeReduced = (cb: () => void) => {
  const mq = window.matchMedia(REDUCED)
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}
const subscribeVisibility = (cb: () => void) => {
  document.addEventListener("visibilitychange", cb)
  return () => document.removeEventListener("visibilitychange", cb)
}
/** prefers-reduced-motion and tab visibility are external state: read through useSyncExternalStore (false on the server) */
const useReducedMotion = () => useSyncExternalStore(typeof window === "undefined" ? () => noop : subscribeReduced, () => window.matchMedia(REDUCED).matches, () => false)
const useTabHidden = () => useSyncExternalStore(typeof document === "undefined" ? () => noop : subscribeVisibility, () => document.visibilityState !== "visible", () => false)

/**
 * Promo banner slider (Faire-style): full-bleed photo with a radius, a dark gradient scrim and white copy (title,
 * subtitle, one CTA), dots, arrows from md, pause/play. The slides are a native scroll-snap rail, so swiping works
 * before JS and the layout never shifts (fixed 4:5 / 12:5 boxes). Slide 1 is the LCP image: eager, high priority,
 * preloaded for the viewport that will show it; the others load lazily.
 *
 * Autoplay (ms, from theme.config.ts) only with JS, never with prefers-reduced-motion, and it pauses while the
 * pointer is over the slider, while anything inside has focus, while the tab is hidden, and after the user
 * presses pause (WCAG 2.2.2). Arrow keys move the slides when the rail has focus. Slides that are not shown are
 * `inert`, so Tab never lands on an off-screen CTA. One slide: a static banner, no controls.
 */
export default function HeroSlider({ slides, autoplay, labels }: { slides: HeroSlide[]; autoplay: number | false; labels: HeroLabels }) {
  const count = slides.length
  const many = count > 1
  const railRef = useRef<HTMLUListElement>(null)
  const settleUntil = useRef(0)
  const [active, setActive] = useState(0)
  const [hover, setHover] = useState(false)
  const [focus, setFocus] = useState(false)
  const reduced = useReducedMotion()
  const hidden = useTabHidden()
  // null until the user presses pause/play: autoplay runs by default, except with reduced motion (opt-in there)
  const [userPlaying, setUserPlaying] = useState<boolean | null>(null)
  const playing = many && !!autoplay && (userPlaying ?? !reduced)

  // Active slide follows the rail (swipe / scroll)
  useEffect(() => {
    const rail = railRef.current
    if (!rail || !many) return
    let raf = 0
    const onScroll = () => {
      if (Date.now() < settleUntil.current) return
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const width = rail.clientWidth || 1
        setActive(Math.max(0, Math.min(count - 1, Math.round(rail.scrollLeft / width))))
      })
    }
    rail.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      rail.removeEventListener("scroll", onScroll)
      cancelAnimationFrame(raf)
    }
  }, [count, many])

  const go = (i: number) => {
    const rail = railRef.current
    if (!rail) return
    const next = ((i % count) + count) % count
    settleUntil.current = Date.now() + SETTLE_MS
    rail.scrollTo({ left: next * rail.clientWidth, behavior: reduced ? "auto" : "smooth" })
    setActive(next)
  }

  // Autoplay (JS only): one timeout per shown slide, restarted by any navigation; paused while hovered, focused or hidden
  const running = playing && !hover && !focus && !hidden
  useEffect(() => {
    if (!running || !autoplay) return
    const id = window.setTimeout(() => go(active + 1), autoplay)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `go` only reads refs and the current render's state
  }, [running, autoplay, active])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!many) return
    const map: Record<string, number> = { ArrowLeft: active - 1, ArrowRight: active + 1, Home: 0, End: count - 1 }
    if (e.key in map) {
      e.preventDefault()
      go(map[e.key])
    }
  }

  const control = "inline-flex items-center justify-center rounded-full bg-white/90 text-foreground shadow-soft outline-none backdrop-blur-sm hover:bg-white focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"

  return (
    <section
      aria-roledescription={many ? "carousel" : undefined}
      aria-label={labels.region}
      className="content-container"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setFocus(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocus(false)
      }}
    >
      <div className="relative">
        <ul
          ref={railRef}
          tabIndex={many ? 0 : undefined}
          onKeyDown={onKeyDown}
          aria-live={many ? (running ? "off" : "polite") : undefined}
          className={cn("no-scrollbar flex overflow-x-auto rounded-media bg-default outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background", many && "snap-x snap-mandatory")}
          data-testid="hero-slider"
        >
          {slides.map((s, i) => {
            const first = i === 0
            const Title = first ? "h1" : "h2"
            return (
              <li
                key={s.id}
                role={many ? "group" : undefined}
                aria-roledescription={many ? "slide" : undefined}
                aria-label={many ? fill(labels.slideOf, { n: i + 1, total: count }) : undefined}
                inert={many && i !== active ? true : undefined}
                className="relative w-full shrink-0 snap-center"
                data-active={i === active ? "true" : undefined}
              >
                <div className="relative aspect-[4/5] overflow-hidden md:aspect-[12/5]">
                  {first && <ImagePreload href={s.image.mobile} srcSet={s.image.mobile} sizes="100vw" media={PHONE} type="image/jpeg" />}
                  {first && <ImagePreload href={s.image.desktop} srcSet={s.image.desktop} sizes="100vw" media={DESKTOP} type="image/jpeg" />}
                  <picture>
                    <source media={DESKTOP} srcSet={s.image.desktop} />
                    <img
                      src={s.image.mobile}
                      alt={s.alt}
                      width={840}
                      height={1050}
                      loading={first ? "eager" : "lazy"}
                      fetchPriority={first ? "high" : undefined}
                      decoding="async"
                      className="absolute inset-0 size-full object-cover"
                    />
                  </picture>
                  {/* scrim: white copy stays AA on any photo */}
                  <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/10" />
                  <div className="absolute inset-0 flex flex-col justify-end gap-stack-md p-6 pb-14 text-white sm:p-8 sm:pb-14 md:p-12 md:pb-16 lg:p-16 lg:pb-20">
                    <div className="flex max-w-xl flex-col gap-stack-sm">
                      <Title className="type-hero text-balance text-white">{s.title}</Title>
                      {s.subtitle && <p className="max-w-md text-base leading-relaxed text-white/90 sm:text-lg">{s.subtitle}</p>}
                    </div>
                    <Link
                      href={s.href}
                      className="inline-flex h-12 w-fit items-center rounded-control bg-white px-6 text-sm font-medium text-foreground outline-none hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
                      data-testid={first ? "hero-cta" : undefined}
                    >
                      {s.cta}
                    </Link>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>

        {many && (
          <>
            <button type="button" aria-label={labels.prev} onClick={() => go(active - 1)} className={cn(control, "absolute left-4 top-1/2 hidden size-11 -translate-y-1/2 md:inline-flex")}>
              <ChevronLeft {...ICON} />
            </button>
            <button type="button" aria-label={labels.next} onClick={() => go(active + 1)} className={cn(control, "absolute right-4 top-1/2 hidden size-11 -translate-y-1/2 md:inline-flex")}>
              <ChevronRight {...ICON} />
            </button>

            <ol className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1 md:bottom-5" data-testid="hero-dots">
              {slides.map((s, i) => (
                <li key={s.id}>
                  <button
                    type="button"
                    aria-label={fill(labels.goTo, { n: i + 1 })}
                    aria-current={i === active ? "true" : undefined}
                    onClick={() => go(i)}
                    className="flex size-6 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <span aria-hidden="true" className={cn("block h-1.5 rounded-full bg-white transition-all", i === active ? "w-5" : "w-1.5 opacity-50")} />
                  </button>
                </li>
              ))}
            </ol>

            {autoplay && (
              <button
                type="button"
                aria-label={playing ? labels.pause : labels.play}
                onClick={() => setUserPlaying(!playing)}
                className={cn(control, "absolute bottom-3 right-3 size-9 md:bottom-5 md:right-5")}
                data-testid="hero-playpause"
              >
                {playing ? <Pause {...ICON} size={16} /> : <Play {...ICON} size={16} />}
              </button>
            )}
          </>
        )}
      </div>
    </section>
  )
}
