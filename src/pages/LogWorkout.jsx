import { useState, useRef, useEffect } from 'react'
import { useApp } from '../store/AppContext'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { TemplateCard } from '../components/templates/TemplateCard'
import { WorkoutSummary } from '../components/sessions/WorkoutSummary'
import { generateId } from '../utils/dateHelpers'

function buildLogExercises(template) {
  return template.exercises.map(ex => ({
    id: generateId(),
    exerciseId: ex.id,
    name: ex.name,
    sets: Array.from({ length: Math.max(1, ex.sets || 1) }, () => ({
      reps: ex.reps ?? '',
      weight: ex.weight ?? '',
    })),
  }))
}

function SetRow({ set, setIndex, onChange }) {
  return (
    <div className="grid grid-cols-3 gap-2 items-center py-1">
      <span className="text-sm text-gray-400 font-medium text-center">{setIndex + 1}</span>
      <input
        type="number"
        min="0"
        placeholder="Reps"
        value={set.reps}
        onChange={e => onChange({ ...set, reps: e.target.value === '' ? '' : Number(e.target.value) })}
        className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <input
        type="number"
        min="0"
        step="0.5"
        placeholder="kg"
        value={set.weight}
        onChange={e => onChange({ ...set, weight: e.target.value === '' ? '' : Number(e.target.value) })}
        className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  )
}

export function LogWorkout() {
  const { templates, sessions, logTemplateId, setLogTemplateId, addSession, setActivePage } = useApp()
  const [step, setStep] = useState(1)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [logExercises, setLogExercises] = useState([])
  const [notes, setNotes] = useState('')
  const [summaryData, setSummaryData] = useState(null)
  const startedAtRef = useRef(null)

  // Sync with logTemplateId set externally (e.g. from Workouts page)
  useEffect(() => {
    if (logTemplateId) {
      const t = templates.find(t => t.id === logTemplateId)
      if (t) {
        setSelectedTemplate(t)
        setLogExercises(buildLogExercises(t))
        setStep(2)
        if (!startedAtRef.current) {
          startedAtRef.current = new Date().toISOString()
        }
      }
    } else {
      setStep(1)
      setSelectedTemplate(null)
      setLogExercises([])
      setSummaryData(null)
      startedAtRef.current = null
    }
  }, [logTemplateId]) // eslint-disable-line react-hooks/exhaustive-deps

  function selectTemplate(template) {
    setSelectedTemplate(template)
    setLogExercises(buildLogExercises(template))
    setLogTemplateId(template.id)
    setStep(2)
    startedAtRef.current = new Date().toISOString()
  }

  function updateSet(exIndex, setIndex, updatedSet) {
    setLogExercises(prev =>
      prev.map((ex, i) =>
        i === exIndex
          ? { ...ex, sets: ex.sets.map((s, j) => (j === setIndex ? updatedSet : s)) }
          : ex
      )
    )
  }

  function addSet(exIndex) {
    setLogExercises(prev =>
      prev.map((ex, i) =>
        i === exIndex ? { ...ex, sets: [...ex.sets, { reps: '', weight: '' }] } : ex
      )
    )
  }

  function removeSet(exIndex, setIndex) {
    setLogExercises(prev =>
      prev.map((ex, i) =>
        i === exIndex && ex.sets.length > 1
          ? { ...ex, sets: ex.sets.filter((_, j) => j !== setIndex) }
          : ex
      )
    )
  }

  function handleFinish() {
    if (!selectedTemplate) return

    // Capture previous session for the same template BEFORE adding the new one
    const prevSession = sessions
      .filter(s => s.templateId === selectedTemplate.id)
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0] ?? null

    const sessionPayload = {
      templateId: selectedTemplate.id,
      templateName: selectedTemplate.name,
      notes: notes.trim(),
      exercises: logExercises.map(ex => ({
        ...ex,
        sets: ex.sets.map(s => ({
          reps: Number(s.reps) || 0,
          weight: s.weight === '' ? null : Number(s.weight),
        })),
      })),
    }

    const newSession = addSession(sessionPayload, startedAtRef.current)
    startedAtRef.current = null
    setSummaryData({ session: newSession, previousSession: prevSession })
    setStep(3)
  }

  function handleCancel() {
    startedAtRef.current = null
    setLogTemplateId(null)
  }

  function handleSummaryDone() {
    setLogTemplateId(null)
    setActivePage('history')
  }

  // Step 1: Template picker
  if (step === 1) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Log Workout" />
        <div className="flex-1 overflow-y-auto px-4 py-4 max-w-lg mx-auto w-full">
          {templates.length === 0 ? (
            <EmptyState
              icon="📋"
              title="No templates yet"
              description="Create a workout template first, then log it here"
              action="Create Workout"
              onAction={() => setActivePage('workouts')}
            />
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-gray-500 font-medium">Choose a workout to log:</p>
              {templates.map(t => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  onSelect={() => selectTemplate(t)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Step 3: Summary
  if (step === 3 && summaryData) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title={selectedTemplate?.name ?? 'Summary'} />
        <div className="flex-1 overflow-y-auto px-4 py-4 max-w-lg mx-auto w-full">
          <WorkoutSummary
            session={summaryData.session}
            previousSession={summaryData.previousSession}
            onDone={handleSummaryDone}
          />
        </div>
      </div>
    )
  }

  // Step 2: Logging form
  if (!selectedTemplate) return null

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={selectedTemplate.name}
        action={
          <button
            onClick={handleCancel}
            className="text-sm text-gray-500 hover:text-gray-700 font-medium"
          >
            Cancel
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-lg mx-auto w-full">
        <div className="flex flex-col gap-4 pb-6">
          {logExercises.map((ex, exIdx) => (
            <div key={ex.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="font-semibold text-gray-900 mb-3">{ex.name}</p>
              <div className="grid grid-cols-3 gap-2 mb-1">
                <span className="text-xs text-gray-400 font-medium text-center">Set</span>
                <span className="text-xs text-gray-400 font-medium text-center">Reps</span>
                <span className="text-xs text-gray-400 font-medium text-center">Weight (kg)</span>
              </div>
              {ex.sets.map((set, setIdx) => (
                <div key={setIdx} className="flex items-center gap-1">
                  <div className="flex-1">
                    <SetRow
                      set={set}
                      setIndex={setIdx}
                      onChange={updated => updateSet(exIdx, setIdx, updated)}
                    />
                  </div>
                  {ex.sets.length > 1 && (
                    <button
                      onClick={() => removeSet(exIdx, setIdx)}
                      className="p-1 text-gray-300 hover:text-red-400 flex-shrink-0"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => addSet(exIdx)}
                className="mt-2 w-full py-1.5 border border-dashed border-gray-200 rounded-lg text-xs text-gray-400 hover:text-indigo-600 hover:border-indigo-300 transition-colors"
              >
                + Add Set
              </button>
            </div>
          ))}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <label className="text-sm font-medium text-gray-700 block mb-2">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="How did it go?"
              rows={3}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <Button size="lg" className="w-full" onClick={handleFinish}>
            Finish Workout
          </Button>
        </div>
      </div>
    </div>
  )
}
