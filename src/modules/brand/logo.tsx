import config from "@theme"
import { clx } from "@modules/common/components/ui"

type LogoProps = {
  className?: string
  size?: "sm" | "md" | "lg"
  /** Set when the surrounding link already names the shop. */
  decorative?: boolean
}

const text = { sm: "text-[1.125rem]", md: "text-[1.25rem]", lg: "text-[1.5rem]" }
const mark = { sm: "size-[18px] rounded-[5px]", md: "size-5 rounded-md", lg: "size-6 rounded-md" }
const svg = { sm: "h-3", md: "h-3.5", lg: "h-[22px]" }

/**
 * Shop logo from theme.config.ts: the name set in the site font with a small ink mark (no extra font or image
 * request), or one SVG path (`brand.logo.svgPath`, fill currentColor). Inherits the text colour.
 */
export default function Logo({ className, size = "md", decorative }: LogoProps) {
  const { name, logo } = config.brand
  const a11y = decorative ? { "aria-hidden": true as const } : { role: "img" as const, "aria-label": name }
  if (logo.type === "svg" && logo.svgPath) {
    return (
      <svg viewBox={logo.svgViewBox} focusable="false" className={clx("block w-auto shrink-0 fill-current text-foreground", svg[size], className)} {...a11y}>
        <path d={logo.svgPath} />
      </svg>
    )
  }
  return (
    <span className={clx("inline-flex items-center gap-2 font-semibold tracking-[-0.02em] text-foreground", text[size], className)} {...a11y}>
      <span className={clx("shrink-0 bg-foreground", mark[size])} />
      <span>{name}</span>
    </span>
  )
}
