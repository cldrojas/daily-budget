'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DatePicker } from '@/components/date-picker'
import { TransactionList } from '@/components/transactions-list'
import { TransactionModal } from '@/components/modals/transaction-modal'
import { AccountsList } from '@/components/accounts-list'
import { TransactionHistory } from '@/components/transaction-history'
import { useBudget } from '@/hooks/use-budget'
import { CircularProgress } from '@/components/circular-progress'
import { ConfigForm } from '@/components/config-form'
import { TransferForm } from '@/components/transfer-form'
import { LanguageCurrencySelector } from '@/components/language-currency-selector'
import { useLanguage } from '@/contexts/language-context'
import { useCurrency } from '@/contexts/currency-context'
import { AddButton } from '@/components/ui/AddButton'
import { Int, toInt, Transaction } from '@/types'
import { SetupForm } from '@/components/setup-form'
import { DailyBudgetStatus } from '@/components/daily-budget-status'
import { ErrorBoundary, EmptyState } from '@/components/error-boundary'

/**
 * Main component for the Daily Budget application.
 * @returns JSX element for the entire app.
 */
export default function DailyBudgetApp() {
  const { theme, setTheme } = useTheme()
  const { t } = useLanguage()
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                title={mounted ? (theme === 'dark' ? t('lightMode') : t('darkMode')) : 'Toggle theme'}
              >
                {mounted ? (
                  (() => {
                    const isSun = theme === 'dark';
                    return isSun ? (
                      <Sun className="h-5 w-5" />
                    ) : (
                      <Moon className="h-5 w-5" />
                    );
                  })()
                ) : (
                  <Sun className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </header>

        <main className="container px-4 py-6 md:py-10 space-y-8">
          {!isSetup ? (
            <ErrorBoundary>
              <SetupForm onSetup={setupBudget} />
            </ErrorBoundary>
          ) : (
            <ErrorBoundary>
              {accounts.length === 0 ? (
                <EmptyState
                  title={t('noAccounts') || 'No accounts available'}
                  description={t('noAccountsDescription') || 'Please add an account to get started with transfers.'}
                  action={
                    <Button onClick={() => {
                      // TODO: Add account creation flow
                      console.log('Add account clicked')
                    }}>
                      {t('addAccount') || 'Add Account'}
                    </Button>
                  }
                />
              ) : (
                <>
                  <ErrorBoundary>
                    <DailyBudgetStatus
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

                  <ErrorBoundary>
                    <Tabs defaultValue="accounts">
                      <TabsList className="grid w-full grid-cols-4">
                        {/* TODO: add a way to reorder tabs (drag&drop) */}
                        <TabsTrigger value="accounts">{t('accounts')}</TabsTrigger>
                        <TabsTrigger value="expenses">{t('expenses')}</TabsTrigger>
                        <TabsTrigger value="transfer">{t('transfer')}</TabsTrigger>
                        <TabsTrigger value="history">{t('history')}</TabsTrigger>
                      </TabsList>
                      <TabsContent
                        value="expenses"
                        className="mt-6"
                      >
                        <ErrorBoundary>
                          <TransactionList
                            transactions={transactions}
                            onDelete={removeTransaction}
                            openTransactionModal={(transactionId: string) => {
                              const transaction = transactions.find(t => t.id === transactionId)
                              setEditingTransaction(transaction || null)
                              setIsTransactionModalOpen(true)
                            }}
                          />
                        </ErrorBoundary>
                      </TabsContent>
                      <TabsContent
                        value="transfer"
                        className="mt-6"
                      >
                        <ErrorBoundary>
                          <TransferForm
                            accounts={accounts}
                            onTransfer={transferFunds}
                          />
                        </ErrorBoundary>
                      </TabsContent>
                      <TabsContent
                        value="accounts"
                        className="mt-6"
                      >
                        <ErrorBoundary>
                          <AccountsList
                            accounts={accounts}
                            onAddAccount={addAccount}
                            onUpdateAccount={updateAccount}
                            onDeleteAccount={deleteAccount}
                          />
                        </ErrorBoundary>
                      </TabsContent>
                      <TabsContent
                        value="history"
                        className="mt-6"
                      >
                        <ErrorBoundary>
                          <TransactionHistory transactions={transactions} />
                        </ErrorBoundary>
                      </TabsContent>
                    </Tabs>
                  </ErrorBoundary>

                  {/* Floating Action Button for adding expenses */}
                  <Button
                    className="fixed bottom-6 right-6 rounded-full h-14 w-14 shadow-lg"
                    onClick={() => {
                      setEditingTransaction(null)
                      setIsTransactionModalOpen(true)
                    }}
                    title={t('addExpense')}
                  >
                    <Plus className="h-6 w-6" />
                  </Button>

                  <AddButton />

                  {/* Expense Modal */}
                  <ErrorBoundary>
                    <TransactionModal
                      isOpen={isTransactionModalOpen}
                      onClose={() => {
                        setIsTransactionModalOpen(false)
                        setEditingTransaction(null)
                      }}
                      onAddTransaction={addTransaction}
                      onUpdateTransaction={updateTransaction}
                      accounts={accounts}
                      remainingToday={remainingToday}
                      transaction={editingTransaction}
                    />
                  </ErrorBoundary>
                </>
              )}
            </ErrorBoundary>
          )}
        </main>
      </div>
    </ErrorBoundary>
  )
}


