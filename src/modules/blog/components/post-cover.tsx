import { cn } from "@heroui/styles"

import { cleanSlug } from "@lib/util/image-name"
import { IMAGE_FORMATS, imageRef, imageSrcSet, imageUrl, type ImageRef } from "@lib/util/image-url"
import ImagePreload from "@modules/ds/image-preload"

/**
 * Blog cover. The box has a fixed aspect ratio (no layout shift), the photo fills it.
 *   square:  1:1 everywhere (cards)
 *   wide:    4:3 everywhere (home page journal cards)
 *   feature: 1:1 on phones, 4:3 from lg (featured article on /blog)
 *   article: 1:1 on phones, 1200:630 from sm, using the wide cover when there is one
 * Backend files go through /img (AVIF / WebP / JPEG, responsive widths), like product photos, named after the
 * article: /img/blog/{slug}-… (1:1) and /img/blog/{slug}-lebar-… (wide).
 */
const SHAPES = {
  square: "aspect-square",
  wide: "aspect-[4/3]",
  feature: "aspect-square lg:aspect-[4/3]",
  article: "aspect-square sm:aspect-[1200/630]",
} as const

const WIDE = "(min-width: 640px)"

export default function PostCover({
  slug,
  src,
  wideSrc,
  alt,
  shape = "square",
  priority,
  sizes = "(min-width: 1024px) 33vw, 50vw",
  className,
}: {
  /** The article's slug: the photo's name in its URL */
  slug: string
  src?: string | null
  /** Only used by shape "article" */
  wideSrc?: string | null
  alt: string
  shape?: keyof typeof SHAPES
  /** The LCP image: eager + high priority + preloaded */
  priority?: boolean
  sizes?: string
  className?: string
}) {
  const box = cn("photo-placeholder relative w-full overflow-hidden rounded-media", SHAPES[shape], className)
  if (!src) {
    return (
      <div role="img" aria-label={alt} className={cn(box, "flex items-center justify-center")}>
        <span aria-hidden="true" className="block size-2.5 rounded-[3px] bg-control/60" />
      </div>
    )
  }
  const wide = shape === "article" ? wideSrc : null
  const name = cleanSlug(slug)
  const file = imageRef("blog", name, src)
  const wideFile = imageRef("blog", `${name}-lebar`, wide)
  const common = {
    width: 1600,
    height: 1600,
    loading: priority ? ("eager" as const) : ("lazy" as const),
    fetchPriority: priority ? ("high" as const) : undefined,
    decoding: "async" as const,
    className: "absolute inset-0 size-full object-cover",
  }
  // LCP image: exactly one preload per viewport, same srcset + sizes as the AVIF <source> the browser will pick
  // (ds/image-preload.tsx). With a wide cover: the square one below 640px, the wide one from 640px.
  const preloadFor = (f: ImageRef, media?: string) => <ImagePreload href={imageUrl(f, "avif", 1080)} srcSet={imageSrcSet(f, "avif")} sizes={sizes} media={media} />
  return (
    <div className={box}>
      {priority && file && preloadFor(file, wideFile ? `not all and ${WIDE}` : undefined)}
      {priority && wideFile && preloadFor(wideFile, WIDE)}
      <picture>
        {wideFile
          ? IMAGE_FORMATS.map((f) => <source key={`w-${f}`} media={WIDE} type={`image/${f}`} srcSet={imageSrcSet(wideFile, f)} sizes={sizes} />)
          : wide && <source media={WIDE} srcSet={wide} />}
        {file && <source type="image/avif" srcSet={imageSrcSet(file, "avif")} sizes={sizes} />}
        {file && <source type="image/webp" srcSet={imageSrcSet(file, "webp")} sizes={sizes} />}
        {file ? (
          <img src={imageUrl(file, "jpeg", 1080)} srcSet={imageSrcSet(file, "jpeg")} sizes={sizes} alt={alt} {...common} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- external image, shown as is
          <img src={src} alt={alt} {...common} />
        )}
      </picture>
    </div>
  )
}
