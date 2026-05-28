import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useApp } from '../store/AppContext'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { TemplateCard } from '../components/templates/TemplateCard'
import { WorkoutSummary } from '../components/sessions/WorkoutSummary'
import { generateId } from '../utils/dateHelpers'

const REST_PRESETS = [
  { label: '30s', seconds: 30 },
  { label: '45s', seconds: 45 },
  { label: '1m',  seconds: 60 },
  { label: '90s', seconds: 90 },
  { label: '2m',  seconds: 120 },
  { label: '3m',  seconds: 180 },
]

function buildLogExercises(template) {
  return template.exercises.map(ex => ({
    id: generateId(),
    exerciseId: ex.id,
    name: ex.name,
    restSeconds: ex.restSeconds ?? 90,
    supersetId: ex.supersetId ?? null,
    sets: Array.from({ length: Math.max(1, ex.sets || 1) }, () => ({
      reps: ex.reps ?? '',
      weight: ex.weight ?? '',
    })),
  }))
}

function formatCountdown(s) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return m > 0 ? `${m}:${String(sec).padStart(2, '0')}` : `${s}s`
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    ;[0, 0.2, 0.4].forEach(offset => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.4, ctx.currentTime + offset)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.15)
      osc.start(ctx.currentTime + offset)
      osc.stop(ctx.currentTime + offset + 0.15)
    })
  } catch {}
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

