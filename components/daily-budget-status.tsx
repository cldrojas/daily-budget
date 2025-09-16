'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { Account } from '@/types'

interface DailyBudgetStatusProps {
  dailyAllowance: number
  remainingToday: number
  progress: number
  accounts: Account[]
  remainingDays: number
}

export function DailyBudgetStatus({
  dailyAllowance,
  remainingToday,
  progress,
  accounts,
  remainingDays,
}: DailyBudgetStatusProps) {
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Budget Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Daily Allowance</p>
            <p className="text-2xl font-bold">${dailyAllowance.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Remaining Today</p>
            <p className="text-2xl font-bold">${remainingToday.toLocaleString()}</p>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">
            Progress ({Math.round(progress)}%)
          </p>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Balance</p>
            <p className="text-xl font-semibold">${totalBalance.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Days Remaining</p>
            <p className="text-xl font-semibold">{remainingDays}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}