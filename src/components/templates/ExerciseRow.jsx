export function ExerciseRow({ exercise, index, onChange, onDelete }) {
  function update(field, value) {
    onChange(index, { ...exercise, [field]: value })
  }

  const isCardio = !!exercise.isCardio
  const inputCls = 'rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400'

  return (
    <div className="flex flex-col gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600">
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Exercise name"
          value={exercise.name}
          onChange={e => update('name', e.target.value)}
          className={`flex-1 ${inputCls}`}
        />
        <button
          type="button"
          onClick={() => update('isCardio', !isCardio)}
          className={`flex-shrink-0 px-2 py-1 text-xs font-semibold rounded-lg transition-colors ${
            isCardio
              ? 'bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          {isCardio ? '🏃 Cardio' : 'Strength'}
        </button>
        <button
          type="button"
          onClick={() => onDelete(index)}
          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors flex-shrink-0"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6" />
          </svg>
        </button>
      </div>

      {isCardio ? (
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">Duration (min)</label>
            <input
              type="number" min="1" placeholder="30"
              value={exercise.reps || ''}
              onChange={e => update('reps', Number(e.target.value))}
              className={`w-full text-center ${inputCls}`}
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">Distance (km)</label>
            <input
              type="number" min="0" step="0.1" placeholder="—"
              value={exercise.weight ?? ''}
              onChange={e => update('weight', e.target.value === '' ? null : Number(e.target.value))}
              className={`w-full text-center ${inputCls}`}
            />
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">Sets</label>
            <input
              type="number" min="1" max="99" placeholder="3"
              value={exercise.sets || ''}
              onChange={e => update('sets', e.target.value === '' ? '' : Math.max(1, Number(e.target.value)))}
              className={`w-full text-center ${inputCls}`}
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">Reps</label>
            <input
              type="number" min="1" max="999" placeholder="10"
              value={exercise.reps || ''}
              onChange={e => update('reps', Number(e.target.value))}
              className={`w-full text-center ${inputCls}`}
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">Weight (kg)</label>
            <input
              type="number" min="0" step="0.5" placeholder="—"
              value={exercise.weight ?? ''}
              onChange={e => update('weight', e.target.value === '' ? null : Number(e.target.value))}
              className={`w-full text-center ${inputCls}`}
            />
          </div>
        </div>
      )}
    </div>
  )
}
