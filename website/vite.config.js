import { defineConfig } from 'vite'
import StimulusHMR from 'vite-plugin-stimulus-hmr'

export default defineConfig({
  plugins: [
    StimulusHMR(),
  ],
  preview: {
    open: false,
  },
  server: {
    open: false,
  },
  root: 'src',
  publicDir: '../public',
  base: '/~ariel.santos/mapa-icex',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    cssCodeSplit: false
  },
})
