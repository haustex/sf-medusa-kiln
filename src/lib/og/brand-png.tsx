import { ImageResponse } from "next/og"
import config from "@theme"

import { INTER_600 } from "@lib/og/inter-fonts"

/**
 * The logo as a PNG (app/brand/wordmark.png, app/brand/logo.png): e-mails, invoices and payment plugins show it with
 * <img>, and Organization.logo in JSON-LD needs a raster image. Drawn from theme.config.ts `brand.logo` like the
 * header (modules/brand/logo.tsx): one SVG path, or the name in Inter 600 with the small ink mark.
 */
const INK = "#000000"
const HEADERS = { "Cache-Control": "public, max-age=86400", "Cache-Tag": "og" }

const svgLogo = () => {
  const { logo } = config.brand
  if (logo.type !== "svg" || !logo.svgPath) return null
  const [, , w, h] = logo.svgViewBox.split(" ").map(Number)
  return w > 0 && h > 0 ? { path: logo.svgPath, viewBox: logo.svgViewBox, ratio: h / w } : null
}

/** Size of the text logo at a given font size: the mark, the gap and a generous estimate of the name's width */
const textSize = (fontSize: number) => {
  const mark = Math.round(fontSize * 0.9)
  const gap = Math.round(fontSize * 0.4)
  return { mark, gap, width: mark + gap + Math.ceil(fontSize * 0.66 * config.brand.name.length), height: Math.round(fontSize * 1.25) }
}

const textLogo = (fontSize: number) => {
  const { mark, gap } = textSize(fontSize)
  return (
    <div style={{ display: "flex", alignItems: "center", gap, color: INK, fontFamily: "Inter", fontSize, fontWeight: 600, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>
      <div style={{ width: mark, height: mark, borderRadius: Math.round(mark / 4), background: INK }} />
      {config.brand.name}
    </div>
  )
}

const fonts = [{ name: "Inter", data: INTER_600, weight: 600 as const, style: "normal" as const }]

/** Tight wordmark, black on transparent, 2× of a 160 px wide image */
export function wordmarkPng() {
  const svg = svgLogo()
  if (svg) {
    const width = 320
    const height = Math.max(1, Math.round(width * svg.ratio))
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", display: "flex" }}>
          <svg viewBox={svg.viewBox} width={width} height={height}>
            <path d={svg.path} fill={INK} />
          </svg>
        </div>
      ),
      { width, height, headers: HEADERS }
    )
  }
  const fontSize = 40
  const { width, height } = textSize(fontSize)
  return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center" }}>{textLogo(fontSize)}</div>, { width, height, fonts, headers: HEADERS })
}

/** 1200×300, the logo centred on white: Organization.logo (structured data wants ≥ 112 px, a raster) */
export function logoPng() {
  const svg = svgLogo()
  const width = 1200
  const height = 300
  const inner = svg ? (
    <svg viewBox={svg.viewBox} width={880} height={Math.round(880 * svg.ratio)}>
      <path d={svg.path} fill={INK} />
    </svg>
  ) : (
    textLogo(96)
  )
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff" }}>{inner}</div>,
    { width, height, fonts, headers: HEADERS }
  )
}
