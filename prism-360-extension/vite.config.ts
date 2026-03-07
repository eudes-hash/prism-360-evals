import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Important for Chrome Extensions to load assets relatively
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
})
