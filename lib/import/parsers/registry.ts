import type { EmailParser, ParsedResult } from './base'
import { BancoEstadoParser } from './bancoestado'
import { MercadoPagoParser } from './mercadopago'
import { STPParser } from './stp'
import { GenericFallbackParser } from './generic'

/**
 * ParserRegistry — routes email sender addresses to the correct parser.
 *
 * Usage:
 *   const registry = new ParserRegistry()
 *   const parser = registry.match("no-reply@mercadopago.com")
 *   const result = parser.parse(body, subject, snippet)
 */
export class ParserRegistry {
  private parsers: EmailParser[] = []
  private fallback: EmailParser

  constructor() {
    this.fallback = new GenericFallbackParser()
    this.registerDefault()
  }

  private registerDefault(): void {
    this.register(new BancoEstadoParser())
    this.register(new MercadoPagoParser())
    this.register(new STPParser())
  }

  register(parser: EmailParser): void {
    this.parsers.push(parser)
  }

  /**
   * Find the best parser for a given sender email address.
   * Falls back to GenericFallbackParser if no specific parser matches.
   */
  match(sender: string): EmailParser {
    const lower = sender.toLowerCase()
    for (const parser of this.parsers) {
      if (parser.senderPattern.test(lower)) {
        console.log(`DEBUG:match sender ${sender}:`, parser)
        return parser
      }
    }
    return this.fallback
  }

  /**
   * Parse an email by matching the sender to a parser.
   */
  parse(
    body: string,
    subject: string,
    snippet: string,
    sender: string
  ): ParsedResult {
    const parser = this.match(sender)
    return parser.parse(body, subject, snippet)
  }

  /**
   * Get the bank display name for a given sender.
   * Returns null if only the generic fallback would handle it.
   */
  getBankName(sender: string): string | null {
    const parser = this.match(sender)
    return parser instanceof GenericFallbackParser ? null : parser.bank
  }

  /**
   * List all registered bank-specific parsers (excluding generic fallback).
   */
  getRegisteredBanks(): { bank: string; senderPattern: RegExp }[] {
    return this.parsers.map((p) => ({
      bank: p.bank,
      senderPattern: p.senderPattern
    }))
  }
}

// Singleton for app-wide use
let _defaultRegistry: ParserRegistry | null = null

export function getDefaultRegistry(): ParserRegistry {
  if (!_defaultRegistry) {
    _defaultRegistry = new ParserRegistry()
  }
  return _defaultRegistry
}
