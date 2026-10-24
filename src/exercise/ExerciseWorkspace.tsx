import {
  SandpackCodeEditor,
  SandpackPreview,
  SandpackProvider,
  useSandpack,
} from '@codesandbox/sandpack-react'
import { useEffect, useMemo, useState } from 'react'
import { ResizablePanes } from '../components/ResizablePanes'
import type { Exercise } from '../content/build-course'
import type { ExerciseFiles } from '../content/course'
import { clearDraft, loadDraft, saveDraft } from '../progress/drafts'
import { editablePaths, sandboxDependencies, sandboxFiles } from './sandbox'
import type { RunSummary } from './run-summary'
import { TestRunner } from './TestRunner'

type Props = {
  exercise: Exercise
  files: ExerciseFiles
  onTestRun: (summary: RunSummary) => void
}

/** Editor, live preview and test runner for one exercise. Lazy-loaded: Sandpack is large. */
export default function ExerciseWorkspace({ exercise, files, onTestRun }: Props) {
  // Bumping the key remounts Sandpack with the starter code.
  const [generation, setGeneration] = useState(0)
  const visibleFiles = useMemo(() => editablePaths(files), [files])
  const sandpackFiles = useMemo(
    () => sandboxFiles(files, generation === 0 ? loadDraft(exercise.id) : null),
    [files, exercise.id, generation],
  )

  const resetCode = () => {
    if (!window.confirm('Replace your code with the starter code?')) return
    clearDraft(exercise.id)
    setGeneration((value) => value + 1)
  }

  return (
    <SandpackProvider
      key={`${exercise.id}:${generation}`}
      template="react-ts"
      files={sandpackFiles}
      customSetup={{ dependencies: sandboxDependencies(exercise.meta) }}
      options={{ visibleFiles, activeFile: visibleFiles[0], recompileMode: 'delayed', recompileDelay: 500 }}
    >
      <DraftSaver exerciseId={exercise.id} paths={visibleFiles} />
      <div className="flex flex-col gap-4">
        <ResizablePanes
          direction="row"
          storageKey="react-learning-platform:layout:exercise"
          defaults={{ split: 55, height: 480 }}
          first={<SandpackCodeEditor showLineNumbers showTabs style={{ height: '100%' }} />}
          second={<SandpackPreview showOpenInCodeSandbox={false} style={{ height: '100%' }} />}
        />
        <div className="flex justify-end">
          <button type="button" onClick={resetCode} className="text-sm text-slate-600 underline hover:text-slate-900">
            Reset to starter code
          </button>
        </div>
        <TestRunner onComplete={onTestRun} />
      </div>
    </SandpackProvider>
  )
}

/** Persists the learner's edits so a reload doesn't lose them. */
function DraftSaver({ exerciseId, paths }: { exerciseId: string; paths: string[] }) {
  const { sandpack } = useSandpack()
  const codes = paths.map((path) => sandpack.files[path]?.code ?? '')
  const signature = JSON.stringify(codes)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const values: string[] = JSON.parse(signature)
      saveDraft(exerciseId, Object.fromEntries(paths.map((path, index) => [path, values[index]])))
    }, 400)
    return () => window.clearTimeout(timer)
  }, [exerciseId, paths, signature])

  return null
}
