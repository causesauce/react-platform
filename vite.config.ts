/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { contentMdx, lessonFrontmatter } from './scripts/vite-plugins.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    lessonFrontmatter(),
    contentMdx(),
    react({ include: /\.(jsx|js|mdx|md|tsx|ts)$/ }),
    tailwindcss(),
  ],
  build: {
    // Sandpack (~630 kB) is its own chunk, loaded only with an editor or lesson sandbox.
    chunkSizeWarningLimit: 700,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
    setupFiles: ['./src/test/setup.tsx'],
  },
})
