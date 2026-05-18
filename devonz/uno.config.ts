import { defineConfig, presetUno } from 'unocss'

export default defineConfig({
  presets: [presetUno()],
  rules: [
    ['bg-deep', { 'background-color': '#0b0d13' }],
    ['bg-panel', { 'background-color': '#131a24' }],
    ['bg-surface', { 'background-color': '#1c2333' }],
    ['bg-hover', { 'background-color': '#242d3d' }],
    ['text-primary', { color: '#e6edf3' }],
    ['text-secondary', { color: '#8b949e' }],
    ['text-accent', { color: '#3b82f6' }],
    ['border-panel', { 'border-color': '#2d3748' }],
  ],
  shortcuts: {
    'btn': 'px-4 py-2 rounded-lg bg-accent text-white font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-none',
    'btn-ghost': 'px-3 py-1.5 rounded-lg bg-transparent text-secondary hover:bg-hover hover:text-primary transition-all cursor-pointer border-none font-medium',
    'panel': 'bg-panel border border-panel rounded-xl',
    'input': 'bg-deep border border-panel rounded-lg px-3 py-2 text-primary placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent w-full',
  },
  theme: {
    colors: {
      deep: '#0b0d13',
      panel: '#131a24',
      surface: '#1c2333',
      hover: '#242d3d',
      primary: '#e6edf3',
      secondary: '#8b949e',
      accent: '#3b82f6',
      border: '#2d3748',
      green: '#22c55e',
      orange: '#f59e0b',
      red: '#ef4444',
      purple: '#a855f7',
      navy: '#1e293b',
    },
  },
})
