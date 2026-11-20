import type { StreamEvent } from "./types"

/** Reads a server-sent-events body frame by frame (event / data lines; comments and keep-alives skipped) */
export async function* readSse(body: ReadableStream<Uint8Array>): AsyncGenerator<StreamEvent> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  const parse = (frame: string): StreamEvent | null => {
    let event = "message"
    const data: string[] = []
    for (const line of frame.split("\n")) {
      if (line.startsWith("event:")) event = line.slice(6).trim()
      else if (line.startsWith("data:")) data.push(line.slice(5).trim())
    }
    if (!data.length) return null
    try {
      const parsed = JSON.parse(data.join("\n")) as Record<string, unknown>
      return { ...parsed, type: (parsed.type as string) ?? event } as StreamEvent
    } catch {
      return null
    }
  }
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    let sep: number
    while ((sep = buffer.indexOf("\n\n")) >= 0) {
      const ev = parse(buffer.slice(0, sep))
      buffer = buffer.slice(sep + 2)
      if (ev) yield ev
    }
  }
  if (buffer.trim()) {
    const ev = parse(buffer)
    if (ev) yield ev
  }
}
