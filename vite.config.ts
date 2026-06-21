import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  root: '.',
  // CSS Modules convention for this app's own *.module.scss (camelCaseOnly maps `.card-top`
  // → `s.cardTop`). @atizar/react ships its CSS pre-compiled in the published package, so it is
  // NOT recompiled here — unlike inside the framework monorepo.
  css: { modules: { localsConvention: 'camelCaseOnly' } },
  server: {
    port: 5173,
    // The dev client proxies /api to the local server (server/index.ts on :4000).
    proxy: { '/api': 'http://localhost:4000' },
  },
})
