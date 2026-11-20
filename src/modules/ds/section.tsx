import { cn } from "@heroui/styles"
import { __iconData as arrowRight } from "lucide-react/icons/arrow-right"

import Link from "@modules/common/components/app-link"
import { Icon } from "./icons"
import SectionHeader from "./section-header"

/**
 * Page section: optional header + content, header -> content = section-head, then an optional "See all →" glass
 * pill centred under the content (`action`; shown whatever the number of items). No vertical padding of its own:
 * the parent <Page>/<Stack gap="section"> spaces sections, so two neighbours never add up their padding.
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
  /** "See all →" pill centred under the content */
  action?: { label: string; href: string }
  /** Keep the h2 for screen readers/outline but hide it visually. */
  titleHidden?: boolean
  /** Extra controls on the title line (e.g. carousel arrows). */
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
          >
            {headerExtra}
          </SectionHeader>
        ))}
      {children}
      {action && (
        <div className="flex justify-center">
          <Link href={action.href} className="glass inline-flex h-11 items-center gap-1.5 rounded-button px-5 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2" data-testid="section-action">
            {action.label}
            <Icon icon={arrowRight} size={16} />
          </Link>
        </div>
      )}
    </section>
  )
}
