'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useBudget } from '@/hooks/use-budget'
import { ConfigForm } from '@/components/config-form'
import { LanguageCurrencySelector } from '@/components/language-currency-selector'
import { useLanguage } from '@/contexts/language-context'
import { SetupForm } from '@/components/setup-form'
import { DailyBudgetStatus } from '@/components/daily-budget-status'
import { ErrorBoundary, EmptyState } from '@/components/error-boundary'
import Navbar from '@/components/navbar'

/**
 * Main component for the Daily Budget application.
 * @returns JSX element for the entire app.
 */
export default function DailyBudgetApp() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { t } = useLanguage()

  const {
    budget,
    accounts,
    transactions,
    dailyAllowance,
    remainingToday,
    progress,
    setupBudget,
    addTransaction,
    updateTransaction,
    addAccount,
    updateAccount,
    deleteAccount,
    isSetup,
    clearData,
    transferFunds,
    updateConfig,
    getRemainingDays,
    removeTransaction
  } = useBudget()

  // Ensure theme is set on initial load
  const isDarkMode = (theme || resolvedTheme) === 'dark'

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container flex items-center justify-between h-16 px-4">
            <h1 className="text-xl font-bold">{t('appName')}</h1>
            <div className="flex items-center space-x-2">
              <LanguageCurrencySelector />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(isDarkMode ? 'light' : 'dark')}
                title={isDarkMode ? t('lightMode') : t('darkMode')}
              >
                {isDarkMode ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </header>

        <main className="container px-4 py-6 md:py-10 space-y-8">
          {!isSetup ? (
            <ErrorBoundary>
              <SetupForm
                onSetup={({ startAmount, endDate, mode }) => {
                  setupBudget({ startAmount, endDate: endDate!, mode })
                }}
              />
            </ErrorBoundary>
          ) : (
            <ErrorBoundary>
              {accounts.length === 0 ? (
                <EmptyState
                  title={t('noAccounts') || 'No accounts available'}
                  description={
                    t('noAccountsDescription') ||
                    'Please add an account to get started with transfers.'
                  }
                  action={
                    <Button
                      onClick={() => {
                        console.log('Add account clicked')
                      }}
                    >
                      {t('addAccount') || 'Add Account'}
                    </Button>
                  }
                />
              ) : (
                <>
                  <ErrorBoundary>
                    <DailyBudgetStatus
                      budget={budget}
                      dailyAllowance={dailyAllowance}
                      remainingToday={remainingToday}
                      progress={progress}
                      accounts={accounts}
                      remainingDays={getRemainingDays()}
                    />
                  </ErrorBoundary>

                  <div className="mt-6">
                    <ErrorBoundary>
                      <ConfigForm
                        budget={budget}
                        onUpdateConfig={updateConfig}
                        onClearData={clearData}
                      />
                    </ErrorBoundary>
                  </div>

                  <Navbar
                    accounts={accounts}
                    budget={budget}
                    transactions={transactions}
                    addAccount={addAccount}
                    updateAccount={updateAccount}
                    deleteAccount={deleteAccount}
                    addTransaction={addTransaction}
                    updateTransaction={updateTransaction}
                    removeTransaction={removeTransaction}
                    transferFunds={transferFunds}
                  />
                </>
              )}
            </ErrorBoundary>
          )}
        </main>
      </div>
    </ErrorBoundary>
  )
}
