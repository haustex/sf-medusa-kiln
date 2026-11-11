"use client"

import { ProductCard, ProductGrid, type ProductCardData } from "@modules/ds"
import WishlistHeart from "./heart"
import { useWishlistState } from "./store"

/** The wishlist page's cards: a card disappears as soon as its heart is switched off */
export default function WishlistGrid({ cards, labels }: { cards: ProductCardData[]; labels: { add: string; remove: string } }) {
  const { ids, loaded } = useWishlistState()
  const visible = loaded ? cards.filter((c) => c.id && ids.has(c.id)) : cards
  return (
    <ProductGrid>
      {visible.map((p, i) => (
        <ProductCard key={p.href} product={p} priority={i === 0} sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw" action={p.id ? <WishlistHeart productId={p.id} labels={labels} /> : undefined} />
      ))}
    </ProductGrid>
  )
}
