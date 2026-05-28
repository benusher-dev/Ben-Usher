import { useState } from 'react'
import { Button } from '../ui/Button'
import { ExerciseRow } from './ExerciseRow'
import { generateId } from '../../utils/dateHelpers'

function emptyExercise() {
  return { id: generateId(), name: '', sets: 3, reps: 10, weight: null }
}

export function TemplateForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [exercises, setExercises] = useState(
    initial?.exercises?.length ? initial.exercises : [emptyExercise()]
  )
  const [errors, setErrors] = useState({})

  function validate() {
    const e = {}
    if (!name.trim()) e.name = 'Workout name is required'
    exercises.forEach((ex, i) => {
      if (!ex.name.trim()) e[`ex_${i}`] = 'Exercise name required'
    })
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSave() {
    if (!validate()) return
    onSave(name.trim(), exercises)
  }

  function updateExercise(index, updated) {
    setExercises(prev => prev.map((ex, i) => (i === index ? updated : ex)))
  }

  function deleteExercise(index) {
    if (exercises.length <= 1) return
    setExercises(prev => prev.filter((_, i) => i !== index))
    setErrors(prev => {
      const next = { ...prev }
      Object.keys(next).filter(k => k.startsWith('ex_')).forEach(k => delete next[k])
      return next
    })
  }

  function addExercise() {
    setExercises(prev => [...prev, emptyExercise()])
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Workout Name</label>
        <input
          type="text"
          placeholder="e.g. Push Day"
          value={name}
          onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: undefined })) }}
          className={`w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.name ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
        />
        {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Exercises</p>
        <div className="flex flex-col gap-3">
          {exercises.map((ex, i) => (
            <div key={ex.id}>
              <ExerciseRow
                exercise={ex}
                index={i}
                onChange={updateExercise}
                onDelete={deleteExercise}
              />
              {errors[`ex_${i}`] && <p className="text-xs text-red-600 mt-1">{errors[`ex_${i}`]}</p>}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addExercise}
          className="mt-3 w-full py-2 border-2 border-dashed border-indigo-300 rounded-xl text-sm text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50 transition-colors font-medium"
        >
          + Add Exercise
        </button>
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="secondary" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button className="flex-1" onClick={handleSave}>
          {initial ? 'Save Changes' : 'Create Workout'}
        </Button>
      </div>
    </div>
  )
}
