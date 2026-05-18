import { useStore } from '@nanostores/react'
import { $previewUrl, $serverPort, $sessionId } from '../../stores/workspace'

export function PreviewPanel() {
  const previewUrl = useStore($previewUrl)
  const serverPort = useStore($serverPort)

  const src = previewUrl || (serverPort ? `http://localhost:${serverPort}` : null)

  return (
    <div className="h-full flex flex-col bg-deep">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-panel flex-shrink-0">
        <span className="text-xs text-secondary font-mono truncate">
          {src || 'No preview available'}
        </span>
        {!src && (
          <span className="text-xs text-muted">Preview</span>
        )}
      </div>
      <div className="flex-1 overflow-hidden bg-white">
        {src ? (
          <iframe
            src={src}
            className="w-full h-full border-none"
            sandbox="allow-scripts allow-same-origin allow-forms"
            title="Preview"
            loading="lazy"
          />
        ) : (
          <div className="h-full flex items-center justify-center bg-deep">
            <div className="text-center text-secondary">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-sm">Preview Panel</p>
              <p className="text-xs text-muted mt-1">
                Start a project to see a live preview
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
