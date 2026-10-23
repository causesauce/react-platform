import mdx from '@mdx-js/rollup'
import type { Element, Root, RootContent } from 'hast'
import { readFile } from 'node:fs/promises'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import type { Plugin } from 'vite'
import { readFrontmatter } from './frontmatter.ts'

/**
 * Compiles lessons (.mdx) and explanations (.md) to React components.
 * Ids with a query (`?raw`, `?frontmatter`) are left to other plugins.
 */
export function contentMdx(): Plugin {
  const plugin = mdx({
    remarkPlugins: [remarkFrontmatter, remarkGfm],
    rehypePlugins: [rehypeCodeMeta],
  }) as Plugin
  const transform = plugin.transform as (this: unknown, code: string, id: string) => unknown
  return {
    ...plugin,
    enforce: 'pre',
    transform(code, id) {
      if (id.includes('?')) return null
      return transform.call(this, code, id) as ReturnType<Extract<Plugin['transform'], Function>>
    },
  }
}

/**
 * `import fm from './lesson.mdx?frontmatter'` yields just the parsed
 * frontmatter, so the course map can list lessons without bundling them.
 */
export function lessonFrontmatter(): Plugin {
  return {
    name: 'lesson-frontmatter',
    enforce: 'pre',
    async load(id) {
      const [path, query] = id.split('?')
      if (query !== 'frontmatter') return null
      this.addWatchFile(path)
      const source = await readFile(path, 'utf8')
      return `export default ${JSON.stringify(readFrontmatter(source) ?? null)}`
    },
  }
}

/**
 * Keeps a code fence's meta string (the "Button.tsx" in ```tsx Button.tsx) as
 * a data-meta attribute, so <Sandbox> can use it as the file name.
 */
function rehypeCodeMeta() {
  const visit = (node: Root | RootContent) => {
    if (node.type === 'element' && node.tagName === 'code') {
      const meta = (node.data as { meta?: string } | undefined)?.meta
      if (meta) (node as Element).properties.dataMeta = meta
    }
    if ('children' in node) node.children.forEach(visit)
  }
  return (tree: Root) => visit(tree)
}
