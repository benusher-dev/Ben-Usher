import { useState } from 'react'
import { useApp } from '../store/AppContext'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'
import { TemplateCard } from '../components/templates/TemplateCard'
import { TemplateForm } from '../components/templates/TemplateForm'

export function Workouts() {
  const { templates, addTemplate, updateTemplate, deleteTemplate, setActivePage, setLogTemplateId } = useApp()
  const [showCreate, setShowCreate] = useState(false)
  const [editTemplate, setEditTemplate] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  function handleCreate(name, exercises) {
    addTemplate(name, exercises)
    setShowCreate(false)
  }

  function handleUpdate(name, exercises) {
    updateTemplate(editTemplate.id, name, exercises)
    setEditTemplate(null)
  }

  function handleDelete(template) {
    deleteTemplate(template.id)
    setConfirmDelete(null)
  }

  function handleSelect(template) {
    setLogTemplateId(template.id)
    setActivePage('log')
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Workouts"
        action={
          <Button size="sm" onClick={() => setShowCreate(true)}>+ New</Button>
        }
      />
      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-lg mx-auto w-full">
        {templates.length === 0 ? (
          <EmptyState
            icon="🏋️"
            title="No workouts yet"
            description="Create your first workout template to get started"
            action="Create Workout"
            onAction={() => setShowCreate(true)}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {templates.map(t => (
              <TemplateCard
                key={t.id}
                template={t}
                onEdit={() => setEditTemplate(t)}
                onDelete={() => setConfirmDelete(t)}
                onSelect={() => handleSelect(t)}
              />
            ))}
          </div>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Workout">
        <TemplateForm onSave={handleCreate} onCancel={() => setShowCreate(false)} />
      </Modal>

      <Modal open={!!editTemplate} onClose={() => setEditTemplate(null)} title="Edit Workout">
        {editTemplate && (
          <TemplateForm
            initial={editTemplate}
            onSave={handleUpdate}
            onCancel={() => setEditTemplate(null)}
          />
        )}
      </Modal>

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete Workout">
        {confirmDelete && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete <strong>{confirmDelete.name}</strong>? Past sessions will not be affected.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setConfirmDelete(null)}>
                Cancel
              </Button>
              <Button variant="danger" className="flex-1" onClick={() => handleDelete(confirmDelete)}>
                Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
