import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { course } from '../content/course'
import { initialState, type ProgressState } from '../progress/logic'
import { ProgressProvider } from '../progress/ProgressProvider'
import { createMemoryStorage } from '../progress/storage'
import { createProgressStore } from '../progress/store'
import { routes } from '../router'

function renderApp(path: string, state: ProgressState = initialState()) {
  const store = createProgressStore(createMemoryStorage(state))
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(
    <ProgressProvider store={store}>
      <RouterProvider router={router} />
    </ProgressProvider>,
  )
  return { store, router }
}

const foundations = course[0]
const firstLesson = foundations.lessons[0]
const firstExercise = foundations.exercises[0]

describe('course map', () => {
  test('lists modules with their lessons and offers a start button', () => {
    renderApp('/')
    const modules = screen.getByRole('list', { name: 'Modules' })
    expect(within(modules).getByRole('heading', { name: `1. ${foundations.title}` })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: `Start: ${firstLesson.title}` })).toHaveAttribute('href', firstLesson.path)
  })

  test('shows completion and a way back to where the learner left off', () => {
    renderApp('/', {
      ...initialState(),
      lessons: { [firstLesson.id]: { completedAt: '2026-10-01T00:00:00.000Z' } },
      lastVisited: { path: firstExercise.path, title: firstExercise.meta.title, at: '2026-10-01T00:00:00.000Z' },
    })
    const total = foundations.lessons.length + foundations.exercises.length
    expect(screen.getByText(`1/${total} done`)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: `Continue where you left off: ${firstExercise.meta.title}` })).toHaveAttribute(
      'href',
      firstExercise.path,
    )
  })
})

describe('review page', () => {
  test('explains the empty queue', () => {
    renderApp('/review')
    expect(screen.getByText('Nothing to review right now.')).toBeInTheDocument()
  })

  test('lists due exercises and starts a fresh attempt', async () => {
    const { store, router } = renderApp('/review', {
      ...initialState(),
      review: { [firstExercise.id]: { step: 0, dueAt: '2020-01-01T00:00:00.000Z', startedAt: null } },
    })
    expect(screen.getByRole('navigation', { name: 'Main' })).toHaveTextContent('1 due')
    await userEvent.click(screen.getByRole('button', { name: `Start review: ${firstExercise.meta.title}` }))
    expect(store.getSnapshot().review[firstExercise.id]?.startedAt).not.toBeNull()
    expect(await screen.findByRole('heading', { level: 1, name: firstExercise.meta.title })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe(firstExercise.path)
  })
})

describe('module page', () => {
  test('shows lessons, exercises and the capstone step', async () => {
    renderApp(foundations.path)
    expect(await screen.findByRole('heading', { level: 1, name: `Module 1: ${foundations.title}` })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Capstone step' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: firstExercise.meta.title })).toHaveAttribute('href', firstExercise.path)
  })

  test('unknown modules show the not-found page', async () => {
    renderApp('/modules/does-not-exist')
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
  })
})

describe('lesson page', () => {
  test('marks the lesson complete and remembers the visit', async () => {
    const { store } = renderApp(firstLesson.path)
    expect(await screen.findByRole('heading', { level: 1, name: firstLesson.title })).toBeInTheDocument()
    expect(store.getSnapshot().lastVisited?.path).toBe(firstLesson.path)

    await userEvent.click(screen.getByRole('button', { name: 'Mark lesson complete' }))
    expect(store.getSnapshot().lessons[firstLesson.id]).toBeDefined()
    expect(screen.getByRole('button', { name: '✓ Completed' })).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('exercise page', () => {
  test('reveals hints one at a time, then unlocks the solution and explanation', async () => {
    const user = userEvent.setup()
    const { store } = renderApp(firstExercise.path)
    const hints = firstExercise.meta.hints
    expect(await screen.findByRole('heading', { level: 1, name: firstExercise.meta.title })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Show the solution' })).not.toBeInTheDocument()

    for (let i = 0; i < hints.length; i++) {
      await user.click(screen.getByRole('button', { name: `Show hint ${i + 1} of ${hints.length}` }))
    }
    expect(screen.getAllByText(/^Hint \d:$/)).toHaveLength(hints.length)

    await user.click(screen.getByRole('button', { name: 'Hide hints' }))
    expect(screen.queryByText(/^Hint \d:$/)).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: `Show ${hints.length} hints you've seen` }))
    expect(screen.getAllByText(/^Hint \d:$/)).toHaveLength(hints.length)

    await user.click(screen.getByRole('button', { name: 'Show the solution' }))
    expect(screen.getByRole('heading', { name: 'Solution' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: "Why it's written this way" })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Hide solution' }))
    expect(screen.queryByRole('heading', { name: "Why it's written this way" })).not.toBeInTheDocument()
    expect(store.getSnapshot().exercises[firstExercise.id]).toMatchObject({
      hintsRevealed: hints.length,
      solutionViewed: true,
    })
  })

  test('records runs; a pass after several failures queues a review', async () => {
    const user = userEvent.setup()
    const { store } = renderApp(firstExercise.path)
    await screen.findByRole('heading', { level: 1, name: firstExercise.meta.title })

    for (let i = 0; i < 3; i++) await user.click(screen.getByRole('button', { name: 'Simulate failing run' }))
    await user.click(screen.getByRole('button', { name: 'Simulate passing run' }))

    expect(screen.getByText('✓ Passed')).toBeInTheDocument()
    expect(store.getSnapshot().exercises[firstExercise.id]?.runs).toBe(4)
    expect(store.getSnapshot().review[firstExercise.id]).toBeDefined()
  })
})
