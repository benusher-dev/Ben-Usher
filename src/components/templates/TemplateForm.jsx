import { useState, useMemo } from 'react'
import { Button } from '../ui/Button'
import { ExerciseRow } from './ExerciseRow'
import { ExercisePicker } from './ExercisePicker'
import { generateId } from '../../utils/dateHelpers'

export function TemplateForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [exercises, setExercises] = useState(
    initial?.exercises?.length ? initial.exercises : []
  )
  const [errors, setErrors] = useState({})
  const [showPicker, setShowPicker] = useState(false)
  const [pickerSupersetId, setPickerSupersetId] = useState(null)

  // Group flat exercises array into display groups
  const displayGroups = useMemo(() => {
    const groups = []
    const ssMap = {}
    exercises.forEach((ex, i) => {
      if (!ex.supersetId) {
        groups.push({ type: 'single', items: [{ ex, i }] })
      } else {
        if (!ssMap[ex.supersetId]) {
          const g = { type: 'superset', supersetId: ex.supersetId, items: [] }
          ssMap[ex.supersetId] = g
          groups.push(g)
        }
        ssMap[ex.supersetId].items.push({ ex, i })
      }
    })
    return groups
  }, [exercises])

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
    setExercises(prev => {
      const target = prev[index]
      if (target.supersetId) {
        const groupSize = prev.filter(e => e.supersetId === target.supersetId).length
        // Removing from a 2-exercise superset dissolves the whole group
        if (groupSize <= 2) {
          return prev
            .filter((_, i) => i !== index)
            .map(e => e.supersetId === target.supersetId ? { ...e, supersetId: null } : e)
        }
      }
      return prev.filter((_, i) => i !== index)
    })
    setErrors(prev => {
      const next = { ...prev }
      Object.keys(next).filter(k => k.startsWith('ex_')).forEach(k => delete next[k])
      return next
    })
  }

  function openPicker(supersetId = null) {
    setPickerSupersetId(supersetId)
    setShowPicker(true)
  }

  function addFromLibrary(exercise) {
    setExercises(prev => [...prev, {
      id: generateId(),
      ...exercise,
      supersetId: pickerSupersetId ?? null,
    }])
    setErrors(prev => ({ ...prev, exercises: undefined }))
  }

  function addCustomBlank(supersetId = null) {
    setExercises(prev => [...prev, {
      id: generateId(), name: '', sets: 3, reps: 10, weight: null, supersetId,
    }])
    setErrors(prev => ({ ...prev, exercises: undefined }))
  }

  function addSuperset() {
    const supersetId = generateId()
    setExercises(prev => [
      ...prev,
      { id: generateId(), name: '', sets: 3, reps: 10, weight: null, supersetId },
      { id: generateId(), name: '', sets: 3, reps: 10, weight: null, supersetId },
    ])
    setErrors(prev => ({ ...prev, exercises: undefined }))
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Workout name */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Workout Name</label>
          <input
            type="text"
            placeholder="e.g. Push Day"
            value={name}
            onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: undefined })) }}
            className={`w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 ${
              errors.name ? 'border-red-400 bg-red-50' : 'border-gray-200 dark:border-gray-600'
            }`}
          />
          {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
        </div>

        {/* Exercise list */}
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Exercises</p>

          {exercises.length === 0 && (
            <div className="py-8 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl mb-3">
              <p className="text-sm text-gray-400">No exercises yet</p>
              <p className="text-xs text-gray-300 dark:text-gray-600 mt-0.5">Browse the library, add custom, or create a superset</p>
            </div>
          )}

          {displayGroups.length > 0 && (
            <div className="flex flex-col gap-3 mb-3">
              {displayGroups.map((group, gi) => {
                if (group.type === 'single') {
                  const { ex, i } = group.items[0]
                  return (
                    <div key={ex.id}>
                      <ExerciseRow exercise={ex} index={i} onChange={updateExercise} onDelete={deleteExercise} />
                      {errors[`ex_${i}`] && <p className="text-xs text-red-600 mt-1">{errors[`ex_${i}`]}</p>}
                    </div>
                  )
                }

                // Superset group
                return (
                  <div key={group.supersetId} className="border-l-4 border-indigo-400 rounded-r-2xl bg-indigo-50/50 dark:bg-indigo-900/20 pl-3 pr-3 pt-3 pb-3">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex gap-0.5 items-center">
                        <div className="h-3.5 w-1 bg-indigo-500 rounded-full" />
                        <div className="h-3.5 w-1 bg-indigo-500 rounded-full" />
                      </div>
                      <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Superset</span>
                      <span className="text-indigo-300 text-xs">·</span>
                      <span className="text-xs text-indigo-400">{group.items.length} exercises</span>
                    </div>

                    <div className="flex flex-col gap-2">
                      {group.items.map(({ ex, i }) => (
                        <div key={ex.id}>
                          <ExerciseRow exercise={ex} index={i} onChange={updateExercise} onDelete={deleteExercise} />
                          {errors[`ex_${i}`] && <p className="text-xs text-red-600 mt-1">{errors[`ex_${i}`]}</p>}
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => openPicker(group.supersetId)}
                        className="flex-1 py-1.5 text-xs font-semibold text-indigo-600 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
                      >
                        + Browse library
                      </button>
                      <button
                        type="button"
                        onClick={() => addCustomBlank(group.supersetId)}
                        className="px-3 py-1.5 text-xs font-semibold text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        + Custom
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {errors.exercises && <p className="text-xs text-red-600 mb-2">{errors.exercises}</p>}

          {/* Add buttons */}
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => openPicker(null)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M4 6h16M4 10h16M4 14h10" />
              </svg>
              Browse Library
            </button>
            <button
              type="button"
              onClick={() => addCustomBlank(null)}
              className="px-3 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors font-medium"
            >
              + Custom
            </button>
            <button
              type="button"
              onClick={addSuperset}
              className="px-3 py-2.5 border-2 border-dashed border-indigo-300 rounded-xl text-sm text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50 transition-colors font-medium whitespace-nowrap"
            >
              ⚡ Superset
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
