import { useMemo } from 'react'
import { useApp } from '../store/AppContext'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { SessionCard } from '../components/sessions/SessionCard'
import { EmptyState } from '../components/ui/EmptyState'

function weekStart() {
  const d = new Date()
  d.setDate(d.getDate() - d.getDay())
  d.setHours(0, 0, 0, 0)
  return d
}

function monthStart() {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

export function Dashboard() {
  const { sessions, setActivePage, setLogTemplateId, templates } = useApp()

  const recentSessions = useMemo(
    () => [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3),
    [sessions]
  )

  const stats = useMemo(() => {
    const ws = weekStart()
    const ms = monthStart()
    const thisWeek = sessions.filter(s => new Date(s.date) >= ws)
    const thisMonth = sessions.filter(s => new Date(s.date) >= ms)

    let weekVol = 0
    thisWeek.forEach(s =>
      s.exercises.forEach(ex =>
        ex.sets.forEach(set => { weekVol += (set.reps || 0) * (set.weight || 0) })
      )
    )

    const uniqueDays = new Set(
      thisMonth.map(s => new Date(s.date).toDateString())
    ).size

    return {
      total: sessions.length,
      weekSessions: thisWeek.length,
      weekVolume: weekVol,
      monthDays: uniqueDays,
    }
  }, [sessions])

  function startQuickLog() {
    if (templates.length === 0) {
      setActivePage('workouts')
      return
    }
    setLogTemplateId(null)
    setActivePage('log')
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="GymTracker" />
      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-lg mx-auto w-full">
        <div className="flex flex-col gap-5">
          {/* Hero / Quick Start */}
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-5 text-white shadow-lg">
            <p className="text-indigo-200 text-sm font-medium mb-1">Ready to train?</p>
            <h2 className="text-2xl font-bold mb-4">
              {templates.length > 0 ? `${templates.length} workout${templates.length > 1 ? 's' : ''} ready` : 'Get started'}
            </h2>
            <Button
              variant="secondary"
              className="bg-white text-indigo-600 border-0 hover:bg-indigo-50"
              onClick={startQuickLog}
            >
              {templates.length > 0 ? 'Log Workout' : 'Create First Workout'}
            </Button>
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
                <button
                  onClick={() => setActivePage('history')}
                  className="text-xs text-indigo-600 font-medium hover:underline"
                >
                  View all
                </button>
              )}
            </div>

            {recentSessions.length === 0 ? (
              <EmptyState
                icon="🏃"
                title="No workouts yet"
                description="Log your first workout to see it here"
              />
            ) : (
              <div className="flex flex-col gap-3">
                {recentSessions.map(s => (
                  <SessionCard
                    key={s.id}
                    session={s}
                    onClick={() => setActivePage('history')}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
