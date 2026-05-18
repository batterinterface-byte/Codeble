import { Routes, Route, Navigate } from 'react-router-dom'
import { Workbench } from './components/workbench/Workbench'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useTheme } from './hooks/useTheme'
import { CommandPalette } from './components/palette/CommandPalette'
import { KeyboardShortcutsModal } from './components/shortcuts/KeyboardShortcutsModal'
import { SearchPanel } from './components/search/SearchPanel'
import { TemplatePicker } from './components/templates/TemplatePicker'
import { CollaborationPanel } from './components/collab/CollaborationPanel'
import { useStore } from '@nanostores/react'
import { $showSearch } from './stores/search'
import { $showShortcuts } from './stores/shortcuts'
import { $showTemplatePicker } from './stores/templates'

export function App() {
  useKeyboardShortcuts()
  useTheme()
  const showSearch = useStore($showSearch)
  const showShortcuts = useStore($showShortcuts)
  const showTemplates = useStore($showTemplatePicker)

  return (
    <>
      <Routes>
        <Route path="/" element={<Workbench />} />
        <Route path="/project/:projectId" element={<Workbench />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global overlays */}
      <CommandPalette />
      {showSearch && <SearchPanel />}
      {showShortcuts && <KeyboardShortcutsModal />}
      {showTemplates && <TemplatePicker />}
      <CollaborationPanel />
    </>
  )
}
