import type { ComponentProps } from 'react'
import { Link } from 'react-router'

/** In-app links navigate client-side; external ones open in a new tab. */
export function MdxLink({ href = '', ...props }: ComponentProps<'a'>) {
  if (href.startsWith('/')) return <Link to={href} {...props} />
  return <a href={href} target="_blank" rel="noreferrer" {...props} />
}
