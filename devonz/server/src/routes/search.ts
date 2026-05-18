import { Hono } from 'hono'
import { projectRuntime } from '../services/runtime'
import { db } from '../db'
import { projects } from '../db/schema'
import { eq } from 'drizzle-orm'
import path from 'path'

const searchRouter = new Hono()

searchRouter.get('/:projectId', async (c) => {
  const projectId = c.req.param('projectId')
  const query = c.req.query('q')
  if (!query) return c.json({ results: [] })

  const project = await db.select().from(projects).where(eq(projects.id, projectId)).get()
  if (!project) return c.json({ error: 'Project not found' }, 404)

  const results: any[] = []
  const searchDir = (dirPath: string) => {
    const entries = projectRuntime.listFiles(dirPath)
    for (const entry of entries) {
      if (entry.type === 'file') {
        const content = projectRuntime.readFile(entry.path)
        if (content) {
          const lines = content.split('\n')
          for (let i = 0; i < lines.length; i++) {
            const idx = lines[i].toLowerCase().indexOf(query.toLowerCase())
            if (idx !== -1) {
              const relPath = path.relative(project.path, entry.path)
              results.push({
                filePath: relPath,
                line: i + 1,
                column: idx + 1,
                lineContent: lines[i].trim(),
                matchLength: query.length,
              })
            }
          }
        }
      } else if (entry.type === 'directory') {
        searchDir(entry.path)
      }
    }
  }

  try {
    searchDir(project.path)
  } catch {}

  return c.json({ results: results.slice(0, 100) })
})

export { searchRouter }
