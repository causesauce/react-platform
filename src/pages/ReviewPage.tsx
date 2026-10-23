import { Link, useNavigate } from 'react-router'
import { findExerciseById } from '../content/course'
import { clearDraft } from '../progress/drafts'
import { dueReviews, REVIEW_THRESHOLD, upcomingReviews } from '../progress/logic'
import { useNow, useProgress, useProgressStore } from '../progress/hooks'

const dateFormat = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' })

export function ReviewPage() {
  const progress = useProgress()
  const store = useProgressStore()
  const navigate = useNavigate()
  const now = useNow()
  const due = dueReviews(progress, now)
  const upcoming = upcomingReviews(progress, now)

  const start = (exerciseId: string) => {
    const exercise = findExerciseById(exerciseId)
    if (!exercise) return
    clearDraft(exerciseId)
    store.startReview(exerciseId)
    navigate(exercise.path)
  }

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold">Review</h1>
        <p className="mt-2 text-slate-700">
          Exercises that took {REVIEW_THRESHOLD} or more failed runs, or a look at the solution, come back here a day
          later. Solve them cleanly again and they return after 3 days, then 7, then leave the queue.
        </p>
      </header>

      <section aria-labelledby="due-heading">
        <h2 id="due-heading" className="mb-3 text-xl font-semibold">
          Due now
        </h2>
        {due.length === 0 ? (
          <p className="text-slate-600">Nothing to review right now.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {due.map(([id]) => {
              const exercise = findExerciseById(id)
              if (!exercise) return null
              return (
                <li key={id} className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-3">
                  <Link to={exercise.path} className="font-medium hover:underline">
                    {exercise.meta.title}
                  </Link>
                  <button
                    type="button"
                    onClick={() => start(id)}
                    className="rounded-md bg-amber-600 px-3 py-1.5 text-white hover:bg-amber-500"
                    aria-label={`Start review: ${exercise.meta.title}`}
                  >
                    Start review
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {upcoming.length > 0 && (
        <section aria-labelledby="upcoming-heading">
          <h2 id="upcoming-heading" className="mb-3 text-xl font-semibold">
            Coming up
          </h2>
          <ul className="flex flex-col gap-2">
            {upcoming.map(([id, item]) => {
              const exercise = findExerciseById(id)
              if (!exercise) return null
              return (
                <li key={id} className="flex justify-between gap-4 rounded-lg border border-slate-200 bg-white p-3">
                  <Link to={exercise.path} className="hover:underline">
                    {exercise.meta.title}
                  </Link>
                  <span className="text-sm text-slate-600">{dateFormat.format(new Date(item.dueAt))}</span>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </div>
  )
}
