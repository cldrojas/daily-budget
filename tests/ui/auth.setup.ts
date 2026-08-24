import { test as setup, expect } from '@playwright/test'
import { E2E_USER, forceSpanish } from './e2e-constants'

const BASE_URL = 'http://localhost:3000'

/**
 * Autentica una vez con el usuario de prueba y persiste el storageState.
 * Los specs del proyecto `chromium` reutilizan esta sesión vía
 * `storageState` en playwright.config.ts, evitando login en cada test.
 */
setup('authenticate as e2e user', async ({ page }) => {
  await forceSpanish(page)
  await page.goto(`${BASE_URL}/login`)
  await page.getByLabel('Correo electrónico').fill(E2E_USER.email)
  await page.getByLabel('Contraseña').fill(E2E_USER.password)
  await page.getByRole('button', { name: 'Iniciar sesión' }).click()
  await expect(page).toHaveURL(/\/$/, { timeout: 15_000 })
  await expect(page.locator('h1')).toBeVisible()

  await page.context().storageState({ path: 'tests/ui/.auth/user.json' })
})
