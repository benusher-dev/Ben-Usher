import { useLocalStorage } from './useLocalStorage'
import { generateId } from '../utils/dateHelpers'
import { BUILTIN_EXERCISES } from '../data/exerciseLibrary'

export function useExerciseLibrary() {
  const [customExercises, setCustomExercises] = useLocalStorage('gwt_custom_exercises', [])

  const allExercises = [
    ...BUILTIN_EXERCISES,
    ...customExercises,
  ]

  function addCustomExercise(name, category = 'other') {
    const trimmed = name.trim()
    const exists = allExercises.some(e => e.name.toLowerCase() === trimmed.toLowerCase())
    if (exists) return
    setCustomExercises(prev => [...prev, { id: generateId(), name: trimmed, category, isCustom: true }])
  }

  function deleteCustomExercise(id) {
    setCustomExercises(prev => prev.filter(e => e.id !== id))
  }

  return { allExercises, customExercises, addCustomExercise, deleteCustomExercise }
}
