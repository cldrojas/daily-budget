import type { TransactionType, Int } from '@/types'

export type ParsedResult = {
  amount: Int | null
  entity: string | null
  date: string | null      // ISO 8601
  type: TransactionType | null
  confidence: number        // 0.0 – 1.0
}

export interface EmailParser {
  bank: string
  senderPattern: RegExp
  parse(body: string, subject: string, snippet: string): ParsedResult
}

/**
 * Helper: extract a named group or return null.
 */
export function group(match: RegExpMatchArray, name: string): string | null {
  return (match.groups && match.groups[name]) ?? null
}
