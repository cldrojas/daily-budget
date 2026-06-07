'use client'

import Link from 'next/link'
import { Suspense, useCallback } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ImportDashboard } from '@/components/import-dashboard'
import { useBudget } from '@/hooks/use-budget'
import { useLanguage } from '@/contexts/language-context'

function ImportPageContent() {
  const { accounts, addTransaction } = useBudget()
  const { t } = useLanguage()

  const handleTransactionApproved = useCallback(
    (data: { type: 'expense' | 'income'; amount: number; description: string; account: string; date: string }) => {
      addTransaction({
        type: data.type,
        amount: data.amount,
        description: data.description,
        account: data.account,
        date: new Date(data.date),
      })
    },
    [addTransaction],
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('importTransactions')}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t('importDescription')}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('importBackToBudget')}
          </Link>
        </Button>
      </div>
      <ImportDashboard
        accounts={accounts}
        onTransactionApproved={handleTransactionApproved}
      />
    </div>
  )
}

export default function ImportPage() {
  return (
    <div className="container px-4 py-6 md:py-10">
      <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading...</div>}>
        <ImportPageContent />
      </Suspense>
    </div>
  )
}
