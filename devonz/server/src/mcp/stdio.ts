import { spawn, ChildProcess } from 'child_process'
import { EventEmitter } from 'events'

export class StdioMCPTransport extends EventEmitter {
  private process: ChildProcess | null = null
  private buffer = ''

  constructor(private command: string, private args: string[] = []) {
    super()
  }

  connect() {
    this.process = spawn(this.command, this.args, {
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    this.process.stdout?.on('data', (data: Buffer) => {
      this.buffer += data.toString()
      const lines = this.buffer.split('\n')
      this.buffer = lines.pop() || ''
      for (const line of lines) {
        try {
          this.emit('message', JSON.parse(line))
        } catch { /* skip */ }
      }
    })

    this.process.stderr?.on('data', (data: Buffer) => {
      const text = data.toString()
      if (!text.includes('EPIPE') && !text.includes('premature close')) {
        this.emit('stderr', text)
      }
    })

    this.process.on('exit', (code) => {
      this.emit('exit', code)
    })
  }

  send(message: unknown) {
    if (this.process?.stdin?.writable) {
      this.process.stdin.write(JSON.stringify(message) + '\n')
    }
  }

  disconnect() {
    if (this.process) {
      this.process.kill()
      this.process = null
    }
  }
}
