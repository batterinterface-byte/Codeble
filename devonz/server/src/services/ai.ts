import { streamText, CoreMessage } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { ollama } from 'ollama-ai-provider'

export type LLMProvider = 'openai' | 'anthropic' | 'ollama' | 'openrouter'
export type AgentMode = 'normal' | 'agent'

interface AIOptions {
  provider: LLMProvider
  model: string
  apiKey?: string
  baseUrl?: string
  mode: AgentMode
}

function getProvider(opts: AIOptions) {
  switch (opts.provider) {
    case 'openai':
      return createOpenAI({ apiKey: opts.apiKey || 'mock-sk' })(opts.model || 'gpt-4o')
    case 'anthropic':
      return createAnthropic({ apiKey: opts.apiKey || 'mock-sk' })(opts.model || 'claude-sonnet-4-20250514')
    case 'ollama':
      return ollama(opts.model || 'codellama')
    case 'openrouter':
      return createOpenAI({
        apiKey: opts.apiKey || 'mock-sk',
        baseURL: opts.baseUrl || 'https://openrouter.ai/api/v1',
      })(opts.model || 'anthropic/claude-sonnet-4')
    default:
      return ollama('codellama')
  }
}

export async function* streamChat(messages: CoreMessage[], opts: AIOptions) {
  const timeout = opts.mode === 'agent' ? 300_000 : 45_000
  const retries = opts.mode === 'agent' ? 0 : 2

  let lastError: Error | null = null
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = streamText({
        model: getProvider(opts),
        messages,
        maxRetries: 0,
        abortSignal: AbortSignal.timeout(timeout),
      })

      for await (const chunk of result.textStream) {
        yield { type: 'text', content: chunk } as const
      }
      yield { type: 'done' } as const
      return
    } catch (e) {
      lastError = e as Error
      if (attempt < retries) {
        yield { type: 'text', content: `\n[retry ${attempt + 1}/${retries}]\n` } as const
      }
    }
  }
  yield { type: 'error', content: lastError?.message || 'Stream failed' } as const
}

export function mockStreamChat(messages: CoreMessage[]) {
  const last = messages[messages.length - 1]?.content || ''
  const response = generateMockResponse(last)

  return async function* () {
    for (const word of response.split(' ')) {
      await new Promise(r => setTimeout(r, 50 + Math.random() * 50))
      yield { type: 'text', content: word + ' ' } as const
    }
    yield { type: 'done' } as const
  }
}

function generateMockResponse(prompt: string): string {
  const lower = prompt.toLowerCase()
  if (lower.includes('create') || lower.includes('make') || lower.includes('build')) {
    return `I'll help you build that! Let me start by creating the project structure.

I'll set up the files you need. Here's what I'm planning:

1. Creating the main application file
2. Adding component structure
3. Setting up styles

Let me write the code now.

\`\`\`typescript
// main.ts
import { createApp } from './app'
const app = createApp()
app.listen(3000, () => console.log('Server running'))
\`\`\`

\`\`\`tsx
// App.tsx
export function App() {
  return <div className="app">
    <h1>Hello from Devonz!</h1>
  </div>
}
\`\`\`

The project is ready. You can see the preview on the right. What would you like to add next?`
  }
  if (lower.includes('fix') || lower.includes('bug') || lower.includes('error')) {
    return `I can see the issue. Let me fix that for you.

Looking at the code, I notice the problem is in the event handler. The function isn't properly bound to the component context.

Here's the fix:

\`\`\`typescript
// Before
const handleClick = () => {
  this.setState({ count: this.state.count + 1 })
}

// After
const handleClick = () => {
  setCount(prev => prev + 1)
}
\`\`\`

This should resolve the issue. Let me know if you encounter any other errors!`
  }
  return `I understand what you're asking. Let me work on that.

Based on your requirements, here's what I'm thinking:

\`\`\`typescript
interface Config {
  theme: 'dark' | 'light'
  language: string
  features: string[]
}

const config: Config = {
  theme: 'dark',
  language: 'typescript',
  features: ['chat', 'editor', 'preview'],
}
\`\`\`

Does this look right to you? I can adjust the implementation based on your feedback.`
}
