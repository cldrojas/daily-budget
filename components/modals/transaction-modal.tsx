'use client'

import { FormEvent, useState, useEffect } from 'react'
import { PlusCircle, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/contexts/language-context'
import { useCurrency } from '@/contexts/currency-context'
import { DatePicker } from '../date-picker'
import { Int, Transaction, TransactionType, toInt } from '@/types'

export function TransactionModal({
  isOpen,
  onClose,
  onAddTransaction,
  onUpdateTransaction,
  accounts,
  remainingToday,
  transaction
}: {
  isOpen: boolean
  onClose: () => void
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void
  onUpdateTransaction: (transaction: Transaction) => void
  accounts: { id: string; name: string }[]
  remainingToday: number
  transaction?: Transaction | null
}) {
  const { t } = useLanguage()
  const { formatCurrency } = useCurrency()
  const { toast } = useToast()
  const [amount, setAmount] = useState(0)
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date())
  const [account, setAccount] = useState('daily')
  const [type, setType] = useState<TransactionType>('expense')

  // Reset form when modal opens/closes or transaction changes
  useEffect(() => {
    if (transaction) {
      // Editing existing transaction
      setAmount(Math.abs(transaction.amount))
      setDescription(transaction.description)
      setDate(new Date(transaction.date))
      setAccount(transaction.account)
      setType(transaction.type)
    } else {
      // Adding new transaction
      setAmount(0)
      setDescription('')
      setDate(new Date())
      setAccount('daily')
      setType('expense')
    }
  }, [transaction, isOpen])

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!amount || amount <= 0) {
      toast({
        title: t('invalidAmount'),
        description: t('invalidAmountDescription'),
        variant: 'destructive'
      })
      return
    }

    if (!Number.isInteger(amount)) {
      toast({
        title: t('invalidAmount'),
        description: 'Amount must be a whole number',
        variant: 'destructive'
      })
      return
    }

    if (transaction) {
      // Update existing transaction
      onUpdateTransaction({
        ...transaction,
        type,
        amount: toInt(transaction.amount < 0 ? -amount : amount) as Int, // Preserve sign
        description,
        account,
        date
      })

      toast({
        title: t('transactionUpdated'),
        description: t('transactionUpdatedDescription', { amount: formatCurrency(amount) })
      })
    } else {
      // Add new transaction
      onAddTransaction({
        type,
        amount: toInt(amount) as Int,
        description,
        account,
        date
      })

      toast({
        title: t('expenseAdded'),
        description: t('expenseAddedDescription', { amount: formatCurrency(amount) })
      })
    }

    onClose()
  }

  const isEditing = !!transaction

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('editTransaction') : t('addExpense')}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? t('editTransactionDescription') : t('addExpenseDescription')}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="space-y-4 pt-4"
        >
          <div className="space-y-2">
            <Label htmlFor="amount">{t('amount')}</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.valueAsNumber || 0)}
              required
            />
            {!isEditing && amount > remainingToday && (
              <p className="text-sm text-yellow-500 dark:text-yellow-400">
                {t('expenseExceedsWarning')}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('description')}</Label>
            <Textarea
              id="description"
              placeholder={t('whatExpenseFor')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="account">{t('account')}</Label>
            <Select
              value={account}
              onValueChange={setAccount}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('selectAccount')} />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((acc) => (
                  <SelectItem
                    key={acc.id}
                    value={acc.id}
                  >
                    {acc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">{t('date')}</Label>
            <DatePicker
              date={date}
              setDate={setDate}
              className="w-full"
              allowPrevious
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              {t('cancel')}
            </Button>
            <Button type="submit">
              {isEditing ? (
                <>
                  <Edit className="mr-2 h-4 w-4" />
                  {t('updateTransaction')}
                </>
              ) : (
                <>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {t('addExpense')}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
