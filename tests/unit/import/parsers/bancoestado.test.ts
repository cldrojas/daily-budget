import { describe, it, expect } from 'vitest'
import { BancoEstadoParser } from '@/lib/import/parsers/bancoestado'

const parser = new BancoEstadoParser()

describe('BancoEstadoParser', () => {
  it('has correct bank name', () => {
    expect(parser.bank).toBe('BancoEstado')
  })

  it('matches notification sender', () => {
    expect(parser.senderPattern.test('notificaciones@bancoestado.cl')).toBe(true)
    expect(parser.senderPattern.test('notificaciones@bancoestado.CL')).toBe(true)
  })

  it('rejects non-matching sender', () => {
    expect(parser.senderPattern.test('no-reply@mercadopago.com')).toBe(false)
  })

  describe('parse', () => {
    it('parses transferencia recibida (income)', () => {
      const result = parser.parse('', 'Transferencia recibida de Juan Perez por $50.000', '')
      expect(result.amount).toBe(50000)
      expect(result.entity).toBe('Juan Perez')
      expect(result.type).toBe('income')
      expect(result.confidence).toBe(0.95)
    })

    it('parses compra (expense)', () => {
      const result = parser.parse('', 'Compra en Supermercado Lider por $25.990', '')
      expect(result.amount).toBe(25990)
      expect(result.entity).toBe('Supermercado Lider')
      expect(result.type).toBe('expense')
      expect(result.confidence).toBe(0.95)
    })

    it('parses abono (income)', () => {
      const result = parser.parse('', 'Abono de $100.000 de Empresa SA', '')
      expect(result.amount).toBe(100000)
      expect(result.entity).toBe('Empresa SA')
      expect(result.type).toBe('income')
      expect(result.confidence).toBe(0.95)
    })

    it('extracts date from body', () => {
      const result = parser.parse('Fecha: 15/03/2024', 'Compra en Tienda X por $10.000', '')
      expect(result.date).toBe('2024-03-15')
    })

    it('returns zero confidence when regex does not match', () => {
      const result = parser.parse('', 'Transferencia recibida de Juan Perez por $ABC', '')
      expect(result.confidence).toBe(0)
    })

    it('returns empty result for empty subject', () => {
      const result = parser.parse('body', '', 'snippet')
      expect(result.amount).toBeNull()
      expect(result.confidence).toBe(0)
    })

    it('handles amount without $ symbol', () => {
      const result = parser.parse('', 'Transferencia recibida de Maria Lopez por 15.000', '')
      expect(result.amount).toBe(15000)
    })

    it('parses entity with accented characters', () => {
      const result = parser.parse('', 'Compra en Farmacia Ahumada por $12.000', '')
      expect(result.entity).toBe('Farmacia Ahumada')
    })
  })
})
