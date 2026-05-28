import { Card } from '../ui/Card'

export function TemplateCard({ template, onEdit, onDelete, onSelect, compact = false }) {
  return (
    <Card className={compact ? 'p-3' : 'p-4'}>
      <div className="flex items-start justify-between gap-2">
        <button
          className="flex-1 text-left"
          onClick={onSelect}
        >
          <p className="font-semibold text-gray-900 leading-tight">{template.name}</p>
          <p className="text-sm text-gray-500 mt-0.5">
            {template.exercises.length} exercise{template.exercises.length !== 1 ? 's' : ''}
          </p>
          {!compact && (
            <div className="mt-2 flex flex-wrap gap-1">
              {template.exercises.slice(0, 3).map(ex => (
                <span key={ex.id} className="text-xs bg-indigo-50 text-indigo-700 rounded-lg px-2 py-0.5 font-medium">
                  {ex.name}
                </span>
              ))}
              {template.exercises.length > 3 && (
                <span className="text-xs bg-gray-100 text-gray-500 rounded-lg px-2 py-0.5">
                  +{template.exercises.length - 3} more
                </span>
              )}
            </div>
          )}
        </button>
        {(onEdit || onDelete) && (
          <div className="flex gap-1 flex-shrink-0">
            {onEdit && (
              <button
                onClick={e => { e.stopPropagation(); onEdit() }}
                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            )}
            {onDelete && (
              <button
                onClick={e => { e.stopPropagation(); onDelete() }}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v6M14 11v6M9 6V4h6v2" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
