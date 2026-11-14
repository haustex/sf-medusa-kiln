import { cn } from "@heroui/styles"
import { __iconData as star } from "lucide-react/icons/star"

import { Icon } from "@modules/ds/icons"

/**
 * Star rating, read-only: five lucide stars filled to `value` (half steps), one accessible label. A half star is a
 * filled copy clipped to its left half over the outline. Ink only; the number/count next to it is the caller's.
 */
export default function Stars({ value, label, size = "sm", className }: { value: number; label: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const v = Math.max(0, Math.min(5, Math.round(value * 2) / 2))
  const px = size === "lg" ? 24 : size === "md" ? 20 : 14
  return (
    <span role="img" aria-label={label} className={cn("inline-flex items-center gap-px", className)}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = v >= i ? 1 : v >= i - 0.5 ? 0.5 : 0
        return (
          <span key={i} className="relative inline-flex shrink-0" style={{ width: px, height: px }}>
            <Icon icon={star} size={px} fill={fill === 1 ? "currentColor" : "none"} />
            {fill === 0.5 && (
              <span aria-hidden="true" className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: px / 2 }}>
                <Icon icon={star} size={px} fill="currentColor" />
              </span>
            )}
          </span>
        )
      })}
    </span>
  )
}
