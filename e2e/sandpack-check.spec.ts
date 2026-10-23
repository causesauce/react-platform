import { expect, test } from '@playwright/test'

// Confirms which libraries run inside Sandpack's in-browser Jest runner.
// See src/checks/SandpackCheck.tsx for the suites.

type Summary = {
  tests: { name: string; status: string; error?: string }[]
  fileErrors: { path: string; error: string }[]
}

test.describe.configure({ mode: 'parallel' })

async function runCase(page: import('@playwright/test').Page, name: string) {
  await page.goto(`/?case=${name}`)
  const result = page.getByTestId('result')
  await expect(result).toBeVisible({ timeout: 200_000 })
  const summary = JSON.parse((await result.textContent()) ?? '{}') as Summary
  console.log(`[sandpack-check] ${name}: ${JSON.stringify(summary, null, 2)}`)
  return summary
}

test('rtl: React Testing Library, user-event and jest-dom', async ({ page }) => {
  const summary = await runCase(page, 'rtl')
  expect(summary.fileErrors).toEqual([])
  const failing = summary.tests.filter((t) => t.status !== 'pass').map((t) => t.name)
  expect(failing).toEqual(['rtl > EXPECTED FAIL: reports a failing assertion'])
  expect(summary.tests).toHaveLength(5)
})

for (const name of ['rtl-minimal', 'ts-syntax', 'router', 'query', 'msw', 'msw-v2']) {
  test(`${name}: all tests pass`, async ({ page }) => {
    const summary = await runCase(page, name)
    expect(summary.fileErrors).toEqual([])
    expect(summary.tests.length).toBeGreaterThan(0)
    expect(summary.tests.filter((t) => t.status !== 'pass')).toEqual([])
  })
}

test('preview: renders the app in the preview iframe', async ({ page }) => {
  await page.goto('/?case=preview')
  await expect(
    page.frameLocator('iframe').first().getByRole('heading', { name: 'Hello from the preview' }),
  ).toBeVisible({ timeout: 200_000 })
})
