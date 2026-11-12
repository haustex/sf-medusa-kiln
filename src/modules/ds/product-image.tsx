import { cn } from "@heroui/styles"
import { getImageProps } from "next/image"
import { imageRef, imageSrcSet, imageUrl } from "@lib/util/image-url"
import ImagePreload from "./image-preload"
import ImagePlaceholder from "./placeholder"

/**
 * 1:1 product image with the neutral placeholder as fallback. Served as AVIF / WebP in responsive widths by
 * next/image (/_next/image, `sizes` picks the width); with the /img route (lib/util/image-url.ts) a <picture> of
 * our own files instead.
 * `priority`: the LCP image (one per page: first PDP photo, first card of a grid), loaded eagerly with high priority
 * + one preload with the AVIF <source>'s srcset/sizes (ds/image-preload.tsx). Every other photo is lazy, no hint.
 * `name`: the photo's name in the URL, from lib/util/image-name.ts (productImageName: {handle}-{n}, or the bare
 * handle where the position is unknown).
 */
export default function ProductImage({
  src,
  name,
  alt,
  priority,
  sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw",
  className,
}: {
  src?: string | null
  name: string
  alt: string
  priority?: boolean
  sizes?: string
  className?: string
}) {
  if (!src) {
    return <ImagePlaceholder label={alt} className={className} />
  }
  const file = imageRef("produk", name, src)
  const img = "absolute inset-0 size-full object-cover"
  const common = {
    alt,
    width: 1600,
    height: 1600,
    loading: priority ? ("eager" as const) : ("lazy" as const),
    fetchPriority: priority ? ("high" as const) : undefined,
    decoding: "async" as const,
    className: img,
  }
  return (
    <div className={cn("photo-placeholder relative aspect-square w-full overflow-hidden", className)}>
      {priority && file && <ImagePreload href={imageUrl(file, "avif", 1080)} srcSet={imageSrcSet(file, "avif")} sizes={sizes} />}
      {file ? (
        <picture>
          <source type="image/avif" srcSet={imageSrcSet(file, "avif")} sizes={sizes} />
          <source type="image/webp" srcSet={imageSrcSet(file, "webp")} sizes={sizes} />
          <img src={imageUrl(file, "jpeg", 1080)} srcSet={imageSrcSet(file, "jpeg")} sizes={sizes} {...common} />
        </picture>
      ) : (
        <Optimized src={src} sizes={sizes} priority={priority} {...common} />
      )}
    </div>
  )
}

/** next/image markup by hand (getImageProps): the preload stays a client-side link (ds/image-preload.tsx), never a Flight hint */
function Optimized({ src, sizes, priority, ...rest }: { src: string; sizes: string; priority?: boolean; alt: string; width: number; height: number; loading: "eager" | "lazy"; fetchPriority?: "high"; decoding: "async"; className: string }) {
  const { props } = getImageProps({ src, sizes, ...rest })
  return (
    <>
      {priority && props.srcSet && <ImagePreload href={props.src} srcSet={props.srcSet} sizes={sizes} type={null} />}
      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- next/image's own props */}
      <img {...props} />
    </>
  )
}
