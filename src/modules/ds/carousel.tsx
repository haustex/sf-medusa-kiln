import { cn } from "@heroui/styles"
import { Children } from "react"
import CarouselControls from "./carousel-controls"
import Section from "./section"

const widths = {
  // phones: ~1.6 cards visible so the next one peeks in
  product: "w-[62%] sm:w-[38%] md:w-[30%] lg:w-[calc((100%-3*var(--space-gutter))/4)]",
  tile: "w-[42%] sm:w-[30%] md:w-[23%] lg:w-[calc((100%-4*var(--space-gutter))/5)]",
}

/**
 * Horizontal themed rail (shop.com-style): native scroll + snap, swipe on phones,
 * arrow buttons from md up. Server-rendered; items stay crawlable links.
 */
export default function Carousel({
  id,
  title,
  eyebrow,
  description,
  action,
  item = "product",
  labels = { prev: "Sebelumnya", next: "Berikutnya" },
  contained = true,
  className,
  children,
}: {
  /** Unique on the page; used for the rail id and aria-labelledby. */
  id: string
  title: string
  eyebrow?: string
  description?: string
  action?: { label: string; href: string }
  item?: keyof typeof widths
  labels?: { prev: string; next: string }
  /** Wrap in .content-container (default); false when already inside one. */
  contained?: boolean
  className?: string
  children: React.ReactNode
}) {
  const railId = `${id}-rail`
  return (
    <Section
      id={id}
      title={title}
      eyebrow={eyebrow}
      description={description}
      action={action}
      contained={contained}
      className={className}
      headerExtra={<CarouselControls targetId={railId} prevLabel={labels.prev} nextLabel={labels.next} />}
    >
      {/* Bleeds to the screen edge on phones (swipe), aligned to the grid on desktop. */}
      <ul
        id={railId}
        className="no-scrollbar -mx-container-x flex snap-x snap-mandatory gap-gutter overflow-x-auto scroll-px-container-x px-container-x lg:mx-0 lg:scroll-px-0 lg:px-0"
      >
        {Children.toArray(children).map((child, i) => (
          <li key={i} className={cn("shrink-0 snap-start", widths[item])}>
            {child}
          </li>
        ))}
      </ul>
    </Section>
  )
}
