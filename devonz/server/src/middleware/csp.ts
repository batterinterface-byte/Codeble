import { Context, Next } from 'hono'

const ALLOWED_CONNECT = [
  "'self'",
  'http://localhost:*',
  'https://api.openai.com',
  'https://api.anthropic.com',
  'https://api.openrouter.ai',
  'https://api.github.com',
  'https://gitlab.com/api',
  'https://api.vercel.com',
  'https://api.netlify.com',
  'https://api.supabase.com',
  'wss://localhost:*',
]

export async function cspMiddleware(c: Context, next: Next) {
  c.header(
    'content-security-policy',
    `default-src 'self'; ` +
    `connect-src ${ALLOWED_CONNECT.join(' ')}; ` +
    `script-src 'self' 'unsafe-inline' 'unsafe-eval'; ` +
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; ` +
    `font-src 'self' https://fonts.gstatic.com; ` +
    `img-src 'self' data: blob:; ` +
    `frame-src 'self' http://localhost:*;`
  )
  await next()
}
