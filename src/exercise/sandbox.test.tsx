import { render, screen } from '@testing-library/react'
import packageJson from '../../package.json'
import { Sandbox } from '../components/Sandbox'
import { filesFromChildren } from '../components/sandbox-files'
import { EXERCISE_BASE_PACKAGES, EXERCISE_OPTIONAL_PACKAGES } from '../content/schema'
import { editablePaths, sandboxDependencies, sandboxFiles } from './sandbox'
import { summarise } from './run-summary'

const installed: Record<string, string> = { ...packageJson.dependencies, ...packageJson.devDependencies }

describe('sandbox dependencies', () => {
  test('every package an exercise can use is pinned to an exact version', () => {
    for (const name of [...EXERCISE_BASE_PACKAGES, ...EXERCISE_OPTIONAL_PACKAGES]) {
      expect(installed[name], name).toMatch(/^\d+\.\d+\.\d+$/)
    }
  })

  test('an exercise gets the testing stack plus what it opts into', () => {
    const deps = sandboxDependencies({ dependencies: ['react-router'] })
    expect(Object.keys(deps)).toEqual([...EXERCISE_BASE_PACKAGES, 'react-router'])
    expect(deps.react).toBe(installed.react)
  })
})

describe('sandbox files', () => {
  const files = {
    starter: { '/Button.tsx': 'button', '/App.tsx': 'app' },
    tests: { '/App.test.tsx': 'tests' },
  }

  test('puts App.tsx first and hides the tests', () => {
    expect(editablePaths(files)).toEqual(['/App.tsx', '/Button.tsx'])
    expect(sandboxFiles(files, null)).toEqual({
      '/App.tsx': { code: 'app' },
      '/Button.tsx': { code: 'button' },
      '/App.test.tsx': { code: 'tests', hidden: true, readOnly: true },
    })
  })

  test('restores a saved draft over the starter code', () => {
    expect(sandboxFiles(files, { '/App.tsx': 'my edit' })['/App.tsx']).toEqual({ code: 'my edit' })
  })
})

describe('lesson <Sandbox>', () => {
  test('turns fenced code blocks into files named by the fence meta', () => {
    const children = (
      <>
        <pre>
          <code className="language-tsx">{'export default function App() {}\n'}</code>
        </pre>
        <pre>
          <code className="language-tsx" data-meta="Card.tsx">
            {'export function Card() {}\n'}
          </code>
        </pre>
      </>
    )
    expect(filesFromChildren(children.props.children)).toEqual({
      '/App.tsx': 'export default function App() {}\n',
      '/Card.tsx': 'export function Card() {}\n',
    })
  })

  test('shows the code while the editor loads', () => {
    render(
      <Sandbox>
        <pre>
          <code>{'const answer = 42;'}</code>
        </pre>
      </Sandbox>,
    )
    expect(screen.getByText('const answer = 42;')).toBeInTheDocument()
  })
})

describe('test run summary', () => {
  test('passes only when every test passed and nothing crashed', () => {
    const pass = { name: 'a', blocks: [], status: 'pass' as const }
    const fail = { name: 'b', blocks: [], status: 'fail' as const }
    expect(summarise([pass, pass], []).passed).toBe(true)
    expect(summarise([pass, fail], []).passed).toBe(false)
    expect(summarise([pass], ['/App.test.tsx: SyntaxError']).passed).toBe(false)
    expect(summarise([], []).passed).toBe(false)
  })
})
