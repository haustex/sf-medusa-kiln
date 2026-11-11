import { cn } from "@heroui/styles"

/**
 * Count bubble on a header icon. Always in the DOM at a fixed size (invisible at 0), so a count arriving after
 * hydration never shifts anything (CLS 0). Counts above 99 show "99+".
 */
export default function CountBadge({ count, className }: { count: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "type-price absolute right-0 top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-medium leading-none text-accent-foreground",
        count <= 0 && "invisible",
        className
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  )
}
