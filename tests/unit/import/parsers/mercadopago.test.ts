import { describe, it, expect } from 'vitest'
import { MercadoPagoParser } from '@/lib/import/parsers/mercadopago'

const parser = new MercadoPagoParser()

describe('MercadoPagoParser', () => {
  it('has correct bank name', () => {
    expect(parser.bank).toBe('Mercado Pago')
  })

  it('matches sender', () => {
    expect(parser.senderPattern.test('no-reply@mercadopago.com')).toBe(true)
    expect(parser.senderPattern.test('pagorecibido@mercadopago.com')).toBe(true)
  })

  it('rejects non-matching sender', () => {
    expect(parser.senderPattern.test('notificaciones@bancoestado.cl')).toBe(false)
  })

  describe('parse', () => {
    it('parses compra (expense)', () => {
      const result = parser.parse('', 'Compra en Netflix por $1,500.00', '')
      expect(result.amount).toBe(150000)
      expect(result.entity).toBe('Netflix')
      expect(result.type).toBe('expense')
      expect(result.confidence).toBe(0.95)
    })

    it('parses pago recibido (income)', () => {
      const result = parser.parse('', 'Recibiste un pago de Carlos Gomez por $500.00', '')
      expect(result.amount).toBe(50000)
      expect(result.entity).toBe('Carlos Gomez')
      expect(result.type).toBe('income')
      expect(result.confidence).toBe(0.95)
    })

    it('parses pago a merchant (expense)', () => {
      const result = parser.parse('', 'Pago a MercadoLibre por $2,000.00', '')
      expect(result.amount).toBe(200000)
      expect(result.entity).toBe('MercadoLibre')
      expect(result.type).toBe('expense')
      expect(result.confidence).toBe(0.95)
    })

    it('handles entity with numbers', () => {
      const result = parser.parse('', 'Compra en Tienda 123 por $500.00', '')
      expect(result.entity).toBe('Tienda 123')
    })

    it('returns empty result for empty subject', () => {
      const result = parser.parse('body', '', 'snippet')
      expect(result.amount).toBeNull()
      expect(result.confidence).toBe(0)
    })

    it('returns zero confidence when regex does not match', () => {
      const result = parser.parse('', 'Compra en Tienda por $ABC', '')
      expect(result.confidence).toBe(0)
    })
  })
})
