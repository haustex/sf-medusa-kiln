"use client"

import { buttonVariants, cn } from "@heroui/styles"
import { ChevronLeft, ChevronRight } from "lucide-react"
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
    dir === "left" ? <ChevronLeft aria-hidden="true" focusable={false} size={16} strokeWidth={1.75} /> : <ChevronRight aria-hidden="true" focusable={false} size={16} strokeWidth={1.75} />
  )
}
