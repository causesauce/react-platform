import {
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
  SandpackTests,
} from '@codesandbox/sandpack-react'
import { useState } from 'react'

// Diagnostic page: runs small Jest-style suites inside Sandpack's browser test
// runner so CI can confirm which testing libraries work there. Each case is
// selected with ?case=<name>; results are written to [data-testid=result].

type Case = {
  dependencies: Record<string, string>
  files: Record<string, string>
}

const RTL = {
  '@testing-library/react': '16.3.3',
  '@testing-library/dom': '10.4.2',
  '@testing-library/user-event': '14.6.8',
  '@testing-library/jest-dom': '7.0.1',
}
const REACT = { react: '19.3.1', 'react-dom': '19.3.1' }

const counterApp = `import { useState } from "react";

type Props = { start?: number };

export default function App({ start = 0 }: Props) {
  const [count, setCount] = useState(start);
  const [name, setName] = useState("");
  return (
    <main>
      <h1>Counter</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>Increment</button>
      <label>
        Name
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      {name && <p>Hello, {name}!</p>}
    </main>
  );
}
`

const cases: Record<string, Case> = {
  rtl: {
    dependencies: { ...REACT, ...RTL },
    files: {
      '/App.tsx': counterApp,
      '/App.test.tsx': `import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import App from "./App";

describe("rtl", () => {
  it("renders the heading", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "Counter" })).toBeInTheDocument();
  });

  it("increments with user-event", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Increment" }));
    expect(screen.getByText("Count: 1")).toBeInTheDocument();
  });

  it("types into a labelled input", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText("Name"), "Ada");
    expect(screen.getByText("Hello, Ada!")).toHaveTextContent("Ada");
  });

  it("cleans up between tests", () => {
    render(<App start={5} />);
    expect(screen.getAllByRole("heading")).toHaveLength(1);
    expect(screen.getByText("Count: 5")).toBeVisible();
  });

  it("EXPECTED FAIL: reports a failing assertion", () => {
    render(<App />);
    expect(screen.queryByText("Count: 99")).toBeInTheDocument();
  });
});
`,
    },
  },
  'rtl-minimal': {
    dependencies: {
      ...REACT,
      '@testing-library/react': '16.3.3',
      '@testing-library/dom': '10.4.2',
    },
    files: {
      '/App.tsx': counterApp,
      '/App.test.tsx': `import { fireEvent, render, screen } from "@testing-library/react";
import App from "./App";

test("fireEvent and plain expect", () => {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Increment" }));
  expect(screen.getByText("Count: 1").textContent).toBe("Count: 1");
});
`,
    },
  },
  'ts-syntax': {
    dependencies: { ...REACT, ...RTL },
    files: {
      '/App.tsx': `type Task = { id: number; title: string; done: boolean };

const tasks = [
  { id: 1, title: "Plan", done: true },
  { id: 2, title: "Build", done: false },
] satisfies Task[];

export function first<T>(items: readonly T[]): T | undefined {
  return items[0];
}

export default function App() {
  const open = tasks.filter((t) => !t.done);
  return <p>{open.length} open, first is {first(tasks)?.title ?? "none"}</p>;
}
`,
      '/App.test.tsx': `import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import App from "./App";

test("satisfies, generics and optional chaining compile", () => {
  render(<App />);
  expect(screen.getByText("1 open, first is Plan")).toBeInTheDocument();
});
`,
    },
  },
  router: {
    dependencies: { ...REACT, ...RTL, 'react-router': '8.5.0' },
    files: {
      '/App.tsx': `import { Link, MemoryRouter, Outlet, Route, Routes, useParams } from "react-router";

export function Layout() {
  return (
    <div>
      <nav>
        <Link to="/">Home</Link> <Link to="/projects/42">Project 42</Link>
      </nav>
      <Outlet />
    </div>
  );
}

export function Home() {
  return <h1>Home</h1>;
}

export function Project() {
  const { projectId } = useParams();
  return <h1>Project {projectId}</h1>;
}

export const routes = [
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "projects/:projectId", Component: Project },
    ],
  },
];

export default function App({ url = "/" }: { url?: string }) {
  return (
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="projects/:projectId" element={<Project />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}
`,
      '/App.test.tsx': `import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { createMemoryRouter, RouterProvider } from "react-router";
import App, { routes } from "./App";

test("data router: navigates with a link", async () => {
  const user = userEvent.setup();
  const router = createMemoryRouter(routes, { initialEntries: ["/"] });
  render(<RouterProvider router={router} />);
  expect(screen.getByRole("heading", { name: "Home" })).toBeInTheDocument();
  await user.click(screen.getByRole("link", { name: "Project 42" }));
  expect(await screen.findByRole("heading", { name: "Project 42" })).toBeInTheDocument();
});

test("declarative router: reads URL params", () => {
  render(<App url="/projects/7" />);
  expect(screen.getByRole("heading", { name: "Project 7" })).toBeInTheDocument();
});
`,
    },
  },
  query: {
    dependencies: { ...REACT, ...RTL, '@tanstack/react-query': '5.104.5' },
    files: {
      '/App.tsx': `import { useQuery } from "@tanstack/react-query";

export type Task = { id: number; title: string };

export default function TaskList({ fetchTasks }: { fetchTasks: () => Promise<Task[]> }) {
  const query = useQuery({ queryKey: ["tasks"], queryFn: fetchTasks });
  if (query.isPending) return <p>Loading…</p>;
  if (query.isError) return <p role="alert">Could not load tasks</p>;
  return (
    <ul>
      {query.data.map((task) => (
        <li key={task.id}>{task.title}</li>
      ))}
    </ul>
  );
}
`,
      '/App.test.tsx': `import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import TaskList from "./App";

function renderWithClient(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

test("shows tasks once loaded", async () => {
  renderWithClient(<TaskList fetchTasks={() => Promise.resolve([{ id: 1, title: "Write lesson" }])} />);
  expect(screen.getByText("Loading…")).toBeInTheDocument();
  expect(await screen.findByRole("listitem")).toHaveTextContent("Write lesson");
});

test("shows an error state", async () => {
  renderWithClient(<TaskList fetchTasks={() => Promise.reject(new Error("nope"))} />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Could not load tasks");
});
`,
    },
  },
  msw: mswCase('3.0.3'),
  'msw-v2': mswCase('2'),
  preview: {
    dependencies: { ...REACT },
    files: {
      '/App.tsx': `export default function App() {
  return <h1>Hello from the preview</h1>;
}
`,
    },
  },
}

