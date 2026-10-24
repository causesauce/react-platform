import { SandpackCodeEditor, SandpackPreview, SandpackProvider } from '@codesandbox/sandpack-react'
import { pinnedDependencies } from '../exercise/sandbox'
import { ResizablePanes } from './ResizablePanes'

type Props = { files: Record<string, string>; dependencies: string[] }

export default function SandboxEditor({ files, dependencies }: Props) {
  const visibleFiles = Object.keys(files)
  return (
    <div className="not-prose my-6">
      <SandpackProvider
        template="react-ts"
        files={files}
        customSetup={{ dependencies: pinnedDependencies(['react', 'react-dom', ...dependencies]) }}
        options={{ visibleFiles, activeFile: visibleFiles[0], recompileMode: 'delayed', recompileDelay: 500 }}
      >
        {/* Stacked: the lesson column is too narrow for editor and preview side by side. */}
        <ResizablePanes
          direction="column"
          storageKey="react-learning-platform:layout:lesson"
          defaults={{ split: 60, height: 520 }}
          first={<SandpackCodeEditor showTabs={visibleFiles.length > 1} showLineNumbers style={{ height: '100%' }} />}
          second={<SandpackPreview showOpenInCodeSandbox={false} style={{ height: '100%' }} />}
        />
      </SandpackProvider>
    </div>
  )
}
