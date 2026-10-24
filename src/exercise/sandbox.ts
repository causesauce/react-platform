import type { SandpackFiles } from '@codesandbox/sandpack-react'
import { dependencies, devDependencies } from '../../package.json'
import type { ExerciseFiles } from '../content/course'
import { EXERCISE_BASE_PACKAGES, type ExerciseMeta } from '../content/schema'
import type { DraftFiles } from '../progress/drafts'

const pinned: Record<string, string> = { ...dependencies, ...devDependencies }

/** The versions package.json pins, so the browser and local validation match. */
export function pinnedDependencies(names: readonly string[]): Record<string, string> {
  return Object.fromEntries(names.map((name) => [name, pinned[name]]))
}

/** What an exercise sandbox installs: the testing stack plus its opt-ins. */
export function sandboxDependencies(meta: Pick<ExerciseMeta, 'dependencies'>): Record<string, string> {
  return pinnedDependencies([...EXERCISE_BASE_PACKAGES, ...(meta.dependencies ?? [])])
}

/** Learner-editable files first (App.tsx leading), then the hidden tests. */
export function sandboxFiles(files: Pick<ExerciseFiles, 'starter' | 'tests'>, draft: DraftFiles | null): SandpackFiles {
  const result: SandpackFiles = {}
  for (const path of editablePaths(files)) {
    result[path] = { code: draft?.[path] ?? files.starter[path] }
  }
  for (const [path, code] of Object.entries(files.tests)) {
    result[path] = { code, hidden: true, readOnly: true }
  }
  return result
}

export function editablePaths(files: Pick<ExerciseFiles, 'starter'>): string[] {
  return Object.keys(files.starter).sort((a, b) => {
    if (a === '/App.tsx') return -1
    if (b === '/App.tsx') return 1
    return a.localeCompare(b)
  })
}
