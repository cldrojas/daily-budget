import { render, screen } from '@testing-library/react'
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import DailyBudgetApp from '@/app/page'
import { LanguageProvider } from '@/contexts/language-context'
import { CurrencyProvider } from '@/contexts/currency-context'
import { AuthProvider } from '@/contexts/auth-context'

// Mock del cliente Supabase: el auth-context crea el cliente a nivel de módulo,
// y en tests no hay NEXT_PUBLIC_SUPABASE_URL/KEY reales.
const { mockAuth } = vi.hoisted(() => ({
  mockAuth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    }),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  },
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ auth: mockAuth }),
}))

const { mockRouter } = vi.hoisted(() => ({
  mockRouter: {
    replace: vi.fn(),
    push: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  },
}))

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}))

// Smoke test: render the main page component and assert on the app title
describe('App render', () => {
  it('renders app title', async () => {
    render(
      <LanguageProvider>
        <AuthProvider>
          <CurrencyProvider>
            <DailyBudgetApp />
          </CurrencyProvider>
        </AuthProvider>
      </LanguageProvider>
    )
    expect(await screen.findByText('Saldo Cero')).toBeInTheDocument()
  })
})
