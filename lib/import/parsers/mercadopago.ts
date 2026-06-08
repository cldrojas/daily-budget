import type { EmailParser, ParsedResult } from './base'
import { normalizeAmount, normalizeDate, normalizeEntity } from '../utils'

/**
 * Mercado Pago — notification parser.
 *
 * Sender: no-reply@mercadopago.com
 * Formats:
 *   "Compra en {entity} por $1,500.00"              → expense (USD format)
 *   "Recibiste un pago de {person} por $500.00"      → income
 *   "Pago a {merchant} por $250.00"                  → expense
 * Amount format: USD-like (comma = thousands, dot = decimals)
 */
export class MercadoPagoParser implements EmailParser {
  bank = 'Mercado Pago'
  senderPattern = /@mercadopago\.com$/i

  parse(_body: string, subject: string, _snippet: string): ParsedResult {
    if (!subject) {
      return {
        amount: null,
        entity: null,
        date: null,
        type: null,
        confidence: 0
      }
    }

    console.log(`DEBUG:running MercadoPago parser: \n======\n`)

    // Compra en {entity} por $X,XXX.XX
    const compraMatch = subject.match(
      /Compra\s+en\s+(?<entity>[A-ZÁÉÍÓÚÑa-záéíóúñ0-9\s]+)\s+por\s+\$?\s*(?<amount>[\d.,]+)/i
    )
    if (compraMatch) {
      console.log(`DEBUG:compraMatch:`, compraMatch)
      const amount = normalizeAmount(compraMatch.groups!.amount, 'USD')
      const entity = normalizeEntity(compraMatch.groups!.entity)
      return {
        amount,
        entity,
        date: normalizeDate(new Date().toISOString()),
        type: 'expense',
        confidence: amount !== null ? 0.95 : 0.5
      }
    }

    // Recibiste un pago de {person} por $X,XXX.XX
    const pagoMatch = subject.match(
      /Recibiste\s+un\s+pago\s+de\s+(?<entity>[A-ZÁÉÍÓÚÑa-záéíóúñ\s]+)\s+por\s+\$?\s*(?<amount>[\d.,]+)/i
    )
    if (pagoMatch) {
      console.log(`DEBUG:received pagoMatch:`, pagoMatch)
      const amount = normalizeAmount(pagoMatch.groups!.amount, 'USD')
      const entity = normalizeEntity(pagoMatch.groups!.entity)
      return {
        amount,
        entity,
        date: normalizeDate(new Date().toISOString()),
        type: 'income',
        confidence: amount !== null ? 0.95 : 0.5
      }
    }

    // Pago a {merchant} por $X,XXX.XX
    const pagoAMatch = subject.match(
      /Pago\s+a\s+(?<entity>[A-ZÁÉÍÓÚÑa-záéíóúñ\s]+)\s+por\s+\$?\s*(?<amount>[\d.,]+)/i
    )
    if (pagoAMatch) {
      console.log(`DEBUG:sent pagoMatch:`, pagoMatch)
      const amount = normalizeAmount(pagoAMatch.groups!.amount, 'USD')
      const entity = normalizeEntity(pagoAMatch.groups!.entity)
      return {
        amount,
        entity,
        date: normalizeDate(new Date().toISOString()),
        type: 'expense',
        confidence: amount !== null ? 0.95 : 0.5
      }
    }

    // Ya enviamos tu transferencia de $ X.XXX
    const transferenciaMatch = subject.match(
      /Ya\s+enviamos\s+tu\s+transferencia\s+de\s+\$?\s*(?<amount>[\d.,]+)/i
    )
    if (transferenciaMatch) {
      console.log(`DEBUG:transferenciaMatch:`, transferenciaMatch)
      const amount = normalizeAmount(transferenciaMatch.groups!.amount, 'USD')
      return {
        amount,
        entity: 'Mercado Pago',
        date: normalizeDate(new Date().toISOString()),
        type: 'income',
        confidence: amount !== null ? 0.95 : 0.5
      }
    }

    console.log(`DEBUG:returning empty by default:`)
    return { amount: null, entity: null, date: null, type: null, confidence: 0 }
  }
}
