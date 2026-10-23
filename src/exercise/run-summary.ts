export type TestResult = {
  name: string
  /** describe() block names, outermost first. */
  blocks: string[]
  status: 'pass' | 'fail'
  error?: string
}

export type RunSummary = {
  passed: boolean
  tests: TestResult[]
  fileErrors: string[]
}

export function summarise(tests: TestResult[], fileErrors: string[]): RunSummary {
  return {
    passed: fileErrors.length === 0 && tests.length > 0 && tests.every((test) => test.status === 'pass'),
    tests,
    fileErrors,
  }
}
