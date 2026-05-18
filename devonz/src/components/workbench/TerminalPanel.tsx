import { useEffect, useRef, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'

const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
const TERMINAL_WS_URL = `${protocol}//${window.location.hostname}:4090/ws/terminal`

let mockCwd = '/home/user'

function runMockCommand(input: string): string {
  const args = input.trim().split(/\s+/)
  const cmd = args[0]
  const rest = args.slice(1)

  switch (cmd) {
    case 'clear': return '\x1b[2J\x1b[H'
    case 'pwd': return mockCwd + '\r\n'
    case 'date': return new Date().toString() + '\r\n'
    case 'echo': return rest.join(' ') + '\r\n'
    case 'whoami': return 'devonz-user\r\n'
    case 'hostname': return 'devonz-sandbox\r\n'
    case 'uname': return 'Linux devonz-sandbox 6.2.0\r\n'
    case 'ls': return 'index.html  src  package.json  README.md\r\n'
    case 'help': return 'Available: clear, pwd, ls, cd, echo, date, whoami, hostname, uname, help, exit\r\n'
    case 'cd':
      if (!rest[0] || rest[0] === '~') mockCwd = '/home/user'
      else if (rest[0] === '..') mockCwd = mockCwd.replace(/\/[^/]+$/, '') || '/'
      else if (rest[0].startsWith('/')) mockCwd = rest[0]
      else mockCwd = mockCwd.replace(/\/$/, '') + '/' + rest[0]
      return ''
    case 'exit': return '\x1b[33m[terminal session ended]\x1b[0m\r\n'
    default:
      if (cmd) return `\x1b[31mbash: ${cmd}: command not found\x1b[0m\r\n`
      return ''
  }
}

function prompt() {
  return `\r\n\x1b[32mdevonz@devonz\x1b[0m:\x1b[34m${mockCwd}\x1b[0m$ `
}

export function TerminalPanel() {
  const containerRef = useRef<HTMLDivElement>(null)
  const terminalRef = useRef<Terminal | null>(null)
  const bufferRef = useRef('')
  const wsRef = useRef<WebSocket | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!containerRef.current || terminalRef.current) return

    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'block',
      fontSize: 13,
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      theme: {
        background: '#0b0d13',
        foreground: '#e6edf3',
        cursor: '#3b82f6',
        selectionBackground: 'rgba(59,130,246,0.3)',
        black: '#1e293b',
        red: '#ef4444',
        green: '#22c55e',
        yellow: '#f59e0b',
        blue: '#3b82f6',
        magenta: '#a855f7',
        cyan: '#06b6d4',
        white: '#e6edf3',
        brightBlack: '#64748b',
        brightRed: '#f87171',
        brightGreen: '#4ade80',
        brightYellow: '#fbbf24',
        brightBlue: '#60a5fa',
        brightMagenta: '#c084fc',
        brightCyan: '#22d3ee',
        brightWhite: '#f8fafc',
      },
      allowProposedApi: true,
      cols: 80,
      rows: 12,
    })

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)

    term.open(containerRef.current)
    setTimeout(() => fitAddon.fit(), 50)

    const handleResize = () => fitAddon.fit()
    window.addEventListener('resize', handleResize)

    // Show local shell immediately
    term.write('Devonz Terminal v0.1.0 (offline mode)\r\n')
    term.write('Type "help" for available commands\r\n')
    term.write('─'.repeat(50) + '\r\n')
    term.write(prompt())

    // Input handler shared between local and WS modes
    term.onData((data) => {
      const ws = wsRef.current
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(data)
        return
      }

      if (data === '\r') {
        const cmd = bufferRef.current
        bufferRef.current = ''
        const output = runMockCommand(cmd)
        if (cmd === 'clear') {
          term.write(output)
        } else {
          term.write(output)
        }
        if (cmd !== 'clear') term.write(prompt())
      } else if (data === '\x7f') {
        if (bufferRef.current.length > 0) {
          bufferRef.current = bufferRef.current.slice(0, -1)
          term.write('\b \b')
        }
      } else if (data === '\x03') {
        bufferRef.current = ''
        term.write('^C\r\n' + prompt())
      } else if (data.length === 1 && data.charCodeAt(0) >= 32) {
        bufferRef.current += data
        term.write(data)
      }
    })

    // Try WebSocket (max 1 attempt)
    const ws = new WebSocket(TERMINAL_WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      term.reset()
      term.write('Devonz Terminal v0.1.0\r\n')
      term.write('Connected to project runtime\r\n')
      term.write('─'.repeat(50) + '\r\n')
    }

    ws.onmessage = (event) => {
      if (typeof event.data === 'string') {
        term.write(event.data)
      }
    }

    ws.onclose = () => {
      if (wsRef.current === ws) {
        setConnected(false)
        wsRef.current = null
      }
    }

    terminalRef.current = term

    return () => {
      window.removeEventListener('resize', handleResize)
      ws.close()
      term.dispose()
      terminalRef.current = null
    }
  }, [])

  return (
    <div className="h-full flex flex-col bg-deep">
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-border/50 bg-surface/30 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green' : 'bg-orange'} shadow-green`} />
          <span className="text-xs text-secondary font-medium">Terminal</span>
          <span className="text-xs text-muted font-mono">bash</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <span>{connected ? 'connected' : 'offline'}</span>
        </div>
      </div>
      <div ref={containerRef} className="flex-1 overflow-hidden" />
    </div>
  )
}
