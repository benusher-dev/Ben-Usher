import { useState, useMemo } from 'react'

const PLATE_SIZES = [25, 20, 15, 10, 5, 2.5, 1.25]
const PLATE_COLORS = {
  25:   { bg: '#ef4444', text: '#fff' },
  20:   { bg: '#3b82f6', text: '#fff' },
  15:   { bg: '#f59e0b', text: '#fff' },
  10:   { bg: '#22c55e', text: '#fff' },
  5:    { bg: '#f97316', text: '#fff' },
  2.5:  { bg: '#6b7280', text: '#fff' },
  1.25: { bg: '#d1d5db', text: '#374151' },
}

const RM_PERCENTAGES = [100, 95, 90, 85, 80, 75, 70, 60, 50]
const RM_REPS        = [  1,  2,  3,  5,  6,  8, 10, 15, 20]

function plateColor(kg) { return PLATE_COLORS[kg] ?? { bg: '#e5e7eb', text: '#374151' } }

function calcPlates(targetKg, barKg) {
  let remaining = Math.max(0, (targetKg - barKg) / 2)
  const result = []
  for (const p of PLATE_SIZES) {
    const count = Math.floor(remaining / p)
    if (count > 0) { result.push({ kg: p, count }); remaining = +(remaining - count * p).toFixed(4) }
  }
  return { plates: result, remainder: remaining }
}

function PlateDisc({ kg }) {
  const c = plateColor(kg)
  const height = Math.max(24, Math.min(64, kg * 2.2))
  return (
    <div className="flex-shrink-0 rounded flex items-center justify-center" style={{ width: 18, height, background: c.bg, color: c.text }}>
      <span style={{ fontSize: 7, fontWeight: 700, writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)', lineHeight: 1 }}>
        {kg}
      </span>
    </div>
  )
}

export function PlateCalculator({ onClose }) {
  const [activeTab, setActiveTab] = useState('plates')

  // Plates tab
  const [target, setTarget] = useState('')
  const [barKg, setBarKg] = useState(20)

  // 1RM tab
  const [rmWeight, setRmWeight] = useState('')
  const [rmReps, setRmReps] = useState('')

  const result = useMemo(() => {
    const t = parseFloat(target)
    if (!t || t <= 0) return null
    if (t < barKg) return { error: `Target must be ≥ bar weight (${barKg} kg)` }
    return calcPlates(t, barKg)
  }, [target, barKg])

  const oneRM = useMemo(() => {
    const w = parseFloat(rmWeight)
    const r = parseInt(rmReps)
    if (!w || !r || w <= 0 || r <= 0) return null
    if (r === 1) return w
    return +(w * (1 + r / 30)).toFixed(1)
  }, [rmWeight, rmReps])

  const barPlates = result?.plates ?? []

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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Calculator</h3>
            <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden mb-4">
            {[{ id: 'plates', label: 'Plate Calc' }, { id: '1rm', label: '1RM Est.' }].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 text-sm font-semibold transition-colors ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Plates tab ── */}
          {activeTab === 'plates' && (
            <>
              <div className="flex gap-3 mb-4">
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Target Weight (kg)</label>
                  <input
                    type="number" min="0" step="2.5" placeholder="100"
                    value={target}
                    onChange={e => setTarget(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Bar</label>
                  <div className="flex rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden text-xs font-semibold">
                    {[20, 15].map(b => (
                      <button
                        key={b}
                        onClick={() => setBarKg(b)}
                        className={`px-3 py-2 transition-colors ${barKg === b ? 'bg-indigo-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                      >
                        {b}kg
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {result?.error && <p className="text-sm text-red-500 text-center py-4">{result.error}</p>}

              {result && !result.error && (
                <>
                  <div className="flex items-center justify-center gap-0.5 mb-4 overflow-x-auto py-2" style={{ scrollbarWidth: 'none' }}>
                    {[...barPlates].reverse().flatMap(({ kg, count }) =>
                      Array.from({ length: count }, (_, i) => <PlateDisc key={`l-${kg}-${i}`} kg={kg} />)
                    )}
                    <div className="flex-shrink-0 bg-gray-400 dark:bg-gray-500 rounded h-3 mx-1" style={{ width: 48, minWidth: 48 }} />
                    {barPlates.flatMap(({ kg, count }) =>
                      Array.from({ length: count }, (_, i) => <PlateDisc key={`r-${kg}-${i}`} kg={kg} />)
                    )}
                  </div>

                  {barPlates.length === 0 ? (
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400">Just the bar ({barKg} kg)</p>
                  ) : (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Per side</p>
                      <div className="flex flex-wrap gap-2">
                        {barPlates.map(({ kg, count }) => {
                          const c = plateColor(kg)
                          return (
                            <div key={kg} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold" style={{ background: c.bg + '22', color: c.bg }}>
                              <span>{count}×</span><span>{kg} kg</span>
                            </div>
                          )
                        })}
                      </div>
                      {result.remainder > 0.001 && (
                        <p className="text-xs text-amber-600 mt-2">Note: {result.remainder.toFixed(2)} kg cannot be made with standard plates</p>
                      )}
                    </div>
                  )}

                  <div className="mt-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-indigo-500 dark:text-indigo-400 font-medium">Total on bar</p>
                      <p className="text-lg font-bold text-indigo-700 dark:text-indigo-300">{parseFloat(target)} kg</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-indigo-500 dark:text-indigo-400 font-medium">Per side</p>
                      <p className="text-base font-bold text-indigo-700 dark:text-indigo-300">
                        {barPlates.reduce((s, { kg, count }) => s + kg * count, 0).toFixed(2)} kg
                      </p>
                    </div>
                  </div>
                </>
              )}

              {!target && <div className="text-center py-6 text-gray-400 text-sm">Enter a target weight to calculate</div>}
            </>
          )}

          {/* ── 1RM tab ── */}
          {activeTab === '1rm' && (
            <>
              <div className="flex gap-3 mb-4">
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Weight Lifted (kg)</label>
                  <input
                    type="number" min="0" step="0.5" placeholder="80"
                    value={rmWeight}
                    onChange={e => setRmWeight(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Reps Performed</label>
                  <input
                    type="number" min="1" max="30" step="1" placeholder="5"
                    value={rmReps}
                    onChange={e => setRmReps(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {oneRM ? (
                <>
                  <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-xl p-3 flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs text-indigo-500 dark:text-indigo-400 font-medium">Estimated 1RM</p>
                      <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{oneRM} kg</p>
                    </div>
                    <p className="text-xs text-indigo-400 dark:text-indigo-500 text-right max-w-[100px]">Epley formula<br/>w × (1 + r/30)</p>
                  </div>

                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">% Table</p>
                  <div className="flex flex-col gap-1">
                    {RM_PERCENTAGES.map((pct, idx) => {
                      const w = +(oneRM * pct / 100).toFixed(1)
                      const isMax = pct === 100
                      return (
                        <div
                          key={pct}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm ${
                            isMax ? 'bg-indigo-600 text-white font-bold' : 'bg-gray-50 dark:bg-gray-700/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`font-bold w-8 ${isMax ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'}`}>{pct}%</span>
                            <span className={isMax ? 'text-indigo-100' : 'text-gray-400 dark:text-gray-500'}>~{RM_REPS[idx]} rep{RM_REPS[idx] !== 1 ? 's' : ''}</span>
                          </div>
                          <span className={`font-semibold tabular-nums ${isMax ? 'text-white' : 'text-gray-800 dark:text-gray-200'}`}>{w} kg</span>
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : (
                <div className="text-center py-6 text-gray-400 text-sm">Enter weight and reps to estimate your 1RM</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
