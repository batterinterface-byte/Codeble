import { atom } from 'nanostores'

export interface Shortcut {
  id: string
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean
  label: string
  description: string
  action: string
}

export const $shortcuts = atom<Shortcut[]>([
  { id: 'cmd-palette', key: 'k', meta: true, label: 'Cmd+K', description: 'Open command palette', action: 'palette:open' },
  { id: 'search', key: 'f', ctrl: true, shift: true, label: 'Ctrl+Shift+F', description: 'Search in project', action: 'search:open' },
  { id: 'toggle-preview', key: 'p', ctrl: true, label: 'Ctrl+P', description: 'Toggle preview panel', action: 'preview:toggle' },
  { id: 'toggle-terminal', key: '`', ctrl: true, label: 'Ctrl+`', description: 'Toggle terminal', action: 'terminal:toggle' },
  { id: 'save', key: 's', ctrl: true, label: 'Ctrl+S', description: 'Save current file', action: 'file:save' },
  { id: 'new-file', key: 'n', ctrl: true, label: 'Ctrl+N', description: 'Create new file', action: 'file:new' },
  { id: 'close-tab', key: 'w', ctrl: true, label: 'Ctrl+W', description: 'Close current tab', action: 'tab:close' },
  { id: 'format', key: 'f', ctrl: true, shift: true, alt: true, label: 'Ctrl+Shift+Alt+F', description: 'Format code', action: 'editor:format' },
  { id: 'ai-complete', key: 'Space', alt: true, label: 'Alt+Space', description: 'Trigger AI completion', action: 'ai:complete' },
])

export const $showShortcuts = atom(false)
