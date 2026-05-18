import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'
import { Button } from '../ui/button'
import { Separator } from '../ui/separator'

interface DeployModalProps {
  open: boolean
  onClose: () => void
}

export function DeployModal({ open, onClose }: DeployModalProps) {
  const [target, setTarget] = useState<'vercel' | 'netlify' | null>(null)
  const [deploying, setDeploying] = useState(false)
  const [deployed, setDeployed] = useState(false)

  const handleDeploy = async () => {
    if (!target) return
    setDeploying(true)
    await new Promise(r => setTimeout(r, 2500))
    setDeploying(false)
    setDeployed(true)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => {
      if (!o) { onClose(); setDeployed(false); setTarget(null) }
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deploy</DialogTitle>
          <DialogDescription>Deploy your project</DialogDescription>
        </DialogHeader>

        {!deployed ? (
          <div className="space-y-4">
            <div className="flex gap-3">
              <button
                onClick={() => setTarget('vercel')}
                className={`flex-1 p-4 rounded-xl border text-center transition-all ${
                  target === 'vercel'
                    ? 'border-accent bg-accent/10'
                    : 'border-border bg-surface hover:bg-hover'
                }`}
              >
                <div className="text-lg mb-1">▲</div>
                <div className="text-sm font-medium text-primary">Vercel</div>
              </button>
              <button
                onClick={() => setTarget('netlify')}
                className={`flex-1 p-4 rounded-xl border text-center transition-all ${
                  target === 'netlify'
                    ? 'border-accent bg-accent/10'
                    : 'border-border bg-surface hover:bg-hover'
                }`}
              >
                <div className="text-lg mb-1">⊞</div>
                <div className="text-sm font-medium text-primary">Netlify</div>
              </button>
            </div>

            <Separator />

            <Button
              variant="primary"
              className="w-full"
              onClick={handleDeploy}
              disabled={!target || deploying}
            >
              {deploying ? 'Deploying...' : `Deploy to ${target || '...'}`}
            </Button>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="text-3xl mb-3">✓</div>
            <p className="text-sm text-primary font-medium mb-1">Deployed!</p>
            <p className="text-xs text-accent font-mono mb-4">
              https://my-project.vercel.app
            </p>
            <Button variant="primary" onClick={onClose}>Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
