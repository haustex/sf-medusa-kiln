import { Leaf, PackageOpen, Truck, Undo2 } from "lucide-react"

import type { Dictionary } from "@lib/i18n/dictionaries"
import { ICON } from "@modules/ds/icons"

/** One icon per value line, in order (lucide) */
const icons = [PackageOpen, Leaf, Truck, Undo2]

export default function ValueProps({ t }: { t: Dictionary["home"] }) {
  return (
    <section aria-labelledby="values-title" className="content-container">
      <h2 id="values-title" className="sr-only">
        {t.valuesTitle}
      </h2>
      <ul className="grid grid-cols-2 gap-x-gutter gap-y-stack-lg lg:grid-cols-4">
        {t.values.map((v, i) => {
          const Icon = icons[i % icons.length]
          return (
          <li key={v.title} className="flex flex-col gap-stack-sm sm:flex-row sm:gap-stack-md">
            <Icon {...ICON} size={24} className="shrink-0" />
            <div className="flex flex-col gap-stack-xs">
              <h3 className="text-sm font-medium sm:text-base">{v.title}</h3>
              <p className="text-sm text-muted">{v.body}</p>
            </div>
          </li>
          )
        })}
      </ul>
    </section>
  )
}
