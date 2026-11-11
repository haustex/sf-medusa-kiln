import { cleanSlug } from "@lib/util/image-name"
import { ProductImage } from "@modules/ds"
import GalleryFrame from "./gallery-frame"

/**
 * Product gallery: one big 1:1 photo in a snap rail (swipe on phones, dots), thumbnails from sm that scroll the
 * rail (gallery-frame.tsx). Server-rendered images, one priority (LCP). Photos are named {handle}-{n} in their URLs.
 */
export default function Gallery({ images, handle, alt, labels }: { images: { id: string; url: string }[]; handle: string; alt: string; labels: { gallery: string; photoN: string; showPhoto: string } }) {
  const list = images.length ? images : [{ id: "placeholder", url: "" }]
  const total = list.length
  const altOf = (i: number) => (total > 1 ? `${alt} (${labels.photoN.replace("{n}", String(i + 1)).replace("{total}", String(total))})` : alt)
  return (
    <GalleryFrame
      label={labels.gallery}
      showPhoto={labels.showPhoto}
      thumbs={total > 1 ? list.map((img, i) => <ProductImage key={img.id} src={img.url || null} name={`${cleanSlug(handle)}-${i + 1}`} alt="" sizes="120px" className="rounded-media" />) : []}
    >
      {list.map((img, i) => (
        <li key={img.id} className="w-full shrink-0 snap-center">
          <ProductImage src={img.url || null} name={`${cleanSlug(handle)}-${i + 1}`} alt={altOf(i)} priority={i === 0} sizes="(min-width: 1024px) 58vw, 100vw" className="sm:rounded-media" />
        </li>
      ))}
    </GalleryFrame>
  )
}
