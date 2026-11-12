import { Leaf, PackageOpen, Truck, Undo2 } from "lucide-react"

import type { Dictionary } from "@lib/i18n/dictionaries"
import { ICON } from "@modules/ds/icons"

/** One icon per value line, in order (lucide) */
const icons = [PackageOpen, Leaf, Truck, Undo2]

/**
 * Value props as a full-bleed ink band (#0C0C0C edge to edge, the content stays in the container): white titles
 * and icons, light grey body (AA on ink). 2 × 2 on phones and tablets, one row of 4 from lg.
 */
export default function ValueProps({ t }: { t: Dictionary["home"] }) {
  return (
    <section aria-labelledby="values-title" className="bg-foreground py-10 text-background md:py-16" data-testid="value-props">
      <h2 id="values-title" className="sr-only">
        {t.valuesTitle}
      </h2>
      <ul className="content-container grid grid-cols-2 gap-x-gutter gap-y-stack-lg lg:grid-cols-4">
        {t.values.map((v, i) => {
          const Icon = icons[i % icons.length]
          return (
            <li key={v.title} className="flex flex-col gap-stack-sm sm:flex-row sm:gap-stack-md">
              <Icon {...ICON} size={24} className="shrink-0 text-background" />
              <div className="flex flex-col gap-stack-xs">
                <h3 className="text-sm font-medium sm:text-base">{v.title}</h3>
                <p className="text-sm text-background/70">{v.body}</p>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
