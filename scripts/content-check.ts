import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  MIN_EXERCISES,
  parseExerciseMeta,
  parseLessonFrontmatter,
  parseModuleMeta,
  parseOrderedName,
} from '../src/content/schema.ts'
import { readFrontmatter } from './frontmatter.ts'

export type Problem = { file: string; message: string }

export type ExerciseInfo = {
  /** e.g. "foundations/greeting" */
  id: string
  /** Absolute path of content/<module>/exercises/<exercise> */
  dir: string
  /** Relative path of each starter file, e.g. "App.tsx" */
  files: string[]
  tests: string[]
}

const MODULE_ENTRIES = new Set(['module.json', 'capstone.md', 'exercises'])
const EXERCISE_ENTRIES = new Set(['meta.json', 'starter', 'solution', 'tests', 'explanation.md'])
const SOURCE_FILE = /\.(tsx?|css|json)$/
// Both fail in Sandpack's runner (see e2e/sandpack-check.spec.ts), so tests
// using them would pass validation and then fail for the learner.
const UNSUPPORTED_IN_SANDPACK = ['@testing-library/user-event', 'msw']

const isDir = (p: string) => existsSync(p) && statSync(p).isDirectory()
const list = (dir: string) => readdirSync(dir).filter((name) => !name.startsWith('.')).sort()

function listFiles(dir: string, base = dir): string[] {
  return list(dir).flatMap((name) => {
    const full = path.join(dir, name)
    return isDir(full) ? listFiles(full, base) : [path.relative(base, full)]
  })
}

function readJson(file: string, problems: Problem[]): unknown {
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch (error) {
    problems.push({ file, message: `invalid JSON: ${(error as Error).message}` })
    return undefined
  }
}

/**
 * Checks content/ against the format in CONTRIBUTING.md. Everything here is
 * static; scripts/validate-content.ts then type-checks and runs the tests.
 */
