import { Link } from 'react-router'
import { ProgressBar } from '../components/Layout'
import { course, items } from '../content/course'
import { useProgress } from '../progress/hooks'
import { isDone, itemTitle, moduleProgress } from '../progress/selectors'

export function CourseMap() {
  const progress = useProgress()
  const nextUp = items.find((item) => !isDone(progress, item))
  const resume = progress.lastVisited

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">Course map</h1>
        <p className="max-w-2xl text-slate-700">
          Twelve modules from first components to Server Components. Each one has short lessons, exercises checked by
          tests, and a step of the project tracker capstone.
        </p>
        <div className="flex flex-wrap gap-3">
          {resume ? (
            <Link to={resume.path} className="rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500">
              Continue where you left off: {resume.title}
            </Link>
          ) : (
            nextUp && (
              <Link to={nextUp.path} className="rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500">
                Start: {itemTitle(nextUp)}
              </Link>
            )
          )}
          {resume && nextUp && nextUp.path !== resume.path && (
            <Link to={nextUp.path} className="rounded-md border border-slate-300 px-4 py-2 font-medium hover:bg-white">
              Next not done: {itemTitle(nextUp)}
            </Link>
          )}
        </div>
      </header>

      {course.length === 0 && <p>No modules have been written yet.</p>}

      <ol className="flex flex-col gap-6" aria-label="Modules">
        {course.map((module) => {
          const { done, total } = moduleProgress(progress, module)
          return (
            <li key={module.slug} className="rounded-lg border border-slate-200 bg-white p-5">
              <section aria-labelledby={`module-${module.slug}`} className="flex flex-col gap-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 id={`module-${module.slug}`} className="text-xl font-semibold">
                    <Link to={module.path} className="hover:underline">
                      {module.order}. {module.title}
                    </Link>
                  </h2>
                  <ProgressBar done={done} total={total} label={`${module.title} progress`} />
                </div>
                <p className="text-slate-700">{module.summary}</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <ItemList title="Lessons" items={module.lessons} />
                  <ItemList title="Exercises" items={module.exercises} />
                </div>
              </section>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function ItemList({ title, items }: { title: string; items: Parameters<typeof isDone>[1][] }) {
  const progress = useProgress()
  if (items.length === 0) return null
  return (
    <div>
      <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      <ol className="flex flex-col gap-1">
        {items.map((item) => {
          const done = isDone(progress, item)
          return (
            <li key={item.id} className="flex gap-2">
              <span aria-hidden="true" className={done ? 'text-green-600' : 'text-slate-300'}>
                {done ? '✓' : '○'}
              </span>
              <Link to={item.path} className="hover:underline">
                {itemTitle(item)}
              </Link>
              {done && <span className="sr-only">(done)</span>}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
