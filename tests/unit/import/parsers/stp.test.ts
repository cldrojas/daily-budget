import { describe, it, expect } from 'vitest'
import { STPParser } from '@/lib/import/parsers/stp'

const parser = new STPParser()

describe('STPParser', () => {
  it('has correct bank name', () => {
    expect(parser.bank).toBe('STP')
  })

  it('matches stp.com.mx sender', () => {
    expect(parser.senderPattern.test('notificaciones@stp.com.mx')).toBe(true)
  })

  it('matches transferencia subdomain', () => {
    expect(parser.senderPattern.test('transferencia@stp.com.mx')).toBe(true)
  })

  it('rejects non-matching sender', () => {
    expect(parser.senderPattern.test('no-reply@mercadopago.com')).toBe(false)
  })

  describe('parse', () => {
    it('parses transferencia (income) with MXN format', () => {
      const result = parser.parse('Fecha: 15/03/2024', 'Transferencia de Juan Perez CLABE 1234567890 por $1.500,00', '')
      expect(result.amount).toBe(150000)
      expect(result.entity).toBe('Juan Perez')
      expect(result.type).toBe('income')
      expect(result.date).toBe('2024-03-15')
      expect(result.confidence).toBe(0.95)
    })

    it('parses pago de servicio (expense) with MXN format', () => {
      const result = parser.parse('Fecha: 20/03/2024', 'Pago de servicio CFE $500,00', '')
      expect(result.amount).toBe(50000)
      expect(result.entity).toBe('CFE')
      expect(result.type).toBe('expense')
      expect(result.date).toBe('2024-03-20')
      expect(result.confidence).toBe(0.95)
    })

    it('extracts date from body', () => {
      const result = parser.parse('Fecha de operacion: 15/03/2024', 'Transferencia de Maria CLABE 1234 por $2.000,00', '')
      expect(result.date).toBe('2024-03-15')
    })

    it('returns empty result for empty subject', () => {
      const result = parser.parse('body', '', 'snippet')
      expect(result.amount).toBeNull()
      expect(result.confidence).toBe(0)
    })

    it('returns zero confidence when regex does not match', () => {
      const result = parser.parse('', 'Transferencia de Juan CLABE 1234 por $ABC', '')
      expect(result.confidence).toBe(0)
    })
  })
})
