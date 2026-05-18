const BASE = '/api'

async function request(path: string, options: RequestInit = {}) {
  const resp = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })
  if (resp.status === 204) return null
  if (!resp.ok) {
    const err = await resp.text()
    throw new Error(err || `HTTP ${resp.status}`)
  }
  return resp.json()
}

export const api = {
  chat: {
    async send(messages: any[], opts: { provider?: string; model?: string; mode?: string } = {}) {
      const resp = await fetch(`${BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, ...opts }),
      })
      if (!resp.ok) throw new Error('Chat request failed')
      return resp
    },
    async agent(messages: any[], opts: { provider?: string; model?: string } = {}) {
      const resp = await fetch(`${BASE}/chat/agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, mode: 'agent', ...opts }),
      })
      if (!resp.ok) throw new Error('Agent request failed')
      return resp
    },
  },
  projects: {
    list: () => request('/projects'),
    create: (name: string) => request('/projects', { method: 'POST', body: JSON.stringify({ name }) }),
    get: (id: string) => request(`/projects/${id}`),
    startSession: (id: string) => request(`/projects/${id}/session`, { method: 'POST' }),
    stopSession: (projectId: string, sessionId: string) =>
      request(`/projects/${projectId}/session/${sessionId}/stop`, { method: 'POST' }),
    files: (id: string) => request(`/projects/${id}/files`),
  },
  files: {
    read: (path: string) => request(`/files/${encodeURIComponent(path)}`),
    write: (path: string, content: string) =>
      request(`/files/${encodeURIComponent(path)}`, { method: 'POST', body: content }),
    list: (dir: string) => request(`/ls/${encodeURIComponent(dir)}`),
  },
  git: {
    init: (path: string) => request('/git/init', { method: 'POST', body: JSON.stringify({ path }) }),
    status: (path: string) => request('/git/status', { method: 'POST', body: JSON.stringify({ path }) }),
    commit: (path: string, message: string) =>
      request('/git/commit', { method: 'POST', body: JSON.stringify({ path, message }) }),
    log: (path: string) => request('/git/log', { method: 'POST', body: JSON.stringify({ path }) }),
  },
  deploy: {
    deploy: (projectId: string, target: string, projectPath: string) =>
      request('/deploy', { method: 'POST', body: JSON.stringify({ projectId, target, projectPath }) }),
    list: (projectId: string) => request(`/deploy/${projectId}`),
  },
  health: () => request('/health'),
}
