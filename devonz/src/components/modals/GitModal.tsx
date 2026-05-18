import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'
import { Button } from '../ui/button'
import { Separator } from '../ui/separator'

interface GitModalProps {
  open: boolean
  onClose: () => void
}

export function GitModal({ open, onClose }: GitModalProps) {
  const [commitMessage, setCommitMessage] = useState('')
  const [status, setStatus] = useState('idle')

  const handleCommit = async () => {
    setStatus('committing')
    await new Promise(r => setTimeout(r, 1000))
    setStatus('success')
    setTimeout(() => {
      setStatus('idle')
      setCommitMessage('')
      onClose()
    }, 1500)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Git</DialogTitle>
          <DialogDescription>Commit and push changes</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Mock status */}
          <div className="panel p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-secondary">Branch</span>
              <span className="text-primary font-mono">main</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-secondary">Changes</span>
              <span className="text-orange font-mono">2</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-secondary">Staged</span>
              <span className="text-green font-mono">1</span>
            </div>
          </div>

          <Separator />

          <div>
            <label className="text-sm text-secondary block mb-2">Commit Message</label>
            <input
              className="input"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="Describe your changes..."
              disabled={status !== 'idle'}
            />
          </div>

          <div className="flex gap-2 md:flex-col">
            <Button variant="secondary" onClick={onClose} disabled={status !== 'idle'} className="md:w-full">
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCommit}
              disabled={!commitMessage.trim() || status !== 'idle'}
              className="md:w-full"
            >
              {status === 'committing' ? 'Committing...' :
               status === 'success' ? 'Committed!' :
               'Commit & Push'}
            </Button>
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="text-xs">
              GitHub
            </Button>
            <Button variant="ghost" size="sm" className="text-xs">
              GitLab
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
