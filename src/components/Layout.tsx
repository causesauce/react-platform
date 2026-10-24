import { Link, NavLink, Outlet, ScrollRestoration } from 'react-router'
import { dueReviews } from '../progress/logic'
import { useNow, useProgress } from '../progress/hooks'

const navLink = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-2 text-sm font-medium ${isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`

export function Layout() {
  const progress = useProgress()
  // Read at mount; a reload picks up reviews that fall due while the tab is open.
  const due = dueReviews(progress, useNow()).length

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:p-2">
        Skip to content
      </a>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="font-semibold">
            React Learning Platform
          </Link>
          <nav aria-label="Main" className="flex gap-1">
            <NavLink to="/" end className={navLink}>
              Course
            </NavLink>
            <NavLink to="/review" className={navLink}>
              Review
              {due > 0 && (
                <span className="ml-2 rounded-full bg-amber-500 px-2 py-0.5 text-xs text-white">
                  {due} <span className="sr-only">due</span>
                </span>
              )}
            </NavLink>
          </nav>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
      <ScrollRestoration />
    </div>
  )
}

export function ProgressBar({ done, total, label }: { done: number; total: number; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <progress
        className="h-2 w-40 overflow-hidden rounded-full [&::-moz-progress-bar]:bg-green-600 [&::-webkit-progress-bar]:bg-slate-200 [&::-webkit-progress-value]:bg-green-600"
        value={done}
        max={Math.max(total, 1)}
        aria-label={label}
      />
      <span className="text-sm text-slate-600">
        {done}/{total} done
      </span>
    </div>
  )
}

export function Breadcrumbs({ trail }: { trail: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-sm text-slate-600">
      <ol className="flex flex-wrap gap-1">
        {trail.map((crumb, index) => (
          <li key={crumb.label} className="flex gap-1">
            {index > 0 && <span aria-hidden="true">›</span>}
            {crumb.to ? (
              <Link to={crumb.to} className="hover:underline">
                {crumb.label}
              </Link>
            ) : (
              <span aria-current="page">{crumb.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
