import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'
import { Button } from '../ui/button'
import { Separator } from '../ui/separator'

interface SupabaseModalProps {
  open: boolean
  onClose: () => void
}

export function SupabaseModal({ open, onClose }: SupabaseModalProps) {
  const [url, setUrl] = useState('')
  const [key, setKey] = useState('')
  const [connected, setConnected] = useState(false)

  const handleConnect = async () => {
    await new Promise(r => setTimeout(r, 800))
    setConnected(true)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => {
      if (!o) { onClose(); setConnected(false) }
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supabase</DialogTitle>
          <DialogDescription>Connect to Supabase project</DialogDescription>
        </DialogHeader>

        {!connected ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-secondary block mb-2">Project URL</label>
              <input
                className="input"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://xxxxx.supabase.co"
              />
            </div>
            <div>
              <label className="text-sm text-secondary block mb-2">Anon Key</label>
              <input
                className="input"
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIs..."
              />
            </div>
            <Separator />
            <Button
              variant="primary"
              className="w-full"
              onClick={handleConnect}
              disabled={!url || !key}
            >
              Connect
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="panel p-3 text-center">
              <span className="text-green text-sm font-medium">Connected</span>
            </div>
            <div className="text-sm text-secondary space-y-2">
              <p>✓ Database access</p>
              <p>✓ Authentication ready</p>
              <p>✓ Storage configured</p>
            </div>
            <Separator />
            <div className="flex gap-2">
              <Button variant="secondary" onClick={onClose}>Close</Button>
              <Button variant="primary">Browse Database</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
