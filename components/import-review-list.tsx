'use client'

import { useState, useMemo } from 'react'
import type { ImportedTransaction, Account } from '@/types'
import { ImportReviewCard } from './import-review-card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Inbox,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download
} from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'

export type ImportReviewListProps = {
  imports: ImportedTransaction[]
  accounts: Account[]
  onApprove: (id: string, accountId: string) => void
  onReject: (id: string) => void
  onEdit: (id: string) => void
  selectedAccounts: Record<string, string>
  onAccountChange: (id: string, accountId: string) => void
}

type TabKey = 'pending' | 'approved' | 'rejected' | 'unparsed'

const tabConfig = (
  t: (key: string, params?: Record<string, string | number>) => string
): Record<TabKey, { label: string; icon: React.ReactNode }> => ({
  pending: { label: t('importPending'), icon: <Inbox className="h-3 w-3" /> },
  approved: {
    label: t('importApproved'),
    icon: <CheckCircle className="h-3 w-3" />
  },
  rejected: {
    label: t('importRejected'),
    icon: <XCircle className="h-3 w-3" />
  },
  unparsed: {
    label: t('importUnparsed'),
    icon: <AlertTriangle className="h-3 w-3" />
  }
})

export function ImportReviewList({
  imports,
  accounts,
  onApprove,
  onReject,
  onEdit,
  selectedAccounts,
  onAccountChange
}: ImportReviewListProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('pending')
  const [bankFilter, setBankFilter] = useState<string>('all')

  const { t } = useLanguage()

  // Group imports by status
  const grouped = useMemo(() => {
    const groups: Record<TabKey, ImportedTransaction[]> = {
      pending: [],
      approved: [],
      rejected: [],
      unparsed: []
    }

    for (const txn of imports) {
      const status = txn.status as TabKey
      if (groups[status]) {
        groups[status].push(txn)
      } else {
        groups.pending.push(txn)
      }
    }

    return groups
  }, [imports])

  // Filter by bank
  const filtered = useMemo(() => {
    const items = grouped[activeTab] ?? []
    if (bankFilter === 'all') return items
    return items.filter(
      (t) =>
        t.bankName === bankFilter ||
        (t.bankName === null && bankFilter === 'unknown')
    )
  }, [grouped, activeTab, bankFilter])

  // Available banks for filter
  const availableBanks = useMemo(() => {
    const banks = new Set(imports.map((t) => t.bankName).filter(Boolean))
    return Array.from(banks)
  }, [imports])

  // Bulk actions
  const pendingItems = grouped.pending
  const handleApproveAll = () => {
    for (const txn of pendingItems) {
      const accountId = selectedAccounts[txn.id]
      if (accountId) {
        onApprove(txn.id, accountId)
      }
    }
  }

  const handleRejectAll = () => {
    for (const txn of pendingItems) {
      onReject(txn.id)
    }
  }

  const countLabel = (key: TabKey) => {
    const count = grouped[key]?.length ?? 0
    return count > 0 ? ` (${count})` : ''
  }

  // Empty state
  if (imports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Download className="h-12 w-12 mb-4 opacity-30" />
        <p className="text-lg font-medium">{t('importNoTransactions')}</p>
        <p className="text-sm">{t('importSyncPrompt')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Bulk actions + Filter */}
      {pendingItems.length > 0 && (
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={handleApproveAll}
              disabled={pendingItems.length === 0}
            >
              <CheckCircle className="h-3 w-3 mr-1" /> {t('approveAll')} (
              {pendingItems.length})
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleRejectAll}
            >
              <XCircle className="h-3 w-3 mr-1" /> {t('rejectAll')}
            </Button>
          </div>

          {availableBanks.length > 0 && (
            <Select
              value={bankFilter}
              onValueChange={setBankFilter}
            >
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <SelectValue placeholder={t('allBanks')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allBanks')}</SelectItem>
                {availableBanks.map((bank) => (
                  <SelectItem
                    key={bank}
                    value={bank!}
                  >
                    {bank}
                  </SelectItem>
                ))}
                <SelectItem value="unknown">{t('unknown')}</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabKey)}
      >
        <TabsList className="grid grid-cols-4">
          {(Object.keys(tabConfig(t)) as TabKey[]).map((key) => (
              <TabsTrigger
                key={key}
                value={key}
                className="gap-1 text-xs"
              >
                {tabConfig(t)[key].icon}
                {tabConfig(t)[key].label}
                {countLabel(key)}
              </TabsTrigger>
            ))}
        </TabsList>

        {(Object.keys(tabConfig(t)) as TabKey[]).map((key) => (
          <TabsContent
            key={key}
            value={key}
            className="mt-4 space-y-3"
          >
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <p className="text-sm">
                  {key === 'pending' && t('noPendingTransactions')}
                  {key === 'approved' && t('importNoApprovedTransactions')}
                  {key === 'rejected' && t('importNoRejectedTransactions')}
                  {key === 'unparsed' && t('importNoUnparsedTransactions')}
                </p>
              </div>
            ) : (
              filtered.map((txn) => (
                <ImportReviewCard
                  key={txn.id}
                  transaction={txn}
                  accounts={accounts}
                  onApprove={onApprove}
                  onReject={onReject}
                  onEdit={onEdit}
                  selectedAccount={selectedAccounts[txn.id]}
                  onAccountChange={onAccountChange}
                />
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
