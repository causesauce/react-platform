import { expect, test } from '@playwright/test'

// Walks the main pages of the built app. Needs no network beyond the local
// preview server, so it also runs in offline sandboxes; the editor area of
// exercise pages is covered by sandpack-exercises.spec.ts.

test('course map leads into the first lesson, and completion survives a reload', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'Course map' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '1. Foundations' })).toBeVisible()

  await page.getByRole('link', { name: /^Start: / }).click()
  const title = page.getByRole('heading', { level: 1 })
  await expect(title).toHaveText('Components are functions')
  await expect(page.getByRole('link', { name: 'react.dev: Your First Component' })).toHaveAttribute(
    'href',
    'https://react.dev/learn/your-first-component',
  )

  await page.getByRole('button', { name: 'Mark lesson complete' }).click()
  await page.reload()
  await expect(page.getByRole('button', { name: '✓ Completed' })).toBeVisible()

  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Course' }).click()
  await expect(page.getByRole('link', { name: 'Continue where you left off: Components are functions' })).toBeVisible()
  await expect(page.getByText(/^1\/\d+ done$/)).toBeVisible()
})

test('every lesson in Module 1 renders', async ({ page }) => {
  await page.goto('/modules/foundations')
  const lessons = page.getByRole('region', { name: 'Lessons' }).getByRole('link')
  const count = await lessons.count()
  expect(count).toBeGreaterThan(0)
  for (let i = 0; i < count; i++) {
    await page.goto('/modules/foundations')
    const link = page.getByRole('region', { name: 'Lessons' }).getByRole('link').nth(i)
    const name = await link.textContent()
    await link.click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(name ?? '')
    await expect(page.getByText(/^⚠️ /).first()).toBeVisible()
    await expect(page.getByRole('complementary', { name: 'Read more in the docs' })).toBeVisible()
  }
})

test('exercise hints unlock the solution, and the state survives a reload', async ({ page }) => {
  await page.goto('/modules/foundations/exercises/order-summary')
  await expect(page.getByRole('heading', { level: 1, name: 'An order summary that adapts' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Show the solution' })).toHaveCount(0)

  for (const label of ['Show hint 1 of 3', 'Show hint 2 of 3', 'Show hint 3 of 3']) {
    await page.getByRole('button', { name: label }).click()
  }
  await page.getByRole('button', { name: 'Show the solution' }).click()
  await expect(page.getByRole('heading', { name: "Why it's written this way" })).toBeVisible()

  await page.reload()
  await expect(page.getByText('Hint 3:')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Solution', exact: true })).toBeVisible()
})

test('unknown pages and an empty review queue are handled', async ({ page }) => {
  await page.goto('/modules/foundations/lessons/does-not-exist')
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()

  await page.goto('/review')
  await expect(page.getByText('Nothing to review right now.')).toBeVisible()
})

test('the editor and preview can be resized by dragging, and the size is remembered', async ({ page }) => {
  await page.goto('/modules/foundations/exercises/team-cards')
  const split = page.getByRole('separator', { name: 'Resize editor and preview' })
  const height = page.getByRole('separator', { name: 'Resize height' })
  await expect(split).toHaveAttribute('aria-valuenow', '55')

  const box = (await split.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + 100)
  await page.mouse.down()
  await page.mouse.move(box.x - 200, box.y + 100, { steps: 5 })
  await page.mouse.up()
  const narrowed = Number(await split.getAttribute('aria-valuenow'))
  expect(narrowed).toBeLessThan(45)

  await height.scrollIntoViewIfNeeded()
  const handle = (await height.boundingBox())!
  await page.mouse.move(handle.x + handle.width / 2, handle.y + 2)
  await page.mouse.down()
  await page.mouse.move(handle.x + handle.width / 2, handle.y + 150, { steps: 5 })
  await page.mouse.up()
  expect(Number(await height.getAttribute('aria-valuenow'))).toBeGreaterThan(600)

  await page.reload()
  await expect(split).toHaveAttribute('aria-valuenow', String(narrowed))
})
