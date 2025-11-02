import { test, expect } from '@playwright/test'

/**
 * E2E test for QR scan flow
 * Tests the complete flow: entering QR code, submitting, and verifying toast appears
 */
test.describe('QR Scan Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the Supabase auth session
    await page.addInitScript(() => {
      // Mock localStorage for auth session
      window.localStorage.setItem(
        'sb-test.supabase.auth.token',
        JSON.stringify({
          access_token: 'mock-access-token',
          user: { id: 'test-user-id', email: 'test@example.com' },
        })
      )
    })

    // Mock the QR scan endpoint
    await page.route('**/functions/v1/qr-scan', async (route) => {
      const request = route.request()
      const postData = await request.postDataJSON()

      // Simulate successful scan
      if (postData?.code === 'BOTTLE-ABC123' || postData?.code === 'bottle-abc123') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            result: 'accepted',
            points_awarded: 25,
            new_balance: 125,
          }),
        })
      } else if (postData?.code === 'INVALID-CODE') {
        // Simulate rejected scan
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            result: 'rejected',
            reason: 'This code has already been used',
          }),
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            result: 'rejected',
            reason: 'Invalid QR code',
          }),
        })
      }
    })

    // Navigate to scan page
    await page.goto('/scan')
  })

  test('displays success toast after valid QR scan', async ({ page }) => {
    // Wait for the page to load
    await expect(page.getByText('Scan QR Code')).toBeVisible()

    // Find and fill the QR code input
    const qrInput = page.getByPlaceholder('Enter code (e.g., BOTTLE-ABC123)')
    await expect(qrInput).toBeVisible()
    await qrInput.fill('BOTTLE-ABC123')

    // Find and click the submit button
    const submitButton = page.getByRole('button', { name: /Redeem Code/i })
    await expect(submitButton).toBeEnabled()
    await submitButton.click()

    // Wait for the success toast to appear
    await expect(
      page.getByText(/🎉 You earned 25 points! New balance: 125/)
    ).toBeVisible({ timeout: 5000 })

    // Verify toast has success styling (green)
    const toast = page.locator('div').filter({ hasText: /You earned.*points/ })
    await expect(toast).toHaveClass(/green/)

    // Verify the input is cleared after successful scan
    await expect(qrInput).toHaveValue('')
  })

  test('displays error toast for invalid QR code', async ({ page }) => {
    // Wait for the page to load
    await expect(page.getByText('Scan QR Code')).toBeVisible()

    // Enter an invalid code
    const qrInput = page.getByPlaceholder('Enter code (e.g., BOTTLE-ABC123)')
    await qrInput.fill('INVALID-CODE')

    // Submit the form
    const submitButton = page.getByRole('button', { name: /Redeem Code/i })
    await submitButton.click()

    // Wait for error toast
    await expect(
      page.getByText(/This code has already been used/)
    ).toBeVisible({ timeout: 5000 })

    // Verify toast has error styling (red)
    const toast = page.locator('div').filter({ hasText: /already been used/ })
    await expect(toast).toHaveClass(/red/)
  })

  test('handles case-insensitive QR code input', async ({ page }) => {
    await expect(page.getByText('Scan QR Code')).toBeVisible()

    // Enter code in lowercase
    const qrInput = page.getByPlaceholder('Enter code (e.g., BOTTLE-ABC123)')
    await qrInput.fill('bottle-abc123')

    const submitButton = page.getByRole('button', { name: /Redeem Code/i })
    await submitButton.click()

    // Should still work (code is converted to uppercase)
    await expect(
      page.getByText(/🎉 You earned 25 points! New balance: 125/)
    ).toBeVisible({ timeout: 5000 })
  })

  test('shows error message when not logged in', async ({ page }) => {
    // Clear auth session
    await page.addInitScript(() => {
      window.localStorage.clear()
    })

    await page.reload()
    await expect(page.getByText('Scan QR Code')).toBeVisible()

    const qrInput = page.getByPlaceholder('Enter code (e.g., BOTTLE-ABC123)')
    await qrInput.fill('BOTTLE-ABC123')

    const submitButton = page.getByRole('button', { name: /Redeem Code/i })
    await submitButton.click()

    // Should show error about needing to sign in
    await expect(page.getByText(/Please sign in to scan QR codes/i)).toBeVisible({
      timeout: 3000,
    })
  })

  test('disables submit button when input is empty', async ({ page }) => {
    await expect(page.getByText('Scan QR Code')).toBeVisible()

    const submitButton = page.getByRole('button', { name: /Redeem Code/i })
    
    // Button should be disabled when input is empty
    await expect(submitButton).toBeDisabled()
  })

  test('shows loading state during scan', async ({ page }) => {
    await expect(page.getByText('Scan QR Code')).toBeVisible()

    const qrInput = page.getByPlaceholder('Enter code (e.g., BOTTLE-ABC123)')
    await qrInput.fill('BOTTLE-ABC123')

    const submitButton = page.getByRole('button', { name: /Redeem Code/i })
    
    // Click and verify loading state appears
    await submitButton.click()
    
    // Button should show "Scanning..." text
    await expect(page.getByText('Scanning...')).toBeVisible()
    
    // Input should be disabled during loading
    await expect(qrInput).toBeDisabled()
  })
})

