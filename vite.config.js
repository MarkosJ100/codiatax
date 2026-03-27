import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  optimizeDeps: {
    entries: ['index.html'],
  },
  server: {
    port: 3001,
    strictPort: false,
    watch: {
      ignored: ['**/backup-*/**', '**/.gradle-user/**'],
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Keep Vite defaults for stable chunk graph.
      },
    },
  },
})
