import type { EmailParser, ParsedResult } from './base'
import { normalizeAmount, normalizeDate, normalizeEntity } from '../utils'

/**
 * Generic fallback parser — catch-all heuristic extraction.
 *
 * Used when no bank-specific parser matches the sender.
 *
 * Heuristics:
 *  - Amount: $ or currency symbol followed by digits (with optional , or .)
 *  - Entity: capitalized words near amount (en/a/de/por/para context)
 *  - Date: dd/mm/yyyy or dd-mm-yyyy patterns
 *
 * Confidence capped at 0.6 since no bank template matched.
 */
export class GenericFallbackParser implements EmailParser {
  bank = 'Unknown'
  senderPattern = /.*/ // catch-all

  parse(body: string, subject: string, snippet: string): ParsedResult {
    const combined = [subject, snippet, body].filter(Boolean).join(' ')

    if (!combined) {
      return { amount: null, entity: null, date: null, type: null, confidence: 0 }
    }

    // Amount: $ or currency symbol + digits
    const amountMatch = combined.match(
      /\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?)\b/
    )
    const amount = amountMatch ? normalizeAmount(amountMatch[1]!) : null

    // Entity: capitalized words near "en", "a", "de", "por", "para"
    const entityMatch = combined.match(
      /\b(?:en|a|de|por|para)\s+([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúñ]+)*)\s+(?:por|de|a)\b/i
    )
    const entity = entityMatch ? normalizeEntity(entityMatch[1]!) : null

    // Date: dd/mm/yyyy or dd-mm-yyyy
    const dateMatch = combined.match(/\b(\d{1,2}[\/-]\d{1,2}[\/-]\d{4})\b/)
    const date = dateMatch ? normalizeDate(dateMatch[1]!) : null

    // Type heuristic: keywords in body
    const lowCombined = combined.toLowerCase()
    let type: ParsedResult['type'] = null
    if (/\b(compra|pago|cargo|debito|payment|purchase|charge)\b/.test(lowCombined)) {
      type = 'expense'
    } else if (/\b(transferencia\s+recibida|abono|ingreso|pago\s+recibido|deposit|income)\b/.test(lowCombined)) {
      type = 'income'
    }

    // Confidence: capped at 0.6, lower if amount missing
    if (amount === null) {
      return { amount: null, entity, date, type, confidence: 0 }
    }

    let confidence = 0.6
    if (entity !== null) confidence += 0.1
    if (type !== null) confidence += 0.1
    if (date !== null) confidence += 0.1
    confidence = Math.min(confidence, 0.6) // cap for generic

    return { amount, entity, date, type, confidence }
  }
}
