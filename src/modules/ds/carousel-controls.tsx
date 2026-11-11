"use client"

import { buttonVariants, cn } from "@heroui/styles"
import { useEffect, useState } from "react"

/**
 * Prev/next buttons for <Carousel>. The only client JS of the carousel: the rail
 * itself is native horizontal scroll with snap points (swipe on phones).
 */
export default function CarouselControls({
  targetId,
  prevLabel,
  nextLabel,
}: {
  targetId: string
  prevLabel: string
  nextLabel: string
}) {
  const [edges, setEdges] = useState({ start: true, end: false })

  useEffect(() => {
    const el = document.getElementById(targetId)
    if (!el) return
    const update = () =>
      setEdges({
        start: el.scrollLeft <= 4,
        end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4,
      })
    update()
    el.addEventListener("scroll", update, { passive: true })
    window.addEventListener("resize", update)
    return () => {
      el.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
    }
  }, [targetId])

  const scroll = (dir: 1 | -1) => {
    const el = document.getElementById(targetId)
    if (!el) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: reduce ? "auto" : "smooth" })
  }

  if (edges.start && edges.end) return null

  const btn = cn(buttonVariants({ variant: "outline", size: "sm", isIconOnly: true }), "")
  return (
    <div className="hidden gap-stack-sm md:flex">
      <button type="button" className={btn} aria-controls={targetId} aria-label={prevLabel} disabled={edges.start} onClick={() => scroll(-1)}>
        <Chevron dir="left" />
      </button>
      <button type="button" className={btn} aria-controls={targetId} aria-label={nextLabel} disabled={edges.end} onClick={() => scroll(1)}>
        <Chevron dir="right" />
      </button>
    </div>
  )
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d={dir === "left" ? "M10 3.5 5.5 8l4.5 4.5" : "m6 3.5 4.5 4.5L6 12.5"} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
