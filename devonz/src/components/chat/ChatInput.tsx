import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { Button } from '../ui/button'

interface ChatInputProps {
  onSend: (content: string) => void
  onCancel: () => void
  isStreaming: boolean
}

export function ChatInput({ onSend, onCancel, isStreaming }: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!isStreaming && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isStreaming])

  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed || isStreaming) return
    onSend(trimmed)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`
    }
  }

  return (
    <div className="flex gap-2 items-end">
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Describe what you want to build..."
          rows={1}
          className="w-full bg-deep border border-border/60 rounded-xl px-4 py-3 pr-12 text-sm text-primary placeholder:text-secondary/50 resize-none focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all min-h-[44px] max-h-[150px] leading-relaxed"
          disabled={isStreaming}
        />
      </div>
      {isStreaming ? (
        <Button
          variant="danger"
          size="md"
          onClick={onCancel}
          className="h-11 px-4 rounded-xl whitespace-nowrap"
        >
          ■ Stop
        </Button>
      ) : (
        <Button
          variant="primary"
          size="md"
          onClick={handleSend}
          disabled={!value.trim()}
          className="h-11 px-5 rounded-xl whitespace-nowrap bg-gradient-accent"
        >
          Send →
        </Button>
      )}
    </div>
  )
}
