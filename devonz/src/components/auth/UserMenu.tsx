import { useStore } from '@nanostores/react'
import { $auth, clearAuth } from '../../stores/session'

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || ''

export function UserMenu() {
  const auth = useStore($auth)

  if (!auth) return null

  return CLERK_KEY ? <ClerkUserMenu /> : <LocalUserMenu />
}

function LocalUserMenu() {
  const auth = useStore($auth)
  if (!auth) return null

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface/50 border border-border/50">
      <span className="w-6 h-6 rounded-full bg-gradient-accent flex items-center justify-center text-xs font-bold text-white">D</span>
      <span className="text-xs text-secondary hidden sm:inline">Dev (local)</span>
      <button
        onClick={() => clearAuth()}
        className="text-xs text-muted hover:text-secondary transition-colors cursor-pointer bg-transparent border-none"
      >
        exit
      </button>
    </div>
  )
}

function ClerkUserMenu() {
  let user: any, signOut: any
  try {
    const clerk = (window as any).__clerk
    if (clerk?.user) {
      user = clerk.user
      signOut = () => clerk.signOut()
    }
  } catch {}

  const initials = user ? (user.firstName?.[0] || user.emailAddresses?.[0]?.emailAddress?.[0] || '?').toUpperCase() : '?'
  const displayName = user?.firstName || user?.emailAddresses?.[0]?.emailAddress || 'User'

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface/50 border border-border/50">
      <span className="w-6 h-6 rounded-full bg-gradient-accent flex items-center justify-center text-xs font-bold text-white">{initials}</span>
      <span className="text-xs text-secondary hidden sm:inline">{displayName}</span>
      {signOut && (
        <button onClick={() => { signOut(); clearAuth() }}
          className="text-xs text-muted hover:text-secondary transition-colors cursor-pointer bg-transparent border-none">
          exit
        </button>
      )}
    </div>
  )
}
