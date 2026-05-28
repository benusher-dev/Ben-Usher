import { useState, useMemo } from 'react'

const PLATE_SIZES = [25, 20, 15, 10, 5, 2.5, 1.25]
const PLATE_COLORS = {
  25: { bg: '#ef4444', text: '#fff' },   // red
  20: '#3b82f6',                          // blue
  15: '#f59e0b',                          // yellow
  10: '#22c55e',                          // green
  5:  '#f97316',                          // orange
  2.5: { bg: '#6b7280', text: '#fff' },  // gray
  1.25: { bg: '#d1d5db', text: '#374151' }, // light gray
}

function plateColor(kg) {
  const c = PLATE_COLORS[kg]
  if (typeof c === 'string') return { bg: c, text: '#fff' }
  return c ?? { bg: '#e5e7eb', text: '#374151' }
}

function calcPlates(targetKg, barKg) {
  let remaining = Math.max(0, (targetKg - barKg) / 2)
  const result = []
  for (const p of PLATE_SIZES) {
    const count = Math.floor(remaining / p)
    if (count > 0) {
      result.push({ kg: p, count })
      remaining = +(remaining - count * p).toFixed(4)
    }
  }
  return { plates: result, remainder: remaining }
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

  // Build a visual bar with plates
  const barPlates = result?.plates ?? []

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-t-3xl w-full max-w-lg"
        style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="pt-3 pb-1 flex justify-center">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="px-5 pt-2 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900">Plate Calculator</h3>
            <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Inputs */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-500 block mb-1">Target Weight (kg)</label>
              <input
                type="number"
                min="0"
                step="2.5"
                placeholder="100"
                value={target}
                onChange={e => setTarget(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Bar</label>
              <div className="flex rounded-xl border border-gray-200 overflow-hidden text-xs font-semibold">
                {[20, 15].map(b => (
                  <button
                    key={b}
                    onClick={() => setBarKg(b)}
                    className={`px-3 py-2 transition-colors ${barKg === b ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    {b}kg
                  </button>
                ))}
              </div>
            </div>
          </div>

          {result?.error && (
            <p className="text-sm text-red-500 text-center py-4">{result.error}</p>
          )}

          {result && !result.error && (
            <>
              {/* Visual bar */}
              <div className="flex items-center justify-center gap-0.5 mb-4 overflow-x-auto py-2" style={{ scrollbarWidth: 'none' }}>
                {/* Left plates (reversed) */}
                {[...barPlates].reverse().flatMap(({ kg, count }) =>
                  Array.from({ length: count }, (_, i) => (
                    <PlateDisc key={`l-${kg}-${i}`} kg={kg} />
                  ))
                )}
                {/* Bar */}
                <div className="flex-shrink-0 bg-gray-400 rounded h-3 mx-1" style={{ width: 48, minWidth: 48 }} />
                {/* Right plates */}
                {barPlates.flatMap(({ kg, count }) =>
                  Array.from({ length: count }, (_, i) => (
                    <PlateDisc key={`r-${kg}-${i}`} kg={kg} />
                  ))
                )}
              </div>

              {/* Plates per side */}
              {barPlates.length === 0 ? (
                <p className="text-center text-sm text-gray-500">Just the bar ({barKg} kg)</p>
              ) : (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Per side</p>
                  <div className="flex flex-wrap gap-2">
                    {barPlates.map(({ kg, count }) => {
                      const c = plateColor(kg)
                      return (
                        <div key={kg} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold" style={{ background: c.bg + '22', color: c.bg }}>
                          <span style={{ color: c.bg }}>{count}×</span>
                          <span>{kg} kg</span>
                        </div>
                      )
                    })}
                  </div>
                  {result.remainder > 0.001 && (
                    <p className="text-xs text-amber-600 mt-2">Note: {result.remainder.toFixed(2)} kg cannot be made with standard plates</p>
                  )}
                </div>
              )}

              {/* Summary */}
              <div className="mt-4 bg-indigo-50 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-indigo-500 font-medium">Total on bar</p>
                  <p className="text-lg font-bold text-indigo-700">{parseFloat(target)} kg</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-indigo-500 font-medium">Per side</p>
                  <p className="text-base font-bold text-indigo-700">
                    {(barPlates.reduce((s, { kg, count }) => s + kg * count, 0)).toFixed(2)} kg
                  </p>
                </div>
              </div>
            </>
          )}

          {!target && (
            <div className="text-center py-6 text-gray-400 text-sm">Enter a target weight to calculate</div>
          )}
        </div>
      </div>
    </div>
  )
}

function PlateDisc({ kg }) {
  const c = plateColor(kg)
  const height = Math.max(24, Math.min(64, kg * 2.2))
  return (
    <div
      className="flex-shrink-0 rounded flex items-center justify-center"
      style={{
        width: 18,
        height,
        background: c.bg,
        color: c.text,
      }}
    >
      <span style={{ fontSize: 7, fontWeight: 700, writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)', lineHeight: 1 }}>
        {kg}
      </span>
    </div>
  )
}
