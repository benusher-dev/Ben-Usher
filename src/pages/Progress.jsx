import { useState, useMemo } from 'react'
import { useApp } from '../store/AppContext'
import { PageHeader } from '../components/layout/PageHeader'
import { EmptyState } from '../components/ui/EmptyState'
import { ProgressChart } from '../components/progress/ProgressChart'
import { formatDate } from '../utils/dateHelpers'
import { useBodyWeight } from '../hooks/useBodyWeight'

const METRICS = [
  { id: 'maxWeight', label: 'Max Weight (kg)' },
  { id: 'totalVolume', label: 'Total Volume (kg)' },
  { id: 'totalReps', label: 'Total Reps' },
]

function computeMetric(sets, metricId) {
  if (!sets || sets.length === 0) return 0
  if (metricId === 'maxWeight') return Math.max(...sets.map(s => s.weight || 0))
  if (metricId === 'totalVolume') return sets.reduce((sum, s) => sum + (s.reps || 0) * (s.weight || 0), 0)
  if (metricId === 'totalReps') return sets.reduce((sum, s) => sum + (s.reps || 0), 0)
  return 0
}

// ── Exercise progress tab ────────────────────────────────────────────────────
function ExerciseTab({ sessions, setActivePage }) {
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
        return { date: s.date, value: computeMetric(ex.sets, metric) }
      })
  }, [sessions, selectedExercise, metric])

  const selectedMetric = METRICS.find(m => m.id === metric)

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Exercise</label>
        <select
          value={selectedExercise}
          onChange={e => setSelectedExercise(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="">Choose an exercise…</option>
          {exerciseNames.map(name => <option key={name} value={name}>{name}</option>)}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Metric</label>
        <div className="flex gap-2">
          {METRICS.map(m => (
            <button
              key={m.id}
              onClick={() => setMetric(m.id)}
              className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-colors ${metric === m.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {m.label.split(' (')[0]}
            </button>
          ))}
        </div>
      </div>
      {selectedExercise ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-sm font-semibold text-gray-900 mb-3">{selectedExercise} — {selectedMetric.label}</p>
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
                        <td className="py-1 text-right font-medium text-indigo-600">{d.value.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400 text-sm">Select an exercise to view progress</div>
      )}
    </div>
  )
}

// ── Personal Records tab ─────────────────────────────────────────────────────
function RecordsTab({ sessions }) {
  const records = useMemo(() => {
    const map = {}
    sessions.forEach(s => {
      s.exercises.forEach(ex => {
        const key = ex.name
        if (!map[key]) map[key] = { name: key, maxWeight: 0, maxReps: 0, maxVolume: 0, date: s.date }
        ex.sets.forEach(set => {
          if ((set.weight || 0) > map[key].maxWeight) {
            map[key].maxWeight = set.weight || 0
            map[key].maxWeightDate = s.date
          }
          if ((set.reps || 0) > map[key].maxReps) {
            map[key].maxReps = set.reps || 0
          }
          const vol = (set.reps || 0) * (set.weight || 0)
          if (vol > map[key].maxVolume) {
            map[key].maxVolume = vol
            map[key].maxVolumeDate = s.date
          }
        })
      })
    })
    return Object.values(map).sort((a, b) => a.name.localeCompare(b.name))
  }, [sessions])

  if (records.length === 0) {
    return <div className="text-center py-8 text-gray-400 text-sm">Log some workouts to see your personal records</div>
  }

  return (
    <div className="flex flex-col gap-3">
      {records.map(r => (
        <div key={r.name} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">🏆</span>
            <p className="text-sm font-semibold text-gray-900">{r.name}</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {r.maxWeight > 0 && (
              <div className="text-center">
                <p className="text-lg font-bold text-indigo-600">{r.maxWeight}<span className="text-xs font-normal text-gray-400">kg</span></p>
                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Max Weight</p>
              </div>
            )}
            <div className="text-center">
              <p className="text-lg font-bold text-indigo-600">{r.maxReps}</p>
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Max Reps</p>
            </div>
            {r.maxVolume > 0 && (
              <div className="text-center">
                <p className="text-lg font-bold text-indigo-600">{r.maxVolume.toLocaleString()}<span className="text-xs font-normal text-gray-400">kg</span></p>
                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Best Set Vol</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Body Weight tab ──────────────────────────────────────────────────────────
function BodyWeightTab() {
  const { entries, logWeight, deleteEntry } = useBodyWeight()
  const [inputVal, setInputVal] = useState('')
  const [unit, setUnit] = useState('kg') // kg or lbs

  function handleSave() {
    const num = parseFloat(inputVal)
    if (!num || num <= 0) return
    const inKg = unit === 'lbs' ? +(num * 0.453592).toFixed(1) : num
    logWeight(inKg)
    setInputVal('')
  }

  const todayEntry = useMemo(() => {
    const todayStr = new Date().toDateString()
    return entries.find(e => new Date(e.date).toDateString() === todayStr)
  }, [entries])

  // Simple SVG line chart
  const chartData = entries.slice(-30) // last 30 entries
  const chartH = 80
  const chartW = 280

  const minW = chartData.length ? Math.min(...chartData.map(e => e.weight)) - 1 : 0
  const maxW = chartData.length ? Math.max(...chartData.map(e => e.weight)) + 1 : 100

  function px(i) { return chartData.length < 2 ? chartW / 2 : (i / (chartData.length - 1)) * chartW }
  function py(w) { return chartH - ((w - minW) / Math.max(maxW - minW, 0.1)) * chartH }

  const path = chartData.map((e, i) => `${i === 0 ? 'M' : 'L'}${px(i).toFixed(1)},${py(e.weight).toFixed(1)}`).join(' ')

  const displayWeight = w => unit === 'lbs' ? (w / 0.453592).toFixed(1) : w
  const displayUnit = unit

  return (
    <div className="flex flex-col gap-4">
      {/* Log today */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <p className="text-sm font-semibold text-gray-900 mb-3">
          {todayEntry ? 'Update Today\'s Weight' : 'Log Today\'s Weight'}
        </p>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="number"
              min="1"
              step="0.1"
              placeholder={todayEntry ? displayWeight(todayEntry.weight) : '70.0'}
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex rounded-xl border border-gray-200 overflow-hidden text-xs font-semibold">
            <button onClick={() => setUnit('kg')} className={`px-3 py-2 transition-colors ${unit === 'kg' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>kg</button>
            <button onClick={() => setUnit('lbs')} className={`px-3 py-2 transition-colors ${unit === 'lbs' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>lbs</button>
          </div>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            Save
          </button>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 1 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-900">Weight Over Time</p>
            <span className="text-xs text-gray-400">{displayUnit}</span>
          </div>
          <svg viewBox={`-10 -5 ${chartW + 20} ${chartH + 15}`} className="w-full">
            {/* Grid lines */}
            {[0, 0.5, 1].map(t => {
              const y = py(minW + t * (maxW - minW))
              const val = minW + t * (maxW - minW)
              return (
                <g key={t}>
                  <line x1="0" y1={y} x2={chartW} y2={y} stroke="#f3f4f6" strokeWidth="1" />
                  <text x="-5" y={y + 3} fontSize="7" textAnchor="end" fill="#9ca3af">{displayWeight(val)}</text>
                </g>
              )
            })}
            {/* Area fill */}
            {chartData.length > 1 && (
              <path
                d={`${path} L${px(chartData.length - 1).toFixed(1)},${chartH} L0,${chartH} Z`}
                fill="#6366f1" fillOpacity="0.08"
              />
            )}
            {/* Line */}
            {chartData.length > 1 && <path d={path} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
            {/* Latest dot */}
            {chartData.length > 0 && (
              <circle cx={px(chartData.length - 1)} cy={py(chartData[chartData.length - 1].weight)} r="4" fill="#6366f1" />
            )}
          </svg>
          <div className="flex justify-between text-[9px] text-gray-400 mt-1">
            <span>{new Date(chartData[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            <span>{new Date(chartData[chartData.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
        </div>
      )}

      {/* Recent entries */}
      {entries.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-sm font-semibold text-gray-900 mb-3">Recent Entries</p>
          <div className="flex flex-col divide-y divide-gray-50">
            {[...entries].reverse().slice(0, 20).map(e => (
              <div key={e.id} className="flex items-center justify-between py-2">
                <span className="text-xs text-gray-500">{formatDate(e.date)}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-900">
                    {displayWeight(e.weight)} <span className="text-xs font-normal text-gray-400">{displayUnit}</span>
                  </span>
                  <button onClick={() => deleteEntry(e.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14H6L5 6M9 6V4h6v2" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {entries.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">Log your first weight above</div>
      )}
    </div>
  )
}

// ── Main Progress page ───────────────────────────────────────────────────────
const TABS = [
  { id: 'exercise', label: 'Exercise' },
  { id: 'records', label: 'Records' },
  { id: 'weight', label: 'Body Weight' },
]

export function Progress() {
  const { sessions, setActivePage } = useApp()
  const [tab, setTab] = useState('exercise')

  if (sessions.length === 0 && tab !== 'weight') {
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

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Progress" />
      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-lg mx-auto w-full">
        {/* Tab bar */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-4">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'exercise' && <ExerciseTab sessions={sessions} setActivePage={setActivePage} />}
        {tab === 'records' && <RecordsTab sessions={sessions} />}
        {tab === 'weight' && <BodyWeightTab />}
      </div>
    </div>
  )
}
