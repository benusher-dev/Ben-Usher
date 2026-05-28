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
  const [target, setTarget] = useState('')
  const [barKg, setBarKg] = useState(20)

  const result = useMemo(() => {
    const t = parseFloat(target)
    if (!t || t <= 0) return null
    if (t < barKg) return { error: `Target must be ≥ bar weight (${barKg} kg)` }
    return calcPlates(t, barKg)
  }, [target, barKg])

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
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Plate Calculator</h3>
            <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

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
        </div>
      </div>
    </div>
  )
}
