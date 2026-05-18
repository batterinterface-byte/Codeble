import { useStore } from '@nanostores/react'
import { $templates, $showTemplatePicker } from '../../stores/templates'
import { $projectName } from '../../stores/workspace'
import { api } from '../../lib/api'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'
import { Button } from '../ui/button'
import { Separator } from '../ui/separator'
import { toast } from 'sonner'

export function TemplatePicker() {
  const templates = useStore($templates)

  const handleSelect = async (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (!template) return

    try {
      const project = await api.projects.create(template.name.replace(/\s+/g, '-').toLowerCase())
      toast.success(`Creating ${template.name}...`)

      for (const file of template.files) {
        await api.files.write(`${project.name}/${file.path}`, file.content)
      }

      $projectName.set(template.name)
      toast.success(`Project "${template.name}" created!`)
      $showTemplatePicker.set(false)
    } catch (e: any) {
      toast.error(`Failed: ${e.message}`)
    }
  }

  return (
    <Dialog open={$showTemplatePicker.get()} onOpenChange={(o) => { if (!o) $showTemplatePicker.set(false) }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>New Project from Template</DialogTitle>
          <DialogDescription>Choose a starter template to bootstrap your project</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-2">
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => handleSelect(t.id)}
              className="p-4 rounded-xl border border-border/50 bg-surface/30 hover:bg-hover hover:border-accent/30 transition-all text-left cursor-pointer"
            >
              <div className="text-2xl mb-2">{t.icon}</div>
              <div className="text-sm font-medium text-primary">{t.name}</div>
              <div className="text-xs text-secondary mt-1">{t.description}</div>
              <div className="flex gap-1 mt-2">
                <span className="px-1.5 py-0.5 rounded text-xs bg-accent/10 text-accent font-mono">{t.language}</span>
                <span className="px-1.5 py-0.5 rounded text-xs bg-surface text-muted font-mono">{t.files.length} files</span>
              </div>
            </button>
          ))}
        </div>
        <Separator />
        <div className="flex justify-end">
          <Button variant="ghost" onClick={() => $showTemplatePicker.set(false)}>Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
