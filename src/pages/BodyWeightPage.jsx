import { useState } from 'react'
import { useApp } from '../store/AppContext'
import { PageHeader } from '../components/layout/PageHeader'
import { useBodyWeight } from '../hooks/useBodyWeight'

// ── Chart ─────────────────────────────────────────────────────────────────────
function WeightChart({ entries }) {
  const [active, setActive] = useState(null)

  if (entries.length < 2) {
    return (
      <div className="py-10 text-center text-sm text-gray-400">
        Log at least 2 entries to see the chart
      </div>
    )
  }

  const W = 320, H = 200
  const padL = 44, padR = 12, padT = 16, padB = 36
  const chartW = W - padL - padR
  const chartH = H - padT - padB

  const weights = entries.map(e => e.weight)
  const rawMin = Math.min(...weights)
  const rawMax = Math.max(...weights)
  const span = rawMax - rawMin || 1
  const yMin = +(rawMin - span * 0.15).toFixed(1)
  const yMax = +(rawMax + span * 0.15).toFixed(1)
  const yRange = yMax - yMin

  function xPos(i) { return padL + (i / (entries.length - 1)) * chartW }
  function yPos(w) { return padT + (1 - (w - yMin) / yRange) * chartH }

  const pts = entries.map((e, i) => ({ x: xPos(i), y: yPos(e.weight), entry: e }))
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const areaPath = `${linePath} L${pts[pts.length - 1].x.toFixed(1)},${padT + chartH} L${pts[0].x.toFixed(1)},${padT + chartH} Z`

  // 4 y-axis gridlines
  const yTicks = Array.from({ length: 5 }, (_, i) => +(yMin + (yRange / 4) * i).toFixed(1))

  // x-axis labels: first, last + up to 3 evenly spaced in between
  const maxXLabels = 5
  const xStep = Math.max(1, Math.ceil(entries.length / (maxXLabels - 1)))
  const xLabelIndices = new Set([0, entries.length - 1])
  for (let i = xStep; i < entries.length - 1; i += xStep) xLabelIndices.add(i)

  const ap = active !== null && active < pts.length ? pts[active] : null

  return (
    <div className="relative">
      {/* Tooltip */}
      {ap && (
        <div className="absolute left-1/2 -translate-x-1/2 top-0 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-semibold px-3 py-1.5 rounded-xl shadow-lg pointer-events-none z-10">
          {ap.entry.weight} kg · {new Date(ap.entry.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      )}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: 200 }}
        onMouseLeave={() => setActive(null)}
        onTouchEnd={() => setTimeout(() => setActive(null), 1500)}
      >
        <defs>
          <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Horizontal gridlines + y labels */}
        {yTicks.map((v, i) => (
          <g key={i}>
            <line x1={padL} y1={yPos(v)} x2={W - padR} y2={yPos(v)} stroke="#e5e7eb" strokeWidth="0.75" strokeDasharray="3 3" />
            <text x={padL - 5} y={yPos(v)} textAnchor="end" dominantBaseline="middle" fontSize="8.5" fill="#9ca3af">
              {v}
            </text>
          </g>
        ))}

        {/* X axis baseline */}
        <line x1={padL} y1={padT + chartH} x2={W - padR} y2={padT + chartH} stroke="#e5e7eb" strokeWidth="1" />

        {/* X labels */}
        {pts.map((p, i) => {
          if (!xLabelIndices.has(i)) return null
          const d = new Date(p.entry.date)
          return (
            <text key={i} x={p.x} y={H - padB + 14} textAnchor="middle" fontSize="8" fill="#9ca3af">
              {d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </text>
          )
        })}

        {/* Area fill */}
        <path d={areaPath} fill="url(#wGrad)" />

        {/* Line */}
        <path d={linePath} fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points */}
        {pts.map((p, i) => (
          <circle
            key={i}
            cx={p.x} cy={p.y} r={active === i ? 5 : 3.5}
            fill={active === i ? '#0284c7' : '#0ea5e9'}
            stroke="white" strokeWidth="1.5"
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setActive(i)}
            onTouchStart={() => setActive(i)}
          />
        ))}

        {/* Active vertical line */}
        {ap && (
          <line x1={ap.x} y1={padT} x2={ap.x} y2={padT + chartH} stroke="#0ea5e9" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
        )}
      </svg>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function BodyWeightPage() {
  const { setActivePage } = useApp()
  const { entries, logWeight, deleteEntry } = useBodyWeight()
  const [input, setInput] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  const sorted = entries // hook returns ascending
  const latest = sorted[sorted.length - 1] ?? null
  const weights = sorted.map(e => e.weight)
  const minW = weights.length ? Math.min(...weights) : null
  const maxW = weights.length ? Math.max(...weights) : null
  const avgW = weights.length ? +(weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(1) : null

  const todayLogged = sorted.some(e => new Date(e.date).toDateString() === new Date().toDateString())

  function handleLog() {
    const w = parseFloat(input)
    if (isNaN(w) || w <= 0 || w > 500) return
    logWeight(w)
    setInput('')
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Body Weight"
        action={
          <button
            onClick={() => setActivePage('dashboard')}
            className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-lg mx-auto w-full">
        <div className="flex flex-col gap-4 pb-6">

          {/* Stats row */}
          {latest && (
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Current', value: latest.weight },
                { label: 'Lowest', value: minW },
                { label: 'Highest', value: maxW },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-3 text-center">
                  <p className="text-xl font-bold text-sky-500">{value}<span className="text-sm font-medium text-gray-400 ml-0.5">kg</span></p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4">
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Weight Over Time</p>
            <WeightChart entries={sorted} />
          </div>

          {/* Quick log */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4">
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              {todayLogged ? 'Update Today\'s Weight' : 'Log Today\'s Weight'}
            </p>
            <div className="flex gap-2">
              <input
                type="number" min="20" max="500" step="0.1"
                placeholder={todayLogged ? `${latest?.weight} kg (update)` : 'e.g. 75.5'}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLog()}
                className="flex-1 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
              <button
                onClick={handleLog}
                disabled={!input}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-sky-500 text-white hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Log
              </button>
            </div>
          </div>

          {/* Entry history */}
          {sorted.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4">
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">All Entries</p>
              <div className="flex flex-col gap-1">
                {[...sorted].reverse().map((entry, i, arr) => {
                  const prev = arr[i + 1]
                  const diff = prev ? +(entry.weight - prev.weight).toFixed(1) : null
                  return (
                    <div key={entry.id} className="flex items-center gap-3 py-2 border-b border-gray-50 dark:border-gray-700/50 last:border-0">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {entry.weight} kg
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {new Date(entry.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      {diff !== null && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          diff < 0 ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                          : diff > 0 ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-500 dark:text-rose-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                        }`}>
                          {diff > 0 ? '+' : ''}{diff} kg
                        </span>
                      )}
                      <button
                        onClick={() => setConfirmDelete(entry)}
                        className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-400 transition-colors"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6" />
                        </svg>
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setConfirmDelete(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative bg-white dark:bg-gray-800 rounded-t-3xl w-full max-w-lg p-5"
            style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
            onClick={e => e.stopPropagation()}
          >
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
              Delete entry <strong className="dark:text-white">{confirmDelete.weight} kg</strong> on {new Date(confirmDelete.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300">Cancel</button>
              <button
                onClick={() => { deleteEntry(confirmDelete.id); setConfirmDelete(null) }}
                className="flex-1 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
