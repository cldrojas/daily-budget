import { test, expect } from '@playwright/test'
import { ensureConfiguredState } from './test-utils'
import { MULTI_ACCOUNT_SETUP } from './test-data'

test.describe('Accounts List UI', () => {
  test.beforeEach(async ({ page }) => {
    await ensureConfiguredState(page, MULTI_ACCOUNT_SETUP)
  })

  test('clicking an account card opens edit modal with correct info', async ({ page }) => {
    // Click on the "Daily Budget" card
    await page.locator('text=Daily Budget').first().click()

    // The edit modal should appear with the account name visible
    await expect(page.locator('text=Edit Account')).toBeVisible()

    // The modal should show Daily Budget as the account name
    await expect(page.locator('input[id="accountName"]')).toHaveValue('Daily Budget')

    // The modal should show the balance
    const balanceInput = page.locator('input[id="accountBalance"]')
    await expect(balanceInput).toBeVisible()
  })

  test('delete button is visible in edit modal for non-default accounts', async ({ page }) => {
    // Click on a non-default account (e.g., "Checking")
    await page.locator('text=Checking').first().click()

    // The edit modal should open
    await expect(page.locator('text=Edit Account')).toBeVisible()

    // Delete Account button should be visible
    await expect(page.locator('text=Delete Account')).toBeVisible()
  })

  test('delete button opens confirmation and deleting removes account', async ({ page }) => {
    // Click on the "Checking" account
    await page.locator('text=Checking').first().click()
    await expect(page.locator('text=Edit Account')).toBeVisible()

    // Click Delete Account
    await page.locator('text=Delete Account').click()

    // Confirmation dialog should appear
    await expect(page.locator('text=Delete Account').first()).toBeVisible()

    // Confirm deletion
    await page.locator('text=Delete').click()

    // The account should be removed from the list
    await expect(page.locator('text=Checking')).not.toBeVisible()
  })

  test('edit modal is usable on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await ensureConfiguredState(page, MULTI_ACCOUNT_SETUP)

    // Open an account card
    await page.locator('text=Daily Budget').first().click()
    await expect(page.locator('text=Edit Account')).toBeVisible()

    // Verify balance input has data-testid
    await expect(page.locator('[data-testid="edit-account-balance"]')).toBeVisible()
  })

test('closing edit modal without changes', async ({ page }) => {
    // Click on an account card
    await page.locator('text=Daily Budget').first().click()
    await expect(page.locator('text=Edit Account')).toBeVisible()

    // Close the modal by clicking cancel
    await page.locator('text=Cancel').first().click()

    // Modal should disappear
    await expect(page.locator('text=Edit Account')).not.toBeVisible()
  })
})
