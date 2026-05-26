import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  root: 'client',
  base: mode === 'production' ? '/prompt-quality-checker/' : '/',
  build: {
    outDir: '../client/dist',
    emptyOutDir: true,
  },
}))
