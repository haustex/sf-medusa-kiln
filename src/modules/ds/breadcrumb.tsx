import { breadcrumbsVariants, cn } from "@heroui/styles"
import { __iconData as chevronRight } from "lucide-react/icons/chevron-right"

import Link from "@modules/common/components/app-link"
import { Icon } from "@modules/ds/icons"

export type Crumb = { label: string; href?: string }

/** HeroUI Breadcrumbs styles as plain server markup. The last item is the current page. */
export default function Breadcrumb({ items, label = "Breadcrumb", className }: { items: Crumb[]; label?: string; className?: string }) {
  const s = breadcrumbsVariants()
  return (
    <nav aria-label={label} className={cn("overflow-x-auto no-scrollbar", className)}>
      <ol className={cn(s.base(), "whitespace-nowrap")}>
        {items.map((item, i) => {
          const last = i === items.length - 1
          return (
            <li key={`${item.label}-${i}`} className={s.item()}>
              {item.href && !last ? (
                <Link href={item.href} className={s.link()}>
                  {item.label}
                </Link>
              ) : (
                <span className={s.link()} data-current={last ? "true" : undefined} aria-current={last ? "page" : undefined}>
                  {item.label}
                </span>
              )}
              {!last && (
                <Icon icon={chevronRight} size={16} className={s.separator()} />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
