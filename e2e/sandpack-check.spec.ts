import { expect, test, type Page } from '@playwright/test'

// Confirms which libraries run inside Sandpack's in-browser Jest runner.
// See src/checks/SandpackCheck.tsx for the suites.

type Summary = {
  tests: { name: string; status: string; error?: string }[]
  fileErrors: string[]
}

test.describe.configure({ mode: 'parallel' })

async function runCase(page: Page, name: string): Promise<Summary> {
  await page.goto(`/_checks/sandpack?case=${name}`)
  try {
    await page.getByRole('button', { name: 'Run tests' }).click({ timeout: 120_000 })
    const result = page.getByTestId('result')
    await expect(result).toBeVisible({ timeout: 120_000 })
    const summary = JSON.parse((await result.textContent()) ?? '{}') as Summary
    console.log(`[sandpack-check] ${name}: ${JSON.stringify(summary, null, 2)}`)
    return summary
  } finally {
    console.log(`[sandpack-check] ${name} messages: ${await page.getByTestId('events').textContent()}`)
  }
}

test('rtl: React Testing Library, fireEvent and jest-dom', async ({ page }) => {
  const summary = await runCase(page, 'rtl')
  expect(summary.fileErrors).toEqual([])
  const failing = summary.tests.filter((t) => t.status !== 'pass').map((t) => t.name)
  expect(failing).toEqual(['rtl > EXPECTED FAIL: reports a failing assertion'])
  expect(summary.tests).toHaveLength(5)
})

for (const name of ['ts-syntax', 'router', 'query']) {
  test(`${name}: all tests pass`, async ({ page }) => {
    const summary = await runCase(page, name)
    expect(summary.fileErrors).toEqual([])
    expect(summary.tests.length).toBeGreaterThan(0)
    expect(summary.tests.filter((t) => t.status !== 'pass')).toEqual([])
  })
}

// Known incompatibility, found by this check on 2026-10-24: MSW 2 and 3 ship
// ES private methods (#method), which Sandpack's Babel setup can't compile,
// so MSW exercises use the local Vitest fallback from BRIEF.md instead. If
// this starts failing, Sandpack has caught up: revisit that decision.
for (const name of ['msw', 'msw-v2']) {
  test(`${name}: does not load in Sandpack (known incompatibility)`, async ({ page }) => {
    const summary = await runCase(page, name)
    expect(summary.fileErrors.join('\n')).toMatch(/Class private methods are not enabled/)
  })
}

// Known incompatibility, found by this check on 2026-10-24: user-event 14
// fails with jsdom's "not of type 'Element'" error in Sandpack's runner, so
// exercise tests use fireEvent. If this starts failing, user-event works.
test('user-event: fails in Sandpack (known incompatibility)', async ({ page }) => {
  const summary = await runCase(page, 'user-event')
  expect(summary.tests.length).toBeGreaterThan(0)
  for (const t of summary.tests) {
    expect(t.status).toBe('fail')
    expect(t.error).toMatch(/not of type 'Element'/)
  }
})

test('preview: renders the app in the preview iframe', async ({ page }) => {
  await page.goto('/_checks/sandpack?case=preview')
  await expect(
    page.frameLocator('iframe').first().getByRole('heading', { name: 'Hello from the preview' }),
  ).toBeVisible({ timeout: 200_000 })
})
