import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { copyFileSync, mkdirSync, readdirSync } from 'fs'
import { resolve } from 'path'

function copyCSVPlugin() {
  const dataDir = resolve(__dirname, '../data')
  const publicDataDir = resolve(__dirname, 'public/data')

  function copyCSVs() {
    mkdirSync(publicDataDir, { recursive: true })
    for (const file of readdirSync(dataDir)) {
      if (file.endsWith('.csv')) {
        copyFileSync(resolve(dataDir, file), resolve(publicDataDir, file))
      }
    }
  }

  return {
    name: 'copy-csv',
    buildStart() {
      copyCSVs()
    },
    configureServer() {
      copyCSVs()
    },
  }
}

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), copyCSVPlugin()],
})
