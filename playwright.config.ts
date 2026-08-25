import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'

// Carga credenciales del usuario de prueba desde .env.e2e
// (copiar .env.e2e.example → .env.e2e con los valores reales).
dotenv.config({ path: '.env.e2e' })

export default defineConfig({
  testDir: 'tests/ui',
  timeout: 30_000,
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 }
  },
  webServer: {
    command: 'pnpm dev',
    port: 3000,
    reuseExistingServer: true,
    timeout: 120_000
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'chromium',
      // Specs de la app: requieren sesión (storageState del proyecto `setup`).
      testIgnore: [/auth\.setup\.ts/, /auth\.spec\.ts/],
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/ui/.auth/user.json'
      }
    },
    {
      name: 'chromium-auth',
      // Flujos de auth: corren SIN sesión para probar redirect/validación/login.
      testMatch: /auth\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] }
    }
  ]
})
