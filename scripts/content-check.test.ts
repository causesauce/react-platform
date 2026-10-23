// @vitest-environment node
import { cpSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { checkContent } from './content-check.ts'

const realContent = path.resolve(import.meta.dirname, '..', 'content')

test('the committed content passes the format check', () => {
  const { problems, exercises } = checkContent(realContent)
  expect(problems).toEqual([])
  expect(exercises.length).toBeGreaterThanOrEqual(4)
})

describe('format problems are reported against the file to fix', () => {
  let dir: string
  const module = () => path.join(dir, '01-foundations')
  const messagesFor = (file: string) =>
    checkContent(dir)
      .problems.filter((problem) => problem.file === file)
      .map((problem) => problem.message)

  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), 'content-'))
    cpSync(path.join(realContent, '01-foundations'), module(), { recursive: true })
  })
  afterEach(() => rmSync(dir, { recursive: true, force: true }))

  test('module.json order must match the folder number', () => {
    const file = path.join(module(), 'module.json')
    writeFileSync(file, JSON.stringify({ title: 'F', summary: 'S', order: 2, prerequisites: ['nope'] }))
    expect(messagesFor(file)).toEqual(['"order" is 2 but the folder says 1', 'unknown prerequisite "nope"'])
  })

  test('lessons need frontmatter, a sandbox and a common-mistake box', () => {
    const file = path.join(module(), '09-bare.mdx')
    writeFileSync(file, '# Title\n\nJust text.\n')
    expect(messagesFor(file)).toEqual([
      'frontmatter: frontmatter is missing',
      'needs a runnable example: wrap a code block in <Sandbox>',
      'needs a <CommonMistake> box',
      'do not use a level-1 heading; the page renders the frontmatter title',
    ])
  })

  test('exercises need matching starter and solution files and TODO markers', () => {
    const exercise = path.join(module(), 'exercises', '01-site-header')
    writeFileSync(path.join(exercise, 'solution', 'Extra.tsx'), 'export {}\n')
    writeFileSync(path.join(exercise, 'starter', 'App.tsx'), 'export default function App() { return null }\n')
    const { problems, exercises } = checkContent(dir)
    expect(problems.map((problem) => path.relative(exercise, problem.file) + ': ' + problem.message)).toEqual([
      'solution: must contain the same files as starter/ (starter: App.tsx)',
      'starter: starter code needs // TODO markers showing what to change',
    ])
    expect(exercises.map((ex) => ex.id)).not.toContain('foundations/site-header')
  })

  test('a module needs enough exercises', () => {
    const exercises = path.join(module(), 'exercises')
    for (const name of ['02-team-cards', '03-order-summary', '04-reading-list']) {
      rmSync(path.join(exercises, name), { recursive: true })
    }
    expect(messagesFor(exercises)).toEqual(['a module needs at least 3 exercises (found 2)'])
  })
})
