import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BudgetTracker } from '@/components/budget-tracker'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

// Mock date-fns
vi.mock('date-fns', () => ({
  format: vi.fn((date, formatStr) => `formatted-${date.toISOString()}`),
  isSameDay: vi.fn((date1, date2) => date1.toDateString() === date2.toDateString()),
}))

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

describe('BudgetTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    })
  })

  it('renders without errors', () => {
    render(<BudgetTracker />)
    expect(screen.getByText('Budget Settings')).toBeInTheDocument()
    expect(screen.getByText('Expenses')).toBeInTheDocument()
  })

  it('loads data from localStorage on mount', async () => {
    const mockData = {
      initialBalance: 1000,
      endDate: '2023-12-31T00:00:00.000Z',
      expenses: [
        {
          id: '1',
          description: 'Test expense',
          amount: 100,
          date: '2023-12-01T00:00:00.000Z',
        },
      ],
      fixedDailyAmount: 50,
      lastCalculationDate: '2023-12-01T00:00:00.000Z',
      todayRemainingAmount: 50,
    }
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData))

    render(<BudgetTracker />)

    await waitFor(() => {
      expect(localStorageMock.getItem).toHaveBeenCalledWith('budgetTrackerData')
    })
  })

  it('handles empty budget data gracefully', async () => {
    localStorageMock.getItem.mockReturnValue(null)

    render(<BudgetTracker />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('')).toBeInTheDocument() // initial balance input
    })

    expect(screen.getByText('No expenses yet')).toBeInTheDocument()
  })

  it('adds expense correctly', async () => {
    // First, set up budget calculated state
    const mockData = {
      initialBalance: 1000,
      endDate: '2023-12-31T00:00:00.000Z',
      expenses: [],
      fixedDailyAmount: 50,
      lastCalculationDate: '2023-12-01T00:00:00.000Z',
      todayRemainingAmount: 50,
    }
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData))

    render(<BudgetTracker />)

    await waitFor(() => {
      expect(screen.getByText('Add Expense')).toBeInTheDocument()
    })

    const descriptionInput = screen.getByPlaceholderText('Description')
    const amountInput = screen.getByPlaceholderText('Amount')
    const addButton = screen.getByText('Add Expense')

    fireEvent.change(descriptionInput, { target: { value: 'Test expense' } })
    fireEvent.change(amountInput, { target: { value: '25' } })

    fireEvent.click(addButton)

    await waitFor(() => {
      expect(screen.getByText('Test expense')).toBeInTheDocument()
    })
  })

  it('handles invalid expense input', async () => {
    const mockData = {
      initialBalance: 1000,
      endDate: '2023-12-31T00:00:00.000Z',
      expenses: [],
      fixedDailyAmount: 50,
      lastCalculationDate: '2023-12-01T00:00:00.000Z',
      todayRemainingAmount: 50,
    }
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData))

    render(<BudgetTracker />)

    await waitFor(() => {
      expect(screen.getByText('Add Expense')).toBeInTheDocument()
    })

    const addButton = screen.getByText('Add Expense')

    // Empty inputs - button should be disabled
    expect(addButton).toBeDisabled()

    // Invalid amount
    const descriptionInput = screen.getByPlaceholderText('Description')
    const amountInput = screen.getByPlaceholderText('Amount')

    fireEvent.change(descriptionInput, { target: { value: 'Test' } })
    fireEvent.change(amountInput, { target: { value: 'invalid' } })

    expect(addButton).toBeDisabled()
  })

  it('removes expense correctly', async () => {
    const mockData = {
      initialBalance: 1000,
      endDate: '2023-12-31T00:00:00.000Z',
      expenses: [
        {
          id: '1',
          description: 'Test expense',
          amount: 100,
          date: '2023-12-01T00:00:00.000Z',
        },
      ],
      fixedDailyAmount: 50,
      lastCalculationDate: '2023-12-01T00:00:00.000Z',
      todayRemainingAmount: 50,
    }
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData))

    render(<BudgetTracker />)

    await waitFor(() => {
      expect(screen.getByText('Test expense')).toBeInTheDocument()
    })

    const removeButton = screen.getByRole('button', { name: /trash/i })
    fireEvent.click(removeButton)

    await waitFor(() => {
      expect(screen.queryByText('Test expense')).not.toBeInTheDocument()
    })
  })
})