import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { chatRouter } from './routes/chat'
import { filesRouter } from './routes/files'
import { projectsRouter } from './routes/projects'
import { healthRouter } from './routes/health'
import { authRouter } from './routes/auth'
import { deployRouter } from './routes/deploy'
import { gitRouter } from './routes/git'
import { searchRouter } from './routes/search'
import { completeRouter } from './routes/complete'
import { csrfProtection } from './middleware/csrf'
import { authMiddleware } from './middleware/auth'
import { cspMiddleware } from './middleware/csp'

const app = new Hono()

app.use('*', cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}))

app.use('*', csrfProtection)
app.use('*', authMiddleware)
app.use('*', cspMiddleware)

app.route('/api/health', healthRouter)
app.route('/api/chat', chatRouter)
app.route('/api', filesRouter)
app.route('/api/projects', projectsRouter)
app.route('/api/search', searchRouter)
app.route('/api/chat/complete', completeRouter)
app.route('/api/auth', authRouter)
app.route('/api/deploy', deployRouter)
app.route('/api/git', gitRouter)

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

export { app }
