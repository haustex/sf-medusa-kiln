import { cn } from "@heroui/styles"
import Link from "@modules/common/components/app-link"
import { getImageProps } from "next/image"

/**
 * "Shop by category" card (Faire-style): a very light grey horizontal card with two small photos stacked and
 * slightly tilted on the left (the category's two newest products) and the name on the right (no arrow). One photo sits
 * straight when there is only one. The whole card is the link; on hover the photos settle (no tilt) and the card
 * darkens a touch; nothing moves with reduced motion.
 */
export default function CategoryCard({ href, label, images, className }: { href: string; label: string; /** 1 or 2 photo URLs, newest first */ images: string[]; className?: string }) {
  const [a, b] = images
  const two = images.length >= 2
  const photo = "absolute overflow-hidden rounded-[0.5rem] bg-background shadow-soft ring-2 ring-default transition-transform duration-200 ease-out"
  return (
    <Link
      href={href}
      className={cn(
        "group flex h-full items-center gap-stack-md rounded-media bg-default p-stack-sm pr-stack-md outline-none transition-colors hover:bg-default-hover focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
      data-testid="category-card"
    >
      <span aria-hidden="true" className="relative block h-24 w-28 shrink-0">
        {two ? (
          <>
            <span className={cn(photo, "left-1 top-1 size-16 -rotate-6 motion-safe:group-hover:rotate-0")}>
              <Thumb src={b} />
            </span>
            <span className={cn(photo, "left-10 top-6 size-16 rotate-6 motion-safe:group-hover:rotate-0")}>
              <Thumb src={a} />
            </span>
          </>
        ) : (
          <span className={cn(photo, "left-5 top-3 size-[4.5rem] rotate-3 motion-safe:group-hover:rotate-0")}>
            <Thumb src={a} />
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1 text-[0.9375rem] font-medium leading-snug">{label}</span>
    </Link>
  )
}

/** 64–72 px thumbnail through next/image (the smallest width it serves) */
function Thumb({ src }: { src: string }) {
  const { props } = getImageProps({ src, alt: "", width: 160, height: 160, sizes: "80px", loading: "lazy", decoding: "async", className: "size-full object-cover" })
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- next/image's own props
  return <img {...props} />
}
