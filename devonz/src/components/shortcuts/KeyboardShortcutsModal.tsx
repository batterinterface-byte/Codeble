import { useEffect, useState } from 'react'
import { useStore } from '@nanostores/react'
import { $shortcuts, $showShortcuts } from '../../stores/shortcuts'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'

export function KeyboardShortcutsModal() {
  const show = useStore($showShortcuts)
  const shortcuts = useStore($shortcuts)

  useEffect(() => {
    const handler = () => $showShortcuts.set(true)
    window.addEventListener('shortcuts:open', handler)
    return () => window.removeEventListener('shortcuts:open', handler)
  }, [])

  return (
    <Dialog open={show} onOpenChange={(o) => { if (!o) $showShortcuts.set(false) }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>All available keyboard shortcuts</DialogDescription>
        </DialogHeader>
        <div className="space-y-1 max-h-[400px] overflow-y-auto">
          {shortcuts.map((s) => (
            <div key={s.id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-hover/50 transition-colors">
              <div>
                <span className="text-sm text-primary">{s.label}</span>
                <span className="text-xs text-muted ml-2">{s.description}</span>
              </div>
              <kbd className="px-2 py-1 rounded-md bg-surface border border-border text-xs text-secondary font-mono">
                {s.label}
              </kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
