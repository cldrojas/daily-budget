import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBudget } from '@/hooks/use-budget'

// Basic smoke test for the hook to ensure initial state shapes are correct.
describe('useBudget hook', () => {
  it('initializes with default accounts and empty transactions', () => {
    const { result } = renderHook(() => useBudget())

    expect(result.current.accounts).toBeDefined()
    expect(Array.isArray(result.current.accounts)).toBe(true)
    expect(result.current.transactions).toBeDefined()
    expect(Array.isArray(result.current.transactions)).toBe(true)
  })
})
