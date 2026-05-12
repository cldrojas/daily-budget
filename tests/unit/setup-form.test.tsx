import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SetupForm } from '@/components/setup-form'
import { LanguageProvider } from '@/contexts/language-context'

// Mock ResizeObserver for Radix UI components
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

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
  pickDate: 'Pick a date',
  addEndDate: 'Add end date',
  addEndDateDescription: 'Enable to set a deadline and calculate daily budget. Without it, the app tracks transactions only.',
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
      expect(screen.getByLabelText('Add end date')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Start Now' })).toBeInTheDocument()
    })

    it('should have empty initial state', () => {
      renderSetupForm()

      const amountInput = screen.getByLabelText('Starting Amount') as HTMLInputElement
      expect(amountInput.value).toBe('')
    })

    it('should NOT show date picker by default (checkbox unchecked)', () => {
      renderSetupForm()

      // Date picker should not be visible initially
      expect(screen.queryByTestId('date-picker')).not.toBeInTheDocument()
    })
  })

  describe('Checkbox behavior', () => {
    it('should show date picker when checkbox is checked', async () => {
      renderSetupForm()

      const checkbox = screen.getByLabelText('Add end date')
      fireEvent.click(checkbox)

      // Now date picker should be visible
      expect(screen.getByTestId('date-picker')).toBeInTheDocument()
    })

    it('should hide date picker when checkbox is unchecked after being checked', async () => {
      renderSetupForm()

      const checkbox = screen.getByLabelText('Add end date')

      // Check the checkbox
      fireEvent.click(checkbox)
      expect(screen.getByTestId('date-picker')).toBeInTheDocument()

      // Uncheck the checkbox
      fireEvent.click(checkbox)
      expect(screen.queryByTestId('date-picker')).not.toBeInTheDocument()
    })
  })

  describe('Amount input behavior', () => {
    it('should set null when 0 is entered', async () => {
      renderSetupForm()

      const amountInput = screen.getByLabelText('Starting Amount')

      // Enter 0 - it becomes null in the component, so input shows empty
      fireEvent.change(amountInput, { target: { valueAsNumber: 0 } })

      // The input shows empty because 0 becomes null (not a valid amount)
      expect((amountInput as HTMLInputElement).value).toBe('')
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
    it('should handle date selection when checkbox is checked', async () => {
      renderSetupForm()

      // Check the checkbox first
      const checkbox = screen.getByLabelText('Add end date')
      fireEvent.click(checkbox)

      const dateInput = screen.getByTestId('date-input')

      // Select a date
      const futureDate = '2024-12-31'
      fireEvent.change(dateInput, { target: { value: futureDate } })

      // The date should be displayed (format may vary by locale)
      expect(screen.getByText(/12\/30\/2024|Dec 30, 2024|30\/12\/2024/)).toBeInTheDocument()
    })

    it('should handle date clearing when checkbox is checked', async () => {
      renderSetupForm()

      // Check the checkbox first
      const checkbox = screen.getByLabelText('Add end date')
      fireEvent.click(checkbox)

      const dateInput = screen.getByTestId('date-input')

      // Select a date first
      const futureDate = '2024-12-31'
      fireEvent.change(dateInput, { target: { value: futureDate } })
      expect(screen.getByText(/12\/30\/2024|Dec 30, 2024|30\/12\/2024/)).toBeInTheDocument()

      // Clear the date
      fireEvent.change(dateInput, { target: { value: '' } })
    })
  })

  describe('Form submission - tracking mode (no date)', () => {
    it('should submit successfully with only amount (tracking mode)', async () => {
      renderSetupForm()

      const amountInput = screen.getByLabelText('Starting Amount')
      const submitButton = screen.getByRole('button', { name: 'Start Now' })

      // Enter positive amount (no date checkbox)
      fireEvent.change(amountInput, { target: { valueAsNumber: 1000 } })

      // Submit the form
      fireEvent.click(submitButton)

      // Should call onSetup in tracking mode (no endDate)
      expect(mockOnSetup).toHaveBeenCalledWith({
        startAmount: 1000,
        endDate: undefined,
        hasEndDate: false
      })
    })

    it('should not submit when amount is 0', async () => {
      renderSetupForm()

      const amountInput = screen.getByLabelText('Starting Amount')
      const submitButton = screen.getByRole('button', { name: 'Start Now' })

      // Enter 0
      fireEvent.change(amountInput, { target: { valueAsNumber: 0 } })

      // Try to submit
      fireEvent.click(submitButton)

      // Should not call onSetup
      expect(mockOnSetup).not.toHaveBeenCalled()
    })

    it('should not submit when amount is negative', async () => {
      renderSetupForm()

      const amountInput = screen.getByLabelText('Starting Amount')
      const submitButton = screen.getByRole('button', { name: 'Start Now' })

      // Enter negative amount
      fireEvent.change(amountInput, { target: { valueAsNumber: -100 } })

      // Try to submit
      fireEvent.click(submitButton)

      // Should not call onSetup
      expect(mockOnSetup).not.toHaveBeenCalled()
    })

    it('should not submit when amount is empty', async () => {
      renderSetupForm()

      const submitButton = screen.getByRole('button', { name: 'Start Now' })

      // Try to submit without amount
      fireEvent.click(submitButton)

      // Should not call onSetup
      expect(mockOnSetup).not.toHaveBeenCalled()
    })
  })

  describe('Form submission - budget mode (with date)', () => {
    it('should submit successfully with amount and date', async () => {
      renderSetupForm()

      const amountInput = screen.getByLabelText('Starting Amount')
      const submitButton = screen.getByRole('button', { name: 'Start Now' })

      // Enter positive amount
      fireEvent.change(amountInput, { target: { valueAsNumber: 1000 } })

      // Check the checkbox to enable date
      const checkbox = screen.getByLabelText('Add end date')
      fireEvent.click(checkbox)

      // Select a date
      const futureDate = '2024-12-31'
      const dateInput = screen.getByTestId('date-input')
      fireEvent.change(dateInput, { target: { value: futureDate } })

      // Submit the form
      fireEvent.click(submitButton)

      // Should call onSetup in budget mode
      expect(mockOnSetup).toHaveBeenCalledWith({
        startAmount: 1000,
        endDate: new Date(futureDate),
        hasEndDate: true
      })
    })

    it('should not submit when date checkbox is checked but no date selected', async () => {
      renderSetupForm()

      const amountInput = screen.getByLabelText('Starting Amount')
      const submitButton = screen.getByRole('button', { name: 'Start Now' })

      // Enter positive amount
      fireEvent.change(amountInput, { target: { valueAsNumber: 1000 } })

      // Check the checkbox to enable date
      const checkbox = screen.getByLabelText('Add end date')
      fireEvent.click(checkbox)

      // Submit without selecting a date
      fireEvent.click(submitButton)

      // Should not call onSetup
      expect(mockOnSetup).not.toHaveBeenCalled()
    })

    it('should submit successfully with large positive amount and date', async () => {
      renderSetupForm()

      const amountInput = screen.getByLabelText('Starting Amount')
      const submitButton = screen.getByRole('button', { name: 'Start Now' })

      // Enter large amount
      fireEvent.change(amountInput, { target: { valueAsNumber: 1000000 } })

      // Check the checkbox to enable date
      const checkbox = screen.getByLabelText('Add end date')
      fireEvent.click(checkbox)

      // Select a date
      const futureDate = '2024-12-31'
      const dateInput = screen.getByTestId('date-input')
      fireEvent.change(dateInput, { target: { value: futureDate } })

      // Submit the form
      fireEvent.click(submitButton)

      // Should call onSetup with correct data
      expect(mockOnSetup).toHaveBeenCalledWith({
        startAmount: 1000000,
        endDate: new Date(futureDate),
        hasEndDate: true
      })
    })
  })

  describe('Form validation', () => {
    it('should prevent form submission with amount <= 0 in tracking mode', async () => {
      renderSetupForm()

      const amountInput = screen.getByLabelText('Starting Amount')
      const submitButton = screen.getByRole('button', { name: 'Start Now' })

      // Test with 0
      fireEvent.change(amountInput, { target: { valueAsNumber: 0 } })
      fireEvent.click(submitButton)
      expect(mockOnSetup).not.toHaveBeenCalled()

      // Clear and test with negative
      fireEvent.change(amountInput, { target: { value: '' } })
      fireEvent.change(amountInput, { target: { valueAsNumber: -100 } })
      fireEvent.click(submitButton)
      expect(mockOnSetup).not.toHaveBeenCalled()
    })

    it('should prevent form submission when only date is provided (no amount)', async () => {
      renderSetupForm()

      const checkbox = screen.getByLabelText('Add end date')
      fireEvent.click(checkbox)

      const dateInput = screen.getByTestId('date-input')
      const submitButton = screen.getByRole('button', { name: 'Start Now' })

      // Set only date (no amount)
      fireEvent.change(dateInput, { target: { value: '2024-12-31' } })
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
      const testValues = [100, 1000, 50000, -50]

      for (const value of testValues) {
        fireEvent.change(amountInput, { target: { valueAsNumber: value } })
        expect((amountInput as HTMLInputElement).value).toBe(value.toString())
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