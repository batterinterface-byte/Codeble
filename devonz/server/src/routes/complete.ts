import { Hono } from 'hono'

const completeRouter = new Hono()

completeRouter.post('/', async (c) => {
  const body = await c.req.json()
  const { code, language } = body

  if (!code) {
    return c.json({ completion: null })
  }

  const lines = code.split('\n')
  const lastLine = lines[lines.length - 1] || ''

  // Simple mock completions based on context
  let completion = ''

  if (lastLine.includes('function') || lastLine.includes('=>')) {
    completion = '  // TODO: implement function body\n  return null\n}'
  } else if (lastLine.includes('import') || lastLine.includes('require')) {
    completion = `\n\n// Using: ${lastLine.trim()}\n`
  } else if (lastLine.trim().endsWith('{') || lastLine.trim().endsWith('(')) {
    completion = '\n  \n'
  } else if (language === 'css' || language === 'scss') {
    completion = '  /* style */\n}'
  } else if (language === 'html') {
    completion = '  <!-- content -->\n'
  } else {
    completion = `\n  // AI completion for "${lastLine.trim() || 'current context'}"\n`
  }

  return c.json({ completion })
})

export { completeRouter }
