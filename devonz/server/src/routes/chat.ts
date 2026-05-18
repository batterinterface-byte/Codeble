import { Hono } from 'hono'
import { stream } from 'hono/streaming'
import { CoreMessage } from 'ai'
import { streamChat, mockStreamChat, LLMProvider, AgentMode } from '../services/ai'
import { rateLimit } from '../middleware/rate-limit'

const chatRouter = new Hono()

const useMock = !process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY && !process.env.OLLAMA_HOST

chatRouter.post('/', rateLimit(60, 60_000), async (c) => {
  const body = await c.req.json()
  const messages: CoreMessage[] = body.messages || []
  const provider: LLMProvider = body.provider || 'ollama'
  const model: string = body.model || ''
  const mode: AgentMode = body.mode || 'normal'

  if (messages.length === 0) {
    return c.json({ error: 'No messages' }, 400)
  }

  c.header('Content-Type', 'text/event-stream')
  c.header('Cache-Control', 'no-cache')
  c.header('Connection', 'keep-alive')

  const generator = useMock
    ? mockStreamChat(messages)()
    : streamChat(messages, { provider, model, apiKey: body.apiKey, baseUrl: body.baseUrl, mode })

  return stream(c, async (s) => {
    try {
      for await (const chunk of generator) {
        s.write(`data: ${JSON.stringify(chunk)}\n\n`)
      }
    } catch (e: any) {
      s.write(`data: ${JSON.stringify({ type: 'error', content: e.message })}\n\n`)
    }
    s.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
  })
})

chatRouter.post('/agent', rateLimit(10, 60_000), async (c) => {
  const body = await c.req.json()
  const messages: CoreMessage[] = body.messages || []

  c.header('Content-Type', 'text/event-stream')
  c.header('Cache-Control', 'no-cache')
  c.header('Connection', 'keep-alive')

  const phases = [
    { type: 'thinking' as const, label: 'Analyzing your request', detail: 'Understanding the context and requirements' },
    { type: 'planning' as const, label: 'Creating a plan', detail: 'Breaking down the task into steps' },
    { type: 'writing' as const, label: 'Writing code', detail: 'Implementing the solution' },
    { type: 'reviewing' as const, label: 'Reviewing changes', detail: 'Checking for errors and improvements' },
    { type: 'executing' as const, label: 'Running commands', detail: 'Executing the generated code' },
    { type: 'done' as const, label: 'Complete', detail: 'Task finished successfully' },
  ]

  const generator = useMock
    ? mockStreamChat(messages)()
    : streamChat(messages, { provider: body.provider || 'ollama', model: body.model || '', mode: 'agent' })

  return stream(c, async (s) => {
    try {
      for (const phase of phases) {
        await new Promise(r => setTimeout(r, 1000))
        s.write(`data: ${JSON.stringify({ type: 'agent_phase', phase })}\n\n`)
      }
      for await (const chunk of generator) {
        s.write(`data: ${JSON.stringify(chunk)}\n\n`)
      }
    } catch (e: any) {
      s.write(`data: ${JSON.stringify({ type: 'error', content: e.message })}\n\n`)
    }
    s.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
  })
})

chatRouter.post('/mcp/tool', async (c) => {
  const body = await c.req.json()
  const { serverId, toolName, args } = body
  const { mcpService } = await import('../services/mcp')
  try {
    const result = await mcpService.callTool(serverId, toolName, args)
    return c.json(result)
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

export { chatRouter }
