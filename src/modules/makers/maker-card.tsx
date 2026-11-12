import Link from "@modules/common/components/app-link"
import PhotoStack from "@modules/ds/photo-stack"

/**
 * Maker card (/makers): the same light card as "shop by category" with the maker's two newest products stacked on
 * the left, and name, location and short description on the right. The whole card links to the profile.
 */
export default function MakerCard({ href, name, location, description, images, productsLabel }: { href: string; name: string; location: string | null; description: string | null; /** 1 or 2 photo URLs, newest first */ images: string[]; /** "{n} products" */ productsLabel: string }) {
  return (
    <Link
      href={href}
      className="group flex h-full items-start gap-stack-md rounded-media bg-default p-stack-md outline-none transition-colors hover:bg-default-hover focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      data-testid="maker-card"
    >
      {images.length > 0 && <PhotoStack images={images} />}
      <span className="flex min-w-0 flex-1 flex-col gap-stack-xs">
        <span className="type-h3">{name}</span>
        <span className="text-sm text-muted">{[location, productsLabel].filter(Boolean).join(" · ")}</span>
        {description && <span className="text-sm leading-relaxed">{description}</span>}
      </span>
    </Link>
  )
}
