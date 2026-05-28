import { Card } from '../ui/Card'
import { formatRelative, formatDuration } from '../../utils/dateHelpers'

function totalVolume(session) {
  let vol = 0
  for (const ex of session.exercises) {
    for (const set of ex.sets) {
      if (set.weight) vol += (set.reps || 0) * set.weight
    }
  }
  return vol
}

export function SessionCard({ session, onClick }) {
  const vol = totalVolume(session)
  return (
    <Card className="p-4" onClick={onClick}>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-gray-900">{session.templateName}</p>
          <p className="text-sm text-gray-500 mt-0.5">{formatRelative(session.date)}</p>
        </div>
        <div className="text-right flex-shrink-0 ml-4">
          {session.durationMinutes != null && (
            <p className="text-sm font-medium text-indigo-600">{formatDuration(session.durationMinutes)}</p>
          )}
          {vol > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">{vol.toLocaleString()} kg vol</p>
          )}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {session.exercises.slice(0, 4).map((ex, i) => (
          <span key={i} className="text-xs bg-gray-100 text-gray-600 rounded-lg px-2 py-0.5">
            {ex.name}
          </span>
        ))}
        {session.exercises.length > 4 && (
          <span className="text-xs bg-gray-100 text-gray-400 rounded-lg px-2 py-0.5">
            +{session.exercises.length - 4}
          </span>
        )}
      </div>
    </Card>
  )
}
