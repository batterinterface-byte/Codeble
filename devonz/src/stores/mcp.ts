import { atom } from 'nanostores'
import type { MCPServer } from '@shared/types'

export const $mcpServers = atom<MCPServer[]>([
  {
    id: 'opencode-agent',
    name: 'OpenCode',
    transport: 'streamable-http',
    status: 'connected',
    tools: [
      { name: 'generate_code', description: 'Generate code from a natural language description', inputSchema: { type: 'object', properties: { prompt: { type: 'string' }, language: { type: 'string' } } } },
      { name: 'review_code', description: 'Review code for bugs, issues, and improvements', inputSchema: { type: 'object', properties: { code: { type: 'string' }, filePath: { type: 'string' } } } },
      { name: 'refactor_code', description: 'Refactor code to improve structure and readability', inputSchema: { type: 'object', properties: { code: { type: 'string' }, instructions: { type: 'string' } } } },
      { name: 'explain_code', description: 'Explain what a piece of code does', inputSchema: { type: 'object', properties: { code: { type: 'string' } } } },
      { name: 'debug_error', description: 'Debug an error message with the relevant code', inputSchema: { type: 'object', properties: { error: { type: 'string' }, code: { type: 'string' } } } },
    ],
  },
  {
    id: 'builtin-fs',
    name: 'Filesystem',
    transport: 'stdio',
    status: 'connected',
    tools: [
      { name: 'read_file', description: 'Read file contents', inputSchema: {} },
      { name: 'write_file', description: 'Write file contents', inputSchema: {} },
      { name: 'search_files', description: 'Search files by glob pattern', inputSchema: {} },
      { name: 'list_directory', description: 'List files in a directory', inputSchema: {} },
    ],
  },
  {
    id: 'builtin-shell',
    name: 'Shell',
    transport: 'stdio',
    status: 'connected',
    tools: [
      { name: 'execute', description: 'Run a shell command', inputSchema: {} },
      { name: 'install', description: 'Install a package via npm/pip', inputSchema: {} },
      { name: 'git_status', description: 'Check git repository status', inputSchema: {} },
    ],
  },
])

export function updateMCPServer(id: string, updates: Partial<MCPServer>) {
  const servers = $mcpServers.get().map(s =>
    s.id === id ? { ...s, ...updates } : s
  )
  $mcpServers.set(servers)
}
