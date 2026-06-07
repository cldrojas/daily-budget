import { describe, it, expect, beforeEach } from 'vitest'
import { ParserRegistry, getDefaultRegistry } from '@/lib/import/parsers/registry'
import { BancoEstadoParser } from '@/lib/import/parsers/bancoestado'
import { GenericFallbackParser } from '@/lib/import/parsers/generic'

describe('ParserRegistry', () => {
  let registry: ParserRegistry

  beforeEach(() => {
    registry = new ParserRegistry()
  })

  it('registers default parsers on construction', () => {
    const banks = registry.getRegisteredBanks()
    expect(banks.map(b => b.bank)).toContain('BancoEstado')
    expect(banks.map(b => b.bank)).toContain('Mercado Pago')
    expect(banks.map(b => b.bank)).toContain('STP')
  })

  it('matches BancoEstado sender', () => {
    const parser = registry.match('notificaciones@bancoestado.cl')
    expect(parser).toBeInstanceOf(BancoEstadoParser)
  })

  it('matches MercadoPago sender', () => {
    const parser = registry.match('no-reply@mercadopago.com')
    expect(parser.bank).toBe('Mercado Pago')
  })

  it('falls back to generic for unknown sender', () => {
    const parser = registry.match('unknown@somebank.com')
    expect(parser).toBeInstanceOf(GenericFallbackParser)
  })

  it('parses email by sender', () => {
    const result = registry.parse(
      '',
      'Transferencia recibida de Juan Perez por $50.000',
      '',
      'notificaciones@bancoestado.cl'
    )
    expect(result.amount).toBe(50000)
    expect(result.type).toBe('income')
  })

  it('falls back to generic parse for unknown sender', () => {
    const result = registry.parse(
      '',
      'Payment of $25.00 received',
      '',
      'unknown@somebank.com'
    )
    expect(result.amount).toBe(2500)
  })

  it('returns null bank name for unknown sender', () => {
    expect(registry.getBankName('unknown@somebank.com')).toBeNull()
  })

  it('returns bank name for known sender', () => {
    expect(registry.getBankName('notificaciones@bancoestado.cl')).toBe('BancoEstado')
  })

  it('allows registering custom parser', () => {
    const customParser = new BancoEstadoParser()
    registry.register(customParser)
    const banks = registry.getRegisteredBanks()
    expect(banks.length).toBeGreaterThanOrEqual(4)
  })
})

describe('getDefaultRegistry', () => {
  it('returns singleton instance', () => {
    const a = getDefaultRegistry()
    const b = getDefaultRegistry()
    expect(a).toBe(b)
  })
})
