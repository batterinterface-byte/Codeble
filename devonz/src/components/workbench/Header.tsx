import { useState, useRef, useEffect } from 'react'
import { useStore } from '@nanostores/react'
import { $projectName, $showPreview, $showTerminal, $gitStatus } from '../../stores/workspace'
import { $agentMode } from '../../stores/chat'
import { UserMenu } from '../auth/UserMenu'

interface HeaderProps {
  onOpenSettings: () => void
  onOpenMCP: () => void
  onToggleChat: () => void
  onToggleExplorer: () => void
  onExport: () => void
  onImport: () => void
  onNewProject: () => void
  chatOpen: boolean
  explorerOpen: boolean
  isMobile: boolean
}

export function Header({
  onOpenSettings, onOpenMCP, onToggleChat, onToggleExplorer,
  onExport, onImport, onNewProject,
  chatOpen, explorerOpen, isMobile,
}: HeaderProps) {
  const projectName = useStore($projectName)
  const showPreview = useStore($showPreview)
  const showTerminal = useStore($showTerminal)
  const agentMode = useStore($agentMode)
  const gitStatus = useStore($gitStatus)
  const [showMore, setShowMore] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setShowMore(false)
      }
    }
    if (showMore) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showMore])

  const moreButtons = (
    <div className="flex flex-col gap-1 p-1">
      <button onClick={() => { onNewProject(); setShowMore(false) }} className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-hover transition-colors cursor-pointer bg-transparent border-none text-secondary hover:text-primary">
        + New
      </button>
      <button onClick={() => { $agentMode.set(agentMode === 'agent' ? 'normal' : 'agent'); setShowMore(false) }} className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-hover transition-colors cursor-pointer bg-transparent border-none text-secondary hover:text-primary">
        {agentMode === 'agent' ? '🤖 Agent' : '💬 Chat'}
      </button>
      <button onClick={() => { $showPreview.set(!showPreview); setShowMore(false) }} className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-hover transition-colors cursor-pointer bg-transparent border-none text-secondary hover:text-primary">
        {showPreview ? 'Hide Preview' : 'Show Preview'}
      </button>
      <button onClick={() => { $showTerminal.set(!showTerminal); setShowMore(false) }} className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-hover transition-colors cursor-pointer bg-transparent border-none text-secondary hover:text-primary">
        Terminal
      </button>
      <button onClick={() => { onExport(); setShowMore(false) }} className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-hover transition-colors cursor-pointer bg-transparent border-none text-secondary hover:text-primary">
        Export
      </button>
      <button onClick={() => { onImport(); setShowMore(false) }} className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-hover transition-colors cursor-pointer bg-transparent border-none text-secondary hover:text-primary">
        Import
      </button>
      <button onClick={() => { onOpenMCP(); setShowMore(false) }} className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-hover transition-colors cursor-pointer bg-transparent border-none text-secondary hover:text-primary">
        MCP
      </button>
      <button onClick={() => { onOpenSettings(); setShowMore(false) }} className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-hover transition-colors cursor-pointer bg-transparent border-none text-secondary hover:text-primary">
        Settings
      </button>
    </div>
  )

  return (
    <div className="h-13 flex items-center justify-between px-4 border-b border-border/50 bg-gradient-header flex-shrink-0 gap-2 safe-top">
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onToggleChat}
          className="flex items-center gap-1.5 text-lg font-bold bg-gradient-accent bg-clip-text text-transparent hover:opacity-80 transition-opacity cursor-pointer bg-transparent border-none"
        >
          <span className="text-xl">◆</span>
          <span className="md:hidden text-sm">Devonz</span>
        </button>

        {!isMobile && (
          <button
            onClick={onToggleExplorer}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer border ${
              explorerOpen ? 'bg-accent/10 text-accent border-accent/20' : 'bg-transparent text-secondary border-transparent hover:text-primary'
            }`}
          >
            📁
          </button>
        )}

        {/* Mobile: show hamburger for file explorer */}
        {isMobile && (
          <button
            onClick={onToggleExplorer}
            className="px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer border bg-transparent text-secondary border-transparent hover:text-primary"
          >
            📁
          </button>
        )}

        {projectName && (
          <>
            <span className="text-secondary/40 text-xs">/</span>
            <span className="text-primary font-medium truncate text-sm max-w-[120px]">{projectName}</span>
          </>
        )}

        {gitStatus && (
          <div className="flex items-center gap-1.5 ml-1 text-xs text-secondary/70 bg-surface/40 px-2 py-1 rounded-full border border-border/40 md:hidden">
            <span className="w-1.5 h-1.5 rounded-full bg-green shadow-green" />
            <span>{gitStatus.branch}</span>
            {gitStatus.changes > 0 && <span className="text-orange font-medium">{gitStatus.changes}∆</span>}
            {gitStatus.staged > 0 && <span className="text-green font-medium">{gitStatus.staged}✓</span>}
          </div>
        )}
      </div>

      {/* Desktop buttons */}
      {!isMobile && (
        <div className="flex items-center gap-1">
          <button
            onClick={onNewProject}
            className="px-2.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border bg-green/10 text-green border-green/20 hover:bg-green/20"
            title="New project from template"
          >
            + New
          </button>

          <button
            onClick={() => $agentMode.set(agentMode === 'agent' ? 'normal' : 'agent')}
            className={`px-2.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border ${
              agentMode === 'agent'
                ? 'bg-purple/15 text-purple border-purple/30 shadow-purple'
                : 'bg-surface/40 text-secondary border-border/40 hover:text-primary'
            }`}
          >
            {agentMode === 'agent' ? '🤖 Agent' : '💬 Chat'}
          </button>

          <button
            onClick={() => $showPreview.set(!showPreview)}
            className={`px-2.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border ${
              showPreview ? 'bg-accent/10 text-accent border-accent/30' : 'bg-surface/40 text-secondary border-border/40 hover:text-primary'
            }`}
          >
            👁
          </button>

          <button
            onClick={() => $showTerminal.set(!showTerminal)}
            className={`px-2.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border ${
              showTerminal ? 'bg-cyan/10 text-cyan border-cyan/30' : 'bg-surface/40 text-secondary border-border/40 hover:text-primary'
            }`}
          >
            ⌨
          </button>

          <button
            onClick={onExport}
            className="px-2 py-1.5 rounded-full text-xs transition-all cursor-pointer border bg-surface/40 text-secondary border-border/40 hover:text-primary"
            title="Export project"
          >
            ⬇
          </button>

          <button
            onClick={onImport}
            className="px-2 py-1.5 rounded-full text-xs transition-all cursor-pointer border bg-surface/40 text-secondary border-border/40 hover:text-primary"
            title="Import project"
          >
            ⬆
          </button>

          <button
            onClick={onOpenMCP}
            className="px-2 py-1.5 rounded-full text-xs transition-all cursor-pointer border bg-surface/40 text-secondary border-border/40 hover:text-primary"
            title="MCP Servers"
          >
            🔌
          </button>

          <button
            onClick={onOpenSettings}
            className="px-2 py-1.5 rounded-full text-xs transition-all cursor-pointer border bg-surface/40 text-secondary border-border/40 hover:text-primary"
            title="Settings"
          >
            ⚙
          </button>

          <UserMenu />
        </div>
      )}

      {/* Mobile: minimal buttons + overflow menu */}
      {isMobile && (
        <div className="flex items-center gap-1">
          <UserMenu />

          <div className="relative" ref={moreRef}>
            <button
              onClick={() => setShowMore(!showMore)}
              className="px-2 py-1.5 rounded-full text-xs transition-all cursor-pointer border bg-surface/40 text-secondary border-border/40 hover:text-primary"
            >
              ⋯
            </button>
            {showMore && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-panel border border-border rounded-xl shadow-2xl min-w-[160px] animate-fade-in">
                {moreButtons}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
