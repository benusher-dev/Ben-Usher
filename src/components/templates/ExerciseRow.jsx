export function ExerciseRow({ exercise, index, onChange, onDelete }) {
  function update(field, value) {
    onChange(index, { ...exercise, [field]: value })
  }

  return (
    <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Exercise name"
          value={exercise.name}
          onChange={e => update('name', e.target.value)}
          className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        />
        <button
          type="button"
          onClick={() => onDelete(index)}
          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14H6L5 6" />
            <path d="M10 11v6M14 11v6" />
          </svg>
        </button>
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-xs text-gray-500 font-medium">Sets</label>
          <input
            type="number"
            min="1"
            max="99"
            placeholder="3"
            value={exercise.sets || ''}
            onChange={e => update('sets', e.target.value === '' ? '' : Math.max(1, Number(e.target.value)))}
            className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-center"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-gray-500 font-medium">Reps</label>
          <input
            type="number"
            min="1"
            max="999"
            placeholder="10"
            value={exercise.reps || ''}
            onChange={e => update('reps', Number(e.target.value))}
            className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-center"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-gray-500 font-medium">Weight (kg)</label>
          <input
            type="number"
            min="0"
            step="0.5"
            placeholder="—"
            value={exercise.weight ?? ''}
            onChange={e => update('weight', e.target.value === '' ? null : Number(e.target.value))}
            className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-center"
          />
        </div>
      </div>
    </div>
  )
}
