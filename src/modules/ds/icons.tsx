import { ArrowRight as LucideArrowRight } from "lucide-react"
import type { LucideProps } from "lucide-react"

/*
 * UI icons come from lucide-react (one named import per icon: tree-shaken, Next optimises the package). Use ICON
 * for the shared size/stroke so every icon reads the same: 20 px, stroke 1.5. Brand marks (social, flags, the logo)
 * stay hand-drawn SVG in modules/brand. Don't use text arrows ("→", "›"): they fall outside the Latin subset of
 * Inter and fall back to a system font.
 */
export const ICON = { size: 20, strokeWidth: 1.5, "aria-hidden": true, focusable: false } as const satisfies LucideProps & { focusable: boolean }

/** Inline arrow that follows the text size (section "See all" links, eyebrow links) */
export function ArrowRight({ className }: { className?: string }) {
  return <LucideArrowRight aria-hidden="true" focusable={false} size="1em" strokeWidth={1.75} className={cn("inline-block shrink-0", className)} />
}

function cn(...parts: (string | undefined)[]) {
  return parts.filter(Boolean).join(" ")
}
