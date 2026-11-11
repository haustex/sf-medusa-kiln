import type { Dictionary } from "@lib/i18n/dictionaries"

const icons = [
  // hand
  "M8 13V5.5a1.5 1.5 0 0 1 3 0V12m0-1V4.5a1.5 1.5 0 0 1 3 0V12m0-6.5a1.5 1.5 0 0 1 3 0V13m0-5.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1.5a6 6 0 0 1-5-2.7L4.6 15a1.6 1.6 0 0 1 2.6-1.9L8 14",
  // log / grain
  "M4 7c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3Zm0 0v10c0 1.7 3.6 3 8 3s8-1.3 8-3V7M9 7c0-.6 1.3-1 3-1s3 .4 3 1-1.3 1-3 1-3-.4-3-1Z",
  // leaf / food safe
  "M5 19c0-8 5-13 14-14 0 9-5 14-13 14H5Zm0 0 7-7",
  // ruler
  "m14.5 3.5 6 6-11 11-6-6 11-11ZM8 10l2 2m1-5 2 2m-8 4 2 2m6-9 1 1",
]

export default function ValueProps({ t }: { t: Dictionary["home"] }) {
  return (
    <section aria-labelledby="values-title" className="content-container">
      <h2 id="values-title" className="sr-only">
        {t.valuesTitle}
      </h2>
      <ul className="grid grid-cols-2 gap-x-gutter gap-y-stack-lg lg:grid-cols-4">
        {t.values.map((v, i) => (
          <li key={v.title} className="flex flex-col gap-stack-sm sm:flex-row sm:gap-stack-md">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="size-6 shrink-0 fill-none stroke-current stroke-[1.5] [stroke-linecap:round] [stroke-linejoin:round]"
            >
              <path d={icons[i % icons.length]} />
            </svg>
            <div className="flex flex-col gap-stack-xs">
              <h3 className="text-sm font-medium sm:text-base">{v.title}</h3>
              <p className="text-sm text-muted">{v.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
