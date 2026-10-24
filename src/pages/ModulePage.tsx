import { Link, useLoaderData } from 'react-router'
import { Breadcrumbs, ProgressBar } from '../components/Layout'
import { mdxComponents } from '../components/mdx-components'
import { findModule } from '../content/course'
import { useProgress } from '../progress/hooks'
import { isDone, moduleProgress } from '../progress/selectors'
import type { ModuleData } from '../routes/loaders'

export function ModulePage() {
  const { module, Capstone } = useLoaderData() as ModuleData
  const progress = useProgress()
  const { done, total } = moduleProgress(progress, module)

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Breadcrumbs trail={[{ label: 'Course', to: '/' }, { label: module.title }]} />
        <h1 className="text-3xl font-bold">
          Module {module.order}: {module.title}
        </h1>
        <p className="mt-2 max-w-2xl text-slate-700">{module.summary}</p>
        <div className="mt-3">
          <ProgressBar done={done} total={total} label={`${module.title} progress`} />
        </div>
        {module.prerequisites.length > 0 && (
          <p className="mt-3 text-sm text-slate-600">
            Before this module:{' '}
            {module.prerequisites.map((slug, index) => {
              const prerequisite = findModule(slug)
              return (
                <span key={slug}>
                  {index > 0 && ', '}
                  {prerequisite ? <Link to={prerequisite.path} className="underline">{prerequisite.title}</Link> : slug}
                </span>
              )
            })}
          </p>
        )}
      </div>

      <section aria-labelledby="lessons-heading">
        <h2 id="lessons-heading" className="mb-2 text-xl font-semibold">
          Lessons
        </h2>
        <ol className="flex flex-col gap-2">
          {module.lessons.map((lesson) => (
            <li key={lesson.id} className="flex items-baseline gap-2">
              <span aria-hidden="true">{isDone(progress, lesson) ? '✓' : '○'}</span>
              <Link to={lesson.path} className="font-medium hover:underline">
                {lesson.title}
              </Link>
              <span className="text-sm text-slate-500">{lesson.minutes} min</span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="exercises-heading">
        <h2 id="exercises-heading" className="mb-2 text-xl font-semibold">
          Exercises
        </h2>
        <ol className="flex flex-col gap-2">
          {module.exercises.map((exercise) => (
            <li key={exercise.id} className="flex items-baseline gap-2">
              <span aria-hidden="true">{isDone(progress, exercise) ? '✓' : '○'}</span>
              <Link to={exercise.path} className="font-medium hover:underline">
                {exercise.meta.title}
              </Link>
              <span className="text-sm text-slate-500">{exercise.meta.difficulty}</span>
            </li>
          ))}
        </ol>
      </section>

      {Capstone && (
        <section aria-labelledby="capstone-heading" className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 id="capstone-heading" className="mb-2 text-sm font-semibold uppercase tracking-wide text-indigo-700">
            Capstone step
          </h2>
          <article className="prose prose-slate max-w-none">
            <Capstone components={mdxComponents} />
          </article>
        </section>
      )}
    </div>
  )
}
