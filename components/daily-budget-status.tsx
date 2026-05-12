'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CircularProgress } from '@/components/circular-progress'
import { useLanguage } from '@/contexts/language-context'
import { useCurrency } from '@/contexts/currency-context'
import type { Account } from '@/types'

interface DailyBudgetStatusProps {
  dailyAllowance: number
  remainingToday: number
  progress: number
  accounts: Account[]
  remainingDays: number
  hasEndDate?: boolean
}

/**
 * Component to display the daily budget status.
 * @param dailyAllowance - The daily allowance amount.
 * @param remainingToday - The remaining amount for today.
 * @param progress - The progress percentage.
 * @param accounts - Array of accounts.
 * @param remainingDays - Number of remaining days.
 * @param hasEndDate - Whether the budget has an end date (budget mode) or not (tracking mode).
 * @returns JSX element for the daily budget status.
 * @example
 * <DailyBudgetStatus
 *   dailyAllowance={100}
 *   remainingToday={50}
 *   progress={50}
 *   accounts={[]}
 *   remainingDays={10}
 *   hasEndDate={true}
 * />
 */
export function DailyBudgetStatus({
  dailyAllowance,
  remainingToday,
  progress,
  accounts,
  remainingDays,
  hasEndDate = true,
}: DailyBudgetStatusProps) {
  const { t } = useLanguage()
  const { formatCurrency } = useCurrency()

  // Find the daily budget account
  const dailyAccount = accounts.find(acc => acc.id === 'daily')
  const totalBudget = dailyAccount ? dailyAccount.balance : 0

  // In tracking mode (no end date), show capital instead of daily allowance
  const isTrackingMode = !hasEndDate

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>{isTrackingMode ? t('modeRegister') : t('dailyBudget')}</CardTitle>
          <CardDescription>{t('budgetForToday')}</CardDescription>
        </div>
        {!isTrackingMode && (
          <div className="text-right">
            <p className="text-sm font-medium text-muted-foreground">
              {t('dailyAllowance')}
            </p>
            <p className="text-xl font-bold">{formatCurrency(dailyAllowance)}</p>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-6">
        {isTrackingMode ? (
          // Tracking mode: show total capital instead of circular progress
          <div className="text-center py-8 w-full">
            <p className="text-sm font-medium text-muted-foreground mb-2">
              {t('totalBudget')}
            </p>
            <p className="text-4xl font-bold">{formatCurrency(totalBudget)}</p>
          </div>
        ) : (
          // Budget mode: show circular progress with daily allowance
          <>
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
          </>
        )}
      </CardContent>
    </Card>
  )
}