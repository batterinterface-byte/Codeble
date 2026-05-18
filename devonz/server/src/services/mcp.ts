import { EventEmitter } from 'events'
import { spawn, ChildProcess } from 'child_process'
import path from 'path'

interface MCPServerConfig {
  id: string
  name: string
  transport: 'stdio' | 'sse' | 'streamable-http'
  command?: string
  args?: string[]
  url?: string
}

interface MCPTool {
  name: string
  description: string
  inputSchema: unknown
}

class MCPServerInstance extends EventEmitter {
  config: MCPServerConfig
  process: ChildProcess | null = null
  tools: MCPTool[] = []
  status: 'connected' | 'disconnected' | 'error' = 'disconnected'

  constructor(config: MCPServerConfig) {
    super()
    this.config = config
  }

  async connect() {
    if (this.config.transport === 'stdio' && this.config.command) {
      this.process = spawn(this.config.command, this.config.args || [], {
        stdio: ['pipe', 'pipe', 'pipe'],
      })

      let buffer = ''
      this.process.stdout?.on('data', (data: Buffer) => {
        buffer += data.toString()
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        for (const line of lines) {
          try {
            const msg = JSON.parse(line)
            this.handleMessage(msg)
          } catch { /* skip partial */ }
        }
      })

      this.process.on('exit', (code) => {
        this.status = code === 0 ? 'disconnected' : 'error'
        this.emit('status', this.status)
      })

      this.status = 'connected'
      this.emit('status', this.status)
    } else {
      this.status = 'connected'
      this.tools = [
        { name: 'read_file', description: 'Read file contents', inputSchema: { type: 'object', properties: { path: { type: 'string' } } } },
        { name: 'write_file', description: 'Write file contents', inputSchema: { type: 'object', properties: { path: { type: 'string' }, content: { type: 'string' } } } },
        { name: 'execute_command', description: 'Run a shell command', inputSchema: { type: 'object', properties: { command: { type: 'string' } } } },
        { name: 'search_files', description: 'Search files by pattern', inputSchema: { type: 'object', properties: { pattern: { type: 'string' } } } },
      ]
      this.emit('tools', this.tools)
      this.emit('status', this.status)
    }
  }

  private handleMessage(msg: any) {
    if (msg.method === 'tools/list') {
      this.tools = msg.result?.tools || []
      this.emit('tools', this.tools)
    }
  }

  async callTool(name: string, input: any): Promise<any> {
    if (this.process && this.config.transport === 'stdio') {
      const req = JSON.stringify({ jsonrpc: '2.0', method: 'tools/call', params: { name, arguments: input }, id: Date.now() })
      this.process.stdin?.write(req + '\n')
      return new Promise((resolve) => {
        this.process?.stdout?.once('data', (data: Buffer) => {
          try { resolve(JSON.parse(data.toString())) } catch { resolve({}) }
        })
      })
    }
    return { content: [{ type: 'text', text: `[mock] called tool "${name}"` }] }
  }

  disconnect() {
    if (this.process) {
      this.process.kill()
      this.process = null
    }
    this.status = 'disconnected'
    this.emit('status', this.status)
  }
}

class MCPService {
  private servers = new Map<string, MCPServerInstance>()

  addServer(config: MCPServerConfig) {
    const instance = new MCPServerInstance(config)
    this.servers.set(config.id, instance)
    instance.connect()
    return instance
  }

  removeServer(id: string) {
    const instance = this.servers.get(id)
    if (instance) {
      instance.disconnect()
      this.servers.delete(id)
    }
  }

  getServer(id: string) {
    return this.servers.get(id)
  }

  getAllServers() {
    return Array.from(this.servers.values())
  }

  async callTool(serverId: string, name: string, input: any) {
    const server = this.servers.get(serverId)
    if (!server) throw new Error(`MCP server ${serverId} not found`)
    return server.callTool(name, input)
  }
}

export const mcpService = new MCPService()
export { MCPServerInstance, MCPServerConfig, MCPTool }
