import { useStore } from '@nanostores/react'
import { $mcpServers, updateMCPServer } from '../../stores/mcp'
import { Sheet, SheetContent, SheetClose } from '../ui/sheet'
import { Button } from '../ui/button'
import { Separator } from '../ui/separator'

interface MCPStatusProps {
  open: boolean
  onClose: () => void
}

export function MCPStatus({ open, onClose }: MCPStatusProps) {
  const servers = useStore($mcpServers)

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="p-0 flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 bg-gradient-header">
          <h2 className="text-base font-semibold">
            <span className="bg-gradient-accent bg-clip-text text-transparent">MCP Servers</span>
          </h2>
          <SheetClose asChild>
            <Button variant="ghost" size="sm">Close</Button>
          </SheetClose>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {servers.map((server) => {
            const isOpenCode = server.name.toLowerCase().includes('opencode')
            return (
              <div key={server.id} className={`rounded-xl border ${isOpenCode ? 'border-purple/30 bg-purple/5' : 'border-border bg-panel'} p-4 space-y-3 transition-all hover:shadow-md`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        server.status === 'connected' ? 'bg-green shadow-green' :
                        server.status === 'error' ? 'bg-red' : 'bg-orange'
                      }`}
                    />
                    <div>
                      <span className="text-sm font-medium text-primary">{server.name}</span>
                      {isOpenCode && (
                        <span className="ml-2 px-1.5 py-0.5 rounded text-xs bg-purple/20 text-purple font-mono">AI</span>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${
                    server.transport === 'stdio' ? 'bg-green/10 text-green' :
                    server.transport === 'sse' ? 'bg-blue/10 text-blue' : 'bg-purple/10 text-purple'
                  }`}>
                    {server.transport}
                  </span>
                </div>

                {isOpenCode && (
                  <div className="bg-deep/50 rounded-lg p-3 border border-purple/10">
                    <p className="text-xs text-purple/80 mb-2 font-medium">OpenCode Agent</p>
                    <p className="text-xs text-secondary/70">
                      OpenCode is available as an AI coding agent. Use it to generate, review, and refactor code through natural language.
                    </p>
                    <div className="flex gap-2 mt-2">
                      <span className="badge bg-green/10 text-green">generate</span>
                      <span className="badge bg-accent/10 text-accent">review</span>
                      <span className="badge bg-orange/10 text-orange">refactor</span>
                      <span className="badge bg-purple/10 text-purple">debug</span>
                    </div>
                  </div>
                )}

                <Separator />

                <div>
                  <span className="text-xs text-secondary font-medium uppercase tracking-wider">Tools</span>
                  <div className="mt-2 space-y-1.5">
                    {server.tools.map((tool) => (
                      <div key={tool.name} className="flex items-center gap-2.5 text-xs px-2 py-1.5 rounded-md hover:bg-hover/50 transition-colors">
                        <span className="text-accent font-mono font-medium">{tool.name}</span>
                        <span className="text-muted truncate">{tool.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="p-4 border-t border-border/50 bg-surface/30">
          <p className="text-xs text-muted text-center">
            MCP servers provide tools for the AI agent to interact with your project.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
