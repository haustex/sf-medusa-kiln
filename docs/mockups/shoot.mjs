// Renders docs/mockups/src/*.html to PNG. Needs puppeteer: PUPPETEER_DIR=/folder/with/node_modules/puppeteer node docs/mockups/shoot.mjs
import { createRequire } from "node:module"
const puppeteer = createRequire(`${process.env.PUPPETEER_DIR}/package.json`)("puppeteer")
const SRC = "file:///home/anto/themes/kiln/docs/mockups/src"
const OUT = "/home/anto/themes/kiln/docs/mockups"
const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-gpu"] })
const shots = [
  ["home.html", "home-desktop", 1440, 900, 1, true], ["home.html", "home-mobile", 390, 844, 2, true],
  ["plp.html", "plp-desktop", 1440, 900, 1, true], ["plp.html", "plp-mobile", 390, 844, 2, true], ["plp.html?sheet=1", "plp-mobile-filter-sheet", 390, 844, 2, false],
  ["pdp.html", "pdp-desktop", 1440, 900, 1, true], ["pdp.html", "pdp-mobile", 390, 844, 2, true], ["pdp.html", "pdp-mobile-fold", 390, 844, 2, false],
]
for (const [file, name, w, h, dpr, full] of shots) {
  const page = await browser.newPage()
  await page.setViewport({ width: w, height: h, deviceScaleFactor: dpr, isMobile: w < 500, hasTouch: w < 500 })
  await page.goto(`${SRC}/${file}`, { waitUntil: "networkidle0" })
  await page.evaluate(() => document.fonts.ready)
  await new Promise((r) => setTimeout(r, 300))
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full })
  const height = await page.evaluate(() => document.documentElement.scrollHeight)
  console.log(name, `${w}x${full ? height : h}@${dpr}`)
  await page.close()
}
await browser.close()
