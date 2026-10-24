import {
  dueReviews,
  initialState,
  recordTestRun,
  recordVisit,
  revealHint,
  REVIEW_INTERVALS_DAYS,
  REVIEW_THRESHOLD,
  setLessonComplete,
  startReview,
  upcomingReviews,
  viewSolution,
  type ProgressState,
} from './logic'

const T0 = '2026-10-01T09:00:00.000Z'
const day = (n: number) => new Date(Date.parse(T0) + n * 86_400_000).toISOString()
const EX = 'foundations/order-summary'

function failTimes(state: ProgressState, times: number, now = T0) {
  let next = state
  for (let i = 0; i < times; i++) next = recordTestRun(next, EX, false, now)
  return next
}

describe('lessons and visits', () => {
  test('marks a lesson complete and back', () => {
    const done = setLessonComplete(initialState(), 'foundations/jsx', true, T0)
    expect(done.lessons['foundations/jsx']).toEqual({ completedAt: T0 })
    expect(setLessonComplete(done, 'foundations/jsx', false, T0).lessons).toEqual({})
  })

  test('returns the same state when nothing changes', () => {
    const done = setLessonComplete(initialState(), 'foundations/jsx', true, T0)
    expect(setLessonComplete(done, 'foundations/jsx', true, day(1))).toBe(done)
    const visited = recordVisit(done, '/x', 'X', T0)
    expect(recordVisit(visited, '/x', 'X', day(1))).toBe(visited)
  })
})

describe('test runs', () => {
  test('counts failed runs and records the first pass', () => {
    let state = failTimes(initialState(), 2)
    expect(state.exercises[EX]).toMatchObject({ runs: 2, failedRuns: 2, passedAt: null, lastRunPassed: false })
    state = recordTestRun(state, EX, true, day(1))
    expect(state.exercises[EX]).toMatchObject({ runs: 3, failedRuns: 0, passedAt: day(1), lastRunPassed: true })
  })

  test('a quick pass does not go to review', () => {
    const state = recordTestRun(failTimes(initialState(), REVIEW_THRESHOLD - 1), EX, true, T0)
    expect(state.review).toEqual({})
  })

  test(`${REVIEW_THRESHOLD} failed runs before passing queue a review for the next day`, () => {
    const state = recordTestRun(failTimes(initialState(), REVIEW_THRESHOLD), EX, true, T0)
    expect(state.review[EX]).toEqual({ step: 0, dueAt: day(REVIEW_INTERVALS_DAYS[0]), startedAt: null })
  })

  test('looking at the solution before passing queues a review', () => {
    const state = recordTestRun(viewSolution(initialState(), EX), EX, true, T0)
    expect(state.review[EX]?.step).toBe(0)
  })

  test('later passes outside a review attempt leave the schedule alone', () => {
    const queued = recordTestRun(failTimes(initialState(), REVIEW_THRESHOLD), EX, true, T0)
    const again = recordTestRun(failTimes(queued, 5), EX, true, day(2))
    expect(again.review[EX]).toEqual(queued.review[EX])
  })
})

describe('review attempts', () => {
  const queued = () => recordTestRun(failTimes(initialState(), REVIEW_THRESHOLD), EX, true, T0)

  test('starting a review resets counters, hints and the solution peek', () => {
    let state = revealHint(viewSolution(queued(), EX), EX, 3)
    state = startReview(state, EX, day(1))
    expect(state.exercises[EX]).toMatchObject({ failedRuns: 0, hintsRevealed: 0, solutionViewed: false })
    expect(state.review[EX]?.startedAt).toBe(day(1))
  })

  test('clean reviews move along the intervals and then retire the exercise', () => {
    let state = queued()
    let now = day(1)
    for (let step = 1; step < REVIEW_INTERVALS_DAYS.length; step++) {
      state = recordTestRun(startReview(state, EX, now), EX, true, now)
      expect(state.review[EX]).toEqual({ step, dueAt: day(dayOffset(now) + REVIEW_INTERVALS_DAYS[step]), startedAt: null })
      now = state.review[EX]!.dueAt
    }
    state = recordTestRun(startReview(state, EX, now), EX, true, now)
    expect(state.review[EX]).toBeUndefined()
  })

  test('a struggling review goes back to the first interval', () => {
    let state = recordTestRun(startReview(queued(), EX, day(1)), EX, true, day(1))
    expect(state.review[EX]?.step).toBe(1)
    state = startReview(state, EX, day(4))
    state = recordTestRun(failTimes(state, REVIEW_THRESHOLD, day(4)), EX, true, day(4))
    expect(state.review[EX]).toEqual({ step: 0, dueAt: day(4 + REVIEW_INTERVALS_DAYS[0]), startedAt: null })
  })

  test('starting a review for an exercise not in the queue does nothing', () => {
    const state = initialState()
    expect(startReview(state, EX, T0)).toBe(state)
  })
})

describe('hints and queue views', () => {
  test('hints stop at the number available', () => {
    let state = initialState()
    for (let i = 0; i < 5; i++) state = revealHint(state, EX, 2)
    expect(state.exercises[EX]?.hintsRevealed).toBe(2)
  })

  test('splits the queue into due and upcoming, soonest first', () => {
    const state: ProgressState = {
      ...initialState(),
      review: {
        a: { step: 0, dueAt: day(3), startedAt: null },
        b: { step: 0, dueAt: day(1), startedAt: null },
        c: { step: 1, dueAt: day(10), startedAt: null },
      },
    }
    expect(dueReviews(state, day(5)).map(([id]) => id)).toEqual(['b', 'a'])
    expect(upcomingReviews(state, day(5)).map(([id]) => id)).toEqual(['c'])
  })
})

function dayOffset(iso: string) {
  return Math.round((Date.parse(iso) - Date.parse(T0)) / 86_400_000)
}
