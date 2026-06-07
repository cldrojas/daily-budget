'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
import type { ImportedTransaction } from '@/types'
import type {
  ImportStats,
  SyncResponse,
  ReviewRequest
} from '@/lib/import/types'
import { createEmptyStats } from '@/lib/import/types'
import {
  getAllImports,
  saveImports,
  updateImportStatus,
  getStats,
  updateStats
} from '@/lib/import/store'

export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'expired'
export type SyncStatus = 'idle' | 'syncing' | 'complete' | 'error'

export type SyncProgress = {
  current: number
  total: number
}

export type UseGmailImportReturn = {
  connection: ConnectionStatus
  gmailEmail: string | null
  syncStatus: SyncStatus
  progress: SyncProgress
  imports: ImportedTransaction[]
  stats: ImportStats
  error: string | null
  connectGmail: () => void
  disconnectGmail: () => Promise<void>
  syncNow: (senders?: string[]) => Promise<void>
  approve: (
    id: string,
    account: string,
    overrides?: ReviewRequest['overrides']
  ) => Promise<boolean>
  reject: (id: string) => Promise<boolean>
  getImportsByStatus: (
    status: ImportedTransaction['status']
  ) => ImportedTransaction[]
}

export function useGmailImport(): UseGmailImportReturn {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [connection, setConnection] = useState<ConnectionStatus>('disconnected')
  const [gmailEmail, setGmailEmail] = useState<string | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [progress, setProgress] = useState<SyncProgress>({
    current: 0,
    total: 0
  })
  const [imports, setImports] = useState<ImportedTransaction[]>([])
  const [stats, setStatsState] = useState<ImportStats>(createEmptyStats())
  const [error, setError] = useState<string | null>(null)

  // Check OAuth callback params on mount
  useEffect(() => {
    const connected = searchParams.get('connected')
    const errorParam = searchParams.get('error')

    if (connected === 'true') {
      setConnection('connected')
      // Clean the URL without full page reload
      router.replace('/import')
    }

    if (errorParam === 'access_denied') {
      setError(
        'Gmail access was denied. You need to authorize access to import transactions.'
      )
      router.replace('/import')
    }

    if (errorParam === 'session_expired') {
      setError('OAuth session expired. Please try again.')
      router.replace('/import')
    }

    if (errorParam === 'no_refresh_token') {
      setError(
        'Could not obtain persistent access. Please try again and ensure you grant offline access.'
      )
      router.replace('/import')
    }
  }, [searchParams, router])

  // Check connection status on mount (via cookie)
  useEffect(() => {
    const hasGmailCookie = document.cookie.includes('gmail_connected=true')
    if (hasGmailCookie) {
      setConnection('connected')
    }
  }, [])

  // Load imports and stats from localStorage on mount
  useEffect(() => {
    setImports(getAllImports())
    setStatsState(getStats())
  }, [])

  // Refresh imports and stats from localStorage
  const refreshData = useCallback(() => {
    setImports(getAllImports())
    setStatsState(getStats())
  }, [])

  /**
   * Connect Gmail — redirect to OAuth flow.
   */
  const connectGmail = useCallback(() => {
    setConnection('connecting')
    window.location.href = '/api/auth/gmail'
  }, [])

  /**
   * Disconnect Gmail — revoke tokens and clear session.
   */
  const disconnectGmail = useCallback(async () => {
    try {
      const response = await fetch('/api/gmail/disconnect', { method: 'POST' })
      if (response.ok) {
        setConnection('disconnected')
        setGmailEmail(null)
        setError(null)
      }
    } catch {
      setConnection('disconnected')
      setGmailEmail(null)
    }
  }, [])

  /**
   * Sync now — fetch and parse new emails from Gmail.
   */
  const syncNow = useCallback(
    async (senders?: string[]) => {
      setSyncStatus('syncing')
      setProgress({ current: 0, total: 0 })
      setError(null)
      
      try {
        const response = await fetch('/api/gmail/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ senders })
        })

        if (!response.ok) {
          if (response.status === 401) {
            setConnection('expired')
            setError('Gmail connection expired. Please reconnect.')
            setSyncStatus('error')
            return
          }
          const errBody = await response
            .json()
            .catch(() => ({ error: 'Sync failed' }))
          throw new Error(errBody.error ?? 'Sync failed')
        }

        const data: SyncResponse = await response.json()

        // Save new imports to localStorage
        const existing = getAllImports()
        saveImports([...existing, ...data.imported])

        // Update stats
        const currentStats = getStats()
        updateStats({
          lastSyncAt: new Date().toISOString(),
          totalEmailsFound: currentStats.totalEmailsFound + data.total,
          newImports: currentStats.newImports + data.new,
          skippedDuplicates: currentStats.skippedDuplicates + data.skipped,
          totalPending: currentStats.totalPending + data.new
        })

        setProgress({ current: data.total, total: data.total })
        refreshData()
        setSyncStatus('complete')
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Sync failed'
        setError(message)
        setSyncStatus('error')
      }
    },
    [refreshData]
  )

  /**
   * Approve an imported transaction.
   * Fully client-side — the data lives in localStorage, no server call needed.
   */
  const approve = useCallback(
    async (
      id: string,
      _account: string,
      _overrides?: ReviewRequest['overrides']
    ): Promise<boolean> => {
      try {
        const transactionId = uuidv4()

        updateImportStatus(
          id,
          'approved',
          new Date().toISOString(),
          transactionId
        )

        const currentStats = getStats()
        updateStats({
          totalApproved: currentStats.totalApproved + 1,
          totalPending: Math.max(0, currentStats.totalPending - 1)
        })

        refreshData()
        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Approval failed'
        setError(message)
        return false
      }
    },
    [refreshData]
  )

  /**
   * Reject an imported transaction.
   * Fully client-side — the data lives in localStorage, no server call needed.
   */
  const reject = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        updateImportStatus(id, 'rejected', new Date().toISOString(), null)

        const currentStats = getStats()
        updateStats({
          totalRejected: currentStats.totalRejected + 1,
          totalPending: Math.max(0, currentStats.totalPending - 1)
        })

        refreshData()
        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Rejection failed'
        setError(message)
        return false
      }
    },
    [refreshData]
  )

  /**
   * Filter imports by status.
   */
  const getImportsByStatus = useCallback(
    (status: ImportedTransaction['status']): ImportedTransaction[] => {
      return imports.filter((t) => t.status === status)
    },
    [imports]
  )

  return {
    connection,
    gmailEmail,
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
  }
}
