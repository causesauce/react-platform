import { SandpackCodeEditor, SandpackLayout, SandpackPreview, SandpackProvider } from '@codesandbox/sandpack-react'
import { pinnedDependencies } from '../exercise/sandbox'

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
        <SandpackLayout style={{ flexDirection: 'column' }}>
          <SandpackCodeEditor showTabs={visibleFiles.length > 1} showLineNumbers style={{ height: 300, flex: 'none' }} />
          <SandpackPreview showOpenInCodeSandbox={false} style={{ height: 220, flex: 'none' }} />
        </SandpackLayout>
      </SandpackProvider>
    </div>
  )
}
