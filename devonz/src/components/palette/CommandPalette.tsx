import { useEffect, useState, useRef, useCallback } from 'react'
import { useStore } from '@nanostores/react'
import { $shortcuts } from '../../stores/shortcuts'
import { $showSearch } from '../../stores/search'
import { $showTerminal, $showPreview } from '../../stores/workspace'
import { $showTemplatePicker } from '../../stores/templates'
import { $showDiff } from '../../stores/workspace'

interface PaletteAction {
  id: string
  label: string
  description: string
  icon: string
  action: () => void
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const shortcuts = useStore($shortcuts)

  useEffect(() => {
    const handler = () => setOpen(prev => !prev)
    window.addEventListener('palette:toggle', handler)
    return () => window.removeEventListener('palette:toggle', handler)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
    }
  }, [open])

  const actions: PaletteAction[] = [
    { id: 'search', label: 'Search files', description: 'Search across project files', icon: '🔍', action: () => { $showSearch.set(true); setOpen(false) } },
    { id: 'toggle-preview', label: 'Toggle Preview', description: 'Show/hide preview panel', icon: '👁', action: () => { $showPreview.set(!$showPreview.get()); setOpen(false) } },
    { id: 'toggle-terminal', label: 'Toggle Terminal', description: 'Show/hide terminal', icon: '💻', action: () => { $showTerminal.set(!$showTerminal.get()); setOpen(false) } },
    { id: 'template', label: 'New Project from Template', description: 'Create a project from a starter template', icon: '📦', action: () => { $showTemplatePicker.set(true); setOpen(false) } },
    { id: 'diff', label: 'View Changes', description: 'Show staged changes diff', icon: '📝', action: () => { $showDiff.set(!$showDiff.get()); setOpen(false) } },
    { id: 'shortcuts', label: 'Keyboard Shortcuts', description: 'View all keyboard shortcuts', icon: '⌨', action: () => { window.dispatchEvent(new CustomEvent('shortcuts:open')); setOpen(false) } },
    { id: 'format', label: 'Format Code', description: 'Auto-format current file', icon: '✨', action: () => { window.dispatchEvent(new CustomEvent('editor:format')); setOpen(false) } },
    { id: 'ai-complete', label: 'AI Complete', description: 'Trigger AI code completion', icon: '🤖', action: () => { window.dispatchEvent(new CustomEvent('ai:complete')); setOpen(false) } },
  ]

  const filtered = query
    ? actions.filter(a =>
        a.label.toLowerCase().includes(query.toLowerCase()) ||
        a.description.toLowerCase().includes(query.toLowerCase())
      )
    : actions

  const handleSelect = useCallback((action: PaletteAction) => {
    action.action()
    setOpen(false)
  }, [])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={() => setOpen(false)}>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xl bg-panel border border-border rounded-2xl shadow-2xl overflow-hidden animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
          <span className="text-secondary text-sm">⌘</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type a command..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-primary placeholder:text-secondary/50"
          />
          <span className="text-xs text-muted">ESC</span>
        </div>
        <div className="max-h-[300px] overflow-y-auto py-2">
          {filtered.map((action) => (
            <button
              key={action.id}
              onClick={() => handleSelect(action)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-hover transition-colors cursor-pointer border-none bg-transparent text-left"
            >
              <span className="text-base flex-shrink-0">{action.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-primary font-medium">{action.label}</div>
                <div className="text-xs text-muted truncate">{action.description}</div>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-muted">No commands found</div>
          )}
        </div>
      </div>
    </div>
  )
}
