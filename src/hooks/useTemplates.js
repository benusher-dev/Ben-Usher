import { useLocalStorage } from './useLocalStorage'
import { generateId } from '../utils/dateHelpers'
import { SEED_TEMPLATES } from '../data/seedTemplates'

// One-time seed: runs before React renders, safe in this client-only app.
;(function seedOffSzn() {
  if (typeof localStorage === 'undefined') return
  if (localStorage.getItem('gwt_offszn_seeded')) return
  try {
    const raw = localStorage.getItem('gwt_templates')
    const existing = raw ? JSON.parse(raw) : []
    localStorage.setItem('gwt_templates', JSON.stringify([...SEED_TEMPLATES, ...existing]))
    localStorage.setItem('gwt_offszn_seeded', '1')
  } catch {}
})()

export function useTemplates() {
  const [templates, setTemplates] = useLocalStorage('gwt_templates', [])

  function addTemplate(name, exercises) {
    const now = new Date().toISOString()
    const template = {
      id: generateId(),
      name,
      createdAt: now,
      updatedAt: now,
      exercises: exercises.map(ex => ({ ...ex, id: ex.id || generateId() })),
    }
    setTemplates(prev => [template, ...prev])
    return template
  }

  function updateTemplate(id, name, exercises) {
    setTemplates(prev =>
      prev.map(t =>
        t.id === id
          ? {
              ...t,
              name,
              exercises: exercises.map(ex => ({ ...ex, id: ex.id || generateId() })),
              updatedAt: new Date().toISOString(),
            }
          : t
      )
    )
  }

  function deleteTemplate(id) {
    setTemplates(prev => prev.filter(t => t.id !== id))
  }

  return { templates, addTemplate, updateTemplate, deleteTemplate }
}
