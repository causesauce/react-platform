import { expect, test, type Page } from '@playwright/test'
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

// Runs every exercise's hidden tests in the real in-browser runner: the
// starter must fail and the solution must pass, exactly as
// `npm run validate` checks with Vitest. Needs internet access to Sandpack's
// hosted bundler (*.codesandbox.io).

const contentDir = path.resolve(import.meta.dirname, '..', 'content')
const DRAFT_PREFIX = 'react-learning-platform:draft:'
const slug = (name: string) => name.replace(/^\d{2}-/, '')

const exercises = readdirSync(contentDir).flatMap((moduleDir) => {
  const exercisesDir = path.join(contentDir, moduleDir, 'exercises')
  let names: string[] = []
  try {
    names = readdirSync(exercisesDir)
  } catch {
    return []
  }
  return names.map((name) => ({
    id: `${slug(moduleDir)}/${slug(name)}`,
    path: `/modules/${slug(moduleDir)}/exercises/${slug(name)}`,
    dir: path.join(exercisesDir, name),
  }))
})

function filesOf(dir: string): Record<string, string> {
  return Object.fromEntries(readdirSync(dir).map((file) => [`/${file}`, readFileSync(path.join(dir, file), 'utf8')]))
}

async function runTests(page: Page) {
  const run = page.getByRole('button', { name: 'Run tests' })
  await expect(run).toBeEnabled({ timeout: 120_000 })
  await run.click()
  const status = page.getByRole('status').filter({ hasText: /tests? passed/ })
  await expect(status).toBeVisible({ timeout: 120_000 })
  return (await status.textContent()) ?? ''
}

test.describe.configure({ mode: 'parallel' })

for (const exercise of exercises) {
  test(`${exercise.id}: solution passes`, async ({ page }) => {
    // Load the reference solution as if the learner had typed it.
    await page.addInitScript(
      ([key, files]) => window.localStorage.setItem(key, files),
      [DRAFT_PREFIX + exercise.id, JSON.stringify(filesOf(path.join(exercise.dir, 'solution')))] as const,
    )
    await page.goto(exercise.path)
    expect(await runTests(page)).toMatch(/^All \d+ tests passed\.$/)
    await expect(page.getByText('✓ Passed')).toBeVisible()
  })

  test(`${exercise.id}: starter fails`, async ({ page }) => {
    await page.goto(exercise.path)
    expect(await runTests(page)).toMatch(/^\d+ of \d+ tests passed\.$/)
    await expect(page.getByRole('list', { name: 'Test results' }).getByText('✗ Fail').first()).toBeVisible()
  })
}
