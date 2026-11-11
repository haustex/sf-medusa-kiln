import type { BlogBlock } from "@lib/data/blog"
import { imageRef, imageSrcSet, imageUrl } from "@lib/util/image-url"
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

/** A photo from the article: our backend's file through /img (AVIF / WebP / JPEG); the box is reserved by width/height */
function Photo({ block }: { block: Extract<BlogBlock, { type: "image" }> }) {
  const file = imageRef("blog", block.name, block.src)
  const size = block.width && block.height ? { width: block.width, height: block.height } : {}
  return (
    <figure>
      {file ? (
        <picture>
          <source type="image/avif" srcSet={imageSrcSet(file, "avif", 1600)} sizes={SIZES} />
          <source type="image/webp" srcSet={imageSrcSet(file, "webp", 1600)} sizes={SIZES} />
          <img src={imageUrl(file, "jpeg", 1080)} srcSet={imageSrcSet(file, "jpeg", 1600)} sizes={SIZES} alt={block.alt} {...size} loading="lazy" decoding="async" />
        </picture>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- not one of our files: shown as is
        <img src={block.src} alt={block.alt} {...size} loading="lazy" decoding="async" />
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
  products,
  labels,
}: {
  blocks: BlogBlock[]
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
            return <Photo key={i} block={b} />
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
