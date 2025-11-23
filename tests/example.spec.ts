import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');

    // Check that the page loads
    await expect(page).toHaveTitle(/Rihigo/);
  });

  test('should display hero section', async ({ page }) => {
    await page.goto('/');

    // Check for hero content
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should navigate to activities page', async ({ page }) => {
    await page.goto('/');

    // Click on "Explore Activities" button
    await page.click('text=Explore Activities');

    // Verify we're on the activities page
    await expect(page).toHaveURL(/\/activities/);
  });
});

test.describe('Authentication', () => {
  test('should navigate to sign in page', async ({ page }) => {
    await page.goto('/auth/sign-in');

    // Check for sign in elements
    await expect(page.locator('text=Sign in to your account')).toBeVisible();
    await expect(page.locator('button:has-text("Continue with Google")')).toBeVisible();
  });
});

test.describe('Admin Panel', () => {
  test('should redirect unauthenticated users to sign in', async ({ page }) => {
    await page.goto('/admin');

    // Should redirect to sign in with callback URL
    await expect(page).toHaveURL(/\/auth\/signin/);
    await expect(page).toHaveURL(/callbackUrl/);
  });
});
