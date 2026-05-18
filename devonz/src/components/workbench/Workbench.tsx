import { useEffect, useState, lazy, Suspense, useCallback } from 'react'
import { useStore } from '@nanostores/react'
import { $projectId, $showPreview, $showTerminal, $showDiff } from '../../stores/workspace'
import { loadSettings } from '../../stores/settings'
import { $showTemplatePicker } from '../../stores/templates'
import { Header } from './Header'
import { ChatPanel } from '../chat/ChatPanel'
import { FileExplorer } from '../explorer/FileExplorer'
import { DiffModal } from '../modals/DiffModal'
import { SettingsSidebar } from '../settings/SettingsSidebar'
import { MCPStatus } from '../mcp/MCPStatus'
import { exportProject, importProject } from '../../lib/export'
import { toast } from 'sonner'

const EditorPanel = lazy(() => import('./EditorPanel').then(m => ({ default: m.EditorPanel })))
const PreviewPanel = lazy(() => import('./PreviewPanel').then(m => ({ default: m.PreviewPanel })))
const TerminalPanel = lazy(() => import('./TerminalPanel').then(m => ({ default: m.TerminalPanel })))

export function Workbench() {
  const projectId = useStore($projectId)
  const showPreview = useStore($showPreview)
  const showTerminal = useStore($showTerminal)
  const showDiff = useStore($showDiff)

  const [showSettings, setShowSettings] = useState(false)
  const [showMCP, setShowMCP] = useState(false)
  const [showExplorer, setShowExplorer] = useState(true)
  const [chatOpen, setChatOpen] = useState(true)
  const [codePanelSize, setCodePanelSize] = useState(50)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    loadSettings()
    const onResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    const startX = e.clientX
    const startSize = codePanelSize
    const container = (e.target as HTMLElement).parentElement
    if (!container) return
    const onMove = (ev: MouseEvent) => {
      const delta = ev.clientX - startX
      const pct = (delta / container.offsetWidth) * 100
      setCodePanelSize(Math.max(20, Math.min(80, startSize + pct)))
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [codePanelSize])

  const handleExport = async () => {
    if (!projectId) { toast.error('No project open'); return }
    const ok = await exportProject(projectId, 'project')
    if (ok) toast.success('Project exported!')
    else toast.error('Export failed')
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.zip'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      toast.info('Importing project...')
      const result = await importProject(file, file.name.replace('.zip', ''))
      if (result) toast.success('Project imported!')
      else toast.error('Import failed')
    }
    input.click()
  }

  return (
    <div className="h-full w-full flex flex-col bg-deep overflow-hidden">
      <Header
        onOpenSettings={() => setShowSettings(true)}
        onOpenMCP={() => setShowMCP(true)}
        onToggleChat={() => setChatOpen(!chatOpen)}
        onToggleExplorer={() => setShowExplorer(!showExplorer)}
        onExport={handleExport}
        onImport={handleImport}
        onNewProject={() => $showTemplatePicker.set(true)}
        chatOpen={chatOpen}
        explorerOpen={showExplorer}
        isMobile={isMobile}
      />

      <div className="flex-1 flex overflow-hidden md:flex-col">
        {/* Chat Panel */}
        {chatOpen && (
          <>
            <div className={`flex-shrink-0 border-r border-border/50 bg-panel flex flex-col ${
              isMobile
                ? 'fixed inset-0 z-50 animate-fade-in'
                : 'w-[380px] min-w-[320px] max-w-[600px]'
            }`}>
              <ChatPanel onClose={isMobile ? () => setChatOpen(false) : undefined} />
            </div>
            {isMobile && <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setChatOpen(false)} />}
          </>
        )}

        {/* Code/Preview area */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="flex-1 flex overflow-hidden">
            {/* File Explorer */}
            {showExplorer && !isMobile && (
              <div className="w-56 flex-shrink-0 border-r border-border/50 bg-panel/80 flex flex-col">
                <FileExplorer />
              </div>
            )}

            {/* Editor + Preview */}
            <div
              className="flex-1 flex overflow-hidden"
              style={{ flexDirection: (showPreview && !isMobile) ? 'row' : 'column' }}
            >
              <div
                className="overflow-hidden"
                style={{
                  flexBasis: (showPreview && !isMobile) ? `${codePanelSize}%` : '100%',
                  minWidth: (showPreview && !isMobile) ? '300px' : '100%',
                }}
              >
                <Suspense fallback={<div className="h-full flex items-center justify-center text-secondary text-sm">Loading editor...</div>}>
                  <EditorPanel />
                </Suspense>
              </div>

              {showPreview && !isMobile && (
                <>
                  <div
                    className="w-1 bg-border/30 cursor-col-resize hover:bg-accent/50 transition-colors flex-shrink-0"
                    onMouseDown={handleResizeStart}
                  />
                  <div className="flex-1 min-w-[300px] overflow-hidden">
                    <Suspense fallback={<div className="h-full flex items-center justify-center text-secondary text-sm">Loading preview...</div>}>
                      <PreviewPanel />
                    </Suspense>
                  </div>
                </>
              )}
              {showPreview && isMobile && (
                <div className="h-1/2 border-t border-border overflow-hidden">
                  <Suspense fallback={<div className="h-full flex items-center justify-center text-secondary text-sm">Loading preview...</div>}>
                    <PreviewPanel />
                  </Suspense>
                </div>
              )}
            </div>
          </div>

          {showTerminal && (
            <div className="h-[220px] min-h-[120px] flex-shrink-0 border-t border-border/50">
              <Suspense fallback={<div className="h-full flex items-center justify-center text-secondary text-sm">Loading terminal...</div>}>
                <TerminalPanel />
              </Suspense>
            </div>
          )}
        </div>
      </div>

      {showDiff && <DiffModal />}
      <SettingsSidebar open={showSettings} onClose={() => setShowSettings(false)} />
      <MCPStatus open={showMCP} onClose={() => setShowMCP(false)} />
    </div>
  )
}
