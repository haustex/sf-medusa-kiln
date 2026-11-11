"use client"

import { preload, type PreloadOptions } from "react-dom"

/** React 19 takes `media` for preloads (checked against Next's bundled react-dom); @types/react-dom 19.0 lacks it */
type ImagePreloadOptions = PreloadOptions & { media?: string }

/**
 * One <link rel="preload" as="image"> in <head> for the LCP photo, for one viewport (`media`), with the same
 * imagesrcset/imagesizes as the AVIF <source> of its <picture>, so the browser preloads exactly the file it then
 * picks (and only browsers that take AVIF, because of `type`).
 *
 * A client component on purpose. In a Server Component both `preload()` and a JSX <link rel="preload"> become a
 * Flight hint: React then writes the link twice into the HTML and, worse, replays the hint whenever Next only
 * *prefetches* the page (a link in the viewport), so e.g. an article page downloaded the /blog cards' covers at
 * high priority (docs/keputusan.md "Preload gambar LCP"). From a client component React's SSR puts exactly one link
 * in <head>; a prefetch does not render it.
 */
export default function ImagePreload({ href, srcSet, sizes, media }: { href: string; srcSet: string; sizes: string; media?: string }) {
  const options: ImagePreloadOptions = { as: "image", type: "image/avif", fetchPriority: "high", imageSrcSet: srcSet, imageSizes: sizes, ...(media ? { media } : {}) }
  preload(href, options)
  return null
}
