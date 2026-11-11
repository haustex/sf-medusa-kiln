import localFont from "next/font/local"

/**
 * The one site font: Inter (OFL), self-hosted as ONE variable file: Latin subset, wght axis limited to 400–700,
 * opsz axis kept (large headings automatically use the display cut), 39.5 KB. docs/keputusan.md "Tipografi v3".
 * The wordmark is an SVG path, so Josefin Sans is not loaded at all. Regenerate with scripts/fonts/build-fonts.sh.
 */
export const inter = localFont({
  src: "./fonts-files/inter-latin-opsz-wght.woff2",
  weight: "400 700",
  style: "normal",
  display: "swap",
  variable: "--font-inter",
  // Our own metric-matched fallback faces (globals.css: InterFallbackRoboto / InterFallbackArial, separate
  // size-adjust for body and headings) instead of Next's single Arial face: lines wrap the same before/after swap
  adjustFontFallback: false,
  fallback: ["InterFallbackRoboto", "InterFallbackArial", "ui-sans-serif", "system-ui", "sans-serif"],
})
