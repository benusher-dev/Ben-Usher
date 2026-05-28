import { useMemo } from 'react'

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAY_LABELS = ['M','T','W','T','F','S','S']

function isoDate(d) {
  return d.toISOString().slice(0, 10)
}

export function TrainingCalendar({ sessions }) {
  // Build a set of dates that have sessions
  const sessionDates = useMemo(() => {
    const map = {}
    sessions.forEach(s => {
      const key = isoDate(new Date(s.date))
      map[key] = (map[key] || 0) + 1
    })
    return map
  }, [sessions])

  // Build 16 weeks of day cells ending today
  const cells = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Find the Monday of the week 15 weeks ago
    const startDay = new Date(today)
    const dayOfWeek = (today.getDay() + 6) % 7 // Mon=0
    startDay.setDate(today.getDate() - dayOfWeek - 15 * 7)

    const weeks = []
    let d = new Date(startDay)
    for (let w = 0; w < 16; w++) {
      const week = []
      for (let i = 0; i < 7; i++) {
        const key = isoDate(d)
        const count = sessionDates[key] || 0
        const isToday = isoDate(d) === isoDate(today)
        const isFuture = d > today
        week.push({ key, count, isToday, isFuture, month: d.getMonth(), date: d.getDate() })
        d = new Date(d)
        d.setDate(d.getDate() + 1)
      }
      weeks.push(week)
    }
    return weeks
  }, [sessionDates])

  // Show month labels at week boundaries where month changes
  const monthLabels = useMemo(() => {
    const labels = []
    let lastMonth = -1
    cells.forEach((week, wi) => {
      const firstDay = week[0]
      if (firstDay.month !== lastMonth) {
        labels.push({ wi, label: MONTH_LABELS[firstDay.month] })
        lastMonth = firstDay.month
      } else {
        labels.push(null)
      }
    })
    return labels
  }, [cells])

  function cellColor(count, isFuture, isToday) {
    if (isFuture) return 'bg-gray-50'
    if (count === 0) return 'bg-gray-100'
    if (count === 1) return 'bg-indigo-200'
    if (count === 2) return 'bg-indigo-400'
    return 'bg-indigo-600'
  }

  const totalThisYear = useMemo(() => {
    const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString()
    return sessions.filter(s => s.date >= yearStart).length
  }, [sessions])

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-900">Training Heatmap</p>
        <span className="text-xs text-gray-500">{totalThisYear} sessions this year</span>
      </div>

      <div className="overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        <div className="flex gap-1" style={{ minWidth: 'max-content' }}>
          {/* Day labels column */}
          <div className="flex flex-col gap-1 pt-4 pr-1">
            {DAY_LABELS.map((d, i) => (
              <div key={i} className="h-3 w-3 flex items-center justify-center">
                <span className={`text-[8px] font-medium text-gray-400 ${i % 2 === 0 ? '' : 'invisible'}`}>{d}</span>
              </div>
            ))}
          </div>

          {/* Week columns */}
          {cells.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {/* Month label */}
              <div className="h-3 flex items-center">
                {monthLabels[wi] && (
                  <span className="text-[8px] font-semibold text-gray-400 leading-none">{monthLabels[wi].label}</span>
                )}
              </div>
              {/* Day cells */}
              {week.map(day => (
                <div
                  key={day.key}
                  title={day.count > 0 ? `${day.count} session${day.count > 1 ? 's' : ''} on ${day.key}` : day.key}
                  className={`h-3 w-3 rounded-sm transition-colors ${cellColor(day.count, day.isFuture, day.isToday)} ${day.isToday ? 'ring-1 ring-indigo-500 ring-offset-0' : ''}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3 justify-end">
        <span className="text-[9px] text-gray-400">Less</span>
        {['bg-gray-100','bg-indigo-200','bg-indigo-400','bg-indigo-600'].map((c, i) => (
          <div key={i} className={`h-3 w-3 rounded-sm ${c}`} />
        ))}
        <span className="text-[9px] text-gray-400">More</span>
      </div>
    </div>
  )
}
