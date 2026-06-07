import { toInt, type Int } from '@/types'

/**
 * Normalize a monetary amount string to integer cents.
 *
 * Locale rules:
 *  - CLP: dot = thousands separator, no decimals  → "$1.500" → 1500
 *  - USD: comma = thousands, dot = decimals       → "$1,500.00" → 150000
 *  - ARS/MXN: dot = thousands, comma = decimals   → "$1.500,00" → 150000
 *
 * @param raw  The raw amount string (may include $, symbols, whitespace).
 * @param locale  Locale hint: "CLP", "USD", "ARS", "MXN".
 * @returns Amount in cents as Int, or null if unparseable.
 */
export function normalizeAmount(raw: string, locale?: string): Int | null {
  if (!raw || typeof raw !== 'string') return null

  // Strip known currency symbols and whitespace
  let cleaned = raw
    .replace(/[$£€R$\s]/g, '')
    .trim()

  if (!cleaned) return null

  const localeKey = (locale ?? 'CLP').toUpperCase()

  // CLP: dot as thousands separator (e.g. "1.500")
  if (localeKey === 'CLP') {
    // Remove dots, parse as integer
    const digits = cleaned.replace(/\./g, '')
    return toInt(digits)
  }

  // USD-like: comma as thousands separator, dot as decimal (e.g. "1,500.00")
  if (localeKey === 'USD') {
    const withoutCommas = cleaned.replace(/,/g, '')
    const float = parseFloat(withoutCommas)
    if (isNaN(float)) return null
    return toInt(Math.round(float * 100))
  }

  // ARS/MXN: dot as thousands separator, comma as decimal (e.g. "1.500,00")
  if (localeKey === 'ARS' || localeKey === 'MXN') {
    const normalized = cleaned.replace(/\./g, '').replace(',', '.')
    const float = parseFloat(normalized)
    if (isNaN(float)) return null
    return toInt(Math.round(float * 100))
  }

  // Fallback: try to extract any number, assume CLP-style if no decimals
  const numberMatch = cleaned.match(/^(\d+)(?:[.,](\d{1,2}))?$/)
  if (!numberMatch) return null

  const whole = numberMatch[1]!
  const decimal = numberMatch[2]

  if (decimal) {
    // Has decimal part → multiply by 100
    const padded = decimal.padEnd(2, '0').slice(0, 2)
    return toInt(`${whole}${padded}`)
  }

  // No decimals → treat as whole cents (CLP style)
  return toInt(whole)
}

/**
 * Normalize a date string to ISO 8601 (YYYY-MM-DD).
 *
 * Supports: dd/mm/yyyy, dd-mm-yyyy, "dd de mes de yyyy", ISO 8601.
 *
 * @param raw  Raw date string.
 * @returns ISO date string (YYYY-MM-DD) or null.
 */
export function normalizeDate(raw: string): string | null {
  if (!raw) return null

  const trimmed = raw.trim()

  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 10)
  }

  // dd/mm/yyyy or dd-mm-yyyy
  const slashMatch = trimmed.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/)
  if (slashMatch) {
    const [, dd, mm, yyyy] = slashMatch
    return `${yyyy}-${mm!.padStart(2, '0')}-${dd!.padStart(2, '0')}`
  }

  // "dd de mes de yyyy"
  const esMonthMap: Record<string, string> = {
    enero: '01', febrero: '02', marzo: '03', abril: '04',
    mayo: '05', junio: '06', julio: '07', agosto: '08',
    septiembre: '09', octubre: '10', noviembre: '11', diciembre: '12',
  }

  const esMatch = trimmed.match(
    /^(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de?\s*(\d{4})$/i
  )
  if (esMatch) {
    const [, dd, monthName, yyyy] = esMatch
    const mm = esMonthMap[monthName!.toLowerCase()]
    if (!mm) return null
    return `${yyyy}-${mm}-${dd!.padStart(2, '0')}`
  }

  return null
}

/**
 * Normalize an entity/merchant/person name: trim, collapse spaces.
 */
export function normalizeEntity(raw: string): string | null {
  if (!raw) return null
  return raw.trim().replace(/\s+/g, ' ') || null
}

// Known bank sender → locale map
const SENDER_LOCALE_MAP: Record<string, string> = {
  'bancoestado.cl': 'CLP',
  'mercadopago.com': 'USD',
  'stp.com.mx': 'MXN',
}

/**
 * Detect monetary locale from an email sender domain.
 */
export function detectLocale(senderDomain: string): string {
  const lower = senderDomain.toLowerCase()
  for (const [key, locale] of Object.entries(SENDER_LOCALE_MAP)) {
    if (lower.includes(key)) return locale
  }
  return 'CLP' // default
}
