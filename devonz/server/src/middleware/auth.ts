import { Context, Next } from 'hono'

const COOKIE_KEY = 'devonz_session'
const DEV_TOKEN = 'devonz-dev-token'

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

export async function authMiddleware(c: Context, next: Next) {
  if (process.env.NODE_ENV !== 'production') {
    return next()
  }
  const token = c.req.header('authorization')?.replace('Bearer ', '') || ''
  if (timingSafeEqual(token, DEV_TOKEN)) {
    return next()
  }
  return c.json({ error: 'Unauthorized' }, 401)
}
