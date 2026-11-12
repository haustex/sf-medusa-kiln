import "server-only"
import { HttpTypes } from "@medusajs/types"

import { listCollections } from "./collections"
import { listProducts } from "./products"

/**
 * Makers are Medusa collections (one per workshop, brand or line): the product page's "by …" line, the listing's
 * maker filter and the /makers pages read the same thing. Everything beyond the title lives in the collection's
 * metadata (Admin → Products → Collections → Metadata), all optional:
 *
 *   location     "Jepara, Indonesia"                     short line under the name
 *   description  one or two sentences                     cards and the profile header
 *   story        longer text, paragraphs by blank line;   the profile page (markdown: headings, lists, links)
 *   image        URL of a wide photo (12:5)               the profile's cover; without it the products stand in
 *   website      URL                                      "Website" link on the profile
 *
 * A collection without products is not a maker (nothing to show).
 */
export type Maker = {
  id: string
  handle: string
  name: string
  location: string | null
  description: string | null
  story: string | null
  image: string | null
  website: string | null
}

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null)

export const toMaker = (c: HttpTypes.StoreCollection): Maker => ({
  id: c.id,
  handle: c.handle,
  name: c.title,
  location: str(c.metadata?.location),
  description: str(c.metadata?.description),
  story: str(c.metadata?.story),
  image: str(c.metadata?.image),
  website: str(c.metadata?.website),
})

export async function listMakers(countryCode: string): Promise<Maker[]> {
  const { collections } = await listCollections({ fields: "id,title,handle,metadata", limit: "100" }, countryCode)
  return collections.map(toMaker)
}

export async function getMaker(countryCode: string, handle: string): Promise<Maker | null> {
  if (!/^[a-z0-9-]{1,128}$/.test(handle)) return null
  const { collections } = await listCollections({ handle, fields: "id,title,handle,metadata", limit: "1" }, countryCode).catch(() => ({ collections: [] }))
  return collections[0] ? toMaker(collections[0]) : null
}

/** The maker's products: the newest first, with the total */
export const listMakerProducts = (countryCode: string, makerId: string, limit: number, fields: string) =>
  listProducts({ countryCode, queryParams: { collection_id: [makerId], limit, order: "-created_at", fields } })
    .then(({ response }) => response)
    .catch(() => ({ products: [] as HttpTypes.StoreProduct[], count: 0 }))
