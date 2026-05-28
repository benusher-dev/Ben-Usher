import { useMemo } from 'react'
import { formatDuration } from '../../utils/dateHelpers'
import { MuscleDiagram } from './MuscleDiagram'
import { Button } from '../ui/Button'

function calcStats(exercises) {
  const maxWeight = sets => sets.length ? Math.max(0, ...sets.map(s => s.weight || 0)) : 0
  const totalReps = sets => sets.reduce((sum, s) => sum + (s.reps || 0), 0)
  return exercises.map(ex => ({ name: ex.name, exerciseId: ex.exerciseId, maxWeight: maxWeight(ex.sets), totalReps: totalReps(ex.sets) }))
}

function Delta({ value, unit }) {
  if (value === 0) return <span className="text-xs text-gray-400">= {unit}</span>
  if (value > 0) return <span className="text-xs font-semibold text-emerald-600">↑ +{value} {unit}</span>
  return <span className="text-xs font-medium text-red-500">↓ {value} {unit}</span>
}

function buildHistoricalMaxes(historicalSessions) {
  const map = {}
  historicalSessions.forEach(s => {
    s.exercises.forEach(ex => {
      if (!map[ex.name]) map[ex.name] = { maxWeight: 0, maxReps: 0 }
      ex.sets.forEach(set => {
        if ((set.weight || 0) > map[ex.name].maxWeight) map[ex.name].maxWeight = set.weight || 0
        if ((set.reps || 0) > map[ex.name].maxReps) map[ex.name].maxReps = set.reps || 0
      })
    })
  })
  return map
}

export function WorkoutSummary({ session, previousSession, historicalSessions, onDone }) {
  const currStats = calcStats(session.exercises)

  const prevLookup = {}
  if (previousSession) {
    for (const ex of previousSession.exercises) {
      prevLookup[ex.exerciseId] = ex
      prevLookup[ex.name] = ex
    }
  }

  const historicalMaxes = useMemo(() => buildHistoricalMaxes(historicalSessions ?? []), [historicalSessions])

  const newPRs = useMemo(() => {
    const prs = new Set()
    currStats.forEach(curr => {
      const hist = historicalMaxes[curr.name]
      if (!hist) return
      if (curr.maxWeight > 0 && curr.maxWeight > hist.maxWeight) prs.add(`${curr.name}_weight`)
      if (curr.totalReps > 0 && curr.totalReps > hist.maxReps) prs.add(`${curr.name}_reps`)
    })
    return prs
  }, [currStats, historicalMaxes])

  const hasPRs = newPRs.size > 0

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="text-center py-2">
        <div className="text-5xl mb-3">{hasPRs ? '🏆' : '🎉'}</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Workout Complete!</h2>
        {session.durationMinutes != null && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Duration: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{formatDuration(session.durationMinutes)}</span>
          </p>
        )}
        {hasPRs && (
          <div className="mt-2 inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full text-xs font-semibold">
            <span>🏆</span> New personal record{newPRs.size > 1 ? 's' : ''}!
          </div>
        )}
      </div>

      {/* Performance */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Performance</h3>
        <div className="flex flex-col gap-2">
          {currStats.map((curr, i) => {
            const prev = prevLookup[curr.exerciseId] || prevLookup[curr.name]
            const isNew = !prev
            const prWeight = newPRs.has(`${curr.name}_weight`)
            const prReps = newPRs.has(`${curr.name}_reps`)

            if (isNew) {
              return (
                <div key={i} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{curr.name}</span>
                  <span className="text-xs bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-semibold px-2 py-0.5 rounded-full">First time!</span>
                </div>
              )
            }

            const prevStats = calcStats([prev])[0]
            const weightDelta = curr.maxWeight - prevStats.maxWeight
            const repsDelta = curr.totalReps - prevStats.totalReps

            return (
              <div key={i} className={`rounded-xl p-3 ${prWeight || prReps ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800' : 'bg-gray-50 dark:bg-gray-700/50'}`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{curr.name}</p>
                  {(prWeight || prReps) && <span className="text-xs">🏆</span>}
                </div>
                <div className="flex gap-4">
                  {curr.maxWeight > 0 && (
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Max weight</p>
                      <div className="flex items-center gap-1">
                        <Delta value={weightDelta} unit="kg" />
                        {prWeight && <span className="text-[10px] font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/40 px-1 rounded">PR</span>}
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Total reps</p>
                    <div className="flex items-center gap-1">
                      <Delta value={repsDelta} unit="reps" />
                      {prReps && <span className="text-[10px] font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/40 px-1 rounded">PR</span>}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Muscles */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Muscles Trained</h3>
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-4">
          <MuscleDiagram exercises={session.exercises} />
        </div>
      </div>

      <Button size="lg" className="w-full" onClick={onDone}>Done</Button>
    </div>
  )
}
