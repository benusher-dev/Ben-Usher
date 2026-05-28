import { useMemo, useState, useRef } from 'react'
import { useApp } from '../store/AppContext'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { SessionCard } from '../components/sessions/SessionCard'
import { useSchedule, SCHEDULE_DAYS, DAY_LABELS, DAY_FULL, todayKey } from '../hooks/useSchedule'

// ── Streak helpers ───────────────────────────────────────────────────────────
function calcStreak(sessions) {
  if (!sessions.length) return 0
  const daySet = new Set(sessions.map(s => new Date(s.date).toDateString()))
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)

  // Walk backwards from today; streak starts only if trained today or yesterday
  let check = new Date(today)
  if (!daySet.has(today.toDateString())) {
    if (!daySet.has(yesterday.toDateString())) return 0
    check = new Date(yesterday)
  }

  let streak = 0
  while (daySet.has(check.toDateString())) {
    streak++
    check.setDate(check.getDate() - 1)
  }
  return streak
}

// ── Export / import helpers ──────────────────────────────────────────────────
const STORAGE_KEYS = ['gwt_templates', 'gwt_sessions', 'gwt_custom_exercises', 'gwt_schedule', 'gwt_bodyweight']

function exportData() {
  const data = {}
  STORAGE_KEYS.forEach(k => { const v = localStorage.getItem(k); if (v) data[k] = JSON.parse(v) })
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `gymtracker-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function importData(file, onDone) {
  const reader = new FileReader()
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result)
      STORAGE_KEYS.forEach(k => { if (data[k] !== undefined) localStorage.setItem(k, JSON.stringify(data[k])) })
      onDone()
    } catch {
      alert('Invalid backup file — could not restore data.')
    }
  }
  reader.readAsText(file)
}

// ── Day assign sheet ─────────────────────────────────────────────────────────
function AssignSheet({ day, templates, current, onAssign, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white dark:bg-gray-800 rounded-t-3xl w-full max-w-lg"
        style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 pt-4 pb-3 border-b border-gray-100 dark:border-gray-700">
          <div className="w-10 h-1 bg-gray-200 dark:bg-gray-600 rounded-full mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-900 dark:text-white">{DAY_FULL[day]}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Choose a workout to schedule</p>
        </div>
        <div className="overflow-y-auto max-h-96">
          <button
            onClick={() => { onAssign(null); onClose() }}
            className={`w-full text-left px-5 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${!current ? 'text-indigo-600' : 'text-gray-500 dark:text-gray-400'}`}
          >
            <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm">😴</div>
            <span className="text-sm font-medium dark:text-gray-200">Rest Day</span>
            {!current && <svg className="h-4 w-4 ml-auto text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>}
          </button>
          {templates.map(t => (
            <button
              key={t.id}
              onClick={() => { onAssign(t.id); onClose() }}
              className={`w-full text-left px-5 py-3 flex items-center gap-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors ${current === t.id ? 'text-indigo-600' : 'text-gray-800 dark:text-gray-200'}`}
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                <svg className="h-4 w-4 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{t.name}</p>
                <p className="text-xs text-gray-400">{t.exercises.length} exercise{t.exercises.length !== 1 ? 's' : ''}</p>
              </div>
              {current === t.id && <svg className="h-4 w-4 text-indigo-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────
function weekStart() {
  const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); d.setHours(0, 0, 0, 0); return d
}
function monthStart() {
  const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d
}

export function Dashboard() {
  const { sessions, setActivePage, setLogTemplateId, templates } = useApp()
  const { schedule, setDayTemplate } = useSchedule()
  const [assignDay, setAssignDay] = useState(null)
  const importRef = useRef(null)
  const today = todayKey()

  const recentSessions = useMemo(
    () => [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3),
    [sessions]
  )

  const { stats, streak } = useMemo(() => {
    const ws = weekStart(); const ms = monthStart()
    const thisWeek = sessions.filter(s => new Date(s.date) >= ws)
    const thisMonth = sessions.filter(s => new Date(s.date) >= ms)
    const uniqueDays = new Set(thisMonth.map(s => new Date(s.date).toDateString())).size
    return {
      stats: { total: sessions.length, weekSessions: thisWeek.length, monthDays: uniqueDays },
      streak: calcStreak(sessions),
    }
  }, [sessions])

  const todayTemplate = templates.find(t => t.id === schedule[today]) ?? null

  function startToday() {
    if (todayTemplate) { setLogTemplateId(todayTemplate.id) }
    setActivePage('log')
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="GymTracker" />
      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-lg mx-auto w-full">
        <div className="flex flex-col gap-5">

          {/* Today hero */}
          <div className={`rounded-2xl p-5 shadow-lg text-white ${todayTemplate ? 'bg-gradient-to-br from-indigo-600 to-indigo-700' : 'bg-gradient-to-br from-gray-700 to-gray-800'}`}>
            <p className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-1">Today</p>
            {todayTemplate ? (
              <>
                <h2 className="text-xl font-bold mb-1">{todayTemplate.name}</h2>
                <p className="text-sm opacity-70 mb-4">{todayTemplate.exercises.length} exercise{todayTemplate.exercises.length !== 1 ? 's' : ''}</p>
                <Button variant="secondary" className="bg-white text-indigo-600 border-0 hover:bg-indigo-50" onClick={startToday}>
                  Start Workout
                </Button>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-1">Rest Day</h2>
                <p className="text-sm opacity-60 mb-4">No workout scheduled</p>
                <div className="flex gap-2">
                  <Button variant="secondary" className="bg-white/20 text-white border-0 hover:bg-white/30 text-sm" onClick={() => setAssignDay(today)}>
                    Schedule Workout
                  </Button>
                  {templates.length > 0 && (
                    <Button variant="secondary" className="bg-white text-gray-800 border-0 hover:bg-gray-100 text-sm" onClick={startToday}>
                      Log Anyway
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Weekly planner */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">This Week</p>
              <p className="text-xs text-gray-400">Tap to schedule</p>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {SCHEDULE_DAYS.map(day => {
                const tmpl = templates.find(t => t.id === schedule[day])
                const isToday = day === today
                return (
                  <button
                    key={day}
                    onClick={() => setAssignDay(day)}
                    className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-colors ${
                      isToday
                        ? tmpl ? 'bg-indigo-600 text-white' : 'bg-indigo-50 dark:bg-indigo-900/30 border-2 border-indigo-300 dark:border-indigo-600 text-indigo-600 dark:text-indigo-400'
                        : tmpl ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30' : 'bg-gray-50 dark:bg-gray-800 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-dashed border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase">{DAY_LABELS[day]}</span>
                    {tmpl ? (
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isToday ? 'bg-white/20' : 'bg-indigo-100 dark:bg-indigo-900/40'}`}>
                        <svg className={`h-3.5 w-3.5 ${isToday ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center">
                        <span className="text-sm">—</span>
                      </div>
                    )}
                    {tmpl && (
                      <span className={`text-[8px] font-medium leading-tight text-center w-full truncate px-0.5 ${isToday ? 'text-indigo-100' : 'text-gray-500 dark:text-gray-400'}`}>
                        {tmpl.name}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Stats row */}
          {sessions.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {[
                { value: stats.total, label: 'Total' },
                { value: stats.weekSessions, label: 'This week' },
                { value: stats.monthDays, label: 'Days / mo' },
                { value: streak, label: streak === 1 ? 'Day streak' : 'Day streak', suffix: streak > 0 ? '🔥' : '' },
              ].map(({ value, label, suffix }) => (
                <div key={label} className="bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
                  <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                    {value}{suffix && <span className="text-base ml-0.5">{suffix}</span>}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">{label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Recent sessions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Recent Workouts</p>
              {sessions.length > 3 && (
                <button onClick={() => setActivePage('history')} className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
                  View all
                </button>
              )}
            </div>
            {recentSessions.length === 0 ? (
              <div className="py-8 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
                <p className="text-sm text-gray-400">No workouts yet</p>
                <p className="text-xs text-gray-300 dark:text-gray-600 mt-0.5">Log your first workout to see it here</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {recentSessions.map(s => <SessionCard key={s.id} session={s} onClick={() => setActivePage('history')} />)}
              </div>
            )}
          </div>

          {/* Backup / restore */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4">
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Data Backup</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Export your workouts, sessions, and settings as a JSON file, or restore from a previous backup.</p>
            <div className="flex gap-2">
              <button
                onClick={exportData}
                className="flex-1 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
              >
                Export Backup
              </button>
              <button
                onClick={() => importRef.current?.click()}
                className="flex-1 py-2 rounded-xl text-xs font-semibold border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Restore Backup
              </button>
              <input
                ref={importRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) importData(file, () => window.location.reload())
                  e.target.value = ''
                }}
              />
            </div>
          </div>

        </div>
      </div>

      {assignDay && (
        <AssignSheet
          day={assignDay}
          templates={templates}
          current={schedule[assignDay]}
          onAssign={id => setDayTemplate(assignDay, id)}
          onClose={() => setAssignDay(null)}
        />
      )}
    </div>
  )
}
