'use client'

import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/language-context'
import { useCurrency } from '@/contexts/currency-context'
import type { Transaction } from '@/types'

interface DeleteTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: Transaction | null
  onDelete: (refund: boolean) => void
  accountName?: string
}

export function DeleteTransactionModal({
  isOpen,
  onClose,
  transaction,
  onDelete,
  accountName,
}: DeleteTransactionModalProps) {
  const { t } = useLanguage()
  const { formatCurrency } = useCurrency()

  if (!transaction) return null

  const handleDelete = (refund: boolean) => {
    onDelete(refund)
    onClose()
  }

  const displayAccount = accountName || transaction.account
  const displayAmount = Math.abs(transaction.amount)

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="sm:max-w-[400px] border-white/20 dark:border-white/10 bg-white/5 dark:bg-black/20 backdrop-blur-sm">
        <DialogHeader className="sr-only">
          <DialogTitle>{t('deleteTransactionTitle')}</DialogTitle>
        </DialogHeader>
        <DialogDescription className="text-center">
          {t('deleteTransactionQuestion')}
        </DialogDescription>

        <div className="rounded-lg border border-white/10 p-4 space-y-1">
          <p className="font-medium text-sm">{transaction.description}</p>
          <p className="text-lg font-semibold">{formatCurrency(displayAmount)}</p>
          <p className="text-sm text-muted-foreground">{displayAccount}</p>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            className="flex-1 hover:shadow-inner"
            onClick={() => handleDelete(true)}
          >
            {t('deleteAndRefund')}
          </Button>
          <Button
            variant="outline"
            className="flex-1 hover:shadow-inner"
            onClick={() => handleDelete(false)}
          >
            {t('deleteKeepBalance')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
