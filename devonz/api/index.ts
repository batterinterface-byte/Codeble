import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { cors } from 'hono/cors'

// ─── Vercel-compatible API ───────────────────────────
// This serverless entry replaces the full Node.js server.
// WebSocket, filesystem watch, and child processes are stubbed.
// SQLite uses an in-memory fallback.

const app = new Hono()

app.use('*', cors({
  origin: ['https://*.vercel.app', 'https://*.devonz.app', 'http://localhost:*'],
  credentials: true,
}))

// Health
app.get('/api/health', (c) => c.json({
  status: 'ok',
  version: '0.1.0',
  environment: 'vercel-serverless',
}))

// Auth (always dev mode on Vercel demo)
app.post('/api/auth/login', async (c) => {
  return c.json({ token: 'vercel-demo-token', user: { name: 'Vercel Demo' } })
})

app.get('/api/auth/verify', (c) => {
  return c.json({ valid: true, user: { name: 'Vercel Demo' } })
})

// Chat (mock only on Vercel)
app.post('/api/chat', async (c) => {
  c.header('Content-Type', 'text/event-stream')
  c.header('Cache-Control', 'no-cache')
  c.header('Connection', 'keep-alive')

  const response = "Welcome to Devonz on Vercel! I'm running in demo mode. " +
    "Create projects, edit code, and see live previews. " +
    "For the full experience with AI streaming and terminal, run locally with `npm run dev`."

  const words = response.split(' ')
  return new Response(
    new ReadableStream({
      async start(controller) {
        for (const word of words) {
          await new Promise(r => setTimeout(r, 30))
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'text', content: word + ' ' })}\n\n`))
        }
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`))
        controller.close()
      },
    }),
    { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } }
  )
})

app.post('/api/chat/agent', async (c) => {
  c.header('Content-Type', 'text/event-stream')
  c.header('Cache-Control', 'no-cache')
  c.header('Connection', 'keep-alive')

  const phases = [
    { type: 'agent_phase', phase: { type: 'thinking', label: 'Analyzing', detail: 'Understanding request' } },
    { type: 'agent_phase', phase: { type: 'planning', label: 'Planning', detail: 'Breaking down tasks' } },
    { type: 'agent_phase', phase: { type: 'writing', label: 'Writing code', detail: 'Implementing' } },
    { type: 'agent_phase', phase: { type: 'done', label: 'Complete', detail: 'Ready' } },
  ]
  const texts = ["I'm the Devonz AI agent running on Vercel. ", "I can help you build full-stack applications. ", "This is a demo deployment."]

  return new Response(
    new ReadableStream({
      async start(controller) {
        for (const phase of phases) {
          await new Promise(r => setTimeout(r, 200))
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(phase)}\n\n`))
        }
        for (const t of texts) {
          for (const ch of t) {
            await new Promise(r => setTimeout(r, 15))
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'text', content: ch })}\n\n`))
          }
        }
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`))
        controller.close()
      },
    }),
    { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } }
  )
})

// AI Completion (mock)
app.post('/api/chat/complete', async (c) => {
  const body = await c.req.json()
  const { code } = body
  const lines = (code || '').split('\n')
  const last = lines[lines.length - 1] || ''
  return c.json({
    completion: last.trim()
      ? `\n  // Vercel demo: AI completion for "${last.trim()}"\n  return null;`
      : '\n  // Start typing to see AI suggestions',
  })
})

// Projects (in-memory storage on Vercel)
const memProjects = new Map<string, any>()
const memFiles = new Map<string, string>()

app.get('/api/projects', (c) => {
  return c.json(Array.from(memProjects.values()))
})

app.post('/api/projects', async (c) => {
  const body = await c.req.json()
  const id = `proj-${Date.now()}`
  const name = body.name || `project-${id.slice(0, 8)}`
  const now = Date.now()
  const project = { id, name, path: `/tmp/${name}`, createdAt: now, updatedAt: now }
  memProjects.set(id, project)
  return c.json(project, 201)
})

app.get('/api/projects/:id', (c) => {
  const id = c.req.param('id')
  const project = memProjects.get(id)
  if (!project) return c.json({ error: 'Not found' }, 404)
  return c.json(project)
})

app.post('/api/projects/:id/session', (c) => {
  return c.json({ sessionId: `session-${Date.now()}`, port: null, message: 'Preview not available on Vercel demo' })
})

app.post('/api/projects/:id/session/:sessionId/stop', (c) => {
  return c.json({ success: true })
})

app.get('/api/projects/:id/files', (c) => {
  const id = c.req.param('id')
  const project = memProjects.get(id)
  if (!project) return c.json({ error: 'Not found' }, 404)
  const files = Array.from(memFiles.entries())
    .filter(([k]) => k.startsWith(project.name))
    .map(([k, v]) => ({
      name: k.split('/').pop(),
      path: k,
      type: 'file' as const,
      size: v.length,
    }))
  return c.json(files)
})

app.get('/api/search/:projectId', (c) => {
  return c.json({ results: [] })
})

// File system proxy (in-memory on Vercel)
app.get('/api/files/*', (c) => {
  const filePath = c.req.path.replace('/api/files/', '')
  const content = memFiles.get(filePath)
  if (!content) return c.body(null, 204)
  return c.body(content)
})

app.post('/api/files/*', async (c) => {
  const filePath = c.req.path.replace('/api/files/', '')
  const content = await c.req.text()
  memFiles.set(filePath, content)
  return c.json({ success: true })
})

app.get('/api/ls/*', (c) => {
  return c.json([])
})

// Git (stub)
app.post('/api/git/init', (c) => c.json({ success: true }))
app.post('/api/git/status', (c) => c.json({ branch: 'main', changes: 0, staged: 0, ahead: 0, behind: 0 }))
app.post('/api/git/commit', (c) => c.json({ success: true }))
app.post('/api/git/log', (c) => c.json([]))

// Deploy (stub)
app.post('/api/deploy', (c) => c.json({ success: true, url: 'https://devonz.vercel.app' }))
app.get('/api/deploy/:projectId', (c) => c.json([]))

// Proxy
app.get('/api/proxy/*', async (c) => {
  const targetUrl = c.req.query('url')
  if (!targetUrl) return c.json({ error: 'Missing url' }, 400)
  try {
    const resp = await fetch(targetUrl)
    return c.body(await resp.text(), resp.status as any)
  } catch {
    return c.json({ error: 'Proxy failed' }, 502)
  }
})

export default handle(app)
