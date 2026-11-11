import { breadcrumbsVariants, cn } from "@heroui/styles"
import { ChevronRight } from "lucide-react"
import Link from "@modules/common/components/app-link"

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
                <ChevronRight aria-hidden="true" focusable={false} size={16} strokeWidth={1.5} className={s.separator()} />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
