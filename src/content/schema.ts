// Shapes of the files under content/, plus validators shared by the app and
// scripts/validate-content.ts. Keep this file free of Vite- and Node-specific
// imports so both sides can load it.

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const
export type Difficulty = (typeof DIFFICULTIES)[number]

export const MAX_HINTS = 3
export const MIN_TESTS = 3
export const MAX_TESTS = 6
export const MIN_EXERCISES = 3

/** Installed in every exercise sandbox. */
export const EXERCISE_BASE_PACKAGES = [
  'react',
  'react-dom',
  '@testing-library/react',
  '@testing-library/dom',
  '@testing-library/user-event',
  '@testing-library/jest-dom',
] as const

/**
 * Extra packages an exercise may list in meta.json "dependencies". Each is a
 * pinned devDependency in package.json, so validation runs the same version
 * the browser sandbox downloads. Adding one is a platform change, not a
 * content change.
 */
export const EXERCISE_OPTIONAL_PACKAGES = [
  'react-router',
  '@tanstack/react-query',
  'react-hook-form',
  'zod',
  '@hookform/resolvers',
  'zustand',
  '@reduxjs/toolkit',
  'react-redux',
] as const

/** content/<NN-module>/module.json */
export type ModuleMeta = {
  title: string
  summary: string
  order: number
  /** Slugs of modules to finish first, e.g. ["foundations"]. */
  prerequisites: string[]
}

export type DocsLink = { title: string; url: string }

/** content/<NN-module>/<NN-lesson>.mdx frontmatter */
export type LessonFrontmatter = {
  title: string
  /** Estimated reading time; lessons aim for 5–10 minutes. */
  minutes: number
  /** The react.dev or library docs pages the lesson is grounded in. */
  docs: DocsLink[]
}

/** content/<NN-module>/exercises/<NN-exercise>/meta.json */
export type ExerciseMeta = {
  title: string
  difficulty: Difficulty
  /** One to three hints, from a gentle nudge to nearly the answer. */
  hints: string[]
  /** What the learner should build, shown above the editor. */
  task: string
  /** Optional packages from EXERCISE_OPTIONAL_PACKAGES. */
  dependencies?: string[]
}

/** "03-hooks" -> { order: 3, slug: "hooks" } */
export function parseOrderedName(name: string): { order: number; slug: string } | null {
  const match = /^(\d{2})-([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(name)
  if (!match) return null
  return { order: Number(match[1]), slug: match[2] }
}

type Result<T> = { value: T; errors: [] } | { value: null; errors: string[] }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function unknownKeys(value: Record<string, unknown>, allowed: string[]): string[] {
  return Object.keys(value)
    .filter((key) => !allowed.includes(key))
    .map((key) => `unknown field "${key}"`)
}

function done<T>(value: T, errors: string[]): Result<T> {
  return errors.length === 0 ? { value, errors: [] } : { value: null, errors }
}

export function parseModuleMeta(input: unknown): Result<ModuleMeta> {
  if (!isRecord(input)) return { value: null, errors: ['must be a JSON object'] }
  const errors = unknownKeys(input, ['title', 'summary', 'order', 'prerequisites'])
  if (!nonEmptyString(input.title)) errors.push('"title" must be a non-empty string')
  if (!nonEmptyString(input.summary)) errors.push('"summary" must be a non-empty string')
  if (!Number.isInteger(input.order)) errors.push('"order" must be an integer')
  if (!Array.isArray(input.prerequisites) || !input.prerequisites.every(nonEmptyString)) {
    errors.push('"prerequisites" must be an array of module slugs')
  }
  return done(input as ModuleMeta, errors)
}

export function parseLessonFrontmatter(input: unknown): Result<LessonFrontmatter> {
  if (!isRecord(input)) return { value: null, errors: ['frontmatter is missing'] }
  const errors = unknownKeys(input, ['title', 'minutes', 'docs'])
  if (!nonEmptyString(input.title)) errors.push('"title" must be a non-empty string')
  if (!(typeof input.minutes === 'number' && input.minutes > 0)) {
    errors.push('"minutes" must be a positive number')
  }
  const docsOk =
    Array.isArray(input.docs) &&
    input.docs.length > 0 &&
    input.docs.every(
      (link) => isRecord(link) && nonEmptyString(link.title) && typeof link.url === 'string' && link.url.startsWith('https://'),
    )
  if (!docsOk) errors.push('"docs" must list at least one { title, url } with an https URL')
  return done(input as LessonFrontmatter, errors)
}

export function parseExerciseMeta(input: unknown): Result<ExerciseMeta> {
  if (!isRecord(input)) return { value: null, errors: ['must be a JSON object'] }
  const errors = unknownKeys(input, ['title', 'difficulty', 'hints', 'task', 'dependencies'])
  if (!nonEmptyString(input.title)) errors.push('"title" must be a non-empty string')
  if (!DIFFICULTIES.includes(input.difficulty as Difficulty)) {
    errors.push(`"difficulty" must be one of ${DIFFICULTIES.join(', ')}`)
  }
  if (
    !Array.isArray(input.hints) ||
    input.hints.length < 1 ||
    input.hints.length > MAX_HINTS ||
    !input.hints.every(nonEmptyString)
  ) {
    errors.push(`"hints" must be an array of 1–${MAX_HINTS} non-empty strings`)
  }
  if (!nonEmptyString(input.task)) errors.push('"task" must be a non-empty string')
  if (input.dependencies !== undefined) {
    const allowed: readonly string[] = EXERCISE_OPTIONAL_PACKAGES
    if (!Array.isArray(input.dependencies) || !input.dependencies.every((name) => allowed.includes(name))) {
      errors.push(`"dependencies" may only list: ${EXERCISE_OPTIONAL_PACKAGES.join(', ')}`)
    }
  }
  return done(input as ExerciseMeta, errors)
}
