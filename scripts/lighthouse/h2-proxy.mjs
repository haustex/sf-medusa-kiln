// HTTPS + HTTP/2 reverse proxy for local Lighthouse runs (docs/lighthouse.md). Lighthouse's network model queues
// requests on 6 connections for HTTP/1.1 (what `next start` speaks); production sits behind a CDN on HTTP/2, so
// measuring through this proxy is closer to the real thing. Self-signed certificate: see docs/lighthouse.md.
//   node scripts/lighthouse/h2-proxy.mjs <listenPort> <targetPort> <key.pem> <cert.pem>
import http2 from "node:http2"
import http from "node:http"
import fs from "node:fs"
import { pipeline } from "node:stream"

const [listen, target, keyFile, certFile] = [Number(process.argv[2] || 9722), Number(process.argv[3] || 9721), process.argv[4] || "h2.key", process.argv[5] || "h2.crt"]
const noop = () => {}
const agent = new http.Agent({ keepAlive: true, maxSockets: 64 })
const server = http2.createSecureServer({ key: fs.readFileSync(keyFile), cert: fs.readFileSync(certFile), allowHTTP1: true })
server.on("sessionError", noop)
server.on("session", (s) => s.on("error", noop))
server.on("stream", (stream, headers) => {
  stream.on("error", noop)
  const { ":method": method, ":path": path, ...rest } = headers
  const h = {}
  for (const [k, v] of Object.entries(rest)) if (!k.startsWith(":")) h[k] = v
  h.host = `127.0.0.1:${target}`
  delete h.connection
  const req = http.request({ host: "127.0.0.1", port: target, method, path, headers: h, agent }, (res) => {
    if (stream.destroyed || stream.closed) return res.resume()
    const out = { ":status": res.statusCode }
    for (const [k, v] of Object.entries(res.headers)) if (!["connection", "keep-alive", "transfer-encoding"].includes(k)) out[k] = v
    try {
      stream.respond(out)
    } catch {
      return res.resume()
    }
    pipeline(res, stream, noop)
  })
  req.on("error", () => {
    if (stream.destroyed || stream.closed) return
    try {
      stream.respond({ ":status": 502 })
      stream.end()
    } catch {}
  })
  stream.on("close", () => req.destroy())
  pipeline(stream, req, noop)
})
server.listen(listen, "127.0.0.1", () => console.log(`h2 proxy https://127.0.0.1:${listen} -> http://127.0.0.1:${target}`))
