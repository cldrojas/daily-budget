import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname)
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
  setupFiles: ['./tests/setupTests.ts'],
  include: ['tests/unit/**'],
  exclude: ['tests/ui/**', 'node_modules'],
    coverage: {
      provider: 'v8'
    }
  }
})
