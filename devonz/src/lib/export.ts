import JSZip from 'jszip'
import { api } from './api'

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function exportProject(projectId: string, projectName: string) {
  try {
    const files = await api.projects.files(projectId)
    const zip = new JSZip()

    async function addFiles(entries: any[], basePath: string) {
      for (const entry of entries) {
        const entryPath = basePath ? `${basePath}/${entry.name}` : entry.name
        if (entry.type === 'directory') {
          const children = await api.files.list(entry.path.replace(/^\/+/, ''))
          await addFiles(children || [], entryPath)
        } else {
          const content = await api.files.read(entry.path.replace(/^\/+/, ''))
          if (content !== null) {
            zip.file(entryPath, content)
          }
        }
      }
    }

    await addFiles(files || [], '')
    const blob = await zip.generateAsync({ type: 'blob' })
    downloadBlob(blob, `${projectName || 'project'}.zip`)
    return true
  } catch (e) {
    console.error('Export failed:', e)
    return false
  }
}

export async function importProject(file: File, projectName: string) {
  try {
    const zip = await JSZip.loadAsync(file)
    const project = await api.projects.create(projectName)

    const promises: Promise<void>[] = []
    zip.forEach((relativePath, zipEntry) => {
      if (!zipEntry.dir) {
        promises.push(
          zipEntry.async('string').then(content =>
            api.files.write(`${projectName}/${relativePath}`, content)
          )
        )
      }
    })

    await Promise.all(promises)
    return project
  } catch (e) {
    console.error('Import failed:', e)
    return null
  }
}
