import { parse } from 'yaml'

/** Returns the parsed YAML block at the top of an MDX file, or null if there is none. */
export function readFrontmatter(source: string): unknown {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(source)
  return match ? (parse(match[1]) as unknown) : null
}
