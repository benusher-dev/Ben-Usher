import { formatDuration } from '../../utils/dateHelpers'
import { MuscleDiagram } from './MuscleDiagram'
import { Button } from '../ui/Button'

function calcStats(exercises) {
  const maxWeight = (sets) => sets.length ? Math.max(0, ...sets.map(s => s.weight || 0)) : 0
  const totalReps = (sets) => sets.reduce((sum, s) => sum + (s.reps || 0), 0)
  return exercises.map(ex => ({
    name: ex.name,
    exerciseId: ex.exerciseId,
    maxWeight: maxWeight(ex.sets),
    totalReps: totalReps(ex.sets),
  }))
}

function Delta({ value, unit }) {
  if (value === 0) return <span className="text-xs text-gray-400">= {unit}</span>
  if (value > 0) return <span className="text-xs font-semibold text-emerald-600">↑ +{value} {unit}</span>
  return <span className="text-xs font-medium text-red-500">↓ {value} {unit}</span>
}

export function WorkoutSummary({ session, previousSession, onDone }) {
  const currStats = calcStats(session.exercises)

  const prevLookup = {}
  if (previousSession) {
    for (const ex of previousSession.exercises) {
      prevLookup[ex.exerciseId] = ex
      prevLookup[ex.name] = ex
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="text-center py-2">
        <div className="text-5xl mb-3">🎉</div>
        <h2 className="text-2xl font-bold text-gray-900">Workout Complete!</h2>
        {session.durationMinutes != null && (
          <p className="text-sm text-gray-500 mt-1">
            Duration:{' '}
            <span className="font-semibold text-indigo-600">{formatDuration(session.durationMinutes)}</span>
          </p>
        )}
      </div>

      {/* Performance vs last session */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Performance</h3>
        <div className="flex flex-col gap-2">
          {currStats.map((curr, i) => {
            const prev = prevLookup[curr.exerciseId] || prevLookup[curr.name]
            const isNew = !prev

            if (isNew) {
              return (
                <div key={i} className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{curr.name}</span>
                  <span className="text-xs bg-indigo-50 text-indigo-600 font-semibold px-2 py-0.5 rounded-full">
                    First time!
                  </span>
                </div>
              )
            }

            const prevStats = calcStats([prev])[0]
            const weightDelta = curr.maxWeight - prevStats.maxWeight
            const repsDelta = curr.totalReps - prevStats.totalReps

            return (
              <div key={i} className="bg-gray-50 rounded-xl p-3">
                <p className="text-sm font-medium text-gray-900 mb-1.5">{curr.name}</p>
                <div className="flex gap-4">
                  {curr.maxWeight > 0 && (
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Max weight</p>
                      <Delta value={weightDelta} unit="kg" />
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Total reps</p>
                    <Delta value={repsDelta} unit="reps" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Muscles trained */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Muscles Trained</h3>
        <div className="bg-gray-50 rounded-2xl p-4">
          <MuscleDiagram exercises={session.exercises} />
        </div>
      </div>

      <Button size="lg" className="w-full" onClick={onDone}>
        Done
      </Button>
    </div>
  )
}
