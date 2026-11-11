"use client"

import { useState } from "react"

/**
 * YouTube video as a facade: a 16:9 box with the video's poster and a play button. The player (and everything
 * YouTube loads with it) only arrives after a click; without JavaScript the box is a plain link to the video.
 * Nothing from YouTube is fetched until the poster scrolls near the screen (lazy image).
 */
export default function YoutubeEmbed({ id, label, title }: { id: string; label: string; title: string }) {
  const [playing, setPlaying] = useState(false)
  if (playing) {
    return (
      <div className="blog-video">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    )
  }
  return (
    <a
      href={`https://www.youtube.com/watch?v=${id}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="blog-video outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return
        e.preventDefault()
        setPlaying(true)
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- YouTube's poster, shown as is */}
      <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" width={480} height={360} loading="lazy" decoding="async" />
      <span className="blog-video-play">
        <span>
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="currentColor">
            <path d="M8 5.5v13l11-6.5z" />
          </svg>
        </span>
      </span>
    </a>
  )
}
