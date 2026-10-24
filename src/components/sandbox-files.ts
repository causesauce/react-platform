import { Children, isValidElement, type ReactNode } from 'react'

type CodeProps = { className?: string; children?: ReactNode; 'data-meta'?: string }

/**
 * Collects the fenced code blocks inside <Sandbox> into sandbox files. The
 * fence's meta names the file (```tsx Button.tsx); an unnamed first block is
 * the entry, /App.tsx.
 */
export function filesFromChildren(children: ReactNode): Record<string, string> {
  const files: Record<string, string> = {}
  Children.toArray(children).forEach((child) => {
    if (!isValidElement<{ children?: ReactNode }>(child)) return
    const code = child.props.children
    if (!isValidElement<CodeProps>(code)) return
    const text = String(code.props.children ?? '')
    const index = Object.keys(files).length
    const name = code.props['data-meta']?.trim() || (index === 0 ? 'App.tsx' : `File${index}.tsx`)
    files[`/${name.replace(/^\//, '')}`] = text
  })
  return files
}
