'use client'

import { useState, useEffect } from 'react'
import { Moon, Sun, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { SetupForm } from '@/components/setup-form'
import { DailyBudgetStatus } from '@/components/daily-budget-status'
import { TransactionList } from '@/components/transactions-list'
import { TransactionModal } from '@/components/transaction-modal'
import { AccountsList } from '@/components/accounts-list'
import { TransactionHistory } from '@/components/transaction-history'
import { useBudget } from '@/hooks/use-budget'
import { ConfigForm } from '@/components/config-form'
import { TransferForm } from '@/components/transfer-form'
import { LanguageCurrencySelector } from '@/components/language-currency-selector'
import { useLanguage } from '@/contexts/language-context'
import { useCurrency } from '@/contexts/currency-context'
import { AddButton } from '@/components/ui/AddButton'
import type { Transaction } from '@/types'

export default function DailyBudgetApp() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const { t } = useLanguage()
  // const { formatCurrency } = useCurrency()
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)

  // Theme management
  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
      if (savedTheme) {
        setTheme(savedTheme)
        document.documentElement.classList.toggle('dark', savedTheme === 'dark')
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        setTheme(prefersDark ? 'dark' : 'light')
        document.documentElement.classList.toggle('dark', prefersDark)
      }
    }
  }, [])

  const toggleTheme = () => {
    if (typeof window !== 'undefined') {
      const newTheme = theme === 'dark' ? 'light' : 'dark'
      setTheme(newTheme)
      localStorage.setItem('theme', newTheme)
      document.documentElement.classList.toggle('dark', newTheme === 'dark')
    }
  }

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
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex items-center justify-between h-16 px-4">
          <h1 className="text-xl font-bold">{t('appName')}</h1>
          <div className="flex items-center space-x-2">
            <LanguageCurrencySelector />
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              title={theme === 'dark' ? t('lightMode') : t('darkMode')}
            >
              {theme === 'dark' ? (
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
          <SetupForm onSetup={setupBudget} />
        ) : (
          <>
            <DailyBudgetStatus
              dailyAllowance={dailyAllowance}
              remainingToday={remainingToday}
              progress={progress}
              accounts={accounts}
              remainingDays={getRemainingDays()}
            />

            <div className="mt-6">
              <ConfigForm
                budget={budget}
                onUpdateConfig={updateConfig}
                onClearData={clearData}
              />
            </div>

            <Tabs defaultValue="accounts">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="accounts">{t('accounts')}</TabsTrigger>
                <TabsTrigger value="expenses">{t('expenses')}</TabsTrigger>
                <TabsTrigger value="transfer">{t('transfer')}</TabsTrigger>
                <TabsTrigger value="history">{t('asddsd')}</TabsTrigger>
              </TabsList>
              <TabsContent
                value="expenses"
                className="mt-6"
              >
                <TransactionList
                  transactions={transactions}
                  onDelete={removeTransaction}
                  openTransactionModal={(transactionId: string) => {
                    const transaction = transactions.find(t => t.id === transactionId)
                    setEditingTransaction(transaction || null)
                    setIsTransactionModalOpen(true)
                  }}
                />
              </TabsContent>
              <TabsContent
                value="transfer"
                className="mt-6"
              >
                <TransferForm
                  accounts={accounts}
                  onTransfer={transferFunds}
                />
              </TabsContent>
              <TabsContent
                value="accounts"
                className="mt-6"
              >
                <AccountsList
                  accounts={accounts}
                  onAddAccount={addAccount}
                  onUpdateAccount={updateAccount}
                  onDeleteAccount={deleteAccount}
                />
              </TabsContent>
              <TabsContent
                value="history"
                className="mt-6"
              >
                <TransactionHistory transactions={transactions} />
              </TabsContent>
            </Tabs>

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
          </>
        )}
      </main>
    </div>
  )
} 