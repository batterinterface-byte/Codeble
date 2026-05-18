import { useCallback, useRef, useEffect, useState } from 'react'
import { useStore } from '@nanostores/react'
import { $tabs, $activeTabPath, openTab, closeTab, updateTabContent, markTabClean } from '../../stores/editor'
import { $aiSuggestion } from '../../stores/editor'
import { useAICompletion } from '../../hooks/useAICompletion'
import { api } from '../../lib/api'

export function EditorPanel() {
  const tabs = useStore($tabs)
  const activePath = useStore($activeTabPath)
  const aiSuggestion = useStore($aiSuggestion)
  const editorRef = useRef<HTMLPreElement>(null)
  const activeTab = tabs.find(t => t.path === activePath)
  useAICompletion()

  const handleTabClose = (e: React.MouseEvent, path: string) => {
    e.stopPropagation()
    closeTab(path)
  }

  const handleSave = async () => {
    if (!activePath || !activeTab) return
    await api.files.write(activePath.replace(/^\/+/, ''), activeTab.content)
    markTabClean(activePath)
    window.dispatchEvent(new CustomEvent('file:saved', { detail: { path: activePath } }))
  }

  useEffect(() => {
    const handler = () => handleSave()
    window.addEventListener('file:save', handler)
    return () => window.removeEventListener('file:save', handler)
  }, [activePath, activeTab])

  const handleEditorInput = (e: React.FormEvent<HTMLPreElement>) => {
    const content = (e.target as HTMLElement).innerText || ''
    if (activePath) {
      updateTabContent(activePath, content)
    }
  }

  const fileExt = activeTab?.name.split('.').pop() || ''

  return (
    <div className="h-full flex flex-col bg-deep">
      {/* Tabs bar */}
      <div className="flex items-center border-b border-border/50 bg-surface/30 overflow-x-auto flex-shrink-0">
        {tabs.length === 0 && (
          <div className="px-4 py-2 text-xs text-muted">No files open</div>
        )}
        {tabs.map((tab) => (
          <div
            key={tab.path}
            onClick={() => $activeTabPath.set(tab.path)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs cursor-pointer border-r border-border/30 transition-colors whitespace-nowrap ${
              tab.path === activePath
                ? 'bg-deep text-primary border-t-2 border-t-accent'
                : 'bg-transparent text-secondary hover:bg-hover/50'
            }`}
          >
            {tab.dirty && <span className="w-1.5 h-1.5 rounded-full bg-orange flex-shrink-0" />}
            <span>{tab.name}</span>
            <button
              onClick={(e) => handleTabClose(e, tab.path)}
              className="ml-1 text-xs text-muted hover:text-primary transition-colors bg-transparent border-none cursor-pointer p-0.5 rounded hover:bg-surface"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Editor content */}
      <div className="flex-1 overflow-auto relative">
        {activeTab ? (
          <>
            <pre
              ref={editorRef}
              className="h-full p-5 text-sm leading-relaxed font-mono text-primary whitespace-pre-wrap break-all outline-none"
              contentEditable
              suppressContentEditableWarning
              onInput={handleEditorInput}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                  e.preventDefault()
                  handleSave()
                }
              }}
            >
              {activeTab.content || ' '}
            </pre>
            {aiSuggestion && (
              <div className="absolute bottom-4 right-4 left-4 px-4 py-2 rounded-xl bg-purple/10 border border-purple/20 text-sm text-purple/70 font-mono animate-slide-up">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple animate-pulse" />
                  {aiSuggestion}
                </div>
              </div>
            )}
            {activePath && !activeTab.content && (
              <div className="absolute inset-0 flex items-center justify-center text-secondary">
                <p className="text-sm">Empty file — start typing or paste code</p>
              </div>
            )}
          </>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-secondary max-w-md">
              <div className="text-5xl mb-4 opacity-20">{'{ }'}</div>
              <p className="text-base font-medium text-primary/80 mb-2">Code Editor</p>
              <p className="text-sm text-muted">
                Open a file from the explorer or ask the AI to generate code.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Status bar */}
      {activeTab && (
        <div className="flex items-center justify-between px-4 py-1 border-t border-border/30 bg-surface/20 flex-shrink-0 text-xs text-muted">
          <div className="flex items-center gap-3">
            <span className="font-mono">{activeTab.name}</span>
            <span>{activeTab.language || fileExt}</span>
            {activeTab.dirty && <span className="text-orange">unsaved</span>}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="px-2 py-0.5 rounded text-xs bg-accent/10 text-accent hover:bg-accent/20 transition-colors cursor-pointer border-none"
            >
              Save
            </button>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('ai:complete'))}
              className="px-2 py-0.5 rounded text-xs bg-purple/10 text-purple hover:bg-purple/20 transition-colors cursor-pointer border-none"
            >
              AI ✨
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
