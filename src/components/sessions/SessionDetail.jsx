import { formatDate, formatTime, formatDuration } from '../../utils/dateHelpers'
import { MuscleDiagram } from './MuscleDiagram'

export function SessionDetail({ session }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4 text-sm">
        <div>
          <p className="text-gray-500 dark:text-gray-400">Date</p>
          <p className="font-medium dark:text-white">{formatDate(session.date)}</p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400">Time</p>
          <p className="font-medium dark:text-white">{formatTime(session.date)}</p>
        </div>
        {session.durationMinutes && (
          <div>
            <p className="text-gray-500 dark:text-gray-400">Duration</p>
            <p className="font-medium dark:text-white">{formatDuration(session.durationMinutes)}</p>
          </div>
        )}
      </div>

      {session.notes && (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800">
          <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mb-1">Notes</p>
          <p className="text-sm text-amber-900 dark:text-amber-200">{session.notes}</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {session.exercises.map((ex, i) => (
          <div key={i} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
            <p className="font-semibold text-gray-900 dark:text-white mb-2">{ex.name}</p>
            <div className="grid grid-cols-3 gap-1 text-xs text-gray-500 dark:text-gray-400 font-medium mb-1 px-1">
              <span>Set</span><span className="text-center">Reps</span><span className="text-center">Weight</span>
            </div>
            {ex.sets.map((set, j) => (
              <div key={j} className="grid grid-cols-3 gap-1 text-sm py-1 px-1 rounded-lg even:bg-gray-100 dark:even:bg-gray-700">
                <span className="text-gray-500 dark:text-gray-400">{j + 1}</span>
                <span className="text-center font-medium dark:text-gray-200">{set.reps}</span>
                <span className="text-center text-indigo-600 dark:text-indigo-400 font-medium">
                  {set.weight ? `${set.weight} kg` : '—'}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Muscles Trained</p>
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-4">
          <MuscleDiagram exercises={session.exercises} />
        </div>
      </div>
    </div>
  )
}
