import { render, screen, fireEvent, within } from '@testing-library/react'
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { AccountsList } from '@/components/accounts-list'
import { AccountEditModal } from '@/components/modals/account-edit-modal'
import { LanguageProvider } from '@/contexts/language-context'
import { CurrencyProvider } from '@/contexts/currency-context'
import { Account, Budget, Int } from '@/types'
import { addDays } from 'date-fns'

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <LanguageProvider>
      <CurrencyProvider>{ui}</CurrencyProvider>
    </LanguageProvider>
  )
}

const defaultBudget: Budget = {
  startAmount: 1000 as Int,
  startDate: new Date(),
  endDate: addDays(new Date(), 30),
  autoSave: true
}

const trackModeBudget: Budget = {
  startAmount: 1000 as Int,
  startDate: new Date(),
  endDate: addDays(new Date(), 30),
  autoSave: true,
  mode: 'track'
}

const mockAccounts: Account[] = [
  {
    id: 'daily',
    name: 'Daily Budget',
    type: 'daily',
    balance: 1000 as Int,
    icon: 'wallet'
  },
  {
    id: 'savings',
    name: 'Savings',
    type: 'savings',
    balance: 500 as Int,
    icon: 'piggybank'
  },
  {
    id: 'custom-1',
    name: 'My Custom Account',
    type: 'savings',
    balance: 2500 as Int,
    icon: 'creditcard'
  }
]

// ---------- AccountsList Tests ----------

describe('AccountsList', () => {
  it('renders account cards with name, type, and balance', () => {
    renderWithProviders(
      <AccountsList
        accounts={mockAccounts}
        budget={defaultBudget}
        onAddAccount={vi.fn()}
        onUpdateAccount={vi.fn()}
        onDeleteAccount={vi.fn()}
      />
    )

    // Account names should be visible
    expect(screen.getByText('Daily Budget')).toBeInTheDocument()
    expect(screen.getByText('My Custom Account')).toBeInTheDocument()

    // Type text: t(account.type) + ' ' + t('account')
    // t('daily') = 'Daily Budget', t('account') = 'Account' → "Daily Budget Account"
    expect(screen.getByText('Daily Budget Account')).toBeInTheDocument()
    // Two accounts with type 'savings': "Savings Account"
    const savingsTypeElements = screen.getAllByText('Savings Account')
    expect(savingsTypeElements).toHaveLength(2)

    // Balance should appear in formatted currency form
    // formatCurrency(1000) → contains "1.000" or "1,000"
    expect(screen.getByText(/1[\s.,]?0{3}/)).toBeInTheDocument()
  })

  it('renders cards with cursor-pointer and aspect-square classes', () => {
    const { container } = renderWithProviders(
      <AccountsList
        accounts={mockAccounts}
        budget={defaultBudget}
        onAddAccount={vi.fn()}
        onUpdateAccount={vi.fn()}
        onDeleteAccount={vi.fn()}
      />
    )

    const cards = container.querySelectorAll('.aspect-square')
    expect(cards.length).toBeGreaterThan(0)
    expect(cards[0]).toHaveClass('cursor-pointer')
  })

  it('opens edit modal when clicking an account card', () => {
    renderWithProviders(
      <AccountsList
        accounts={mockAccounts}
        budget={defaultBudget}
        onAddAccount={vi.fn()}
        onUpdateAccount={vi.fn()}
        onDeleteAccount={vi.fn()}
      />
    )

    // Initially the edit modal should not be visible
    expect(screen.queryByText('Edit Account')).not.toBeInTheDocument()

    // Click the first account card (Daily Budget)
    const accountName = screen.getByText('Daily Budget')
    const card =
      accountName.closest('.cursor-pointer') || accountName
    fireEvent.click(card)

    // Now the edit modal should be open (text "Edit Account" from DialogTitle)
    expect(screen.getByText('Edit Account')).toBeInTheDocument()
  })

  it('hides savings account in track mode', () => {
    renderWithProviders(
      <AccountsList
        accounts={mockAccounts}
        budget={trackModeBudget}
        onAddAccount={vi.fn()}
        onUpdateAccount={vi.fn()}
        onDeleteAccount={vi.fn()}
      />
    )

    // Daily and custom should be visible
    expect(screen.getByText('Daily Budget')).toBeInTheDocument()
    expect(screen.getByText('My Custom Account')).toBeInTheDocument()

    // Savings account should NOT be visible
    expect(screen.queryByText('Savings')).not.toBeInTheDocument()
  })

  it('renders Add Account button', () => {
    renderWithProviders(
      <AccountsList
        accounts={mockAccounts}
        budget={defaultBudget}
        onAddAccount={vi.fn()}
        onUpdateAccount={vi.fn()}
        onDeleteAccount={vi.fn()}
      />
    )

    expect(screen.getByText('Add New Account')).toBeInTheDocument()
  })
})

