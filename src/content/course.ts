import type { MDXContent, MDXModule } from 'mdx/types'
import { buildCourse, courseItems, type CourseModule, type Exercise, type Lesson } from './build-course'
import type { ExerciseMeta, LessonFrontmatter, ModuleMeta } from './schema'

// Metadata is bundled eagerly (it is small); lesson bodies, exercise sources
// and explanations load on demand. See https://vite.dev/guide/features#glob-import
const moduleMetas = import.meta.glob<ModuleMeta>('/content/*/module.json', { eager: true, import: 'default' })
const lessonFrontmatter = import.meta.glob<LessonFrontmatter>('/content/*/*.mdx', {
  eager: true,
  import: 'default',
  query: '?frontmatter',
})
const exerciseMetas = import.meta.glob<ExerciseMeta>('/content/*/exercises/*/meta.json', {
  eager: true,
  import: 'default',
})

const lessonBodies = import.meta.glob<MDXModule>('/content/*/*.mdx')
const capstones = import.meta.glob<MDXModule>('/content/*/capstone.md')
const explanations = import.meta.glob<MDXModule>('/content/*/exercises/*/explanation.md')
const exerciseSources = import.meta.glob<string>(
  ['/content/*/exercises/*/starter/**/*', '/content/*/exercises/*/solution/**/*', '/content/*/exercises/*/tests/**/*'],
  { query: '?raw', import: 'default' },
)

export const course: CourseModule[] = buildCourse({
  modules: moduleMetas,
  lessons: lessonFrontmatter,
  exercises: exerciseMetas,
})

export const items = courseItems(course)

export function findModule(slug: string | undefined) {
  return course.find((module) => module.slug === slug)
}

export function findLesson(moduleSlug: string | undefined, lessonSlug: string | undefined) {
  return findModule(moduleSlug)?.lessons.find((lesson) => lesson.slug === lessonSlug)
}

export function findExercise(moduleSlug: string | undefined, exerciseSlug: string | undefined) {
  return findModule(moduleSlug)?.exercises.find((exercise) => exercise.slug === exerciseSlug)
}

export function findExerciseById(id: string) {
  return items.find((item): item is Exercise => item.kind === 'exercise' && item.id === id)
}

export function neighbours(id: string) {
  const index = items.findIndex((item) => item.id === id)
  return { previous: items[index - 1], next: items[index + 1] }
}

export async function loadLessonBody(lesson: Lesson): Promise<MDXContent> {
  const mod = await lessonBodies[lesson.file]()
  return mod.default
}

export async function loadCapstone(module: CourseModule): Promise<MDXContent | null> {
  const load = capstones[`${module.dir}/capstone.md`]
  return load ? (await load()).default : null
}

export async function loadExplanation(exercise: Exercise): Promise<MDXContent | null> {
  const load = explanations[`${exercise.dir}/explanation.md`]
  return load ? (await load()).default : null
}

export type ExerciseFiles = {
  /** Keyed by sandbox path, e.g. "/App.tsx". */
  starter: Record<string, string>
  solution: Record<string, string>
  tests: Record<string, string>
}

export async function loadExerciseFiles(exercise: Exercise): Promise<ExerciseFiles> {
  const files: ExerciseFiles = { starter: {}, solution: {}, tests: {} }
  await Promise.all(
    Object.entries(exerciseSources)
      .filter(([key]) => key.startsWith(`${exercise.dir}/`))
      .map(async ([key, load]) => {
        const [variant, ...rest] = key.slice(exercise.dir.length + 1).split('/')
        files[variant as keyof ExerciseFiles][`/${rest.join('/')}`] = await load()
      }),
  )
  return files
}
