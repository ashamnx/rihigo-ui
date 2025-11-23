import { test, expect } from '@playwright/test';

test.describe('Signup Page - Translation Verification', () => {
  test('should display translated text (not translation keys)', async ({ page }) => {
    await page.goto('http://localhost:5173/auth/signup/');
    await page.waitForLoadState('networkidle');

    // Check that we have actual translated text, not keys
    const heading = await page.locator('h2').first().textContent();
    console.log('Main heading:', heading);

    // Should NOT see translation keys
    expect(heading).not.toContain('auth.signUp');

    // Should see actual English text
    expect(heading).toContain('Create your account');

    // Check benefits section
    const benefitsTitle = await page.locator('h3').first().textContent();
    console.log('Benefits title:', benefitsTitle);
    expect(benefitsTitle).toContain('Why join Rihigo?');
    expect(benefitsTitle).not.toContain('auth.signUp');

    // Check buttons
    const googleButton = await page.locator('button:has-text("Continue with Google")').first();
    await expect(googleButton).toBeVisible();

    const facebookButton = await page.locator('button:has-text("Continue with Facebook")').first();
    await expect(facebookButton).toBeVisible();

    const createAccountButton = await page.locator('button:has-text("Create account")');
    await expect(createAccountButton).toBeVisible();

    // Take a screenshot for verification
    await page.screenshot({ path: 'signup-page-fixed.png', fullPage: true });

    console.log('✅ All translations are working correctly!');
  });

  test('should display benefits list', async ({ page }) => {
    await page.goto('http://localhost:5173/auth/signup/');
    await page.waitForLoadState('networkidle');

    // Check all 4 benefits are visible with translated text
    const benefits = await page.locator('.bg-blue-50 li').allTextContents();
    console.log('Benefits:', benefits);

    expect(benefits.length).toBe(4);
    expect(benefits[0]).toContain('Book exclusive experiences');
    expect(benefits[1]).toContain('Manage your bookings easily');
    expect(benefits[2]).toContain('Get personalized recommendations');
    expect(benefits[3]).toContain('Access member-only deals');
  });

  test('should have working sign in link', async ({ page }) => {
    await page.goto('http://localhost:5173/auth/signup/');
    await page.waitForLoadState('networkidle');

    // Check for "Already have an account?" text
    const footer = await page.locator('.text-center .text-sm.text-gray-600').first().textContent();
    expect(footer).toContain('Already have an account?');

    // Check sign in link
    const signInLink = await page.locator('a:has-text("Sign in")');
    await expect(signInLink).toBeVisible();
  });
});
