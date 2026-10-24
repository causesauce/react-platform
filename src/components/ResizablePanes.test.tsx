import { fireEvent, render, screen } from '@testing-library/react'
import { ResizablePanes } from './ResizablePanes'

const KEY = 'test:layout'

function renderPanes() {
  return render(
    <ResizablePanes
      direction="row"
      storageKey={KEY}
      defaults={{ split: 50, height: 400 }}
      first={<p>editor</p>}
      second={<p>preview</p>}
    />,
  )
}

beforeEach(() => window.localStorage.clear())

test('the arrow keys resize the split and the height, within limits', () => {
  renderPanes()
  const split = screen.getByRole('separator', { name: 'Resize editor and preview' })
  const height = screen.getByRole('separator', { name: 'Resize height' })

  fireEvent.keyDown(split, { key: 'ArrowRight' })
  expect(split).toHaveAttribute('aria-valuenow', '55')
  for (let i = 0; i < 20; i++) fireEvent.keyDown(split, { key: 'ArrowLeft' })
  expect(split).toHaveAttribute('aria-valuenow', '20')

  fireEvent.keyDown(height, { key: 'ArrowDown' })
  expect(height).toHaveAttribute('aria-valuenow', '440')
})

test('remembers the sizes', () => {
  const { unmount } = renderPanes()
  fireEvent.keyDown(screen.getByRole('separator', { name: 'Resize height' }), { key: 'ArrowUp' })
  unmount()
  renderPanes()
  expect(screen.getByRole('separator', { name: 'Resize height' })).toHaveAttribute('aria-valuenow', '360')
})
