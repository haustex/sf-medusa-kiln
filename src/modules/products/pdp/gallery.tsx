import { cleanSlug } from "@lib/util/image-name"
import { ProductImage } from "@modules/ds"
import GalleryFrame from "./gallery-frame"

/**
 * Product gallery: one big 1:1 photo in a snap rail (swipe on phones, dots), thumbnails from sm that scroll the
 * rail (gallery-frame.tsx), the wishlist heart (`action`) over the photo's top-right corner. Server-rendered images,
 * one priority (LCP). Photos are named {handle}-{n} in their URLs. `images[].alt`: the photo's own text
 * (medusa-image-alt); without one: "{title} (photo n of m)".
 */
export default function Gallery({ images, handle, alt, action, labels }: { images: { id: string; url: string; alt?: string | null }[]; handle: string; alt: string; /** Control over the photo (the wishlist heart) */ action?: React.ReactNode; labels: { gallery: string; photoN: string; showPhoto: string } }) {
  const list: { id: string; url: string; alt?: string | null }[] = images.length ? images : [{ id: "placeholder", url: "" }]
  const total = list.length
  const altOf = (i: number) => list[i].alt || (total > 1 ? `${alt} (${labels.photoN.replace("{n}", String(i + 1)).replace("{total}", String(total))})` : alt)
  return (
    <GalleryFrame
      label={labels.gallery}
      showPhoto={labels.showPhoto}
      overlay={action}
      thumbs={total > 1 ? list.map((img, i) => <ProductImage key={img.id} src={img.url || null} name={`${cleanSlug(handle)}-${i + 1}`} alt="" sizes="120px" className="rounded-media" />) : []}
    >
      {list.map((img, i) => (
        <li key={img.id} className="w-full shrink-0 snap-center">
          <ProductImage src={img.url || null} name={`${cleanSlug(handle)}-${i + 1}`} alt={altOf(i)} priority={i === 0} sizes="(min-width: 1280px) 640px, (min-width: 1024px) 50vw, 100vw" className="sm:rounded-media" />
        </li>
      ))}
    </GalleryFrame>
  )
}
