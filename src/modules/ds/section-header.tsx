import { cn } from "@heroui/styles"
import Link from "@modules/common/components/app-link"

/**
 * Section title row: an optional eyebrow (type-label, muted) above the h2 (type-h2: 26px, weight 500, -0.02em),
 * an optional description under it, and on the same line as the title a small text link on the right
 * ("View all", 14px, underline on hover). No arrows, no pills. No outer margin: <Section> spaces it from the content.
 */
export default function SectionHeader({
  title,
  eyebrow,
  description,
  action,
  as: Heading = "h2",
  id,
  className,
  children,
}: {
  title: string
  eyebrow?: string
  description?: string
  /** Small text link on the title line */
  action?: { label: string; href: string }
  as?: "h1" | "h2" | "h3"
  /** Heading id, for aria-labelledby on the section. */
  id?: string
  className?: string
  /** Extra controls on the right (e.g. carousel arrows). */
  children?: React.ReactNode
}) {
  const hasRight = !!action || !!children
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
          {action && (
            <Link href={action.href} className="rounded-sm text-sm underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-focus" data-testid="section-action">
              {action.label}
            </Link>
          )}
          {children}
        </div>
      )}
    </div>
  )
}
