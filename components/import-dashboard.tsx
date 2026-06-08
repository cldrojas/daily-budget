'use client'

import { useState, useCallback } from 'react'
import type { ImportedTransaction, Account } from '@/types'
import { useLanguage } from '@/contexts/language-context'
import { useGmailImport } from '@/hooks/use-gmail-import'
import { ImportReviewList } from './import-review-list'
import { ImportEditModal } from './modals/import-edit-modal'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  AlertCircle,
  Mail,
  RefreshCw,
  LogOut,
  Inbox,
  CheckCircle,
  XCircle
} from 'lucide-react'

export type ImportDashboardProps = {
  accounts: Account[]
  onTransactionApproved?: (data: {
    type: 'expense' | 'income'
    amount: number
    description: string
    account: string
    date: string
  }) => void
  onAddAccount?: (entity: string) => void
}

export function ImportDashboard({
  accounts: _accounts,
  onTransactionApproved,
  onAddAccount
}: ImportDashboardProps) {
  const {
    connection,
    syncStatus,
    progress,
    imports,
    stats,
    error,
    connectGmail,
    disconnectGmail,
    syncNow,
    approve,
    reject,
    getImportsByStatus
  } = useGmailImport()

  const { t } = useLanguage()

  const [selectedAccounts, setSelectedAccounts] = useState<
    Record<string, string>
  >({})
  const [editingId, setEditingId] = useState<string | null>(null)

  const editingTransaction = editingId
    ? imports.find((t) => t.id === editingId) ?? null
    : null

  const handleAccountChange = useCallback((id: string, accountId: string) => {
    setSelectedAccounts((prev) => ({ ...prev, [id]: accountId }))
  }, [])

  const handleApprove = useCallback(
    async (id: string, accountId: string) => {
      const tx = imports.find((t) => t.id === id)
      const success = await approve(id, accountId)
      if (success && tx && onTransactionApproved) {
        onTransactionApproved({
          type:
            tx.parsedType === 'expense' || tx.parsedType === 'income'
              ? tx.parsedType
              : 'expense',
          amount:
            tx.parsedAmount != null ? Math.abs(Number(tx.parsedAmount)) : 0,
          description: tx.parsedEntity ?? tx.rawSubject ?? '',
          account: accountId,
          date: tx.parsedDate ?? new Date().toISOString().split('T')[0]
        })
      }
    },
    [approve, imports, onTransactionApproved]
  )

  const handleReject = useCallback(
    (id: string) => {
      reject(id)
    },
    [reject]
  )

  const handleEditSave = useCallback(
    async (
      id: string,
      overrides: {
        amount: number
        description: string
        date: string
        type: 'expense' | 'income'
      },
      accountId: string
    ) => {
      const success = await approve(id, accountId, overrides)
      if (success && onTransactionApproved) {
        onTransactionApproved({
          type: overrides.type,
          amount: overrides.amount,
          description: overrides.description,
          account: accountId,
          date: overrides.date
        })
      }
    },
    [approve, onTransactionApproved]
  )

  const pendingCount = getImportsByStatus('pending').length
  const approvedCount = getImportsByStatus('approved').length
  const rejectedCount = getImportsByStatus('rejected').length

  // ── Connection Card ──────────────────────────────────────────────
  if (connection === 'disconnected') {
    return (
      <Card className="max-w-md mx-auto mt-12">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Mail className="h-12 w-12 text-muted-foreground" />
          </div>
          <CardTitle>{t('importTransactions')}</CardTitle>
          <CardDescription>{t('gmailConnectDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-6">
          <Button
            size="lg"
            onClick={connectGmail}
          >
            <Mail className="h-4 w-4 mr-2" /> {t('connectGmail')}
          </Button>
        </CardContent>
      </Card>
    )
  }

  // ── Syncing State ────────────────────────────────────────────────
  const isSyncing = syncStatus === 'syncing'

  return (
    <div className="space-y-6">
      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
          <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">{error}</p>
          </div>
          {connection === 'expired' && (
            <Button
              size="sm"
              variant="outline"
              onClick={connectGmail}
            >
              {t('gmailReconnect')}
            </Button>
          )}
        </div>
      )}

      {/* Connection + Sync controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-base">
                  {t('gmailConnected')}
                </CardTitle>
              </div>
              <Badge
                variant="secondary"
                className="ml-2"
              >
                {connection === 'expired'
                  ? t('importExpired')
                  : t('importActive')}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={disconnectGmail}
              className="text-muted-foreground"
            >
              <LogOut className="h-3 w-3 mr-1" /> {t('disconnectGmail')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              {connection === 'expired' && (
                <p className="text-sm text-destructive">
                  {t('sessionExpiredReconnect')}
                </p>
              )}
            </div>
            <Button
              onClick={() => syncNow() /** TODO: crear un selector de bancos que pueda agregar mas correos */}
              disabled={isSyncing || connection === 'expired'}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`}
              />
              {isSyncing ? t('syncing') : t('importSyncNow')}
            </Button>
          </div>

          {/* Sync progress */}
          {isSyncing && (
            <div className="mt-4 space-y-2">
              <Progress
                value={(progress.current / Math.max(progress.total, 1)) * 100}
              />
              <p className="text-xs text-muted-foreground text-right">
                {progress.total > 0
                  ? t('processingEmails', {
                      current: progress.current,
                      total: progress.total
                    })
                  : t('searchingEmails')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats summary */}
      {imports.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="flex justify-center mb-1">
                <Inbox className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">
                {t('importPending')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="flex justify-center mb-1">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-2xl font-bold">{approvedCount}</p>
              <p className="text-xs text-muted-foreground">
                {t('importApproved')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="flex justify-center mb-1">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <p className="text-2xl font-bold">{rejectedCount}</p>
              <p className="text-xs text-muted-foreground">
                {t('importRejected')}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sync complete message */}
      {syncStatus === 'complete' && imports.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p className="font-medium">{t('importNoNewTransactions')}</p>
            <p className="text-sm">{t('importUpToDate')}</p>
          </CardContent>
        </Card>
      )}

      {/* Review list */}
      {imports.length > 0 && (
        <ImportReviewList
          imports={imports}
          accounts={_accounts}
          onApprove={handleApprove}
          onReject={handleReject}
          onEdit={setEditingId}
          selectedAccounts={selectedAccounts}
          onAccountChange={handleAccountChange}
          onAddAccount={onAddAccount}
        />
      )}

      {/* Edit modal */}
      <ImportEditModal
        isOpen={editingId !== null}
        transaction={editingTransaction}
        accounts={_accounts}
        onSave={handleEditSave}
        onClose={() => setEditingId(null)}
        onAddAccount={onAddAccount}
      />
    </div>
  )
}
