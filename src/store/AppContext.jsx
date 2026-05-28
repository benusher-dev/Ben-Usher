import { createContext, useContext, useState } from 'react'
import { useTemplates } from '../hooks/useTemplates'
import { useSessions } from '../hooks/useSessions'
import { useDarkMode } from '../hooks/useDarkMode'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const { templates, addTemplate, updateTemplate, deleteTemplate } = useTemplates()
  const { sessions, addSession, deleteSession } = useSessions()
  const { isDark, toggleDark } = useDarkMode()
  const [activePage, setActivePage] = useState('dashboard')
  const [logTemplateId, setLogTemplateId] = useState(null)
  const [progressExercise, setProgressExercise] = useState('')

  return (
    <AppContext.Provider
      value={{
        templates, addTemplate, updateTemplate, deleteTemplate,
        sessions, addSession, deleteSession,
        isDark, toggleDark,
        activePage, setActivePage,
        logTemplateId, setLogTemplateId,
        progressExercise, setProgressExercise,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
