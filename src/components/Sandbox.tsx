import { lazy, Suspense, type ReactNode } from 'react'
import { filesFromChildren } from './sandbox-files'

const SandboxEditor = lazy(() => import('./SandboxEditor'))

type SandboxProps = {
  children: ReactNode
  /** Extra packages from the exercise allow-list, e.g. ["react-router"]. */
  dependencies?: string[]
}

/** A runnable, editable example inside a lesson. */
export function Sandbox({ children, dependencies = [] }: SandboxProps) {
  const files = filesFromChildren(children)
  const fallback = (
    <div className="not-prose my-6 flex flex-col gap-2">
      {Object.entries(files).map(([path, code]) => (
        <pre key={path} className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-slate-100">
          {code}
        </pre>
      ))}
    </div>
  )
  return (
    <Suspense fallback={fallback}>
      <SandboxEditor files={files} dependencies={dependencies} />
    </Suspense>
  )
}

export function CommonMistake({ title = 'Common mistake', children }: { title?: string; children: ReactNode }) {
  return (
    // Stays inside the surrounding .prose so code blocks and lists keep their styles.
    <aside className="my-6 rounded-lg border-l-4 border-amber-500 bg-amber-50 px-4 py-1" aria-label={title}>
      <p className="font-semibold text-amber-900">⚠️ {title}</p>
      {children}
    </aside>
  )
}

