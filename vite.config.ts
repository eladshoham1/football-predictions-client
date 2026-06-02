import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Set base path for GitHub Pages
  // Change 'client' to your actual GitHub repository name
  base: process.env.GITHUB_PAGES === 'true' ? '/client/' : '/',
  
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'query-vendor': ['@tanstack/react-query'],
        }
      }
    }
  },
  
  server: {
    port: 5173,
    strictPort: false,
  },
  
  preview: {
    port: 4173,
  }
})
