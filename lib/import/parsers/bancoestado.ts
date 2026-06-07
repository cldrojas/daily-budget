import type { EmailParser, ParsedResult } from './base'
import { normalizeAmount, normalizeDate, normalizeEntity } from '../utils'

/**
 * BancoEstado (Chile) — notification parser.
 *
 * Sender: notificaciones@bancoestado.cl
 * Formats:
 *   "Transferencia recibida de {entity} por ${amount}"  → income
 *   "Compra en {merchant} por ${amount}"                 → expense
 *   "Abono de ${amount} de {entity}"                     → income
 * Amount format: CLP (dot = thousands, no decimals)
 */
export class BancoEstadoParser implements EmailParser {
  bank = 'BancoEstado'
  senderPattern = /notificaciones@bancoestado\.cl$/i

  parse(_body: string, subject: string, _snippet: string): ParsedResult {
    if (!subject) {
      return { amount: null, entity: null, date: null, type: null, confidence: 0 }
    }

    // Transferencia recibida de {entity} por ${amount}
    const transferMatch = subject.match(
      /Transferencia recibida de\s+(?<entity>[A-ZÁÉÍÓÚÑa-záéíóúñ\s]+)\s+por\s+\$?\s*(?<amount>[\d.]+)/i
    )
    if (transferMatch) {
      const amount = normalizeAmount(transferMatch.groups!.amount, 'CLP')
      const entity = normalizeEntity(transferMatch.groups!.entity)
      return {
        amount,
        entity,
        date: extractDateFromSubjectOrBody(subject, _body),
        type: 'income',
        confidence: amount !== null ? 0.95 : 0.5,
      }
    }

    // Compra en {merchant} por ${amount}
    const compraMatch = subject.match(
      /Compra\s+en\s+(?<entity>[A-ZÁÉÍÓÚÑa-záéíóúñ\s]+)\s+por\s+\$?\s*(?<amount>[\d.]+)/i
    )
    if (compraMatch) {
      const amount = normalizeAmount(compraMatch.groups!.amount, 'CLP')
      const entity = normalizeEntity(compraMatch.groups!.entity)
      return {
        amount,
        entity,
        date: extractDateFromSubjectOrBody(subject, _body),
        type: 'expense',
        confidence: amount !== null ? 0.95 : 0.5,
      }
    }

    // Abono de ${amount} de {entity}
    const abonoMatch = subject.match(
      /Abono\s+de\s+\$?\s*(?<amount>[\d.]+)\s+de\s+(?<entity>[A-ZÁÉÍÓÚÑa-záéíóúñ\s]+)/i
    )
    if (abonoMatch) {
      const amount = normalizeAmount(abonoMatch.groups!.amount, 'CLP')
      const entity = normalizeEntity(abonoMatch.groups!.entity)
      return {
        amount,
        entity,
        date: extractDateFromSubjectOrBody(subject, _body),
        type: 'income',
        confidence: amount !== null ? 0.95 : 0.5,
      }
    }

    return { amount: null, entity: null, date: null, type: null, confidence: 0 }
  }
}

function extractDateFromSubjectOrBody(_subject: string, _body: string): string | null {
  // Try to extract date from body — banks often include it
  const dateMatch = _body.match(/(\d{1,2}[\/-]\d{1,2}[\/-]\d{4})/)
  if (dateMatch) {
    return normalizeDate(dateMatch[1]!)
  }
  return null
}
