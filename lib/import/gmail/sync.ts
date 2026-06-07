import { OAuth2Client } from 'googleapis-common'
import { v4 as uuidv4 } from 'uuid'
import { GmailClient } from './client'
import { getDefaultRegistry } from '../parsers/registry'
import { getDedupSet } from '../store'
import type { ImportedTransaction } from '@/types'
import type { SyncResponse } from '../types'

const DEFAULT_SENDERS = [
  'notificaciones@bancoestado.cl',
  'no-reply@mercadopago.com',
  'notificaciones@stp.com.mx',
  'transferencia@stp.com.mx',
]

const DEFAULT_DAYS_BACK = 90
const DEFAULT_MAX_RESULTS = 50

/**
 * Build a Gmail search query from sender addresses.
 */
function buildQuery(senders: string[], daysBack: number): string {
  const date = new Date()
  date.setDate(date.getDate() - daysBack)
  const afterStr = date.toISOString().replace(/T.*$/, '')

  const senderQueries = senders.map(s => `from:${s}`).join(' OR ')
  return `(${senderQueries}) after:${afterStr}`
}

/**
 * Run a full sync cycle: list emails → dedup → fetch → parse → collect.
 */
export async function runSync(
  auth: OAuth2Client,
  options?: {
    senders?: string[]
    maxResults?: number
    daysBack?: number
  },
): Promise<SyncResponse> {
  const client = new GmailClient(auth)
  const registry = getDefaultRegistry()
  const dedupSet = getDedupSet()

  const senders = options?.senders?.length ? options.senders : DEFAULT_SENDERS
  const maxResults = options?.maxResults ?? DEFAULT_MAX_RESULTS
  const daysBack = options?.daysBack ?? DEFAULT_DAYS_BACK

  const query = buildQuery(senders, daysBack)

  // 1. Get message headers
  const headers = await client.listMessages(query, maxResults)

  // 2. Dedup check — skip already-imported messages
  const newHeaders = headers.filter(h => !dedupSet.has(h.id))
  const skipped = headers.length - newHeaders.length

  // 3. Fetch and parse each new message
  const imported: ImportedTransaction[] = []

  for (const header of newHeaders) {
    try {
      const full = await client.getMessage(header.id)
      const result = registry.parse(full.body, full.subject, full.snippet, full.from)

      const now = new Date().toISOString()

      const txn: ImportedTransaction = {
        id: uuidv4(),
        gmailMessageId: full.id,
        threadId: full.threadId,
        sender: full.from,
        bankName: registry.getBankName(full.from),
        parsedAmount: result.amount,
        parsedEntity: result.entity,
        parsedDate: result.date,
        parsedType: result.type,
        confidence: result.confidence,
        rawSubject: full.subject,
        rawSnippet: full.snippet,
        rawBody: full.body,
        status: result.confidence === 0 ? 'unparsed' : 'pending',
        reviewedAt: null,
        transactionId: null,
        createdAt: now,
        updatedAt: now,
      }

      imported.push(txn)
    } catch (err) {
      console.error(`[gmail-sync] Failed to process message ${header.id}:`, err)
      // Continue with remaining messages
    }
  }

  return {
    total: headers.length,
    new: imported.length,
    skipped,
    imported,
  }
}
