import '@testing-library/jest-dom/vitest'
import type { RunSummary } from '../exercise/run-summary'

// jsdom has no layout; React Router's <ScrollRestoration> calls scrollTo.
if (typeof window !== 'undefined') window.scrollTo = () => {}

// Sandpack needs a real browser and CodeSandbox's hosted bundler, so unit
// tests swap the two components that mount it for stand-ins. The real ones
// are covered by the "sandpack" Playwright project.
vi.mock('../components/SandboxEditor', () => ({
  default: () => <div data-testid="sandbox-editor" />,
}))

vi.mock('../exercise/ExerciseWorkspace', () => ({
  default: ({ onTestRun }: { onTestRun: (summary: RunSummary) => void }) => (
    <div>
      <button type="button" onClick={() => onTestRun({ passed: false, tests: [], fileErrors: [] })}>
        Simulate failing run
      </button>
      <button type="button" onClick={() => onTestRun({ passed: true, tests: [], fileErrors: [] })}>
        Simulate passing run
      </button>
    </div>
  ),
}))
