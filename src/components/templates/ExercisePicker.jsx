import { useState, useMemo, useEffect } from 'react'
import { CATEGORIES, CATEGORY_COLOR } from '../../data/exerciseLibrary'
import { useExerciseLibrary } from '../../hooks/useExerciseLibrary'

export function ExercisePicker({ open, onAdd, onClose }) {
  const { allExercises, customExercises, addCustomExercise, deleteCustomExercise } = useExerciseLibrary()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [confirmDelete, setConfirmDelete] = useState(null)

  useEffect(() => {
    if (open) { setSearch(''); setActiveCategory('all') }
  }, [open])

  const filtered = useMemo(() => {
    let list = allExercises
    if (activeCategory !== 'all') list = list.filter(ex => ex.category === activeCategory)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(ex => ex.name.toLowerCase().includes(q))
    }
    return list
  }, [allExercises, activeCategory, search])

  const hasExactMatch = filtered.some(ex => ex.name.toLowerCase() === search.trim().toLowerCase())

  function handleAdd(ex) {
    onAdd({ name: ex.name, sets: 3, reps: 10, weight: null })
    onClose()
  }

  function handleAddCustom() {
    const name = search.trim()
    if (!name) return
    const category = activeCategory !== 'all' ? activeCategory : 'other'
    addCustomExercise(name, category)
    onAdd({ name, sets: 3, reps: 10, weight: null })
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900 flex flex-col" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
        <button
          onClick={onClose}
          className="p-2 -ml-1 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Exercise Library</h2>
      </div>

      {/* Search */}
      <div className="px-4 pt-3 pb-2 flex-shrink-0">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search exercises…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            autoFocus
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          )}
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 px-4 pb-2 overflow-x-auto flex-shrink-0" style={{ scrollbarWidth: 'none' }}>
        <button
          onClick={() => setActiveCategory('all')}
          className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
            activeCategory === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          All
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              activeCategory === cat.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="h-px bg-gray-100 dark:bg-gray-700 flex-shrink-0" />

      {/* Exercise list */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-2 max-w-lg mx-auto">
          {filtered.length === 0 && !search.trim() && (
            <p className="text-sm text-gray-400 text-center py-12">No exercises in this category</p>
          )}

          {filtered.map((ex, i) => {
            const badgeColor = CATEGORY_COLOR[ex.category] ?? 'bg-gray-100 text-gray-600'
            const isCustom = !!ex.isCustom
            return (
              <div key={i} className="flex items-center gap-2 py-1">
                <button
                  onClick={() => handleAdd(ex)}
                  className="flex-1 flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 active:bg-indigo-100 transition-colors text-left"
                >
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{ex.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ml-2 ${badgeColor}`}>
                    {CATEGORIES.find(c => c.id === ex.category)?.label ?? ex.category}
                  </span>
                </button>
                {isCustom && (
                  <button
                    onClick={() => setConfirmDelete(ex)}
                    className="p-2 text-gray-300 dark:text-gray-600 hover:text-red-400 flex-shrink-0 rounded-lg transition-colors"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14H6L5 6M9 6V4h6v2M10 11v6M14 11v6" />
                    </svg>
                  </button>
                )}
              </div>
            )
          })}

          {search.trim() && !hasExactMatch && (
            <div className="mt-2">
              <div className="text-xs text-gray-400 font-medium px-3 mb-1">Not in library</div>
              <button
                onClick={handleAddCustom}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 border-dashed border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
              >
                <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span className="text-sm font-semibold">Add "{search.trim()}" to library &amp; workout</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="absolute inset-0 bg-black/40 z-10 flex items-end sm:items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl p-5 w-full sm:max-w-sm sm:mx-4">
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
              Remove <strong className="dark:text-white">{confirmDelete.name}</strong> from your custom library?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => { deleteCustomExercise(confirmDelete.id); setConfirmDelete(null) }}
                className="flex-1 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
