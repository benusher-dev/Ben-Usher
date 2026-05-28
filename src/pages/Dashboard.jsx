import { useMemo, useState } from 'react'
import { useApp } from '../store/AppContext'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { SessionCard } from '../components/sessions/SessionCard'
import { useSchedule, SCHEDULE_DAYS, DAY_LABELS, DAY_FULL, todayKey } from '../hooks/useSchedule'

function weekStart() {
  const d = new Date()
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  d.setHours(0, 0, 0, 0)
  return d
}

function monthStart() {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

// Sheet for assigning a template to a day
function AssignSheet({ day, templates, current, onAssign, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-t-3xl w-full max-w-lg pb-8"
        style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 pt-4 pb-3 border-b border-gray-100">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-900">{DAY_FULL[day]}</h3>
          <p className="text-xs text-gray-500 mt-0.5">Choose a workout to schedule</p>
        </div>
        <div className="overflow-y-auto max-h-96">
          <button
            onClick={() => { onAssign(null); onClose() }}
            className={`w-full text-left px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${!current ? 'text-indigo-600' : 'text-gray-500'}`}
          >
            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-sm">😴</div>
            <span className="text-sm font-medium">Rest Day</span>
            {!current && <svg className="h-4 w-4 ml-auto text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>}
          </button>
          {templates.map(t => (
            <button
              key={t.id}
              onClick={() => { onAssign(t.id); onClose() }}
              className={`w-full text-left px-5 py-3 flex items-center gap-3 hover:bg-indigo-50 transition-colors ${current === t.id ? 'text-indigo-600' : 'text-gray-800'}`}
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center">
                <svg className="h-4 w-4 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

export function Dashboard() {
  const { sessions, setActivePage, setLogTemplateId, templates } = useApp()
  const { schedule, setDayTemplate } = useSchedule()
  const [assignDay, setAssignDay] = useState(null)
  const today = todayKey()

  const recentSessions = useMemo(
    () => [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3),
    [sessions]
  )

  const stats = useMemo(() => {
    const ws = weekStart()
    const ms = monthStart()
    const thisWeek = sessions.filter(s => new Date(s.date) >= ws)
    const thisMonth = sessions.filter(s => new Date(s.date) >= ms)
    const uniqueDays = new Set(thisMonth.map(s => new Date(s.date).toDateString())).size
    return { total: sessions.length, weekSessions: thisWeek.length, monthDays: uniqueDays }
  }, [sessions])

  const todayTemplate = templates.find(t => t.id === schedule[today]) ?? null

  function startToday() {
    if (todayTemplate) {
      setLogTemplateId(todayTemplate.id)
      setActivePage('log')
    } else {
      setActivePage('log')
    }
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="GymTracker" />
      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-lg mx-auto w-full">
        <div className="flex flex-col gap-5">

          {/* Today's workout hero */}
          <div className={`rounded-2xl p-5 shadow-lg text-white ${todayTemplate ? 'bg-gradient-to-br from-indigo-600 to-indigo-700' : 'bg-gradient-to-br from-gray-700 to-gray-800'}`}>
            <p className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-1">Today</p>
            {todayTemplate ? (
              <>
                <h2 className="text-xl font-bold mb-1">{todayTemplate.name}</h2>
                <p className="text-sm opacity-70 mb-4">{todayTemplate.exercises.length} exercise{todayTemplate.exercises.length !== 1 ? 's' : ''}</p>
                <Button
                  variant="secondary"
                  className="bg-white text-indigo-600 border-0 hover:bg-indigo-50"
                  onClick={startToday}
                >
                  Start Workout
                </Button>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-1">Rest Day</h2>
                <p className="text-sm opacity-60 mb-4">No workout scheduled</p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    className="bg-white/20 text-white border-0 hover:bg-white/30 text-sm"
                    onClick={() => setAssignDay(today)}
                  >
                    Schedule Workout
                  </Button>
                  {templates.length > 0 && (
                    <Button
                      variant="secondary"
                      className="bg-white text-gray-800 border-0 hover:bg-gray-100 text-sm"
                      onClick={startToday}
                    >
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
              <p className="text-sm font-semibold text-gray-900">This Week</p>
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
                        ? tmpl ? 'bg-indigo-600 text-white' : 'bg-indigo-50 border-2 border-indigo-300 text-indigo-600'
                        : tmpl ? 'bg-gray-100 text-gray-700 hover:bg-indigo-50' : 'bg-gray-50 text-gray-400 hover:bg-gray-100 border border-dashed border-gray-200'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase">{DAY_LABELS[day]}</span>
                    {tmpl ? (
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isToday ? 'bg-white/20' : 'bg-indigo-100'}`}>
                        <svg className={`h-3.5 w-3.5 ${isToday ? 'text-white' : 'text-indigo-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3" />
                        </svg>
                      </div>
                    ) : (
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isToday ? 'bg-white/10' : ''}`}>
                        <span className="text-sm">—</span>
                      </div>
                    )}
                    {tmpl && (
                      <span className={`text-[8px] font-medium leading-tight text-center w-full truncate px-0.5 ${isToday ? 'text-indigo-100' : 'text-gray-500'}`}>
                        {tmpl.name}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Stats */}
          {sessions.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
                <p className="text-2xl font-bold text-indigo-600">{stats.total}</p>
                <p className="text-xs text-gray-500 mt-0.5">Total sessions</p>
              </div>
              <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
                <p className="text-2xl font-bold text-indigo-600">{stats.weekSessions}</p>
                <p className="text-xs text-gray-500 mt-0.5">This week</p>
              </div>
              <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
                <p className="text-2xl font-bold text-indigo-600">{stats.monthDays}</p>
                <p className="text-xs text-gray-500 mt-0.5">Days trained</p>
              </div>
            </div>
          )}

          {/* Recent Sessions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-900">Recent Workouts</p>
              {sessions.length > 3 && (
                <button onClick={() => setActivePage('history')} className="text-xs text-indigo-600 font-medium hover:underline">
                  View all
                </button>
              )}
            </div>
            {recentSessions.length === 0 ? (
              <div className="py-8 text-center border-2 border-dashed border-gray-200 rounded-2xl">
                <p className="text-sm text-gray-400">No workouts yet</p>
                <p className="text-xs text-gray-300 mt-0.5">Log your first workout to see it here</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {recentSessions.map(s => (
                  <SessionCard key={s.id} session={s} onClick={() => setActivePage('history')} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assign sheet */}
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
