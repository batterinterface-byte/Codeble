import { Server as HTTPServer } from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import { IncomingMessage } from 'http'
import { URL } from 'url'
import { projectRuntime } from '../services/runtime'

const HEARTBEAT_INTERVAL = 30_000

interface ExtWebSocket extends WebSocket {
  isAlive: boolean
  token?: string
  isTerminal?: boolean
}

export function createWebSocketServer(server: HTTPServer | { server: HTTPServer }) {
  const httpServer = 'server' in server ? server.server : server

  // Main WebSocket for app events
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' })

  // Terminal WebSocket for PTY
  const termWss = new WebSocketServer({ server: httpServer, path: '/ws/terminal' })

  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      const ext = ws as ExtWebSocket
      if (!ext.isAlive) return ext.terminate()
      ext.isAlive = false
      ext.ping()
    })
  }, HEARTBEAT_INTERVAL)

  // Main app WebSocket
  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    const ext = ws as ExtWebSocket
    ext.isAlive = true
    ext.isTerminal = false

    const url = new URL(req.url || '', 'http://localhost')
    const token = url.searchParams.get('token')
    if (!token || token !== 'devonz-dev-token') {
      if (process.env.NODE_ENV === 'production') {
        ext.close(4001, 'Unauthorized')
        return
      }
    }
    ext.token = token || 'dev'

    ws.on('pong', () => { ext.isAlive = true })
    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString())
        handleMessage(wss, ws, msg)
      } catch { /* ignore */ }
    })

    ws.send(JSON.stringify({ type: 'connected', heartbeatInterval: HEARTBEAT_INTERVAL }))
  })

  // Terminal WebSocket - real PTY
  termWss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    const ext = ws as ExtWebSocket
    ext.isTerminal = true

    const projectsDir = projectRuntime.getProjectsDir()
    const cwd = projectsDir

    try {
      // Use node-pty for real PTY if available, otherwise use spawn
      let shell: any
      try {
        const pty = require('node-pty')
        const shellEnv = process.env.SHELL || 'bash'
        shell = pty.spawn(shellEnv, [], {
          name: 'xterm-color',
          cols: 80,
          rows: 24,
          cwd,
          env: { ...process.env, TERM: 'xterm-256color' },
        })

        shell.onData((data: string) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(data)
          }
        })

        ws.on('message', (data: Buffer) => {
          const input = data.toString()
          shell.write(input)
        })

        ws.on('close', () => {
          try { shell.kill() } catch {}
        })
      } catch {
        // Fallback: spawn a shell process
        const { spawn } = require('child_process')
        const proc = spawn(process.env.SHELL || 'bash', [], {
          cwd,
          env: { ...process.env, TERM: 'xterm-256color' },
        })

        proc.stdout?.on('data', (data: Buffer) => {
          if (ws.readyState === WebSocket.OPEN) ws.send(data.toString())
        })
        proc.stderr?.on('data', (data: Buffer) => {
          if (ws.readyState === WebSocket.OPEN) ws.send(data.toString())
        })

        ws.on('message', (data: Buffer) => {
          proc.stdin?.write(data.toString())
        })

        ws.on('close', () => {
          try { proc.kill() } catch {}
        })
      }
    } catch (e: any) {
      ws.send(`\r\n\x1b[31mError starting terminal: ${e.message}\x1b[0m\r\n`)
      ws.close()
    }
  })

  wss.on('close', () => clearInterval(interval))
  termWss.on('close', () => {})

  function broadcast(data: any) {
    const msg = JSON.stringify(data)
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg)
      }
    })
  }

  return wss
}

function handleMessage(wss: WebSocketServer, ws: WebSocket, msg: any) {
  switch (msg.type) {
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong' }))
      break
    case 'subscribe':
      ws.send(JSON.stringify({ type: 'subscribed', channel: msg.channel }))
      break
    case 'opencode:run':
      ws.send(JSON.stringify({
        type: 'opencode:result',
        result: `[opencode] Running: ${msg.command || msg.prompt}`,
      }))
      break
    default:
      ws.send(JSON.stringify({ type: 'echo', original: msg }))
  }
}

export { ExtWebSocket }
