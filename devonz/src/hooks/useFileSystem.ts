import { useCallback } from 'react'
import { api } from '../lib/api'
import { $files, $activeFilePath, $activeFileContent } from '../stores/workspace'

export function useFileSystem() {
  const loadFiles = useCallback(async (projectId: string) => {
    try {
      const fileList = await api.projects.files(projectId)
      $files.set(fileList || [])
    } catch {
      $files.set([])
    }
  }, [])

  const readFile = useCallback(async (filePath: string) => {
    try {
      const content = await api.files.read(filePath)
      $activeFilePath.set(filePath)
      $activeFileContent.set(typeof content === 'string' ? content : '')
      return content
    } catch {
      $activeFilePath.set(filePath)
      $activeFileContent.set('')
      return null
    }
  }, [])

  const writeFile = useCallback(async (filePath: string, content: string) => {
    try {
      await api.files.write(filePath, content)
      $activeFileContent.set(content)
    } catch (e) {
      console.error('Failed to write file:', e)
    }
  }, [])

  return { loadFiles, readFile, writeFile }
}
