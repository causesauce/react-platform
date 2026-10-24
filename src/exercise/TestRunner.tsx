import { useSandpackClient } from '@codesandbox/sandpack-react'
import type { SandpackMessage } from '@codesandbox/sandpack-client'
import { useEffect, useRef, useState } from 'react'
import { summarise, type RunSummary, type TestResult } from './run-summary'

type Status = 'initialising' | 'idle' | 'running' | 'complete'

type TestMessage = Extract<SandpackMessage, { type: 'test' }>

// A run request can arrive before the sandbox's test runner is listening, and
// then it is dropped silently. Resend it until a run starts.
const RETRY_MS = 15_000
const MAX_ATTEMPTS = 5

const ANSI = new RegExp(String.fromCharCode(27) + String.raw`\[[0-9;]*m`, 'g')
const clean = (message: string | undefined) => (message ?? '').replace(ANSI, '').trim()

/**
 * "Run tests" for the exercise: talks to Sandpack's in-browser Jest runner
 * through its own hidden client, like Sandpack's <SandpackTests>, but runs
 * only on request and reports each completed run exactly once.
 */
export function TestRunner({ onComplete }: { onComplete: (summary: RunSummary) => void }) {
  const { iframe, listen, getClient } = useSandpackClient()
  const [status, setStatus] = useState<Status>('initialising')
  const [summary, setSummary] = useState<RunSummary | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  // Keyed by file, describe blocks and name: if a resend overlaps a slow first
  // run, both report each test, and it must only count once.
  const run = useRef<{ tests: Map<string, TestResult>; fileErrors: Set<string> } | null>(null)
  // True from a click until its run finishes; runs nobody asked for are ignored.
  const awaiting = useRef(false)
  const retryTimer = useRef<number | undefined>(undefined)
  const onCompleteRef = useRef(onComplete)
  // Retries fire from timers, so they read the latest getClient through a ref.
  const getClientRef = useRef(getClient)

  useEffect(() => {
    onCompleteRef.current = onComplete
    getClientRef.current = getClient
  })

  useEffect(() => () => window.clearTimeout(retryTimer.current), [])

  useEffect(() => {
    return listen((message) => {
      if (message.type === 'done') {
        setStatus((current) => (current === 'initialising' ? 'idle' : current))
        return
      }
      if (message.type !== 'test') return
      const event = message as TestMessage
      switch (event.event) {
        case 'initialize_tests':
          setStatus((current) => (current === 'initialising' ? 'idle' : current))
          break
        case 'total_test_start':
          window.clearTimeout(retryTimer.current)
          run.current = awaiting.current ? { tests: new Map(), fileErrors: new Set() } : null
          break
        case 'file_error':
          run.current?.fileErrors.add(`${event.path}: ${clean(event.error.message)}`)
          break
        case 'test_end':
          if (event.test.status === 'pass' || event.test.status === 'fail') {
            run.current?.tests.set([event.test.path, ...event.test.blocks, event.test.name].join('\u0000'), {
              name: event.test.name,
              blocks: event.test.blocks,
              status: event.test.status,
              error: event.test.errors.length ? clean(event.test.errors[0].message) : undefined,
            })
          }
          break
        case 'total_test_end': {
          const finished = run.current
          run.current = null
          if (!finished) break
          awaiting.current = false
          const result = summarise([...finished.tests.values()], [...finished.fileErrors])
          setSummary(result)
          setStatus('complete')
          onCompleteRef.current(result)
          break
        }
      }
    })
  }, [listen])

  const requestRun = (attempt: number) => {
    const client = getClientRef.current()
    if (client) client.dispatch({ type: 'run-all-tests' })
    retryTimer.current = window.setTimeout(() => {
      if (attempt < MAX_ATTEMPTS) {
        requestRun(attempt + 1)
      } else {
        awaiting.current = false
        setStatus('idle')
        setNotice("The test runner didn't respond. Wait a moment and run the tests again.")
      }
    }, RETRY_MS)
  }

  const runTests = () => {
    window.clearTimeout(retryTimer.current)
    awaiting.current = true
    setNotice(null)
    setStatus('running')
    requestRun(1)
  }

  const passCount = summary?.tests.filter((test) => test.status === 'pass').length ?? 0

  return (
    <section aria-labelledby="tests-heading" className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <iframe ref={iframe} title="Test runner" className="hidden" />
      <div className="flex items-center justify-between gap-4">
        <h2 id="tests-heading" className="text-lg font-semibold">
          Tests
        </h2>
        <button
          type="button"
          onClick={runTests}
          disabled={status === 'initialising' || status === 'running'}
          className="rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {status === 'initialising' ? 'Loading…' : status === 'running' ? 'Running…' : 'Run tests'}
        </button>
      </div>

      <div role="status" aria-live="polite" className="text-sm text-slate-600">
        {status === 'complete' && summary
          ? summary.passed
            ? `All ${summary.tests.length} tests passed.`
            : `${passCount} of ${summary.tests.length} tests passed.`
          : status === 'running'
            ? 'Running tests…'
            : (notice ?? 'Run the tests when you are ready to check your work.')}
      </div>

      {summary && summary.fileErrors.length > 0 && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-900">
          <p className="font-medium">The tests could not run:</p>
          {summary.fileErrors.map((error) => (
            <pre key={error} className="mt-2 overflow-x-auto whitespace-pre-wrap font-mono text-xs">
              {error}
            </pre>
          ))}
        </div>
      )}

      {summary && summary.tests.length > 0 && (
        <ul aria-label="Test results" className="flex flex-col gap-2">
          {summary.tests.map((test) => {
            const label = [...test.blocks, test.name].join(' › ')
            return (
              <li key={label} className="rounded-md border border-slate-100 p-2">
                <span className={test.status === 'pass' ? 'text-green-700' : 'text-red-700'}>
                  {test.status === 'pass' ? '✓ Pass' : '✗ Fail'}
                </span>{' '}
                <span>{label}</span>
                {test.error && (
                  <details className="mt-1">
                    <summary className="cursor-pointer text-sm text-slate-600">Why it failed</summary>
                    <pre className="mt-1 max-h-64 overflow-auto whitespace-pre-wrap font-mono text-xs">{test.error}</pre>
                  </details>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
