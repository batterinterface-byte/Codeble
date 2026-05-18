import { useState, useEffect } from 'react'
import { useStore } from '@nanostores/react'
import { $projectId, $files } from '../../stores/workspace'
import { openTab } from '../../stores/editor'
import { api } from '../../lib/api'

interface TreeNode {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: TreeNode[]
  expanded?: boolean
}

interface FileExplorerProps {
  onClose?: () => void
}

export function FileExplorer({ onClose }: FileExplorerProps) {
  const projectId = useStore($projectId)
  const [tree, setTree] = useState<TreeNode[]>([])
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!projectId) return
    loadTree()
  }, [projectId])

  const loadTree = async () => {
    setLoading(true)
    try {
      const fileList = await api.projects.files(projectId!)
      const tree = buildTree(fileList || [])
      setTree(tree)
    } catch {
      setTree([])
    }
    setLoading(false)
  }

  const toggleExpand = async (path: string) => {
    const next = new Set(expanded)
    if (next.has(path)) {
      next.delete(path)
    } else {
      next.add(path)
    }
    setExpanded(next)

    if (next.has(path)) {
      try {
        const children = await api.files.list(path.replace(/^\/+/, ''))
        setTree(prev => updateTree(prev, path, children || []))
      } catch {}
    }
  }

  const handleFileClick = async (filePath: string) => {
    const name = filePath.split('/').pop() || filePath
    const content = await api.files.read(filePath.replace(/^\/+/, ''))
    openTab(filePath, name, content || '')
  }

  const getFileIcon = (name: string) => {
    if (name.endsWith('.tsx') || name.endsWith('.ts')) return '🟦'
    if (name.endsWith('.js') || name.endsWith('.jsx')) return '🟨'
    if (name.endsWith('.css') || name.endsWith('.scss')) return '🟪'
    if (name.endsWith('.html')) return '🟧'
    if (name.endsWith('.json')) return '⬜'
    if (name.endsWith('.py')) return '🐍'
    if (name.endsWith('.md')) return '📝'
    return '📄'
  }

  const renderNode = (node: TreeNode, depth: number) => {
    const isDir = node.type === 'directory'
    const isExpanded = expanded.has(node.path)

    return (
      <div key={node.path}>
        <button
          onClick={() => isDir ? toggleExpand(node.path) : handleFileClick(node.path)}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-hover/50 transition-colors cursor-pointer border-none bg-transparent text-left"
          style={{ paddingLeft: `${12 + depth * 16}px` }}
        >
          {isDir ? (
            <span className="text-xs text-muted flex-shrink-0">{isExpanded ? '▼' : '▶'}</span>
          ) : (
            <span className="text-xs flex-shrink-0">{getFileIcon(node.name)}</span>
          )}
          <span className={`truncate ${isDir ? 'text-primary font-medium' : 'text-secondary'}`}>
            {node.name}
          </span>
        </button>
        {isDir && isExpanded && node.children?.map(child => renderNode(child, depth + 1))}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-primary">Files</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadTree}
            className="text-xs text-muted hover:text-secondary transition-colors cursor-pointer bg-transparent border-none"
          >
            ↻
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-xs text-muted hover:text-primary transition-colors cursor-pointer bg-transparent border-none md:inline hidden"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {loading && <div className="px-4 py-4 text-xs text-muted">Loading...</div>}
        {!loading && tree.length === 0 && (
          <div className="px-4 py-6 text-xs text-muted text-center">No files yet</div>
        )}
        {tree.map(node => renderNode(node, 0))}
      </div>
    </div>
  )
}

function buildTree(files: any[]): TreeNode[] {
  const root: TreeNode[] = []
  const map = new Map<string, TreeNode>()

  for (const f of files) {
    if (f.type === 'directory') {
      const node: TreeNode = { name: f.name, path: f.path, type: 'directory', children: [] }
      map.set(f.path, node)
    } else {
      const node: TreeNode = { name: f.name, path: f.path, type: 'file' }
      map.set(f.path, node)
    }
  }

  for (const f of files) {
    const node = map.get(f.path)
    if (!node) continue
    if (f.type === 'directory') continue
    const parts = f.path.split('/')
    if (parts.length > 1) {
      const parentPath = parts.slice(0, -1).join('/')
      const parent = map.get(parentPath)
      if (parent) {
        parent.children = parent.children || []
        parent.children.push(node)
        continue
      }
    }
    root.push(node)
  }

  for (const f of files) {
    if (f.type !== 'directory') continue
    const node = map.get(f.path)
    if (!node) continue
    const parts = f.path.split('/')
    if (parts.length > 1) {
      const parentPath = parts.slice(0, -1).join('/')
      const parent = map.get(parentPath)
      if (parent) {
        parent.children = parent.children || []
        parent.children.push(node)
        continue
      }
    }
    root.push(node)
  }

  return root
}

function updateTree(tree: TreeNode[], path: string, children: any[]): TreeNode[] {
  return tree.map(node => {
    if (node.path === path) {
      return { ...node, children: children.map((c: any) => ({
        name: c.name, path: c.path, type: c.type, children: c.type === 'directory' ? [] : undefined
      })) }
    }
    if (node.children) {
      return { ...node, children: updateTree(node.children, path, children) }
    }
    return node
  })
}
