import type { MDXComponents } from 'mdx/types'
import { MdxLink } from './MdxLink'
import { CommonMistake, Sandbox } from './Sandbox'

/** Components every lesson, explanation and capstone file can use without importing. */
export const mdxComponents: MDXComponents = {
  a: MdxLink,
  Sandbox,
  CommonMistake,
}
