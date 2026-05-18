import { atom } from 'nanostores'

export interface RemoteCursor {
  userId: string
  userName: string
  filePath: string
  line: number
  column: number
  color: string
}

export const $remoteCursors = atom<RemoteCursor[]>([])
export const $collabUsers = atom<{ id: string; name: string; online: boolean }[]>([])
export const $isCollabConnected = atom(false)
