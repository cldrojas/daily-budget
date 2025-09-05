import { render, screen } from '@testing-library/react'
import React from 'react'
import { describe, it, expect } from 'vitest'
import DailyBudgetApp from '@/app/page'
import { LanguageProvider } from '@/contexts/language-context'
import { CurrencyProvider } from '@/contexts/currency-context'

// Smoke test: render the main page component and assert on the app title
describe('App render', () => {
  it('renders app title', () => {
    render(
      <LanguageProvider>
        <CurrencyProvider>
          <DailyBudgetApp />
        </CurrencyProvider>
      </LanguageProvider>
    )
    expect(screen.getByText('Saldo Cero')).toBeInTheDocument()
  })
})
