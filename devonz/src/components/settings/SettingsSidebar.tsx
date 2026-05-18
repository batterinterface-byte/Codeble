import { useStore } from '@nanostores/react'
import { $settings, updateSetting, LLMProvider } from '../../stores/settings'
import { Sheet, SheetContent, SheetClose } from '../ui/sheet'
import { Button } from '../ui/button'
import { Separator } from '../ui/separator'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select'

interface SettingsSidebarProps {
  open: boolean
  onClose: () => void
}

const providers: { value: LLMProvider; label: string }[] = [
  { value: 'ollama', label: 'Ollama' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'opencode', label: 'OpenCode' },
]

export function SettingsSidebar({ open, onClose }: SettingsSidebarProps) {
  const settings = useStore($settings)

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="p-0 flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-primary">Settings</h2>
          <SheetClose asChild>
            <Button variant="ghost" size="sm">Close</Button>
          </SheetClose>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {/* Theme */}
          <section>
            <h3 className="text-sm font-medium text-primary mb-3">Theme</h3>
            <div className="flex gap-2">
              {(['dark', 'light', 'system'] as const).map((theme) => (
                <button
                  key={theme}
                  onClick={() => updateSetting('theme', theme)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                    settings.theme === theme
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border bg-surface text-secondary hover:text-primary'
                  }`}
                >
                  {theme.charAt(0).toUpperCase() + theme.slice(1)}
                </button>
              ))}
            </div>
          </section>

          <Separator />

          {/* LLM Provider */}
          <section>
            <h3 className="text-sm font-medium text-primary mb-3">AI Provider</h3>
            <Select
              value={settings.llmProvider}
              onValueChange={(v) => updateSetting('llmProvider', v as LLMProvider)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {providers.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </section>

          {/* Model */}
          <section>
            <h3 className="text-sm font-medium text-primary mb-3">Model</h3>
            <input
              className="input"
              value={settings.llmModel}
              onChange={(e) => updateSetting('llmModel', e.target.value)}
              placeholder="codellama, gpt-4o, claude-sonnet-4..."
            />
          </section>

          {/* API Key */}
          <section>
            <h3 className="text-sm font-medium text-primary mb-3">API Key</h3>
            <input
              className="input"
              type="password"
              value={settings.llmApiKey}
              onChange={(e) => updateSetting('llmApiKey', e.target.value)}
              placeholder="sk-... (optional for cloud)"
            />
            <p className="text-xs text-muted mt-1">Leave empty for Ollama or mock mode</p>
          </section>

          {/* Base URL */}
          <section>
            <h3 className="text-sm font-medium text-primary mb-3">Base URL</h3>
            <input
              className="input"
              value={settings.llmBaseUrl}
              onChange={(e) => updateSetting('llmBaseUrl', e.target.value)}
              placeholder="http://localhost:11434/api"
            />
          </section>

          <Separator />

          {/* Editor */}
          <section>
            <h3 className="text-sm font-medium text-primary mb-3">Editor</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm text-secondary">Font Size</label>
                <input
                  type="number"
                  className="input w-20 text-center"
                  value={settings.fontSize}
                  onChange={(e) => updateSetting('fontSize', parseInt(e.target.value) || 14)}
                  min={10}
                  max={24}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-secondary">Tab Size</label>
                <input
                  type="number"
                  className="input w-20 text-center"
                  value={settings.tabSize}
                  onChange={(e) => updateSetting('tabSize', parseInt(e.target.value) || 2)}
                  min={1}
                  max={8}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-secondary">Word Wrap</label>
                <button
                  onClick={() => updateSetting('wordWrap', !settings.wordWrap)}
                  className={`w-10 h-5 rounded-full transition-colors ${
                    settings.wordWrap ? 'bg-accent' : 'bg-border'
                  } relative`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      settings.wordWrap ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>
        </div>

        <div className="p-4 border-t border-border">
          <p className="text-xs text-muted text-center">
            Settings are saved locally. API keys are never stored server-side.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
