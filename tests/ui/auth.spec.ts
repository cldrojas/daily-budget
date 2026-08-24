import { test, expect } from '@playwright/test'
import { E2E_USER, forceSpanish } from './e2e-constants'

// Base URL local del webServer configurado en playwright.config.ts.
const BASE_URL = 'http://localhost:3000'

test.describe('auth flows (sin sesión)', () => {
  test('redirects to /login when unauthenticated', async ({ page }) => {
    await forceSpanish(page)
    await page.goto(BASE_URL)
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.locator('text=Saldo Cero')).toHaveCount(0)
  })

  test('shows validation errors on empty login submit', async ({ page }) => {
    await forceSpanish(page)
    await page.goto(`${BASE_URL}/login`)
    await page.getByRole('button', { name: 'Iniciar sesión' }).click()
    await expect(page.getByText('Ingresa un correo electrónico válido.')).toBeVisible()
    await expect(page.getByText('La contraseña es obligatoria.')).toBeVisible()
  })

  test('rejects invalid credentials', async ({ page }) => {
    await forceSpanish(page)
    await page.goto(`${BASE_URL}/login`)
    await page.getByLabel('Correo electrónico').fill('nadie@example.com')
    await page.getByLabel('Contraseña').fill('wrong-password')
    await page.getByRole('button', { name: 'Iniciar sesión' }).click()
    await expect(page.getByText('Correo o contraseña inválidos.')).toBeVisible()
  })

  test('sign up shows email confirmation message when confirmation is enabled', async ({ page }) => {
    // El provider Email del proyecto tiene "Confirm email" activado: el signup
    // no crea sesión, solo informa que hay que confirmar el correo.
    await forceSpanish(page)
    const email = `rhys.e2e.new.${Date.now()}@gmail.com`
    await page.goto(`${BASE_URL}/login`)
    await page.getByRole('tab', { name: 'Crear cuenta' }).click()
    await page.getByLabel('Correo electrónico').fill(email)
    await page.getByLabel('Contraseña', { exact: true }).fill('secret123')
    await page.getByLabel('Confirmar contraseña').fill('secret123')
    await page.getByRole('button', { name: 'Crear cuenta' }).click()

    // El proyecto tiene cuota horaria de envío de emails; si está agotada el
    // signup responde 429. En ese caso skip con razón (reintentar en ~1h).
    const rateLimited = page.getByText('Demasiados intentos. Inténtalo de nuevo en un momento.')
    if (await rateLimited.isVisible().catch(() => false)) {
      test.skip(true, 'Cuota horaria de emails del proyecto agotada; reintentar en ~1h')
    }

    await expect(page.getByText('Revisa tu correo para confirmar tu cuenta y luego inicia sesión.')).toBeVisible()
    // Sigue en /login (sin sesión).
    await expect(page).toHaveURL(/\/login$/)
  })

  test('logs in with confirmed credentials and reaches the app', async ({ page }) => {
    await forceSpanish(page)
    await page.goto(`${BASE_URL}/login`)
    await page.getByLabel('Correo electrónico').fill(E2E_USER.email)
    await page.getByLabel('Contraseña').fill(E2E_USER.password)
    await page.getByRole('button', { name: 'Iniciar sesión' }).click()

    await expect(page).toHaveURL(/\/$/, { timeout: 15_000 })
    await expect(page.locator('h1')).toBeVisible()
  })
})

test.describe('auth flows (con sesión)', () => {
  test('sign out returns to login and keeps localStorage data', async ({ page }) => {
    // Login explícito: este proyecto (chromium-auth) no usa storageState.
    await forceSpanish(page)
    await page.goto(`${BASE_URL}/login`)
    await page.getByLabel('Correo electrónico').fill(E2E_USER.email)
    await page.getByLabel('Contraseña').fill(E2E_USER.password)
    await page.getByRole('button', { name: 'Iniciar sesión' }).click()
    await expect(page).toHaveURL(/\/$/, { timeout: 15_000 })

    // Sembrar localStorage de la app (simula datos existentes que no deben borrarse).
    await page.evaluate(() => {
      localStorage.setItem(
        'daily-budget-data',
        JSON.stringify({
          budget: { startAmount: 100000, endDate: '2026-12-31', mode: 'daily' },
          accounts: [],
          transactions: [],
          remainingToday: 0,
          progress: 0,
          isSetup: true,
        })
      )
    })

    // Sign out desde el menú de usuario (el trigger muestra la parte local del email).
    await page.locator('header').getByRole('button').filter({ hasText: E2E_USER.displayName }).first().click()
    await page.getByRole('menuitem', { name: 'Cerrar sesión' }).click()
    await expect(page).toHaveURL(/\/login$/)

    // El sign out NO borra los datos locales de la app.
    const stored = await page.evaluate(() => localStorage.getItem('daily-budget-data'))
    expect(stored).not.toBeNull()
  })
})
