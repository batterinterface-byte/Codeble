import { useStore } from '@nanostores/react'
import { $showDiff, $diffContent } from '../../stores/workspace'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'
import { Button } from '../ui/button'

export function DiffModal() {
  const show = useStore($showDiff)
  const content = useStore($diffContent)

  if (!show) return null

  return (
    <Dialog open={show} onOpenChange={(o) => { if (!o) $showDiff.set(false) }}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Changes</DialogTitle>
          <DialogDescription>Review the proposed file changes</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-auto bg-deep rounded-lg p-4 font-mono text-xs leading-relaxed">
          <pre className="whitespace-pre-wrap text-primary/90">
            {content || 'No changes to display.'}
          </pre>
        </div>
        <div className="flex justify-end gap-2 mt-3">
          <Button variant="ghost" onClick={() => $showDiff.set(false)}>Close</Button>
          <Button variant="primary">Apply Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
