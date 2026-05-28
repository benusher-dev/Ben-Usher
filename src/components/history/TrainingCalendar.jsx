import { useMemo } from 'react'

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAY_LABELS = ['M','T','W','T','F','S','S']

function isoDate(d) { return d.toISOString().slice(0, 10) }

export function TrainingCalendar({ sessions }) {
  const sessionDates = useMemo(() => {
    const map = {}
    sessions.forEach(s => { const key = isoDate(new Date(s.date)); map[key] = (map[key] || 0) + 1 })
    return map
  }, [sessions])

  const cells = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const startDay = new Date(today)
    startDay.setDate(today.getDate() - ((today.getDay() + 6) % 7) - 15 * 7)
    const weeks = []; let d = new Date(startDay)
    for (let w = 0; w < 16; w++) {
      const week = []
      for (let i = 0; i < 7; i++) {
        const key = isoDate(d)
        week.push({ key, count: sessionDates[key] || 0, isToday: isoDate(d) === isoDate(today), isFuture: d > today, month: d.getMonth() })
        d = new Date(d); d.setDate(d.getDate() + 1)
      }
      weeks.push(week)
    }
    return weeks
  }, [sessionDates])

  const monthLabels = useMemo(() => {
    let lastMonth = -1
    return cells.map(week => {
      const m = week[0].month
      if (m !== lastMonth) { lastMonth = m; return MONTH_LABELS[m] }
      return null
    })
  }, [cells])

  function cellColor(count, isFuture) {
    if (isFuture) return 'bg-gray-50 dark:bg-gray-800'
    if (count === 0) return 'bg-gray-100 dark:bg-gray-700'
    if (count === 1) return 'bg-indigo-200 dark:bg-indigo-800'
    if (count === 2) return 'bg-indigo-400 dark:bg-indigo-600'
    return 'bg-indigo-600 dark:bg-indigo-400'
  }

  const totalThisYear = useMemo(() => {
    const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString()
    return sessions.filter(s => s.date >= yearStart).length
  }, [sessions])

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">Training Heatmap</p>
        <span className="text-xs text-gray-500 dark:text-gray-400">{totalThisYear} sessions this year</span>
      </div>
      <div className="overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        <div className="flex gap-1" style={{ minWidth: 'max-content' }}>
          <div className="flex flex-col gap-1 pt-4 pr-1">
            {DAY_LABELS.map((d, i) => (
              <div key={i} className="h-3 w-3 flex items-center justify-center">
                <span className={`text-[8px] font-medium text-gray-400 ${i % 2 === 0 ? '' : 'invisible'}`}>{d}</span>
              </div>
            ))}
          </div>
          {cells.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              <div className="h-3 flex items-center">
                {monthLabels[wi] && <span className="text-[8px] font-semibold text-gray-400 leading-none">{monthLabels[wi]}</span>}
              </div>
              {week.map(day => (
                <div
                  key={day.key}
                  title={day.count > 0 ? `${day.count} session${day.count > 1 ? 's' : ''} on ${day.key}` : day.key}
                  className={`h-3 w-3 rounded-sm transition-colors ${cellColor(day.count, day.isFuture)} ${day.isToday ? 'ring-1 ring-indigo-500' : ''}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1.5 mt-3 justify-end">
        <span className="text-[9px] text-gray-400">Less</span>
        {['bg-gray-100 dark:bg-gray-700','bg-indigo-200 dark:bg-indigo-800','bg-indigo-400 dark:bg-indigo-600','bg-indigo-600 dark:bg-indigo-400'].map((c, i) => (
          <div key={i} className={`h-3 w-3 rounded-sm ${c}`} />
        ))}
        <span className="text-[9px] text-gray-400">More</span>
      </div>
    </div>
  )
}
