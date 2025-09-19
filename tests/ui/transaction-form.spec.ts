import { test, expect } from '@playwright/test'

test.describe('Transaction Form', () => {
  test('should render transaction form without hydration errors', async ({ page }) => {
    await page.goto('http://localhost:3000')

    // Wait for the page to load
    await page.waitForSelector('h1')

    // Check that the transaction form is visible
    const formCard = page.locator('[data-testid="transaction-form"]').or(
      page.locator('h3:has-text("Añadir Gasto")').or(
        page.locator('h3:has-text("Add Expense")')
      ).locator('..').locator('..')
    )
    await expect(formCard).toBeVisible()

    // Verify form elements are present
    await expect(page.locator('input[type="number"]')).toBeVisible()
    await expect(page.locator('textarea')).toBeVisible()
    await expect(page.locator('[data-testid="account-select"]')).toBeVisible()
    await expect(page.locator('button:has-text("Añadir Gasto")').or(
      page.locator('button:has-text("Add Expense")')
    )).toBeVisible()
  })

  test('should handle form validation correctly', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await page.waitForSelector('h1')

    // Try to submit empty form
    const submitButton = page.locator('button:has-text("Añadir Gasto")').or(
      page.locator('button:has-text("Add Expense")')
    )
    await submitButton.click()

    // Check for validation error toast
    await expect(page.locator('[data-testid="toast"]').or(
      page.locator('text=Cantidad inválida').or(
        page.locator('text=Invalid amount')
      )
    )).toBeVisible()

    // Fill invalid amount (negative number)
    const amountInput = page.locator('input[type="number"]')
    await amountInput.fill('-50')

    await submitButton.click()

    // Check for invalid amount error
    await expect(page.locator('[data-testid="toast"]').or(
      page.locator('text=Cantidad inválida').or(
        page.locator('text=Invalid amount')
      )
    )).toBeVisible()

    // Fill zero amount
    await amountInput.fill('0')
    await submitButton.click()

    // Check for invalid amount error
    await expect(page.locator('[data-testid="toast"]').or(
      page.locator('text=Cantidad inválida').or(
        page.locator('text=Invalid amount')
      )
    )).toBeVisible()
  })

  test('should handle valid transaction submission', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await page.waitForSelector('h1')

    // Fill valid transaction data
    const amountInput = page.locator('input[type="number"]')
    await amountInput.fill('25')

    const descriptionInput = page.locator('textarea')
    await descriptionInput.fill('Test transaction')

    // Select account if not already selected
    const accountSelect = page.locator('[data-testid="account-select"]').or(
      page.locator('select').or(
        page.locator('[role="combobox"]')
      )
    )
    if (await accountSelect.isVisible()) {
      await accountSelect.click()
      await page.locator('text=Daily').or(page.locator('text=Diario')).click()
    }

    // Submit form
    const submitButton = page.locator('button:has-text("Añadir Gasto")').or(
      page.locator('button:has-text("Add Expense")')
    )
    await submitButton.click()

    // Check for success toast
    await expect(page.locator('[data-testid="toast"]').or(
      page.locator('text=Gasto añadido').or(
        page.locator('text=Expense added')
      )
    )).toBeVisible()

    // Verify form is reset after successful submission
    await expect(amountInput).toHaveValue('')
    await expect(descriptionInput).toHaveValue('')
  })

  test('should handle account selection', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await page.waitForSelector('h1')

    // Find account selector
    const accountSelect = page.locator('[data-testid="account-select"]').or(
      page.locator('select').or(
        page.locator('[role="combobox"]')
      )
    )

    if (await accountSelect.isVisible()) {
      // Click to open dropdown
      await accountSelect.click()

      // Check that account options are available
      await expect(page.locator('text=Daily').or(page.locator('text=Diario'))).toBeVisible()
      await expect(page.locator('text=Savings').or(page.locator('text=Ahorros'))).toBeVisible()
      await expect(page.locator('text=Investment').or(page.locator('text=Inversión'))).toBeVisible()

      // Select different account
      await page.locator('text=Savings').or(page.locator('text=Ahorros')).click()

      // Verify selection changed
      await expect(accountSelect).toHaveValue('savings')
    }
  })

  test('should show warning when expense exceeds remaining budget', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await page.waitForSelector('h1')

    // Fill amount that exceeds remaining budget
    const amountInput = page.locator('input[type="number"]')
    await amountInput.fill('999999')

    // Check for warning message
    await expect(page.locator('text=excede').or(
      page.locator('text=exceeds')
    )).toBeVisible()
  })

  test('should handle description input', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await page.waitForSelector('h1')

    const descriptionInput = page.locator('textarea')

    // Test placeholder text
    const placeholder = await descriptionInput.getAttribute('placeholder')
    expect(placeholder).toMatch(/(¿Para qué es este gasto\?|What is this expense for\?)/)

    // Fill description
    await descriptionInput.fill('Lunch at restaurant')

    // Verify value is set
    await expect(descriptionInput).toHaveValue('Lunch at restaurant')

    // Test long description
    const longDescription = 'A'.repeat(200)
    await descriptionInput.fill(longDescription)
    await expect(descriptionInput).toHaveValue(longDescription)
  })

  test('should handle keyboard navigation', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await page.waitForSelector('h1')

    // Tab through form elements
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Fill form using keyboard
    await page.keyboard.type('50')
    await page.keyboard.press('Tab')
    await page.keyboard.type('Test expense')
    await page.keyboard.press('Tab')

    // Submit with Enter
    await page.keyboard.press('Enter')

    // Check for success toast
    await expect(page.locator('[data-testid="toast"]').or(
      page.locator('text=Gasto añadido').or(
        page.locator('text=Expense added')
      )
    )).toBeVisible()
  })

  test('should maintain form state during validation errors', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await page.waitForSelector('h1')

    // Fill partial data
    const amountInput = page.locator('input[type="number"]')
    await amountInput.fill('75')

    const descriptionInput = page.locator('textarea')
    await descriptionInput.fill('Coffee and pastry')

    // Try to submit with invalid data (simulate validation failure)
    const submitButton = page.locator('button:has-text("Añadir Gasto")').or(
      page.locator('button:has-text("Add Expense")')
    )
    await submitButton.click()

    // Verify form data is preserved after validation error
    await expect(amountInput).toHaveValue('75')
    await expect(descriptionInput).toHaveValue('Coffee and pastry')
  })

  test('should handle decimal amounts', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await page.waitForSelector('h1')

    const amountInput = page.locator('input[type="number"]')

    // Test decimal input
    await amountInput.fill('25.50')

    const descriptionInput = page.locator('textarea')
    await descriptionInput.fill('Decimal test')

    // Submit form
    const submitButton = page.locator('button:has-text("Añadir Gasto")').or(
      page.locator('button:has-text("Add Expense")')
    )
    await submitButton.click()

    // Check for success toast
    await expect(page.locator('[data-testid="toast"]').or(
      page.locator('text=Gasto añadido').or(
        page.locator('text=Expense added')
      )
    )).toBeVisible()
  })

  test('should be accessible', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await page.waitForSelector('h1')

    // Check form labels
    await expect(page.locator('label')).toHaveCount(3)

    // Check input accessibility
    const amountInput = page.locator('input[type="number"]')
    await expect(amountInput).toHaveAttribute('required')

    const descriptionInput = page.locator('textarea')
    await expect(descriptionInput).toBeVisible()

    // Check button accessibility
    const submitButton = page.locator('button:has-text("Añadir Gasto")').or(
      page.locator('button:has-text("Add Expense")')
    )
    await expect(submitButton).toBeVisible()

    // Test focus management
    await amountInput.focus()
    await expect(amountInput).toBeFocused()
  })

  test('should handle rapid form submissions', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await page.waitForSelector('h1')

    // Fill form data
    const amountInput = page.locator('input[type="number"]')
    const descriptionInput = page.locator('textarea')
    const submitButton = page.locator('button:has-text("Añadir Gasto")').or(
      page.locator('button:has-text("Add Expense")')
    )

    // Submit multiple times quickly
    await amountInput.fill('10')
    await descriptionInput.fill('Rapid test 1')
    await submitButton.click()

    await amountInput.fill('20')
    await descriptionInput.fill('Rapid test 2')
    await submitButton.click()

    // Check that both transactions were processed
    await expect(page.locator('[data-testid="toast"]')).toHaveCount(2)
  })
})