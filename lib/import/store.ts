import type { ImportedTransaction } from '@/types'
import type { ImportStats } from './types'
import { createEmptyStats } from './types'

// ── localStorage Keys ───────────────────────────────────────────────

const IMPORTS_KEY = 'saldo-cero-import'
const STATS_KEY = 'saldo-cero-import-stats'

// ── Imported Transactions ───────────────────────────────────────────

/**
 * Get all imported transactions from localStorage.
 */
export function getAllImports(): ImportedTransaction[] {
  console.log(`DEBUG:gettingAllImports:`)
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(IMPORTS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as ImportedTransaction[]
  } catch {
    return []
  }
}

/**
 * Replace all imported transactions (bulk save).
 */
export function saveImports(txns: ImportedTransaction[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(IMPORTS_KEY, JSON.stringify(txns))
  } catch (e) {
    console.error('[saldo-cero] Failed to save imports:', e)
  }
}

/**
 * Append a single new imported transaction.
 */
export function addImport(txn: ImportedTransaction): void {
  const all = getAllImports()
  all.push(txn)
  saveImports(all)
}

/**
 * Update the status (and optional reviewedAt / transactionId) of a single import.
 */
export function updateImportStatus(
  id: string,
  status: ImportedTransaction['status'],
  reviewedAt?: string,
  transactionId?: string | null
): void {
  const all = getAllImports()
  const idx = all.findIndex((t) => t.id === id)
  if (idx === -1) return

  all[idx]!.status = status
  if (reviewedAt !== undefined) all[idx]!.reviewedAt = reviewedAt
  if (transactionId !== undefined) all[idx]!.transactionId = transactionId
  all[idx]!.updatedAt = new Date().toISOString()

  saveImports(all)
}

/**
 * Get a single imported transaction by ID.
 */
export function getImportById(id: string): ImportedTransaction | null {
  const all = getAllImports()
  return all.find((t) => t.id === id) ?? null
}

/**
 * Build a Set of all existing gmailMessageId values for dedup checks.
 */
export function getDedupSet(): Set<string> {
  const all = getAllImports()
  return new Set(all.map((t) => t.gmailMessageId))
}

/**
 * Clear all imported transactions from localStorage.
 */
export function clearAllImports(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(IMPORTS_KEY)
  } catch (e) {
    console.error('[saldo-cero] Failed to clear imports:', e)
  }
}

// ── Import Stats ────────────────────────────────────────────────────

export function getStats(): ImportStats {
  if (typeof window === 'undefined') return createEmptyStats()
  try {
    const raw = localStorage.getItem(STATS_KEY)
    if (!raw) return createEmptyStats()
    return JSON.parse(raw) as ImportStats
  } catch {
    return createEmptyStats()
  }
}

export function saveStats(stats: ImportStats): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats))
  } catch (e) {
    console.error('[saldo-cero] Failed to save stats:', e)
  }
}

export function updateStats(partial: Partial<ImportStats>): ImportStats {
  const current = getStats()
  const updated = { ...current, ...partial }
  saveStats(updated)
  return updated
}

/**
 * Increment a single numeric stat field.
 */
export function incrementStats<K extends keyof ImportStats>(
  field: K,
  amount: number = 1
): void {
  const current = getStats()
  const val = current[field]
  if (typeof val === 'number') {
    ;(current as Record<string, unknown>)[field] = val + amount
  }
  saveStats(current)
}
