'use client'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { useLanguage } from '@/contexts/language-context'
import { useCurrency } from '@/contexts/currency-context'
import { Transaction } from '@/types'
import { Button } from './ui/button'
import { Trash2 } from 'lucide-react'
import { TransactionModal } from './transaction-modal'
import { useBudget } from '@/hooks/use-budget'

export function TransactionList({
  transactions,
  onDelete,
  openTransactionModal
}: {
  transactions: Transaction[]
  onDelete: (transactionId: string) => void
  openTransactionModal: (transactionId: string) => void
}) {
  const { t, language } = useLanguage()
  const { formatCurrency } = useCurrency()
  const { accounts } = useBudget()

  // Set locale based on language
  const locale = language === 'es' ? es : undefined

  // Filter only expense transactions (negative amounts)
  const expenses = transactions.filter((transaction) => transaction.amount < 0)

  // Function to get a short name from description
  const getShortName = (description: string) => {
    if (!description) return t('unnamedExpense')

    // If description is short enough, return it
    if (description.length <= 20) return description

    // Otherwise, truncate it
    return description.substring(0, 18) + '...'
  }

  // Function to get the timestamp from a date
  const time = (date: Date | string) => {
    return new Date(date).getTime()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('recentExpenses')}</CardTitle>
        <CardDescription>{t('recentExpensesDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        {expenses.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">{t('noExpenses')}</p>
        ) : (
          <div className="space-y-2">
            {expenses
              .toSorted((a, b) => time(b.date) - time(a.date)) // default sort by date descending
              .map((transaction) => {
                const account = accounts.find((account) => account.id === transaction.account)
                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-2 rounded-md border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <main className="flex items-center justify-between w-full cursor-pointer" onClick={() => openTransactionModal(transaction.id)}>
                      <div className="flex flex-col ">
                        <span className="font-medium">
                          {getShortName(transaction.description)}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(transaction.date), 'd MMM', { locale })}
                          </span>
                          <span className="text-xs text-muted-foreground capitalize">
                            • {account ? account.name : t('unknownAccount')}
                          </span>
                        </div>
                      </div>
                      <span className="font-semibold text-red-500">
                        {formatCurrency(Math.abs(transaction.amount))}
                      </span>
                    </main>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                      onClick={() => onDelete(transaction.id)}
                      title={t('deleteAccount')}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )
              })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}