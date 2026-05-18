import { atom } from 'nanostores'
import type { AuthSession } from '@shared/types'

export const $auth = atom<AuthSession | null>(null)
export const $isConnected = atom(false)
export const $wsConnected = atom(false)

export function setAuth(token: string) {
  $auth.set({ token, createdAt: Date.now() })
}

export function clearAuth() {
  $auth.set(null)
}
