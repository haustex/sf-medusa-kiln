import { cn } from "@heroui/styles"
import { getImageProps } from "next/image"

/**
 * Two small photos stacked and slightly tilted (one sits straight when alone), as on the "shop by category" and
 * maker cards. Decorative: the card's text names the thing. Inside a `group` the photos settle on hover (no tilt);
 * nothing moves with reduced motion.
 */
export default function PhotoStack({ images, className }: { /** 1 or 2 photo URLs, newest first */ images: string[]; className?: string }) {
  const [a, b] = images
  const two = images.length >= 2
  const photo = "absolute overflow-hidden rounded-[0.5rem] bg-background shadow-soft ring-2 ring-default transition-transform duration-200 ease-out"
  return (
    <span aria-hidden="true" className={cn("relative block h-24 w-28 shrink-0", className)}>
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
  )
}

/** 64–72 px thumbnail through next/image (the smallest width it serves) */
function Thumb({ src }: { src: string }) {
  const { props } = getImageProps({ src, alt: "", width: 160, height: 160, sizes: "80px", loading: "lazy", decoding: "async", className: "size-full object-cover" })
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- next/image's own props
  return <img {...props} />
}
