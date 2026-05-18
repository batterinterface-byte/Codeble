import { Hono } from 'hono'
import { projectRuntime } from '../services/runtime'
import { db } from '../db'
import { projects } from '../db/schema'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'

const projectsRouter = new Hono()

projectsRouter.get('/', async (c) => {
  const all = await db.select().from(projects).all()
  return c.json(all)
})

projectsRouter.post('/', async (c) => {
  const body = await c.req.json()
  const id = nanoid()
  const name = body.name || `project-${id.slice(0, 8)}`
  const path = projectRuntime.createProject(name)
  const now = Date.now()
  await db.insert(projects).values({ id, name, path, createdAt: now, updatedAt: now })
  return c.json({ id, name, path, createdAt: now, updatedAt: now }, 201)
})

projectsRouter.get('/:id', async (c) => {
  const id = c.req.param('id')
  const project = await db.select().from(projects).where(eq(projects.id, id)).get()
  if (!project) return c.json({ error: 'Not found' }, 404)
  return c.json(project)
})

projectsRouter.post('/:id/session', async (c) => {
  const id = c.req.param('id')
  const project = await db.select().from(projects).where(eq(projects.id, id)).get()
  if (!project) return c.json({ error: 'Not found' }, 404)
  const sessionId = nanoid()
  const session = projectRuntime.startSession(sessionId, project.path)
  const port = projectRuntime.startDevServer(sessionId)
  return c.json({ sessionId, port })
})

projectsRouter.post('/:id/session/:sessionId/stop', async (c) => {
  const sessionId = c.req.param('sessionId')
  projectRuntime.stopSession(sessionId)
  return c.json({ success: true })
})

projectsRouter.get('/:id/files', async (c) => {
  const id = c.req.param('id')
  const project = await db.select().from(projects).where(eq(projects.id, id)).get()
  if (!project) return c.json({ error: 'Not found' }, 404)
  const files = projectRuntime.listFiles(project.path)
  return c.json(files)
})

export { projectsRouter }
