import { useLocalStorage } from './useLocalStorage'
import { generateId } from '../utils/dateHelpers'

export function useSessions() {
  const [sessions, setSessions] = useLocalStorage('gwt_sessions', [])

  function addSession(session, startedAt) {
    const endedAt = new Date()
    const durationMinutes = startedAt
      ? Math.round((endedAt - new Date(startedAt)) / 60000)
      : null
    const newSession = {
      ...session,
      id: generateId(),
      date: endedAt.toISOString(),
      durationMinutes,
    }
    setSessions(prev => [newSession, ...prev])
    return newSession
  }

  function deleteSession(id) {
    setSessions(prev => prev.filter(s => s.id !== id))
  }

  return { sessions, addSession, deleteSession }
}
