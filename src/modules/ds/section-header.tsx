import { buttonVariants, cn } from "@heroui/styles"
import Link from "@modules/common/components/app-link"
import { ArrowRight } from "./icons"

/**
 * Section title row: optional eyebrow, h2, description (one tight group,
 * gap stack-xs) and a pill action aligned with the title on the right.
 * No outer margin: <Section> spaces it from the content.
 */
export default function SectionHeader({
  title,
  eyebrow,
  description,
  action,
  titleHref,
  as: Heading = "h2",
  size = "heading",
  id,
  className,
  children,
}: {
  title: string
  eyebrow?: string
  description?: string
  action?: { label: string; href: string }
  /** Makes the title a link with a chevron (shop.com "Categories >"). */
  titleHref?: string
  as?: "h1" | "h2" | "h3"
  /** "display": large section title (type-section, 28px+); "heading": smaller (type-heading) */
  size?: "display" | "heading"
  /** Heading id, for aria-labelledby on the section. */
  id?: string
  className?: string
  /** Extra controls on the right (e.g. carousel arrows). */
  children?: React.ReactNode
}) {
  const hasRight = !!action || !!children
  return (
    <div className={cn("flex justify-between gap-stack-md", size === "display" ? "items-end" : "items-start", className)}>
      <div className="flex min-w-0 flex-col gap-stack-xs">
        {eyebrow && <p className="type-eyebrow">{eyebrow}</p>}
        <Heading id={id} className={size === "display" ? "type-section" : "type-heading"}>
          {titleHref ? (
            <Link href={titleHref} className="group inline-flex items-center gap-1 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-focus">
              {title}
              <svg aria-hidden="true" viewBox="0 0 16 16" className="size-[0.8em] transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m6 3.5 4.5 4.5L6 12.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          ) : (
            title
          )}
        </Heading>
        {description && <p className="max-w-2xl text-sm text-muted sm:text-base">{description}</p>}
      </div>
      {hasRight && (
        // Same height as the title line, so the pill sits on the title row.
        <div className={cn("flex shrink-0 items-center gap-stack-sm", eyebrow && size !== "display" && "pt-[calc(1rem+var(--space-stack-xs))]")}>
          {action && (
            <Link href={action.href} className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "h-9 gap-1.5 px-4")}>
              {action.label}
              <ArrowRight />
            </Link>
          )}
          {children}
        </div>
      )}
    </div>
  )
}
