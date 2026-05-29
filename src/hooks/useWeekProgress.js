import { useLocalStorage } from './useLocalStorage'

export function useWeekProgress() {
  const [progress, setProgress] = useLocalStorage('gwt_week_progress', {})

  function getWeek(templateId) {
    if (!templateId) return 1
    return progress[templateId] ?? 1
  }

  function setWeek(templateId, week) {
    if (!templateId) return
    setProgress(prev => ({ ...prev, [templateId]: Math.max(1, Number(week) || 1) }))
  }

  function incrementWeek(templateId) {
    if (!templateId) return
    setProgress(prev => ({ ...prev, [templateId]: (prev[templateId] ?? 1) + 1 }))
  }

  return { getWeek, setWeek, incrementWeek }
}
