import {
  parseOrderedName,
  type ExerciseMeta,
  type LessonFrontmatter,
  type ModuleMeta,
} from './schema'

export type Lesson = LessonFrontmatter & {
  kind: 'lesson'
  /** "foundations/your-first-component": stable across renumbering. */
  id: string
  slug: string
  moduleSlug: string
  /** Glob key of the .mdx file, e.g. "/content/01-foundations/01-x.mdx". */
  file: string
  path: string
}

export type Exercise = {
  kind: 'exercise'
  id: string
  slug: string
  moduleSlug: string
  meta: ExerciseMeta
  /** Glob key prefix, e.g. "/content/01-foundations/exercises/01-x". */
  dir: string
  path: string
}

export type CourseModule = ModuleMeta & {
  slug: string
  dir: string
  path: string
  lessons: Lesson[]
  exercises: Exercise[]
}

export type CourseItem = Lesson | Exercise

export type ContentGlobs = {
  modules: Record<string, ModuleMeta>
  lessons: Record<string, LessonFrontmatter>
  exercises: Record<string, ExerciseMeta>
}

const byName = (a: string, b: string) => a.localeCompare(b)

/** "/content/01-foundations/exercises/02-x/meta.json" -> ["content", "01-foundations", ...] */
const segments = (key: string) => key.split('/').filter(Boolean)

/**
 * Turns the import.meta.glob results into an ordered course. Content is
 * checked by scripts/validate-content.ts in CI, so entries with unexpected
 * names are skipped rather than reported here.
 */
export function buildCourse(globs: ContentGlobs): CourseModule[] {
  const modules: CourseModule[] = []

  for (const key of Object.keys(globs.modules).sort(byName)) {
    const [, moduleDir] = segments(key)
    const name = parseOrderedName(moduleDir)
    if (!name) continue
    const dir = `/content/${moduleDir}`
    const path = `/modules/${name.slug}`

    const lessons = Object.keys(globs.lessons)
      .filter((file) => file.startsWith(`${dir}/`) && segments(file).length === 3)
      .sort(byName)
      .flatMap((file): Lesson[] => {
        const lessonName = parseOrderedName(segments(file)[2].replace(/\.mdx$/, ''))
        if (!lessonName) return []
        return [
          {
            ...globs.lessons[file],
            kind: 'lesson',
            id: `${name.slug}/${lessonName.slug}`,
            slug: lessonName.slug,
            moduleSlug: name.slug,
            file,
            path: `${path}/lessons/${lessonName.slug}`,
          },
        ]
      })

    const exercises = Object.keys(globs.exercises)
      .filter((file) => file.startsWith(`${dir}/exercises/`))
      .sort(byName)
      .flatMap((file): Exercise[] => {
        const exerciseDir = segments(file)[3]
        const exerciseName = parseOrderedName(exerciseDir)
        if (!exerciseName) return []
        return [
          {
            kind: 'exercise',
            id: `${name.slug}/${exerciseName.slug}`,
            slug: exerciseName.slug,
            moduleSlug: name.slug,
            meta: globs.exercises[file],
            dir: `${dir}/exercises/${exerciseDir}`,
            path: `${path}/exercises/${exerciseName.slug}`,
          },
        ]
      })

    modules.push({ ...globs.modules[key], slug: name.slug, dir, path, lessons, exercises })
  }

  return modules.sort((a, b) => a.order - b.order)
}

/** Every lesson and exercise in course order: a module's lessons, then its exercises. */
export function courseItems(modules: CourseModule[]): CourseItem[] {
  return modules.flatMap((module) => [...module.lessons, ...module.exercises])
}
