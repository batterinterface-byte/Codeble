import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import { ClerkAuthProvider } from './components/auth/ClerkProvider'
import { App } from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import './styles/main.scss'

const meta = document.createElement('meta')
meta.name = 'theme-color'
meta.content = '#0a0a0a'
document.head.appendChild(meta)

document.documentElement.classList.add('dark')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
    <BrowserRouter>
      <ClerkAuthProvider>
        <App />
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            className: 'sonner-toast',
            duration: 4000,
          }}
        />
      </ClerkAuthProvider>
    </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
)