export function checkContent(contentDir: string, only: string[] = []): { problems: Problem[]; exercises: ExerciseInfo[] } {
  const problems: Problem[] = []
  const exercises: ExerciseInfo[] = []
  const report = (file: string, message: string) => problems.push({ file, message })

  if (!isDir(contentDir)) {
    report(contentDir, 'content directory not found')
    return { problems, exercises }
  }

  const moduleDirs = list(contentDir).filter((name) => isDir(path.join(contentDir, name)))
  const modules = new Map<string, number>()
  for (const name of moduleDirs) {
    const parsed = parseOrderedName(name)
    if (parsed) modules.set(parsed.slug, parsed.order)
  }

  for (const moduleDir of moduleDirs) {
    if (only.length > 0 && !only.includes(moduleDir)) continue
    const dir = path.join(contentDir, moduleDir)
    const name = parseOrderedName(moduleDir)
    if (!name) {
      report(dir, 'module folders are named NN-slug, e.g. 03-hooks')
      continue
    }

    // module.json
    const metaFile = path.join(dir, 'module.json')
    if (!existsSync(metaFile)) {
      report(metaFile, 'missing')
    } else {
      const raw = readJson(metaFile, problems)
      if (raw !== undefined) {
        const meta = parseModuleMeta(raw)
        meta.errors.forEach((message) => report(metaFile, message))
        if (meta.value) {
          if (meta.value.order !== name.order) report(metaFile, `"order" is ${meta.value.order} but the folder says ${name.order}`)
          for (const slug of meta.value.prerequisites) {
            const order = modules.get(slug)
            if (order === undefined) report(metaFile, `unknown prerequisite "${slug}"`)
            else if (order >= name.order) report(metaFile, `prerequisite "${slug}" must come earlier in the course`)
          }
        }
      }
    }

    // Lessons and other top-level entries
    let lessonCount = 0
    const lessonSlugs = new Set<string>()
    for (const entry of list(dir)) {
      const file = path.join(dir, entry)
      if (MODULE_ENTRIES.has(entry)) continue
      if (!entry.endsWith('.mdx')) {
        report(file, 'unexpected file; a module holds module.json, NN-lesson.mdx files, exercises/ and capstone.md')
        continue
      }
      lessonCount++
      const lessonName = parseOrderedName(entry.replace(/\.mdx$/, ''))
      if (!lessonName) report(file, 'lesson files are named NN-slug.mdx')
      else if (lessonSlugs.has(lessonName.slug)) report(file, `duplicate lesson slug "${lessonName.slug}"`)
      else lessonSlugs.add(lessonName.slug)

      const source = readFileSync(file, 'utf8')
      let frontmatter: unknown
      try {
        frontmatter = readFrontmatter(source)
      } catch (error) {
        report(file, `invalid frontmatter: ${(error as Error).message}`)
      }
      parseLessonFrontmatter(frontmatter).errors.forEach((message) => report(file, `frontmatter: ${message}`))
      const body = source.replace(/^---[\s\S]*?\n---/, '')
      if (!body.includes('<Sandbox')) report(file, 'needs a runnable example: wrap a code block in <Sandbox>')
      if (!body.includes('<CommonMistake')) report(file, 'needs a <CommonMistake> box')
      if (/^# /m.test(body.replace(/```[\s\S]*?```/g, ''))) {
        report(file, 'do not use a level-1 heading; the page renders the frontmatter title')
      }
    }
    if (lessonCount === 0) report(dir, 'a module needs at least one lesson')

    const capstone = path.join(dir, 'capstone.md')
    if (!existsSync(capstone) || readFileSync(capstone, 'utf8').trim() === '') report(capstone, 'missing or empty')

    // Exercises
    const exercisesDir = path.join(dir, 'exercises')
    const exerciseDirs = isDir(exercisesDir) ? list(exercisesDir) : []
    if (exerciseDirs.length < MIN_EXERCISES) {
      report(exercisesDir, `a module needs at least ${MIN_EXERCISES} exercises (found ${exerciseDirs.length})`)
    }
    for (const exerciseDir of exerciseDirs) {
      const exDir = path.join(exercisesDir, exerciseDir)
      const exName = parseOrderedName(exerciseDir)
      if (!exName || !isDir(exDir)) {
        report(exDir, 'exercise folders are named NN-slug')
        continue
      }
      const before = problems.length

      for (const entry of list(exDir)) {
        if (!EXERCISE_ENTRIES.has(entry)) report(path.join(exDir, entry), 'unexpected entry in an exercise folder')
      }
      const exMetaFile = path.join(exDir, 'meta.json')
      if (!existsSync(exMetaFile)) report(exMetaFile, 'missing')
      else {
        const raw = readJson(exMetaFile, problems)
        if (raw !== undefined) parseExerciseMeta(raw).errors.forEach((message) => report(exMetaFile, message))
      }
      const explanation = path.join(exDir, 'explanation.md')
      if (!existsSync(explanation) || readFileSync(explanation, 'utf8').trim() === '') report(explanation, 'missing or empty')

      const starterDir = path.join(exDir, 'starter')
      const solutionDir = path.join(exDir, 'solution')
      const testsDir = path.join(exDir, 'tests')
      const starter = isDir(starterDir) ? listFiles(starterDir) : []
      const solution = isDir(solutionDir) ? listFiles(solutionDir) : []
      const tests = isDir(testsDir) ? listFiles(testsDir) : []

      if (!starter.includes('App.tsx')) report(starterDir, 'needs App.tsx (the sandbox entry renders its default export)')
      if (JSON.stringify(starter) !== JSON.stringify(solution)) {
        report(solutionDir, `must contain the same files as starter/ (starter: ${starter.join(', ') || 'none'})`)
      }
      for (const file of [...starter, ...solution, ...tests]) {
        if (!SOURCE_FILE.test(file)) report(path.join(exDir, file), 'only .ts, .tsx, .css and .json files are supported')
      }
      if (tests.length === 0 || !tests.every((file) => /\.test\.tsx?$/.test(file))) {
        report(testsDir, 'needs one or more *.test.tsx files and nothing else')
      }
      for (const file of tests) {
        if (path.dirname(file) !== '.') report(path.join(testsDir, file), 'test files sit directly in tests/')
      }
      for (const file of [...starter.map((f) => path.join(starterDir, f)), ...solution.map((f) => path.join(solutionDir, f)), ...tests.map((f) => path.join(testsDir, f))]) {
        if (!/\.tsx?$/.test(file)) continue
        const source = readFileSync(file, 'utf8')
        for (const name of UNSUPPORTED_IN_SANDPACK) {
          if (new RegExp(`from\\s+["']${name}(/[^"']*)?["']`).test(source)) {
            report(file, `imports ${name}, which doesn't run in the browser sandbox (see CONTRIBUTING.md)`)
          }
        }
      }
      if (!starter.some((file) => readFileSync(path.join(starterDir, file), 'utf8').includes('TODO'))) {
        report(starterDir, 'starter code needs // TODO markers showing what to change')
      }

      if (problems.length === before) {
        exercises.push({ id: `${name.slug}/${exName.slug}`, dir: exDir, files: starter, tests })
      }
    }
  }

  return { problems, exercises }
}
