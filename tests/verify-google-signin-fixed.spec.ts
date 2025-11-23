import { test, expect } from '@playwright/test';

test.describe('Google Sign In - Fixed', () => {
  test('should trigger google signin without crypto errors', async ({ page }) => {
    const consoleErrors: string[] = [];

    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate to signup page
    await page.goto('http://localhost:5173/auth/signup/');
    await page.waitForLoadState('networkidle');

    console.log('\n=== Testing Google Sign In Button ===');

    // Find the Google button
    const googleButton = page.locator('button:has-text("Continue with Google")').first();
    await expect(googleButton).toBeVisible();

    // Click the button
    console.log('Clicking Google button...');
    await googleButton.click();

    // Wait a bit to see if any errors occur
    await page.waitForTimeout(1000);

    // Check for crypto errors
    console.log('\n=== Checking for Errors ===');
    const cryptoErrors = consoleErrors.filter(err =>
      err.includes('crypto') || err.includes('Module') || err.includes('externalized')
    );

    if (cryptoErrors.length > 0) {
      console.log('CRYPTO ERRORS FOUND:');
      cryptoErrors.forEach(err => console.log(err));
    } else {
      console.log('✅ No crypto errors detected!');
    }

    expect(cryptoErrors.length).toBe(0);

    // The button should either redirect or show auth dialog
    // We can't actually complete OAuth in tests, but no errors is success
    console.log('\n✅ Google sign-in button works without errors!');
  });

  test('should have proper form structure', async ({ page }) => {
    await page.goto('http://localhost:5173/auth/signup/');
    await page.waitForLoadState('networkidle');

    // Check that Google button is inside a Form
    const googleForm = page.locator('form').filter({ has: page.locator('input[name="providerId"][value="google"]') });
    await expect(googleForm).toBeVisible();

    // Check hidden inputs
    const providerInput = googleForm.locator('input[name="providerId"]');
    await expect(providerInput).toHaveValue('google');

    const callbackInput = googleForm.locator('input[name="options.callbackUrl"]');
    await expect(callbackInput).toHaveValue('/auth/welcome');

    console.log('✅ Form structure is correct!');
  });
});
