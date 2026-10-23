import { data, type LoaderFunctionArgs } from 'react-router'
import {
  findExercise,
  findLesson,
  findModule,
  loadCapstone,
  loadExerciseFiles,
  loadExplanation,
  loadLessonBody,
} from '../content/course'

// Loaders return components (compiled MDX) as well as data. That is fine in a
// client-only data router; nothing here is serialized.

export async function moduleLoader({ params }: LoaderFunctionArgs) {
  const module = findModule(params.moduleSlug)
  if (!module) throw data('Module not found', { status: 404 })
  return { module, Capstone: await loadCapstone(module) }
}

export async function lessonLoader({ params }: LoaderFunctionArgs) {
  const lesson = findLesson(params.moduleSlug, params.lessonSlug)
  if (!lesson) throw data('Lesson not found', { status: 404 })
  return { lesson, module: findModule(lesson.moduleSlug)!, Content: await loadLessonBody(lesson) }
}

export async function exerciseLoader({ params }: LoaderFunctionArgs) {
  const exercise = findExercise(params.moduleSlug, params.exerciseSlug)
  if (!exercise) throw data('Exercise not found', { status: 404 })
  const [files, Explanation] = await Promise.all([loadExerciseFiles(exercise), loadExplanation(exercise)])
  return { exercise, module: findModule(exercise.moduleSlug)!, files, Explanation }
}

export type ModuleData = Awaited<ReturnType<typeof moduleLoader>>
export type LessonData = Awaited<ReturnType<typeof lessonLoader>>
export type ExerciseData = Awaited<ReturnType<typeof exerciseLoader>>
