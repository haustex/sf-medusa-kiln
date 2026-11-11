import { cn } from "@heroui/styles"
import { productImageName } from "@lib/util/image-name"
import { ProductImage } from "@modules/ds"
import React from "react"

type ThumbnailProps = {
  thumbnail?: string | null
  images?: { url?: string; rank?: number | null }[] | null
  /** Product handle: the photo's name in its URL ({handle}-{n}, or {handle} when the position is unknown) */
  handle?: string | null
  size?: "small" | "medium" | "large" | "full" | "square"
  isFeatured?: boolean
  className?: string
  alt?: string
  "data-testid"?: string
}

const WIDTHS = {
  small: "w-[180px]",
  medium: "w-[290px]",
  large: "w-[440px]",
  full: "w-full",
  square: "w-full",
}

/**
 * Starter API, design-system look: 1:1 product image with the neutral
 * placeholder (cart previews, order pages, account).
 */
const Thumbnail: React.FC<ThumbnailProps> = ({
  thumbnail,
  images,
  handle,
  size = "small",
  className,
  alt = "",
  "data-testid": dataTestid,
}) => {
  const image = thumbnail || images?.[0]?.url
  return (
    <div className={cn("shrink-0", WIDTHS[size], className)} data-testid={dataTestid}>
      <ProductImage src={image} name={productImageName({ handle: handle || "produk", images }, image)} alt={alt} sizes="(min-width: 1024px) 160px, 25vw" className="rounded-lg" />
    </div>
  )
}

export default Thumbnail
