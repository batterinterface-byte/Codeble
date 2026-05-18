import { useEffect, useRef, useCallback } from 'react'
import { useStore } from '@nanostores/react'
import { $activeTabPath, $tabs, $aiSuggestion } from '../stores/editor'
import { $settings } from '../stores/settings'

export function useAICompletion() {
  const activePath = useStore($activeTabPath)
  const tabs = useStore($tabs)
  const settings = useStore($settings)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const requestCompletion = useCallback(async (code: string, lang: string) => {
    try {
      const resp = await fetch('/api/chat/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language: lang,
          provider: settings.llmProvider,
          model: settings.llmModel,
        }),
      })
      if (resp.ok) {
        const data = await resp.json()
        $aiSuggestion.set(data.completion || null)
      }
    } catch {
      // If no server endpoint, generate a simple mock completion
      const lines = code.split('\n')
      const lastLine = lines[lines.length - 1] || ''
      if (lastLine.trim()) {
        $aiSuggestion.set(`// AI suggestion for "${lastLine.trim()}"`)
      }
    }
  }, [settings.llmProvider, settings.llmModel])

  useEffect(() => {
    const handler = () => {
      const tab = tabs.find(t => t.path === activePath)
      if (tab?.content) {
        requestCompletion(tab.content, tab.language)
      }
    }
    window.addEventListener('ai:complete', handler)
    return () => window.removeEventListener('ai:complete', handler)
  }, [activePath, tabs, requestCompletion])

  // Auto-completion on pause (debounced)
  useEffect(() => {
    if (!activePath) return
    const tab = tabs.find(t => t.path === activePath)
    if (!tab?.content) return

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      requestCompletion(tab.content, tab.language)
    }, 3000)
  }, [tabs, activePath, requestCompletion])

  return { requestCompletion }
}
