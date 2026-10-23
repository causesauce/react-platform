import type { CourseItem, CourseModule } from '../content/build-course'
import type { ProgressState } from './logic'

export function isDone(state: ProgressState, item: CourseItem): boolean {
  return item.kind === 'lesson' ? item.id in state.lessons : Boolean(state.exercises[item.id]?.passedAt)
}

export function moduleProgress(state: ProgressState, module: CourseModule) {
  const all = [...module.lessons, ...module.exercises]
  return { done: all.filter((item) => isDone(state, item)).length, total: all.length }
}

export function itemTitle(item: CourseItem): string {
  return item.kind === 'lesson' ? item.title : item.meta.title
}
