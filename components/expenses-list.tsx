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

export function ExpensesList({ transactions }: { transactions: Transaction[] }) {
  const { t, language } = useLanguage()
  const { formatCurrency } = useCurrency()

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
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between p-3 rounded-md border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{getShortName(expense.description)}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(expense.date), 'd MMM', { locale })}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">
                      • {t(expense.account)}
                    </span>
                  </div>
                </div>
                <span className="font-semibold text-red-500">
                  {formatCurrency(Math.abs(expense.amount))}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
