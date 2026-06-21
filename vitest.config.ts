import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Unit + component tests for this app (the workflow descriptor/prompts/cards + the React cards).
// They are pure (no Postgres, no network) — the framework's own server/pipeline tests live in the
// @atizar/* packages, not here.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./client/src/test/setup.ts'],
    include: ['**/*.test.{ts,tsx,mjs}'],
    css: true,
  },
})
