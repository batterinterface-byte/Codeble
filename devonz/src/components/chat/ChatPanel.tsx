import { useRef, useEffect } from 'react'
import { useStore } from '@nanostores/react'
import { $messages, $isStreaming, $currentPhase, $streamError } from '../../stores/chat'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { useStreamChat } from '../../hooks/useStreamChat'

interface ChatPanelProps {
  onClose?: () => void
}

export function ChatPanel({ onClose }: ChatPanelProps) {
  const messages = useStore($messages)
  const isStreaming = useStore($isStreaming)
  const currentPhase = useStore($currentPhase)
  const streamError = useStore($streamError)
  const { sendMessage, cancelStream, clear } = useStreamChat()
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages, currentPhase])

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0 border-b border-border/50">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent animate-breathe" />
          <span className="text-sm font-semibold text-primary">Chat</span>
          <span className="text-xs text-muted font-mono">devonz</span>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={clear}
              className="text-xs text-secondary/60 hover:text-secondary transition-colors cursor-pointer bg-transparent border-none"
            >
              Clear
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="text-xs text-secondary/60 hover:text-primary transition-colors cursor-pointer bg-transparent border-none md:inline hidden"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 content-visibility-auto">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-12 animate-fade-in">
            <div className="text-4xl mb-2 opacity-30">◆</div>
            <p className="text-base font-semibold text-primary/80">Welcome to Devonz</p>
            <p className="text-sm text-secondary max-w-xs">
              Describe what you want to build in plain English, and I'll generate the code.
            </p>
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {['Create a React app', 'Build an API', 'Fix this bug', 'Add a feature'].map((hint) => (
                <button
                  key={hint}
                  onClick={() => sendMessage(hint)}
                  className="px-3 py-1.5 rounded-full text-xs bg-surface/50 border border-border/50 text-secondary hover:bg-hover hover:text-primary hover:border-accent/30 transition-all cursor-pointer"
                >
                  {hint}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <ChatMessage key={msg.id} message={msg} index={i} />
        ))}

        {currentPhase && (
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-purple/10 border border-purple/20 animate-slide-up">
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-purple animate-pulse" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-purple animate-pulse" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-purple animate-pulse" style={{ animationDelay: '300ms' }} />
            </div>
            <div>
              <span className="text-sm font-medium text-purple">{currentPhase.label}</span>
              {currentPhase.detail && (
                <span className="text-xs text-purple/60 ml-2">— {currentPhase.detail}</span>
              )}
            </div>
          </div>
        )}

        {streamError && (
          <div className="px-4 py-2.5 rounded-xl bg-red/10 border border-red/20 text-red text-sm animate-fade-in flex items-center gap-2">
            <span>⚠</span>
            <span>{streamError}</span>
          </div>
        )}
      </div>

      <div className="flex-shrink-0 p-3 border-t border-border/50 bg-surface/30">
        <ChatInput
          onSend={sendMessage}
          onCancel={cancelStream}
          isStreaming={isStreaming}
        />
      </div>
    </div>
  )
}
