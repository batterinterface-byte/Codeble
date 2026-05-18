import { Hono } from 'hono'
import { gitService } from '../services/git'

const gitRouter = new Hono()

gitRouter.post('/init', async (c) => {
  const { path } = await c.req.json()
  await gitService.init(path)
  return c.json({ success: true })
})

gitRouter.post('/status', async (c) => {
  const { path } = await c.req.json()
  const status = await gitService.status(path)
  return c.json(status)
})

gitRouter.post('/commit', async (c) => {
  const { path, message } = await c.req.json()
  await gitService.commit(path, message)
  return c.json({ success: true })
})

gitRouter.post('/push', async (c) => {
  const { path, remote, branch } = await c.req.json()
  await gitService.push(path, remote, branch)
  return c.json({ success: true })
})

gitRouter.post('/log', async (c) => {
  const { path, limit } = await c.req.json()
  const log = await gitService.log(path, limit)
  return c.json(log)
})

export { gitRouter }
