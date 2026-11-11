import { cn } from "@heroui/styles"
import Link from "@modules/common/components/app-link"
import { cleanSlug } from "@lib/util/image-name"
import Badge, { BadgeTone } from "./badge"
import PriceTag from "./price-tag"
import ProductImage from "./product-image"
import Stars from "./stars"

export type ProductCardData = {
  /** Product id (wishlist heart) */
  id?: string
  href: string
  title: string
  /** Category line shown small and muted ABOVE the title, e.g. "Talenan" */
  subtitle?: string | null
  image?: string | null
  /** Second photo, shown on hover (pointer devices) */
  image2?: string | null
  /** Names of the two photos in their URLs (lib/util/image-name.ts); default: the handle from `href` */
  imageName?: string
  image2Name?: string
  price?: { amount: number; currency: string; original?: number | null; from?: string } | null
  badges?: { label: string; tone?: BadgeTone }[]
  /** Overlay label when nothing can be bought (e.g. "Habis"). */
  soldOut?: string | null
  /** Approved reviews (medusa-reviews-wishlist); absent or count 0 = no stars on the card */
  rating?: { average: number; count: number } | null
  /** Accessible label of the stars, e.g. "4,5 dari 5, 12 ulasan" */
  ratingLabel?: string
}

/**
 * Product card (photo dominant, short text). Large 1:1 photo, radius lg; on hover it lifts a little with a soft
 * neutral shadow and shows the second photo (200ms, none with reduced motion: .hk-card in globals.css). Badges are solid
 * white 90% chips (no blur) over the photo. Server component, plain link.
 */
export default function ProductCard({
  product,
  priority,
  sizes,
  className,
  action,
}: {
  product: ProductCardData
  /** Set on the first visible cards only (LCP). */
  priority?: boolean
  sizes?: string
  className?: string
  /** A control over the photo's top-right corner, outside the link (e.g. the wishlist heart) */
  action?: React.ReactNode
}) {
  const { href, title, subtitle, image, image2, price, badges, soldOut, rating, ratingLabel } = product
  const handle = cleanSlug(href.split("/").pop() ?? "")
  const card = (
    <Link
      href={href}
      className={cn(
        "hk-card group flex flex-col gap-stack-sm rounded-media outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        !action && className
      )}
    >
      <div className="card-media relative overflow-hidden rounded-media">
        <ProductImage src={image} name={product.imageName ?? handle} alt={title} priority={priority} sizes={sizes} className={cn(soldOut && "opacity-60")} />
        {image2 && (
          <div className="card-media-alt absolute inset-0" aria-hidden="true">
            <ProductImage src={image2} name={product.image2Name ?? handle} alt="" sizes={sizes} />
          </div>
        )}
        {(badges?.length || soldOut) && (
          <div className="absolute left-stack-sm top-stack-sm flex flex-wrap gap-stack-xs">
            {soldOut && <Badge overPhoto>{soldOut}</Badge>}
            {badges?.map((b) => (
              <Badge key={b.label} overPhoto>
                {b.label}
              </Badge>
            ))}
          </div>
        )}
      </div>
      {/* photo -> text: stack-sm; category + title one tight group; price stack-xs below */}
      <div className="flex flex-col gap-stack-xs px-0.5">
        <div className="flex flex-col">
          {subtitle && <p className="truncate text-xs text-muted sm:text-sm">{subtitle}</p>}
          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-foreground sm:text-base">{title}</h3>
        </div>
        {rating && rating.count > 0 && (
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <Stars value={rating.average} label={ratingLabel ?? `${rating.average.toFixed(1)}/5`} />
            <span className="tabular-nums">{`(${rating.count})`}</span>
          </p>
        )}
        {price && (
          <PriceTag amount={price.amount} currency={price.currency} original={price.original} from={price.from} size="sm" />
        )}
      </div>
    </Link>
  )
  if (!action) return card
  return (
    <div className={cn("relative", className)}>
      {card}
      <div className="absolute right-stack-sm top-stack-sm">{action}</div>
    </div>
  )
}
