import { describe, it, expect } from 'vitest'
import { entityToSlug, findAccountByEntity, generateSafeSlug } from '@/lib/import/entity-matcher'
import type { Account } from '@/types'

describe('entityToSlug', () => {
  it('converts lowercase text', () => {
    expect(entityToSlug('netflix')).toBe('netflix')
  })

  it('converts uppercase text to lowercase', () => {
    expect(entityToSlug('NETFLIX')).toBe('netflix')
  })

  it('replaces spaces with hyphens', () => {
    expect(entityToSlug('Mercado Pago')).toBe('mercado-pago')
  })

  it('collapses multiple spaces into single hyphen', () => {
    expect(entityToSlug('Mercado   Pago')).toBe('mercado-pago')
  })

  it('handles mixed case with spaces', () => {
    expect(entityToSlug('Juan Pérez Shop')).toBe('juan-pérez-shop')
  })

  it('returns empty string for empty input', () => {
    expect(entityToSlug('')).toBe('')
  })

  it('handles text with numbers', () => {
    expect(entityToSlug('Store 24/7')).toBe('store-24/7')
  })
})

describe('findAccountByEntity', () => {
  const accounts: Account[] = [
    { id: 'netflix', name: 'Netflix', type: 'expense', balance: 0 as any, icon: 'film' },
    { id: 'mercado-pago', name: 'Mercado Pago', type: 'expense', balance: 0 as any, icon: 'wallet' },
    { id: 'spotify', name: 'Spotify', type: 'expense', balance: 0 as any, icon: 'music' },
  ]

  it('finds account by exact entity match', () => {
    expect(findAccountByEntity(accounts, 'NETFLIX')?.id).toBe('netflix')
  })

  it('finds account by entity with spaces', () => {
    expect(findAccountByEntity(accounts, 'Mercado Pago')?.id).toBe('mercado-pago')
  })

  it('returns undefined when no match', () => {
    expect(findAccountByEntity(accounts, 'Amazon')).toBeUndefined()
  })

  it('returns undefined for null entity', () => {
    expect(findAccountByEntity(accounts, null)).toBeUndefined()
  })

  it('returns undefined for empty string entity', () => {
    expect(findAccountByEntity(accounts, '')).toBeUndefined()
  })

  it('handles empty accounts array', () => {
    expect(findAccountByEntity([], 'NETFLIX')).toBeUndefined()
  })
})

describe('generateSafeSlug', () => {
  it('returns base slug when no collision', () => {
    expect(generateSafeSlug('Netflix', ['spotify', 'mercado-pago'])).toBe('netflix')
  })

  it('appends -1 when base slug exists', () => {
    expect(generateSafeSlug('Netflix', ['netflix'])).toBe('netflix-1')
  })

  it('appends -2 when -1 also exists', () => {
    expect(generateSafeSlug('Netflix', ['netflix', 'netflix-1'])).toBe('netflix-2')
  })

  it('handles multiple collisions', () => {
    expect(generateSafeSlug('Netflix', ['netflix', 'netflix-1', 'netflix-2'])).toBe('netflix-3')
  })

  it('skips unrelated slugs', () => {
    expect(generateSafeSlug('Netflix', ['netflix-1', 'netflix-2'])).toBe('netflix')
  })

  it('returns safe slug when no existing slugs', () => {
    expect(generateSafeSlug('Netflix', [])).toBe('netflix')
  })
})
