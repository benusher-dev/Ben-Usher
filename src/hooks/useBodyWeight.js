import { useLocalStorage } from './useLocalStorage'
import { generateId } from '../utils/dateHelpers'

export function useBodyWeight() {
  const [entries, setEntries] = useLocalStorage('gwt_bodyweight', [])

  function logWeight(weight) {
    const todayStr = new Date().toDateString()
    setEntries(prev => {
      const existing = prev.findIndex(e => new Date(e.date).toDateString() === todayStr)
      const entry = { id: existing >= 0 ? prev[existing].id : generateId(), date: new Date().toISOString(), weight }
      if (existing >= 0) return prev.map((e, i) => i === existing ? entry : e)
      return [...prev, entry]
    })
  }

  function deleteEntry(id) {
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  const sorted = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date))

  return { entries: sorted, logWeight, deleteEntry }
}
