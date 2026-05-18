export interface Project {
  id: string
  name: string
  path: string
  createdAt: number
  updatedAt: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: number
  agentPhase?: AgentPhase
}

export interface AgentPhase {
  type: 'thinking' | 'planning' | 'writing' | 'reviewing' | 'executing' | 'done'
  label: string
  detail?: string
}

export interface FileNode {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: FileNode[]
  size?: number
  modifiedAt?: number
}

export interface SessionState {
  id: string
  projectId: string
  active: boolean
  startedAt: number
}

export interface MCPServer {
  id: string
  name: string
  transport: 'stdio' | 'sse' | 'streamable-http'
  status: 'connected' | 'disconnected' | 'error'
  tools: MCPTool[]
}

export interface MCPTool {
  name: string
  description: string
  inputSchema: unknown
}

export interface DiffEntry {
  filePath: string
  status: 'added' | 'modified' | 'deleted'
  hunks: { oldStart: number; oldLines: string; newStart: number; newLines: string }[]
}

export type AgentMode = 'normal' | 'agent'

export interface StreamChunk {
  type: 'text' | 'agent_phase' | 'tool_call' | 'tool_result' | 'error' | 'done'
  content?: string
  phase?: AgentPhase
  toolName?: string
  toolInput?: unknown
}

export interface DeployTarget {
  id: string
  name: string
  type: 'vercel' | 'netlify'
  status: 'idle' | 'deploying' | 'deployed' | 'error'
  url?: string
}

export interface GitStatus {
  branch: string
  changes: number
  staged: number
  ahead: number
  behind: number
}

export interface AuthSession {
  token: string
  createdAt: number
}
