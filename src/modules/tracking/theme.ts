import { buttonVariants, cn } from "@heroui/styles"

import type { TrackingTheme } from "./core/theme"

/**
 * Kiln's look for the plugin's tracking components (core/ stays as copied from medusa-fulfillment-zone-rate; change
 * classes here). Same tokens as the rest of the theme: cards on bg-default, type scale, the Input/Button recipes.
 */
export const kilnTrackingTheme: Partial<TrackingTheme> = {
  page: "",
  inner: "flex w-full flex-col gap-stack-lg",
  card: "flex flex-col gap-stack-md rounded-media bg-default p-stack-lg",
  title: "type-h1",
  heading: "type-h3",
  text: "text-base text-foreground",
  subtle: "text-base text-muted",
  small: "text-sm text-muted",
  muted: "text-xs text-muted",
  error: "w-full text-sm text-danger sm:order-last",
  form: "flex flex-col gap-stack-sm sm:flex-row sm:flex-wrap",
  input:
    "h-12 w-full min-w-0 shrink-0 rounded-[var(--field-radius)] border border-field-border bg-field-background px-stack-md font-mono text-base uppercase tracking-wide placeholder:normal-case placeholder:tracking-normal placeholder:text-field-placeholder focus:border-foreground focus:outline-none focus:ring-2 focus:ring-focus sm:w-auto sm:flex-1",
  button: cn(buttonVariants({ variant: "primary", size: "lg" }), "h-12 px-6"),
  mono: "font-mono tracking-wide tabular-nums",
  number: "font-mono text-base tracking-wide text-muted",
  status: "type-h2",
  statusFinal: "type-h2 text-success",
  facts: "grid grid-cols-1 gap-stack-md border-t border-separator pt-stack-md sm:grid-cols-2",
  fact: "flex flex-col gap-stack-xs",
  factLabel: "text-sm text-muted",
  factValue: "font-medium text-foreground [overflow-wrap:anywhere]",
  link: "font-medium underline underline-offset-4 hover:text-muted",
  timeline: "flex flex-col",
  event: "relative flex gap-stack-sm pb-stack-lg last:pb-0",
  dot: "relative z-10 mt-1.5 size-2.5 shrink-0 rounded-full bg-control",
  dotCurrent: "relative z-10 mt-1.5 size-2.5 shrink-0 rounded-full bg-foreground ring-4 ring-background",
  line: "absolute bottom-0 left-[4.5px] top-4 w-px bg-separator",
  eventTitle: "font-medium text-foreground",
  eventMeta: "text-sm text-muted",
  live: "inline-flex items-center gap-stack-sm text-sm text-muted",
  liveDot: "size-2 animate-pulse rounded-full bg-success motion-reduce:animate-none",
  photos: "mt-stack-xs flex flex-wrap gap-stack-sm",
  photo: "size-20 rounded-md bg-background object-cover",
}
