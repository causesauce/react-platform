// The learner's in-progress code, kept apart from ProgressState so typing in
// the editor doesn't re-render every progress subscriber.

const PREFIX = 'react-learning-platform:draft:'

export type DraftFiles = Record<string, string>

export function loadDraft(exerciseId: string, storage: Storage = window.localStorage): DraftFiles | null {
  try {
    const raw = storage.getItem(PREFIX + exerciseId)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return null
    const entries = Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === 'string')
    return Object.fromEntries(entries)
  } catch {
    return null
  }
}

export function saveDraft(exerciseId: string, files: DraftFiles, storage: Storage = window.localStorage) {
  try {
    storage.setItem(PREFIX + exerciseId, JSON.stringify(files))
  } catch {
    // Storage full or disabled; the draft only lives in memory.
  }
}

export function clearDraft(exerciseId: string, storage: Storage = window.localStorage) {
  try {
    storage.removeItem(PREFIX + exerciseId)
  } catch {
    // Nothing to clear.
  }
}
