import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Ensure relative paths for Capacitor
  optimizeDeps: {
    entries: ['index.html'],
  },
  server: {
    port: 3001,
    strictPort: false, // Allow fallback if 3001 is taken
    watch: {
      ignored: ['**/backup-*/**', '**/.gradle-user/**'],
    },
  },
  build: {
    rollupOptions: {
      output: {
        // No manual chunks — let Vite handle bundling to avoid inter-chunk
        // dependency ordering issues in Android WebViews
      }
    }
  }
})
