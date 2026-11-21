import { cn } from "@heroui/styles"

import config from "@theme"

/**
 * Title block of a listing page (store, categories, collections, blog, search), shop.com-like: the h1 in type-h1
 * (big, bold, tight tracking) with the description as one muted line under it, centred by default
 * (theme.config.ts pageHeader.align; "left" keeps both at the left edge). No breadcrumb above it: the trail is
 * structured data only (theme.config.ts breadcrumb). `children` go under the description (a search field, chips).
 */
export default function PageHeader({
  title,
  description,
  titleTestId,
  className,
  children,
}: {
  title: string
  description?: string | null
  titleTestId?: string
  className?: string
  children?: React.ReactNode
}) {
  const center = config.pageHeader.align === "center"
  return (
    <header className={cn("flex flex-col gap-stack-sm", center && "items-center text-center", className)} data-align={config.pageHeader.align}>
      <h1 className="type-h1" data-testid={titleTestId}>
        {title}
      </h1>
      {description && <p className="type-body max-w-3xl text-pretty text-muted" data-testid={titleTestId ? `${titleTestId}-description` : undefined}>{description}</p>}
      {children}
    </header>
  )
}
