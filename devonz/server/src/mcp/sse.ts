import { EventEmitter } from 'events'

export class SSEMCPTransport extends EventEmitter {
  private eventSource: EventSource | null = null
  private abortController: AbortController | null = null

  constructor(private url: string) {
    super()
  }

  async connect() {
    this.abortController = new AbortController()

    try {
      const response = await fetch(this.url, {
        signal: this.abortController.signal,
        headers: { Accept: 'text/event-stream' },
      })

      if (!response.ok) {
        this.emit('error', new Error(`SSE connection failed: ${response.status}`))
        return
      }

      const reader = response.body?.getReader()
      if (!reader) return

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              this.emit('message', JSON.parse(line.slice(6)))
            } catch { /* skip */ }
          }
        }
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        this.emit('error', e)
      }
    }
  }

  send(message: unknown) {
    // SSE transport typically doesn't support client-to-server messages
    console.warn('[mcp sse] send not supported')
  }

  disconnect() {
    this.abortController?.abort()
    this.eventSource?.close()
    this.emit('disconnected')
  }
}
