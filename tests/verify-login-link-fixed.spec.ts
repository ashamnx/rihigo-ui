import { test, expect } from '@playwright/test';

test.describe('Homepage Login Link - Fixed', () => {
  test('should navigate to signin page from homepage', async ({ page }) => {
    console.log('\n=== Testing Login Link Navigation ===');

    // Load homepage
    await page.goto('http://localhost:5173/en-US/');
    await page.waitForLoadState('networkidle');
    console.log('1. Loaded homepage:', page.url());

    // Find login link
    const loginLink = page.locator('a:has-text("Login"), a:has-text("Sign In")').first();
    await expect(loginLink).toBeVisible();

    const href = await loginLink.getAttribute('href');
    console.log('2. Login link href:', href);

    // Click login link
    console.log('3. Clicking login link...');
    await loginLink.click();
    await page.waitForLoadState('networkidle');

    console.log('4. Navigated to:', page.url());

    // Verify we're on signin page
    expect(page.url()).toContain('/signin');
    expect(page.url()).toContain('/en-US');

    // Verify signin page loaded
    await expect(page.locator('h2:has-text("Sign in")')).toBeVisible();

    console.log('✅ Login link navigation works!');
  });

  test('should navigate to signup page from homepage', async ({ page }) => {
    await page.goto('http://localhost:5173/en-US/');
    await page.waitForLoadState('networkidle');

    // Find signup link
    const signupLink = page.locator('a:has-text("Sign Up"), button:has-text("Sign Up")').first();
    await expect(signupLink).toBeVisible();

    const href = await signupLink.getAttribute('href');
    console.log('Signup link href:', href);

    // Click signup link
    await signupLink.click();
    await page.waitForLoadState('networkidle');

    console.log('Navigated to:', page.url());

    // Verify we're on signup page
    expect(page.url()).toContain('/signup');
    expect(page.url()).toContain('/en-US');

    // Verify signup page loaded
    await expect(page.locator('h2:has-text("Create your account")')).toBeVisible();

    console.log('✅ Signup link navigation works!');
  });

  test('complete login flow from homepage to google signin', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    console.log('\n=== Complete Login Flow Test ===');

    // 1. Start at homepage
    await page.goto('http://localhost:5173/en-US/');
    await page.waitForLoadState('networkidle');
    console.log('1. Loaded homepage');

    // 2. Click login
    const loginLink = page.locator('a:has-text("Login")').first();
    await loginLink.click();
    await page.waitForLoadState('networkidle');
    console.log('2. Navigated to signin page:', page.url());

    // 3. Click Google signin
    const googleButton = page.locator('button:has-text("Continue with Google")').first();
    await expect(googleButton).toBeVisible();
    console.log('3. Found Google signin button');

    await googleButton.click();
    await page.waitForTimeout(1000);

    // 4. Check for errors
    const cryptoErrors = consoleErrors.filter(err => err.includes('crypto'));
    if (cryptoErrors.length > 0) {
      console.log('❌ Crypto errors:', cryptoErrors);
    } else {
      console.log('✅ No crypto errors!');
    }

    expect(cryptoErrors.length).toBe(0);
    console.log('4. Complete flow works without errors!');
  });
});
