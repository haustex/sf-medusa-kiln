import { cn } from "@heroui/styles"
import SectionHeader from "./section-header"

/**
 * Page section: optional header + content, header -> content = section-head.
 * No vertical padding of its own: the parent <Page>/<Stack gap="section"> spaces
 * sections, so two neighbours never add up their padding.
 */
export default function Section({
  id,
  title,
  eyebrow,
  description,
  action,
  titleHidden,
  headerExtra,
  contained = true,
  className,
  children,
}: {
  /** Used for the heading id (`${id}-title`) and aria-labelledby. */
  id: string
  title?: string
  eyebrow?: string
  description?: string
  /** Small "View all" text link on the title line */
  action?: { label: string; href: string }
  /** Keep the h2 for screen readers/outline but hide it visually. */
  titleHidden?: boolean
  /** Extra controls next to the action (e.g. carousel arrows). */
  headerExtra?: React.ReactNode
  /** Wrap in .content-container (default). */
  contained?: boolean
  className?: string
  children: React.ReactNode
}) {
  const headingId = `${id}-title`
  return (
    <section
      aria-labelledby={title ? headingId : undefined}
      className={cn("flex flex-col gap-section-head", contained && "content-container", className)}
    >
      {title &&
        (titleHidden ? (
          <h2 id={headingId} className="sr-only">
            {title}
          </h2>
        ) : (
          <SectionHeader
            id={headingId}
            title={title}
            eyebrow={eyebrow}
            description={description}
            action={action}
          >
            {headerExtra}
          </SectionHeader>
        ))}
      {children}
    </section>
  )
}
