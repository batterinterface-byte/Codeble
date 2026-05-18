import { useEffect, useState, useRef } from 'react'
import { useStore } from '@nanostores/react'
import { $remoteCursors, $collabUsers, $isCollabConnected } from '../../stores/collab'
import { $auth } from '../../stores/session'

const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
const WS_COLLAB_URL = `${protocol}//${window.location.hostname}:4090/ws`

export function CollaborationPanel() {
  const connected = useStore($isCollabConnected)
  const users = useStore($collabUsers)
  const remoteCursors = useStore($remoteCursors)
  const auth = useStore($auth)
  const wsRef = useRef<WebSocket | null>(null)
  const [collabOpen, setCollabOpen] = useState(false)

  useEffect(() => {
    if (!auth) return

    const connect = () => {
      let ws
      try {
        ws = new WebSocket(`${WS_COLLAB_URL}?token=${auth.token}`)
      } catch {
        setTimeout(connect, 3000)
        return
      }
      ws.onopen = () => {
        $isCollabConnected.set(true)
        ws.send(JSON.stringify({ type: 'join', userId: auth.token, userName: 'Devonz User' }))
      }
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          if (msg.type === 'users') {
            $collabUsers.set(msg.users || [])
          } else if (msg.type === 'cursor') {
            $remoteCursors.set(msg.cursors || [])
          }
        } catch {}
      }
      ws.onclose = () => {
        $isCollabConnected.set(false)
        setTimeout(connect, 3000)
      }
      wsRef.current = ws
    }

    connect()
    return () => { wsRef.current?.close() }
  }, [auth])

  if (!collabOpen) {
    return (
      <button
        onClick={() => setCollabOpen(true)}
        className="fixed bottom-4 right-4 z-30 w-10 h-10 rounded-full bg-panel border border-border shadow-lg flex items-center justify-center hover:bg-hover transition-colors cursor-pointer"
        title="Collaboration"
      >
        <span className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-green shadow-green' : 'bg-orange'}`} />
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-30 w-72 bg-panel border border-border rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 bg-surface/30">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green' : 'bg-orange'}`} />
          <span className="text-xs font-medium text-primary">Collaboration</span>
        </div>
        <button
          onClick={() => setCollabOpen(false)}
          className="text-xs text-muted hover:text-secondary cursor-pointer bg-transparent border-none"
        >
          ✕
        </button>
      </div>
      <div className="p-3 max-h-48 overflow-y-auto">
        {users.length === 0 && (
          <div className="text-xs text-muted text-center py-2">No collaborators yet</div>
        )}
        {users.map((u) => (
          <div key={u.id} className="flex items-center gap-2 py-1.5">
            <span className={`w-2 h-2 rounded-full ${u.online ? 'bg-green' : 'bg-muted'}`} />
            <span className="text-xs text-primary">{u.name}</span>
          </div>
        ))}
        {remoteCursors.length > 0 && (
          <div className="mt-2 pt-2 border-t border-border/30">
            <span className="text-xs text-muted mb-1 block">Live cursors</span>
            {remoteCursors.map((c, i) => (
              <div key={i} className="text-xs text-secondary/70 font-mono">
                {c.userName}: {c.filePath}:{c.line}:{c.column}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
