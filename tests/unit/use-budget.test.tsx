import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBudget } from '@/hooks/use-budget'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock date-fns
vi.mock('date-fns', () => ({
  differenceInDays: vi.fn((date1, date2) => Math.floor((date1 - date2) / (1000 * 60 * 60 * 24))),
  startOfDay: vi.fn((date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())),
  isSameDay: vi.fn((date1, date2) => date1.toDateString() === date2.toDateString()),
  isToday: vi.fn((date) => new Date().toDateString() === date.toDateString()),
}))

// Mock uuid
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mock-uuid'),
}))

describe('useBudget hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  it('initializes with default accounts and empty transactions', () => {
    const { result } = renderHook(() => useBudget())

    expect(result.current.accounts).toBeDefined()
    expect(Array.isArray(result.current.accounts)).toBe(true)
    expect(result.current.accounts).toHaveLength(2) // daily and savings
    expect(result.current.transactions).toBeDefined()
    expect(Array.isArray(result.current.transactions)).toBe(true)
    expect(result.current.transactions).toHaveLength(0)
  })

  describe('setupBudget', () => {
    it('handles invalid initial budget values - negative', () => {
      const { result } = renderHook(() => useBudget())

      act(() => {
        result.current.setupBudget({
          startAmount: -100 as any,
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          hasEndDate: true
        })
      })

      // Should still set up but with negative amount (though in practice validation should prevent this)
      expect(result.current.isSetup).toBe(true)
      expect(result.current.budget.startAmount).toBe(-100)
    })

    it('handles invalid initial budget values - non-numeric', () => {
      const { result } = renderHook(() => useBudget())

      act(() => {
        result.current.setupBudget({
          startAmount: 'invalid' as any,
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          hasEndDate: true
        })
      })

      // TypeScript would prevent this, but runtime should handle
      expect(result.current.isSetup).toBe(true)
    })

    it('sets up budget in tracking mode (no end date)', () => {
      const { result } = renderHook(() => useBudget())

      act(() => {
        result.current.setupBudget({
          startAmount: 1000 as any,
          hasEndDate: false
        })
      })

      expect(result.current.isSetup).toBe(true)
      expect(result.current.budget.hasEndDate).toBe(false)
      expect(result.current.budget.endDate).toBeUndefined()
      expect(result.current.dailyAllowance).toBe(0) // No daily allowance in tracking mode
    })

    it('sets up budget in budget mode (with end date)', () => {
      const { result } = renderHook(() => useBudget())

      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

      act(() => {
        result.current.setupBudget({
          startAmount: 1000 as any,
          endDate: futureDate,
          hasEndDate: true
        })
      })

      expect(result.current.isSetup).toBe(true)
      expect(result.current.budget.hasEndDate).toBe(true)
      expect(result.current.budget.endDate).toEqual(futureDate)
      expect(result.current.dailyAllowance).toBeGreaterThan(0) // Has daily allowance in budget mode
    })
  })

  it('handles empty accounts array', () => {
    // Mock localStorage with empty accounts
    localStorageMock.getItem.mockReturnValue(JSON.stringify({
      accounts: [],
      budget: { startAmount: 1000, endDate: new Date().toISOString(), hasEndDate: true },
      transactions: [],
      isSetup: true
    }))

    const { result } = renderHook(() => useBudget())

    // Should fall back to default accounts
    expect(result.current.accounts).toHaveLength(2)
  })

  it('handles large numbers in budget mode', () => {
    const { result } = renderHook(() => useBudget())

    const largeAmount = 1000000000 // 1 billion

    act(() => {
      result.current.setupBudget({
        startAmount: largeAmount as any,
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        hasEndDate: true
      })
    })

    expect(result.current.budget.startAmount).toBe(largeAmount)
    // 8 days including today
    expect(result.current.dailyAllowance).toBe(largeAmount / 8)
  })

  it('handles large numbers in tracking mode', () => {
    const { result } = renderHook(() => useBudget())

    const largeAmount = 125000000

    act(() => {
      result.current.setupBudget({
        startAmount: largeAmount as any,
        hasEndDate: false
      })
    })

    expect(result.current.budget.startAmount).toBe(largeAmount)
    expect(result.current.dailyAllowance).toBe(0) // No daily allowance in tracking mode
  })

  it('handles error in addTransaction with invalid amount', () => {
    const { result } = renderHook(() => useBudget())

    // Set up budget in tracking mode (no daily allowance)
    act(() => {
      result.current.setupBudget({
        startAmount: 1000 as any,
        hasEndDate: false
      })
    })

    // Try to add transaction with invalid amount
    act(() => {
      result.current.addTransaction({
        type: 'expense',
        amount: NaN,
        description: 'Invalid expense',
        account: 'daily'
      })
    })

    // Should not crash, transactions should remain with only initial deposit
    expect(result.current.transactions).toHaveLength(1) // Only the initial deposit
  })

  it('handles addTransaction in tracking mode (no daily allowance)', () => {
    const { result } = renderHook(() => useBudget())

    // Set up budget in tracking mode
    act(() => {
      result.current.setupBudget({
        startAmount: 1000 as any,
        hasEndDate: false
      })
    })

    // Add expense - should just deduct from balance
    act(() => {
      result.current.addTransaction({
        type: 'expense',
        amount: 200,
        description: 'Test expense',
        account: 'daily'
      })
    })

    expect(result.current.transactions).toHaveLength(2) // Initial + expense
    const dailyAccount = result.current.accounts.find(a => a.id === 'daily')
    expect(dailyAccount?.balance).toBe(800)
  })

  it('handles addTransaction in budget mode with amount exceeding balance', () => {
    const { result } = renderHook(() => useBudget())

    act(() => {
      result.current.setupBudget({
        startAmount: 100 as any,
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        hasEndDate: true
      })
    })

    // Add expense larger than daily allowance
    act(() => {
      result.current.addTransaction({
        type: 'expense',
        amount: 200, // More than daily allowance
        description: 'Large expense',
        account: 'daily'
      })
    })

    expect(result.current.transactions).toHaveLength(2) // Initial + expense
    expect(result.current.remainingToday).toBe(0)
  })

  it('handles transferFunds with insufficient funds', () => {
    const { result } = renderHook(() => useBudget())

    act(() => {
      result.current.setupBudget({
        startAmount: 100 as any,
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        hasEndDate: true
      })
    })

    // Try to transfer more than available
    act(() => {
      result.current.transferFunds({
        amount: 200 as any,
        fromAccount: 'daily',
        toAccount: 'savings',
        description: 'Large transfer'
      })
    })

    // Should still execute, resulting in negative balance
    const dailyAccount = result.current.accounts.find(a => a.id === 'daily')
    expect(dailyAccount?.balance).toBeLessThan(0)
  })

  it('handles deleteAccount with balance', () => {
    const { result } = renderHook(() => useBudget())

    act(() => {
      result.current.setupBudget({
        startAmount: 1000 as any,
        hasEndDate: false
      })
    })

    // Add an account with balance
    act(() => {
      result.current.addAccount({
        name: 'Test Account',
        type: 'investment',
        balance: 500 as any,
        icon: 'wallet'
      })
    })

    const testAccount = result.current.accounts.find(a => a.name === 'Test Account')
    expect(testAccount).toBeDefined()

    // Delete the account
    act(() => {
      result.current.deleteAccount(testAccount!.id)
    })

    // Should transfer balance to savings
    const savingsAccount = result.current.accounts.find(a => a.id === 'savings')
    expect(savingsAccount?.balance).toBe(500)
  })

  it('prevents deletion of default accounts', () => {
    const { result } = renderHook(() => useBudget())

    // Try to delete daily account
    const deleted = result.current.deleteAccount('daily')
    expect(deleted).toBe(false)

    // Account should still exist
    expect(result.current.accounts.find(a => a.id === 'daily')).toBeDefined()
  })

  describe('updateConfig', () => {
    it('updates config in tracking mode', () => {
      const { result } = renderHook(() => useBudget())

      // Initial setup in tracking mode
      act(() => {
        result.current.setupBudget({
          startAmount: 1000 as any,
          hasEndDate: false
        })
      })

      // Update to budget mode with new end date
      const futureDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      act(() => {
        result.current.updateConfig({
          startAmount: 1500 as any,
          endDate: futureDate,
          hasEndDate: true
        })
      })

      expect(result.current.budget.hasEndDate).toBe(true)
      expect(result.current.budget.endDate).toEqual(futureDate)
      expect(result.current.dailyAllowance).toBeGreaterThan(0)
    })

    it('converts from budget mode to tracking mode', () => {
      const { result } = renderHook(() => useBudget())

      // Initial setup in budget mode
      act(() => {
        result.current.setupBudget({
          startAmount: 1000 as any,
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          hasEndDate: true
        })
      })

      expect(result.current.dailyAllowance).toBeGreaterThan(0)

      // Convert to tracking mode
      act(() => {
        result.current.updateConfig({
          startAmount: 1000 as any,
          hasEndDate: false
        })
      })

      expect(result.current.budget.hasEndDate).toBe(false)
      expect(result.current.budget.endDate).toBeUndefined()
      expect(result.current.dailyAllowance).toBe(0)
    })
  })
})