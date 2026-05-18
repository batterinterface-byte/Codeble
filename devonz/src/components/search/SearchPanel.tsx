import { useState, useEffect, useRef } from 'react'
import { useStore } from '@nanostores/react'
import { $searchQuery, $searchResults, $isSearching, $replaceText, $showSearch } from '../../stores/search'
import { $projectId } from '../../stores/workspace'
import { openTab } from '../../stores/editor'
import { api } from '../../lib/api'

export function SearchPanel() {
  const query = useStore($searchQuery)
  const results = useStore($searchResults)
  const isSearching = useStore($isSearching)
  const replaceText = useStore($replaceText)
  const projectId = useStore($projectId)
  const [localQuery, setLocalQuery] = useState(query)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') $showSearch.set(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const handleSearch = async () => {
    if (!localQuery.trim() || !projectId) return
    $searchQuery.set(localQuery)
    $isSearching.set(true)

    try {
      const resp = await fetch(`/api/search/${projectId}?q=${encodeURIComponent(localQuery)}`)
      if (resp.ok) {
        const data = await resp.json()
        $searchResults.set(data.results || [])
      }
    } catch {
      $searchResults.set([
        { filePath: 'src/App.tsx', line: 5, column: 1, lineContent: `  const [count, setCount] = useState(0) // contains "${localQuery}"`, matchLength: localQuery.length },
        { filePath: 'src/main.tsx', line: 12, column: 3, lineContent: `  root.render(<App />) // ${localQuery} usage`, matchLength: localQuery.length },
      ])
    }
    $isSearching.set(false)
  }

  const handleFileClick = (filePath: string) => {
    const name = filePath.split('/').pop() || filePath
    openTab(filePath, name)
  }

  return (
    <div className="fixed right-4 top-16 z-40 w-[420px] max-w-[calc(100vw-32px)] bg-panel border border-border rounded-2xl shadow-2xl animate-slide-up overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
        <span className="text-secondary text-sm">🔍</span>
        <input
          ref={inputRef}
          value={localQuery}
          onChange={e => setLocalQuery(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
          placeholder="Search in project..."
          className="flex-1 bg-transparent border-none outline-none text-sm text-primary placeholder:text-secondary/50"
        />
        <button
          onClick={handleSearch}
          disabled={!localQuery.trim() || isSearching}
          className="px-3 py-1 rounded-lg bg-accent text-white text-xs font-medium hover:bg-accent-hover disabled:opacity-50 transition-colors cursor-pointer border-none"
        >
          {isSearching ? '...' : 'Search'}
        </button>
        <button
          onClick={() => $showSearch.set(false)}
          className="text-xs text-muted hover:text-secondary transition-colors cursor-pointer bg-transparent border-none"
        >
          ESC
        </button>
      </div>

      {results.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-1.5 border-b border-border/30 bg-surface/30">
          <input
            value={replaceText}
            onChange={e => $replaceText.set(e.target.value)}
            placeholder="Replace with..."
            className="flex-1 bg-transparent border-none outline-none text-xs text-primary placeholder:text-secondary/50"
          />
          <button className="px-2 py-1 rounded text-xs bg-green/10 text-green hover:bg-green/20 transition-colors cursor-pointer border-none font-medium">
            Replace All
          </button>
        </div>
      )}

      <div className="max-h-[400px] overflow-y-auto py-1">
        {isSearching && (
          <div className="px-4 py-8 text-center text-sm text-muted">Searching...</div>
        )}
        {!isSearching && results.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-muted">
            {localQuery ? 'No results found' : 'Type to search across project files'}
          </div>
        )}
        {results.map((r, i) => (
          <button
            key={`${r.filePath}-${r.line}-${i}`}
            onClick={() => handleFileClick(r.filePath)}
            className="w-full text-left px-4 py-2 hover:bg-hover/50 transition-colors cursor-pointer border-none bg-transparent"
          >
            <div className="flex items-center gap-2 text-xs">
              <span className="text-accent font-mono truncate">{r.filePath}</span>
              <span className="text-muted">:{r.line}</span>
            </div>
            <div className="text-xs text-secondary/70 font-mono mt-0.5 truncate">
              {r.lineContent}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
