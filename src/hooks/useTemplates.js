import { useLocalStorage } from './useLocalStorage'
import { generateId } from '../utils/dateHelpers'
import { SEED_TEMPLATES, SEED_WARMUPS } from '../data/seedTemplates'

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

// Replace old single warm-up exercises with individual per-exercise rows.
const OLD_WU_IDS = new Set(['l1-wu', 'u1-wu', 'sp-wu', 'l2-wu', 'u2-wu'])
;(function migrateWarmupSplit() {
  if (typeof localStorage === 'undefined') return
  if (localStorage.getItem('gwt_warmup_split_migrated')) return
  try {
    const raw = localStorage.getItem('gwt_templates')
    if (!raw) return
    const templates = JSON.parse(raw)
    const updated = templates.map(t => {
      const newWarmups = SEED_WARMUPS[t.id]
      if (!newWarmups) return t
      const rest = t.exercises.filter(ex => !OLD_WU_IDS.has(ex.id))
      return { ...t, exercises: [...newWarmups, ...rest] }
    })
    localStorage.setItem('gwt_templates', JSON.stringify(updated))
    localStorage.setItem('gwt_checklist_migrated', '1')
    localStorage.setItem('gwt_warmup_migrated', '1')
    localStorage.setItem('gwt_warmup_split_migrated', '1')
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
