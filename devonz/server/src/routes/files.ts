import { Hono } from 'hono'
import { projectRuntime } from '../services/runtime'
import path from 'path'

const filesRouter = new Hono()

filesRouter.get('/files/*', async (c) => {
  const filePath = c.req.path.replace('/api/files/', '')
  const projectsDir = projectRuntime.getProjectsDir()
  const fullPath = path.join(projectsDir, filePath)

  if (!fullPath.startsWith(projectsDir)) {
    return c.json({ error: 'Invalid path' }, 403)
  }

  const content = projectRuntime.readFile(fullPath)
  if (content === null) {
    return c.body(null, 204)
  }
  return c.body(content, 200, { 'Content-Type': 'text/plain' })
})

filesRouter.post('/files/*', async (c) => {
  const filePath = c.req.path.replace('/api/files/', '')
  const projectsDir = projectRuntime.getProjectsDir()
  const fullPath = path.join(projectsDir, filePath)

  if (!fullPath.startsWith(projectsDir)) {
    return c.json({ error: 'Invalid path' }, 403)
  }

  const body = await c.req.text()
  projectRuntime.writeFile(fullPath, body)
  return c.json({ success: true })
})

filesRouter.get('/ls/*', async (c) => {
  const dirPath = c.req.path.replace('/api/ls/', '')
  const projectsDir = projectRuntime.getProjectsDir()
  const fullPath = path.join(projectsDir, dirPath)

  if (!fullPath.startsWith(projectsDir)) {
    return c.json({ error: 'Invalid path' }, 403)
  }

  const files = projectRuntime.listFiles(fullPath)
  return c.json(files)
})

filesRouter.get('/watch', async (c) => {
  const dirPath = c.req.query('dir') || ''
  const projectsDir = projectRuntime.getProjectsDir()
  const fullPath = path.join(projectsDir, dirPath)

  if (!fullPath.startsWith(projectsDir)) {
    return c.json({ error: 'Invalid path' }, 403)
  }

  c.header('Content-Type', 'text/event-stream')
  c.header('Cache-Control', 'no-cache')
  c.header('Connection', 'keep-alive')

  const watcherId = projectRuntime.watchProject(fullPath, (event, filePath) => {
    c.status(200)
  })

  return new Promise(() => {
    c.req.raw.signal.addEventListener('abort', () => {
      projectRuntime.unwatch(watcherId)
    })
  })
})

export { filesRouter }
