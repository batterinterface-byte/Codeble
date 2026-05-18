import { spawn, ChildProcess, execSync } from 'child_process'
import path from 'path'
import fs from 'fs'
import os from 'os'
import { EventEmitter } from 'events'

const PROJECTS_DIR = path.join(os.homedir(), 'devonz-projects')

interface RuntimeSession {
  id: string
  projectPath: string
  process: ChildProcess | null
  port: number
  emitter: EventEmitter
}

class ProjectRuntime extends EventEmitter {
  private sessions = new Map<string, RuntimeSession>()
  private portCounter = 4091
  private watchers = new Map<string, fs.FSWatcher>()

  ensureProjectsDir() {
    if (!fs.existsSync(PROJECTS_DIR)) {
      fs.mkdirSync(PROJECTS_DIR, { recursive: true })
    }
  }

  getProjectsDir() {
    this.ensureProjectsDir()
    return PROJECTS_DIR
  }

  createProject(name: string): string {
    this.ensureProjectsDir()
    const projectPath = path.join(PROJECTS_DIR, name)
    if (!fs.existsSync(projectPath)) {
      fs.mkdirSync(projectPath, { recursive: true })
      fs.writeFileSync(path.join(projectPath, 'package.json'), JSON.stringify({
        name, version: '0.0.1', private: true,
      }, null, 2))
    }
    return projectPath
  }

  startSession(id: string, projectPath: string): RuntimeSession {
    const port = this.portCounter++
    const emitter = new EventEmitter()
    const session: RuntimeSession = { id, projectPath, process: null, port, emitter }
    this.sessions.set(id, session)
    return session
  }

  startDevServer(sessionId: string): number | null {
    const session = this.sessions.get(sessionId)
    if (!session) return null
    const port = session.port
    const proc = spawn('node', ['-e', `
      const http = require('http');
      const fs = require('fs');
      const path = require('path');
      const server = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<h1>Devonz Preview</h1><p>Project running on port ${port}</p>');
      });
      server.listen(${port}, () => {
        process.stdout.write('ready');
      });
    `], {
      cwd: session.projectPath,
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    session.process = proc
    proc.on('exit', (code) => {
      session.emitter.emit('exit', code)
    })
    proc.stderr?.on('data', (data: Buffer) => {
      const text = data.toString()
      if (text.includes('EPIPE') || text.includes('write EPIPE') || text.includes('premature close')) {
        return
      }
      session.emitter.emit('stderr', text)
    })
    return port
  }

  stopSession(sessionId: string) {
    const session = this.sessions.get(sessionId)
    if (session?.process) {
      session.process.kill('SIGTERM')
      setTimeout(() => {
        try { session.process?.kill('SIGKILL') } catch {}
      }, 5000)
    }
    this.sessions.delete(sessionId)
  }

  watchProject(projectPath: string, callback: (event: string, filePath: string) => void): string {
    const id = `watch-${Date.now()}`
    const watcher = fs.watch(projectPath, { recursive: true }, (event, filename) => {
      if (filename) callback(event, filename.toString())
    })
    this.watchers.set(id, watcher)
    return id
  }

  unwatch(id: string) {
    const watcher = this.watchers.get(id)
    if (watcher) {
      watcher.close()
      this.watchers.delete(id)
    }
  }

  readFile(filePath: string): string | null {
    try {
      return fs.readFileSync(filePath, 'utf-8')
    } catch {
      return null
    }
  }

  writeFile(filePath: string, content: string) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, content, 'utf-8')
  }

  listFiles(dirPath: string) {
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true })
      return entries.map(e => ({
        name: e.name,
        path: path.join(dirPath, e.name),
        type: e.isDirectory() ? 'directory' : 'file' as const,
        size: e.isFile() ? fs.statSync(path.join(dirPath, e.name)).size : undefined,
        modifiedAt: fs.statSync(path.join(dirPath, e.name)).mtimeMs,
      }))
    } catch {
      return []
    }
  }

  getSession(sessionId: string) {
    return this.sessions.get(sessionId)
  }

  cleanup() {
    for (const [id] of this.sessions) {
      this.stopSession(id)
    }
    for (const [id] of this.watchers) {
      this.unwatch(id)
    }
  }
}

export const projectRuntime = new ProjectRuntime()
