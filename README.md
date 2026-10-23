# React Learning Platform

A personal course that goes from first components to production patterns, with short lessons, in-browser exercises checked by tests, and a project-tracker capstone. See [BRIEF.md](BRIEF.md) for the plan and [CONTRIBUTING.md](CONTRIBUTING.md) for the content format.

It's a static front end with no backend. Content lives in `content/`, and progress lives in the browser's `localStorage`.

## Run it

```sh
npm ci          # Node 22.22 or newer
npm run dev     # http://localhost:5173
```

Exercises and lesson examples run in [Sandpack](https://sandpack.codesandbox.io/), which loads its bundler from `*.codesandbox.io`, so the editor, preview and tests need internet access.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check and build to `dist/` |
| `npm run lint` | oxlint |
| `npm run typecheck` | `tsc -b` for the app, scripts and tests |
| `npm test` | Vitest unit tests: progress store, content loading, pages |
| `npm run validate` | Content checks: format, types, and every exercise's tests must fail on `starter/` and pass on `solution/` |
| `npm run test:e2e` | Playwright smoke test of the built app (no network needed) |
| `npm run test:sandpack` | Playwright: runs every exercise, and a library compatibility check, in Sandpack's real runner (needs network) |

Playwright uses its own Chromium (`npx playwright install chromium`). To use a browser that's already installed, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/path/to/chrome`.

## How it fits together

```
content/                 course content: one folder per module (see CONTRIBUTING.md)
scripts/
  validate-content.ts    npm run validate
  content-check.ts       static format checks used by the validator
  vite-plugins.ts        MDX compilation and the ?frontmatter import for lesson metadata
src/
  content/               schema shared with the validator; builds the course from import.meta.glob
  progress/              progress state: pure logic, storage adapter, store and React hooks
  exercise/              Sandpack workspace, test runner panel, sandbox file/dependency helpers
  components/            layout, lesson MDX components (<Sandbox>, <CommonMistake>)
  pages/                 course map, module, lesson, exercise and review pages
  checks/                /_checks/sandpack: which testing libraries work in Sandpack's runner
e2e/                     Playwright: smoke (offline) and sandpack (online) projects
```

**Progress** is a small external store (`src/progress/store.ts`) read through `useSyncExternalStore`. It persists through a three-method `ProgressStorage` interface (`src/progress/storage.ts`), so a backend can replace `localStorage` later without UI changes. The rules for the review queue are pure functions in `src/progress/logic.ts`. An exercise that needed 3 or more failed runs, or a look at the solution, before it passed comes back for review after 1 day, then 3, then 7, and leaves the queue after three clean reviews.

## Deploying

`npm run build` produces a static site in `dist/`. The app uses browser history routing, so the host must serve `index.html` for unknown paths: a rewrite rule on Vercel or Netlify, or a copied `404.html` on GitHub Pages. If the site isn't served from the domain root, set Vite's `base` option. The router reads it from `import.meta.env.BASE_URL`.
