"use client"

import { cn } from "@heroui/styles"
import { useEffect, useRef, useState } from "react"

/**
 * Client shell of the product gallery: the rail (children) is server-rendered and scrolls/snaps on its own, so
 * the page works without JS. With JS: the thumbnails (server-rendered too, passed as `thumbs`) scroll the rail to
 * a photo, and scrolling the rail moves the active thumbnail and the dots.
 */
export default function GalleryFrame({ thumbs, label, showPhoto, className, children }: { thumbs: React.ReactNode[]; label: string; /** "Show photo {n}" */ showPhoto: string; className?: string; children: React.ReactNode }) {
  const railRef = useRef<HTMLUListElement>(null)
  const [active, setActive] = useState(0)
  const count = thumbs.length

  useEffect(() => {
    const rail = railRef.current
    if (!rail || count < 2) return
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const slide = rail.firstElementChild as HTMLElement | null
        const width = slide?.offsetWidth || rail.clientWidth
        setActive(Math.max(0, Math.min(count - 1, Math.round(rail.scrollLeft / width))))
      })
    }
    rail.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      rail.removeEventListener("scroll", onScroll)
      cancelAnimationFrame(raf)
    }
  }, [count])

  const go = (i: number) => {
    const rail = railRef.current
    const slide = rail?.children[i] as HTMLElement | undefined
    if (!rail || !slide) return
    rail.scrollTo({ left: slide.offsetLeft - rail.offsetLeft, behavior: "smooth" })
    setActive(i)
  }

  return (
    <div className={cn("flex flex-col gap-stack-sm", className)}>
      <ul ref={railRef} tabIndex={count > 1 ? 0 : undefined} aria-label={count > 1 ? label : undefined} className="no-scrollbar -mx-container-x flex snap-x snap-mandatory overflow-x-auto scroll-smooth outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus sm:mx-0 sm:rounded-media">
        {children}
      </ul>
      {count > 1 && (
        <>
          {/* dots: phones */}
          <ol className="flex justify-center gap-1.5 sm:hidden" aria-hidden="true">
            {thumbs.map((_, i) => (
              <li key={i} className={cn("h-1.5 rounded-full bg-foreground transition-all", i === active ? "w-5" : "w-1.5 opacity-30")} />
            ))}
          </ol>
          {/* thumbnails: from sm */}
          <ol className="hidden gap-stack-sm sm:grid sm:grid-cols-5 lg:grid-cols-6">
            {thumbs.map((thumb, i) => (
              <li key={i}>
                <button type="button" onClick={() => go(i)} aria-label={showPhoto.replace("{n}", String(i + 1))} aria-current={i === active ? "true" : undefined} className={cn("block w-full overflow-hidden rounded-media outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-focus", i === active ? "ring-2 ring-foreground" : "hover:opacity-80")}>
                  {thumb}
                </button>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  )
}
