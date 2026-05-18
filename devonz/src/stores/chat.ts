import { atom, map } from 'nanostores'
import type { ChatMessage, AgentPhase, AgentMode } from '@shared/types'

export const $messages = atom<ChatMessage[]>([])
export const $isStreaming = atom(false)
export const $agentMode = atom<AgentMode>('normal')
export const $currentPhase = atom<AgentPhase | null>(null)
export const $streamError = atom<string | null>(null)

export function addMessage(msg: ChatMessage) {
  $messages.set([...$messages.get(), msg])
}

export function updateLastMessage(content: string) {
  const msgs = $messages.get()
  const last = msgs[msgs.length - 1]
  if (last && last.role === 'assistant') {
    msgs[msgs.length - 1] = { ...last, content }
    $messages.set([...msgs])
  }
}

export function clearMessages() {
  $messages.set([])
  $currentPhase.set(null)
  $streamError.set(null)
}