function RestTimerRow({ timerId, restSeconds, onChangeRest, timer, onStart, onStop }) {
  const isActive = timer?.timerId === timerId && !timer.done
  const isDone  = timer?.timerId === timerId &&  timer.done

  if (isActive) {
    const progress = timer.remaining / timer.total
    const circumference = 2 * Math.PI * 10
    return (
      <div className="mt-3 flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2">
        <div className="flex items-center gap-3">
          {/* Mini circular progress */}
          <svg width="28" height="28" viewBox="0 0 28 28" className="flex-shrink-0">
            <circle cx="14" cy="14" r="10" fill="none" stroke="#e0e7ff" strokeWidth="3" />
            <circle
              cx="14" cy="14" r="10"
              fill="none" stroke="#6366f1" strokeWidth="3"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              strokeLinecap="round"
              transform="rotate(-90 14 14)"
            />
          </svg>
          <span className="text-indigo-700 font-bold text-xl tabular-nums leading-none">
            {formatCountdown(timer.remaining)}
          </span>
          <span className="text-indigo-400 text-xs">rest</span>
        </div>
        <button
          onClick={onStop}
          className="text-xs text-indigo-500 font-semibold hover:text-indigo-700 px-2 py-1 rounded-lg hover:bg-indigo-100 transition-colors"
        >
          Skip
        </button>
      </div>
    )
  }

  if (isDone) {
    return (
      <div className="mt-3 flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span className="text-emerald-700 font-semibold text-sm">Rest complete — go!</span>
        </div>
        <button
          onClick={onStop}
          className="text-xs text-emerald-600 font-semibold hover:text-emerald-800 px-2 py-1 rounded-lg hover:bg-emerald-100 transition-colors"
        >
          Dismiss
        </button>
      </div>
    )
  }

  return (
    <div className="mt-3 flex items-center gap-2">
      <svg className="h-4 w-4 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
      <div className="flex gap-1 overflow-x-auto flex-1" style={{ scrollbarWidth: 'none' }}>
        {REST_PRESETS.map(p => (
          <button
            key={p.seconds}
            onClick={() => onChangeRest(timerId, p.seconds)}
            className={`flex-shrink-0 px-2 py-1 rounded-lg text-xs font-semibold transition-colors ${
              restSeconds === p.seconds
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <button
        onClick={() => onStart(timerId, restSeconds)}
        className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg transition-colors"
      >
        Start
      </button>
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

  // Group flat logExercises into display groups (mirrors TemplateForm logic)
  const exerciseGroups = useMemo(() => {
    const groups = []
    const ssMap = {}
    logExercises.forEach((ex, i) => {
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
  }, [logExercises])

  // Rest timer state
  const [timer, setTimer] = useState(null) // { timerId, remaining, total, done }
  const timerRef = useRef(null)

  const startedAtRef = useRef(null)

  // Consume logTemplateId as a one-shot signal (e.g. launched from Workouts page)
  useEffect(() => {
    if (!logTemplateId) return
    const t = templates.find(t => t.id === logTemplateId)
    setLogTemplateId(null) // consume immediately
    if (t) beginWorkout(t)
  }, [logTemplateId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup timer on unmount
  useEffect(() => () => clearInterval(timerRef.current), [])

  function beginWorkout(template) {
    clearInterval(timerRef.current)
    setSelectedTemplate(template)
    setLogExercises(buildLogExercises(template))
    setNotes('')
    setTimer(null)
    setStep(2)
    startedAtRef.current = new Date().toISOString()
  }

  function selectTemplate(template) {
    beginWorkout(template)
  }

  // Timer controls — timerId is either `ex_${logExercise.id}` or `ss_${supersetId}`
  function startTimer(timerId, seconds) {
    clearInterval(timerRef.current)
    setTimer({ timerId, remaining: seconds, total: seconds, done: false })
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (!prev) return null
        if (prev.remaining <= 1) {
          clearInterval(timerRef.current)
          playBeep()
          return { ...prev, remaining: 0, done: true }
        }
        return { ...prev, remaining: prev.remaining - 1 }
      })
    }, 1000)
  }

  function stopTimer() {
    clearInterval(timerRef.current)
    setTimer(null)
  }

  // For single exercises timerId = `ex_${ex.id}`, for supersets timerId = `ss_${supersetId}`
  function updateRestSeconds(timerId, seconds) {
    setLogExercises(prev => {
      if (timerId.startsWith('ss_')) {
        const ssId = timerId.slice(3)
        return prev.map(ex => ex.supersetId === ssId ? { ...ex, restSeconds: seconds } : ex)
      }
      const exId = timerId.slice(3)
      return prev.map(ex => ex.id === exId ? { ...ex, restSeconds: seconds } : ex)
    })
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
    clearInterval(timerRef.current)

    const prevSession = sessions
      .filter(s => s.templateId === selectedTemplate.id)
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0] ?? null

    const sessionPayload = {
      templateId: selectedTemplate.id,
      templateName: selectedTemplate.name,
      notes: notes.trim(),
      exercises: logExercises.map(ex => ({
        id: ex.id,
        exerciseId: ex.exerciseId,
        name: ex.name,
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
    clearInterval(timerRef.current)
    setTimer(null)
    setStep(1)
    setSelectedTemplate(null)
    setLogExercises([])
    setNotes('')
    startedAtRef.current = null
  }

  function handleSummaryDone() {
    setStep(1)
    setSelectedTemplate(null)
    setLogExercises([])
    setNotes('')
    setSummaryData(null)
    setTimer(null)
    startedAtRef.current = null
    setActivePage('history')
  }

  // ── Step 1: Template picker ──────────────────────────────────────────────
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
                <TemplateCard key={t.id} template={t} onSelect={() => selectTemplate(t)} />
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Step 3: Post-workout summary ─────────────────────────────────────────
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

  // ── Step 2: Logging form ─────────────────────────────────────────────────
  if (!selectedTemplate) return null

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={selectedTemplate.name}
        action={
          <button onClick={handleCancel} className="text-sm text-gray-500 hover:text-gray-700 font-medium">
            Cancel
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-lg mx-auto w-full">
        <div className="flex flex-col gap-4 pb-6">
          {exerciseGroups.map((group, gi) => {
            if (group.type === 'single') {
              const { ex, i: exIdx } = group.items[0]
              const timerId = `ex_${ex.id}`
              return (
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
                        <SetRow set={set} setIndex={setIdx} onChange={updated => updateSet(exIdx, setIdx, updated)} />
                      </div>
                      {ex.sets.length > 1 && (
                        <button onClick={() => removeSet(exIdx, setIdx)} className="p-1 text-gray-300 hover:text-red-400 flex-shrink-0">
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => addSet(exIdx)} className="mt-2 w-full py-1.5 border border-dashed border-gray-200 rounded-lg text-xs text-gray-400 hover:text-indigo-600 hover:border-indigo-300 transition-colors">
                    + Add Set
                  </button>
                  <RestTimerRow timerId={timerId} restSeconds={ex.restSeconds} onChangeRest={updateRestSeconds} timer={timer} onStart={startTimer} onStop={stopTimer} />
                </div>
              )
            }

            // Superset group
            const ssTimerId = `ss_${group.supersetId}`
            const ssRestSeconds = group.items[0]?.ex.restSeconds ?? 90
            return (
              <div key={group.supersetId} className="border-l-4 border-indigo-400 rounded-r-2xl bg-white shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-4 pt-3 pb-2 bg-indigo-50/60">
                  <div className="flex gap-0.5 items-center">
                    <div className="h-3.5 w-1 bg-indigo-500 rounded-full" />
                    <div className="h-3.5 w-1 bg-indigo-500 rounded-full" />
                  </div>
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Superset</span>
                  <span className="text-indigo-300 text-xs">·</span>
                  <span className="text-xs text-indigo-400">{group.items.length} exercises</span>
                </div>

                <div className="flex flex-col divide-y divide-gray-100">
                  {group.items.map(({ ex, i: exIdx }) => (
                    <div key={ex.id} className="px-4 py-3">
                      <p className="font-semibold text-gray-900 mb-3">{ex.name}</p>
                      <div className="grid grid-cols-3 gap-2 mb-1">
                        <span className="text-xs text-gray-400 font-medium text-center">Set</span>
                        <span className="text-xs text-gray-400 font-medium text-center">Reps</span>
                        <span className="text-xs text-gray-400 font-medium text-center">Weight (kg)</span>
                      </div>
                      {ex.sets.map((set, setIdx) => (
                        <div key={setIdx} className="flex items-center gap-1">
                          <div className="flex-1">
                            <SetRow set={set} setIndex={setIdx} onChange={updated => updateSet(exIdx, setIdx, updated)} />
                          </div>
                          {ex.sets.length > 1 && (
                            <button onClick={() => removeSet(exIdx, setIdx)} className="p-1 text-gray-300 hover:text-red-400 flex-shrink-0">
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                      <button onClick={() => addSet(exIdx)} className="mt-2 w-full py-1.5 border border-dashed border-gray-200 rounded-lg text-xs text-gray-400 hover:text-indigo-600 hover:border-indigo-300 transition-colors">
                        + Add Set
                      </button>
                    </div>
                  ))}
                </div>

                {/* Shared rest timer for the whole superset */}
                <div className="px-4 pb-3">
                  <RestTimerRow timerId={ssTimerId} restSeconds={ssRestSeconds} onChangeRest={updateRestSeconds} timer={timer} onStart={startTimer} onStop={stopTimer} />
                </div>
              </div>
            )
          })}

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
