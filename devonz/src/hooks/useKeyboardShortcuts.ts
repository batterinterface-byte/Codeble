import { useEffect } from 'react'
import { useStore } from '@nanostores/react'
import { $shortcuts } from '../stores/shortcuts'
import { $showSearch } from '../stores/search'
import { $showTerminal, $showPreview } from '../stores/workspace'
import { $activeTabPath, closeTab } from '../stores/editor'

export function useKeyboardShortcuts() {
  const shortcuts = useStore($shortcuts)
  const activeTab = useStore($activeTabPath)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      for (const s of shortcuts) {
        const ctrl = s.ctrl || s.meta
        const matchCtrl = ctrl ? (e.ctrlKey || e.metaKey) : !e.ctrlKey && !e.metaKey
        const matchShift = s.shift ? e.shiftKey : !e.shiftKey
        const matchAlt = s.alt ? e.altKey : !e.altKey

        if (matchCtrl && matchShift && matchAlt && e.key.toLowerCase() === s.key.toLowerCase()) {
          e.preventDefault()
          handleAction(s.action)
          return
        }
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [shortcuts, activeTab])
}

function handleAction(action: string) {
  switch (action) {
    case 'palette:open':
      window.dispatchEvent(new CustomEvent('palette:toggle'))
      break
    case 'search:open':
      $showSearch.set(!$showSearch.get())
      break
    case 'preview:toggle':
      $showPreview.set(!$showPreview.get())
      break
    case 'terminal:toggle':
      $showTerminal.set(!$showTerminal.get())
      break
    case 'tab:close':
      if ($activeTabPath.get()) {
        closeTab($activeTabPath.get()!)
      }
      break
    case 'file:save':
      window.dispatchEvent(new CustomEvent('file:save'))
      break
    case 'ai:complete':
      window.dispatchEvent(new CustomEvent('ai:complete'))
      break
    case 'editor:format':
      window.dispatchEvent(new CustomEvent('editor:format'))
      break
  }
}
