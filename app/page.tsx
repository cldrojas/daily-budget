'use client'

import { useState } from 'react'
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
import { TransactionModal } from '@/components/transaction-modal'
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
import { Transaction } from '@/types'

export default function DailyBudgetApp() {
  const { theme, setTheme } = useTheme()
  const { t } = useLanguage()
  const { formatCurrency } = useCurrency()
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)

  const {
    budget,
    accounts,
    transactions,
    dailyAllowance,
    remainingToday,
    progress,
    setupBudget,
    selectedAccountId,
    setSelectedAccountId,
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
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
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
              selectedAccountId={selectedAccountId}
              setSelectedAccountId={setSelectedAccountId}
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

function SetupForm({
  onSetup
}: {
  onSetup: (data: { startAmount: number; endDate: Date }) => void
}) {
  const { t } = useLanguage()
  const [startAmount, setStartAmount] = useState(0)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!startAmount || !endDate) return

    onSetup({
      startAmount: startAmount,
      endDate
    })
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{t('setupTitle')}</CardTitle>
        <CardDescription>{t('setupDescription')}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="startAmount">{t('startingAmount')}</Label>
            <Input
              id="startAmount"
              type="number"
              placeholder="1000.00"
              value={startAmount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setStartAmount(e.target.valueAsNumber)
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">{t('endDate')}</Label>
            <DatePicker
              date={endDate}
              setDate={setEndDate}
              className="w-full"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full"
          >
            {t('startTracking')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

function DailyBudgetStatus({
  dailyAllowance,
  remainingToday,
  progress,
  accounts,
  remainingDays,
  selectedAccountId,
  setSelectedAccountId
}: {
  dailyAllowance: number
  remainingToday: number
  progress: number
  accounts: { id: string; balance: number; name?: string }[]
  remainingDays: number
  selectedAccountId: string
  setSelectedAccountId: (id: string) => void
}) {
  const { t } = useLanguage()
  const { formatCurrency } = useCurrency()

  // Find the selected account
  const selectedAccount = accounts.find((acc) => acc.id === selectedAccountId)
  const totalBudget = selectedAccount ? selectedAccount.balance : 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>{t('dailyBudget')}</CardTitle>
          <CardDescription>{t('budgetForToday')}</CardDescription>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-muted-foreground">
            {t('dailyAllowance')}
          </p>
          <p className="text-xl font-bold">{formatCurrency(dailyAllowance)}</p>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-6">
        <CircularProgress
          value={progress}
          size={200}
          strokeWidth={15}
          className="my-4"
        >
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">
              {t('remainingToday')}
            </p>
            <p className="text-3xl font-bold">{formatCurrency(remainingToday)}</p>
          </div>
        </CircularProgress>

        <div className="grid grid-cols-2 gap-4 w-full">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {t('remainingDays')}
            </p>
            <p className="text-2xl font-bold">
              {remainingDays} {t('days')}
            </p>
          </div>
          <div className="space-y-2 text-right">
            <div className="flex items-center justify-end space-x-3">
              <label className="text-sm font-medium text-muted-foreground">{t('selectAccount')}</label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="bg-transparent text-right"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name || acc.id}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              {t('totalBudget')}
            </p>
            <p className="text-2xl font-bold">{formatCurrency(totalBudget)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
