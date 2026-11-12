import { cn } from "@heroui/styles"

import type { ProductCardData } from "@modules/ds"
import CatalogCard from "@modules/products/components/catalog-card"

/**
 * "From the shop" band in the middle of an article: the products linked to the post (the newest four when none
 * are). The theme's product card (heart, add, category chip). Phones: a swipe row with two cards in view;
 * from lg: four columns.
 */
export default function FromTheShop({ title, products, countryCode, className }: { title: string; products: ProductCardData[]; countryCode: string; className?: string }) {
  if (!products.length) return null
  return (
    <section aria-labelledby="post-shop" className={cn("flex flex-col gap-stack-md py-stack-md", className)} data-testid="post-shop">
      <h2 id="post-shop" className="text-base font-medium">
        {title}
      </h2>
      <ul className="no-scrollbar -mx-container-x flex snap-x snap-mandatory gap-gutter overflow-x-auto px-container-x lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
        {products.slice(0, 4).map((p) => (
          <li key={p.href} className="w-[calc((100%-var(--space-gutter))/2)] shrink-0 snap-start lg:w-auto">
            <CatalogCard product={p} countryCode={countryCode} sizes="(min-width: 1024px) 25vw, 50vw" />
          </li>
        ))}
      </ul>
    </section>
  )
}
