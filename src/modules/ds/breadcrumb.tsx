import { breadcrumbsVariants, cn } from "@heroui/styles"
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
                <svg aria-hidden="true" viewBox="0 0 16 16" className={s.separator()} fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="m6 3.5 4.5 4.5L6 12.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
