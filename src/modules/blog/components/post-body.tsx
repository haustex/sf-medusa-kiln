import type { BlogBlock } from "@lib/data/blog"
import { cleanSlug } from "@lib/util/image-name"
import { imageRef, imageSrcSet, imageUrl } from "@lib/util/image-url"
import { getImageProps } from "next/image"
import type { ProductCardData } from "@modules/ds"

import ProductEmbed from "./product-embed"
import YoutubeEmbed from "./youtube"

const Plus = () => (
  <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M8 3v10M3 8h10" strokeLinecap="round" />
  </svg>
)

// The reading column is 680px; phones show the photo edge to edge inside the page padding
const SIZES = "(min-width: 744px) 680px, calc(100vw - 2rem)"

/**
 * A photo from the article: our backend's file through /img (AVIF / WebP / JPEG) named {slug}-{position}, or as is
 * (`raw`: the preview of an unpublished article, whose photos the /img index does not know); the box is reserved by
 * width/height.
 */
function Photo({ block, slug, raw }: { block: Extract<BlogBlock, { type: "image" }>; slug: string; raw?: boolean }) {
  const file = raw ? null : imageRef("blog", `${cleanSlug(slug)}-${block.position}`, block.src)
  const size = block.width && block.height ? { width: block.width, height: block.height } : {}
  return (
    <figure>
      {file ? (
        <picture>
          <source type="image/avif" srcSet={imageSrcSet(file, "avif", 1600)} sizes={SIZES} />
          <source type="image/webp" srcSet={imageSrcSet(file, "webp", 1600)} sizes={SIZES} />
          <img src={imageUrl(file, "jpeg", 1080)} srcSet={imageSrcSet(file, "jpeg", 1600)} sizes={SIZES} alt={block.alt} {...size} loading="lazy" decoding="async" />
        </picture>
      ) : block.width && block.height ? (
        // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- next/image's own props (AVIF / WebP, responsive)
        <img {...getImageProps({ src: block.src, alt: block.alt, width: block.width, height: block.height, sizes: SIZES, loading: "lazy", decoding: "async" }).props} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- size unknown: shown as is
        <img src={block.src} alt={block.alt} loading="lazy" decoding="async" />
      )}
      {block.caption && <figcaption>{block.caption}</figcaption>}
    </figure>
  )
}

/**
 * The article text. The backend has already sanitized the HTML and cut it into blocks: runs of plain HTML
 * (headings, paragraphs, lists, quotes, links) and the parts that are components here: photos, product cards,
 * YouTube videos and question-and-answer groups.
 */
export default function PostBody({
  blocks,
  slug,
  raw,
  products,
  labels,
}: {
  blocks: BlogBlock[]
  /** The article's slug: the photos' names in their URLs */
  slug: string
  /** Show the photos from the backend's own URLs (unpublished preview) */
  raw?: boolean
  /** Product cards by product id, for the market of the page; a product that is missing there is skipped */
  products: Record<string, ProductCardData>
  labels: { viewProduct: string; playVideo: string; videoTitle: string }
}) {
  return (
    <div className="blog-prose">
      {blocks.map((b, i) => {
        switch (b.type) {
          case "html":
            return <div key={i} className="blog-html" dangerouslySetInnerHTML={{ __html: b.html }} />
          case "image":
            return <Photo key={i} block={b} slug={slug} raw={raw} />
          case "product":
            return products[b.id] ? <ProductEmbed key={i} product={products[b.id]} cta={labels.viewProduct} /> : null
          case "youtube":
            return <YoutubeEmbed key={i} id={b.id} label={labels.playVideo} title={labels.videoTitle} />
          case "faq":
            return (
              <div key={i} className="blog-faq">
                {b.items.map((f, n) => (
                  <details key={n} open={n === 0 ? true : undefined}>
                    <summary>
                      {f.q}
                      <Plus />
                    </summary>
                    <div dangerouslySetInnerHTML={{ __html: f.a_html }} />
                  </details>
                ))}
              </div>
            )
        }
      })}
    </div>
  )
}
