import { buttonVariants, cn } from "@heroui/styles"
import Link from "@modules/common/components/app-link"

import { ArrowRight } from "@modules/ds"

import { PostCardData } from "../types"
import { PostMeta } from "./post-card"
import PostCover from "./post-cover"

/**
 * Featured article on /blog: large cover (1:1 on phones, 4:3 beside the text from lg), big title, excerpt.
 * One link; "Baca artikel" is the visible affordance (a span styled as the primary button).
 */
export default function FeaturedPost({ post, cta, label }: { post: PostCardData; cta: string; label?: string }) {
  return (
    <Link
      href={post.href}
      className="k-card group grid items-center gap-stack-md rounded-media outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-4 focus-visible:ring-offset-background lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-inset-banner"
    >
      {/* First screen on /blog: the LCP image */}
      <PostCover slug={post.href.split("/").pop() ?? ""} src={post.cover} alt="" shape="feature" priority sizes="(min-width: 1024px) 60vw, 100vw" className="card-media" />
      <div className="flex flex-col gap-stack-md px-0.5 lg:px-0">
        <div className="flex flex-col gap-stack-sm">
          <p className="type-eyebrow">{[label, post.category].filter(Boolean).join(" · ")}</p>
          <h2 className="type-section max-w-[16em] text-balance">{post.title}</h2>
          {post.excerpt && <p className="line-clamp-3 max-w-xl text-base leading-relaxed text-muted sm:text-lg">{post.excerpt}</p>}
        </div>
        <PostMeta post={post} />
        <span className={cn(buttonVariants({ size: "lg" }), "gap-2 self-start")}>
          {cta}
          <ArrowRight />
        </span>
      </div>
    </Link>
  )
}
