import { createContext, use, useState, useSyncExternalStore } from 'react'
import { createLocalStorage } from './storage'
import { createProgressStore, type ProgressStore } from './store'

let defaultStore: ProgressStore | null = null

export function getDefaultStore(): ProgressStore {
  defaultStore ??= createProgressStore(createLocalStorage())
  return defaultStore
}

export const ProgressContext = createContext<ProgressStore | null>(null)

export function useProgressStore(): ProgressStore {
  return use(ProgressContext) ?? getDefaultStore()
}

export function useProgress() {
  const store = useProgressStore()
  return useSyncExternalStore(store.subscribe, store.getSnapshot)
}

/**
 * The current time as an ISO string, read once when the component mounts.
 * Reading the clock during render would make the component impure:
 * https://react.dev/reference/eslint-plugin-react-hooks/lints/purity
 */
export function useNow(): string {
  const [now] = useState(() => new Date().toISOString())
  return now
}
