import { Children } from "react"

/**
 * Product card grid: columns apart by gutter, rows apart by stack-lg (each card
 * carries text below its photo, so rows need more air than columns).
 */
export default function ProductGrid({ columns = 4, children }: { /** Columns from lg (2 on phones, 3 from md) */ columns?: 3 | 4; children: React.ReactNode }) {
  return (
    <ul className={columns === 3 ? "grid grid-cols-2 gap-x-gutter gap-y-stack-lg md:grid-cols-3" : "grid grid-cols-2 gap-x-gutter gap-y-stack-lg md:grid-cols-3 lg:grid-cols-4"}>
      {Children.toArray(children).map((child, i) => (
        <li key={i}>{child}</li>
      ))}
    </ul>
  )
}
