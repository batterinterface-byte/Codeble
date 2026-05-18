import { Hono } from 'hono'
import { nanoid } from 'nanoid'
import { timingSafeEqual } from '../middleware/auth'

const authRouter = new Hono()

const DEV_TOKEN = 'devonz-dev-token'

authRouter.post('/login', async (c) => {
  const body = await c.req.json()
  const { password } = body

  if (process.env.NODE_ENV !== 'production') {
    const token = DEV_TOKEN
    return c.json({ token, user: { name: 'devonz-dev' } })
  }

  if (!password) {
    return c.json({ error: 'Password required' }, 401)
  }

  return c.json({ error: 'Invalid credentials' }, 401)
})

authRouter.get('/verify', (c) => {
  const token = c.req.header('authorization')?.replace('Bearer ', '')
  if (!token) return c.json({ valid: false }, 401)
  if (token === DEV_TOKEN) {
    return c.json({ valid: true, user: { name: 'devonz-dev' } })
  }
  return c.json({ valid: false }, 401)
})

export { authRouter }