// ---------- AccountEditModal Autofocus & Label Tests ----------

describe('AccountEditModal - Autofocus & Label', () => {
  it('auto-focuses the balance input when modal opens', () => {
    renderWithProviders(
      <AccountEditModal
        account={{ id: 'test-1', name: 'Test', balance: 5000 as Int, icon: 'wallet' }}
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        onDeleteAccount={vi.fn(() => true)}
        accountId="test-1"
        canDelete={true}
      />
    )
    const balanceInput = screen.getByTestId('edit-account-balance')
    expect(balanceInput).toHaveFocus()
  })

  it('renders balance input with data-testid', () => {
    renderWithProviders(
      <AccountEditModal
        account={{ id: 'test-1', name: 'Test', balance: 5000 as Int, icon: 'wallet' }}
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        onDeleteAccount={vi.fn(() => true)}
        accountId="test-1"
        canDelete={true}
      />
    )
    const balanceLabel = screen.getByText('Balance')
    expect(balanceLabel).toBeInTheDocument()
    const input = screen.getByTestId('edit-account-balance')
    expect(input).toBeInTheDocument()
  })
})

// ---------- AccountEditModal Delete Tests ----------

describe('AccountEditModal - Delete functionality', () => {
  it('renders delete button when canDelete is true', () => {
    renderWithProviders(
      <AccountEditModal
        account={{ id: 'test-1', name: 'Test Account', balance: 5000 as Int, icon: 'wallet' }}
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        onDeleteAccount={vi.fn(() => true)}
        accountId="test-1"
        canDelete={true}
      />
    )

    expect(screen.getByText('Delete Account')).toBeInTheDocument()
  })

  it('hides delete button when canDelete is false', () => {
    renderWithProviders(
      <AccountEditModal
        account={{ id: 'daily', name: 'Daily Budget', balance: 1000 as Int, icon: 'wallet' }}
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        onDeleteAccount={vi.fn(() => false)}
        accountId="daily"
        canDelete={false}
      />
    )

    expect(screen.queryByText('Delete Account')).not.toBeInTheDocument()
  })

  it('opens confirmation dialog when delete button is clicked', () => {
    renderWithProviders(
      <AccountEditModal
        account={{ id: 'test-1', name: 'Test Account', balance: 5000 as Int, icon: 'wallet' }}
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        onDeleteAccount={vi.fn(() => true)}
        accountId="test-1"
        canDelete={true}
      />
    )

    // Click the delete button
    fireEvent.click(screen.getByText('Delete Account'))

    // The confirmation dialog should appear with the account name
    expect(
      screen.getByText(/Delete 'Test Account'/)
    ).toBeInTheDocument()

    // The dialog should also show balance warning since balance > 0
    expect(
      screen.getByText(/will be moved to your/)
    ).toBeInTheDocument()
  })

  it('calls onDeleteAccount and closes modal on confirm', () => {
    const onDeleteAccount = vi.fn(() => true)
    const onClose = vi.fn()

    renderWithProviders(
      <AccountEditModal
        account={{ id: 'test-1', name: 'Test Account', balance: 5000 as Int, icon: 'wallet' }}
        isOpen={true}
        onClose={onClose}
        onSave={vi.fn()}
        onDeleteAccount={onDeleteAccount}
        accountId="test-1"
        canDelete={true}
      />
    )

    // Open the confirmation dialog
    fireEvent.click(screen.getByText('Delete Account'))

    // Confirm deletion
    fireEvent.click(screen.getByText('Delete'))

    // onDeleteAccount should have been called with the correct ID
    expect(onDeleteAccount).toHaveBeenCalledWith('test-1')

    // Modal should close
    expect(onClose).toHaveBeenCalled()
  })

  it('does not call onDeleteAccount when deletion is canceled', () => {
    const onDeleteAccount = vi.fn()
    const onClose = vi.fn()

    renderWithProviders(
      <AccountEditModal
        account={{ id: 'test-1', name: 'Test Account', balance: 5000 as Int, icon: 'wallet' }}
        isOpen={true}
        onClose={onClose}
        onSave={vi.fn()}
        onDeleteAccount={onDeleteAccount}
        accountId="test-1"
        canDelete={true}
      />
    )

    // Open the confirmation dialog
    fireEvent.click(screen.getByText('Delete Account'))

    // Cancel instead of confirming — use within to target AlertDialog's Cancel button
    const alertDialog = screen.getByRole('alertdialog')
    fireEvent.click(within(alertDialog).getByText('Cancel'))

    // onDeleteAccount should NOT have been called
    expect(onDeleteAccount).not.toHaveBeenCalled()

    // Edit modal should remain open
    expect(onClose).not.toHaveBeenCalled()
  })
})
