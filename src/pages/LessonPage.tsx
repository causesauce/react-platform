import { useEffect } from 'react'
import { useLoaderData } from 'react-router'
import { ItemNav } from '../components/ItemNav'
import { Breadcrumbs } from '../components/Layout'
import { mdxComponents } from '../components/mdx-components'
import { useProgress, useProgressStore } from '../progress/hooks'
import type { LessonData } from '../routes/loaders'

export function LessonPage() {
  const { lesson, module, Content } = useLoaderData() as LessonData
  const store = useProgressStore()
  const complete = lesson.id in useProgress().lessons

  useEffect(() => {
    store.recordVisit(lesson.path, lesson.title)
  }, [store, lesson.path, lesson.title])

  return (
    <div className="mx-auto max-w-3xl">
      <Breadcrumbs
        trail={[{ label: 'Course', to: '/' }, { label: module.title, to: module.path }, { label: lesson.title }]}
      />
      <p className="text-sm text-slate-500">{lesson.minutes} min read</p>
      <article className="prose prose-slate mt-2 max-w-none prose-pre:bg-slate-900">
        <h1>{lesson.title}</h1>
        <Content components={mdxComponents} />
      </article>

      <aside aria-labelledby="docs-heading" className="mt-8 rounded-lg border border-slate-200 bg-white p-4">
        <h2 id="docs-heading" className="font-semibold">
          Read more in the docs
        </h2>
        <ul className="mt-2 list-disc pl-5">
          {lesson.docs.map((link) => (
            <li key={link.url}>
              <a href={link.url} target="_blank" rel="noreferrer" className="text-indigo-700 hover:underline">
                {link.title}
              </a>
            </li>
          ))}
        </ul>
      </aside>

      <div className="mt-6">
        <button
          type="button"
          aria-pressed={complete}
          onClick={() => store.setLessonComplete(lesson.id, !complete)}
          className={
            complete
              ? 'rounded-md border border-green-600 px-4 py-2 font-medium text-green-700'
              : 'rounded-md bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-500'
          }
        >
          {complete ? '✓ Completed' : 'Mark lesson complete'}
        </button>
      </div>

      <ItemNav id={lesson.id} />
    </div>
  )
}
