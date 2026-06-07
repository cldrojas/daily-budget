import type { ImportedTransaction } from '@/types'

export type ImportStats = {
  lastSyncAt: string | null
  totalEmailsFound: number
  newImports: number
  skippedDuplicates: number
  totalApproved: number
  totalRejected: number
  totalPending: number
}

export function createEmptyStats(): ImportStats {
  return {
    lastSyncAt: null,
    totalEmailsFound: 0,
    newImports: 0,
    skippedDuplicates: 0,
    totalApproved: 0,
    totalRejected: 0,
    totalPending: 0,
  }
}

export type SyncRequest = {
  senders?: string[]
  maxResults?: number
  daysBack?: number
}

export type SyncResponse = {
  total: number
  new: number
  skipped: number
  imported: ImportedTransaction[]
}

export type ReviewAction = 'approve' | 'reject'

export type ReviewRequest = {
  id: string
  action: ReviewAction
  account?: string
  overrides?: {
    amount?: number
    description?: string
    date?: string
    type?: 'expense' | 'income'
  }
}

export type ReviewResponse =
  | { status: 'approved'; transaction: { id: string; type: string; amount: number; description: string; account: string; date: Date } }
  | { status: 'rejected' }
  | { status: 'error'; error: string }
