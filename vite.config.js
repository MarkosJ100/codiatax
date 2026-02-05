import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Ensure relative paths for Capacitor
  server: {
    port: 3001,
    strictPort: false, // Allow fallback if 3001 is taken
  }
})
