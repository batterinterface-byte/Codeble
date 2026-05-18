import { useEffect, type ReactNode } from 'react'
import {
  ClerkProvider as ClerkProviderRoot,
  SignedIn,
  SignedOut,
  useUser,
  useClerk,
} from '@clerk/clerk-react'
import { $auth, setAuth, clearAuth } from '../../stores/session'

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || ''
const CLERK_APPEARANCE = {
  elements: {
    rootBox: 'w-full',
    card: 'bg-panel border border-border shadow-2xl rounded-xl',
    headerTitle: 'text-primary text-lg',
    headerSubtitle: 'text-secondary text-sm',
    socialButtonsBlockButton: 'bg-surface border border-border text-primary hover:bg-hover',
    formFieldLabel: 'text-secondary text-sm',
    formFieldInput: 'bg-deep border border-border text-primary rounded-lg',
    formButtonPrimary: 'bg-gradient-accent hover:opacity-90',
    footerActionLink: 'text-accent hover:text-accent-hover',
    dividerLine: 'bg-border',
    dividerText: 'text-muted',
  },
}

function ClerkSync({ children }: { children: ReactNode }) {
  const { isSignedIn, user } = useUser()

  useEffect(() => {
    if (isSignedIn && user) {
      setAuth(user.id)
    } else if (isSignedIn === false) {
      clearAuth()
    }
  }, [isSignedIn, user])

  return <>{children}</>
}

function SignInGate({ children }: { children: ReactNode }) {
  const { openSignIn } = useClerk()

  return (
    <>
      <SignedIn>
        <ClerkSync>{children}</ClerkSync>
      </SignedIn>
      <SignedOut>
        <div className="h-full w-full flex items-center justify-center bg-deep">
          <div className="w-full max-w-md p-8 text-center">
            <h1 className="text-3xl font-bold bg-gradient-accent bg-clip-text text-transparent mb-3">Devonz</h1>
            <p className="text-secondary text-sm mb-6">Sign in to continue</p>
            <div className="mx-auto">
              <button
                onClick={() => openSignIn()}
                className="px-6 py-3 rounded-xl bg-gradient-accent text-white text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer border-none"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </SignedOut>
    </>
  )
}

function DevFallback({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (!$auth.get()) setAuth('dev-user')
  }, [])
  return <>{children}</>
}

export function ClerkAuthProvider({ children }: { children: ReactNode }) {
  if (!CLERK_KEY) {
    return <DevFallback>{children}</DevFallback>
  }

  return (
    <ClerkProviderRoot
      publishableKey={CLERK_KEY}
      appearance={CLERK_APPEARANCE}
    >
      <SignInGate>
        {children}
      </SignInGate>
    </ClerkProviderRoot>
  )
}
