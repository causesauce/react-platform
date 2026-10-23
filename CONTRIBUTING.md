# Contributing a module

This guide is for anyone writing course content, including the cloud sessions that write modules 2–12. Read [BRIEF.md](BRIEF.md) first; its **Quality rules** apply to every module. `content/01-foundations/` is the reference module. When this guide and Module 1 disagree, copy Module 1 and point out the difference in your PR.

A module is a folder of plain files under `content/`. Writing one never requires touching platform code (`src/`, `scripts/`, `package.json`). If you think it does, stop and say so in the PR instead. See [When the format isn't enough](#when-the-format-isnt-enough).

## Quick start

```sh
npm ci                                   # Node 22.22+ (CI uses Node 24)
npm run dev                              # http://localhost:5173
npm run validate -- 03-hooks             # check one module; omit the name to check all
npm test                                 # platform unit tests (they also load all content)
```

The editor, preview and **Run tests** button use Sandpack's hosted bundler, so they need internet access to `*.codesandbox.io`. Everything else, including `npm run validate`, works offline.

## Folder layout

```
content/
  03-hooks/
    module.json            # title, summary, order, prerequisites
    01-use-effect.mdx      # lesson
    02-use-ref.mdx
    exercises/
      01-fetch-on-mount/
        meta.json          # title, difficulty, task, hints[], dependencies?
        starter/App.tsx    # what the learner edits
        solution/App.tsx   # reference solution
        tests/App.test.tsx # hidden tests
        explanation.md     # why the solution is written this way
    capstone.md            # this module's step in the capstone app
```

**Names.** Module, lesson and exercise names are `NN-slug`: two digits, a dash, then lowercase words joined by dashes. The number sets the order. The slug becomes the URL (`/modules/hooks/lessons/use-effect`) and the learner's progress key (`hooks/use-effect`). You can renumber freely, but don't rename a slug once a module has shipped, because learners would lose their progress on it. Nothing else may sit in a module folder; the validator rejects unexpected files.

## module.json

```json
{
  "title": "Hooks in depth",
  "summary": "One or two sentences shown on the course map.",
  "order": 3,
  "prerequisites": ["state"]
}
```

`order` must match the folder number. `prerequisites` lists module **slugs** (not folder names) that come earlier in the course.

## Lessons (`NN-slug.mdx`)

One concept per lesson, 5–10 minutes of reading. Each lesson has:

1. **Frontmatter**:

   ```yaml
   ---
   title: Synchronising with effects
   minutes: 8
   docs:
     - title: "react.dev: Synchronizing with Effects"
       url: https://react.dev/learn/synchronizing-with-effects
   ---
   ```

   `docs` lists the official pages the lesson is grounded in, at least one, as `https` URLs. They appear under the lesson as "Read more in the docs". Link the pages you actually read.

2. **No level-1 heading.** The page renders `title` as the `<h1>`; start your sections at `##`.

3. **A runnable example** in `<Sandbox>`. Each fenced code block inside becomes a file. The fence's meta text is the file name. An unnamed first block is `App.tsx`, which must `export default` the component to show:

   ````mdx
   <Sandbox>

   ```tsx App.tsx
   import { Counter } from "./Counter";
   export default function App() {
     return <Counter />;
   }
   ```

   ```tsx Counter.tsx
   export function Counter() { /* … */ }
   ```

   </Sandbox>
   ````

   Put `<Sandbox>` and `</Sandbox>` on their own lines; MDX only parses blocks such as code fences between tags written that way ([MDX: interleaving](https://mdxjs.com/docs/what-is-mdx/#interleaving)). For packages other than React, pass `<Sandbox dependencies={["react-router"]}>` with names from the allow-list below.

4. **A "common mistake" box**: `<CommonMistake title="…">…</CommonMistake>`. The title defaults to "Common mistake". Use it for the error people actually make, and show the wrong code next to the fix.

5. **A recap**: a short `## Recap` list at the end.

`Sandbox` and `CommonMistake` are available in every `.mdx` and `.md` file without an import. Links starting with `/` navigate inside the app; others open in a new tab.

**MDX pitfalls.** In MDX prose, `{` starts a JavaScript expression and `<` starts a JSX tag. A bare `{count}` compiles and then fails at runtime; a bare `<div>` fails to compile. Write code in backticks (`` `{count}` ``, `` `<div>` ``), never as bare text. Code fences are safe.

**Flag doubt.** If you aren't sure something is right, write it as a note rather than a confident statement:

```md
> Verify: React 19.3 may batch this differently; check against the installed version.
```

## Exercises

Each exercise is a small app the learner finishes. Its hidden tests check what the page shows and how it responds, never how the code is written.

### meta.json

```json
{
  "title": "Fetch on mount",
  "difficulty": "medium",
  "task": "One to three sentences shown above the editor. `Backticks` render as code.",
  "hints": [
    "A nudge: which concept applies.",
    "A pointer: which API or line to change.",
    "Nearly the answer: the shape of the code."
  ],
  "dependencies": ["@tanstack/react-query"]
}
```

- `difficulty`: `easy`, `medium` or `hard`.
- `hints`: one to three, **graded** from gentle to almost-the-answer. The learner sees them one at a time; the solution unlocks after the last hint or a passing run.
- `dependencies` (optional): extra packages, chosen from the allow-list below.

### starter/ and solution/

- Both folders contain **the same files**. `App.tsx` is required and must `export default` the root component, because the sandbox entry renders it. Export any component the tests render directly as a named export (`export function OrderSummary`).
- The starter **compiles** (strict TypeScript) and **fails** at least one test by assertion, not by crashing on a missing export.
- The starter marks each change with a `// TODO` comment that says *what* to do, not *how*.
- Write the solution the way you'd want it reviewed: it's shown to the learner with the explanation.
- Allowed file types: `.tsx`, `.ts`, `.css`, `.json`.

### tests/

3–6 tests in `*.test.tsx` files directly inside `tests/`. They run in two places: Vitest + jsdom during validation, and Sandpack's in-browser Jest runner in the app. So:

- Use the Jest-style globals `describe`, `test`/`it` and `expect` **without importing them**, and import everything else explicitly:

  ```tsx
  import { render, screen, within } from "@testing-library/react";
  import userEvent from "@testing-library/user-event";
  import "@testing-library/jest-dom";
  import App, { OrderSummary } from "./App";
  ```

- **Don't use `vi.*` or `jest.*`** (mocks, spies, fake timers). Each exists in only one of the two runners. Pass plain functions as props instead of mocks. To check console output, swap `console.error` by hand and restore it in `finally`, as Module 1's reading-list test does.
- Query the way a user finds things: `getByRole` with a `name`, `getByLabelText`, `getByText`. Avoid `container.querySelector`, test IDs and class names.
- Test behaviour that any reasonable solution shares. Render the component with **different data** from `App`'s, so a hard-coded answer fails.
- Use `findBy…` (or `await user.…`) for anything asynchronous, never fixed sleeps.

### explanation.md

A few short paragraphs on why the solution is written the way it is: the decision points, the alternative that looks right but isn't, and what the tests are really checking. It's plain Markdown (MDX), shown below the solution.

### Packages exercises may use

Every sandbox gets `react`, `react-dom`, `@testing-library/react`, `@testing-library/dom`, `@testing-library/user-event` and `@testing-library/jest-dom`. An exercise may add any of these through `meta.json` `dependencies`:

`react-router`, `@tanstack/react-query`, `msw`, `react-hook-form`, `zod`, `@hookform/resolvers`, `zustand`, `@reduxjs/toolkit`, `react-redux`

Each is pinned to an exact version in `package.json`, so the browser sandbox downloads the same version that validation runs locally. The list lives in `src/content/schema.ts`.

> Verify: CI's `sandpack` job reports which of these actually work in Sandpack's runner (`/_checks/sandpack`). Until it has run green, treat React Router, TanStack Query and MSW exercises as unconfirmed. If one doesn't work there, the brief's fallback applies: those exercises run as local Vitest projects in an `exercises/` folder. Raise it in your PR rather than inventing a workaround.

**TypeScript syntax.** Sandpack compiles the sandbox with an older Babel-based toolchain (the `react-ts` template uses `react-scripts` 4). Until CI confirms newer syntax, avoid `satisfies`, inline type modifiers (`import { type X }`; use a separate `import type { X }`), decorators and `using`.

## capstone.md

This module's step of the project-tracker capstone. Follow Module 1's structure:

- `## Step N: <what this step adds>` with a one-paragraph intro
- `### What to build`: the visible result
- `### Requirements`: the constraints that make it practise this module's topics
- `### Done when`: checks the learner can run themselves
- A closing line pointing to the reference: the `capstone/` folder at tag `capstone-mNN`

Session 6 builds the reference capstone. Describe the step so someone could build it from your text alone.

## Validation

`npm run validate` must pass before you open a PR. CI runs it on every pull request. It checks:

1. **Format.** Folder and file names, required files, `module.json`, lesson frontmatter (`title`, `minutes`, `docs`), the `<Sandbox>` and `<CommonMistake>` in every lesson, no `#` headings, `meta.json` fields, at least 3 exercises per module, identical starter and solution file lists, `// TODO` markers.
2. **Types.** Every starter and solution compiles together with its tests under strict TypeScript.
3. **Behaviour.** The tests run against `starter/` and must fail, then against `solution/` and must all pass, and there must be 3–6 of them.

Problems are reported against the file to fix. `--verbose` adds Vitest's full report.

CI's `sandpack` job then runs every exercise in the real in-browser runner, solution and starter, to catch anything that behaves differently there than in jsdom.

## Pull requests

- One module per PR, on a branch named after the session's modules (for example `modules-2-4`).
- Touch only `content/`.
- Describe what you wrote and list anything you're unsure about, including every `> Verify:` note.
- Original content only. Ground lessons in react.dev and the official library docs, and never reproduce text, exercises or project ideas from paid courses.

## When the format isn't enough

Some topics won't fit: Server Components and Next.js in module 12, a package that isn't on the allow-list, a new kind of lesson widget. Don't change `src/`, `scripts/` or `package.json` from a content PR, because parallel sessions would conflict. Write the module as far as the format allows, and describe in the PR what the platform would need. The platform change can then land once, in its own PR.
