import { Context, Next } from 'hono'

const exemptPaths = ['/api/chat', '/api/chat/agent']

export async function csrfProtection(c: Context, next: Next) {
  if (process.env.NODE_ENV !== 'production') {
    return next()
  }
  const path = c.req.path
  if (exemptPaths.some(p => path.startsWith(p))) {
    return next()
  }
  if (c.req.method === 'GET' || c.req.method === 'HEAD' || c.req.method === 'OPTIONS') {
    return next()
  }
  const origin = c.req.header('origin')
  const referer = c.req.header('referer')
  if (!origin && !referer) {
    return c.json({ error: 'Missing origin or referer' }, 403)
  }
  await next()
}
