## Step 1: a static task list

The capstone is a **project tracker**: projects that hold tasks, tasks that collect comments, and a dashboard that sums it all up. Each module adds one step. This first step is the static version, the screen built from hard-coded data with no interactivity. It applies the "Thinking in components" lesson to a real app.

### What to build

A page that shows one project and its tasks:

- A header with the app name, "Project Tracker".
- The project's name and a one-line description.
- A summary line, for example "3 of 7 tasks done". Compute it from the task data; don't store it separately.
- The task list. Each task shows its title, assignee, due date and status (`todo`, `in-progress` or `done`).
- Done tasks look different from open ones, for example struck through or dimmed.
- Overdue tasks that aren't done show an "Overdue" label. Pick a fixed "today" date in your data file so the result doesn't change from day to day.
- An empty state ("No tasks yet") when the project has no tasks. Check it by temporarily emptying the array.

### Requirements

- Keep the data in its own module, for example `src/data.js`, as an array of task objects with `id`, `title`, `assignee`, `due` and `status`.
- Split the UI into at least four components, for example `App`, `ProjectHeader`, `TaskList` and `TaskItem`. Each should do one job you can describe in a sentence.
- Pass data down through props. Use no state and no event handlers yet; module 2 adds them.
- Render the list with `map`, using each task's `id` as its key.
- Use semantic HTML: a `<header>`, a `<main>`, a heading hierarchy, and a list for the tasks.

The app starts in **JavaScript** (`.jsx` files). Module 4 converts it to TypeScript, so you'll see why types help on code you already know.

### Setting up

Create the app with Vite's React template in a `capstone/` folder at the root of your repository:

```sh
npm create vite@latest capstone -- --template react
cd capstone
npm install
npm run dev
```

Clear out the template's demo content in `src/App.jsx` and start from there.

### Done when

- Opening the app shows the project, the summary line and every task from your data.
- Changing a task's `status` in the data file updates its styling and the summary on reload.
- Emptying the task array shows the empty state, with no errors or stray "0" on the page.
- The browser console shows no warnings, including none about missing keys.

The reference version of this step is the `capstone/` folder at git tag `capstone-m01`. Compare your component split with it after you finish, not before.