function mswCase(version: string): Case {
  return {
    dependencies: { ...REACT, ...RTL, msw: version },
    files: {
      '/App.tsx': `import { useEffect, useState } from "react";

export default function App() {
  const [tasks, setTasks] = useState<string[] | null>(null);
  useEffect(() => {
    fetch("https://api.example.com/tasks")
      .then((response) => response.json())
      .then((data: string[]) => setTasks(data));
  }, []);
  if (!tasks) return <p>Loading…</p>;
  return (
    <ul>
      {tasks.map((task) => (
        <li key={task}>{task}</li>
      ))}
    </ul>
  );
}
`,
      '/App.test.tsx': `import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import App from "./App";

const server = setupServer(
  http.get("https://api.example.com/tasks", () => HttpResponse.json(["Mocked task"])),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test("renders tasks from the mocked API", async () => {
  render(<App />);
  expect(await screen.findByText("Mocked task")).toBeInTheDocument();
});
`,
    },
  }
}

type Summary = {
  tests: { name: string; status: string; error?: string }[]
  fileErrors: { path: string; error: string }[]
}

type SpecLike = {
  name: string
  error?: { message?: string }
  tests: Record<string, { name: string; blocks: string[]; status: string; errors: { message?: string }[] }>
  describes: Record<string, SpecLike>
}

function summarise(specs: Record<string, SpecLike>): Summary {
  const summary: Summary = { tests: [], fileErrors: [] }
  const walk = (block: SpecLike) => {
    for (const test of Object.values(block.tests)) {
      summary.tests.push({
        name: [...test.blocks, test.name].join(' > '),
        status: test.status,
        error: test.errors[0]?.message?.slice(0, 600),
      })
    }
    Object.values(block.describes).forEach(walk)
  }
  for (const spec of Object.values(specs)) {
    if (spec.error) {
      summary.fileErrors.push({ path: spec.name, error: String(spec.error.message).slice(0, 2000) })
    }
    walk(spec)
  }
  return summary
}

export function SandpackCheck() {
  const name = new URLSearchParams(window.location.search).get('case') ?? 'rtl'
  const current = cases[name]
  const [result, setResult] = useState<Summary | null>(null)

  if (!current) {
    return <p>Unknown case. Available: {Object.keys(cases).join(', ')}</p>
  }

  return (
    <main>
      <h1>Sandpack check: {name}</h1>
      <SandpackProvider
        template="react-ts"
        files={current.files}
        customSetup={{ dependencies: current.dependencies }}
      >
        <SandpackLayout>
          {name === 'preview' ? (
            <SandpackPreview />
          ) : (
            <SandpackTests
              verbose
              onComplete={(specs) => setResult(summarise(specs as unknown as Record<string, SpecLike>))}
            />
          )}
        </SandpackLayout>
      </SandpackProvider>
      {result && <pre data-testid="result">{JSON.stringify(result, null, 2)}</pre>}
    </main>
  )
}
