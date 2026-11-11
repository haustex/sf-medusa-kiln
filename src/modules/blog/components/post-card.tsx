import { cn } from "@heroui/styles"
import Link from "@modules/common/components/app-link"
import { Children } from "react"

import { PostCardData } from "../types"
import PostCover from "./post-cover"

/**
 * "6 Nov 2026 · 6 menit baca". The dots are CSS circles in each item's left padding (no glyph outside the font
 * subset); the row is pulled left by that padding and clipped, so the first item and any item that wraps to a new
 * line never start with a dot.
 */
export function PostMeta({ post, author, className }: { post: PostCardData; author?: string; className?: string }) {
  const item =
    "relative whitespace-nowrap pl-4 before:absolute before:left-[6.5px] before:top-1/2 before:size-[3px] before:-translate-y-1/2 before:rounded-full before:bg-current"
  return (
    <p className={cn("overflow-hidden text-sm text-muted", className)}>
      <span className="-ml-4 flex flex-wrap">
        {author && <span className={cn(item, "font-medium text-foreground")}>{author}</span>}
        <time dateTime={post.publishedAt} className={item}>
          {post.dateLabel}
        </time>
        <span className={item}>{post.readingTime}</span>
      </span>
    </p>
  )
}

/**
 * Blog card: 1:1 cover (radius lg), category, title, date + reading time. Same hover as the product card
 * (.hk-card in globals.css: lifts 3px with a soft shadow, nothing with reduced motion). The whole card is one link,
 * so the category is text here; the category chips above the grid are the links.
 */
export default function PostCard({
  post,
  priority,
  sizes = "(min-width: 768px) 33vw, 50vw",
  as: Heading = "h3",
  className,
}: {
  post: PostCardData
  priority?: boolean
  sizes?: string
  as?: "h2" | "h3"
  className?: string
}) {
  return (
    <Link
      href={post.href}
      className={cn(
        "hk-card group flex flex-col gap-stack-sm rounded-media outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
    >
      <PostCover slug={post.href.split("/").pop() ?? ""} src={post.cover} alt="" priority={priority} sizes={sizes} className="card-media" />
      <div className="flex flex-col gap-stack-xs px-0.5">
        {post.category && <p className="type-eyebrow">{post.category}</p>}
        <Heading className="line-clamp-3 text-base font-semibold leading-snug tracking-[-0.01em] text-foreground sm:text-lg">{post.title}</Heading>
        <PostMeta post={post} className="text-xs sm:text-sm" />
      </div>
    </Link>
  )
}

/** Blog card grid: 2 columns on phones, 3 from md (larger photos than the 4-column product grid) */
export function PostGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <ul className={cn("grid grid-cols-2 gap-x-gutter gap-y-stack-lg md:grid-cols-3", className)}>
      {Children.toArray(children).map((child, i) => (
        <li key={i}>{child}</li>
      ))}
    </ul>
  )
}
