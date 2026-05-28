import { useState } from 'react'
import { useApp } from '../store/AppContext'
import { PageHeader } from '../components/layout/PageHeader'
import { Modal } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'
import { SessionCard } from '../components/sessions/SessionCard'
import { SessionDetail } from '../components/sessions/SessionDetail'
import { Button } from '../components/ui/Button'

export function History() {
  const { sessions, deleteSession, setActivePage } = useApp()
  const [selected, setSelected] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const sorted = [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date))

  function handleDelete(session) {
    deleteSession(session.id)
    setSelected(null)
    setConfirmDelete(null)
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="History" />
      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-lg mx-auto w-full">
        {sorted.length === 0 ? (
          <EmptyState
            icon="📅"
            title="No workouts logged"
            description="Log your first workout to see your history here"
            action="Log Workout"
            onAction={() => setActivePage('log')}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {sorted.map(s => (
              <SessionCard key={s.id} session={s} onClick={() => setSelected(s)} />
            ))}
          </div>
        )}
      </div>

      <Modal
        open={!!selected && !confirmDelete}
        onClose={() => setSelected(null)}
        title={selected?.templateName}
      >
        {selected && (
          <div className="flex flex-col gap-4">
            <SessionDetail session={selected} />
            <Button
              variant="danger"
              size="sm"
              className="self-start"
              onClick={() => setConfirmDelete(selected)}
            >
              Delete Session
            </Button>
          </div>
        )}
      </Modal>

      <Modal open={!!confirmDelete} onClose={() => { setConfirmDelete(null); setSelected(null) }} title="Delete Session">
        {confirmDelete && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-600">
              Delete this session from <strong>{confirmDelete.templateName}</strong>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => { setConfirmDelete(null); setSelected(null) }}>Cancel</Button>
              <Button variant="danger" className="flex-1" onClick={() => handleDelete(confirmDelete)}>Delete</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
