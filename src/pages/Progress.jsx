import { useState, useMemo } from 'react'
import { useApp } from '../store/AppContext'
import { PageHeader } from '../components/layout/PageHeader'
import { EmptyState } from '../components/ui/EmptyState'
import { ProgressChart } from '../components/progress/ProgressChart'
import { formatDate } from '../utils/dateHelpers'

const METRICS = [
  { id: 'maxWeight', label: 'Max Weight (kg)' },
  { id: 'totalVolume', label: 'Total Volume (kg)' },
  { id: 'totalReps', label: 'Total Reps' },
]

function computeMetric(sets, metricId) {
  if (!sets || sets.length === 0) return 0
  if (metricId === 'maxWeight') {
    return Math.max(...sets.map(s => s.weight || 0))
  }
  if (metricId === 'totalVolume') {
    return sets.reduce((sum, s) => sum + (s.reps || 0) * (s.weight || 0), 0)
  }
  if (metricId === 'totalReps') {
    return sets.reduce((sum, s) => sum + (s.reps || 0), 0)
  }
  return 0
}

export function Progress() {
  const { sessions, setActivePage } = useApp()
  const [selectedExercise, setSelectedExercise] = useState('')
  const [metric, setMetric] = useState('maxWeight')

  const exerciseNames = useMemo(() => {
    const names = new Set()
    sessions.forEach(s => s.exercises.forEach(ex => names.add(ex.name)))
    return [...names].sort()
  }, [sessions])

  const chartData = useMemo(() => {
    if (!selectedExercise) return []
    return sessions
      .filter(s => s.exercises.some(ex => ex.name === selectedExercise))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(s => {
        const ex = s.exercises.find(ex => ex.name === selectedExercise)
        return {
          date: s.date,
          value: computeMetric(ex.sets, metric),
        }
      })
  }, [sessions, selectedExercise, metric])

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Progress" />
        <div className="flex-1 overflow-y-auto">
          <EmptyState
            icon="📈"
            title="No data yet"
            description="Log some workouts to track your progress over time"
            action="Log Workout"
            onAction={() => setActivePage('log')}
          />
        </div>
      </div>
    )
  }

  const selectedMetric = METRICS.find(m => m.id === metric)

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Progress" />
      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-lg mx-auto w-full">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Exercise</label>
            <select
              value={selectedExercise}
              onChange={e => setSelectedExercise(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">Choose an exercise…</option>
              {exerciseNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Metric</label>
            <div className="flex gap-2">
              {METRICS.map(m => (
                <button
                  key={m.id}
                  onClick={() => setMetric(m.id)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                    metric === m.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {m.label.split(' (')[0]}
                </button>
              ))}
            </div>
          </div>

          {selectedExercise ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-sm font-semibold text-gray-900 mb-3">
                {selectedExercise} — {selectedMetric.label}
              </p>
              <ProgressChart data={chartData} metric={selectedMetric.label} />

              {chartData.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">Data Table</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-gray-400">
                          <th className="text-left pb-1">Date</th>
                          <th className="text-right pb-1">{selectedMetric.label}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...chartData].reverse().map((d, i) => (
                          <tr key={i} className="even:bg-gray-50">
                            <td className="py-1 text-gray-600">{formatDate(d.date)}</td>
                            <td className="py-1 text-right font-medium text-indigo-600">
                              {d.value.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">
              Select an exercise to view progress
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
