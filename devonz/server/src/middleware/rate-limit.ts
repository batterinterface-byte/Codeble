import { Context, Next } from 'hono'

const hits = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(max: number, windowMs: number) {
  return async (c: Context, next: Next) => {
    const ip = c.req.header('x-forwarded-for') || 'unknown'
    const now = Date.now()
    let entry = hits.get(ip)
    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs }
      hits.set(ip, entry)
    }
    entry.count++
    if (entry.count > max) {
      return c.json({ error: 'Too many requests' }, 429)
    }
    await next()
  }
}
