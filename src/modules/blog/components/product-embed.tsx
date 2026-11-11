import { buttonVariants, cn } from "@heroui/styles"
import Link from "@modules/common/components/app-link"

import { cleanSlug } from "@lib/util/image-name"

import { ArrowRight, PriceTag, ProductCardData, ProductImage } from "@modules/ds"

/**
 * Product card inside an article (the editor's "kartu produk" block): small 1:1 photo, category, name, price and
 * a "Lihat produk" affordance in one row. One link. Price and photo come from the catalogue when the page is
 * rendered, so they are always the market's current ones.
 */
export default function ProductEmbed({ product, cta }: { product: ProductCardData; cta: string }) {
  const { href, title, subtitle, image, price, soldOut } = product
  return (
    <Link
      href={href}
      className="blog-embed group flex items-center gap-stack-md rounded-media border border-separator bg-surface p-stack-sm pr-stack-md outline-none transition-colors hover:border-control focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 sm:p-3 sm:pr-stack-lg"
    >
      <div className="w-24 shrink-0 overflow-hidden rounded-lg sm:w-28">
        <ProductImage src={image} name={product.imageName ?? cleanSlug(href.split("/").pop() ?? "")} alt="" sizes="112px" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-stack-xs">
        <div className="flex flex-col">
          {subtitle && <span className="truncate text-xs text-muted sm:text-sm">{subtitle}</span>}
          <span className="line-clamp-2 text-base font-semibold leading-snug">{title}</span>
        </div>
        {soldOut ? <span className="text-sm text-muted">{soldOut}</span> : price && <PriceTag amount={price.amount} currency={price.currency} original={price.original} from={price.from} size="sm" />}
      </div>
      <span className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "hidden h-9 shrink-0 gap-1.5 px-4 sm:inline-flex")}>
        {cta}
        <ArrowRight />
      </span>
      <ArrowRight className="size-4 text-foreground sm:hidden" />
    </Link>
  )
}
