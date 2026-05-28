import { useState, useRef, useEffect, useMemo } from 'react'
import { useApp } from '../store/AppContext'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { TemplateCard } from '../components/templates/TemplateCard'
import { WorkoutSummary } from '../components/sessions/WorkoutSummary'
import { PlateCalculator } from '../components/tools/PlateCalculator'
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

function buildPrevLookup(sessions, templateId) {
  const prev = sessions
    .filter(s => s.templateId === templateId)
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0]
  if (!prev) return {}
  const lookup = {}
  prev.exercises.forEach(ex => { lookup[ex.name] = ex.sets })
  return lookup
}

function formatCountdown(s) {
  const m = Math.floor(s / 60)
  return m > 0 ? `${m}:${String(s % 60).padStart(2, '0')}` : `${s}s`
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    ;[0, 0.2, 0.4].forEach(offset => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.4, ctx.currentTime + offset)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.15)
      osc.start(ctx.currentTime + offset); osc.stop(ctx.currentTime + offset + 0.15)
    })
  } catch {}
}

// ── Set row ──────────────────────────────────────────────────────────────────
function SetRow({ set, setIndex, prevSet, onChange }) {
  const inputCls = 'rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500'
  const prevReps = prevSet?.reps
  const prevWeight = prevSet?.weight

  return (
    <div className="grid grid-cols-3 gap-2 items-center py-1">
      <div className="text-center">
        <span className="text-sm text-gray-400 dark:text-gray-500 font-medium">{setIndex + 1}</span>
        {prevSet && (
          <p className="text-[9px] text-gray-300 dark:text-gray-600 leading-none mt-0.5">prev</p>
        )}
      </div>
      <div>
        <input
          type="number" min="0" placeholder="Reps"
          value={set.reps}
          onChange={e => onChange({ ...set, reps: e.target.value === '' ? '' : Number(e.target.value) })}
          className={inputCls}
        />
        {prevReps != null && <p className="text-[9px] text-gray-300 dark:text-gray-600 text-center mt-0.5">{prevReps}</p>}
      </div>
      <div>
        <input
          type="number" min="0" step="0.5" placeholder="kg"
          value={set.weight}
          onChange={e => onChange({ ...set, weight: e.target.value === '' ? '' : Number(e.target.value) })}
          className={inputCls}
        />
        {prevWeight != null && prevWeight > 0 && <p className="text-[9px] text-gray-300 dark:text-gray-600 text-center mt-0.5">{prevWeight}kg</p>}
      </div>
    </div>
  )
}

// ── Rest timer ───────────────────────────────────────────────────────────────
function RestTimerRow({ timerId, restSeconds, onChangeRest, timer, onStart, onStop }) {
  const isActive = timer?.timerId === timerId && !timer.done
  const isDone   = timer?.timerId === timerId &&  timer.done

  if (isActive) {
    const progress = timer.remaining / timer.total
    const circumference = 2 * Math.PI * 10
    return (
      <div className="mt-3 flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-xl px-3 py-2">
        <div className="flex items-center gap-3">
          <svg width="28" height="28" viewBox="0 0 28 28" className="flex-shrink-0">
            <circle cx="14" cy="14" r="10" fill="none" stroke="#e0e7ff" strokeWidth="3" />
            <circle cx="14" cy="14" r="10" fill="none" stroke="#6366f1" strokeWidth="3"
              strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress)}
              strokeLinecap="round" transform="rotate(-90 14 14)" />
          </svg>
          <span className="text-indigo-700 dark:text-indigo-300 font-bold text-xl tabular-nums leading-none">
            {formatCountdown(timer.remaining)}
          </span>
          <span className="text-indigo-400 text-xs">rest</span>
        </div>
        <button onClick={onStop} className="text-xs text-indigo-500 font-semibold hover:text-indigo-700 px-2 py-1 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-800 transition-colors">
          Skip
        </button>
      </div>
    )
  }

  if (isDone) {
    return (
      <div className="mt-3 flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 rounded-xl px-3 py-2">
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
          <span className="text-emerald-700 dark:text-emerald-400 font-semibold text-sm">Rest complete — go!</span>
        </div>
        <button onClick={onStop} className="text-xs text-emerald-600 font-semibold hover:text-emerald-800 px-2 py-1 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-800 transition-colors">
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
                ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <button onClick={() => onStart(timerId, restSeconds)} className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg transition-colors">
        Start
      </button>
    </div>
  )
}

