import { cn } from "@heroui/styles"

/**
 * Section title row: an optional eyebrow (type-label, muted) above the h2 (type-h2: 26px, weight 500, -0.02em),
 * an optional description under it, and on the same line as the title the extra controls (carousel arrows). The
 * "See all" link is not here: <Section> puts it as a pill under the content. No outer margin: <Section> spaces it.
 */
export default function SectionHeader({
  title,
  eyebrow,
  description,
  as: Heading = "h2",
  id,
  className,
  children,
}: {
  title: string
  eyebrow?: string
  description?: string
  as?: "h1" | "h2" | "h3"
  /** Heading id, for aria-labelledby on the section. */
  id?: string
  className?: string
  /** Extra controls on the right (e.g. carousel arrows). */
  children?: React.ReactNode
}) {
  const hasRight = !!children
  return (
    <div className={cn("flex items-start justify-between gap-stack-md", className)}>
      <div className="flex min-w-0 flex-col gap-stack-xs">
        {eyebrow && <p className="type-label text-muted">{eyebrow}</p>}
        <Heading id={id} className="type-h2">
          {title}
        </Heading>
        {description && <p className="max-w-2xl text-sm text-muted sm:text-base">{description}</p>}
      </div>
      {hasRight && (
        // Centred on the title line (26px × 1.15 line height), under the eyebrow when there is one
        <div className={cn("flex h-[1.87rem] shrink-0 items-center gap-stack-sm", eyebrow && "mt-[calc(1rem+var(--space-stack-xs))]")}>
          {children}
        </div>
      )}
    </div>
  )
}
