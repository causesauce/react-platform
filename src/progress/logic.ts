// Pure state transitions for learner progress. The store (store.ts) wraps
// these with persistence and subscriptions; keeping them pure makes the rules
// easy to test and to move behind a backend later.

/** Failed runs before the first pass that send an exercise to the review queue. */
export const REVIEW_THRESHOLD = 3

/**
 * Days until the next review. A clean review (fewer than REVIEW_THRESHOLD
 * failed runs, no solution peek) moves one step along; a struggling one goes
 * back to the start. Passing the last step removes the exercise from the queue.
 */
export const REVIEW_INTERVALS_DAYS = [1, 3, 7] as const

const DAY_MS = 24 * 60 * 60 * 1000

export type ExerciseProgress = {
  runs: number
  /** Failed runs in the current attempt; resets when the tests pass. */
  failedRuns: number
  passedAt: string | null
  hintsRevealed: number
  solutionViewed: boolean
  lastRunAt: string | null
  lastRunPassed: boolean | null
}

export type ReviewItem = {
  dueAt: string
  step: number
  /** Set when the learner starts a review attempt; cleared when it is graded. */
  startedAt: string | null
}

export type ProgressState = {
  version: 1
  lessons: Record<string, { completedAt: string }>
  exercises: Record<string, ExerciseProgress>
  review: Record<string, ReviewItem>
  lastVisited: { path: string; title: string; at: string } | null
}

export function initialState(): ProgressState {
  return { version: 1, lessons: {}, exercises: {}, review: {}, lastVisited: null }
}

export const emptyExercise: ExerciseProgress = {
  runs: 0,
  failedRuns: 0,
  passedAt: null,
  hintsRevealed: 0,
  solutionViewed: false,
  lastRunAt: null,
  lastRunPassed: null,
}

function addDays(iso: string, days: number): string {
  return new Date(new Date(iso).getTime() + days * DAY_MS).toISOString()
}

function withExercise(
  state: ProgressState,
  id: string,
  change: (prev: ExerciseProgress) => ExerciseProgress,
): ProgressState {
  const prev = state.exercises[id] ?? emptyExercise
  return { ...state, exercises: { ...state.exercises, [id]: change(prev) } }
}

function withoutKey<T>(record: Record<string, T>, key: string): Record<string, T> {
  const next = { ...record }
  delete next[key]
  return next
}

export function setLessonComplete(
  state: ProgressState,
  lessonId: string,
  complete: boolean,
  now: string,
): ProgressState {
  if (complete === (lessonId in state.lessons)) return state
  const lessons = complete
    ? { ...state.lessons, [lessonId]: { completedAt: now } }
    : withoutKey(state.lessons, lessonId)
  return { ...state, lessons }
}

export function recordVisit(
  state: ProgressState,
  path: string,
  title: string,
  now: string,
): ProgressState {
  if (state.lastVisited?.path === path && state.lastVisited.title === title) return state
  return { ...state, lastVisited: { path, title, at: now } }
}

export function revealHint(state: ProgressState, exerciseId: string, totalHints: number): ProgressState {
  const prev = state.exercises[exerciseId] ?? emptyExercise
  if (prev.hintsRevealed >= totalHints) return state
  return withExercise(state, exerciseId, (ex) => ({ ...ex, hintsRevealed: ex.hintsRevealed + 1 }))
}

export function viewSolution(state: ProgressState, exerciseId: string): ProgressState {
  if (state.exercises[exerciseId]?.solutionViewed) return state
  return withExercise(state, exerciseId, (ex) => ({ ...ex, solutionViewed: true }))
}

/**
 * Records one click of "Run tests". The first pass after a struggle (several
 * failed runs, or peeking at the solution) queues the exercise for review; a
 * pass during a started review attempt reschedules or retires it.
 */
export function recordTestRun(
  state: ProgressState,
  exerciseId: string,
  passed: boolean,
  now: string,
): ProgressState {
  const prev = state.exercises[exerciseId] ?? emptyExercise
  const base = { ...prev, runs: prev.runs + 1, lastRunAt: now, lastRunPassed: passed }

  if (!passed) {
    return withExercise(state, exerciseId, () => ({ ...base, failedRuns: prev.failedRuns + 1 }))
  }

  const struggled = prev.failedRuns >= REVIEW_THRESHOLD || prev.solutionViewed
  const item = state.review[exerciseId]
  let review = state.review

  if (item?.startedAt) {
    const step = struggled ? 0 : item.step + 1
    review =
      step >= REVIEW_INTERVALS_DAYS.length
        ? withoutKey(review, exerciseId)
        : { ...review, [exerciseId]: { step, dueAt: addDays(now, REVIEW_INTERVALS_DAYS[step]), startedAt: null } }
  } else if (!item && prev.passedAt === null && struggled) {
    review = { ...review, [exerciseId]: { step: 0, dueAt: addDays(now, REVIEW_INTERVALS_DAYS[0]), startedAt: null } }
  }

  const exercise: ExerciseProgress = { ...base, failedRuns: 0, passedAt: prev.passedAt ?? now }
  return { ...state, exercises: { ...state.exercises, [exerciseId]: exercise }, review }
}

/** Starts a fresh review attempt: counters, hints and the solution peek reset. */
export function startReview(state: ProgressState, exerciseId: string, now: string): ProgressState {
  const item = state.review[exerciseId]
  if (!item) return state
  const next = withExercise(state, exerciseId, (ex) => ({
    ...ex,
    failedRuns: 0,
    hintsRevealed: 0,
    solutionViewed: false,
  }))
  return { ...next, review: { ...next.review, [exerciseId]: { ...item, startedAt: now } } }
}

export function dueReviews(state: ProgressState, now: string): [string, ReviewItem][] {
  return Object.entries(state.review)
    .filter(([, item]) => item.dueAt <= now)
    .sort(([, a], [, b]) => a.dueAt.localeCompare(b.dueAt))
}

export function upcomingReviews(state: ProgressState, now: string): [string, ReviewItem][] {
  return Object.entries(state.review)
    .filter(([, item]) => item.dueAt > now)
    .sort(([, a], [, b]) => a.dueAt.localeCompare(b.dueAt))
}

/** Best-effort check that persisted data has the shape this version expects. */
export function isProgressState(value: unknown): value is ProgressState {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    v.version === 1 &&
    typeof v.lessons === 'object' &&
    typeof v.exercises === 'object' &&
    typeof v.review === 'object' &&
    'lastVisited' in v
  )
}
