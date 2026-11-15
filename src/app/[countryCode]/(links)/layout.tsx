import { notFound } from "next/navigation"

import { feature } from "@lib/features"

/**
 * Link-in-bio pages (/links, /links/{handle}): no shop header or footer, the page draws its own chrome
 * (modules/links/template.tsx). Every one of them answers 404 when medusa-link-in-bio is not installed.
 */
export default async function LinksLayout({ children }: { children: React.ReactNode }) {
  if (!(await feature("links"))) notFound()
  return children
}
