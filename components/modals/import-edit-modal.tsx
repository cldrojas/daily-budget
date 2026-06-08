'use client'

import { useState, useEffect } from 'react'
import type { ImportedTransaction, Account } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useLanguage } from '@/contexts/language-context'
import { findAccountByEntity } from '@/lib/import/entity-matcher'

const CREATE_SENTINEL = '__create__'

export type ImportEditModalProps = {
  isOpen: boolean
  transaction: ImportedTransaction | null
  accounts: Account[]
  onSave: (id: string, overrides: {
    amount: number
    description: string
    date: string
    type: 'expense' | 'income'
  }, accountId: string) => void
  onClose: () => void
  onAddAccount?: (entity: string) => void
}

export function ImportEditModal({
  isOpen,
  transaction,
  accounts,
  onSave,
  onClose,
  onAddAccount,
}: ImportEditModalProps) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [type, setType] = useState<'expense' | 'income'>('expense')
  const [accountId, setAccountId] = useState('')

  const { t } = useLanguage()

  // Pre-fill form when transaction changes
  useEffect(() => {
    if (transaction) {
      setAmount(transaction.parsedAmount ? String(Number(transaction.parsedAmount)) : '')
      setDescription(transaction.parsedEntity ?? '')
      setDate(transaction.parsedDate ?? new Date().toISOString().slice(0, 10))
      setType(transaction.parsedType === 'income' ? 'income' : 'expense')

      // Auto-select matched account by entity
      const entity = transaction.parsedEntity
      const confidence = transaction.confidence
      if (entity && confidence >= 0.5) {
        const matched = findAccountByEntity(accounts, entity)
        if (matched) {
          setAccountId(matched.id)
          return
        }
      }
      setAccountId(accounts[0]?.id ?? '')
    }
  }, [transaction, accounts])

  const entity = transaction?.parsedEntity ?? ''
  const matchedAccount = findAccountByEntity(accounts, entity)
  const showCreateOption =
    entity !== '' &&
    !matchedAccount &&
    (transaction?.confidence ?? 0) >= 0.5 &&
    onAddAccount !== undefined

  const handleAccountChange = (val: string) => {
    if (val === CREATE_SENTINEL) {
      if (entity && onAddAccount) {
        onAddAccount(entity)
      }
      return
    }
    setAccountId(val)
  }

  const handleSave = () => {
    if (!transaction || !accountId) return

    const amountNum = parseInt(amount, 10)
    if (isNaN(amountNum) || amountNum <= 0) return

    onSave(
      transaction.id,
      {
        amount: amountNum,
        description,
        date,
        type,
      },
      accountId,
    )

    onClose()
  }

  const isValid = amount && !isNaN(parseInt(amount, 10)) && parseInt(amount, 10) > 0 && description && accountId

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('importEditTitle')}</DialogTitle>
          <DialogDescription>
            {t('importEditModalDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Type toggle */}
          <div className="space-y-2">
            <Label>{t('transactionType')}</Label>
            <ToggleGroup
              type="single"
              value={type}
              onValueChange={(v) => v && setType(v as 'expense' | 'income')}
              className="justify-start"
            >
              <ToggleGroupItem value="expense" variant="outline">
                {t('expense')}
              </ToggleGroupItem>
              <ToggleGroupItem value="income" variant="outline">
                {t('income')}
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">{t('importAmountInCents')}</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1500"
            />
            <p className="text-xs text-muted-foreground">
              {t('importCentsHint')}
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">{t('importDescriptionLabel')}</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="NETFLIX"
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">{t('importDate')}</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Account */}
          <div className="space-y-2">
            <Label htmlFor="account">{t('importAccount')}</Label>
            <Select value={accountId} onValueChange={handleAccountChange}>
              <SelectTrigger id="account">
                <SelectValue placeholder={t('selectAccount')} />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name}
                  </SelectItem>
                ))}
                {showCreateOption && (
                  <>
                    <Separator className="my-1" />
                    <SelectItem value={CREATE_SENTINEL}>
                      {t('createAccountFor', { entity })}
                    </SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSave} disabled={!isValid}>
            {t('importSaveAndApprove')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
