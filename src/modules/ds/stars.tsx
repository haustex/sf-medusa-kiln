import { cn } from "@heroui/styles"

/**
 * Star rating, read-only: five inline SVG stars filled to `value` (half steps), one accessible label.
 * Ink on Soft (palette only); the number/count next to it is the caller's.
 */
export default function Stars({ value, label, size = "sm", className }: { value: number; label: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const v = Math.max(0, Math.min(5, Math.round(value * 2) / 2))
  const px = size === "lg" ? "size-6" : size === "md" ? "size-5" : "size-3.5"
  return (
    <span role="img" aria-label={label} className={cn("inline-flex items-center gap-px", className)}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = v >= i ? 1 : v >= i - 0.5 ? 0.5 : 0
        return (
          <svg key={i} aria-hidden="true" viewBox="0 0 20 20" className={cn(px, "shrink-0")}>
            <defs>
              {fill === 0.5 && (
                <linearGradient id={`hk-star-half-${size}`} x1="0" x2="1" y1="0" y2="0">
                  <stop offset="50%" stopColor="currentColor" />
                  <stop offset="50%" stopColor="transparent" />
                </linearGradient>
              )}
            </defs>
            <path
              d="M10 1.8l2.47 5.2 5.73.7-4.2 3.95 1.08 5.65L10 14.5l-5.08 2.8L6 11.65 1.8 7.7l5.73-.7L10 1.8z"
              fill={fill === 1 ? "currentColor" : fill === 0.5 ? `url(#hk-star-half-${size})` : "none"}
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
          </svg>
        )
      })}
    </span>
  )
}
