import { cn } from "@heroui/styles"
import Image from "next/image"
import Link from "@modules/common/components/app-link"

import ImagePlaceholder from "./placeholder"

/**
 * Category tile: a square photo (radius media) with the name below, in ink. The photo comes from the category's
 * `metadata.image` (set in the Admin) or a thumbnail passed in; until then a flat placeholder. On hover the photo
 * eases up 3% (none with reduced motion). Clean and neutral: no colour per category.
 */
export default function CategoryTile({ href, label, image, className }: { href: string; label: string; image?: string | null; className?: string }) {
  return (
    <Link
      href={href}
      className={cn("group flex flex-col gap-stack-sm outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background", className)}
    >
      <span className="relative block aspect-square overflow-hidden rounded-media bg-default">
        {image ? (
          <Image src={image} alt="" fill sizes="(min-width: 1024px) 16vw, (min-width: 640px) 33vw, 50vw" className="object-cover transition-transform duration-200 ease-out motion-safe:group-hover:scale-[1.03]" />
        ) : (
          <ImagePlaceholder className="h-full" />
        )}
      </span>
      <span className="text-[0.9375rem] font-medium leading-snug">{label}</span>
    </Link>
  )
}
