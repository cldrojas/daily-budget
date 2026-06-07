import type { EmailParser, ParsedResult } from './base'
import { normalizeAmount, normalizeDate, normalizeEntity } from '../utils'

/**
 * STP (Sistema de Pagos Electrónicos — México) notification parser.
 *
 * Sender: notificaciones@stp.com.mx or transferencia@stp.com.mx
 * Formats:
 *   "Transferencia de {entity} CLABE {digits} por $X,XXX.XX"   → income
 *   "Pago de servicio {service} $X,XXX.XX"                      → expense
 * Amount format: MXN (dot = thousands, comma = decimal)
 */
export class STPParser implements EmailParser {
  bank = 'STP'
  senderPattern = /@stp\.com\.mx$/i

  parse(_body: string, subject: string, _snippet: string): ParsedResult {
    if (!subject) {
      return { amount: null, entity: null, date: null, type: null, confidence: 0 }
    }

    // Transferencia de {entity} CLABE {digits} por $X,XXX.XX
    const transferMatch = subject.match(
      /Transferencia\s+de\s+(?<entity>[A-ZÁÉÍÓÚÑa-záéíóúñ\s]+?)\s+CLABE\s+\d+\s+por\s+\$?\s*(?<amount>[\d.,]+)/i
    )
    if (transferMatch) {
      const amount = normalizeAmount(transferMatch.groups!.amount, 'MXN')
      const entity = normalizeEntity(transferMatch.groups!.entity)
      return {
        amount,
        entity,
        date: extractDateFromBody(_body),
        type: 'income',
        confidence: amount !== null ? 0.95 : 0.5,
      }
    }

    // Pago de servicio {service} $X,XXX.XX
    const servicioMatch = subject.match(
      /Pago\s+de\s+servicio\s+(?<entity>[A-ZÁÉÍÓÚÑa-záéíóúñ\s]+?)\s+\$?\s*(?<amount>[\d.,]+)/i
    )
    if (servicioMatch) {
      const amount = normalizeAmount(servicioMatch.groups!.amount, 'MXN')
      const entity = normalizeEntity(servicioMatch.groups!.entity)
      return {
        amount,
        entity,
        date: extractDateFromBody(_body),
        type: 'expense',
        confidence: amount !== null ? 0.95 : 0.5,
      }
    }

    return { amount: null, entity: null, date: null, type: null, confidence: 0 }
  }
}

function extractDateFromBody(body: string): string | null {
  const dateMatch = body.match(/(\d{1,2}[\/-]\d{1,2}[\/-]\d{4})/)
  if (dateMatch) {
    return normalizeDate(dateMatch[1]!)
  }
  return normalizeDate(new Date().toISOString())
}
