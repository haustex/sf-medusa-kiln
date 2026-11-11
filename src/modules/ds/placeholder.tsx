import { cn } from "@heroui/styles"


/**
 * 1:1 image stand-in until product photos exist: flat Soft (#F5F5F5) with a small "//". Pure CSS (no
 * request), so it never becomes the LCP bottleneck. Label is for screen readers only.
 */
export default function ImagePlaceholder({ label, className }: { label?: string; className?: string }) {
  return (
    <div
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("photo-placeholder relative flex aspect-square w-full items-center justify-center overflow-hidden", className)}
    >
      <span aria-hidden="true" className="block size-2.5 rounded-[3px] bg-control/60" />
    </div>
  )
}
