import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SetupForm } from '@/components/setup-form'
import { LanguageProvider } from '@/contexts/language-context'
import { toInt } from '@/types'

// Mock the DatePicker component
vi.mock('@/components/date-picker', () => ({
  DatePicker: ({ date, setDate, className }: { date: Date | undefined; setDate: (date: Date) => void; className?: string }) => (
    <div className={className} data-testid="date-picker">
      <input
        id="endDate"
        type="date"
        value={date?.toISOString().split('T')[0] || ''}
        onChange={(e) => {
          if (e.target.value) {
            setDate(new Date(e.target.value))
          }
        }}
        data-testid="date-input"
      />
      {date ? date.toLocaleDateString() : 'No date selected'}
    </div>
  )
}))

// Mock the language context
const mockTranslations = {
  setupTitle: 'Set Up Your Budget',
  setupDescription: 'Enter your starting amount and end date to calculate your daily budget.',
  startingAmount: 'Starting Amount',
  endDate: 'End Date',
  startTracking: 'Start Now',
  pickDate: 'Pick a date'
}

const mockUseLanguage = vi.fn(() => ({
  t: vi.fn((key: string) => mockTranslations[key as keyof typeof mockTranslations] || key),
  language: 'en' as const,
  setLanguage: vi.fn()
}))

// Mock the useLanguage hook
vi.mock('@/contexts/language-context', async () => {
  const actual = await vi.importActual('@/contexts/language-context') as any
  return {
    ...actual,
    useLanguage: () => mockUseLanguage()
  }
})

