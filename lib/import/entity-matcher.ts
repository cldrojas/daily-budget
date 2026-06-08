import type { Account } from '@/types'

/**
 * Convert an entity/merchant name to a URL-safe slug.
 * @example entityToSlug('NETFLIX') // 'netflix'
 * @example entityToSlug('Mercado Pago') // 'mercado-pago'
 */
export function entityToSlug(entity: string): string {
  return entity.toLowerCase().replace(/\s+/g, '-')
}

/**
 * Find an existing account that matches a given entity by slug comparison.
 * If entity is null/empty, returns undefined.
 */
export function findAccountByEntity(
  accounts: Account[],
  entity: string | null,
): Account | undefined {
  if (!entity) return undefined
  const slug = entityToSlug(entity)
  return accounts.find((a) => a.id === slug)
}

/**
 * Generate a safe slug for a new account name, avoiding collisions with existing slugs.
 * If the base slug already exists, appends -1, -2, etc.
 */
export function generateSafeSlug(name: string, existingSlugs: string[]): string {
  const base = entityToSlug(name)
  if (!existingSlugs.includes(base)) return base

  let counter = 1
  while (existingSlugs.includes(`${base}-${counter}`)) {
    counter++
  }
  return `${base}-${counter}`
}
