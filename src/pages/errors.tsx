import { isRouteErrorResponse, Link, useRouteError } from 'react-router'

export function NotFound() {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p>
        <Link to="/" className="text-indigo-700 underline">
          Back to the course map
        </Link>
      </p>
    </div>
  )
}

/** Route error boundary: https://reactrouter.com/how-to/error-boundary */
export function RouteError() {
  const error = useRouteError()
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFound />
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-3 p-8">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <pre className="overflow-x-auto rounded bg-slate-100 p-3 text-sm">
        {error instanceof Error ? error.message : String(isRouteErrorResponse(error) ? error.statusText : error)}
      </pre>
      <Link to="/" className="text-indigo-700 underline">
        Back to the course map
      </Link>
    </div>
  )
}
