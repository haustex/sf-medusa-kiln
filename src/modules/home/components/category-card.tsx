import { cn } from "@heroui/styles"
import Link from "@modules/common/components/app-link"
import PhotoStack from "@modules/ds/photo-stack"

/**
 * "Shop by category" card (Faire-style): a very light grey horizontal card with two small photos stacked and
 * slightly tilted on the left (the category's two newest products, ds/photo-stack.tsx) and the name on the right
 * (no arrow). The whole card is the link; on hover the photos settle and the card darkens a touch.
 */
export default function CategoryCard({ href, label, images, className }: { href: string; label: string; /** 1 or 2 photo URLs, newest first */ images: string[]; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex h-full items-center gap-stack-md rounded-media bg-default p-stack-sm pr-stack-md outline-none transition-colors hover:bg-default-hover focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
      data-testid="category-card"
    >
      <PhotoStack images={images} />
      <span className="min-w-0 flex-1 text-[0.9375rem] font-medium leading-snug">{label}</span>
    </Link>
  )
}
