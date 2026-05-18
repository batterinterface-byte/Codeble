export interface GitService {
  init(path: string): Promise<void>
  status(path: string): Promise<{ branch: string; changes: number; staged: number; ahead: number; behind: number }>
  commit(path: string, message: string): Promise<void>
  push(path: string, remote?: string, branch?: string): Promise<void>
  pull(path: string): Promise<void>
  log(path: string, limit?: number): Promise<{ hash: string; message: string; date: string; author: string }[]>
}

class MockGitService implements GitService {
  async init(_path: string) {}
  async status(_path: string) {
    return { branch: 'main', changes: 2, staged: 1, ahead: 0, behind: 0 }
  }
  async commit(_path: string, message: string) {
    console.log(`[mock git] commit: ${message}`)
  }
  async push(_path: string, _remote?: string, _branch?: string) {
    console.log('[mock git] push')
  }
  async pull(_path: string) {
    console.log('[mock git] pull')
  }
  async log(_path: string, _limit = 10) {
    return [
      { hash: 'abc123', message: 'Initial commit', date: new Date().toISOString(), author: 'devonz' },
    ]
  }
}

class RealGitService implements GitService {
  private async exec(path: string, args: string[]): Promise<string> {
    const { execSync } = await import('child_process')
    return execSync(`git ${args.join(' ')}`, { cwd: path, encoding: 'utf-8' }).trim()
  }

  async init(path: string) {
    await this.exec(path, ['init'])
  }

  async status(path: string) {
    const output = await this.exec(path, ['status', '--porcelain'])
    const lines = output.split('\n').filter(Boolean)
    const changes = lines.filter(l => l[1] !== ' ').length
    const staged = lines.filter(l => l[0] !== ' ').length
    const branch = await this.exec(path, ['rev-parse', '--abbrev-ref', 'HEAD']).catch(() => 'main')
    return { branch, changes, staged, ahead: 0, behind: 0 }
  }

  async commit(path: string, message: string) {
    await this.exec(path, ['add', '-A'])
    await this.exec(path, ['commit', '-m', message])
  }

  async push(path: string, remote = 'origin', branch = 'main') {
    await this.exec(path, ['push', remote, branch])
  }

  async pull(path: string) {
    await this.exec(path, ['pull'])
  }

  async log(path: string, limit = 10) {
    const output = await this.exec(path, ['log', `--max-count=${limit}`, '--format=%H||%s||%ai||%an'])
    return output.split('\n').filter(Boolean).map(line => {
      const [hash, message, date, author] = line.split('||')
      return { hash, message, date, author }
    })
  }
}

export const gitService: GitService = new MockGitService()
