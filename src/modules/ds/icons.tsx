import { cn } from "@heroui/styles"

/*
 * Inline SVG icons. Don't use text arrows ("→", "›"): they fall outside the latin
 * subset of the site font (Inter) and fall back to a system font with different metrics.
 */

export function ArrowRight({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn("inline-block size-[1em] shrink-0", className)}>
      <path d="M2.5 8h11M9 3.5 13.5 8 9 12.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
