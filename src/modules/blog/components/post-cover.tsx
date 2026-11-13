import { cn } from "@heroui/styles"

import { cleanSlug } from "@lib/util/image-name"
import { IMAGE_FORMATS, imageRef, imageSrcSet, imageUrl, type ImageRef } from "@lib/util/image-url"
import ImagePreload from "@modules/ds/image-preload"
import { getImageProps } from "next/image"

/**
 * Blog cover. The box has a fixed aspect ratio (no layout shift), the photo fills it.
 *   square:  1:1 everywhere (cards)
 *   wide:    4:3 everywhere (home page journal cards)
 *   feature: 1:1 on phones, 4:3 from lg (featured article on /blog)
 *   article: 1:1 on phones, 1200:630 from sm, using the wide cover when there is one
 * Served as AVIF / WebP in responsive widths by next/image; with the /img route (lib/util/image-url.ts) our own
 * files named after the article: /img/blog/{slug}-… (1:1) and /img/blog/{slug}-lebar-… (wide).
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
  raw,
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
  /** Show the photo from the backend's own URL (the preview of an unpublished article: not in the /img index) */
  raw?: boolean
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
  const file = raw ? null : imageRef("blog", name, src)
  const wideFile = raw ? null : imageRef("blog", `${name}-lebar`, wide)
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
  if (file) {
    return (
      <div className={box}>
        {priority && preloadFor(file, wideFile ? `not all and ${WIDE}` : undefined)}
        {priority && wideFile && preloadFor(wideFile, WIDE)}
        <picture>
          {wideFile
            ? IMAGE_FORMATS.map((f) => <source key={`w-${f}`} media={WIDE} type={`image/${f}`} srcSet={imageSrcSet(wideFile, f)} sizes={sizes} />)
            : wide && <source media={WIDE} srcSet={wide} />}
          <source type="image/avif" srcSet={imageSrcSet(file, "avif")} sizes={sizes} />
          <source type="image/webp" srcSet={imageSrcSet(file, "webp")} sizes={sizes} />
          <img src={imageUrl(file, "jpeg", 1080)} srcSet={imageSrcSet(file, "jpeg")} sizes={sizes} alt={alt} {...common} />
        </picture>
      </div>
    )
  }
  // Not one of /img's files: next/image (AVIF / WebP, responsive); the wide cover (1200×630) from 640px
  const { props: square } = getImageProps({ src, alt, sizes, ...common })
  const { props: wideProps } = wide ? getImageProps({ src: wide, alt, sizes, ...common, width: 1200, height: 630 }) : { props: null }
  return (
    <div className={box}>
      {priority && square.srcSet && <ImagePreload href={square.src} srcSet={square.srcSet} sizes={sizes} media={wideProps ? `not all and ${WIDE}` : undefined} type={null} />}
      {priority && wideProps?.srcSet && <ImagePreload href={wideProps.src} srcSet={wideProps.srcSet} sizes={sizes} media={WIDE} type={null} />}
      <picture>
        {wideProps && <source media={WIDE} srcSet={wideProps.srcSet} sizes={sizes} />}
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- next/image's own props */}
        <img {...square} />
      </picture>
    </div>
  )
}
