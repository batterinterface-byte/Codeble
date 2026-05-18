import { useEffect, useRef } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'

const TERMINAL_WS_URL = `ws://${window.location.hostname}:4090/ws/terminal`

export function TerminalPanel() {
  const containerRef = useRef<HTMLDivElement>(null)
  const terminalRef = useRef<Terminal | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

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

    // Fit after a small delay to ensure container is rendered
    setTimeout(() => fitAddon.fit(), 50)

    // Handle resize
    const handleResize = () => fitAddon.fit()
    window.addEventListener('resize', handleResize)

    // WebSocket connection for real PTY
    const connectWS = () => {
      const ws = new WebSocket(TERMINAL_WS_URL)

      ws.onopen = () => {
        term.reset()
        term.write('Devonz Terminal v0.1.0\r\n')
        term.write('Connected to project runtime\r\n')
        term.write('─'.repeat(50) + '\r\n')
      }

      ws.onmessage = (event) => {
        const data = event.data
        if (typeof data === 'string') {
          term.write(data)
        }
      }

      ws.onclose = () => {
        term.write('\r\n\x1b[33m[disconnected] reconnecting...\x1b[0m\r\n')
        setTimeout(connectWS, 2000)
      }

      ws.onerror = () => {
        // If connection fails, run in local mock mode
        term.write('\r\n\x1b[90m[terminal server offline - using local echo]\x1b[0m\r\n')
      }

      wsRef.current = ws

      term.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data)
        }
      })
    }

    connectWS()

    terminalRef.current = term

    return () => {
      window.removeEventListener('resize', handleResize)
      wsRef.current?.close()
      term.dispose()
      terminalRef.current = null
    }
  }, [])

  return (
    <div className="h-full flex flex-col bg-deep">
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-border/50 bg-surface/30 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green shadow-green" />
          <span className="text-xs text-secondary font-medium">Terminal</span>
          <span className="text-xs text-muted font-mono">bash</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <span>~</span>
        </div>
      </div>
      <div ref={containerRef} className="flex-1 overflow-hidden" />
    </div>
  )
}
