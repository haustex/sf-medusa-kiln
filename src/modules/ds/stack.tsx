import { cn } from "@heroui/styles"

/** Literal classes so Tailwind's scanner sees them. */
const GAPS = {
  none: "gap-0",
  xs: "gap-stack-xs",
  sm: "gap-stack-sm",
  md: "gap-stack-md",
  lg: "gap-stack-lg",
  "section-head": "gap-section-head",
  section: "gap-section",
  gutter: "gap-gutter",
} as const
export type StackGap = keyof typeof GAPS

/**
 * Vertical (or horizontal) group with a token gap. The only way to space
 * siblings: no mt-/mb- on children (docs/keputusan.md, "Spacing").
 */
export default function Stack({
  gap = "md",
  direction = "col",
  as: Tag = "div",
  className,
  children,
  ...rest
}: {
  gap?: StackGap
  direction?: "col" | "row"
  as?: "div" | "section" | "ul" | "ol" | "header" | "article" | "main" | "nav" | "li"
  className?: string
  children: React.ReactNode
} & Omit<React.HTMLAttributes<HTMLElement>, "className" | "children">) {
  return (
    <Tag className={cn("flex", direction === "col" ? "flex-col" : "flex-row", GAPS[gap], className)} {...rest}>
      {children}
    </Tag>
  )
}

/**
 * Page body: header -> first block = stack-md, sections apart by `section`.
 * The footer adds its own `mt-section` above it.
 */
export function Page({ className, children, ...rest }: { className?: string; children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col gap-section pt-stack-md", className)} {...rest}>
      {children}
    </div>
  )
}
