import { getDictionary } from "@lib/i18n/dictionaries"
import { ProductCard, type ProductCardData } from "@modules/ds"
import CardAdd from "@modules/products/components/card-add"
import WishlistHeart from "@modules/wishlist/heart"

/**
 * A product card with its two controls wired: the wishlist heart (top-right) and the "+" (bottom-right). Use this
 * wherever a catalogue card appears (home, listings, search, related); ProductCard alone is the bare version.
 */
export default function CatalogCard({ product, countryCode, priority, sizes, className }: { product: ProductCardData; countryCode: string; priority?: boolean; sizes?: string; className?: string }) {
  const t = getDictionary(countryCode)
  const p = t.product
  return (
    <ProductCard
      product={product}
      priority={priority}
      sizes={sizes}
      className={className}
      action={product.id ? <WishlistHeart productId={product.id} labels={{ add: t.wishlist.add, remove: t.wishlist.remove }} /> : undefined}
      add={
        product.variants?.length ? (
          <CardAdd
            product={product}
            countryCode={countryCode}
            labels={{
              addToCartTitle: p.addToCartTitle,
              chooseOptions: p.chooseOptions,
              addedShort: p.addedShort,
              addError: p.addError,
              soldOut: p.soldOut,
              quickView: p.quickView,
              chooseOption: p.chooseOption,
              addToCart: p.addToCart,
              adding: p.adding,
              added: p.added,
              unavailable: p.unavailable,
              viewDetails: p.viewDetails,
              close: p.close,
            }}
          />
        ) : undefined
      }
    />
  )
}
