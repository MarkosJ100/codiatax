import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Ensure relative paths for Capacitor
  server: {
    port: 3001,
    strictPort: false, // Allow fallback if 3001 is taken
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          if (id.includes('react-router')) return 'router';
          if (id.includes('@supabase')) return 'supabase';
          if (id.includes('framer-motion')) return 'motion';
          if (id.includes('recharts')) return 'charts';
          if (id.includes('pdfjs-dist')) return 'pdf-parse';
          if (id.includes('html2canvas')) return 'html-capture';
          if (id.includes('jspdf')) return 'pdf-core';

          if (id.includes('react') || id.includes('scheduler')) return 'react-vendor';
        }
      }
    }
  }
})
