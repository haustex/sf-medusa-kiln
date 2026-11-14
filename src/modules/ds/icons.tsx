import type { LucideProps } from "lucide-react"
import { __iconData as arrowRight } from "lucide-react/icons/arrow-right"
import { createElement, type SVGProps } from "react"

/*
 * UI icons come from lucide-react. Use ICON for the shared size/stroke so every icon reads the same: 20 px, stroke
 * 1.5. Brand marks (social, flags, the logo) stay hand-drawn SVG in modules/brand. Don't use text arrows ("→", "›"):
 * they fall outside the Latin subset of Inter and fall back to a system font.
 *
 * Two ways to draw one:
 * - in a client component: the lucide-react component (`import { Search } from "lucide-react"`, `<Search {...ICON} />`);
 * - in a server component: `<Icon icon={search} />` with the icon's data
 *   (`import { __iconData as search } from "lucide-react/icons/search"`). lucide-react's components
 *   are client components (they read a context), so each one rendered by a server component would be shipped and
 *   hydrated as its own island; Icon draws the same SVG with no JavaScript.
 */
export const ICON = { size: 20, strokeWidth: 1.5, "aria-hidden": true, focusable: false } as const satisfies LucideProps & { focusable: boolean }

/** A lucide icon's data (`__iconData` of `lucide-react/icons/<name>`) */
export type IconData = { name: string; node: [string, Record<string, string>][] }

/** A lucide icon as plain SVG, for server components (see above). Same defaults as ICON. */
export function Icon({ icon, size = ICON.size, strokeWidth = ICON.strokeWidth, className, ...rest }: { icon: IconData; size?: number | string; strokeWidth?: number | string; className?: string } & Omit<SVGProps<SVGSVGElement>, "ref">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable={false}
      className={cn("lucide", `lucide-${icon.name}`, className)}
      {...rest}
    >
      {icon.node.map(([tag, { key, ...attrs }], i) => createElement(tag, { ...attrs, key: key ?? i }))}
    </svg>
  )
}

/** Inline arrow that follows the text size (section "See all" links, eyebrow links) */
export function ArrowRight({ className }: { className?: string }) {
  return <Icon icon={arrowRight} size="1em" strokeWidth={1.75} className={cn("inline-block shrink-0", className)} />
}

function cn(...parts: (string | undefined)[]) {
  return parts.filter(Boolean).join(" ")
}
