import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { SandpackCheck } from './checks/SandpackCheck'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SandpackCheck />
  </StrictMode>,
)
