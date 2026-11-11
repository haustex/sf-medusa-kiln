import { cn } from "@heroui/styles"

export type BadgeTone = "neutral" | "new" | "sale" | "stock" | "low"

/**
 * Small label on cards and PDPs ("Handmade", "Custom", "Baru", "-20%", "Sisa 2"). Palette only (docs/keputusan.md
 * "Palet v3"): Soft / Ink / White + Control border. `overPhoto`: solid white 90% rectangle (4px radius, no blur) for
 * labels over a photo; the other tones are pills.
 */
const tones: Record<BadgeTone, string> = {
  neutral: "bg-default text-foreground",
  new: "bg-foreground text-surface",
  sale: "bg-surface text-foreground border border-control",
  stock: "bg-default text-foreground",
  low: "bg-surface text-foreground border border-control",
}

export default function Badge({
  children,
  tone = "neutral",
  size = "sm",
  overPhoto,
  className,
}: {
  children: React.ReactNode
  tone?: BadgeTone
  size?: "sm" | "md"
  /** Over a photo: solid white 90% chip (Ink text), whatever the tone */
  overPhoto?: boolean
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium leading-none whitespace-nowrap",
        overPhoto ? "rounded-[4px]" : "rounded-full",
        size === "sm" ? "h-6 px-2.5 text-xs" : "h-7 px-3 text-sm",
        overPhoto ? "chip-over-photo" : tones[tone],
        className
      )}
    >
      {children}
    </span>
  )
}
