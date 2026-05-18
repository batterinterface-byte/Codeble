import { atom } from 'nanostores'

export interface ProjectTemplate {
  id: string
  name: string
  description: string
  icon: string
  language: string
  files: { path: string; content: string }[]
}

export const $templates = atom<ProjectTemplate[]>([
  {
    id: 'react-ts',
    name: 'React + TypeScript',
    description: 'Vite + React 19 + TypeScript starter',
    icon: '⚛',
    language: 'typescript',
    files: [
      { path: 'package.json', content: JSON.stringify({ name: 'react-app', version: '0.0.1', private: true, type: 'module', scripts: { dev: 'vite', build: 'vite build' } }, null, 2) },
      { path: 'index.html', content: '<!doctype html><html><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /><title>React App</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>' },
      { path: 'src/main.tsx', content: 'import React from "react";\nimport ReactDOM from "react-dom/client";\nimport App from "./App";\n\nReactDOM.createRoot(document.getElementById("root")!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);' },
      { path: 'src/App.tsx', content: 'export default function App() {\n  return (\n    <div className="app">\n      <h1>Hello from Devonz!</h1>\n    </div>\n  );\n}' },
      { path: 'src/App.css', content: 'body { margin: 0; font-family: system-ui; background: #0b0d13; color: #e6edf3; }\n.app { min-height: 100vh; display: flex; align-items: center; justify-content: center; }' },
    ],
  },
  {
    id: 'node-ts',
    name: 'Node.js + TypeScript',
    description: 'Express + TypeScript API server',
    icon: '📡',
    language: 'typescript',
    files: [
      { path: 'package.json', content: JSON.stringify({ name: 'node-api', version: '0.0.1', private: true, type: 'module', scripts: { dev: 'tsx watch src/index.ts', start: 'node dist/index.js' } }, null, 2) },
      { path: 'tsconfig.json', content: JSON.stringify({ compilerOptions: { target: 'ES2022', module: 'ESNext', moduleResolution: 'bundler', strict: true, outDir: './dist' } }, null, 2) },
      { path: 'src/index.ts', content: 'import express from "express";\n\nconst app = express();\nconst PORT = process.env.PORT || 3000;\n\napp.get("/", (req, res) => {\n  res.json({ message: "Hello from Devonz Node API!" });\n});\n\napp.listen(PORT, () => {\n  console.log(`Server running on http://localhost:${PORT}`);\n});' },
    ],
  },
  {
    id: 'python',
    name: 'Python FastAPI',
    description: 'FastAPI Python backend',
    icon: '🐍',
    language: 'python',
    files: [
      { path: 'requirements.txt', content: 'fastapi\nuvicorn\n' },
      { path: 'main.py', content: 'from fastapi import FastAPI\n\napp = FastAPI()\n\n@app.get("/")\nasync def root():\n    return {"message": "Hello from Devonz Python API!"}\n\nif __name__ == "__main__":\n    import uvicorn\n    uvicorn.run(app, host="0.0.0.0", port=8000)' },
    ],
  },
  {
    id: 'html-css',
    name: 'HTML + CSS',
    description: 'Simple static site starter',
    icon: '🌐',
    language: 'html',
    files: [
      { path: 'index.html', content: '<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>My Site</title><link rel="stylesheet" href="style.css"></head><body><h1>Hello from Devonz!</h1><script src="app.js"></script></body></html>' },
      { path: 'style.css', content: 'body { margin: 0; font-family: system-ui; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #0b0d13, #131a24); color: #e6edf3; }\nh1 { font-size: 3rem; }' },
      { path: 'app.js', content: 'console.log("Hello from Devonz!");' },
    ],
  },
])

export const $showTemplatePicker = atom(false)