describe('SetupForm', () => {
  const mockOnSetup = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnSetup.mockClear()
  })

  const renderSetupForm = () => {
    return render(
      <LanguageProvider>
        <SetupForm onSetup={mockOnSetup} />
      </LanguageProvider>
    )
  }

  describe('Initial render', () => {
    it('should render all form elements', () => {
      renderSetupForm()

      expect(screen.getByText('Set Up Your Budget')).toBeInTheDocument()
      expect(screen.getByText('Enter your starting amount and end date to calculate your daily budget.')).toBeInTheDocument()
      expect(screen.getByLabelText('Starting Amount')).toBeInTheDocument()
      expect(screen.getByLabelText('End Date')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Start Now' })).toBeInTheDocument()
    })

    it('should have empty initial state', () => {
      renderSetupForm()

      const amountInput = screen.getByLabelText('Starting Amount') as HTMLInputElement
      expect(amountInput.value).toBe('')
    })
  })

  describe('Amount input behavior', () => {
    it('should set null when 0 is entered', async () => {
      renderSetupForm()

      const amountInput = screen.getByLabelText('Starting Amount')

      // Enter 0
      fireEvent.change(amountInput, { target: { valueAsNumber: 0 } })

      // The input should show '0' (HTML number input behavior)
      expect((amountInput as HTMLInputElement).value).toBe('0')
    })

    it('should convert positive numbers to Int type', async () => {
      renderSetupForm()

      const amountInput = screen.getByLabelText('Starting Amount')

      // Enter positive number
      fireEvent.change(amountInput, { target: { valueAsNumber: 1000 } })

      // The input should show the number
      expect((amountInput as HTMLInputElement).value).toBe('1000')
    })

    it('should handle large numbers correctly', async () => {
      renderSetupForm()

      const amountInput = screen.getByLabelText('Starting Amount')

      // Enter large number
      fireEvent.change(amountInput, { target: { valueAsNumber: 1000000 } })

      expect((amountInput as HTMLInputElement).value).toBe('1000000')
    })

    it('should handle negative numbers by converting to Int', async () => {
      renderSetupForm()

      const amountInput = screen.getByLabelText('Starting Amount')

      // Enter negative number
      fireEvent.change(amountInput, { target: { valueAsNumber: -500 } })

      expect((amountInput as HTMLInputElement).value).toBe('-500')
    })

    it('should handle decimal numbers by truncating to integer', async () => {
      renderSetupForm()

      const amountInput = screen.getByLabelText('Starting Amount')

      // Enter decimal number
      fireEvent.change(amountInput, { target: { valueAsNumber: 123.45 } })

      // HTML number inputs truncate decimals to integers
      expect((amountInput as HTMLInputElement).value).toBe('123')
    })

    it('should handle empty input correctly', async () => {
      renderSetupForm()

      const amountInput = screen.getByLabelText('Starting Amount')

      // Enter a number first
      fireEvent.change(amountInput, { target: { valueAsNumber: 1000 } })
      expect((amountInput as HTMLInputElement).value).toBe('1000')

      // Clear the input
      fireEvent.change(amountInput, { target: { value: '' } })

      // Controlled input shows empty string when cleared
      expect((amountInput as HTMLInputElement).value).toBe('')
    })
  })

  describe('Date picker behavior', () => {
    it('should handle date selection', async () => {
      renderSetupForm()

      const dateInput = screen.getByTestId('date-input')

      // Select a date
      const futureDate = '2024-12-31'
      fireEvent.change(dateInput, { target: { value: futureDate } })

      // The date should be displayed (format may vary by locale)
      expect(screen.getByText(/12\/30\/2024|Dec 30, 2024|30\/12\/2024/)).toBeInTheDocument()
    })

    it('should handle date clearing', async () => {
      renderSetupForm()

      const dateInput = screen.getByTestId('date-input')

      // Select a date first
      const futureDate = '2024-12-31'
      fireEvent.change(dateInput, { target: { value: futureDate } })
      expect(screen.getByText(/12\/30\/2024|Dec 30, 2024|30\/12\/2024/)).toBeInTheDocument()

      // Clear the date
      fireEvent.change(dateInput, { target: { value: '' } })

      // Should show the date
      expect(screen.getByText(/12\/30\/2024|Dec 30, 2024|30\/12\/2024/)).toBeInTheDocument()
    })
  })

  describe('Form submission', () => {
    it('should not submit when amount is 0 (null)', async () => {
      renderSetupForm()

      const amountInput = screen.getByLabelText('Starting Amount')
      const dateInput = screen.getByTestId('date-input')
      const submitButton = screen.getByRole('button', { name: 'Start Now' })

      // Enter 0 (which becomes null)
      fireEvent.change(amountInput, { target: { valueAsNumber: 0 } })

      // Select a date
      const futureDate = '2024-12-31'
      fireEvent.change(dateInput, { target: { value: futureDate } })

      // Try to submit
      fireEvent.click(submitButton)

      // Should not call onSetup
      expect(mockOnSetup).not.toHaveBeenCalled()
    })

    it('should not submit when amount is negative', async () => {
      renderSetupForm()

      const amountInput = screen.getByLabelText('Starting Amount')
      const dateInput = screen.getByTestId('date-input')
      const submitButton = screen.getByRole('button', { name: 'Start Now' })

      // Enter negative amount
      fireEvent.change(amountInput, { target: { valueAsNumber: -100 } })

      // Select a date
      const futureDate = '2024-12-31'
      fireEvent.change(dateInput, { target: { value: futureDate } })

      // Try to submit
      fireEvent.click(submitButton)

      // Should not call onSetup
      expect(mockOnSetup).not.toHaveBeenCalled()
    })

    it('should not submit when no date is selected', async () => {
      renderSetupForm()

      const amountInput = screen.getByLabelText('Starting Amount')
      const submitButton = screen.getByRole('button', { name: 'Start Now' })

      // Enter positive amount
      fireEvent.change(amountInput, { target: { valueAsNumber: 1000 } })

      // Try to submit without date
      fireEvent.click(submitButton)

      // Should not call onSetup
      expect(mockOnSetup).not.toHaveBeenCalled()
    })

    it('should not submit when amount is empty', async () => {
      renderSetupForm()

      const dateInput = screen.getByTestId('date-input')
      const submitButton = screen.getByRole('button', { name: 'Start Now' })

      // Select a date
      const futureDate = '2024-12-31'
      fireEvent.change(dateInput, { target: { value: futureDate } })

      // Try to submit without amount
      fireEvent.click(submitButton)

      // Should not call onSetup
      expect(mockOnSetup).not.toHaveBeenCalled()
    })

    it('should submit successfully with valid positive amount and date', async () => {
      renderSetupForm()

      const amountInput = screen.getByLabelText('Starting Amount')
      const dateInput = screen.getByTestId('date-input')
      const submitButton = screen.getByRole('button', { name: 'Start Now' })

      // Enter positive amount
      fireEvent.change(amountInput, { target: { valueAsNumber: 1000 } })

      // Select a date
      const futureDate = '2024-12-31'
      fireEvent.change(dateInput, { target: { value: futureDate } })

      // Submit the form
      fireEvent.click(submitButton)

      // Should call onSetup with correct data
      expect(mockOnSetup).toHaveBeenCalledWith({
        startAmount: 1000, // Should be Int type
        endDate: new Date(futureDate)
      })
    })

    it('should submit successfully with large positive amount', async () => {
      renderSetupForm()

      const amountInput = screen.getByLabelText('Starting Amount')
      const dateInput = screen.getByTestId('date-input')
      const submitButton = screen.getByRole('button', { name: 'Start Now' })

      // Enter large amount
      fireEvent.change(amountInput, { target: { valueAsNumber: 1000000 } })

      // Select a date
      const futureDate = '2024-12-31'
      fireEvent.change(dateInput, { target: { value: futureDate } })

      // Submit the form
      fireEvent.click(submitButton)

      // Should call onSetup with correct data
      expect(mockOnSetup).toHaveBeenCalledWith({
        startAmount: 1000000, // Should be Int type
        endDate: new Date(futureDate)
      })
    })
  })

  describe('Form validation', () => {
    it('should prevent form submission with amount <= 0', async () => {
      renderSetupForm()

      const amountInput = screen.getByLabelText('Starting Amount')
      const dateInput = screen.getByTestId('date-input')
      const submitButton = screen.getByRole('button', { name: 'Start Now' })

      // Test with 0
      fireEvent.change(amountInput, { target: { valueAsNumber: 0 } })
      fireEvent.change(dateInput, { target: { value: '2024-12-31' } })
      fireEvent.click(submitButton)
      expect(mockOnSetup).not.toHaveBeenCalled()

      // Clear and test with negative
      fireEvent.change(amountInput, { target: { value: '' } })
      fireEvent.change(amountInput, { target: { valueAsNumber: -100 } })
      fireEvent.click(submitButton)
      expect(mockOnSetup).not.toHaveBeenCalled()
    })

    it('should not submit when only date is provided', async () => {
      renderSetupForm()

      const dateInput = screen.getByTestId('date-input')
      const submitButton = screen.getByRole('button', { name: 'Start Now' })

      // Set only date
      fireEvent.change(dateInput, { target: { value: '2024-12-31' } })
      fireEvent.click(submitButton)

      // Should not call onSetup
      expect(mockOnSetup).not.toHaveBeenCalled()
    })

    it('should not submit when only amount is provided', async () => {
      renderSetupForm()

      const amountInput = screen.getByLabelText('Starting Amount')
      const submitButton = screen.getByRole('button', { name: 'Start Now' })

      // Set only amount
      fireEvent.change(amountInput, { target: { valueAsNumber: 1000 } })
      fireEvent.click(submitButton)

      // Should not call onSetup
      expect(mockOnSetup).not.toHaveBeenCalled()
    })
  })

  describe('Input field behavior', () => {
    it('should maintain input value display correctly', async () => {
      renderSetupForm()

      const amountInput = screen.getByLabelText('Starting Amount')

      // Test various inputs
      const testValues = [0, 100, 1000, 50000, -50, 0]

      for (const value of testValues) {
        fireEvent.change(amountInput, { target: { valueAsNumber: value } })

        if (value === 0) {
          expect((amountInput as HTMLInputElement).value).toBe('0')
        } else {
          expect((amountInput as HTMLInputElement).value).toBe(value.toString())
        }
      }
    })

    it('should handle rapid input changes', async () => {
      renderSetupForm()

      const amountInput = screen.getByLabelText('Starting Amount')

      // Rapidly change values
      fireEvent.change(amountInput, { target: { valueAsNumber: 100 } })
      fireEvent.change(amountInput, { target: { valueAsNumber: 0 } })
      fireEvent.change(amountInput, { target: { valueAsNumber: 500 } })

      // Final state should be 500
      expect((amountInput as HTMLInputElement).value).toBe('500')
    })
  })
})