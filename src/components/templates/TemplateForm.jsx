import { useState } from 'react'
import { Button } from '../ui/Button'
import { ExerciseRow } from './ExerciseRow'
import { ExercisePicker } from './ExercisePicker'
import { generateId } from '../../utils/dateHelpers'

function emptyExercise() {
  return { id: generateId(), name: '', sets: 3, reps: 10, weight: null }
}

export function TemplateForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [exercises, setExercises] = useState(
    initial?.exercises?.length ? initial.exercises : []
  )
  const [errors, setErrors] = useState({})
  const [showPicker, setShowPicker] = useState(false)

  function validate() {
    const e = {}
    if (!name.trim()) e.name = 'Workout name is required'
    if (exercises.length === 0) e.exercises = 'Add at least one exercise'
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

  function addFromLibrary(exercise) {
    setExercises(prev => [...prev, { id: generateId(), ...exercise }])
    setErrors(prev => ({ ...prev, exercises: undefined }))
  }

  function addCustomBlank() {
    setExercises(prev => [...prev, emptyExercise()])
    setErrors(prev => ({ ...prev, exercises: undefined }))
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Workout Name</label>
          <input
            type="text"
            placeholder="e.g. Push Day"
            value={name}
            onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: undefined })) }}
            className={`w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              errors.name ? 'border-red-400 bg-red-50' : 'border-gray-200'
            }`}
          />
          {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Exercises</p>

          {exercises.length === 0 && (
            <div className="py-8 text-center border-2 border-dashed border-gray-200 rounded-2xl mb-3">
              <p className="text-sm text-gray-400">No exercises yet</p>
              <p className="text-xs text-gray-300 mt-0.5">Browse the library or add a custom one</p>
            </div>
          )}

          {exercises.length > 0 && (
            <div className="flex flex-col gap-3 mb-3">
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
          )}

          {errors.exercises && <p className="text-xs text-red-600 mb-2">{errors.exercises}</p>}

          {/* Add buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowPicker(true)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 active:bg-indigo-800 transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M4 6h16M4 10h16M4 14h10" />
              </svg>
              Browse Library
            </button>
            <button
              type="button"
              onClick={addCustomBlank}
              className="px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors font-medium"
            >
              + Custom
            </button>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1" onClick={onCancel}>Cancel</Button>
          <Button className="flex-1" onClick={handleSave}>
            {initial ? 'Save Changes' : 'Create Workout'}
          </Button>
        </div>
      </div>

      <ExercisePicker
        open={showPicker}
        onAdd={addFromLibrary}
        onClose={() => setShowPicker(false)}
      />
    </>
  )
}
