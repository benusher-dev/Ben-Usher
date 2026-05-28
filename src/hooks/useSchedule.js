import { useLocalStorage } from './useLocalStorage'

export const SCHEDULE_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
export const DAY_LABELS = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' }
export const DAY_FULL = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' }

export function todayKey() {
  return SCHEDULE_DAYS[(new Date().getDay() + 6) % 7] // JS getDay: 0=Sun, shift so 0=Mon
}

export function useSchedule() {
  const [schedule, setSchedule] = useLocalStorage('gwt_schedule', {})

  function setDayTemplate(day, templateId) {
    setSchedule(prev => ({ ...prev, [day]: templateId ?? null }))
  }

  return { schedule, setDayTemplate }
}
