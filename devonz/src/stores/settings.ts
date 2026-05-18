import { atom } from 'nanostores'

export type ThemeMode = 'dark' | 'light' | 'system'
export type LLMProvider = 'ollama' | 'openai' | 'anthropic' | 'openrouter'

interface Settings {
  theme: ThemeMode
  llmProvider: LLMProvider
  llmModel: string
  llmApiKey: string
  llmBaseUrl: string
  fontSize: number
  tabSize: number
  wordWrap: boolean
}

const defaultSettings: Settings = {
  theme: 'dark',
  llmProvider: 'ollama',
  llmModel: 'codellama',
  llmApiKey: '',
  llmBaseUrl: '',
  fontSize: 14,
  tabSize: 2,
  wordWrap: true,
}

export const $settings = atom<Settings>({ ...defaultSettings })

export function updateSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
  const current = $settings.get()
  $settings.set({ ...current, [key]: value })
  persistSettings()
}

function persistSettings() {
  try {
    localStorage.setItem('devonz-settings', JSON.stringify($settings.get()))
  } catch { /* ignore */ }
}

export function loadSettings() {
  try {
    const saved = localStorage.getItem('devonz-settings')
    if (saved) {
      const parsed = JSON.parse(saved)
      $settings.set({ ...defaultSettings, ...parsed })
    }
  } catch { /* ignore */ }
}
