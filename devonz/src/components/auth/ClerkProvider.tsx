import { useEffect, type ReactNode } from 'react'
import { useStore } from '@nanostores/react'
import { $auth, setAuth, clearAuth } from '../../stores/session'

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || ''

function DevAuthFallback({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (!$auth.get()) setAuth('dev-user')
  }, [])
  return <>{children}</>
}

export function ClerkAuthProvider({ children }: { children: ReactNode }) {
  const auth = useStore($auth)

  useEffect(() => {
    if (CLERK_KEY) {
      const script = document.createElement('script')
      script.src = `https://cdn.jsdelivr.net/npm/@clerk/clerk-browser@latest/dist/clerk.browser.js`
      script.onload = () => {
        const Clerk = (window as any).Clerk
        if (Clerk) {
          Clerk.load({ publishableKey: CLERK_KEY })
          Clerk.addListener((payload: any) => {
            if (payload.user) setAuth(payload.user.id)
            else clearAuth()
          })
        }
      }
      document.head.appendChild(script)
    } else if (!$auth.get()) {
      setAuth('dev-user')
    }
  }, [])

  if (CLERK_KEY && !auth) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-deep">
        <div className="w-full max-w-md p-8 text-center">
          <h1 className="text-3xl font-bold bg-gradient-accent bg-clip-text text-transparent mb-3">Devonz</h1>
          <p className="text-secondary text-sm mb-6">Sign in with Clerk to continue</p>
          <div id="clerk-sign-in" className="mx-auto" />
        </div>
      </div>
    )
  }

  return <DevAuthFallback>{children}</DevAuthFallback>
}
