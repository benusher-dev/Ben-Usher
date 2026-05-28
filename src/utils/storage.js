const KEYS = {
  templates: 'gwt_templates',
  sessions: 'gwt_sessions',
  settings: 'gwt_settings',
}

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      throw new Error('Storage full. Please delete some old sessions.')
    }
    throw e
  }
}

export function getTemplates() {
  return read(KEYS.templates, [])
}

export function setTemplates(templates) {
  write(KEYS.templates, templates)
}

export function getSessions() {
  return read(KEYS.sessions, [])
}

export function setSessions(sessions) {
  write(KEYS.sessions, sessions)
}

export function getSettings() {
  return read(KEYS.settings, { weightUnit: 'kg' })
}

export function setSettings(settings) {
  write(KEYS.settings, settings)
}
