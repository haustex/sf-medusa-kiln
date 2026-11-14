import { cn } from "@heroui/styles"
import { __iconData as check } from "lucide-react/icons/check"

import Link from "@modules/common/components/app-link"
import { Icon } from "@modules/ds/icons"

export type StepState = "open" | "done" | "todo"

/**
 * One checkout step: number (or a check when done), title, "Edit" link when done, the form while open or a short
 * summary when done. Steps are stacked with hairlines between them (the parent's divide-y).
 */
export default function Step({ index, title, state, editHref, editLabel, summary, children, testId }: { index: number; title: string; state: StepState; editHref: string; editLabel: string; summary?: React.ReactNode; children?: React.ReactNode; testId: string }) {
  return (
    <section aria-labelledby={`step-${index}`} className={cn("flex flex-col gap-stack-md py-stack-lg first:pt-0", state === "todo" && "text-muted")} data-testid={testId} data-state={state}>
      <div className="flex items-center justify-between gap-stack-md">
        <h2 id={`step-${index}`} className="flex items-center gap-stack-sm type-h3">
          <span aria-hidden="true" className={cn("inline-flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-medium", state === "todo" ? "ring-1 ring-separator" : "bg-foreground text-background")}>
            {state === "done" ? <Icon icon={check} size={16} strokeWidth={2.25} /> : index}
          </span>
          {title}
        </h2>
        {state === "done" && (
          <Link href={editHref} scroll={false} className="text-sm underline-offset-4 hover:underline" data-testid={`${testId}-edit`}>
            {editLabel}
          </Link>
        )}
      </div>
      {state === "open" && children}
      {state === "done" && summary && <div className="pl-9 text-sm">{summary}</div>}
    </section>
  )
}
