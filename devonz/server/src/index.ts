import { serve } from '@hono/node-server'
import { app } from './app'
import { WebSocketServer } from 'ws'
import { createWebSocketServer } from './websocket'
import { migrate } from './db/migrate'
import { projectRuntime } from './services/runtime'

const PORT = parseInt(process.env.PORT || '4090')

async function start() {
  await migrate()
  projectRuntime.ensureProjectsDir()

  const server = serve({
    fetch: (request: Request, env: any) => {
      return app.fetch(request, env, { 
        // Handle broken pipe errors gracefully
        waitUntil: () => {},
      })
    },
    port: PORT,
  })

  // Attach WebSocket server to the underlying Node HTTP server
  const wss = createWebSocketServer(server)

  process.on('uncaughtException', (err: Error) => {
    const code = (err as NodeJS.ErrnoException).code
    if (code === 'EPIPE' || err.message.includes('premature close')) {
      return
    }
    console.error('[server] uncaught exception:', err)
  })

  process.on('unhandledRejection', (reason: any) => {
    if (reason?.code === 'EPIPE' || reason?.message?.includes('premature close')) {
      return
    }
    console.error('[server] unhandled rejection:', reason)
  })

  process.on('SIGTERM', () => {
    projectRuntime.cleanup()
    wss.close()
    server.close()
    process.exit(0)
  })

  console.log(`[devonz] server running on http://localhost:${PORT}`)
}

start().catch(console.error)
