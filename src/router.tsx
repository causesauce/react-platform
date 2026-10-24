import { createBrowserRouter, type RouteObject } from 'react-router'
import { Layout } from './components/Layout'
import { CourseMap } from './pages/CourseMap'
import { NotFound, RouteError } from './pages/errors'
import { ExercisePage } from './pages/ExercisePage'
import { LessonPage } from './pages/LessonPage'
import { ModulePage } from './pages/ModulePage'
import { ReviewPage } from './pages/ReviewPage'
import { exerciseLoader, lessonLoader, moduleLoader } from './routes/loaders'

// Data mode: https://reactrouter.com/start/data/routing
export const routes: RouteObject[] = [
  {
    path: '/',
    Component: Layout,
    ErrorBoundary: RouteError,
    children: [
      {
        ErrorBoundary: RouteError,
        children: [
          { index: true, Component: CourseMap },
          { path: 'review', Component: ReviewPage },
          { path: 'modules/:moduleSlug', loader: moduleLoader, Component: ModulePage },
          { path: 'modules/:moduleSlug/lessons/:lessonSlug', loader: lessonLoader, Component: LessonPage },
          { path: 'modules/:moduleSlug/exercises/:exerciseSlug', loader: exerciseLoader, Component: ExercisePage },
          {
            // Diagnostic page used by the "sandpack" Playwright project in CI.
            path: '_checks/sandpack',
            lazy: async () => ({ Component: (await import('./checks/SandpackCheck')).SandpackCheck }),
          },
          { path: '*', Component: NotFound },
        ],
      },
    ],
  },
]

export function createRouter() {
  return createBrowserRouter(routes, { basename: import.meta.env.BASE_URL })
}
