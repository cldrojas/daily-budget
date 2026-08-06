'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CircularProgress } from '@/components/circular-progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useLanguage } from '@/contexts/language-context'
import { useCurrency } from '@/contexts/currency-context'
import type { Account, Budget } from '@/types'

interface DailyBudgetStatusProps {
  budget: Budget
  dailyAllowance: number
  remainingToday: number
  progress: number
  accounts: Account[]
  remainingDays: number
}

const SELECTED_BALANCE_ACCOUNT_KEY = 'dailyBudget:selectedBalanceAccount'
const TOTAL_ACCOUNTS_VALUE = 'total'

/**
 * Component to display the daily budget status.
 * @param budget - The budget object containing mode information.
 * @param dailyAllowance - The daily allowance amount.
 * @param remainingToday - The remaining amount for today.
 * @param progress - The progress percentage.
 * @param accounts - Array of accounts.
 * @param remainingDays - Number of remaining days.
 * @returns JSX element for the daily budget status.
 * @example
 * <DailyBudgetStatus
 *   budget={budget}
 *   dailyAllowance={100}
 *   remainingToday={50}
 *   progress={50}
 *   accounts={[]}
 *   remainingDays={10}
 * />
 */
export function DailyBudgetStatus({
  budget,
  dailyAllowance,
  remainingToday,
  progress,
  accounts,
  remainingDays,
}: DailyBudgetStatusProps) {
  const { t } = useLanguage()
  const { formatCurrency } = useCurrency()

  // Determine mode from budget
  const isTrackMode = budget.mode === 'track' || (!budget.mode && !budget.endDate)

  // Which balance to display in track mode: a specific account id, or the total across all accounts.
  const [selectedAccountId, setSelectedAccountId] = useState<string>(TOTAL_ACCOUNTS_VALUE)

  useEffect(() => {
    const stored = window.localStorage.getItem(SELECTED_BALANCE_ACCOUNT_KEY)
    if (stored) {
      setSelectedAccountId(stored)
    }
  }, [])

  const handleSelectedAccountChange = (value: string) => {
    setSelectedAccountId(value)
    window.localStorage.setItem(SELECTED_BALANCE_ACCOUNT_KEY, value)
  }

  // Find the daily budget account (used for daily-mode totalBudget stat)
  const dailyAccount = accounts.find(acc => acc.id === 'daily')
  const totalBudget = dailyAccount ? dailyAccount.balance : 0

  // Track mode: show either the total of all accounts or a single selected account
  if (isTrackMode) {
    const selectedAccountExists =
      selectedAccountId === TOTAL_ACCOUNTS_VALUE ||
      accounts.some(acc => acc.id === selectedAccountId)

    const effectiveAccountId = selectedAccountExists ? selectedAccountId : TOTAL_ACCOUNTS_VALUE

    const displayedBalance =
      effectiveAccountId === TOTAL_ACCOUNTS_VALUE
        ? accounts.reduce((sum, acc) => sum + acc.balance, 0)
        : accounts.find(acc => acc.id === effectiveAccountId)?.balance ?? 0

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>{t('totalBalance') || 'Total Balance'}</CardTitle>
            <CardDescription>{t('trackModeDescription') || 'Track your spending'}</CardDescription>
          </div>
          {accounts.length > 0 && (
            <Select value={effectiveAccountId} onValueChange={handleSelectedAccountChange}>
              <SelectTrigger className="w-[180px]" aria-label={t('selectBalanceAccount')}>
                <SelectValue placeholder={t('selectBalanceAccount')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TOTAL_ACCOUNTS_VALUE}>{t('totalAllAccounts')}</SelectItem>
                {accounts.map(account => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6 py-8">
          <p className="text-5xl font-bold">{formatCurrency(displayedBalance)}</p>
        </CardContent>
      </Card>
    )
  }

  // Daily mode: show full budget status
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
