'use client'

import { useEffect, useRef } from 'react'
import type { ImportedTransaction, Account } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Check, X, ChevronDown, ChevronUp, Edit, AlertTriangle } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import { findAccountByEntity } from '@/lib/import/entity-matcher'

const CREATE_SENTINEL = '__create__'

export type ImportReviewCardProps = {
  transaction: ImportedTransaction
  accounts: Account[]
  onApprove: (id: string, accountId: string) => void
  onReject: (id: string) => void
  onEdit: (id: string) => void
  selectedAccount?: string
  onAccountChange?: (id: string, accountId: string) => void
  onAddAccount?: (entity: string) => void
}

const statusConfig = (t: (key: string, params?: Record<string, string | number>) => string) => ({
  pending: { color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', label: t('importPending') },
  approved: { color: 'bg-green-500/10 text-green-500 border-green-500/20', label: t('importApproved') },
  rejected: { color: 'bg-red-500/10 text-red-500 border-red-500/20', label: t('importRejected') },
  unparsed: { color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', label: t('importUnparsed') },
})

export function ImportReviewCard({
  transaction,
  accounts,
  onApprove,
  onReject,
  onEdit,
  selectedAccount,
  onAccountChange,
  onAddAccount,
}: ImportReviewCardProps) {
  const { t } = useLanguage()
  const config = statusConfig(t)[transaction.status]
  const isPending = transaction.status === 'pending'
  const isUnparsed = transaction.status === 'unparsed'
  const isActionable = isPending || isUnparsed

  const confidencePercent = Math.round(transaction.confidence * 100)
  const formattedAmount = transaction.parsedAmount
    ? `$${(Number(transaction.parsedAmount)).toLocaleString()}`
    : '—'

  const entity = transaction.parsedEntity
  const matchedAccount = findAccountByEntity(accounts, entity)
  const showCreateOption =
    entity != null &&
    !matchedAccount &&
    transaction.confidence >= 0.5 &&
    onAddAccount !== undefined

  // Auto-match entity to account on mount / when accounts change
  const autoMatchedRef = useRef(false)
  useEffect(() => {
    if (
      !autoMatchedRef.current &&
      entity &&
      transaction.confidence >= 0.5 &&
      matchedAccount &&
      onAccountChange &&
      !selectedAccount
    ) {
      autoMatchedRef.current = true
      onAccountChange(transaction.id, matchedAccount.id)
    }
  }, [entity, matchedAccount, onAccountChange, selectedAccount, transaction.confidence, transaction.id])

  const handleSelectChange = (val: string) => {
    if (val === CREATE_SENTINEL) {
      if (entity && onAddAccount) {
        onAddAccount(entity)
      }
      return
    }
    if (onAccountChange) {
      onAccountChange(transaction.id, val)
    }
  }

  return (
    <div
      className={`rounded-lg border p-4 transition-all ${
        !isActionable ? 'opacity-60' : ''
      } ${isUnparsed ? 'border-amber-500/30 bg-amber-500/5' : 'bg-card'}`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: main data */}
        <div className="flex-1 space-y-2">
          {/* Bank + Status badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {transaction.bankName && (
              <Badge variant="outline" className="text-xs">
                {transaction.bankName}
              </Badge>
            )}
            <Badge className={`${config.color} text-xs`}>{config.label}</Badge>
            {isUnparsed && (
              <Badge variant="outline" className="text-amber-500 border-amber-500/30 text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {t('importCouldNotParse')}
              </Badge>
            )}
          </div>

          {/* Amount */}
          <p
            className={`text-2xl font-bold ${
              transaction.parsedType === 'expense'
                ? 'text-red-500'
                : transaction.parsedType === 'income'
                  ? 'text-green-500'
                  : 'text-foreground'
            }`}
          >
            {formattedAmount}
          </p>

          {/* Entity + Date */}
          <div className="space-y-1 text-sm text-muted-foreground">
            {transaction.parsedEntity && (
              <p className="font-medium text-foreground">{transaction.parsedEntity}</p>
            )}
            <div className="flex gap-4">
              {transaction.parsedDate && <span>{transaction.parsedDate}</span>}
              {transaction.parsedType && (
                <span className="capitalize">{transaction.parsedType}</span>
              )}
            </div>
          </div>

          {/* Confidence */}
          {transaction.confidence > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>{t('importConfidence')}:</span>
              <span
                className={
                  confidencePercent >= 90
                    ? 'text-green-500'
                    : confidencePercent >= 50
                      ? 'text-amber-500'
                      : 'text-red-500'
                }
              >
                {confidencePercent}%
              </span>
            </div>
          )}
        </div>

        {/* Right: actions */}
        {isPending && (
          <div className="flex flex-col gap-2 min-w-[160px]">
            {onAccountChange && (
              <Select
                value={selectedAccount}
                onValueChange={handleSelectChange}
              >
                <SelectTrigger className="h-8 text-xs">
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
                        {t('createAccountFor', { entity: entity ?? '' })}
                      </SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            )}

            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(transaction.id)}
                title={t('importEditBeforeApprove')}
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="default"
                className="flex-1"
                disabled={!selectedAccount}
                onClick={() => selectedAccount && onApprove(transaction.id, selectedAccount)}
              >
                <Check className="h-3 w-3 mr-1" /> {t('importApprove')}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="flex-1"
                onClick={() => onReject(transaction.id)}
              >
                <X className="h-3 w-3 mr-1" /> {t('importReject')}
              </Button>
            </div>
          </div>
        )}

        {isUnparsed && (
          <Button size="sm" variant="outline" onClick={() => onEdit(transaction.id)}>
            <Edit className="h-3 w-3 mr-1" /> {t('importEditAndApprove')}
          </Button>
        )}
      </div>

      {/* Collapsible raw email */}
      {transaction.rawSnippet && (
        <Collapsible className="mt-3">
          <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ChevronDown className="h-3 w-3" />
            <span>{t('importRawEmail')}</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 p-2 rounded bg-muted/50 text-xs text-muted-foreground whitespace-pre-wrap max-h-32 overflow-y-auto">
            <p className="font-medium">{transaction.rawSubject}</p>
            <p className="mt-1">{transaction.rawSnippet}</p>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  )
}
