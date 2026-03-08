import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

// Plugin to copy manifest and content script
const copyExtensionFiles = () => {
  return {
    name: 'copy-extension-files',
    closeBundle: () => {
      fs.copyFileSync('manifest.json', 'dist/manifest.json')
      fs.copyFileSync('content.js', 'dist/content.js')
      fs.copyFileSync('background.js', 'dist/background.js')
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), copyExtensionFiles()],
  base: './', 
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
})
