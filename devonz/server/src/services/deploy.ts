interface DeployOptions {
  target: 'vercel' | 'netlify'
  projectPath: string
  projectId: string
}

interface DeployResult {
  success: boolean
  url?: string
  error?: string
}

class MockDeployService {
  async deploy(opts: DeployOptions): Promise<DeployResult> {
    console.log(`[mock deploy] deploying to ${opts.target} from ${opts.projectPath}`)
    await new Promise(r => setTimeout(r, 2000))
    return {
      success: true,
      url: `https://${opts.projectId}-${opts.target}.devonz.app`,
    }
  }

  async getStatus(target: string, _deployId: string): Promise<string> {
    return 'deployed'
  }
}

class RealVercelDeployService {
  async deploy(opts: DeployOptions): Promise<DeployResult> {
    try {
      const { execSync } = await import('child_process')
      execSync(`npx vercel --cwd "${opts.projectPath}" --token "${process.env.VERCEL_TOKEN || ''}" --yes`, {
        stdio: 'pipe',
      })
      return { success: true, url: `https://${opts.projectId}.vercel.app` }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  }

  async getStatus(_target: string, _deployId: string): Promise<string> {
    return 'deployed'
  }
}

const useMock = !process.env.VERCEL_TOKEN && !process.env.NETLIFY_TOKEN
export const deployService = useMock ? new MockDeployService() : new RealVercelDeployService()
