const W = 320
const H = 180
const PAD = { top: 16, right: 16, bottom: 40, left: 44 }
const CHART_W = W - PAD.left - PAD.right
const CHART_H = H - PAD.top - PAD.bottom

function lerp(value, inMin, inMax, outMin, outMax) {
  if (inMax === inMin) return (outMin + outMax) / 2
  return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin)
}

export function ProgressChart({ data, metric }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-44 text-gray-400 text-sm">
        No data yet
      </div>
    )
  }

  const values = data.map(d => d.value)
  const yMin = Math.min(...values)
  const yMax = Math.max(...values)
  const yPad = yMax === yMin ? 1 : (yMax - yMin) * 0.1

  const points = data.map((d, i) => {
    const x = PAD.left + lerp(i, 0, data.length - 1, 0, CHART_W)
    const y = PAD.top + lerp(d.value, yMax + yPad, yMin - yPad, 0, CHART_H)
    return { x, y, d }
  })

  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ')

  const yTicks = 4
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) =>
    lerp(i, 0, yTicks, yMin - yPad, yMax + yPad)
  ).reverse()

  const xTickIndices = data.length <= 5
    ? data.map((_, i) => i)
    : [0, Math.floor(data.length / 2), data.length - 1]

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ minWidth: 280 }}
        role="img"
        aria-label={`${metric} over time`}
      >
        {/* Y grid lines */}
        {yTickValues.map((val, i) => {
          const y = PAD.top + lerp(val, yMax + yPad, yMin - yPad, 0, CHART_H)
          return (
            <g key={i}>
              <line
                x1={PAD.left} y1={y} x2={PAD.left + CHART_W} y2={y}
                stroke="#f3f4f6" strokeWidth="1"
              />
              <text
                x={PAD.left - 6} y={y + 4}
                textAnchor="end" fontSize="10" fill="#9ca3af"
              >
                {Math.round(val)}
              </text>
            </g>
          )
        })}

        {/* X tick labels */}
        {xTickIndices.map(i => {
          const p = points[i]
          const label = new Date(data[i].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          return (
            <text
              key={i}
              x={p.x} y={H - 6}
              textAnchor="middle" fontSize="10" fill="#9ca3af"
            >
              {label}
            </text>
          )
        })}

        {/* Line */}
        {data.length > 1 && (
          <polyline
            points={polylinePoints}
            fill="none"
            stroke="#6366f1"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {/* Dots */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4" fill="#6366f1" stroke="white" strokeWidth="2" />
        ))}
      </svg>
    </div>
  )
}
