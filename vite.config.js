import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Using conditional asset compilation directly driven by target flags
  base: Object.keys(import.meta.env || {}).includes('GITHUB_ACTIONS') ? '/ceylon-cakes/' : '/',
})