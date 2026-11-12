import { notFound } from "next/navigation"

import { feature } from "@lib/features"

/** Every /blog page answers 404 when medusa-blog-seo is not installed (lib/features.ts) */
export default async function BlogLayout({ children }: { children: React.ReactNode }) {
  if (!(await feature("blog"))) notFound()
  return children
}
