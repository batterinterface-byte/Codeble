import { useCallback, useRef } from 'react'
import { useStore } from '@nanostores/react'
import { $messages, $isStreaming, $currentPhase, $streamError, $agentMode, addMessage, updateLastMessage, clearMessages } from '../stores/chat'
import { $settings } from '../stores/settings'
import { api } from '../lib/api'
import type { ChatMessage, StreamChunk } from '@shared/types'

export function useStreamChat() {
  const messages = useStore($messages)
  const isStreaming = useStore($isStreaming)
  const currentPhase = useStore($currentPhase)
  const streamError = useStore($streamError)
  const agentMode = useStore($agentMode)
  const abortRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(async (content: string) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      createdAt: Date.now(),
    }
    addMessage(userMsg)

    const assistantMsg: ChatMessage = {
      id: `msg-${Date.now() + 1}`,
      role: 'assistant',
      content: '',
      createdAt: Date.now(),
    }
    addMessage(assistantMsg)

    $isStreaming.set(true)
    $streamError.set(null)
    $currentPhase.set(null)

    const abort = new AbortController()
    abortRef.current = abort

    try {
      const settings = $settings.get()
      const allMessages = $messages.get().map(m => ({ role: m.role, content: m.content }))

      const endpoint = agentMode === 'agent' ? api.chat.agent : api.chat.send
      const resp = await endpoint(allMessages, {
        provider: settings.llmProvider,
        model: settings.llmModel,
      })

      const reader = resp.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const chunk: StreamChunk = JSON.parse(line.slice(6))
            switch (chunk.type) {
              case 'text':
                updateLastMessage(
                  ($messages.get().find(m => m.id === assistantMsg.id)?.content || '') + (chunk.content || '')
                )
                break
              case 'agent_phase':
                if (chunk.phase) $currentPhase.set(chunk.phase)
                break
              case 'error':
                $streamError.set(chunk.content || 'Unknown error')
                break
              case 'done':
                break
            }
          } catch { /* skip parse errors */ }
        }
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        $streamError.set(e.message)
      }
    } finally {
      $isStreaming.set(false)
      abortRef.current = null
    }
  }, [agentMode])

  const cancelStream = useCallback(() => {
    abortRef.current?.abort()
    $isStreaming.set(false)
  }, [])

  const clear = useCallback(() => {
    clearMessages()
  }, [])

  return {
    messages,
    isStreaming,
    currentPhase,
    streamError,
    agentMode,
    sendMessage,
    cancelStream,
    clear,
  }
}
