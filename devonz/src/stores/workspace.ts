import { atom, map } from 'nanostores'
import type { FileNode, GitStatus, DeployTarget } from '@shared/types'

export const $projectId = atom<string | null>(null)
export const $projectName = atom<string>('')
export const $files = atom<FileNode[]>([])
export const $activeFilePath = atom<string | null>(null)
export const $activeFileContent = atom<string>('')
export const $gitStatus = atom<GitStatus | null>(null)
export const $deployments = atom<DeployTarget[]>([])
export const $previewUrl = atom<string | null>(null)
export const $sessionId = atom<string | null>(null)
export const $serverPort = atom<number | null>(null)

export const $showPreview = atom(true)
export const $showTerminal = atom(false)
export const $showDiff = atom(false)
export const $diffContent = atom<string>('')
