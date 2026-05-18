import { EventEmitter } from 'events'

export class StreamableHTTPMCPTransport extends EventEmitter {
  private abortController: AbortController | null = null

  constructor(private url: string) {
    super()
  }

  async connect() {
    this.abortController = new AbortController()
    this.emit('connected')
  }

  async send(message: unknown) {
    try {
      const response = await fetch(this.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
        signal: this.abortController?.signal,
      })

      const contentType = response.headers.get('content-type') || ''
      if (contentType.includes('text/event-stream')) {
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
      } else {
        const data = await response.json()
        this.emit('message', data)
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        this.emit('error', e)
      }
    }
  }

  disconnect() {
    this.abortController?.abort()
    this.emit('disconnected')
  }
}
