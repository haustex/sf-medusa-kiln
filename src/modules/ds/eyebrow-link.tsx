import Link from "@modules/common/components/app-link"

/**
 * Small category label above a title, as a link to the category (PDP, article). There is no visual breadcrumb
 * (docs/keputusan.md "Tanpa breadcrumb visual"): this is the way back up. min-h-6 keeps the 24px target size.
 */
export default function EyebrowLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <p>
      <Link
        href={href}
        className="type-eyebrow inline-flex min-h-6 items-center rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-focus"
      >
        {children}
      </Link>
    </p>
  )
}
