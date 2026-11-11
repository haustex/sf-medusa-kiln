import { cn } from "@heroui/styles"

import { cleanSlug } from "@lib/util/image-name"
import Link from "@modules/common/components/app-link"
import Badge, { BadgeTone } from "./badge"
import PriceTag from "./price-tag"
import ProductImage from "./product-image"
import Stars from "./stars"

export type CardVariant = {
  id: string
  title: string
  /** option title → value, e.g. { Size: "Large" } */
  options: Record<string, string>
  price: { amount: number; currency: string; original?: number | null } | null
  inStock: boolean
}

export type ProductCardData = {
  /** Product id (wishlist heart) */
  id?: string
  href: string
  title: string
  /** Category name, shown as a chip over the photo's top-left corner */
  subtitle?: string | null
  image?: string | null
  /** Second photo, shown on hover (pointer devices) */
  image2?: string | null
  /** Names of the two photos in their URLs (lib/util/image-name.ts); default: the handle from `href` */
  imageName?: string
  image2Name?: string
  price?: { amount: number; currency: string; original?: number | null; from?: string } | null
  badges?: { label: string; tone?: BadgeTone }[]
  /** Overlay label when nothing can be bought (e.g. "Sold out"). */
  soldOut?: string | null
  /** Approved reviews (medusa-reviews-wishlist); absent or count 0 = no stars on the card */
  rating?: { average: number; count: number } | null
  /** Accessible label of the stars, e.g. "4.5 out of 5, 12 reviews" */
  ratingLabel?: string
  /** Options and variants for the card's "+" (one variant: straight to the cart; several: quick view) */
  options?: { id: string; title: string; values: string[] }[]
  variants?: CardVariant[]
}

/**
 * Product card: a large 1:1 photo (radius media) with three overlays, and short text below (title, stars, price).
 *   top-left      category chip (+ sold-out / custom badges), solid white 90%, no blur
 *   top-right     `action` slot: the wishlist heart (a button outside the link)
 *   bottom-right  `add` slot: the "+" add-to-cart / quick-view button
 * On hover the photo lifts a little and shows the second photo (200ms, none with reduced motion: .k-card in
 * globals.css). Server component; the overlays are the only client parts and sit outside the link.
 */
export default function ProductCard({
  product,
  priority,
  sizes,
  className,
  action,
  add,
}: {
  product: ProductCardData
  /** Set on the first visible cards only (LCP). */
  priority?: boolean
  sizes?: string
  className?: string
  /** Top-right control over the photo, outside the link (the wishlist heart) */
  action?: React.ReactNode
  /** Bottom-right control over the photo, outside the link (the "+" button) */
  add?: React.ReactNode
}) {
  const { href, title, subtitle, image, image2, price, badges, soldOut, rating, ratingLabel } = product
  const handle = cleanSlug(href.split("/").pop() ?? "")
  const chips = [...(soldOut ? [soldOut] : []), ...(subtitle ? [subtitle] : []), ...(badges?.map((b) => b.label) ?? [])]
  return (
    <div className={cn("relative", className)}>
      <Link
        href={href}
        className="k-card group flex flex-col gap-stack-sm rounded-media outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <div className="card-media relative overflow-hidden rounded-media">
          <ProductImage src={image} name={product.imageName ?? handle} alt={title} priority={priority} sizes={sizes} className={cn(soldOut && "opacity-60")} />
          {image2 && (
            <div className="card-media-alt absolute inset-0" aria-hidden="true">
              <ProductImage src={image2} name={product.image2Name ?? handle} alt="" sizes={sizes} />
            </div>
          )}
          {chips.length > 0 && (
            <div className="absolute left-stack-sm top-stack-sm flex max-w-[calc(100%-4rem)] flex-wrap gap-stack-xs">
              {chips.map((label) => (
                <Badge key={label} overPhoto className="max-w-full truncate">
                  {label}
                </Badge>
              ))}
            </div>
          )}
        </div>
        {/* photo -> text: stack-sm; title + stars one tight group; price stack-xs below */}
        <div className="flex flex-col gap-stack-xs px-0.5">
          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-foreground sm:text-base">{title}</h3>
          {rating && rating.count > 0 && (
            <p className="flex items-center gap-1.5 text-xs text-muted">
              <Stars value={rating.average} label={ratingLabel ?? `${rating.average.toFixed(1)}/5`} />
              <span className="tabular-nums">{`(${rating.count})`}</span>
            </p>
          )}
          {price && <PriceTag amount={price.amount} currency={price.currency} original={price.original} from={price.from} size="sm" />}
        </div>
      </Link>
      {/* Overlays sit in a square the size of the photo, so they stay on the photo whatever the text height */}
      {(action || add) && (
        <div aria-hidden={false} className="pointer-events-none absolute inset-x-0 top-0 aspect-square">
          {action && <div className="pointer-events-auto absolute right-stack-sm top-stack-sm">{action}</div>}
          {add && <div className="pointer-events-auto absolute bottom-stack-sm right-stack-sm">{add}</div>}
        </div>
      )}
    </div>
  )
}
