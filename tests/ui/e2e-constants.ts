import type { Page } from '@playwright/test'

/**
 * Credenciales del usuario de prueba para los e2e.
 *
 * El usuario se crea en el proyecto Supabase remoto con email confirmado
 * (ver docs/migrations/2026-08-11-supabase-auth-backend.md). Es un fixture
 * de desarrollo, no una cuenta real: el password es deliberadamente simple.
 */
export const E2E_USER = {
  email: 'rhys.e2e@gmail.com',
  password: 'rhys-e2e-pass-2026',
  /** Parte local del email (lo que muestra el trigger del menú de usuario). */
  displayName: 'rhys'
}

/**
 * Fuerza el idioma español en la página ANTES de que cargue la app.
 * La app lee `localStorage.language` (language-context.tsx); sin esto,
 * Playwright arranca con navigator.language en-US y la UI sale en inglés.
 */
export async function forceSpanish(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem('language', 'es')
  })
}
