import type { ReactNode } from 'react'
import { getDefaultStore, ProgressContext } from './hooks'
import type { ProgressStore } from './store'

/** Tests pass their own store; the app uses the localStorage-backed default. */
export function ProgressProvider({ store, children }: { store?: ProgressStore; children: ReactNode }) {
  return <ProgressContext value={store ?? getDefaultStore()}>{children}</ProgressContext>
}
