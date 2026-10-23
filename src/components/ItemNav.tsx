import { Link } from 'react-router'
import { neighbours } from '../content/course'
import { itemTitle } from '../progress/selectors'

/** Previous / next links following course order. */
export function ItemNav({ id }: { id: string }) {
  const { previous, next } = neighbours(id)
  return (
    <nav aria-label="Lesson navigation" className="mt-10 flex justify-between gap-4 border-t border-slate-200 pt-6">
      {previous ? (
        <Link to={previous.path} className="text-indigo-700 hover:underline">
          ← {itemTitle(previous)}
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link to={next.path} className="text-right text-indigo-700 hover:underline">
          {itemTitle(next)} →
        </Link>
      ) : (
        <Link to="/" className="text-indigo-700 hover:underline">
          Back to the course map →
        </Link>
      )}
    </nav>
  )
}
