import type { ChatMessage as ChatMessageType } from '@shared/types'

interface ChatMessageProps {
  message: ChatMessageType
  index: number
}

export function ChatMessage({ message, index }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'

  if (isSystem) {
    return (
      <div className="flex justify-center animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
        <div className="px-3 py-1.5 rounded-full bg-surface/50 border border-border/30 text-xs text-secondary/70">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-slide-up`}
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <div
        className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-gradient-chat-user border border-accent/20 shadow-accent/20'
            : 'bg-gradient-chat-agent border border-border/50'
        }`}
      >
        <div className="whitespace-pre-wrap break-words font-sans">
          {message.content ? (
            <FormattedContent content={message.content} />
          ) : (
            <span className="flex items-center gap-1.5 text-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" style={{ animationDelay: '200ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" style={{ animationDelay: '400ms' }} />
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function FormattedContent({ content }: { content: string }) {
  // Simple code block detection
  const parts = content.split(/(```\w*\n[\s\S]*?```)/g)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('```')) {
          const lines = part.split('\n')
          const lang = lines[0].replace('```', '').trim()
          const code = lines.slice(1, -1).join('\n')
          return (
            <div key={i} className="chat-code-block my-2">
              {lang && <div className="code-header">{lang}</div>}
              <pre>{code}</pre>
            </div>
          )
        }
        return <span key={i}>{part}</span>
      })}
    </>
  )
}