// ── Exercise card (single) ───────────────────────────────────────────────────
function ExerciseCard({ ex, exIdx, prevSets, timer, updateSet, addSet, removeSet, updateRestSeconds, startTimer, stopTimer }) {
  const timerId = `ex_${ex.id}`
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4">
      <p className="font-semibold text-gray-900 dark:text-white mb-3">{ex.name}</p>
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
              prevSet={prevSets?.[setIdx]}
              onChange={updated => updateSet(exIdx, setIdx, updated)}
            />
          </div>
          {ex.sets.length > 1 && (
            <button onClick={() => removeSet(exIdx, setIdx)} className="p-1 text-gray-300 dark:text-gray-600 hover:text-red-400 flex-shrink-0">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      ))}
      <button onClick={() => addSet(exIdx)} className="mt-2 w-full py-1.5 border border-dashed border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-400 hover:text-indigo-600 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors">
        + Add Set
      </button>
      <RestTimerRow timerId={timerId} restSeconds={ex.restSeconds} onChangeRest={updateRestSeconds} timer={timer} onStart={startTimer} onStop={stopTimer} />
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────
export function LogWorkout() {
  const { templates, sessions, logTemplateId, setLogTemplateId, addSession, setActivePage } = useApp()
  const [step, setStep] = useState(1)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [logExercises, setLogExercises] = useState([])
  const [prevLookup, setPrevLookup] = useState({})
  const [notes, setNotes] = useState('')
  const [summaryData, setSummaryData] = useState(null)
  const [timer, setTimer] = useState(null)
  const [showPlateCalc, setShowPlateCalc] = useState(false)
  const timerRef = useRef(null)
  const startedAtRef = useRef(null)

  const exerciseGroups = useMemo(() => {
    const groups = []; const ssMap = {}
    logExercises.forEach((ex, i) => {
      if (!ex.supersetId) {
        groups.push({ type: 'single', items: [{ ex, i }] })
      } else {
        if (!ssMap[ex.supersetId]) { const g = { type: 'superset', supersetId: ex.supersetId, items: [] }; ssMap[ex.supersetId] = g; groups.push(g) }
        ssMap[ex.supersetId].items.push({ ex, i })
      }
    })
    return groups
  }, [logExercises])

  useEffect(() => {
    if (!logTemplateId) return
    const t = templates.find(t => t.id === logTemplateId)
    setLogTemplateId(null)
    if (t) beginWorkout(t)
  }, [logTemplateId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => clearInterval(timerRef.current), [])

  function beginWorkout(template) {
    clearInterval(timerRef.current)
    setSelectedTemplate(template)
    setLogExercises(buildLogExercises(template))
    setPrevLookup(buildPrevLookup(sessions, template.id))
    setNotes('')
    setTimer(null)
    setStep(2)
    startedAtRef.current = new Date().toISOString()
  }

  function startTimer(timerId, seconds) {
    clearInterval(timerRef.current)
    setTimer({ timerId, remaining: seconds, total: seconds, done: false })
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (!prev) return null
        if (prev.remaining <= 1) { clearInterval(timerRef.current); playBeep(); return { ...prev, remaining: 0, done: true } }
        return { ...prev, remaining: prev.remaining - 1 }
      })
    }, 1000)
  }

  function stopTimer() { clearInterval(timerRef.current); setTimer(null) }

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
    setLogExercises(prev => prev.map((ex, i) => i === exIndex ? { ...ex, sets: ex.sets.map((s, j) => j === setIndex ? updatedSet : s) } : ex))
  }

  function addSet(exIndex) {
    setLogExercises(prev => prev.map((ex, i) => i === exIndex ? { ...ex, sets: [...ex.sets, { reps: '', weight: '' }] } : ex))
  }

  function removeSet(exIndex, setIndex) {
    setLogExercises(prev => prev.map((ex, i) => i === exIndex && ex.sets.length > 1 ? { ...ex, sets: ex.sets.filter((_, j) => j !== setIndex) } : ex))
  }

  function handleFinish() {
    if (!selectedTemplate) return
    clearInterval(timerRef.current)
    const historicalSessions = sessions
    const prevSession = historicalSessions.filter(s => s.templateId === selectedTemplate.id).sort((a, b) => new Date(b.date) - new Date(a.date))[0] ?? null
    const sessionPayload = {
      templateId: selectedTemplate.id,
      templateName: selectedTemplate.name,
      notes: notes.trim(),
      exercises: logExercises.map(ex => ({
        id: ex.id, exerciseId: ex.exerciseId, name: ex.name,
        sets: ex.sets.map(s => ({ reps: Number(s.reps) || 0, weight: s.weight === '' ? null : Number(s.weight) })),
      })),
    }
    const newSession = addSession(sessionPayload, startedAtRef.current)
    startedAtRef.current = null
    setSummaryData({ session: newSession, previousSession: prevSession, historicalSessions })
    setStep(3)
  }

  function handleCancel() {
    clearInterval(timerRef.current); setTimer(null); setStep(1)
    setSelectedTemplate(null); setLogExercises([]); setNotes(''); startedAtRef.current = null
  }

  function handleSummaryDone() {
    setStep(1); setSelectedTemplate(null); setLogExercises([]); setNotes('')
    setSummaryData(null); setTimer(null); startedAtRef.current = null; setActivePage('history')
  }

  // ── Step 1 ───────────────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Log Workout" />
        <div className="flex-1 overflow-y-auto px-4 py-4 max-w-lg mx-auto w-full">
          {templates.length === 0 ? (
            <EmptyState icon="📋" title="No templates yet" description="Create a workout template first, then log it here" action="Create Workout" onAction={() => setActivePage('workouts')} />
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Choose a workout to log:</p>
              {templates.map(t => <TemplateCard key={t.id} template={t} onSelect={() => beginWorkout(t)} />)}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Step 3 ───────────────────────────────────────────────────────────────
  if (step === 3 && summaryData) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title={selectedTemplate?.name ?? 'Summary'} />
        <div className="flex-1 overflow-y-auto px-4 py-4 max-w-lg mx-auto w-full">
          <WorkoutSummary
            session={summaryData.session}
            previousSession={summaryData.previousSession}
            historicalSessions={summaryData.historicalSessions}
            onDone={handleSummaryDone}
          />
        </div>
      </div>
    )
  }

  // ── Step 2 ───────────────────────────────────────────────────────────────
  if (!selectedTemplate) return null

  const hasPrev = Object.keys(prevLookup).length > 0

  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader
          title={selectedTemplate.name}
          action={
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPlateCalc(true)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                title="Plate Calculator"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><path d="M8 12h8M12 8v8" />
                </svg>
              </button>
              <button onClick={handleCancel} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium">
                Cancel
              </button>
            </div>
          }
        />
        <div className="flex-1 overflow-y-auto px-4 py-4 max-w-lg mx-auto w-full">
          <div className="flex flex-col gap-4 pb-6">
            {hasPrev && (
              <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                <svg className="h-3.5 w-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                <p className="text-xs text-gray-400 dark:text-gray-500">Small numbers below inputs show your last session's values</p>
              </div>
            )}

            {exerciseGroups.map((group, gi) => {
              if (group.type === 'single') {
                const { ex, i: exIdx } = group.items[0]
                return (
                  <ExerciseCard
                    key={ex.id}
                    ex={ex} exIdx={exIdx}
                    prevSets={prevLookup[ex.name]}
                    timer={timer}
                    updateSet={updateSet} addSet={addSet} removeSet={removeSet}
                    updateRestSeconds={updateRestSeconds} startTimer={startTimer} stopTimer={stopTimer}
                  />
                )
              }

              // Superset group
              const ssTimerId = `ss_${group.supersetId}`
              const ssRestSeconds = group.items[0]?.ex.restSeconds ?? 90
              return (
                <div key={group.supersetId} className="border-l-4 border-indigo-400 rounded-r-2xl bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
                  <div className="flex items-center gap-2 px-4 pt-3 pb-2 bg-indigo-50/60 dark:bg-indigo-900/20">
                    <div className="flex gap-0.5 items-center">
                      <div className="h-3.5 w-1 bg-indigo-500 rounded-full" /><div className="h-3.5 w-1 bg-indigo-500 rounded-full" />
                    </div>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Superset</span>
                    <span className="text-indigo-300 text-xs">·</span>
                    <span className="text-xs text-indigo-400">{group.items.length} exercises</span>
                  </div>
                  <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-700">
                    {group.items.map(({ ex, i: exIdx }) => (
                      <div key={ex.id} className="px-4 py-3">
                        <p className="font-semibold text-gray-900 dark:text-white mb-3">{ex.name}</p>
                        <div className="grid grid-cols-3 gap-2 mb-1">
                          <span className="text-xs text-gray-400 font-medium text-center">Set</span>
                          <span className="text-xs text-gray-400 font-medium text-center">Reps</span>
                          <span className="text-xs text-gray-400 font-medium text-center">Weight (kg)</span>
                        </div>
                        {ex.sets.map((set, setIdx) => (
                          <div key={setIdx} className="flex items-center gap-1">
                            <div className="flex-1">
                              <SetRow set={set} setIndex={setIdx} prevSet={prevLookup[ex.name]?.[setIdx]} onChange={updated => updateSet(exIdx, setIdx, updated)} />
                            </div>
                            {ex.sets.length > 1 && (
                              <button onClick={() => removeSet(exIdx, setIdx)} className="p-1 text-gray-300 dark:text-gray-600 hover:text-red-400 flex-shrink-0">
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                              </button>
                            )}
                          </div>
                        ))}
                        <button onClick={() => addSet(exIdx)} className="mt-2 w-full py-1.5 border border-dashed border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-400 hover:text-indigo-600 hover:border-indigo-300 transition-colors">
                          + Add Set
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 pb-3">
                    <RestTimerRow timerId={ssTimerId} restSeconds={ssRestSeconds} onChangeRest={updateRestSeconds} timer={timer} onStart={startTimer} onStop={stopTimer} />
                  </div>
                </div>
              )
            })}

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="How did it go?"
                rows={3}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <Button size="lg" className="w-full" onClick={handleFinish}>Finish Workout</Button>
          </div>
        </div>
      </div>
      {showPlateCalc && <PlateCalculator onClose={() => setShowPlateCalc(false)} />}
    </>
  )
}
