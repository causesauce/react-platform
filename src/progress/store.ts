import {
  initialState,
  recordTestRun,
  recordVisit,
  revealHint,
  setLessonComplete,
  startReview,
  viewSolution,
  type ProgressState,
} from './logic'
import type { ProgressStorage } from './storage'

export type ProgressStore = ReturnType<typeof createProgressStore>

/**
 * A tiny external store: React reads it with useSyncExternalStore
 * (https://react.dev/reference/react/useSyncExternalStore), so every update
 * replaces the state object instead of mutating it.
 */
export function createProgressStore(storage: ProgressStorage, now: () => Date = () => new Date()) {
  let state: ProgressState = storage.load() ?? initialState()
  const listeners = new Set<() => void>()

  const emit = () => listeners.forEach((listener) => listener())

  function update(change: (state: ProgressState, now: string) => ProgressState) {
    const next = change(state, now().toISOString())
    if (next === state) return
    state = next
    storage.save(state)
    emit()
  }

  storage.subscribe(() => {
    state = storage.load() ?? initialState()
    emit()
  })

  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    now: () => now().toISOString(),
    setLessonComplete: (lessonId: string, complete: boolean) =>
      update((s, t) => setLessonComplete(s, lessonId, complete, t)),
    recordVisit: (path: string, title: string) => update((s, t) => recordVisit(s, path, title, t)),
    recordTestRun: (exerciseId: string, passed: boolean) =>
      update((s, t) => recordTestRun(s, exerciseId, passed, t)),
    revealHint: (exerciseId: string, totalHints: number) =>
      update((s) => revealHint(s, exerciseId, totalHints)),
    viewSolution: (exerciseId: string) => update((s) => viewSolution(s, exerciseId)),
    startReview: (exerciseId: string) => update((s, t) => startReview(s, exerciseId, t)),
    reset: () => update(() => initialState()),
  }
}
