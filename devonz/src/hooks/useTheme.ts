import { useEffect } from 'react'
import { useStore } from '@nanostores/react'
import { $settings } from '../stores/settings'

export function useTheme() {
  const theme = useStore($settings).theme

  useEffect(() => {
    const root = document.documentElement

    const apply = (mode: 'dark' | 'light') => {
      root.classList.remove('dark', 'light')
      root.classList.add(mode)
      root.style.colorScheme = mode
    }

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      apply(mq.matches ? 'dark' : 'light')
      const handler = (e: MediaQueryListEvent) => apply(e.matches ? 'dark' : 'light')
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }

    apply(theme)
  }, [theme])
}
