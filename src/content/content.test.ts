import { buildCourse, courseItems } from './build-course'
import { course, findExercise, loadCapstone, loadExerciseFiles, loadExplanation, loadLessonBody } from './course'
import { parseExerciseMeta, parseLessonFrontmatter, parseModuleMeta, parseOrderedName } from './schema'

describe('schema', () => {
  test('parses ordered folder names', () => {
    expect(parseOrderedName('03-hooks')).toEqual({ order: 3, slug: 'hooks' })
    expect(parseOrderedName('12-modern-react')).toEqual({ order: 12, slug: 'modern-react' })
    expect(parseOrderedName('3-hooks')).toBeNull()
    expect(parseOrderedName('03-Hooks')).toBeNull()
  })

  test('accepts valid metadata and explains what is wrong with invalid metadata', () => {
    expect(parseModuleMeta({ title: 'T', summary: 'S', order: 1, prerequisites: [] }).errors).toEqual([])
    expect(parseModuleMeta({ title: '', order: '1' }).errors).toEqual([
      '"title" must be a non-empty string',
      '"summary" must be a non-empty string',
      '"order" must be an integer',
      '"prerequisites" must be an array of module slugs',
    ])

    const docs = [{ title: 'react.dev', url: 'https://react.dev/learn' }]
    expect(parseLessonFrontmatter({ title: 'T', minutes: 5, docs }).errors).toEqual([])
    expect(parseLessonFrontmatter({ title: 'T', minutes: 5, docs: [{ title: 'x', url: 'http://x' }] }).errors).toHaveLength(1)
    expect(parseLessonFrontmatter(null).errors).toEqual(['frontmatter is missing'])

    const exercise = { title: 'T', difficulty: 'easy', hints: ['a'], task: 'Do it' }
    expect(parseExerciseMeta(exercise).errors).toEqual([])
    expect(parseExerciseMeta({ ...exercise, hints: ['a', 'b', 'c', 'd'] }).errors).toHaveLength(1)
    expect(parseExerciseMeta({ ...exercise, difficulty: 'expert' }).errors).toHaveLength(1)
    expect(parseExerciseMeta({ ...exercise, dependencies: ['react-router'] }).errors).toEqual([])
    expect(parseExerciseMeta({ ...exercise, dependencies: ['left-pad'] }).errors).toHaveLength(1)
    expect(parseExerciseMeta({ ...exercise, extra: true }).errors).toEqual(['unknown field "extra"'])
  })
})

describe('buildCourse', () => {
  const meta = (order: number) => ({ title: `M${order}`, summary: 's', order, prerequisites: [] })
  const lesson = { title: 'L', minutes: 5, docs: [] }
  const exercise = { title: 'E', difficulty: 'easy' as const, hints: ['h'], task: 't' }

  test('orders modules, lessons and exercises by their number prefix and strips it from ids', () => {
    const modules = buildCourse({
      modules: { '/content/02-state/module.json': meta(2), '/content/01-foundations/module.json': meta(1) },
      lessons: {
        '/content/01-foundations/02-jsx.mdx': { ...lesson, title: 'JSX' },
        '/content/01-foundations/01-components.mdx': { ...lesson, title: 'Components' },
      },
      exercises: { '/content/01-foundations/exercises/01-badge/meta.json': exercise },
    })
    expect(modules.map((module) => module.slug)).toEqual(['foundations', 'state'])
    expect(modules[0].lessons.map((l) => [l.id, l.title, l.path])).toEqual([
      ['foundations/components', 'Components', '/modules/foundations/lessons/components'],
      ['foundations/jsx', 'JSX', '/modules/foundations/lessons/jsx'],
    ])
    expect(modules[0].exercises[0]).toMatchObject({
      id: 'foundations/badge',
      dir: '/content/01-foundations/exercises/01-badge',
      path: '/modules/foundations/exercises/badge',
    })
    expect(courseItems(modules).map((item) => item.id)).toEqual([
      'foundations/components',
      'foundations/jsx',
      'foundations/badge',
    ])
  })
})

describe('the real course content', () => {
  test('Module 1 is loaded through the Vite glob imports', () => {
    const foundations = course.find((module) => module.slug === 'foundations')
    expect(foundations).toBeDefined()
    expect(foundations!.lessons.length).toBeGreaterThanOrEqual(1)
    expect(foundations!.exercises.length).toBeGreaterThanOrEqual(4)
    for (const lesson of foundations!.lessons) {
      expect(lesson.title).toBeTruthy()
      expect(lesson.docs.length).toBeGreaterThan(0)
    }
  })

  test('lesson bodies, explanations and capstone steps compile to components', async () => {
    const foundations = course[0]
    for (const lesson of foundations.lessons) {
      expect(typeof (await loadLessonBody(lesson))).toBe('function')
    }
    expect(typeof (await loadCapstone(foundations))).toBe('function')
    for (const exercise of foundations.exercises) {
      expect(typeof (await loadExplanation(exercise))).toBe('function')
    }
  })

  test('exercise sources load as raw text keyed by sandbox path', async () => {
    const exercise = findExercise('foundations', course[0].exercises[0].slug)!
    const files = await loadExerciseFiles(exercise)
    expect(Object.keys(files.starter)).toContain('/App.tsx')
    expect(Object.keys(files.solution)).toEqual(Object.keys(files.starter))
    expect(Object.keys(files.tests).every((path) => path.endsWith('.test.tsx'))).toBe(true)
    expect(files.starter['/App.tsx']).toContain('TODO')
  })
})
