import { initialState } from './logic'
import { createLocalStorage, createMemoryStorage, STORAGE_KEY } from './storage'
import { createProgressStore } from './store'

const fixedNow = () => new Date('2026-10-01T09:00:00.000Z')

beforeEach(() => window.localStorage.clear())

test('notifies subscribers and persists every change', () => {
  const storage = createMemoryStorage()
  const store = createProgressStore(storage, fixedNow)
  const listener = vi.fn()
  const unsubscribe = store.subscribe(listener)

  store.setLessonComplete('foundations/jsx', true)
  expect(listener).toHaveBeenCalledTimes(1)
  expect(storage.load()?.lessons).toEqual({ 'foundations/jsx': { completedAt: '2026-10-01T09:00:00.000Z' } })

  unsubscribe()
  store.recordVisit('/modules/foundations', 'Foundations')
  expect(listener).toHaveBeenCalledTimes(1)
})

test('does not notify when an action changes nothing', () => {
  const store = createProgressStore(createMemoryStorage(), fixedNow)
  store.setLessonComplete('foundations/jsx', true)
  const before = store.getSnapshot()
  const listener = vi.fn()
  store.subscribe(listener)
  store.setLessonComplete('foundations/jsx', true)
  expect(listener).not.toHaveBeenCalled()
  expect(store.getSnapshot()).toBe(before)
})

test('progress survives a reload through localStorage', () => {
  const first = createProgressStore(createLocalStorage(), fixedNow)
  first.recordTestRun('foundations/greeting', false)
  first.recordTestRun('foundations/greeting', true)

  const reloaded = createProgressStore(createLocalStorage(), fixedNow)
  expect(reloaded.getSnapshot().exercises['foundations/greeting']).toMatchObject({ runs: 2, passedAt: expect.any(String) })
})

test('starts fresh when stored data is corrupt or from another version', () => {
  window.localStorage.setItem(STORAGE_KEY, '{not json')
  expect(createProgressStore(createLocalStorage()).getSnapshot()).toEqual(initialState())

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 99 }))
  expect(createProgressStore(createLocalStorage()).getSnapshot()).toEqual(initialState())
})

test('picks up changes made in another tab', () => {
  const store = createProgressStore(createLocalStorage(), fixedNow)
  const listener = vi.fn()
  store.subscribe(listener)

  const otherTab = { ...initialState(), lessons: { 'foundations/props': { completedAt: 'x' } } }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(otherTab))
  window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }))

  expect(listener).toHaveBeenCalled()
  expect(store.getSnapshot().lessons).toEqual(otherTab.lessons)
})
