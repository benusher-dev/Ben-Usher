import { useState, useRef, useEffect, useMemo } from 'react'
import { useApp } from '../store/AppContext'
import { useWeekProgress } from '../hooks/useWeekProgress'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { TemplateCard } from '../components/templates/TemplateCard'
import { WorkoutSummary } from '../components/sessions/WorkoutSummary'
import { PlateCalculator } from '../components/tools/PlateCalculator'
import { ExercisePicker } from '../components/templates/ExercisePicker'
import { generateId } from '../utils/dateHelpers'
import { CATEGORY_COLOR, CATEGORIES } from '../data/exerciseLibrary'

const REST_PRESETS = [
  { label: '30s', seconds: 30 },
  { label: '45s', seconds: 45 },
  { label: '1m',  seconds: 60 },
  { label: '90s', seconds: 90 },
  { label: '2m',  seconds: 120 },
  { label: '3m',  seconds: 180 },
]

function getExerciseType(ex) {
  return ex.exerciseType ?? (ex.isCardio ? 'cardio' : 'weight')
}

const TYPE_META = {
  weight:    { label: 'Weights',     cls: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' },
  bw:        { label: 'Bodyweight',  cls: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' },
  hold:      { label: '⏱ Hold',      cls: 'text-violet-600 bg-violet-50 dark:bg-violet-900/30' },
  cardio:    { label: '🏃 Cardio',   cls: 'text-sky-500 bg-sky-50 dark:bg-sky-900/30' },
  checklist: { label: null },
}

function buildLogExercises(template) {
  return template.exercises.map(ex => ({
    id: generateId(),
    exerciseId: ex.id,
    name: ex.name,
    notes: ex.notes ?? null,
    exerciseType: ex.exerciseType ?? (ex.isCardio ? 'cardio' : 'weight'),
    restSeconds: ex.restSeconds ?? 90,
    supersetId: ex.supersetId ?? null,
    sets: Array.from({ length: Math.max(1, ex.sets || 1) }, () => ({
      id: generateId(),
      reps: ex.reps ?? '',
      weight: ex.weight ?? '',
      done: false,
      rpe: null,
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

function formatElapsed(s) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${m}:${String(sec).padStart(2, '0')}`
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

// ── Column header ─────────────────────────────────────────────────────────────
function SetHeader({ exerciseType, showRPE }) {
  const col1 = { cardio: 'Duration', hold: 'Secs', weight: 'Reps', bw: 'Reps' }[exerciseType] ?? 'Reps'
  const col2 = { cardio: 'Distance', hold: '+kg (opt)', weight: 'Weight', bw: '+kg (opt)' }[exerciseType] ?? 'Weight'
  return (
    <div className="flex items-center gap-1.5 px-1 mb-1">
      <div className="flex-shrink-0 w-6" />
      <div className="flex-shrink-0 w-5 text-center">
        <span className="text-xs text-gray-400 font-medium">Set</span>
      </div>
      <div className="flex-1 text-center">
        <span className="text-xs text-gray-400 font-medium">{col1}</span>
      </div>
      <div className="flex-1 text-center">
        <span className="text-xs text-gray-400 font-medium">{col2}</span>
      </div>
      {showRPE && (
        <div className="flex-shrink-0 w-12 text-center">
          <span className="text-xs text-gray-400 font-medium">RPE</span>
        </div>
      )}
      <div className="flex-shrink-0 w-6" />
    </div>
  )
}

// ── Set row ───────────────────────────────────────────────────────────────────
function SetRow({ set, setIndex, prevSet, exerciseType, showRPE, canRemove, onChange, onToggleDone, onRemove }) {
  const borderCls = set.done ? 'border-emerald-200 dark:border-emerald-800' : 'border-gray-200 dark:border-gray-600'
  const inputCls = `rounded-lg border ${borderCls} bg-white dark:bg-gray-700 dark:text-white px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full`
  const dimmed = set.done ? 'opacity-60' : ''

  return (
    <div className={`flex items-center gap-1.5 py-1 px-1 rounded-xl transition-colors ${set.done ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}`}>
      <button
        type="button"
        onClick={() => onToggleDone(!set.done)}
        className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
          set.done
            ? 'bg-emerald-500 border-emerald-500 text-white'
            : 'border-gray-300 dark:border-gray-600 hover:border-emerald-400'
        }`}
      >
        {set.done && (
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>

      <div className="flex-shrink-0 w-5 text-center">
        <span className="text-sm text-gray-400 dark:text-gray-500 font-medium">{setIndex + 1}</span>
      </div>

      <div className={`flex-1 ${dimmed}`}>
        <input
          type="number" min="0"
          placeholder={{ cardio: 'min', hold: 'secs', weight: 'reps', bw: 'reps' }[exerciseType] ?? 'reps'}
          value={set.reps ?? ''}
          onChange={e => onChange({ ...set, reps: e.target.value === '' ? '' : Number(e.target.value) })}
          className={inputCls}
        />
        {prevSet?.reps != null && (
          <p className="text-[9px] text-gray-300 dark:text-gray-600 text-center mt-0.5">
            {prevSet.reps}{exerciseType === 'cardio' ? 'm' : exerciseType === 'hold' ? 's' : ''}
          </p>
        )}
      </div>

      <div className={`flex-1 ${dimmed}`}>
        <input
          type="number" min="0" step={exerciseType === 'cardio' ? '0.1' : '0.5'}
          placeholder={{ cardio: 'km', hold: '+kg', weight: 'kg', bw: '+kg' }[exerciseType] ?? 'kg'}
          value={set.weight ?? ''}
          onChange={e => onChange({ ...set, weight: e.target.value === '' ? '' : Number(e.target.value) })}
          className={inputCls}
        />
        {prevSet?.weight != null && prevSet.weight > 0 && (
          <p className="text-[9px] text-gray-300 dark:text-gray-600 text-center mt-0.5">
            {prevSet.weight}{exerciseType === 'cardio' ? 'km' : 'kg'}
          </p>
        )}
      </div>

      {showRPE && (
        <div className={`flex-shrink-0 w-12 ${dimmed}`}>
          <input
            type="number" min="1" max="10" placeholder="RPE"
            value={set.rpe ?? ''}
            onChange={e => onChange({ ...set, rpe: e.target.value === '' ? null : Math.min(10, Math.max(1, Number(e.target.value))) })}
            className={`${inputCls} text-xs`}
          />
        </div>
      )}

      {canRemove ? (
        <button onClick={onRemove} className="flex-shrink-0 w-6 flex items-center justify-center p-0.5 text-gray-300 dark:text-gray-600 hover:text-red-400 transition-colors">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      ) : (
        <div className="flex-shrink-0 w-6" />
      )}
    </div>
  )
}

// ── Rest timer ────────────────────────────────────────────────────────────────
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
      <div onClick={onStop} className="mt-3 flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 rounded-xl px-3 py-2 cursor-pointer">
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
          <span className="text-emerald-700 dark:text-emerald-400 font-semibold text-sm">Rest complete — go!</span>
        </div>
        <span className="text-xs text-emerald-600 font-semibold px-2 py-1">Dismiss</span>
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

// ── Exercise card (single) ────────────────────────────────────────────────────
function ExerciseCard({ ex, exIdx, prevSets, timer, showRPE, autoRest, updateSet, addSet, removeSet, updateRestSeconds, startTimer, stopTimer, onEditExercise }) {
  const timerId  = `ex_${ex.id}`
  const exType   = getExerciseType(ex)
  const badge    = TYPE_META[exType]
  const isWarmup = ex.category === 'warmup'

  const pencilBtn = (
    <button onClick={() => onEditExercise({ ex, exIdx })} className="p-1 text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors flex-shrink-0" title="Edit exercise">
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
      </svg>
    </button>
  )

  // Compact warm-up card — no rest timer, no add-set, tighter padding
  if (isWarmup) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-3">
        <div className="flex items-center gap-2 mb-1.5">
          <p className="font-semibold text-gray-900 dark:text-white flex-1 text-sm">{ex.name}</p>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Warm-up</span>
          {pencilBtn}
        </div>
        {ex.notes && <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-2">{ex.notes}</p>}
        <SetHeader exerciseType={exType} showRPE={false} />
        {ex.sets.map((set, setIdx) => (
          <SetRow
            key={set.id}
            set={set} setIndex={setIdx}
            prevSet={prevSets?.[setIdx]}
            exerciseType={exType} showRPE={false}
            canRemove={false}
            onChange={updated => updateSet(exIdx, setIdx, updated)}
            onToggleDone={done => updateSet(exIdx, setIdx, { ...set, done })}
            onRemove={() => {}}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4">
      <div className="mb-3">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-gray-900 dark:text-white flex-1">{ex.name}</p>
          {badge.label && <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>}
          {pencilBtn}
        </div>
        {ex.notes && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 leading-relaxed">{ex.notes}</p>}
      </div>
      <SetHeader exerciseType={exType} showRPE={showRPE} />
      {ex.sets.map((set, setIdx) => (
        <SetRow
          key={set.id}
          set={set} setIndex={setIdx}
          prevSet={prevSets?.[setIdx]}
          exerciseType={exType} showRPE={showRPE}
          canRemove={ex.sets.length > 1}
          onChange={updated => updateSet(exIdx, setIdx, updated)}
          onToggleDone={done => {
            updateSet(exIdx, setIdx, { ...set, done })
            if (done && autoRest) startTimer(timerId, ex.restSeconds)
          }}
          onRemove={() => removeSet(exIdx, setIdx)}
        />
      ))}
      <button onClick={() => addSet(exIdx)} className="mt-2 w-full py-1.5 border border-dashed border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-400 hover:text-indigo-600 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors">
        + Add Set
      </button>
      <RestTimerRow timerId={timerId} restSeconds={ex.restSeconds} onChangeRest={updateRestSeconds} timer={timer} onStart={startTimer} onStop={stopTimer} />
    </div>
  )
}

const EX_TYPES = [
  { value: 'weight',    label: 'Weight',     sub: 'reps + kg',       icon: '🏋️' },
  { value: 'bw',        label: 'Bodyweight', sub: 'reps + opt kg',   icon: '🙆' },
  { value: 'hold',      label: 'Hold / ISO', sub: 'secs + opt kg',   icon: '⏱️' },
  { value: 'cardio',    label: 'Cardio',     sub: 'dur + dist',      icon: '🏃' },
  { value: 'checklist', label: 'Checklist',  sub: 'tap to complete',  icon: '✅', span: true },
]

// ── Exercise edit sheet ───────────────────────────────────────────────────────
function ExerciseEditSheet({ ex, exIdx, logExercises, onSave, onClose }) {
  const [name, setName]           = useState(ex.name)
  const [notes, setNotes]         = useState(ex.notes ?? '')
  const [exType, setExType]       = useState(getExerciseType(ex))
  const [supersetId, setSsId]     = useState(ex.supersetId ?? null)
  const [noteLocked, setNoteLocked] = useState(true)

  // Unique supersets in this workout (exclude current exercise from member list)
  const supersets = useMemo(() => {
    const map = {}
    logExercises.forEach(e => {
      if (!e.supersetId) return
      if (!map[e.supersetId]) map[e.supersetId] = []
      if (e.id !== ex.id) map[e.supersetId].push(e.name)
    })
    return Object.entries(map).map(([id, names]) => ({ id, names }))
  }, [logExercises, ex.id])

  function handleSave() {
    onSave(exIdx, {
      name:         name.trim() || ex.name,
      notes:        notes.trim() || null,
      exerciseType: exType,
      supersetId,
    }, noteLocked)
    onClose()
  }

  const inputCls = 'w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400'

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white dark:bg-gray-800 rounded-t-3xl w-full max-w-lg overflow-y-auto"
        style={{ maxHeight: '90vh', paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="pt-3 pb-1 flex justify-center">
          <div className="w-10 h-1 bg-gray-200 dark:bg-gray-600 rounded-full" />
        </div>
        <div className="px-5 pt-2 pb-4 flex flex-col gap-4">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Edit Exercise</h3>

          {/* Name */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Name</label>
            <input
              type="text" value={name} autoFocus
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              className={inputCls}
            />
          </div>

          {/* Type */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">Type</label>
            <div className="grid grid-cols-2 gap-2">
              {EX_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setExType(t.value)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-colors ${t.span ? 'col-span-2' : ''} ${
                    exType === t.value
                      ? 'border-sky-400 bg-sky-50 dark:bg-sky-900/30'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <span className="text-lg leading-none">{t.icon}</span>
                  <div>
                    <p className={`text-sm font-semibold leading-tight ${exType === t.value ? 'text-sky-600 dark:text-sky-400' : 'text-gray-700 dark:text-gray-300'}`}>{t.label}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{t.sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Superset / Group */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">Group / Superset</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSsId(null)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                  supersetId === null
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent'
                    : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                }`}
              >
                None
              </button>
              {supersets.map(ss => (
                <button
                  key={ss.id}
                  onClick={() => setSsId(ss.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                    supersetId === ss.id
                      ? 'bg-indigo-600 text-white border-transparent'
                      : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-indigo-300'
                  }`}
                >
                  {ss.names.length ? ss.names.slice(0, 2).join(' · ') + (ss.names.length > 2 ? ' +' + (ss.names.length - 2) : '') : 'Empty group'}
                </button>
              ))}
              <button
                onClick={() => setSsId(generateId())}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-dashed border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
              >
                + New group
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Notes</label>
              <button
                type="button"
                onClick={() => setNoteLocked(v => !v)}
                title={noteLocked ? 'Saves to template — tap to make session-only' : 'Session only — tap to save to template'}
                className={`flex items-center gap-1 text-xs transition-colors ${noteLocked ? 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300' : 'text-amber-500 dark:text-amber-400 hover:text-amber-600'}`}
              >
                {noteLocked ? (
                  <>
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <span>Saves to template</span>
                  </>
                ) : (
                  <>
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                    </svg>
                    <span className="text-amber-500 dark:text-amber-400">Session only</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={4}
              placeholder="Progression, RPE target, coaching cues…"
              className={`${inputCls} resize-none dark:placeholder-gray-500`}
            />
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300">
              Cancel
            </button>
            <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-sky-500 text-white text-sm font-semibold hover:bg-sky-600 transition-colors">
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Settings sheet ────────────────────────────────────────────────────────────
function SettingsSheet({ autoRest, showRPE, onToggleAutoRest, onToggleRPE, weekNum, onSetWeek, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white dark:bg-gray-800 rounded-t-3xl w-full max-w-lg"
        style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="pt-3 pb-1 flex justify-center">
          <div className="w-10 h-1 bg-gray-200 dark:bg-gray-600 rounded-full" />
        </div>
        <div className="px-5 pt-2 pb-4">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">Workout Settings</h3>
          <div className="flex flex-col gap-5">
            {weekNum != null && (
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Programme week</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Which week of the 8-week block you're on</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => onSetWeek(Math.max(1, weekNum - 1))}
                    className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-base hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center"
                  >−</button>
                  <span className={`w-8 text-center text-sm font-bold tabular-nums ${weekNum >= 8 ? 'text-amber-500' : 'text-gray-900 dark:text-white'}`}>{weekNum >= 8 ? '🏁' : weekNum}</span>
                  <button
                    onClick={() => onSetWeek(Math.min(8, weekNum + 1))}
                    disabled={weekNum >= 8}
                    className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-base hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                  >+</button>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Auto-start rest timer</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Timer starts when you mark a set done</p>
              </div>
              <button
                onClick={onToggleAutoRest}
                className={`relative flex-shrink-0 inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoRest ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${autoRest ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Show RPE</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Rate of Perceived Exertion (1–10) per set</p>
              </div>
              <button
                onClick={onToggleRPE}
                className={`relative flex-shrink-0 inline-flex h-6 w-11 items-center rounded-full transition-colors ${showRPE ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${showRPE ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export function LogWorkout() {
  const { templates, sessions, logTemplateId, setLogTemplateId, addSession, setActivePage, updateTemplate } = useApp()
  const { getWeek, setWeek, incrementWeek } = useWeekProgress()
  const [step, setStep] = useState(1)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [logExercises, setLogExercises] = useState([])
  const [prevLookup, setPrevLookup] = useState({})
  const [notes, setNotes] = useState('')
  const [summaryData, setSummaryData] = useState(null)
  const [timer, setTimer] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const [showPlates, setShowPlates] = useState(false)
  const [show1RM, setShow1RM] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showAddExercise, setShowAddExercise] = useState(false)
  const [editingExercise, setEditingExercise] = useState(null) // { ex, exIdx }
  const [autoRest, setAutoRest] = useState(() => {
    try { return JSON.parse(localStorage.getItem('gwt_auto_rest') ?? 'false') } catch { return false }
  })
  const [showRPE, setShowRPE] = useState(() => {
    try { return JSON.parse(localStorage.getItem('gwt_show_rpe') ?? 'false') } catch { return false }
  })
  const timerRef = useRef(null)
  const elapsedRef = useRef(null)
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
    return groups.map(g => g.type === 'superset' && g.items.length === 1 ? { type: 'single', items: g.items } : g)
  }, [logExercises])

  useEffect(() => {
    if (!logTemplateId) return
    const t = templates.find(t => t.id === logTemplateId)
    setLogTemplateId(null)
    if (t) beginWorkout(t)
  }, [logTemplateId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => { clearInterval(timerRef.current); clearInterval(elapsedRef.current) }, [])

  useEffect(() => {
    if (step === 2) {
      elapsedRef.current = setInterval(() => setElapsed(prev => prev + 1), 1000)
    } else {
      clearInterval(elapsedRef.current)
    }
    return () => clearInterval(elapsedRef.current)
  }, [step])

  useEffect(() => { localStorage.setItem('gwt_auto_rest', JSON.stringify(autoRest)) }, [autoRest])
  useEffect(() => { localStorage.setItem('gwt_show_rpe', JSON.stringify(showRPE)) }, [showRPE])

  function beginWorkout(template) {
    clearInterval(timerRef.current)
    setSelectedTemplate(template)
    setLogExercises(buildLogExercises(template))
    setPrevLookup(buildPrevLookup(sessions, template.id))
    setNotes('')
    setTimer(null)
    setElapsed(0)
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
    setLogExercises(prev => prev.map((ex, i) => i === exIndex ? { ...ex, sets: [...ex.sets, { id: generateId(), reps: '', weight: '', done: false, rpe: null }] } : ex))
  }

  function removeSet(exIndex, setIndex) {
    setLogExercises(prev => prev.map((ex, i) => i === exIndex && ex.sets.length > 1 ? { ...ex, sets: ex.sets.filter((_, j) => j !== setIndex) } : ex))
  }

  function updateExerciseInfo(exIndex, updates, persistNoteToTemplate = false) {
    setLogExercises(prev => prev.map((ex, i) => i === exIndex ? { ...ex, ...updates } : ex))
    if (persistNoteToTemplate && selectedTemplate && 'notes' in updates) {
      const updatedExercises = selectedTemplate.exercises.map((ex, i) =>
        i === exIndex ? { ...ex, notes: updates.notes } : ex
      )
      updateTemplate(selectedTemplate.id, selectedTemplate.name, updatedExercises)
      setSelectedTemplate(prev => prev ? {
        ...prev,
        exercises: prev.exercises.map((ex, i) => i === exIndex ? { ...ex, notes: updates.notes } : ex)
      } : prev)
    }
  }

  function handleAddExercise(exercise) {
    setLogExercises(prev => [...prev, {
      id: generateId(),
      exerciseId: generateId(),
      name: exercise.name,
      notes: exercise.notes ?? null,
      exerciseType: exercise.category === 'cardio' ? 'cardio' : 'weight',
      restSeconds: 90,
      supersetId: null,
      sets: Array.from({ length: exercise.sets || 3 }, () => ({
        id: generateId(),
        reps: exercise.reps ?? '',
        weight: exercise.weight ?? '',
        done: false,
        rpe: null,
      })),
    }])
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
        isCardio: ex.isCardio,
        sets: ex.sets.map(s => ({
          reps: Number(s.reps) || 0,
          weight: s.weight === '' || s.weight === null ? null : Number(s.weight),
          rpe: s.rpe ?? null,
        })),
      })),
    }
    incrementWeek(selectedTemplate.id)
    const newSession = addSession(sessionPayload, startedAtRef.current)
    startedAtRef.current = null
    setSummaryData({ session: newSession, previousSession: prevSession, historicalSessions })
    setStep(3)
  }

  function handleCancel() {
    clearInterval(timerRef.current); setTimer(null); setStep(1); setElapsed(0)
    setSelectedTemplate(null); setLogExercises([]); setNotes(''); startedAtRef.current = null
  }

  function handleSummaryDone() {
    setStep(1); setSelectedTemplate(null); setLogExercises([]); setNotes('')
    setSummaryData(null); setTimer(null); setElapsed(0); startedAtRef.current = null; setActivePage('history')
  }

  // ── Step 1 ────────────────────────────────────────────────────────────────
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

  // ── Step 3 ────────────────────────────────────────────────────────────────
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

  // ── Step 2 ────────────────────────────────────────────────────────────────
  if (!selectedTemplate) return null

  const hasPrev = Object.keys(prevLookup).length > 0

  return (
    <>
      <div className="flex flex-col h-full">
        {/* ── Rest timer banner ── */}
        {timer && !timer.done && (
          <div className="flex-shrink-0 bg-gradient-to-r from-sky-400 to-blue-500 px-5 pt-4 pb-5 flex items-center">
            <div className="flex-1" />
            <div className="text-center">
              <p className="text-xs font-bold text-white/70 uppercase tracking-[0.2em] mb-1">Rest</p>
              <p className="text-6xl font-bold text-white tabular-nums leading-none tracking-tight">
                {formatCountdown(timer.remaining)}
              </p>
              <div className="mt-3 h-1.5 w-40 bg-white/20 rounded-full overflow-hidden mx-auto">
                <div
                  className="h-full bg-white rounded-full transition-all duration-1000"
                  style={{ width: `${(timer.remaining / timer.total) * 100}%` }}
                />
              </div>
            </div>
            <div className="flex-1 flex justify-end">
              <button
                onClick={stopTimer}
                className="text-sm font-semibold text-white/80 hover:text-white bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl transition-colors"
              >
                Skip
              </button>
            </div>
          </div>
        )}
        <PageHeader
          title={selectedTemplate.name}
          accent
          action={
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${getWeek(selectedTemplate.id) >= 8 ? 'bg-amber-400/90 text-white' : 'text-white/80 bg-white/20'}`}>
                {getWeek(selectedTemplate.id) >= 8 ? '🏁 Wk 8' : `Wk ${getWeek(selectedTemplate.id)}`}
              </span>
              <span className="text-xs font-mono font-semibold text-white/90 tabular-nums bg-white/20 px-2 py-1 rounded-lg">
                {formatElapsed(elapsed)}
              </span>
              <button
                onClick={() => setShowPlates(true)}
                className="p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/20 transition-colors"
                title="Plate Calculator"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <rect x="4" y="2" width="16" height="20" rx="2" />
                  <line x1="8" y1="7" x2="16" y2="7" />
                  <line x1="8" y1="12" x2="8" y2="12" strokeLinecap="round" strokeWidth="3" />
                  <line x1="12" y1="12" x2="12" y2="12" strokeLinecap="round" strokeWidth="3" />
                  <line x1="16" y1="12" x2="16" y2="12" strokeLinecap="round" strokeWidth="3" />
                  <line x1="8" y1="17" x2="8" y2="17" strokeLinecap="round" strokeWidth="3" />
                  <line x1="12" y1="17" x2="12" y2="17" strokeLinecap="round" strokeWidth="3" />
                  <line x1="16" y1="17" x2="16" y2="17" strokeLinecap="round" strokeWidth="3" />
                </svg>
              </button>
              <button
                onClick={() => setShow1RM(true)}
                className="p-1.5 rounded-xl text-white/70 hover:text-amber-200 hover:bg-white/20 transition-colors"
                title="1RM Estimator"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                  <path d="M4 22h16" />
                  <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                  <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                  <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
                </svg>
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/20 transition-colors"
                title="Workout Settings"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
                  <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
                  <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
                </svg>
              </button>
              <button onClick={handleCancel} className="text-sm text-white/70 hover:text-white font-medium transition-colors">
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
                <p className="text-xs text-gray-400 dark:text-gray-500">Small numbers show your last session's values</p>
              </div>
            )}

            {exerciseGroups.map((group) => {
              if (group.type === 'single') {
                const { ex, i: exIdx } = group.items[0]
                return (
                  <ExerciseCard
                    key={ex.id}
                    ex={ex} exIdx={exIdx}
                    prevSets={prevLookup[ex.name]}
                    timer={timer} showRPE={showRPE} autoRest={autoRest}
                    updateSet={updateSet} addSet={addSet} removeSet={removeSet}
                    updateRestSeconds={updateRestSeconds} startTimer={startTimer} stopTimer={stopTimer}
                    onEditExercise={setEditingExercise}
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
                    {group.items.map(({ ex, i: exIdx }) => {
                      const ssExType = getExerciseType(ex)
                      const ssBadge  = TYPE_META[ssExType]
                      return (
                      <div key={ex.id} className="px-4 py-3">
                        <div className="mb-3">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900 dark:text-white flex-1">{ex.name}</p>
                            {ssBadge.label && <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ssBadge.cls}`}>{ssBadge.label}</span>}
                            <button onClick={() => setEditingExercise({ ex, exIdx })} className="p-1 text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors" title="Edit exercise">
                              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                              </svg>
                            </button>
                          </div>
                          {ex.notes && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 leading-relaxed">{ex.notes}</p>}
                        </div>
                        <SetHeader exerciseType={ssExType} showRPE={showRPE} />
                        {ex.sets.map((set, setIdx) => (
                          <SetRow
                            key={set.id}
                            set={set} setIndex={setIdx}
                            prevSet={prevLookup[ex.name]?.[setIdx]}
                            exerciseType={ssExType} showRPE={showRPE}
                            canRemove={ex.sets.length > 1}
                            onChange={updated => updateSet(exIdx, setIdx, updated)}
                            onToggleDone={done => {
                              updateSet(exIdx, setIdx, { ...set, done })
                              if (done && autoRest) startTimer(ssTimerId, ssRestSeconds)
                            }}
                            onRemove={() => removeSet(exIdx, setIdx)}
                          />
                        ))}
                        <button onClick={() => addSet(exIdx)} className="mt-2 w-full py-1.5 border border-dashed border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-400 hover:text-indigo-600 hover:border-indigo-300 transition-colors">
                          + Add Set
                        </button>
                      </div>
                      )
                    })}
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

            <button
              onClick={() => setShowAddExercise(true)}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl text-sm font-semibold text-gray-500 dark:text-gray-400 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 dark:hover:border-indigo-500 transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Exercise
            </button>

            <Button size="lg" className="w-full" onClick={handleFinish}>Finish Workout</Button>
          </div>
        </div>
      </div>

      {showPlates && <PlateCalculator initialTab="plates" onClose={() => setShowPlates(false)} />}
      {show1RM && <PlateCalculator initialTab="1rm" onClose={() => setShow1RM(false)} />}
      <ExercisePicker
        open={showAddExercise}
        onAdd={handleAddExercise}
        onClose={() => setShowAddExercise(false)}
      />
      {showSettings && (
        <SettingsSheet
          autoRest={autoRest} showRPE={showRPE}
          onToggleAutoRest={() => setAutoRest(v => !v)}
          onToggleRPE={() => setShowRPE(v => !v)}
          weekNum={getWeek(selectedTemplate?.id)}
          onSetWeek={w => setWeek(selectedTemplate?.id, w)}
          onClose={() => setShowSettings(false)}
        />
      )}
      {editingExercise && (
        <ExerciseEditSheet
          ex={editingExercise.ex}
          exIdx={editingExercise.exIdx}
          logExercises={logExercises}
          onSave={updateExerciseInfo}
          onClose={() => setEditingExercise(null)}
        />
      )}
    </>
  )
}
