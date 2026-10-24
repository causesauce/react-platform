// Validates content/: the folder format, then every exercise's tests, which
// must FAIL against starter/ and PASS against solution/.
//
//   npm run validate                    # every module
//   npm run validate -- 01-foundations  # only these module folders
//   npm run validate -- --verbose       # also print Vitest's full report
//
// Each exercise variant is copied with its tests into .validate/, type-checked
// with tsc and run with Vitest + jsdom. The tests use Jest-style globals so the
// same files run unchanged in Sandpack's in-browser Jest runner.

import react from '@vitejs/plugin-react'
import { spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { startVitest } from 'vitest/node'
import { MAX_TESTS, MIN_TESTS } from '../src/content/schema.ts'
import { checkContent, type ExerciseInfo, type Problem } from './content-check.ts'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const contentDir = path.join(root, 'content')
const workDir = path.join(root, '.validate')
const VARIANTS = ['starter', 'solution'] as const
type Variant = (typeof VARIANTS)[number]

const relative = (file: string) => path.relative(root, file)

function printProblems(title: string, problems: Problem[]) {
  console.error(`\n✗ ${title}`)
  for (const problem of problems) console.error(`  ${relative(problem.file)}: ${problem.message}`)
}

/** .validate/<module>/<exercise>/<variant>/ holds the variant's files plus the tests. */
function workspaceFor(exercise: ExerciseInfo, variant: Variant) {
  return path.join(workDir, exercise.id, variant)
}

function prepareWorkspace(exercises: ExerciseInfo[]) {
  rmSync(workDir, { recursive: true, force: true })
  for (const exercise of exercises) {
    for (const variant of VARIANTS) {
      const target = workspaceFor(exercise, variant)
      mkdirSync(target, { recursive: true })
      cpSync(path.join(exercise.dir, variant), target, { recursive: true })
      cpSync(path.join(exercise.dir, 'tests'), target, { recursive: true })
    }
  }
  // Types only: jest-dom's main entry types Jest's expect, its /vitest entry
  // types Vitest's. At runtime each test file imports "@testing-library/jest-dom"
  // itself, exactly as it must in the sandbox, so no setup file is used.
  writeFileSync(path.join(workDir, 'jest-dom-types.ts'), "import '@testing-library/jest-dom/vitest'\n")
  // Mirrors the sandbox: strict TypeScript, the automatic JSX runtime and Jest-style globals.
  writeFileSync(
    path.join(workDir, 'tsconfig.json'),
    JSON.stringify(
      {
        compilerOptions: {
          target: 'es2022',
          lib: ['ES2022', 'DOM', 'DOM.Iterable'],
          module: 'esnext',
          moduleResolution: 'bundler',
          jsx: 'react-jsx',
          strict: true,
          noEmit: true,
          skipLibCheck: true,
          isolatedModules: true,
          types: ['vitest/globals'],
        },
        include: ['**/*'],
      },
      null,
      2,
    ),
  )
}

/** Maps a .validate path back to the source file the author edits. */
function sourcePath(exercises: ExerciseInfo[], workFile: string): string {
  for (const exercise of exercises) {
    for (const variant of VARIANTS) {
      const base = workspaceFor(exercise, variant)
      if (workFile.startsWith(base + path.sep)) {
        const file = path.relative(base, workFile)
        const folder = exercise.tests.includes(file) ? 'tests' : variant
        return path.join(exercise.dir, folder, file)
      }
    }
  }
  return workFile
}

function typecheck(exercises: ExerciseInfo[]): Problem[] {
  const tsc = path.join(root, 'node_modules', '.bin', 'tsc')
  const result = spawnSync(tsc, ['-p', path.join(workDir, 'tsconfig.json'), '--pretty', 'false'], {
    cwd: root,
    encoding: 'utf8',
  })
  const problems: Problem[] = []
  for (const line of `${result.stdout}${result.stderr}`.split('\n')) {
    const match = /^(.+?)\((\d+),(\d+)\): (error TS\d+: .*)$/.exec(line.trim())
    if (match) {
      const file = sourcePath(exercises, path.resolve(root, match[1]))
      problems.push({ file: `${file}:${match[2]}:${match[3]}`, message: match[4] })
    } else if (line.trim() && result.status !== 0 && !problems.length) {
      problems.push({ file: workDir, message: line.trim() })
    }
  }
  if (result.status !== 0 && problems.length === 0) problems.push({ file: workDir, message: 'tsc failed' })
  // Test files are checked once per variant; report each error once.
  const seen = new Set<string>()
  return problems.filter((problem) => {
    const key = `${problem.file} ${problem.message}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

type RunOutcome = { passed: number; failed: number; moduleErrors: string[]; failures: string[] }

const ANSI = new RegExp(String.fromCharCode(27) + String.raw`\[[0-9;]*m`, 'g')
const firstLine = (message: string) => message.replace(ANSI, '').trim().split('\n')[0]

async function runTests(verbose: boolean): Promise<Map<string, RunOutcome>> {
  const vitest = await startVitest(
    [],
    {
      config: false,
      root: workDir,
      include: ['**/*.test.{ts,tsx}'],
      environment: 'jsdom',
      globals: true,
      watch: false,
      // Starter runs are meant to fail, so the default report is mostly noise.
      reporters: verbose ? ['default'] : [],
    },
    { plugins: [react()], logLevel: 'error' },
  )
  const outcomes = new Map<string, RunOutcome>()
  for (const testModule of vitest.state.getTestModules()) {
    const dir = path.dirname(testModule.moduleId)
    const outcome = outcomes.get(dir) ?? { passed: 0, failed: 0, moduleErrors: [], failures: [] }
    for (const test of testModule.children.allTests()) {
      const result = test.result()
      if (result.state === 'passed') outcome.passed++
      else if (result.state === 'failed') {
        outcome.failed++
        outcome.failures.push(`${test.fullName}: ${firstLine(result.errors[0]?.message ?? '')}`)
      }
    }
    outcome.moduleErrors.push(...testModule.errors().map((error) => firstLine(error.message)))
    outcomes.set(dir, outcome)
  }
  await vitest.close()
  process.exitCode = 0 // Vitest sets 1 because starter runs fail; that is expected here.
  return outcomes
}

function judge(exercises: ExerciseInfo[], outcomes: Map<string, RunOutcome>): Problem[] {
  const problems: Problem[] = []
  for (const exercise of exercises) {
    const starter = outcomes.get(workspaceFor(exercise, 'starter'))
    const solution = outcomes.get(workspaceFor(exercise, 'solution'))
    const starterDir = path.join(exercise.dir, 'starter')
    const solutionDir = path.join(exercise.dir, 'solution')

    if (!solution) problems.push({ file: solutionDir, message: 'tests did not run' })
    else {
      const total = solution.passed + solution.failed
      if (solution.moduleErrors.length) {
        problems.push({ file: solutionDir, message: `test file crashed: ${solution.moduleErrors[0]}` })
      } else if (solution.failed > 0) {
        problems.push({
          file: solutionDir,
          message: `must pass every test (${solution.failed} of ${total} failed)\n    ${solution.failures.join('\n    ')}`,
        })
      }
      if (total < MIN_TESTS || total > MAX_TESTS) {
        problems.push({ file: path.join(exercise.dir, 'tests'), message: `needs ${MIN_TESTS}–${MAX_TESTS} tests (found ${total})` })
      }
    }

    if (!starter) problems.push({ file: starterDir, message: 'tests did not run' })
    else if (starter.moduleErrors.length) {
      problems.push({
        file: starterDir,
        message: `must compile and fail by assertion, but the test file crashed: ${starter.moduleErrors[0]}`,
      })
    } else if (starter.failed === 0) {
      problems.push({ file: starterDir, message: 'must fail at least one test, but every test passed' })
    }
  }
  return problems
}

async function main() {
  const args = process.argv.slice(2)
  const verbose = args.includes('--verbose')
  const only = args.filter((arg) => !arg.startsWith('--'))
  const { problems, exercises } = checkContent(contentDir, only)
  console.log(`Checked the content format: ${exercises.length} exercises ready to run.`)
  if (problems.length) {
    printProblems('Content format', problems)
    process.exitCode = 1
  }
  if (exercises.length === 0) return

  prepareWorkspace(exercises)
  const typeProblems = typecheck(exercises)
  if (typeProblems.length) {
    printProblems('Type check (starter and solution must both compile)', typeProblems)
    process.exitCode = 1
    return
  }
  console.log('Type check passed.')

  const outcomes = await runTests(verbose)
  const testProblems = judge(exercises, outcomes)
  if (testProblems.length) {
    printProblems('Starter must fail, solution must pass', testProblems)
  }
  for (const exercise of exercises) {
    const starter = outcomes.get(workspaceFor(exercise, 'starter'))
    const solution = outcomes.get(workspaceFor(exercise, 'solution'))
    console.log(
      `  ${exercise.id}: starter ${starter?.failed ?? '?'} failing, solution ${solution?.passed ?? '?'}/${(solution?.passed ?? 0) + (solution?.failed ?? 0)} passing`,
    )
  }

  const failed = problems.length + testProblems.length > 0
  console.log(failed ? '\n✗ Validation failed.' : '\n✓ Validation passed.')
  process.exitCode = failed ? 1 : 0
}

await main()
