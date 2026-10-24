import { useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'

type Sizes = { split: number; height: number }

type Props = {
  first: ReactNode
  second: ReactNode
  /** "row": side by side (stacks on narrow screens). "column": stacked. */
  direction: 'row' | 'column'
  /** Sizes are remembered per key in localStorage. */
  storageKey: string
  defaults: Sizes
}

const MIN_SPLIT = 20
const MAX_SPLIT = 80
const MIN_HEIGHT = 200
const MAX_HEIGHT = 1400
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

function loadSizes(key: string, defaults: Sizes): Sizes {
  try {
    const saved = JSON.parse(window.localStorage.getItem(key) ?? 'null') as Partial<Sizes> | null
    return {
      split: clamp(Number(saved?.split ?? defaults.split) || defaults.split, MIN_SPLIT, MAX_SPLIT),
      height: clamp(Number(saved?.height ?? defaults.height) || defaults.height, MIN_HEIGHT, MAX_HEIGHT),
    }
  } catch {
    return defaults
  }
}

function saveSizes(key: string, sizes: Sizes) {
  try {
    window.localStorage.setItem(key, JSON.stringify(sizes))
  } catch {
    // Not persisted; the sizes still apply until the page reloads.
  }
}

/**
 * Two panes with a draggable divider between them and a handle below to
 * change their height. Both handles also work with the arrow keys.
 */
export function ResizablePanes({ first, second, direction, storageKey, defaults }: Props) {
  const [sizes, setSizes] = useState(() => loadSizes(storageKey, defaults))
  const [dragging, setDragging] = useState(false)
  const container = useRef<HTMLDivElement>(null)
  const row = direction === 'row'

  const update = (next: Partial<Sizes>) => {
    setSizes((current) => {
      const sized = {
        split: clamp(next.split ?? current.split, MIN_SPLIT, MAX_SPLIT),
        height: clamp(next.height ?? current.height, MIN_HEIGHT, MAX_HEIGHT),
      }
      saveSizes(storageKey, sized)
      return sized
    })
  }

  // Pointer capture keeps the drag going over the iframes; pointer-events:none
  // on the panes stops them from swallowing it anyway.
  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    setDragging(true)
  }
  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.releasePointerCapture(event.pointerId)
    setDragging(false)
  }

  const dragSplit = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging || !container.current) return
    const rect = container.current.getBoundingClientRect()
    const ratio = row ? (event.clientX - rect.left) / rect.width : (event.clientY - rect.top) / rect.height
    update({ split: ratio * 100 })
  }
  const dragHeight = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging || !container.current) return
    update({ height: event.clientY - container.current.getBoundingClientRect().top })
  }

  const splitKeys = (event: KeyboardEvent) => {
    const step = { ArrowLeft: -5, ArrowUp: -5, ArrowRight: 5, ArrowDown: 5 }[event.key]
    if (step === undefined) return
    event.preventDefault()
    update({ split: sizes.split + step })
  }
  const heightKeys = (event: KeyboardEvent) => {
    const step = { ArrowUp: -40, ArrowDown: 40 }[event.key]
    if (step === undefined) return
    event.preventDefault()
    update({ height: sizes.height + step })
  }

  const paneStyle: CSSProperties = { pointerEvents: dragging ? 'none' : undefined }
  const handle = 'shrink-0 bg-slate-200 hover:bg-indigo-400 focus-visible:bg-indigo-500 focus-visible:outline-none'

  return (
    <div className="w-full">
      <div
        ref={container}
        style={{ '--split': `${sizes.split}%`, height: sizes.height } as CSSProperties}
        className={`flex w-full overflow-hidden rounded-lg border border-slate-200 bg-white ${
          row ? 'flex-col md:flex-row' : 'flex-col'
        }`}
      >
        <div
          style={paneStyle}
          className={`min-h-0 min-w-0 overflow-hidden ${row ? 'h-1/2 md:h-full md:w-(--split)' : 'h-(--split)'}`}
        >
          {first}
        </div>
        <div
          role="separator"
          aria-label={row ? 'Resize editor and preview' : 'Resize editor and preview heights'}
          aria-orientation={row ? 'vertical' : 'horizontal'}
          aria-valuemin={MIN_SPLIT}
          aria-valuemax={MAX_SPLIT}
          aria-valuenow={Math.round(sizes.split)}
          tabIndex={0}
          onPointerDown={startDrag}
          onPointerMove={dragSplit}
          onPointerUp={endDrag}
          onKeyDown={splitKeys}
          className={`${handle} ${row ? 'hidden w-1.5 cursor-col-resize md:block' : 'h-1.5 cursor-row-resize'}`}
        />
        <div style={paneStyle} className="min-h-0 min-w-0 flex-1 overflow-hidden">
          {second}
        </div>
      </div>
      <div
        role="separator"
        aria-label="Resize height"
        aria-orientation="horizontal"
        aria-valuemin={MIN_HEIGHT}
        aria-valuemax={MAX_HEIGHT}
        aria-valuenow={Math.round(sizes.height)}
        tabIndex={0}
        onPointerDown={startDrag}
        onPointerMove={dragHeight}
        onPointerUp={endDrag}
        onKeyDown={heightKeys}
        className={`${handle} mx-auto mt-1 h-1.5 w-16 cursor-row-resize rounded-full`}
      />
    </div>
  )
}
