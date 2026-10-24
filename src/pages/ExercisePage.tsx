import { lazy, Suspense, useCallback, useEffect, useState, type ReactNode } from 'react'
import { useLoaderData } from 'react-router'
import { InlineCode } from '../components/InlineCode'
import { ItemNav } from '../components/ItemNav'
import { Breadcrumbs } from '../components/Layout'
import { mdxComponents } from '../components/mdx-components'
import type { Exercise } from '../content/build-course'
import type { ExerciseData } from '../routes/loaders'
import { clearDraft } from '../progress/drafts'
import { emptyExercise } from '../progress/logic'
import { useNow, useProgress, useProgressStore } from '../progress/hooks'
import type { RunSummary } from '../exercise/run-summary'

const ExerciseWorkspace = lazy(() => import('../exercise/ExerciseWorkspace'))

export function ExercisePage() {
  const { exercise, module, files, Explanation } = useLoaderData() as ExerciseData
  const store = useProgressStore()
  const progress = useProgress()
  const state = progress.exercises[exercise.id] ?? emptyExercise
  const review = progress.review[exercise.id]
  const now = useNow()
  const reviewDue = review && review.dueAt <= now && !review.startedAt
  // Bumped to remount the workspace with fresh starter code.
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    store.recordVisit(exercise.path, exercise.meta.title)
  }, [store, exercise.path, exercise.meta.title])

  const onTestRun = useCallback(
    (summary: RunSummary) => store.recordTestRun(exercise.id, summary.passed),
    [store, exercise.id],
  )

  const startReview = () => {
    clearDraft(exercise.id)
    store.startReview(exercise.id)
    setAttempt((value) => value + 1)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Breadcrumbs
          trail={[{ label: 'Course', to: '/' }, { label: module.title, to: module.path }, { label: exercise.meta.title }]}
        />
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold">{exercise.meta.title}</h1>
          <span className="rounded-full bg-slate-200 px-3 py-1 text-sm">{exercise.meta.difficulty}</span>
          {state.passedAt && <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-800">✓ Passed</span>}
        </div>
        <p className="mt-3 max-w-3xl text-slate-800">
          <InlineCode text={exercise.meta.task} />
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Look for the <code>// TODO</code> comments in the code. The tests are hidden; they check what the page shows
          and how it responds, not how you wrote it.
        </p>
      </div>

      {reviewDue && (
        <div role="note" className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-amber-50 p-4">
          <p>This exercise is due for review. Start from the starter code and solve it again.</p>
          <button type="button" onClick={startReview} className="rounded-md bg-amber-600 px-4 py-2 text-white">
            Start review
          </button>
        </div>
      )}

      <Suspense fallback={<p className="rounded-lg bg-white p-6">Loading the editor…</p>}>
        <ExerciseWorkspace key={`${exercise.id}:${attempt}`} exercise={exercise} files={files} onTestRun={onTestRun} />
      </Suspense>

      <HintsAndSolution
        key={exercise.id}
        exercise={exercise}
        hintsRevealed={state.hintsRevealed}
        solutionViewed={state.solutionViewed}
        passed={Boolean(state.passedAt)}
        solution={files.solution}
        explanation={Explanation && <Explanation components={mdxComponents} />}
      />

      <ItemNav id={exercise.id} />
    </div>
  )
}

type HintsProps = {
  exercise: Exercise
  hintsRevealed: number
  solutionViewed: boolean
  passed: boolean
  solution: Record<string, string>
  explanation: ReactNode
}

function HintsAndSolution({ exercise, hintsRevealed, solutionViewed, passed, solution, explanation }: HintsProps) {
  const store = useProgressStore()
  const { hints } = exercise.meta
  const solutionUnlocked = passed || hintsRevealed >= hints.length
  // Collapsing only hides what was revealed; progress keeps the count.
  const [hintsOpen, setHintsOpen] = useState(true)
  const [solutionOpen, setSolutionOpen] = useState(true)

  const revealNext = () => {
    store.revealHint(exercise.id, hints.length)
    setHintsOpen(true)
  }

  return (
    <section aria-labelledby="hints-heading" className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="hints-heading" className="text-lg font-semibold">
          Hints
        </h2>
        {hintsRevealed > 0 && (
          <button
            type="button"
            aria-expanded={hintsOpen}
            aria-controls="hint-list"
            onClick={() => setHintsOpen((open) => !open)}
            className="text-sm text-slate-600 underline hover:text-slate-900"
          >
            {hintsOpen ? 'Hide hints' : `Show ${hintsRevealed === 1 ? 'the hint' : `${hintsRevealed} hints`} you've seen`}
          </button>
        )}
      </div>
      {hintsRevealed > 0 && hintsOpen && (
        <ol id="hint-list" className="mt-3 flex flex-col gap-2">
          {hints.slice(0, hintsRevealed).map((hint, index) => (
            <li key={hint} className="rounded-md bg-indigo-50 p-3">
              <span className="font-medium">Hint {index + 1}:</span> <InlineCode text={hint} />
            </li>
          ))}
        </ol>
      )}
      <div className="mt-3 flex flex-wrap gap-3">
        {hintsRevealed < hints.length && (
          <button
            type="button"
            onClick={revealNext}
            className="rounded-md border border-indigo-600 px-4 py-2 text-indigo-700 hover:bg-indigo-50"
          >
            Show hint {hintsRevealed + 1} of {hints.length}
          </button>
        )}
        {solutionUnlocked && !solutionViewed && (
          <button
            type="button"
            onClick={() => store.viewSolution(exercise.id)}
            className="rounded-md border border-slate-400 px-4 py-2 hover:bg-slate-50"
          >
            Show the solution
          </button>
        )}
        {!solutionUnlocked && (
          <p className="self-center text-sm text-slate-600">The solution unlocks after the last hint or a passing run.</p>
        )}
      </div>

      {solutionViewed && (
        <div className="mt-6 flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">Solution</h3>
          <button
            type="button"
            aria-expanded={solutionOpen}
            aria-controls="solution"
            onClick={() => setSolutionOpen((open) => !open)}
            className="text-sm text-slate-600 underline hover:text-slate-900"
          >
            {solutionOpen ? 'Hide solution' : 'Show solution'}
          </button>
        </div>
      )}
      {solutionViewed && solutionOpen && (
        <div id="solution" className="mt-3 flex flex-col gap-4">
          {Object.entries(solution).map(([path, code]) => (
            <figure key={path}>
              <figcaption className="mb-1 font-mono text-sm text-slate-600">{path.slice(1)}</figcaption>
              <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-slate-100">{code}</pre>
            </figure>
          ))}
          {explanation && (
            <div>
              <h3 className="mb-2 text-lg font-semibold">Why it's written this way</h3>
              <article className="prose prose-slate max-w-none">{explanation}</article>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
