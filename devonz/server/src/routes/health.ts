import { Hono } from 'hono'

const healthRouter = new Hono()

healthRouter.get('/', (c) => {
  return c.json({
    status: 'ok',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '0.1.0',
  })
})

export { healthRouter }
