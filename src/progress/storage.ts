import { isProgressState, type ProgressState } from './logic'

/**
 * Where progress lives. The app ships with localStorage; a backend can
 * implement the same three methods later without touching the UI.
 */
export interface ProgressStorage {
  load(): ProgressState | null
  save(state: ProgressState): void
  /** Calls `onChange` when another tab or device changes the stored data. */
  subscribe(onChange: () => void): () => void
}

export const STORAGE_KEY = 'react-learning-platform:progress'

export function createLocalStorage(storage: Storage = window.localStorage): ProgressStorage {
  return {
    load() {
      try {
        const raw = storage.getItem(STORAGE_KEY)
        if (!raw) return null
        const parsed: unknown = JSON.parse(raw)
        return isProgressState(parsed) ? parsed : null
      } catch {
        return null
      }
    },
    save(state) {
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(state))
      } catch {
        // Quota exceeded or storage disabled: keep working in memory.
      }
    },
    subscribe(onChange) {
      const listener = (event: StorageEvent) => {
        if (event.key === STORAGE_KEY) onChange()
      }
      window.addEventListener('storage', listener)
      return () => window.removeEventListener('storage', listener)
    },
  }
}

export function createMemoryStorage(initial: ProgressState | null = null): ProgressStorage {
  let saved = initial
  return {
    load: () => saved,
    save(state) {
      saved = state
    },
    subscribe: () => () => {},
  }
}
