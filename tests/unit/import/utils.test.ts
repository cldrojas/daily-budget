import { describe, it, expect } from 'vitest'
import { normalizeAmount, normalizeDate, normalizeEntity, detectLocale } from '@/lib/import/utils'

describe('normalizeAmount', () => {
  // ── CLP ──────────────────────────────────────────────────────────
  it('parses CLP with dot thousands, no decimals', () => {
    expect(normalizeAmount('1.500', 'CLP')).toBe(1500)
  })

  it('parses CLP without separator', () => {
    expect(normalizeAmount('500', 'CLP')).toBe(500)
  })

  it('parses CLP with multiple thousands dots', () => {
    expect(normalizeAmount('1.500.000', 'CLP')).toBe(1500000)
  })

  it('strips $ symbol for CLP', () => {
    expect(normalizeAmount('$2.000', 'CLP')).toBe(2000)
  })

  it('strips whitespace for CLP', () => {
    expect(normalizeAmount('  1.000  ', 'CLP')).toBe(1000)
  })

  // ── USD ───────────────────────────────────────────────────────────
  it('parses USD with comma thousands and dot decimal', () => {
    expect(normalizeAmount('1,500.00', 'USD')).toBe(150000)
  })

  it('parses USD small amount', () => {
    expect(normalizeAmount('25.50', 'USD')).toBe(2550)
  })

  it('parses USD whole number (no cents)', () => {
    expect(normalizeAmount('1,000', 'USD')).toBe(100000)
  })

  it('strips $ symbol for USD', () => {
    expect(normalizeAmount('$49.99', 'USD')).toBe(4999)
  })

  // ── MXN / ARS ────────────────────────────────────────────────────
  it('parses MXN with dot thousands and comma decimal', () => {
    expect(normalizeAmount('1.500,00', 'MXN')).toBe(150000)
  })

  it('parses ARS format', () => {
    expect(normalizeAmount('500,50', 'ARS')).toBe(50050)
  })

  it('parses MXN small amount', () => {
    expect(normalizeAmount('25,00', 'MXN')).toBe(2500)
  })

  // ── Fallback ──────────────────────────────────────────────────────
  it('parses CLP fallback (no locale, dot separator)', () => {
    expect(normalizeAmount('500')).toBe(500)
  })

  it('parses fallback with decimal', () => {
    expect(normalizeAmount('25.50')).toBe(2550)
  })

  it('parses fallback with two-digit decimal', () => {
    expect(normalizeAmount('100.99')).toBe(10099)
  })

  // ── Edge cases ────────────────────────────────────────────────────
  it('returns null for empty string', () => {
    expect(normalizeAmount('')).toBeNull()
  })

  it('returns null for non-string', () => {
    expect(normalizeAmount(null as unknown as string)).toBeNull()
    expect(normalizeAmount(undefined as unknown as string)).toBeNull()
  })

  it('returns null for unparseable string', () => {
    expect(normalizeAmount('abc')).toBeNull()
  })

  it('handles euro symbol', () => {
    expect(normalizeAmount('€10,00', 'MXN')).toBe(1000)
  })
})

describe('normalizeDate', () => {
  it('passes through ISO 8601', () => {
    expect(normalizeDate('2024-03-15')).toBe('2024-03-15')
  })

  it('truncates ISO with time', () => {
    expect(normalizeDate('2024-03-15T10:30:00Z')).toBe('2024-03-15')
  })

  it('parses dd/mm/yyyy', () => {
    expect(normalizeDate('15/03/2024')).toBe('2024-03-15')
  })

  it('parses dd-mm-yyyy', () => {
    expect(normalizeDate('15-03-2024')).toBe('2024-03-15')
  })

  it('pads single digit day and month', () => {
    expect(normalizeDate('3/5/2024')).toBe('2024-05-03')
  })

  it('parses Spanish "dd de mes de yyyy"', () => {
    expect(normalizeDate('15 de marzo de 2024')).toBe('2024-03-15')
  })

  it('parses Spanish "dd de mes de yyyy" (full form)', () => {
    expect(normalizeDate('1 de enero de 2024')).toBe('2024-01-01')
  })

  it('parses Spanish "dd de mes d yyyy" (shortened de)', () => {
    expect(normalizeDate('1 de enero d 2024')).toBe('2024-01-01')
  })

  it('handles all Spanish months', () => {
    expect(normalizeDate('1 de enero de 2024')).toBe('2024-01-01')
    expect(normalizeDate('1 de febrero de 2024')).toBe('2024-02-01')
    expect(normalizeDate('1 de marzo de 2024')).toBe('2024-03-01')
    expect(normalizeDate('1 de abril de 2024')).toBe('2024-04-01')
    expect(normalizeDate('1 de mayo de 2024')).toBe('2024-05-01')
    expect(normalizeDate('1 de junio de 2024')).toBe('2024-06-01')
    expect(normalizeDate('1 de julio de 2024')).toBe('2024-07-01')
    expect(normalizeDate('1 de agosto de 2024')).toBe('2024-08-01')
    expect(normalizeDate('1 de septiembre de 2024')).toBe('2024-09-01')
    expect(normalizeDate('1 de octubre de 2024')).toBe('2024-10-01')
    expect(normalizeDate('1 de noviembre de 2024')).toBe('2024-11-01')
    expect(normalizeDate('1 de diciembre de 2024')).toBe('2024-12-01')
  })

  it('returns null for empty string', () => {
    expect(normalizeDate('')).toBeNull()
  })

  it('returns null for unparseable string', () => {
    expect(normalizeDate('not a date')).toBeNull()
  })
})

describe('normalizeEntity', () => {
  it('trims whitespace', () => {
    expect(normalizeEntity('  JUAN PEREZ  ')).toBe('JUAN PEREZ')
  })

  it('collapses multiple spaces', () => {
    expect(normalizeEntity('JUAN   PEREZ')).toBe('JUAN PEREZ')
  })

  it('returns null for empty string', () => {
    expect(normalizeEntity('')).toBeNull()
  })

  it('returns null for null/undefined', () => {
    expect(normalizeEntity(null as unknown as string)).toBeNull()
    expect(normalizeEntity(undefined as unknown as string)).toBeNull()
  })
})

describe('detectLocale', () => {
  it('detects CLP for BancoEstado', () => {
    expect(detectLocale('notificaciones@bancoestado.cl')).toBe('CLP')
  })

  it('detects USD for Mercado Pago', () => {
    expect(detectLocale('no-reply@mercadopago.com')).toBe('USD')
  })

  it('detects MXN for STP', () => {
    expect(detectLocale('notificaciones@stp.com.mx')).toBe('MXN')
  })

  it('detects MXN for STP transferencia subdomain', () => {
    expect(detectLocale('transferencia@stp.com.mx')).toBe('MXN')
  })

  it('defaults to CLP for unknown sender', () => {
    expect(detectLocale('some-unknown@bank.com')).toBe('CLP')
  })

  it('is case insensitive', () => {
    expect(detectLocale('NO-REPLY@MERCADOPAGO.COM')).toBe('USD')
  })
})
