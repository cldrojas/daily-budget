import { describe, it, expect } from 'vitest'
import { GenericFallbackParser } from '@/lib/import/parsers/generic'

const parser = new GenericFallbackParser()

describe('GenericFallbackParser', () => {
  it('has correct bank name', () => {
    expect(parser.bank).toBe('Unknown')
  })

  it('matches everything', () => {
    expect(parser.senderPattern.test('anything@example.com')).toBe(true)
    expect(parser.senderPattern.test('')).toBe(true)
  })

  describe('parse', () => {
    it('extracts amount from subject', () => {
      const result = parser.parse('', 'Your payment of $50.00 was received', '')
      expect(result.amount).toBe(5000)
      expect(result.confidence).toBeGreaterThanOrEqual(0.6)
    })

    it('extracts entity after "en" keyword', () => {
      const result = parser.parse('', 'Compra en Amazon por $100.00', '')
      expect(result.entity).toBe('Amazon')
      expect(result.amount).toBe(10000)
    })

    it('extracts multi-word entity', () => {
      const result = parser.parse('', 'Compra en Supermercado Lider por $50.00', '')
      expect(result.entity).toBe('Supermercado Lider')
      expect(result.amount).toBe(5000)
    })

    it('detects expense type from keywords', () => {
      const result = parser.parse('', 'Compra realizada por $25.00', '')
      expect(result.type).toBe('expense')
    })

    it('detects income type from keywords', () => {
      const result = parser.parse('', 'Deposit received for $500.00', '')
      expect(result.type).toBe('income')
    })

    it('extracts date from body', () => {
      const result = parser.parse('Transaction date: 15/03/2024', 'Payment of $100.00', '')
      expect(result.date).toBe('2024-03-15')
    })

    it('returns zero confidence when no amount found', () => {
      const result = parser.parse('', 'Hello, this is a test email with no numbers', '')
      expect(result.amount).toBeNull()
      expect(result.confidence).toBe(0)
    })

    it('returns empty result for empty input', () => {
      const result = parser.parse('', '', '')
      expect(result.amount).toBeNull()
      expect(result.entity).toBeNull()
      expect(result.date).toBeNull()
      expect(result.type).toBeNull()
      expect(result.confidence).toBe(0)
    })

    it('combines subject, snippet, and body for extraction', () => {
      const result = parser.parse('Fecha: 01/01/2024', 'Compra Tienda', 'Total $100.00')
      expect(result.amount).toBe(10000)
      expect(result.date).toBe('2024-01-01')
    })

    it('confidence capped at 0.6 for generic', () => {
      const result = parser.parse('date 15/03/2024', 'Compra en Walmart por $50.00', '')
      // base 0.6 + entity 0.1 + type 0.1 + date 0.1 = 0.9, capped at 0.6
      expect(result.confidence).toBe(0.6)
    })
  })
})
