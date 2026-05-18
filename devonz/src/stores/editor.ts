import { atom, map } from 'nanostores'

export interface EditorTab {
  path: string
  name: string
  content: string
  dirty: boolean
  language: string
}

export const $tabs = atom<EditorTab[]>([])
export const $activeTabPath = atom<string | null>(null)
export const $aiSuggestion = atom<string | null>(null)

export function openTab(path: string, name: string, content = '', language = '') {
  const tabs = $tabs.get()
  const existing = tabs.find(t => t.path === path)
  if (existing) {
    $activeTabPath.set(path)
    return
  }
  $tabs.set([...tabs, { path, name, content, dirty: false, language }])
  $activeTabPath.set(path)
}

export function closeTab(path: string) {
  let tabs = $tabs.get()
  const idx = tabs.findIndex(t => t.path === path)
  if (idx === -1) return
  tabs = tabs.filter(t => t.path !== path)
  $tabs.set(tabs)
  if ($activeTabPath.get() === path) {
    $activeTabPath.set(tabs[idx]?.path || tabs[idx - 1]?.path || null)
  }
}

export function updateTabContent(path: string, content: string) {
  const tabs = $tabs.get().map(t =>
    t.path === path ? { ...t, content, dirty: true } : t
  )
  $tabs.set(tabs)
}

export function markTabClean(path: string) {
  const tabs = $tabs.get().map(t =>
    t.path === path ? { ...t, dirty: false } : t
  )
  $tabs.set(tabs)
}
