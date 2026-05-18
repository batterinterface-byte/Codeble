import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { deployService } from '../services/deploy'
import { db } from '../db'
import { deployments } from '../db/schema'
import { nanoid } from 'nanoid'

const deployRouter = new Hono()

deployRouter.post('/', async (c) => {
  const body = await c.req.json()
  const { projectId, target, projectPath } = body

  const result = await deployService.deploy({ target, projectPath, projectId })
  const id = nanoid()
  await db.insert(deployments).values({
    id,
    projectId,
    target,
    status: result.success ? 'deployed' : 'error',
    url: result.url,
    createdAt: Date.now(),
  })

  return c.json({ id, ...result })
})

deployRouter.get('/:projectId', async (c) => {
  const projectId = c.req.param('projectId')
  const deps = await db.select().from(deployments)
    .where(eq(deployments.projectId, projectId))
    .all()
  return c.json(deps)
})

export { deployRouter }
